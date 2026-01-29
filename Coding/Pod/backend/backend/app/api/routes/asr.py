"""
ASR FastAPI 路由

提供转录接口，支持多种竞速策略
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional, Literal
from datetime import datetime
import logging

from app.services.asr import ASREngineFactory
from app.services.asr.base import TranscriptResult
from app.services.asr.factory import ASREngineFactory as EngineFactory
from app.config.asr_config import asr_config

logger = logging.getLogger(__name__)

router = APIRouter()

# 创建多引擎服务实例（单例）
asr_service = ASREngineFactory.create_from_config({
    "doubao_app_id": asr_config.doubao_app_id,
    "doubao_access_token": asr_config.doubao_access_token,
    "qwen_api_key": asr_config.qwen_api_key,
    "timeout": asr_config.doubao_flash_timeout,
    "max_retries": asr_config.doubao_flash_retries,
    "retry_delay": asr_config.doubao_flash_retry_delay,
    "hotwords": asr_config.hotwords
})

# 创建豆包标准版引擎（用于额度切换）
doubao_standard_engine = EngineFactory.create_doubao_standard(
    app_id=asr_config.doubao_app_id,
    access_token=asr_config.doubao_access_token,
    poll_interval=3.0,
    max_poll_time=600.0,
    hotwords=asr_config.hotwords
)


@router.post("/api/v1/asr/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    strategy: Literal["fallback", "race", "mixed"] = Form("fallback")
):
    """
    转录音频文件

    Args:
        file: 音频文件（支持 MP3/WAV/OGG OPUS）
        strategy: 竞速策略（fallback/race/mixed）

    Returns:
        {
            "success": true,
            "data": {
                "text": "转录文本",
                "duration": 12345,  // 毫秒
                "engine": "doubao",
                "words": [...],
                "word_count": 123
            }
        }

    Raises:
        HTTPException: 转录失败
    """
    try:
        # 读取音频数据
        audio_data = await file.read()
        audio_size = len(audio_data)

        logger.info(f"转录请求: 文件名={file.filename}, 大小={audio_size}, 策略={strategy}")

        # 根据策略选择转录方法
        if strategy == "fallback":
            result = await asr_service.transcribe_with_fallback(audio_data)
        elif strategy == "race":
            result = await asr_service.transcribe_with_race(audio_data)
        elif strategy == "mixed":
            result = await asr_service.transcribe_with_mixed_strategy(audio_data)
        else:
            raise HTTPException(status_code=400, detail=f"未知策略: {strategy}")

        # 转换为 API 响应格式
        return {
            "success": True,
            "data": {
                "text": result.text,
                "duration": result.duration,
                "engine": result.engine.value,
                "words": [w.to_dict() for w in result.words],
                "utterances": [u.to_dict() for u in result.utterances],  # 添加句子级分段
                "word_count": len(result.words),
                "log_id": result.log_id,
                "timestamp": result.timestamp.isoformat()
            }
        }

    except Exception as e:
        logger.error(f"转录接口错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/v1/asr/transcribe-url")
async def transcribe_from_url(
    url: str = Form(...),
    strategy: Literal["fallback", "race", "mixed"] = Form("fallback"),
    use_standard: bool = Form(False)
):
    """
    从 URL 转录音频

    Args:
        url: 音频文件的公网 URL
        strategy: 竞速策略（fallback/race/mixed）
        use_standard: 是否使用标准版（用于额度切换）

    Returns:
        转录结果

    Raises:
        HTTPException: 转录失败
    """
    try:
        logger.info(f"URL 转录请求: URL={url}, 策略={strategy}, 使用标准版={use_standard}")

        # 如果指定使用标准版，先尝试标准版，失败时 fallback 到极速版或 Qwen
        if use_standard:
            logger.info(f"使用豆包标准版转录（带 fallback）")
            try:
                result = await doubao_standard_engine.transcribe_from_url(url)
                logger.info(f"豆包标准版转录成功")
                return {
                    "success": True,
                    "data": {
                        "text": result.text,
                        "duration": result.duration,
                        "engine": result.engine.value,
                        "words": [w.to_dict() for w in result.words],
                        "utterances": [u.to_dict() for u in result.utterances],
                        "word_count": len(result.words),
                        "log_id": result.log_id,
                        "timestamp": result.timestamp.isoformat()
                    }
                }
            except Exception as e:
                logger.warning(f"豆包标准版失败: {e}，切换到极速版（带 fallback）")
                # 标准版失败，下载音频并使用极速版（会自动 fallback 到 Qwen）
                import httpx
                async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                    response = await client.get(url)
                    response.raise_for_status()
                    audio_data = response.content

                # 使用 fallback 策略（极速版主引擎 + Qwen 备用引擎）
                result = await asr_service.transcribe_with_fallback(audio_data)
                logger.info(f"Fallback 转录成功，使用引擎: {result.engine.value}")

                return {
                    "success": True,
                    "data": {
                        "text": result.text,
                        "duration": result.duration,
                        "engine": result.engine.value,
                        "words": [w.to_dict() for w in result.words],
                        "utterances": [u.to_dict() for u in result.utterances],
                        "word_count": len(result.words)
                    }
                }

        # 否则使用极速版（下载音频）
        import httpx

        # 下载音频（跟随重定向）
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            audio_data = response.content

        # 转录
        if strategy == "fallback":
            result = await asr_service.transcribe_with_fallback(audio_data)
        elif strategy == "race":
            result = await asr_service.transcribe_with_race(audio_data)
        elif strategy == "mixed":
            result = await asr_service.transcribe_with_mixed_strategy(audio_data)
        else:
            raise HTTPException(status_code=400, detail=f"未知策略: {strategy}")

        return {
            "success": True,
            "data": {
                "text": result.text,
                "duration": result.duration,
                "engine": result.engine.value,
                "words": [w.to_dict() for w in result.words],
                "utterances": [u.to_dict() for u in result.utterances],  # 添加句子级分段
                "word_count": len(result.words)
            }
        }

    except Exception as e:
        logger.error(f"URL 转录接口错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/v1/asr/engines")
async def get_available_engines():
    """
    获取可用的 ASR 引擎列表

    Returns:
        {
            "success": true,
            "data": {
                "engines": [...],
                "primary": "...",
                "backup": "..."
            }
        }
    """
    return {
        "success": True,
        "data": {
            "engines": [
                {
                    "type": "doubao",
                    "name": asr_service.primary.get_engine_name(),
                    "role": "primary"
                },
                {
                    "type": "qwen",
                    "name": asr_service.backup.get_engine_name(),
                    "role": "backup"
                }
            ],
            "primary": asr_service.primary.get_engine_type().value,
            "backup": asr_service.backup.get_engine_type().value,
            "strategy": "fallback"  # 默认策略
        }
    }


@router.get("/api/v1/asr/health")
async def health_check():
    """
    ASR 服务健康检查

    Returns:
        {
            "status": "healthy",
            "engines": {
                "doubao": "available",
                "qwen": "available"
            }
        }
    """
    return {
        "status": "healthy",
        "timestamp": "2026-01-21T00:00:00Z",
        "engines": {
            "doubao": "available",
            "qwen": "available"
        }
    }
