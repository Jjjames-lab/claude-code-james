"""
健康检查 API 路由
提供服务健康状态查询接口
"""
from fastapi import APIRouter
from app.models.schemas import HealthCheckResponse
from datetime import datetime
from app.utils.logger import logger

router = APIRouter(prefix="/health", tags=["健康检查"])


@router.get("", response_model=HealthCheckResponse)
async def health_check():
    """
    健康检查接口

    返回服务状态和各子服务的可用性
    """
    logger.debug("健康检查请求")

    # TODO: 实际检查各服务状态
    # 当前返回固定状态，后续可以添加真实的健康检查逻辑
    return HealthCheckResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat() + "Z",
        services={
            "asr_doubao": "pending",  # 豆包 ASR（待配置）
            "asr_qwen": "pending",    # 阿里云 Qwen（待配置）
            "ai_glm": "pending",      # GLM AI（待配置）
            "crawler": "available"    # 小宇宙爬虫（可用）
        }
    )
