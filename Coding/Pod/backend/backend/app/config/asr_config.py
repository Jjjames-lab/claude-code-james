"""
ASR 服务配置文件

管理豆包 ASR 和阿里云 Qwen ASR 的配置参数
"""

from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class ASRConfig(BaseSettings):
    """ASR 服务配置"""

    # ==================== 豆包 ASR 配置 ====================
    doubao_app_id: str = Field(default="", description="豆包 APP ID")
    doubao_access_token: str = Field(default="", description="豆包 Access Token")

    # 豆包极速版配置
    doubao_flash_timeout: float = Field(default=120.0, description="极速版超时时间（秒）")
    doubao_flash_retries: int = Field(default=1, description="极速版重试次数")
    doubao_flash_retry_delay: float = Field(default=1.0, description="极速版重试间隔（秒）")

    # 豆包标准版配置
    doubao_standard_poll_interval: float = Field(default=3.0, description="标准版轮询间隔（秒）")
    doubao_standard_max_poll_time: float = Field(default=600.0, description="标准版最大轮询时间（秒）")

    # 音频时长阈值（超过此值使用标准版）
    doubao_duration_threshold: int = Field(default=7200, description="时长阈值（秒），默认2小时")

    # ==================== 阿里云 Qwen 配置 ====================
    qwen_api_key: str = Field(default="", description="阿里云 Qwen API Key")
    qwen_timeout: float = Field(default=30.0, description="Qwen 超时时间（秒）")
    qwen_retries: int = Field(default=2, description="Qwen 重试次数")
    qwen_retry_delay: float = Field(default=0.5, description="Qwen 重试间隔（秒）")

    # ==================== 阿里云 FunASR 配置 ====================
    funasr_api_key: str = Field(default="", description="阿里云 FunASR API Key")
    funasr_model: str = Field(default="fun-asr", description="FunASR 模型（fun-asr/paraformer-v2）")
    funasr_poll_interval: float = Field(default=3.0, description="FunASR 轮询间隔（秒）")
    funasr_max_poll_time: float = Field(default=600.0, description="FunASR 最大轮询时间（秒）")

    # ==================== 阿里云 OSS 配置 ====================
    oss_access_key_id: str = Field(default="", description="OSS Access Key ID")
    oss_access_key_secret: str = Field(default="", description="OSS Access Key Secret")
    oss_bucket_name: str = Field(default="", description="OSS Bucket 名称")
    oss_endpoint: str = Field(default="", description="OSS Endpoint")

    # ==================== 热词配置 ====================
    hotwords: List[str] = Field(
        default=["豆包", "ASR", "播客", "人工智能", "深度学习"],
        description="ASR 热词列表，提升识别准确率"
    )

    # ==================== 智能分流配置 ====================
    enable_smart_routing: bool = Field(default=True, description="是否启用智能分流")
    primary_engine: str = Field(default="funasr", description="主引擎（funasr/doubao/qwen）")
    fallback_engine: str = Field(default="qwen", description="备用引擎")

    # ==================== 任务配置 ====================
    max_concurrent_tasks: int = Field(default=2, description="最大并发转录任务数")
    task_timeout: int = Field(default=3600, description="任务超时时间（秒）")

    class Config:
        env_file = ".env"
        env_prefix = ""  # 环境变量前缀（空表示直接使用字段名）
        extra = "ignore"  # 忽略额外的环境变量


# 全局配置实例
asr_config = ASRConfig()


# ==================== 辅助函数 ====================

def get_doubao_config() -> dict:
    """获取豆包 ASR 配置"""
    return {
        "app_id": asr_config.doubao_app_id,
        "access_token": asr_config.doubao_access_token,
        "flash_timeout": asr_config.doubao_flash_timeout,
        "flash_retries": asr_config.doubao_flash_retries,
        "flash_retry_delay": asr_config.doubao_flash_retry_delay,
        "standard_poll_interval": asr_config.doubao_standard_poll_interval,
        "standard_max_poll_time": asr_config.doubao_standard_max_poll_time,
        "duration_threshold": asr_config.doubao_duration_threshold,
        "hotwords": asr_config.hotwords
    }


def get_qwen_config() -> dict:
    """获取阿里云 Qwen 配置"""
    return {
        "api_key": asr_config.qwen_api_key,
        "timeout": asr_config.qwen_timeout,
        "retries": asr_config.qwen_retries,
        "retry_delay": asr_config.qwen_retry_delay,
        "hotwords": asr_config.hotwords
    }


def get_funasr_config() -> dict:
    """获取阿里云 FunASR 配置"""
    return {
        "api_key": asr_config.funasr_api_key,
        "model": asr_config.funasr_model,
        "poll_interval": asr_config.funasr_poll_interval,
        "max_poll_time": asr_config.funasr_max_poll_time,
        "hotwords": asr_config.hotwords
    }


def get_oss_config() -> dict:
    """获取 OSS 配置"""
    return {
        "access_key_id": asr_config.oss_access_key_id,
        "access_key_secret": asr_config.oss_access_key_secret,
        "bucket_name": asr_config.oss_bucket_name,
        "endpoint": asr_config.oss_endpoint
    }


def is_configured() -> bool:
    """检查 ASR 配置是否完整"""
    return bool(
        asr_config.doubao_app_id and
        asr_config.doubao_access_token
    )


def get_active_engine() -> str:
    """获取当前活跃的 ASR 引擎"""
    return asr_config.primary_engine if is_configured() else "none"
