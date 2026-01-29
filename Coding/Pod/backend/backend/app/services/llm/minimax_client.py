"""
MiniMax LLM 服务
用于逐字稿标点恢复和ASR错误纠正
使用 OpenAI 兼容 API
"""

import asyncio
import logging
import os
from typing import List, Optional
from pydantic import BaseModel

try:
    from openai import AsyncOpenAI
except ImportError:
    raise ImportError("请先安装 openai 库: pip install openai")

logger = logging.getLogger(__name__)


class PolishingRequest(BaseModel):
    """逐字稿处理请求"""
    raw_text: str
    topic: Optional[str] = None  # 播客主题，用于上下文理解
    keywords: Optional[List[str]] = None  # 关键词列表


class MiniMaxClient:
    """MiniMax LLM 客户端（基于 OpenAI SDK）"""

    def __init__(
        self,
        api_key: str = None,
        base_url: str = "https://api.minimaxi.com/v1",
        model: str = "MiniMax-M2.1"
    ):
        # 从参数或环境变量读取 API key
        self.api_key = api_key or os.getenv("MINIMAX_API_KEY")
        if not self.api_key:
            raise ValueError("MINIMAX_API_KEY 未配置")

        self.base_url = base_url
        self.model = model

        # 创建异步客户端
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )

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

        # MiniMax API 请求大小限制较大（128k 上下文）
        # 但为了保守起见，仍使用分块处理
        MAX_CHUNK_SIZE = 4000  # MiniMax 可以处理更大的块

        if len(raw_text) <= MAX_CHUNK_SIZE:
            # 小文本直接处理
            return await self._process_single_chunk(raw_text, topic, keywords)
        else:
            # 大文本分块处理
            return await self._process_chunks(raw_text, topic, keywords, MAX_CHUNK_SIZE)

    def _filter_llm_output(self, text: str) -> str:
        """过滤 LLM 输出中的分析性内容，只保留逐字稿"""
        import re

        # 首先尝试提取 <transcript> 标签内的内容
        transcript_match = re.search(r'<transcript>(.*?)</transcript>', text, re.DOTALL)
        if transcript_match:
            return transcript_match.group(1).strip()

        # 如果没有找到标签，使用关键词过滤
        lines = text.split('\n')
        filtered_lines = []
        skip_mode = False

        # 需要跳过的关键词（中英文）
        skip_keywords = [
            # 中文关键词
            '这是一段播客逐字稿',
            '需要我进行以下处理',
            '让我仔细',
            '原文中的问题',
            '需要纠正的地方',
            '我将按照要求',
            '我将按照',
            '处理时，我会注意',
            '确保语言流畅',
            '同时保留',
            '具体的修改和分段',
            # 英文关键词
            'This is a podcast transcript',
            'needs to be cleaned up',
            'Let me go through',
            'Let me process',
            'Important rules',
            'keep all colloquial',
            'Only output',
            'no explanations',
            'Start directly',
            'should be',
            'probably',
        ]

        # 检测列表格式（如 "1. xxx" 或 "• xxx"）
        list_pattern = re.compile(r'^\s*[\d\-\•]+\s+')

        for line in lines:
            line_stripped = line.strip()

            # 空行保留（用于分段）
            if not line_stripped:
                filtered_lines.append(line)
                continue

            # 检查是否包含跳过关键词（不区分大小写）
            line_lower = line_stripped.lower()
            if any(keyword.lower() in line_lower for keyword in skip_keywords):
                skip_mode = True
                continue

            # 检查是否是列表格式（通常是分析内容）
            if list_pattern.match(line_stripped):
                # 检查列表项是否包含分析性词汇（中英文）
                analysis_words = [
                    '应该是', '需要确认', '可能是指', '网络用语', '根据上下文', '这句',
                    'should be', 'probably', 'needs to be', 'might be', 'seems like'
                ]
                if any(word in line_lower for word in analysis_words):
                    skip_mode = True
                    continue

            # 如果不在跳过模式，或者这一行看起来像实际内容，则保留
            if not skip_mode or (len(line_stripped) > 50 and not list_pattern.match(line_stripped)):
                filtered_lines.append(line)
                skip_mode = False  # 重置跳过模式

        return '\n'.join(filtered_lines).strip()

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
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.3,
                top_p=0.7,
            )

            polished_text = response.choices[0].message.content

            # 后处理：过滤掉 LLM 的分析性内容
            polished_text = self._filter_llm_output(polished_text)

            logger.info(f"MiniMax处理成功，原文: {len(text)} 字符, 处理后: {len(polished_text)} 字符")

            return polished_text.strip()

        except Exception as e:
            logger.error(f"MiniMax API调用失败: {type(e).__name__}: {e}")
            raise

    async def _process_chunks(
        self,
        raw_text: str,
        topic: Optional[str],
        keywords: Optional[List[str]],
        chunk_size: int
    ) -> str:
        """分块处理大文本（使用保守渐进式并发）"""
        # 导入并发处理器
        from .glm_client import ConservativeConcurrencyProcessor

        # 分割文本
        chunks = self._split_text(raw_text, chunk_size)
        logger.info(f"文本过长 ({len(raw_text)} 字符)，分成 {len(chunks)} 块处理")

        # 使用保守渐进式并发处理器
        processor = ConservativeConcurrencyProcessor()

        # MiniMax 支持高并发，默认使用5个并发（可配置）
        processor.safe_concurrent = int(os.getenv('MINIMAX_SAFE_CONCURRENT', '5'))  # 默认5并发
        processor.max_concurrent = int(os.getenv('MINIMAX_MAX_CONCURRENT', '5'))    # 最大5并发

        # 并发处理所有块
        processed_chunks = await processor.process_chunks_conservative(
            chunks,
            self._process_single_chunk,
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

        # 使用 XML 标签格式，更明确地指示输出格式
        base_prompt = """你是播客逐字稿处理专家。直接输出处理后的逐字稿，格式：

<transcript>
[添加标点后的文本，合理分段]
</transcript>

严格要求：
1. **必须添加完整标点符号**：为每个句子添加逗号、句号、问号、感叹号等
2. **多句合并段落**：将 3-5 个相关句子合并为一个自然段落（绝对不要一句一段）
3. 纠正明显的语音识别错误（如同音词错误、专有名词错误）
4. 保持原始语义不变，不添加额外内容
5. 保留口语化表达和语气词

示例：
错误输入：今天天气很好我们去公园玩吧
正确输出：今天天气很好，我们去公园玩吧。

错误输入：这是第一句话 这是第二句话 这是第三句话
正确输出：这是第一句话。这是第二句话。这是第三句话。

错误输入：你好 欢迎收听今天的节目 我是主持人小王
正确输出：你好，欢迎收听今天的节目，我是主持人小王。"""

        # 添加上下文信息
        if topic or keywords:
            context = []
            if topic:
                context.append(f"主题：{topic}")
            if keywords:
                context.append(f"关键词：{', '.join(keywords)}")
            base_prompt += "\n\n" + " ".join(context)

        return base_prompt

    def _build_user_message(self, raw_text: str) -> str:
        """构建用户消息"""
        return f"<input>\n{raw_text}\n</input>"

    def get_model_info(self) -> dict:
        """获取模型信息"""
        return {
            "model": self.model,
            "base_url": self.base_url,
        }
