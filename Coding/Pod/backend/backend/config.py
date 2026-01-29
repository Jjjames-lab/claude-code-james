"""
配置管理模块
从环境变量或 .env 文件读取配置
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """应用配置"""

    # 应用基础配置
    APP_NAME: str = "小宇宙深度学习助手 API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # API 配置
    API_V1_PREFIX: str = "/api/v1"

    # 豆包 ASR 配置（TODO: 待填入真实 API Key）
    DOUBAO_ACCESS_KEY: Optional[str] = None
    DOUBAO_SECRET_KEY: Optional[str] = None
    DOUBAO_REGION: str = "cn-north-1"

    # 阿里云 Qwen ASR 配置（备用引擎）
    QWEN_ACCESS_KEY: Optional[str] = None
    QWEN_SECRET_KEY: Optional[str] = None
    QWEN_REGION: str = "cn-beijing"

    # GLM AI 纠偏配置
    GLM_API_KEY: Optional[str] = None

    # 超时配置（秒）
    CRAWLER_TIMEOUT: int = 30
    ASR_TIMEOUT: int = 1800
    AI_TIMEOUT: int = 60

    # 并发配置
    MAX_CONCURRENT_REQUESTS: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # 忽略额外的环境变量


# 全局配置实例
settings = Settings()
