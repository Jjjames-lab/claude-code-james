"""
豆包 ASR 引擎实现（标准版）

标准版特点：
- API: submit + query 模式
- 资源 ID: volc.seedasr.auc
- 音频: 必须通过 URL 传递
- 适用: > 2小时的长音频
"""

import asyncio
import json
import uuid
from typing import Optional
from datetime import datetime
import httpx
import logging

from .base import ASREngine, EngineType, TranscriptResult, TranscriptWord, TranscriptUtterance

logger = logging.getLogger(__name__)


class DoubaoASRStandardEngine(ASREngine):
    """豆包 ASR 引擎（标准版）"""

    SUBMIT_URL = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/submit"
    QUERY_URL = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/query"
    RESOURCE_ID = "volc.bigasr.auc"  # 使用模型1.0（可能已开通）

    def __init__(
        self,
        app_id: str,
        access_token: str,
        poll_interval: float = 3.0,
        max_poll_time: float = 600.0,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.app_id = app_id
        self.access_token = access_token
        self.poll_interval = poll_interval
        self.max_poll_time = max_poll_time

    async def transcribe(self, audio_data: bytes) -> TranscriptResult:
        """
        转录音频（标准版：submit + query）

        Args:
            audio_data: 音频二进制数据（注意：标准版实际需要 URL，这里为兼容接口）

        Returns:
            TranscriptResult: 转录结果

        Raises:
            ValueError: 如果没有提供 audio_url
        """
        # 标准版需要音频 URL，暂时抛出错误
        raise ValueError(
            "豆包标准版需要音频 URL，不能直接使用二进制数据。\n"
            "请使用 transcribe_from_url() 方法，或先上传音频到对象存储。"
        )

    async def transcribe_from_url(
        self,
        audio_url: str,
        format: str = "mp3"
    ) -> TranscriptResult:
        """
        从 URL 转录音频（标准版专用）

        Args:
            audio_url: 音频文件的公网 URL
            format: 音频格式（mp3/wav/ogg）

        Returns:
            TranscriptResult: 转录结果
        """
        # 1. Submit - 提交任务
        task_id = await self._submit_task(audio_url, format)
        logger.info(f"[豆包ASR标准版] 任务已提交, task_id={task_id}")

        # 2. Query - 轮询查询结果
        start_time = asyncio.get_event_loop().time()

        while True:
            # 检查超时
            elapsed = asyncio.get_event_loop().time() - start_time
            if elapsed > self.max_poll_time:
                raise TimeoutError(f"轮询超时（{self.max_poll_time}秒）")

            # 查询结果
            result = await self._query_task(task_id)
            status_code = result["status_code"]

            # 判断状态
            if status_code == "20000000":  # 成功
                logger.info(f"[豆包ASR标准版] 转录完成, 耗时 {elapsed:.1f}秒")
                return self._parse_result(result["data"], task_id)

            elif status_code in ["20000001", "20000002"]:  # 处理中 / 队列中
                logger.info(f"[豆包ASR标准版] 处理中... ({elapsed:.1f}秒)")
                await asyncio.sleep(self.poll_interval)

            else:
                raise ValueError(f"未知状态码: {status_code}, message={result['message']}")

    async def _submit_task(self, audio_url: str, format: str) -> str:
        """提交转录任务"""
        request_id = str(uuid.uuid4())

        # 构建请求对象
        request_obj = {"model_name": "bigmodel"}

        if self.hotwords:
            hotwords_json = [{"word": w} for w in self.hotwords]
            context = json.dumps({"hotwords": hotwords_json})
            request_obj["corpus"] = {"context": context}

        request_body = {
            "user": {"uid": self.app_id},
            "audio": {
                "url": audio_url,
                "format": format
            },
            "request": request_obj
        }

        # 发送请求
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.SUBMIT_URL,
                headers={
                    "X-Api-App-Key": self.app_id,
                    "X-Api-Access-Key": self.access_token,
                    "X-Api-Resource-Id": self.RESOURCE_ID,
                    "X-Api-Request-Id": request_id,
                    "X-Api-Sequence": "-1",
                },
                json=request_body
            )

        status_code = response.headers.get("X-Api-Status-Code", "")
        api_message = response.headers.get("X-Api-Message", "")

        if status_code != "20000000":
            raise ValueError(
                f"豆包标准版提交失败: code={status_code}, message={api_message}"
            )

        return request_id

    async def _query_task(self, task_id: str) -> dict:
        """查询转录任务"""
        headers = {
            "X-Api-App-Key": self.app_id,
            "X-Api-Access-Key": self.access_token,
            "X-Api-Resource-Id": self.RESOURCE_ID,
            "X-Api-Request-Id": task_id,
            "X-Api-Sequence": "-1",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.QUERY_URL,
                headers=headers,
                json={}
            )

        status_code = response.headers.get("X-Api-Status-Code", "")
        api_message = response.headers.get("X-Api-Message", "")

        if status_code not in ["20000000", "20000001", "20000002"]:
            raise ValueError(
                f"豆包标准版查询失败: code={status_code}, message={api_message}"
            )

        result_data = response.json()
        return {
            "status_code": status_code,
            "message": api_message,
            "data": result_data
        }

    def _parse_result(self, result_data: dict, log_id: str) -> TranscriptResult:
        """解析转录结果"""
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
                    speaker=utt.get("speaker", "unknown")
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
        return "豆包 ASR 标准版"

    def get_engine_type(self) -> EngineType:
        return EngineType.DOUBAO
