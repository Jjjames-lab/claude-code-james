"""
阿里云 Qwen ASR 引擎实现

参考：PushToTalk qwen.rs
"""

import asyncio
import base64
from typing import List
from datetime import datetime
import httpx

from .base import ASREngine, EngineType, TranscriptResult, TranscriptWord, TranscriptUtterance


class QwenASREngine(ASREngine):
    """阿里云 Qwen ASR 引擎"""

    API_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
    MODEL = "qwen3-asr-flash"

    def __init__(
        self,
        api_key: str,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.api_key = api_key

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
                logger.error(f"[QwenASR] 第{attempt+1}次尝试失败: {type(e).__name__}: {str(e)}")
                if attempt < self.max_retries:
                    await asyncio.sleep(self.retry_delay)

        raise last_error

    async def _transcribe_once(self, audio_data: bytes) -> TranscriptResult:
        """单次转录请求"""
        # Base64 编码音频
        audio_base64 = base64.b64encode(audio_data).decode("utf-8")

        # 词库用顿号分隔
        corpus_text = "、".join(self.hotwords) if self.hotwords else ""

        request_body = {
            "model": self.MODEL,
            "input": {
                "messages": [
                    {
                        "role": "system",
                        "content": [{"text": corpus_text}] if corpus_text else []
                    },
                    {
                        "role": "user",
                        "content": [{"audio": f"data:audio/wav;base64,{audio_base64}"}]
                    }
                ]
            },
            "parameters": {
                "result_format": "message",
                "enable_itn": False,
                "disfluency_removal": True,
                "language": "zh"
            }
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                self.API_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json=request_body
            )

            if not response.is_success:
                error_text = response.text
                raise ValueError(
                    f"Qwen API 失败 ({response.status_code}): {error_text}"
                )

            result_data = response.json()

            # 解析文本
            content_list = result_data["output"]["choices"][0]["message"]["content"]
            text = content_list[0]["text"] if content_list else ""

            # Qwen 不返回词级时间戳，生成简单的词级结构
            words = [TranscriptWord(
                text=text,
                start_time=0,
                end_time=0,  # Qwen 不支持
                confidence=1.0,
                speaker="unknown"
            )]

            # 创建单个 utterance（Qwen 不支持分段）
            utterances = [TranscriptUtterance(
                text=text,
                start_time=0,
                end_time=0,
                words=words,
                speaker="unknown"
            )]

            # 检测词库回显（千问特有问题）
            if corpus_text and text == corpus_text:
                raise ValueError("录音无效或为空（检测到词库回显）")

            return TranscriptResult(
                text=text,
                duration=0,  # Qwen 响应不包含时长
                words=words,
                utterances=utterances,
                engine=EngineType.QWEN,
                log_id="",
                timestamp=datetime.now()
            )

    def get_engine_name(self) -> str:
        return "阿里云 Qwen ASR"

    def get_engine_type(self) -> EngineType:
        return EngineType.QWEN
