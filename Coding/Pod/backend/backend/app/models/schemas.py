"""
数据模型定义
使用 Pydantic 定义请求/响应数据结构
"""
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List


# ============ 小宇宙解析相关 ============

class EpisodeParseRequest(BaseModel):
    """小宇宙链接解析请求"""
    url: HttpUrl = Field(..., description="小宇宙节目链接")


class EpisodeParseResponse(BaseModel):
    """小宇宙链接解析响应"""
    episode_id: str = Field(..., description="节目ID")
    audio_url: str = Field(..., description="音频文件地址")
    duration: int = Field(..., description="音频时长（秒）")
    cover_image: str = Field(..., description="封面图片URL")
    show_notes: str = Field(..., description="节目介绍")
    episode_title: str = Field(..., description="节目标题")
    podcast_name: str = Field(..., description="播客名称")


# ============ ASR 转录相关 ============

class TranscriptStartRequest(BaseModel):
    """启动转录任务请求"""
    audio_url: str = Field(..., description="音频文件地址")
    episode_id: str = Field(..., description="节目ID")
    engine: Optional[str] = Field(default="doubao", description="ASR引擎选择：doubao 或 qwen")


class TranscriptStartResponse(BaseModel):
    """启动转录任务响应"""
    task_id: str = Field(..., description="任务ID")
    status: str = Field(..., description="任务状态：processing")
    estimated_time: int = Field(..., description="预计耗时（秒）")
    engine: str = Field(..., description="使用的ASR引擎")


class TranscriptWord(BaseModel):
    """词级转录数据"""
    text: str = Field(..., description="文本内容")
    start: int = Field(..., description="开始时间（毫秒）")
    end: int = Field(..., description="结束时间（毫秒）")
    speaker: str = Field(..., description="说话人标识")


class TranscriptResult(BaseModel):
    """转录结果"""
    words: List[TranscriptWord] = Field(..., description="词级转录数据")
    total_duration: int = Field(..., description="总时长（秒）")
    asr_engine: str = Field(..., description="使用的ASR引擎")
    word_count: int = Field(..., description="总词数")


class TranscriptStatusResponse(BaseModel):
    """转录任务状态查询响应"""
    task_id: str = Field(..., description="任务ID")
    status: str = Field(..., description="任务状态：completed|processing|failed")
    progress: Optional[int] = Field(None, description="进度百分比（0-100）")
    current_engine: Optional[str] = Field(None, description="当前使用的引擎")
    result: Optional[TranscriptResult] = Field(None, description="转录结果（仅completed时返回）")


# ============ AI 纠偏相关 ============

class CorrectionChange(BaseModel):
    """纠偏变更记录"""
    from_text: str = Field(..., alias="from", description="原始文本")
    to_text: str = Field(..., alias="to", description="纠偏后文本")
    type: str = Field(..., description="变更类型：typo|grammar|style")


class CorrectionRequest(BaseModel):
    """AI 纠偏请求"""
    text_segment: str = Field(..., description="需要纠偏的文本段落")
    context_before: Optional[str] = Field(None, description="前文上下文（约50个词）")
    context_after: Optional[str] = Field(None, description="后文上下文（约50个词）")


class CorrectionResponse(BaseModel):
    """AI 纠偏响应"""
    original_text: str = Field(..., description="原始文本")
    corrected_text: str = Field(..., description="纠偏后文本")
    changes: List[CorrectionChange] = Field(..., description="变更列表")


# ============ 通用响应格式 ============

class APIResponse(BaseModel):
    """通用 API 成功响应"""
    success: bool = True
    data: dict = Field(default_factory=dict)


class HealthCheckResponse(BaseModel):
    """健康检查响应"""
    status: str = Field(..., description="服务状态")
    timestamp: str = Field(..., description="当前时间戳")
    services: dict = Field(..., description="各服务状态")
