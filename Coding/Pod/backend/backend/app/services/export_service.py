"""
导出服务模块
提供 Markdown、PDF、纯文本导出功能
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from io import BytesIO
import logging

logger = logging.getLogger(__name__)


class ExportService:
    """导出服务"""

    def __init__(self):
        pass

    async def export_markdown(
        self,
        podcast_data: Dict[str, Any],
        transcript: List[Dict[str, Any]],
        notes: List[Dict[str, Any]],
        bookmarks: List[Dict[str, Any]]
    ) -> str:
        """
        导出为 Markdown 格式

        Args:
            podcast_data: 播客元数据
            transcript: 逐字稿数据
            notes: 笔记数据
            bookmarks: 书签数据

        Returns:
            Markdown 格式的文本
        """
        try:
            md_lines = []

            # 标题和元数据
            md_lines.append(f"# {podcast_data.get('title', '未知播客')}\n")
            md_lines.append(f"**播客**: {podcast_data.get('podcast_name', '')}\n")
            md_lines.append(f"**时长**: {self._format_duration(podcast_data.get('duration', 0))}\n")
            md_lines.append(f"**导出时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            md_lines.append("\n---\n")

            # 节目单
            if podcast_data.get('show_notes'):
                md_lines.append("## 节目单\n")
                md_lines.append(f"{podcast_data['show_notes']}\n")
                md_lines.append("\n---\n")

            # 逐字稿
            if transcript:
                md_lines.append("## 逐字稿\n\n")
                for i, segment in enumerate(transcript):
                    speaker = segment.get('speaker', '说话人')
                    text = segment.get('text', '')
                    start_time = segment.get('startTime', 0) / 1000  # 转换为秒

                    md_lines.append(f"### {speaker} ({self._format_timestamp(start_time)})\n")
                    md_lines.append(f"{text}\n\n")

            # 笔记
            if notes:
                md_lines.append("## 笔记\n\n")
                for note in notes:
                    timestamp = note.get('timestamp', 0) / 1000
                    selected_text = note.get('selectedText', '')
                    note_content = note.get('note', '')
                    created_at = note.get('createdAt', '')

                    md_lines.append(f"### {self._format_timestamp(timestamp)}\n")
                    if selected_text:
                        md_lines.append(f"> {selected_text}\n")
                    md_lines.append(f"{note_content}\n")
                    md_lines.append(f"\n*{created_at}*\n\n")

            # 书签
            if bookmarks:
                md_lines.append("## 书签\n\n")
                for bookmark in bookmarks:
                    timestamp = bookmark.get('timestamp', 0) / 1000
                    text = bookmark.get('text', '')

                    md_lines.append(f"- [{self._format_timestamp(timestamp)}] {text}\n")

            md_lines.append("\n---\n")
            md_lines.append("*由 伴读 生成，慢下来，深思考*\n")

            return '\n'.join(md_lines)

        except Exception as e:
            logger.error(f"Markdown 导出失败: {e}")
            raise

    async def export_text(
        self,
        podcast_data: Dict[str, Any],
        transcript: List[Dict[str, Any]]
    ) -> str:
        """
        导出为纯文本格式

        Args:
            podcast_data: 播客元数据
            transcript: 逐字稿数据

        Returns:
            纯文本格式的文本
        """
        try:
            lines = []

            # 标题
            lines.append(f"{podcast_data.get('title', '未知播客')}")
            lines.append(f"播客: {podcast_data.get('podcast_name', '')}")
            lines.append(f"导出时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            lines.append("\n")

            # 逐字稿
            for segment in transcript:
                speaker = segment.get('speaker', '说话人')
                text = segment.get('text', '')
                start_time = segment.get('startTime', 0) / 1000

                lines.append(f"[{self._format_timestamp(start_time)}] {speaker}")
                lines.append(f"{text}")
                lines.append("")

            return '\n'.join(lines)

        except Exception as e:
            logger.error(f"纯文本导出失败: {e}")
            raise

    def _format_duration(self, seconds: int) -> str:
        """格式化时长"""
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60

        if hours > 0:
            return f"{hours}小时{minutes}分"
        return f"{minutes}分{secs}秒"

    def _format_timestamp(self, seconds: float) -> str:
        """格式化时间戳"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)

        if hours > 0:
            return f"{hours}:{minutes:02d}:{secs:02d}"
        return f"{minutes:02d}:{secs:02d}"


# 全局导出服务实例
export_service = ExportService()
