"""
小宇宙解析 API 路由
提供节目链接解析接口
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    EpisodeParseRequest,
    EpisodeParseResponse,
    APIResponse
)
from app.services.crawler import crawler
from app.utils.errors import (
    InvalidURLException,
    Error403Exception,
    Error404Exception,
    Error504Exception,
    ErrorResponse
)
from app.utils.logger import logger

router = APIRouter(prefix="/episode", tags=["小宇宙解析"])


@router.post("/parse", response_model=APIResponse)
async def parse_episode(request: EpisodeParseRequest):
    """
    解析小宇宙节目链接，获取音频地址和元数据

    ## 请求参数
    - **url**: 小宇宙节目链接（必需）

    ## 返回数据
    - **episode_id**: 节目 ID
    - **audio_url**: 音频文件地址
    - **duration**: 音频时长（秒）
    - **cover_image**: 封面图片 URL
    - **show_notes**: 节目介绍
    - **episode_title**: 节目标题
    - **podcast_name**: 播客名称

    ## 错误码
    - **1001**: 无效的 URL 格式
    - **1403**: 反爬虫拦截
    - **1404**: 节目不存在
    - **1504**: 请求超时

    ## 示例
    ```json
    {
        "url": "https://xiaoyuzhoufm.com/episode/123456"
    }
    ```
    """
    try:
        logger.info(f"收到解析请求: {request.url}")

        # 调用爬虫服务解析
        result = await crawler.parse_episode(str(request.url))

        logger.info(f"解析成功: {result['episode_id']}")

        return APIResponse(
            success=True,
            data=result
        )

    except InvalidURLException as e:
        logger.error(f"URL 格式错误: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse.create(e.error_code, e.message)
        )

    except Error403Exception as e:
        logger.error(f"反爬虫拦截: {str(e)}")
        raise HTTPException(
            status_code=403,
            detail=ErrorResponse.create(e.error_code, e.message)
        )

    except Error404Exception as e:
        logger.error(f"节目不存在: {str(e)}")
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse.create(e.error_code, e.message)
        )

    except Error504Exception as e:
        logger.error(f"请求超时: {str(e)}")
        raise HTTPException(
            status_code=504,
            detail=ErrorResponse.create(e.error_code, e.message)
        )

    except Exception as e:
        logger.error(f"未知错误: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse.create(9001, f"服务器内部错误: {str(e)}")
        )
