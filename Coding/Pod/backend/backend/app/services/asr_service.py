"""
ASR 转录服务模块

支持豆包 ASR（极速版 + 标准版）和阿里云 Qwen ASR
提供词级时间戳的转录结果
"""

import asyncio
import base64
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Literal
import httpx
from pydantic import BaseModel

from app.config.asr_config import asr_config, get_doubao_config, get_qwen_config


# ==================== 数据模型 ====================

class TranscriptWord(BaseModel):
    """词级别的转录结果"""
    text: str
    start: int  # 毫秒
    end: int    # 毫秒
    speaker: str = "Speaker 0"  # 默认说话人


class TranscriptResult(BaseModel):
    """完整的转录结果"""
    words: List[TranscriptWord]
    total_duration: int  # 毫秒
    asr_engine: Literal["doubao", "qwen"]
    word_count: int
    created_at: str


class ASRTask(BaseModel):
    """ASR 转录任务"""
    task_id: str
    episode_id: str
    audio_url: str
    engine: Literal["doubao", "qwen"]
    status: Literal["pending", "processing", "completed", "failed"]
    progress: int = 0
    result: Optional[TranscriptResult] = None
    error: Optional[str] = None
    created_at: str
    updated_at: str


# ==================== 豆包 ASR 客户端（极速版）====================

class DoubaoASRFlashClient:
    """豆包 ASR 极速版客户端"""

    def __init__(self):
        config = get_doubao_config()
        self.app_id = config["app_id"]
        self.access_token = config["access_token"]
        self.timeout = config["flash_timeout"]
        self.retries = config["flash_retries"]
        self.retry_delay = config["flash_retry_delay"]
        self.hotwords = config["hotwords"]
        self.base_url = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash"

    def _build_headers(self) -> Dict[str, str]:
        """构建请求头"""
        return {
            "X-Api-App-Key": self.app_id,
            "X-Api-Access-Key": self.access_token,
            "X-Api-Resource-Id": "volc.bigasr.auc_turbo",
            "X-Api-Request-Id": str(uuid.uuid4()),
            "X-Api-Sequence": "-1",
        }

    def _build_request_body(self, audio_data: bytes) -> Dict[str, Any]:
        """构建请求体"""
        audio_base64 = base64.b64encode(audio_data).decode("utf-8")

        request_obj = {"model_name": "bigmodel"}

        if self.hotwords:
            hotwords_json = [{"word": w} for w in self.hotwords]
            context = json.dumps({"hotwords": hotwords_json})
            request_obj["corpus"] = {"context": context}

        return {
            "user": {"uid": self.app_id},
            "audio": {"data": audio_base64},
            "request": request_obj
        }

    async def transcribe(self, audio_data: bytes) -> TranscriptResult:
        """
        转录音频数据

        Args:
            audio_data: 音频文件的二进制数据

        Returns:
            TranscriptResult: 转录结果
        """
        headers = self._build_headers()
        request_body = self._build_request_body(audio_data)

        last_error = None

        # 重试循环
        for attempt in range(self.retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        self.base_url,
                        headers=headers,
                        json=request_body
                    )

                    # 检查响应头状态码
                    status_code = response.headers.get("X-Api-Status-Code", "")
                    api_message = response.headers.get("X-Api-Message", "")

                    if status_code != "20000000":
                        raise ValueError(
                            f"豆包 ASR 失败: code={status_code}, message={api_message}"
                        )

                    # 解析响应体
                    result_data = response.json()

                    # 提取词级时间戳
                    words = []
                    for utt in result_data.get("result", {}).get("utterances", []):
                        for w in utt.get("words", []):
                            words.append(
                                TranscriptWord(
                                    text=w["text"],
                                    start=w["start_time"],
                                    end=w["end_time"]
                                )
                            )

                    return TranscriptResult(
                        words=words,
                        total_duration=result_data["audio_info"]["duration"],
                        asr_engine="doubao",
                        word_count=len(words),
                        created_at=datetime.utcnow().isoformat()
                    )

            except Exception as e:
                last_error = e
                if attempt < self.retries:
                    await asyncio.sleep(self.retry_delay)

        raise last_error or Exception("豆包 ASR 转录失败")


# ==================== 豆包 ASR 客户端（标准版）====================

class DoubaoASRStandardClient:
    """豆包 ASR 标准版客户端（用于 > 2小时的长音频）"""

    def __init__(self):
        config = get_doubao_config()
        self.app_id = config["app_id"]
        self.access_token = config["access_token"]
        self.hotwords = config["hotwords"]
        self.poll_interval = config["standard_poll_interval"]
        self.max_poll_time = config["standard_max_poll_time"]
        self.submit_url = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/submit"
        self.query_url = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/query"

    async def transcribe(self, audio_url: str, format: str = "mp3") -> TranscriptResult:
        """
        提交并轮询查询转录结果

        Args:
            audio_url: 音频文件的公网 URL
            format: 音频格式

        Returns:
            TranscriptResult: 转录结果
        """
        # 1. 提交任务
        task_id = str(uuid.uuid4())
        headers = self._build_headers(task_id)

        request_obj = {"model_name": "bigmodel"}
        if self.hotwords:
            hotwords_json = [{"word": w} for w in self.hotwords]
            context = json.dumps({"hotwords": hotwords_json})
            request_obj["corpus"] = {"context": context}

        request_body = {
            "user": {"uid": self.app_id},
            "audio": {"url": audio_url, "format": format},
            "request": request_obj
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Submit
            response = await client.post(self.submit_url, headers=headers, json=request_body)
            if response.headers.get("X-Api-Status-Code") != "20000000":
                raise ValueError("提交任务失败")

            # 2. 轮询查询
            start_time = asyncio.get_event_loop().time()

            while True:
                elapsed = asyncio.get_event_loop().time() - start_time
                if elapsed > self.max_poll_time:
                    raise TimeoutError(f"轮询超时（{self.max_poll_time}秒）")

                # Query
                response = await client.post(self.query_url, headers=headers, json={})
                status_code = response.headers.get("X-Api-Status-Code", "")

                if status_code == "20000000":  # 成功
                    result_data = response.json()

                    # 解析结果
                    words = []
                    for utt in result_data.get("result", {}).get("utterances", []):
                        for w in utt.get("words", []):
                            words.append(
                                TranscriptWord(
                                    text=w["text"],
                                    start=w["start_time"],
                                    end=w["end_time"]
                                )
                            )

                    return TranscriptResult(
                        words=words,
                        total_duration=result_data["audio_info"]["duration"],
                        asr_engine="doubao",
                        word_count=len(words),
                        created_at=datetime.utcnow().isoformat()
                    )

                elif status_code in ["20000001", "20000002"]:  # 处理中
                    await asyncio.sleep(self.poll_interval)
                else:
                    raise ValueError(f"查询失败: {status_code}")


# ==================== ASR 服务管理器 ====================

class ASRService:
    """ASR 服务管理器"""

    def __init__(self):
        self.tasks: Dict[str, ASRTask] = {}
        self.flash_client = DoubaoASRFlashClient()
        self.standard_client = DoubaoASRStandardClient()

    async def create_task(
        self,
        episode_id: str,
        audio_url: str,
        engine: Literal["doubao", "qwen"] = "doubao",
        duration_seconds: Optional[int] = None
    ) -> ASRTask:
        """
        创建 ASR 转录任务

        Args:
            episode_id: 节目 ID
            audio_url: 音频 URL
            engine: ASR 引擎
            duration_seconds: 音频时长（秒），用于判断使用极速版还是标准版

        Returns:
            ASRTask: 任务对象
        """
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        now = datetime.utcnow().isoformat()

        task = ASRTask(
            task_id=task_id,
            episode_id=episode_id,
            audio_url=audio_url,
            engine=engine,
            status="pending",
            created_at=now,
            updated_at=now
        )

        self.tasks[task_id] = task
        return task

    async def start_task(self, task_id: str, audio_data: Optional[bytes] = None) -> None:
        """
        启动转录任务（后台执行）

        Args:
            task_id: 任务 ID
            audio_data: 音频二进制数据（极速版）
        """
        task = self.tasks.get(task_id)
        if not task:
            raise ValueError(f"任务不存在: {task_id}")

        task.status = "processing"
        task.updated_at = datetime.utcnow().isoformat()

        try:
            if audio_data:
                # 使用极速版
                result = await self.flash_client.transcribe(audio_data)
            else:
                # TODO: 使用标准版（需要先上传到 OSS）
                raise NotImplementedError("标准版需要 OSS 支持")

            task.result = result
            task.status = "completed"
            task.progress = 100

        except Exception as e:
            task.status = "failed"
            task.error = str(e)

        task.updated_at = datetime.utcnow().isoformat()

    def get_task(self, task_id: str) -> Optional[ASRTask]:
        """获取任务状态"""
        return self.tasks.get(task_id)

    async def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """
        获取任务状态（API 格式）

        Args:
            task_id: 任务 ID

        Returns:
            任务状态字典
        """
        task = self.get_task(task_id)
        if not task:
            return {"error": "TASK_NOT_FOUND", "message": "任务不存在"}

        response = {
            "task_id": task.task_id,
            "status": task.status,
            "progress": task.progress,
            "current_engine": task.engine
        }

        if task.result:
            response["result"] = {
                "words": [w.dict() for w in task.result.words],
                "total_duration": task.result.total_duration,
                "asr_engine": task.result.asr_engine,
                "word_count": task.result.word_count
            }

        if task.error:
            response["error"] = task.error

        return response


# ==================== 全局服务实例 ====================

asr_service = ASRService()
