"""
ASR 引擎抽象基类和数据模型

定义统一的 ASR 引擎接口，支持多种 ASR 服务
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class EngineType(Enum):
    """ASR 引擎类型"""
    DOUBAO = "doubao"
    QWEN = "qwen"
    FUNASR = "funasr"
    SENSEVOICE = "sensevoice"


@dataclass
class TranscriptWord:
    """词级别转录结果"""
    text: str
    start_time: int  # 毫秒
    end_time: int    # 毫秒
    confidence: float = 1.0
    speaker: str = "unknown"  # 说话人标识

    def to_dict(self) -> dict:
        """转换为字典（前端使用start/end而不是start_time/end_time）"""
        return {
            "text": self.text,
            "start": self.start_time,  # 前端使用start
            "end": self.end_time,      # 前端使用end
            "speaker": self.speaker,   # 说话人
            "confidence": self.confidence
        }


@dataclass
class TranscriptUtterance:
    """句子级别转录结果（ASR 自动分段）"""
    text: str                      # 句子文本
    start_time: int                # 开始时间（毫秒）
    end_time: int                  # 结束时间（毫秒）
    words: List[TranscriptWord]    # 词级详情
    speaker: str = "unknown"       # 说话人标识

    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            "text": self.text,
            "start": self.start_time,
            "end": self.end_time,
            "words": [w.to_dict() for w in self.words],
            "speaker": self.speaker
        }


@dataclass
class TranscriptResult:
    """完整的转录结果"""
    text: str                          # 完整文本
    duration: int                      # 音频时长（毫秒）
    words: List[TranscriptWord]        # 词级时间戳
    utterances: List[TranscriptUtterance]  # 句子级分段（ASR 自动分段）
    engine: EngineType                 # 使用的引擎
    log_id: str                        # 请求日志 ID
    timestamp: datetime                # 转录时间

    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            "text": self.text,
            "duration": self.duration,
            "words": [w.to_dict() for w in self.words],
            "utterances": [u.to_dict() for u in self.utterances],
            "engine": self.engine.value,
            "log_id": self.log_id,
            "timestamp": self.timestamp.isoformat()
        }


class ASREngine(ABC):
    """
    ASR 引擎抽象基类

    所有 ASR 引擎必须实现此接口，确保统一调用方式
    """

    def __init__(
        self,
        timeout: float = 30.0,
        max_retries: int = 2,
        retry_delay: float = 0.5,
        hotwords: Optional[List[str]] = None
    ):
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.hotwords = hotwords or []

    @abstractmethod
    async def transcribe(self, audio_data: bytes) -> TranscriptResult:
        """
        转录音频数据

        Args:
            audio_data: 音频二进制数据

        Returns:
            TranscriptResult: 转录结果

        Raises:
            TimeoutError: 请求超时
            HTTPError: HTTP 错误
            ValueError: 响应解析失败
        """
        pass

    @abstractmethod
    def get_engine_name(self) -> str:
        """获取引擎名称"""
        pass

    @abstractmethod
    def get_engine_type(self) -> EngineType:
        """获取引擎类型"""
        pass

    def update_hotwords(self, hotwords: List[str]):
        """热更新词库"""
        self.hotwords = hotwords
