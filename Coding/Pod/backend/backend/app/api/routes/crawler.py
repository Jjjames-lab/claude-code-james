from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging

from app.services.crawler import XiaoyuzhouCrawler

router = APIRouter(prefix="/api/crawler", tags=["crawler"])
logger = logging.getLogger(__name__)


class ParseURLRequest(BaseModel):
    url: str
    wait_time: Optional[int] = 3000  # 等待时间（毫秒）
    limit: Optional[int] = 5  # 每页数量，默认5
    offset: Optional[int] = 0  # 偏移量，默认0


class ParseURLResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@router.post("/parse", response_model=ParseURLResponse)
async def parse_xiaoyuzhou_url(request: ParseURLRequest):
    """
    解析小宇宙播客链接

    请求体：
    ```json
    {
      "url": "https://www.xiaoyuzhou.com/episode/xxx",
      "wait_time": 3000
    }
    ```

    响应：
    ```json
    {
      "success": true,
      "data": {
        "title": "播客标题",
        "audio_url": "音频链接",
        "duration": 3600,
        "episode_id": "xxx",
        "cover_image": "封面图",
        "show_notes": "节目备注"
      }
    }
    ```
    """
    try:
        logger.info(f"Parsing URL: {request.url}")

        # 创建爬虫实例
        crawler = XiaoyuzhouCrawler()

        # 解析链接
        result = await crawler.parse_episode(request.url)

        logger.info(f"Parse success: {result.get('episode_title')}")

        return ParseURLResponse(
            success=True,
            data=result
        )

    except Exception as e:
        logger.error(f"Parse failed: {str(e)}", exc_info=True)
        return ParseURLResponse(
            success=False,
            error=str(e)
        )


@router.post("/parse-podcast", response_model=ParseURLResponse)
async def parse_podcast_homepage(request: ParseURLRequest):
    """
    解析小宇宙播客主页链接

    请求体：
    ```json
    {
      "url": "https://www.xiaoyuzhou.com/podcast/xxx"
    }
    ```

    响应：
    ```json
    {
      "success": true,
      "data": {
        "podcast_id": "xxx",
        "podcast_name": "播客名称",
        "host_name": "主播名称",
        "description": "播客介绍",
        "logo": "播客logo",
        "episodes": [
          {
            "episode_id": "xxx",
            "episode_title": "节目标题",
            "audio_url": "音频链接",
            "duration": 3600,
            "cover_image": "封面图",
            "show_notes": "节目备注",
            "created_at": "发布时间"
          }
        ],
        "total_episodes": 100
      }
    }
    ```
    """
    try:
        logger.info(f"Parsing podcast homepage: {request.url}, limit: {request.limit}, offset: {request.offset}")

        # 创建爬虫实例
        crawler = XiaoyuzhouCrawler()

        # 解析播客主页（传入分页参数）
        result = await crawler.parse_podcast_homepage(request.url, limit=request.limit, offset=request.offset)

        logger.info(f"Podcast parse success: {result.get('podcast_name')}, episodes: {len(result.get('episodes', []))}")

        return ParseURLResponse(
            success=True,
            data=result
        )

    except Exception as e:
        logger.error(f"Podcast parse failed: {str(e)}", exc_info=True)
        return ParseURLResponse(
            success=False,
            error=str(e)
        )


@router.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "service": "crawler"}
