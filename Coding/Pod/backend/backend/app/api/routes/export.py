"""
导出功能路由
提供 Markdown、PDF、纯文本导出
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from typing import Optional, List
import logging
from datetime import datetime

from app.services.export_service import export_service

logger = logging.getLogger(__name__)
router = APIRouter()


class ExportRequest(BaseModel):
    """导出请求"""
    podcast_id: str = Field(..., description="播客ID")
    format: str = Field(..., description="导出格式: markdown | pdf | text")
    podcast_data: dict = Field(..., description="播客元数据")
    transcript: List[dict] = Field(..., description="逐字稿数据")
    notes: Optional[List[dict]] = Field(default=[], description="笔记数据")
    bookmarks: Optional[List[dict]] = Field(default=[], description="书签数据")


@router.post("/api/v1/export")
async def export_content(request: ExportRequest):
    """
    导出播客内容

    支持格式：
    - markdown: Markdown 格式
    - pdf: PDF 格式（暂未实现）
    - text: 纯文本格式

    Args:
        request: 导出请求

    Returns:
        文件下载响应
    """
    try:
        logger.info(
            f"开始导出: podcast_id={request.podcast_id}, "
            f"format={request.format}, "
            f"transcript_count={len(request.transcript)}, "
            f"notes_count={len(request.notes)}, "
            f"bookmarks_count={len(request.bookmarks)}"
        )

        # 根据格式导出
        if request.format == "markdown":
            content = await export_service.export_markdown(
                podcast_data=request.podcast_data,
                transcript=request.transcript,
                notes=request.notes,
                bookmarks=request.bookmarks
            )

            # 生成文件名
            filename = f"{request.podcast_data.get('title', '播客')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
            filename = filename.replace('/', '-').replace('\\', '-')

            return Response(
                content=content,
                media_type="text/markdown",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"'
                }
            )

        elif request.format == "text":
            content = await export_service.export_text(
                podcast_data=request.podcast_data,
                transcript=request.transcript
            )

            # 生成文件名
            filename = f"{request.podcast_data.get('title', '播客')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            filename = filename.replace('/', '-').replace('\\', '-')

            return Response(
                content=content,
                media_type="text/plain",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"'
                }
            )

        elif request.format == "pdf":
            # PDF 导出功能待实现
            raise HTTPException(
                status_code=501,
                detail="PDF 导出功能正在开发中"
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的导出格式: {request.format}"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"导出失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"导出失败: {str(e)}")
