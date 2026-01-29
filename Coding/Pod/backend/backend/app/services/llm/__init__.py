"""
LLM 服务模块
提供文本处理、逐字稿纠正等功能
"""

from .glm_client import GLMClient, PolishingRequest

__all__ = ["GLMClient", "PolishingRequest"]
