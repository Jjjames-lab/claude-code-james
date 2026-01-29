"""
豆包 ASR 引擎实现（极速版）

参考：_shared/07_doubao_asr_implementation.md
"""

import asyncio
import base64
import json
import uuid
from typing import List
from datetime import datetime
import httpx
import logging

from .base import ASREngine, EngineType, TranscriptResult, TranscriptWord, TranscriptUtterance

logger = logging.getLogger(__name__)


class DoubaoASREngine(ASREngine):
    """豆包 ASR 引擎（极速版）"""

    API_URL = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash"
    RESOURCE_ID = "volc.bigasr.auc_turbo"

    def __init__(
        self,
        app_id: str,
        access_token: str,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.app_id = app_id
        self.access_token = access_token

    async def transcribe(self, audio_data: bytes) -> TranscriptResult:
        """
        转录音频（带重试）

        Args:
            audio_data: 音频二进制数据

        Returns:
            TranscriptResult: 转录结果
        """
        last_error = None

        for attempt in range(self.max_retries + 1):
            try:
                return await self._transcribe_once(audio_data)
            except (httpx.TimeoutException, httpx.HTTPError, ValueError) as e:
                last_error = e
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"[豆包ASR] 第{attempt+1}次尝试失败: {type(e).__name__}: {str(e)}")
                if attempt < self.max_retries:
                    await asyncio.sleep(self.retry_delay)

        raise last_error

    async def _transcribe_once(self, audio_data: bytes) -> TranscriptResult:
        """单次转录请求"""
        # Base64 编码音频
        audio_base64 = base64.b64encode(audio_data).decode("utf-8")

        # 构建请求对象
        request_obj = {
            "model_name": "bigmodel",
            "model_version": "400",          # 400模型性能略有提升，且ITN有较大优化
            "enable_punc": True,             # 启用标点符号
            "show_utterances": True,         # 启用句子级输出（带时间戳）
            "enable_ddc": True,              # 语义顺滑：删除语气词、重复内容，提升可读性
            "enable_itn": True,              # 文本规范化（默认已是true，显式声明）
            "enable_speaker_info": True,     # 说话人分离（已开启）
        }

        if self.hotwords:
            hotwords_json = [{"word": w} for w in self.hotwords]
            context = json.dumps({"hotwords": hotwords_json})
            request_obj["corpus"] = {"context": context}

        request_body = {
            "user": {"uid": self.app_id},
            "audio": {"data": audio_base64},
            "request": request_obj
        }

        # 发送请求
        request_id = str(uuid.uuid4())

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                self.API_URL,
                headers={
                    "X-Api-App-Key": self.app_id,
                    "X-Api-Access-Key": self.access_token,
                    "X-Api-Resource-Id": self.RESOURCE_ID,
                    "X-Api-Request-Id": request_id,
                    "X-Api-Sequence": "-1",
                },
                json=request_body
            )

            # 检查响应头状态码
            status_code = response.headers.get("X-Api-Status-Code", "")
            api_message = response.headers.get("X-Api-Message", "")
            log_id = response.headers.get("X-Tt-Logid", "")

            if status_code != "20000000":
                raise ValueError(
                    f"豆包 ASR 失败: code={status_code}, message={api_message}"
                )

            # 解析响应体
            result_data = response.json()

            # 调试日志：验证 API 参数生效
            utterances_raw = result_data.get("result", {}).get("utterances", [])
            logger.info(f"[豆包ASR] 收到 utterances 数量: {len(utterances_raw)}")

            # 统计 utterances 中的句子数
            total_sentences = 0
            for i, utt in enumerate(utterances_raw[:5]):  # 只打印前5条
                text = utt.get("text", "")
                sentence_count = text.count('。') + text.count('！') + text.count('？') + text.count('，')
                total_sentences += sentence_count
                logger.info(f"[豆包ASR] utterances[{i}]: 文本长度={len(text)}, 标点数={sentence_count}, "
                           f"时间=[{utt.get('start_time')}-{utt.get('end_time')}]ms, "
                           f"文本预览='{text[:50]}...'")

            if len(utterances_raw) > 5:
                logger.info(f"[豆包ASR] ... 还有 {len(utterances_raw) - 5} 条 utterances")

            logger.info(f"[豆包ASR] 统计: utterances数={len(utterances_raw)}, 估计句子数约={total_sentences}")

            # 提取句子级分段和词级时间戳
            utterances = []
            words = []

            for utt in result_data.get("result", {}).get("utterances", []):
                # 提取句子中的词
                utt_words = []
                for w in utt.get("words", []):
                    word = TranscriptWord(
                        text=w["text"],
                        start_time=w["start_time"],
                        end_time=w["end_time"],
                        confidence=w.get("confidence", 100) / 100.0,
                        speaker=utt.get("speaker", "unknown")  # 从句子提取说话人
                    )
                    utt_words.append(word)
                    words.append(word)

                # 创建句子对象
                utterances.append(TranscriptUtterance(
                    text=utt["text"],
                    start_time=utt["start_time"],
                    end_time=utt["end_time"],
                    words=utt_words,
                    speaker=utt.get("speaker", "unknown")
                ))

            return TranscriptResult(
                text=result_data["result"]["text"],
                duration=result_data["audio_info"]["duration"],
                words=words,
                utterances=utterances,
                engine=EngineType.DOUBAO,
                log_id=log_id,
                timestamp=datetime.now()
            )

    def get_engine_name(self) -> str:
        return "豆包 ASR"

    def get_engine_type(self) -> EngineType:
        return EngineType.DOUBAO
