"""
GLM LLM 服务
用于逐字稿标点恢复和ASR错误纠正
"""

import asyncio
import httpx
import logging
import os
from typing import List, Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class RateLimitError(Exception):
    """速率限制错误"""
    pass


class PolishingRequest(BaseModel):
    """逐字稿处理请求"""
    raw_text: str
    topic: Optional[str] = None  # 播客主题，用于上下文理解
    keywords: Optional[List[str]] = None  # 关键词列表


class ConservativeConcurrencyProcessor:
    """保守渐进式并发处理器

    从保守值（1）开始，逐步提升并发数，自动适应 API 限制
    """

    def __init__(self):
        # 从环境变量读取配置，提供默认值（优化：支持更高并发）
        # GLM-4-Flash免费用户支持5个并发，付费用户支持更多
        self.safe_concurrent = int(os.getenv('GLM_SAFE_CONCURRENT', '5'))  # 初始并发数：5
        self.max_concurrent = int(os.getenv('GLM_MAX_CONCURRENT', '5'))   # 最大并发数：5
        self.success_count = 0    # 连续成功计数
        self.total_batches = 0    # 总批次数
        self.downgrade_count = 0  # 降级次数

    async def process_chunks_conservative(
        self,
        chunks: List[str],
        process_func,
        topic: Optional[str],
        keywords: Optional[List[str]]
    ) -> List[str]:
        """保守渐进式处理文本块

        Args:
            chunks: 文本块列表
            process_func: 处理单个块的函数
            topic: 播客主题
            keywords: 关键词

        Returns:
            处理后的文本块列表
        """
        results = []
        total_chunks = len(chunks)
        self.total_batches = (total_chunks + self.safe_concurrent - 1) // self.safe_concurrent

        logger.info(
            f"开始保守渐进式并发处理: {total_chunks} 个块, "
            f"初始并发数={self.safe_concurrent}, 最大并发数={self.max_concurrent}"
        )

        i = 0
        while i < total_chunks:
            # 当前批次大小
            batch_size = min(self.safe_concurrent, total_chunks - i)
            batch = chunks[i:i + batch_size]

            try:
                # 尝试并发处理当前批次
                logger.info(
                    f"处理批次 {len(results) + self.total_batches * (i // total_chunks) + 1}/{self.total_batches} "
                    f"({self.safe_concurrent}个并发)"
                )

                batch_results = await self._process_batch_concurrent(
                    batch, process_func, topic, keywords
                )
                results.extend(batch_results)

                # 成功后增加连续成功计数
                self.success_count += 1

                # 连续成功 3 次后，尝试提升并发数
                if self.success_count >= 3 and self.safe_concurrent < self.max_concurrent:
                    old_concurrent = self.safe_concurrent
                    self.safe_concurrent = min(self.safe_concurrent + 1, self.max_concurrent)
                    self.success_count = 0
                    logger.info(f"稳定运行，提升并发数: {old_concurrent} → {self.safe_concurrent}")

                # 批次间等待（如果不是最后一批）
                i += batch_size
                if i < total_chunks:
                    # 优化：减少等待时间，GLM-4-Flash支持5并发
                    await asyncio.sleep(2)  # 减少到 2 秒

            except (RateLimitError, httpx.RemoteProtocolError) as e:
                # 触发速率限制或连接错误，降低并发数
                old_concurrent = self.safe_concurrent
                self.safe_concurrent = max(1, self.safe_concurrent - 1)
                self.success_count = 0
                self.downgrade_count += 1

                logger.warning(
                    f"触发限制 ({type(e).__name__})，降低并发数: "
                    f"{old_concurrent} → {self.safe_concurrent}"
                )

                # 等待后重试当前批次（优化：减少等待时间）
                await asyncio.sleep(4)  # 减少到 4 秒

                # 用降低后的并发数重新处理当前批次
                batch_size = min(self.safe_concurrent, len(batch))
                batch_results = await self._process_batch_concurrent(
                    batch[:batch_size], process_func, topic, keywords
                )
                results.extend(batch_results)
                i += batch_size

        logger.info(
            f"保守渐进式处理完成: 总共 {len(results)} 个块, "
            f"最终并发数={self.safe_concurrent}, 降级次数={self.downgrade_count}"
        )

        return results

    async def _process_batch_concurrent(
        self,
        batch: List[str],
        process_func,
        topic: Optional[str],
        keywords: Optional[List[str]]
    ) -> List[str]:
        """并发处理一个批次"""
        tasks = [
            process_func(chunk, topic, keywords)
            for chunk in batch
        ]
        return await asyncio.gather(*tasks)


class GLMClient:
    """智谱 GLM LLM 客户端"""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        model: str = "glm-4-flash",
        timeout: float = 30.0
    ):
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
        self.timeout = timeout

    async def polish_transcript(
        self,
        raw_text: str,
        topic: Optional[str] = None,
        keywords: Optional[List[str]] = None
    ) -> str:
        """
        处理逐字稿：添加标点、分段、纠正ASR错误

        Args:
            raw_text: ASR原始文本（无标点）
            topic: 播客主题（用于上下文理解）
            keywords: 关键词列表

        Returns:
            处理后的文本（带标点、分段）
        """
        if not raw_text or not raw_text.strip():
            return ""

        # GLM API 请求大小限制约 300-400 字符
        # 使用分块处理，每块 250 字符以确保安全
        MAX_CHUNK_SIZE = 250

        if len(raw_text) <= MAX_CHUNK_SIZE:
            # 小文本直接处理
            return await self._process_single_chunk(raw_text, topic, keywords)
        else:
            # 大文本分块处理
            return await self._process_chunks(raw_text, topic, keywords, MAX_CHUNK_SIZE)

    async def _process_single_chunk(
        self,
        text: str,
        topic: Optional[str],
        keywords: Optional[List[str]]
    ) -> str:
        """处理单个文本块"""
        system_prompt = self._build_system_prompt(topic, keywords)
        user_message = self._build_user_message(text)

        try:
            timeout = httpx.Timeout(60.0, connect=10.0)
            async with httpx.AsyncClient(timeout=timeout, proxy=None, trust_env=False, verify=False) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_message}
                        ],
                        "temperature": 0.3,
                        "top_p": 0.7,
                    }
                )

                response.raise_for_status()
                result = response.json()
                polished_text = result["choices"][0]["message"]["content"]
                logger.info(f"LLM处理成功，原文: {len(text)} 字符, 处理后: {len(polished_text)} 字符")

                return polished_text.strip()

        except httpx.HTTPStatusError as e:
            logger.error(f"GLM API调用失败: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"LLM处理失败: {type(e).__name__}: {e}")
            raise

    async def _process_chunks(
        self,
        raw_text: str,
        topic: Optional[str],
        keywords: Optional[List[str]],
        chunk_size: int
    ) -> str:
        """分块处理大文本（使用保守渐进式并发）"""
        # 分割文本
        chunks = self._split_text(raw_text, chunk_size)
        logger.info(f"文本过长 ({len(raw_text)} 字符)，分成 {len(chunks)} 块处理")

        # 使用保守渐进式并发处理器
        processor = ConservativeConcurrencyProcessor()

        # 包装处理函数以捕获速率限制错误
        async def process_with_error_handling(chunk: str, topic: Optional[str], keywords: Optional[List[str]]) -> str:
            try:
                return await self._process_single_chunk(chunk, topic, keywords)
            except httpx.RemoteProtocolError as e:
                # 将连接错误转换为速率限制错误
                raise RateLimitError(f"连接被拒绝: {e}")

        # 并发处理所有块
        processed_chunks = await processor.process_chunks_conservative(
            chunks,
            process_with_error_handling,
            topic,
            keywords
        )

        # 合并结果
        merged_text = "\n\n".join(processed_chunks)
        logger.info(f"所有块处理完成，合并后总长度: {len(merged_text)}")

        return merged_text

    def _split_text(self, text: str, chunk_size: int) -> List[str]:
        """
        智能分割文本，尽量在语义边界分割

        Args:
            text: 待分割文本
            chunk_size: 目标块大小

        Returns:
            文本块列表
        """
        chunks = []
        current_chunk = ""
        current_length = 0

        # 按字符遍历
        for char in text:
            current_chunk += char
            current_length += 1

            # 达到目标大小，尝试在合适位置分割
            if current_length >= chunk_size:
                # 寻找最近的分割点（标点符号后的位置）
                split_pos = self._find_split_position(current_chunk)
                chunks.append(current_chunk[:split_pos].strip())
                current_chunk = current_chunk[split_pos:].strip()
                current_length = len(current_chunk)

        # 添加剩余部分
        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks

    def _find_split_position(self, chunk: str) -> int:
        """
        在文本块中找到最佳分割位置

        优先级：句号 > 分号 > 逗号 > 空格 > 任意位置
        """
        # 从后往前搜索
        for i in range(len(chunk) - 1, max(0, len(chunk) - 50), -1):
            char = chunk[i]

            # 优先在句号后分割
            if char == '。' or char == '！' or char == '？':
                return i + 1

            # 其次在分号、逗号后分割
            if char == '；' or char == '，':
                return i + 1

            # 最后在空格后分割
            if char == ' ' or char == '\t':
                return i + 1

        # 如果没找到合适位置，直接在 chunk_size 处分割
        return len(chunk)

    def _build_system_prompt(
        self,
        topic: Optional[str],
        keywords: Optional[List[str]]
    ) -> str:
        """构建系统提示词"""

        # 简化的提示词，避免token过多
        base_prompt = """你是播客逐字稿制作助手。任务：1)添加标点符号 2)合理分段 3)纠正同音词和专有名词错误。保留所有口语词，不改写原意。"""

        # 添加上下文信息
        if topic or keywords:
            context = []
            if topic:
                context.append(f"主题：{topic}")
            if keywords:
                context.append(f"关键词：{', '.join(keywords)}")
            base_prompt += " " + " ".join(context)

        return base_prompt

    def _build_user_message(self, raw_text: str) -> str:
        """构建用户消息"""
        return f"待处理文本：{raw_text}"

    async def generate(self, prompt: str) -> str:
        """
        通用生成方法（用于章节生成等）

        Args:
            prompt: 完整的提示词

        Returns:
            LLM生成的文本
        """
        try:
            timeout = httpx.Timeout(60.0, connect=10.0)
            async with httpx.AsyncClient(timeout=timeout, proxy=None, trust_env=False, verify=False) as client:
                response = await client.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3,
                        "top_p": 0.7,
                    }
                )

                response.raise_for_status()
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                logger.info(f"GLM生成成功，返回内容长度: {len(content)}")

                return content

        except httpx.HTTPStatusError as e:
            logger.error(f"GLM API调用失败: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"GLM生成失败: {type(e).__name__}: {e}")
            raise

    def get_model_info(self) -> dict:
        """获取模型信息"""
        return {
            "model": self.model,
            "base_url": self.base_url,
            "timeout": self.timeout
        }
