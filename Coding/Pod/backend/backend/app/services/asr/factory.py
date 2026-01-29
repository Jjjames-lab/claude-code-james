"""
ASR 引擎工厂

根据配置创建引擎实例
"""

from .base import ASREngine
from .doubao_engine import DoubaoASREngine
from .doubao_standard_engine import DoubaoASRStandardEngine
from .qwen_engine import QwenASREngine
from .funasr_engine import FunASREngine
from .multi_engine_service import MultiEngineASRService


class ASREngineFactory:
    """ASR 引擎工厂"""

    @staticmethod
    def create_doubao(
        app_id: str,
        access_token: str,
        timeout: float = 30.0,
        max_retries: int = 2,
        retry_delay: float = 0.5,
        hotwords = None
    ) -> DoubaoASREngine:
        """创建豆包引擎"""
        return DoubaoASREngine(
            app_id=app_id,
            access_token=access_token,
            timeout=timeout,
            max_retries=max_retries,
            retry_delay=retry_delay,
            hotwords=hotwords or []
        )

    @staticmethod
    def create_doubao_standard(
        app_id: str,
        access_token: str,
        poll_interval: float = 3.0,
        max_poll_time: float = 600.0,
        hotwords = None
    ) -> DoubaoASRStandardEngine:
        """创建豆包标准版引擎"""
        return DoubaoASRStandardEngine(
            app_id=app_id,
            access_token=access_token,
            poll_interval=poll_interval,
            max_poll_time=max_poll_time,
            hotwords=hotwords or []
        )

    @staticmethod
    def create_qwen(
        api_key: str,
        timeout: float = 30.0,
        max_retries: int = 2,
        retry_delay: float = 0.5,
        hotwords = None
    ) -> QwenASREngine:
        """创建阿里云 Qwen 引擎"""
        return QwenASREngine(
            api_key=api_key,
            timeout=timeout,
            max_retries=max_retries,
            retry_delay=retry_delay,
            hotwords=hotwords or []
        )

    @staticmethod
    def create_funasr(
        api_key: str,
        model: str = "fun-asr",
        poll_interval: float = 3.0,
        max_poll_time: float = 600.0,
        hotwords = None,
        enable_speaker_diarization: bool = True
    ) -> FunASREngine:
        """创建阿里云 FunASR 引擎"""
        return FunASREngine(
            api_key=api_key,
            model=model,
            poll_interval=poll_interval,
            max_poll_time=max_poll_time,
            hotwords=hotwords or [],
            enable_speaker_diarization=enable_speaker_diarization
        )

    @staticmethod
    def create_multi_engine_service(
        primary: ASREngine,
        backup: ASREngine,
        retry_delay: float = 0.5
    ) -> MultiEngineASRService:
        """创建多引擎服务"""
        return MultiEngineASRService(
            primary_engine=primary,
            backup_engine=backup,
            retry_delay=retry_delay
        )

    @staticmethod
    def create_from_config(config: dict) -> MultiEngineASRService:
        """
        从配置字典创建多引擎服务

        Args:
            config: 配置字典，包含：
                - doubao_app_id
                - doubao_access_token
                - qwen_api_key
                - timeout
                - max_retries
                - retry_delay
                - hotwords

        Returns:
            MultiEngineASRService: 多引擎服务实例
        """
        primary = ASREngineFactory.create_doubao(
            app_id=config["doubao_app_id"],
            access_token=config["doubao_access_token"],
            timeout=config.get("timeout", 30.0),
            max_retries=config.get("max_retries", 2),
            retry_delay=config.get("retry_delay", 0.5),
            hotwords=config.get("hotwords", [])
        )

        backup = ASREngineFactory.create_qwen(
            api_key=config["qwen_api_key"],
            timeout=config.get("timeout", 30.0),
            max_retries=config.get("max_retries", 2),
            retry_delay=config.get("retry_delay", 0.5),
            hotwords=config.get("hotwords", [])
        )

        return ASREngineFactory.create_multi_engine_service(
            primary=primary,
            backup=backup,
            retry_delay=config.get("retry_delay", 0.5)
        )
