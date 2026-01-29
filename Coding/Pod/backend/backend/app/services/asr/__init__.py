"""
多引擎 ASR 服务模块

支持豆包和阿里云 Qwen 双引擎，提供三种竞速策略
"""

from .base import ASREngine, EngineType, TranscriptWord, TranscriptResult
from .doubao_engine import DoubaoASREngine
from .qwen_engine import QwenASREngine
from .multi_engine_service import MultiEngineASRService
from .factory import ASREngineFactory


class ASRManager:
    """ASR 管理器包装器，支持延迟初始化"""

    def __init__(self):
        self._service: MultiEngineASRService = None

    def init_engines(self, doubao_key: str, doubao_secret: str,
                     qwen_key: str, qwen_secret: str):
        """初始化 ASR 引擎"""
        primary = DoubaoASREngine(app_id=doubao_key, access_token=doubao_secret)
        backup = QwenASREngine(api_key=qwen_key)
        self._service = MultiEngineASRService(
            primary_engine=primary,
            backup_engine=backup
        )

    @property
    def service(self) -> MultiEngineASRService:
        """获取 ASR 服务实例"""
        if self._service is None:
            raise RuntimeError("ASR service not initialized. Call init_engines() first.")
        return self._service


# 创建全局 ASR 管理器实例
asr_manager = ASRManager()

__all__ = [
    "ASREngine",
    "EngineType",
    "TranscriptWord",
    "TranscriptResult",
    "DoubaoASREngine",
    "QwenASREngine",
    "MultiEngineASRService",
    "ASREngineFactory",
    "asr_manager",
]
