"""
阿里云 FunASR 引擎

使用 DashScope SDK 调用阿里云 FunASR 服务
价格：0.00022元/秒（非常便宜！）
"""

import dashscope
from dashscope.audio.asr import Transcription
from http import HTTPStatus
from typing import List, Optional
import json
import logging
from urllib import request
from datetime import datetime

from app.services.asr.base import ASREngine, EngineType, TranscriptResult, TranscriptWord, TranscriptUtterance

logger = logging.getLogger(__name__)


class FunASREngine(ASREngine):
    """
    阿里云 FunASR 引擎

    优点：
    - 价格便宜（0.00022元/秒）
    - 针对中文深度优化
    - 支持多种方言
    - 支持词级时间戳
    - 支持歌唱识别
    - 远场VAD和噪声鲁棒性强
    """

    def __init__(
        self,
        api_key: str,
        model: str = "fun-asr",
        poll_interval: float = 3.0,
        max_poll_time: float = 600.0,
        hotwords: Optional[List[str]] = None
    ):
        """
        初始化 FunASR 引擎

        Args:
            api_key: DashScope API Key
            model: 模型名称，默认为 'fun-asr'（稳定版）
                   可选：'fun-asr-2025-11-07'（快照版）
                         'paraformer-v2'（多语种，更便宜 0.00008元/秒）
            poll_interval: 轮询间隔（秒）
            max_poll_time: 最大轮询时间（秒）
            hotwords: 热词列表，提升识别准确率
        """
        self.api_key = api_key
        self.model = model
        self.poll_interval = poll_interval
        self.max_poll_time = max_poll_time
        self.hotwords = hotwords or []

        # 设置 DashScope API Key
        dashscope.api_key = api_key

        # 设置北京地域 endpoint
        dashscope.base_http_api_url = 'https://dashscope.aliyuncs.com/api/v1'

        logger.info(f"[FunASR] 初始化完成, model={model}")

    def get_engine_type(self) -> EngineType:
        return EngineType.FUNASR

    def get_engine_name(self) -> str:
        return f"阿里云 FunASR ({self.model})"

    async def transcribe_from_url(self, audio_url: str) -> TranscriptResult:
        """
        从 URL 转录音频

        Args:
            audio_url: 音频文件的公网可访问 URL

        Returns:
            TranscriptResult: 转录结果

        Raises:
            Exception: 转录失败
        """
        import asyncio
        import time

        logger.info(f"[FunASR] 开始转录: {audio_url}")

        try:
            # 提交转录任务
            task_response = Transcription.async_call(
                model=self.model,
                file_urls=[audio_url],
                language_hints=['zh', 'en']  # 支持中英文
            )

            if task_response.status_code != HTTPStatus.OK:
                error_msg = f"提交任务失败: {task_response.output.message}"
                logger.error(f"[FunASR] {error_msg}")
                raise Exception(error_msg)

            task_id = task_response.output.task_id
            logger.info(f"[FunASR] 任务已提交, task_id={task_id}")

            # 轮询等待结果
            start_time = time.time()
            last_log_time = start_time

            while True:
                # 检查超时
                elapsed = time.time() - start_time
                if elapsed > self.max_poll_time:
                    raise TimeoutError(f"转录超时（{self.max_poll_time}秒）")

                # 轮询任务状态
                transcription_response = Transcription.wait(task=task_id)

                # 每3秒打印一次进度
                current_time = time.time()
                if current_time - last_log_time >= 3.0:
                    logger.info(f"[FunASR] 处理中... ({elapsed:.1f}秒)")
                    last_log_time = current_time

                # 检查任务状态
                if transcription_response.status_code == HTTPStatus.OK:
                    # 任务完成
                    break
                elif transcription_response.status_code == 202:
                    # 任务进行中，继续等待
                    await asyncio.sleep(self.poll_interval)
                    continue
                else:
                    # 任务失败
                    error_msg = f"转录失败: {transcription_response.output.message}"
                    logger.error(f"[FunASR] {error_msg}")
                    raise Exception(error_msg)

            # 解析结果
            results = transcription_response.output['results']
            if not results or len(results) == 0:
                raise Exception("转录结果为空")

            result = results[0]

            # 检查子任务状态
            if result['subtask_status'] != 'SUCCEEDED':
                error_msg = f"转录失败: {result.get('message', '未知错误')}"
                logger.error(f"[FunASR] {error_msg}")
                raise Exception(error_msg)

            # 下载转录结果
            transcription_url = result['transcription_url']
            transcription_data = json.loads(
                request.urlopen(transcription_url).read().decode('utf8')
            )

            # 解析转录数据
            transcript = self._parse_transcription_data(transcription_data, audio_url)

            total_time = time.time() - start_time
            logger.info(f"[FunASR] 转录完成, 耗时 {total_time:.1f}秒")

            return transcript

        except Exception as e:
            logger.error(f"[FunASR] 转录异常: {str(e)}", exc_info=True)
            raise

    def _parse_transcription_data(self, data: dict, source_url: str) -> TranscriptResult:
        """
        解析 FunASR 转录数据

        Args:
            data: FunASR 返回的 JSON 数据
            source_url: 原始音频 URL

        Returns:
            TranscriptResult: 标准化的转录结果
        """
        # 提取基本信息
        transcripts = data.get('transcripts', [])
        if not transcripts:
            raise Exception("转录数据中没有 transcripts 字段")

        transcript = transcripts[0]
        properties = data.get('properties', {})
        duration_ms = properties.get('original_duration_in_milliseconds', 0)

        # 提取完整文本
        text = transcript.get('text', '')

        # 提取句子和词语级时间戳
        sentences = transcript.get('sentences', [])
        words: List[TranscriptWord] = []
        utterances: List[TranscriptUtterance] = []

        for sentence in sentences:
            sentence_start = sentence.get('begin_time', 0)
            sentence_end = sentence.get('end_time', 0)
            sentence_text = sentence.get('text', '')

            # 提取词语级时间戳
            sentence_words = sentence.get('words', [])
            sentence_word_objects: List[TranscriptWord] = []

            for word_data in sentence_words:
                word_start = word_data.get('begin_time', 0)
                word_end = word_data.get('end_time', 0)
                word_text = word_data.get('text', '')
                punctuation = word_data.get('punctuation', '')

                # 合并词语和标点
                if punctuation:
                    full_text = word_text + punctuation
                else:
                    full_text = word_text

                if full_text:
                    word_obj = TranscriptWord(
                        text=full_text,
                        start_time=word_start,
                        end_time=word_end
                    )
                    words.append(word_obj)
                    sentence_word_objects.append(word_obj)

            # 添加到 utterances（句子级）
            utterances.append(TranscriptUtterance(
                text=sentence_text.strip(),
                start_time=sentence_start,
                end_time=sentence_end,
                words=sentence_word_objects
            ))

        # 生成 log_id
        log_id = f"funasr_{int(datetime.now().timestamp())}"

        return TranscriptResult(
            text=text,
            duration=duration_ms,
            words=words,
            utterances=utterances,
            engine=self.get_engine_type(),
            log_id=log_id,
            timestamp=datetime.now()
        )

    async def transcribe(self, audio_data: bytes) -> TranscriptResult:
        """
        转录音频数据（FunASR 不支持，会抛出异常）

        Args:
            audio_data: 音频二进制数据

        Returns:
            TranscriptResult: 转录结果

        Raises:
            NotImplementedError: FunASR 仅支持 URL 转录
        """
        raise NotImplementedError("FunASR 仅支持 URL 转录，请使用 transcribe_from_url()")

    async def transcribe_from_file(self, file_path: str) -> TranscriptResult:
        """
        从文件转录音频（FunASR 仅支持 URL，需要先上传到 OSS）

        Args:
            file_path: 本地音频文件路径

        Returns:
            TranscriptResult: 转录结果

        Raises:
            NotImplementedError: FunASR 不支持直接上传文件
        """
        raise NotImplementedError("FunASR 仅支持 URL 转录，请使用 transcribe_from_url()")
