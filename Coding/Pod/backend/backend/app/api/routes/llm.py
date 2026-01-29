"""
LLM 处理路由
提供逐字稿纠正、文本润色等功能
支持多个 LLM 提供商（MiniMax、GLM）
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import logging
import os

from config import settings
from app.services.llm.glm_client import GLMClient

logger = logging.getLogger(__name__)
router = APIRouter()


class TranscriptPolishRequest(BaseModel):
    """逐字稿处理请求"""
    raw_text: str = Field(..., description="ASR原始文本")
    topic: Optional[str] = Field(None, description="播客主题")
    keywords: Optional[List[str]] = Field(None, description="关键词列表")


class TranscriptPolishResponse(BaseModel):
    """逐字稿处理响应"""
    polished_text: str
    model: str
    provider: str  # 新增：提供商信息


def _get_llm_client():
    """
    根据配置获取 LLM 客户端

    优先级：
    1. GLM_API_KEY（GLM 有 generate 方法，优先使用）
    2. MINIMAX_API_KEY（MiniMax 只有 polish_transcript 方法）
    """
    # 检查 GLM（优先，因为支持 generate 方法）
    if settings.GLM_API_KEY:
        logger.info("使用 GLM LLM 服务")
        return GLMClient(api_key=settings.GLM_API_KEY), "glm"

    # 检查 MiniMax
    minimax_key = os.getenv("MINIMAX_API_KEY")
    if minimax_key:
        logger.info("使用 MiniMax LLM 服务")
        try:
            from app.services.llm.minimax_client import MiniMaxClient
            return MiniMaxClient(api_key=minimax_key), "minimax"
        except ImportError as e:
            logger.warning(f"MiniMax 客户端导入失败: {e}")

    # 都没有配置
    raise HTTPException(
        status_code=503,
        detail="未配置 LLM API Key，请设置 GLM_API_KEY 或 MINIMAX_API_KEY"
    )


@router.post("/api/v1/llm/polish", response_model=TranscriptPolishResponse)
async def polish_transcript(request: TranscriptPolishRequest):
    """
    处理逐字稿：添加标点、分段、纠正ASR错误

    Args:
        request: 包含raw_text、topic、keywords的请求

    Returns:
        处理后的文本
    """
    # 检查输入
    if not request.raw_text or not request.raw_text.strip():
        raise HTTPException(status_code=400, detail="原始文本不能为空")

    try:
        logger.info(f"开始LLM处理，文本长度: {len(request.raw_text)}")

        # 获取 LLM 客户端
        client, provider = _get_llm_client()

        # 处理逐字稿
        polished_text = await client.polish_transcript(
            raw_text=request.raw_text,
            topic=request.topic,
            keywords=request.keywords
        )

        logger.info(f"LLM处理完成，处理后长度: {len(polished_text)}")

        return TranscriptPolishResponse(
            polished_text=polished_text,
            model=client.model,
            provider=provider
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LLM处理失败: {e}")
        raise HTTPException(status_code=500, detail=f"LLM处理失败: {str(e)}")


@router.get("/api/v1/llm/health")
async def health_check():
    """LLM服务健康检查"""
    minimax_key = os.getenv("MINIMAX_API_KEY")
    glm_key = settings.GLM_API_KEY

    # 确定当前使用的提供商
    if minimax_key:
        provider = "minimax"
        status = "available"
        message = "MiniMax LLM服务（已配置）"
    elif glm_key:
        provider = "glm"
        status = "available"
        message = "GLM LLM服务（已配置）"
    else:
        provider = "none"
        status = "unconfigured"
        message = "未配置 LLM API Key"

    return {
        "status": status,
        "provider": provider,
        "message": message
    }


# ==================== 章节生成 ====================

class ChaptersRequest(BaseModel):
    """章节生成请求"""
    transcript: str = Field(..., description="完整转录文本")
    topic: Optional[str] = Field(None, description="播客主题")
    keywords: Optional[List[str]] = Field(None, description="关键词列表")


class ChapterPoint(BaseModel):
    """章节要点"""
    point: str


class Chapter(BaseModel):
    """章节"""
    title: str
    points: List[str]
    segment_index: int  # 章节开始的段落索引（从0开始），用于定位准确时间


class ChaptersResponse(BaseModel):
    """章节生成响应"""
    chapters: List[Chapter]
    model: str


@router.post("/api/v1/llm/generate-chapters")
async def generate_chapters(request: ChaptersRequest):
    """
    生成播客章节

    基于 LLM 分析转录文本，自动划分章节并提取要点

    Args:
        request: 包含转录文本、主题、关键词

    Returns:
        标准API响应格式，包含success和data字段
    """
    try:
        logger.info(f"开始生成章节，转录文本长度: {len(request.transcript)}")

        # 获取 LLM 客户端
        client, provider = _get_llm_client()

        # 构造 prompt
        prompt = _build_chapters_prompt(
            request.transcript,
            request.topic,
            request.keywords
        )

        # 调用 LLM
        content = await client.generate(prompt)

        # 解析响应
        chapters = _parse_chapters_response(content)

        logger.info(f"成功生成 {len(chapters)} 个章节")

        response = ChaptersResponse(
            chapters=chapters,
            model=client.model
        )

        logger.info(f"API返回: success=true, data.chapters数量={len(response.chapters)}")

        # 返回标准API格式
        return {
            "success": True,
            "data": response
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成章节失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"生成章节失败: {str(e)}")


def _build_chapters_prompt(transcript: str, topic: Optional[str], keywords: Optional[List[str]]) -> str:
    """构造章节生成 prompt"""

    base_prompt = """你是一个专业的播客内容分析师。请分析以下播客转录文本，将其划分为合理的章节。

重要说明：
- 转录文本由多个段落组成（以换行分隔）
- 每个段落有固定的顺序编号（从0开始）
- 请识别每个话题从第几个段落开始

要求：
1. 识别话题切换点，划分3-8个章节
2. 为每个章节生成简洁的标题（10字以内）
3. 提炼每个章节的3-5个要点（每个要点10字以内）
4. 标注每个章节开始的段落索引（从0开始的整数）

返回JSON格式（不要有任何其他文字说明）：
{
  "chapters": [
    {
      "title": "章节标题",
      "points": ["要点1", "要点2", "要点3"],
      "segment_index": 0
    }
  ]
}

注意事项：
- segment_index 是整数（0, 1, 2, 3...）
- 第一个段落索引为0
- 第一个章节通常是0，后续章节依次递增
- 请仔细阅读文本，准确识别话题切换点
"""

    if topic:
        base_prompt += f"\n\n节目主题：{topic}"

    if keywords:
        base_prompt += f"\n\n关键词：{', '.join(keywords)}"

    base_prompt += f"\n\n转录文本：\n{transcript}"

    return base_prompt


def _parse_chapters_response(content: str) -> List[Chapter]:
    """解析 LLM 响应"""
    try:
        import json

        # 清理可能的 markdown 代码块标记
        if '```json' in content:
            content = content.split('```json')[1].split('```')[0].strip()
        elif '```' in content:
            content = content.split('```')[1].split('```')[0].strip()

        data = json.loads(content)

        chapters = []
        for idx, chapter_data in enumerate(data.get('chapters', [])):
            chapters.append(Chapter(
                title=chapter_data.get('title', f'章节{idx+1}'),
                points=chapter_data.get('points', []),
                segment_index=int(chapter_data.get('segment_index', idx))  # 段落索引
            ))

        return chapters

    except json.JSONDecodeError as e:
        logger.error(f"解析 JSON 失败: {e}")
        logger.error(f"原始响应: {content}")
        # 返回默认章节
        return [Chapter(
            title="完整内容",
            points=["请手动划分章节"],
            segment_index=0
        )]
    except Exception as e:
        logger.error(f"解析章节响应失败: {e}")
        raise


# ==================== Highlights 提取 ====================

class HighlightsRequest(BaseModel):
    """Highlights 提取请求"""
    transcript: str = Field(..., description="完整转录文本")
    max_highlights: Optional[int] = Field(10, description="最多提取几个高光片段")
    topic: Optional[str] = Field(None, description="播客主题")


class Highlight(BaseModel):
    """高光片段"""
    text: str = Field(..., description="高光文字")
    timestamp: int = Field(..., description="时间戳（秒）")
    reason: str = Field(..., description="为什么重要")
    category: str = Field(..., description="分类：quote | insight | data | conclusion")


class HighlightsResponse(BaseModel):
    """Highlights 提取响应"""
    highlights: List[Highlight]
    total: int
    model: str


@router.post("/api/v1/llm/generate-highlights")
async def generate_highlights(request: HighlightsRequest):
    """
    提取播客中的高光片段（金句）

    基于 LLM 分析转录文本，自动识别核心观点、金句、数据案例等

    Args:
        request: 包含转录文本、主题、最大数量

    Returns:
        标准API响应格式，包含success和data字段
    """
    try:
        logger.info(f"开始提取 Highlights，转录文本长度: {len(request.transcript)}")

        # 获取 LLM 客户端
        client, provider = _get_llm_client()

        # 构造 prompt
        prompt = _build_highlights_prompt(
            request.transcript,
            request.topic,
            request.max_highlights or 10
        )

        # 调用 LLM
        content = await client.generate(prompt)

        # 解析响应
        highlights = _parse_highlights_response(content)

        logger.info(f"成功提取 {len(highlights)} 个高光片段")

        response = HighlightsResponse(
            highlights=highlights,
            total=len(highlights),
            model=client.model
        )

        logger.info(f"API返回: success=true, data.highlights数量={len(response.highlights)}")

        # 返回标准API格式
        return {
            "success": True,
            "data": response
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"提取 Highlights 失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"提取 Highlights 失败: {str(e)}")


def _build_highlights_prompt(transcript: str, topic: Optional[str], max_highlights: int) -> str:
    """构造 Highlights 提取 prompt"""

    prompt = f"""你是一个专业的播客内容分析师。请分析以下播客转录文本，提取 {max_highlights} 个最精彩、最有价值的片段（Highlights）。

识别标准：
1. 核心观点：表达清晰、观点鲜明
2. 金句：语言精炼、富有哲理
3. 数据/案例：具体的数字、案例、研究
4. 结论总结：提炼出的关键结论

重要说明：
- 转录文本由多个段落组成
- 每个高光片段需要标注：原文、时间戳（秒）、重要性理由、分类
- 时间戳需要估算，根据内容在整个文本中的位置比例计算
- 假设整个播客时长为60分钟（3600秒）

返回JSON格式（不要有任何其他文字说明）：
{{
  "highlights": [
    {{
      "text": "高光文字内容",
      "timestamp": 120,
      "reason": "为什么重要（10字以内）",
      "category": "quote|insight|data|conclusion"
    }}
  ]
}}
"""

    if topic:
        prompt += f"\n\n节目主题：{topic}"

    prompt += f"\n\n转录文本：\n{transcript}"

    return prompt


def _parse_highlights_response(content: str) -> List[Highlight]:
    """解析 LLM Highlights 响应"""
    try:
        import json

        # 清理可能的 markdown 代码块标记
        if '```json' in content:
            content = content.split('```json')[1].split('```')[0].strip()
        elif '```' in content:
            content = content.split('```')[1].split('```')[0].strip()

        data = json.loads(content)

        highlights = []
        for highlight_data in data.get('highlights', []):
            highlights.append(Highlight(
                text=highlight_data.get('text', ''),
                timestamp=highlight_data.get('timestamp', 0),
                reason=highlight_data.get('reason', ''),
                category=highlight_data.get('category', 'insight')
            ))

        return highlights

    except json.JSONDecodeError as e:
        logger.error(f"解析 JSON 失败: {e}")
        logger.error(f"原始响应: {content}")
        # 返回空列表
        return []
    except Exception as e:
        logger.error(f"解析 Highlights 响应失败: {e}")
        raise


# ==================== 翻译功能 ====================

class TranslateSegment(BaseModel):
    """待翻译的段落"""
    id: str = Field(..., description="段落ID")
    text: str = Field(..., description="段落文本")


class TranslateRequest(BaseModel):
    """翻译请求"""
    segments: List[TranslateSegment] = Field(..., description="待翻译的段落列表")
    target_lang: str = Field(..., description="目标语言: 'zh', 'en', 'ko', 'ja'")
    source_lang: Optional[str] = Field(None, description="源语言（可选，系统会自动检测）")


class TranslatedSegment(BaseModel):
    """翻译后的段落"""
    id: str
    translated_text: str


class TranslateResponse(BaseModel):
    """翻译响应"""
    translations: List[TranslatedSegment]
    total: int
    model: str
    provider: str


@router.post("/api/v1/llm/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    """
    批量翻译文本（逐字稿/章节）

    使用 LLM 进行高质量翻译，支持中文、英文、韩语、日语互译

    Args:
        request: 包含段落列表、目标语言的请求

    Returns:
        标准API响应格式，包含success和data字段
    """
    try:
        logger.info(f"开始翻译，段落数量: {len(request.segments)}, 目标语言: {request.target_lang}")

        # 获取 LLM 客户端
        client, provider = _get_llm_client()

        # 构造批量翻译 prompt
        prompt = _build_translate_prompt(
            request.segments,
            request.target_lang
        )

        # 调用 LLM
        content = await client.generate(prompt)

        # 解析响应
        translations = _parse_translate_response(content, request.segments)

        logger.info(f"成功翻译 {len(translations)} 个段落")

        response = TranslateResponse(
            translations=translations,
            total=len(translations),
            model=client.model,
            provider=provider
        )

        logger.info(f"API返回: success=true, data.translations数量={len(response.translations)}")

        # 返回标准API格式
        return {
            "success": True,
            "data": response
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"翻译失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"翻译失败: {str(e)}")


def _build_translate_prompt(segments: List[TranslateSegment], target_lang: str) -> str:
    """构造翻译 prompt"""

    # 将段落编号以便 LLM 返回时对应
    numbered_segments = "\n\n".join([
        f"[{idx}]\n{seg.text}"
        for idx, seg in enumerate(segments)
    ])

    # 语言映射
    lang_names = {
        "zh": "中文",
        "en": "英文",
        "ko": "韩语",
        "ja": "日语"
    }

    target_lang_name = lang_names.get(target_lang, target_lang)

    prompt = f"""你是一个专业的翻译专家。请将以下文本翻译为{target_lang_name}。

要求：
1. 准确传达原意，不要遗漏信息
2. 使用自然、流畅的{target_lang_name}表达
3. 保持段落结构，只返回翻译结果
4. 专业术语要准确

待翻译文本（每段用 [数字] 标识）：
{numbered_segments}

返回JSON格式（不要有任何其他文字说明）：
{{
  "translations": [
    {{
      "id": "段落ID",
      "translated_text": "翻译后的文本"
    }}
  ]
}}
"""

    return prompt


def _parse_translate_response(content: str, segments: List[TranslateSegment]) -> List[TranslatedSegment]:
    """解析翻译响应"""
    try:
        import json

        # 清理可能的 markdown 代码块标记
        if '```json' in content:
            content = content.split('```json')[1].split('```')[0].strip()
        elif '```' in content:
            content = content.split('```')[1].split('```')[0].strip()

        data = json.loads(content)

        translations = []
        for trans_data in data.get("translations", []):
            translations.append(TranslatedSegment(
                id=trans_data.get("id", ""),
                translated_text=trans_data.get("translated_text", "")
            ))

        return translations

    except json.JSONDecodeError as e:
        logger.error(f"解析 JSON 失败: {e}")
        logger.error(f"原始响应: {content}")
        raise
    except Exception as e:
        logger.error(f"解析翻译响应失败: {e}")
        raise

