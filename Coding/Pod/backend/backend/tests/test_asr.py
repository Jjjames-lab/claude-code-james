"""
ASR 服务单元测试

测试豆包 ASR 极速版、标准版和服务管理器
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from app.services.asr_service import (
    DoubaoASRFlashClient,
    DoubaoASRStandardClient,
    ASRService,
    TranscriptResult,
    TranscriptWord,
    ASRTask
)


# ==================== 固定装置（Fixtures）====================

@pytest.fixture
def mock_audio_data():
    """模拟音频数据"""
    # 创建一个小的 MP3 文件头（仅用于测试）
    return b"ID3\x04\x00\x00\x00\x00\x00\x00" + b"\x00" * 1000


@pytest.fixture
def mock_transcript_response():
    """模拟豆包 ASR 响应"""
    return {
        "audio_info": {"duration": 10000},  # 10秒
        "result": {
            "text": "测试转录文本",
            "utterances": [
                {
                    "text": "测试",
                    "start_time": 0,
                    "end_time": 5000,
                    "words": [
                        {"text": "测", "start_time": 0, "end_time": 2500},
                        {"text": "试", "start_time": 2500, "end_time": 5000}
                    ]
                },
                {
                    "text": "转录",
                    "start_time": 5000,
                    "end_time": 10000,
                    "words": [
                        {"text": "转", "start_time": 5000, "end_time": 7500},
                        {"text": "录", "start_time": 7500, "end_time": 10000}
                    ]
                }
            ]
        }
    }


@pytest.fixture
def asr_service():
    """ASR 服务实例"""
    return ASRService()


# ==================== 豆包极速版测试 ====================

class TestDoubaoASRFlashClient:
    """豆包 ASR 极速版客户端测试"""

    @pytest.mark.asyncio
    async def test_transcribe_success(self, mock_audio_data, mock_transcript_response):
        """测试：转录成功"""
        client = DoubaoASRFlashClient()

        # Mock HTTP 响应
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_response = Mock()
            mock_response.headers = {
                "X-Api-Status-Code": "20000000",
                "X-Api-Message": "OK"
            }
            mock_response.json = Mock(return_value=mock_transcript_response)

            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__.return_value = mock_client

            # 执行转录
            result = await client.transcribe(mock_audio_data)

            # 验证结果
            assert result.asr_engine == "doubao"
            assert result.word_count == 4
            assert result.total_duration == 10000
            assert len(result.words) == 4
            assert result.words[0].text == "测"
            assert result.words[0].start == 0

    @pytest.mark.asyncio
    async def test_transcribe_with_retry(self, mock_audio_data):
        """测试：重试机制"""
        client = DoubaoASRFlashClient()

        with patch("httpx.AsyncClient") as mock_client_class:
            # 前两次失败，第三次成功
            mock_success_response = Mock()
            mock_success_response.headers = {
                "X-Api-Status-Code": "20000000",
                "X-Api-Message": "OK"
            }
            mock_success_response.json = Mock(return_value={
                "audio_info": {"duration": 1000},
                "result": {
                    "utterances": [
                        {
                            "words": [
                                {"text": "测试", "start_time": 0, "end_time": 1000}
                            ]
                        }
                    ]
                }
            })

            mock_client = AsyncMock()
            mock_client.post = AsyncMock(side_effect=[
                Exception("Network error"),
                Exception("Network error"),
                mock_success_response
            ])
            mock_client_class.return_value.__aenter__.return_value = mock_client

            # 执行转录
            result = await client.transcribe(mock_audio_data)

            # 验证重试了 3 次
            assert mock_client.post.call_count == 3
            assert result.word_count == 1

    @pytest.mark.asyncio
    async def test_transcribe_api_error(self, mock_audio_data):
        """测试：API 错误处理"""
        client = DoubaoASRFlashClient()

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_response = Mock()
            mock_response.headers = {
                "X-Api-Status-Code": "45000001",
                "X-Api-Message": "Invalid parameter"
            }

            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__.return_value = mock_client

            # 执行转录，应该抛出异常
            with pytest.raises(ValueError, match="豆包 ASR 失败"):
                await client.transcribe(mock_audio_data)


# ==================== 豆包标准版测试 ====================

class TestDoubaoASRStandardClient:
    """豆包 ASR 标准版客户端测试"""

    @pytest.mark.asyncio
    async def test_transcribe_with_polling(self):
        """测试：轮询查询"""
        client = DoubaoASRStandardClient()

        with patch("httpx.AsyncClient") as mock_client_class:
            # Submit 响应
            mock_submit_response = Mock()
            mock_submit_response.headers = {
                "X-Api-Status-Code": "20000000",
                "X-Api-Message": "OK"
            }

            # Query 响应（模拟轮询过程）
            mock_query_responses = [
                Mock(headers={"X-Api-Status-Code": "20000001"}),  # 处理中
                Mock(headers={"X-Api-Status-Code": "20000001"}),  # 处理中
                Mock(
                    headers={"X-Api-Status-Code": "20000000"},   # 成功
                    json=Mock(return_value={
                        "audio_info": {"duration": 5000},
                        "result": {
                            "utterances": [
                                {
                                    "words": [
                                        {"text": "长音频", "start_time": 0, "end_time": 5000}
                                    ]
                                }
                            ]
                        }
                    })
                )
            ]

            mock_client = AsyncMock()
            mock_client.post = AsyncMock(side_effect=[
                mock_submit_response,
                *mock_query_responses
            ])
            mock_client_class.return_value.__aenter__.return_value = mock_client

            # 执行转录
            result = await client.transcribe("https://example.com/long-audio.mp3")

            # 验证结果
            assert result.asr_engine == "doubao"
            assert result.word_count == 1
            assert result.words[0].text == "长音频"


# ==================== ASR 服务管理器测试 ====================

class TestASRService:
    """ASR 服务管理器测试"""

    def test_create_task(self, asr_service):
        """测试：创建任务"""
        task = asr_service.create_task(
            episode_id="ep_123",
            audio_url="https://example.com/audio.mp3",
            engine="doubao"
        )

        assert task.episode_id == "ep_123"
        assert task.audio_url == "https://example.com/audio.mp3"
        assert task.engine == "doubao"
        assert task.status == "pending"
        assert task.task_id.startswith("task_")

    def test_get_task(self, asr_service):
        """测试：获取任务"""
        # 创建任务
        task = asr_service.create_task(
            episode_id="ep_456",
            audio_url="https://example.com/audio2.mp3"
        )

        # 获取任务
        retrieved_task = asr_service.get_task(task.task_id)

        assert retrieved_task is not None
        assert retrieved_task.task_id == task.task_id
        assert retrieved_task.episode_id == "ep_456"

    @pytest.mark.asyncio
    async def test_start_task_success(self, asr_service, mock_audio_data, mock_transcript_response):
        """测试：启动任务成功"""
        # 创建任务
        task = await asr_service.create_task(
            episode_id="ep_789",
            audio_url="https://example.com/audio3.mp3"
        )

        # Mock 豆包 ASR 客户端
        with patch.object(asr_service.flash_client, "transcribe", AsyncMock()) as mock_transcribe:
            mock_result = TranscriptResult(
                words=[
                    TranscriptWord(text="测试", start=0, end=1000)
                ],
                total_duration=1000,
                asr_engine="doubao",
                word_count=1,
                created_at="2026-01-20T00:00:00Z"
            )
            mock_transcribe.return_value = mock_result

            # 启动任务
            await asr_service.start_task(task.task_id, mock_audio_data)

            # 验证任务状态
            updated_task = asr_service.get_task(task.task_id)
            assert updated_task.status == "completed"
            assert updated_task.progress == 100
            assert updated_task.result is not None
            assert updated_task.result.word_count == 1

    @pytest.mark.asyncio
    async def test_start_task_failure(self, asr_service, mock_audio_data):
        """测试：启动任务失败"""
        # 创建任务
        task = await asr_service.create_task(
            episode_id="ep_fail",
            audio_url="https://example.com/fail.mp3"
        )

        # Mock 豆包 ASR 客户端（抛出异常）
        with patch.object(asr_service.flash_client, "transcribe", AsyncMock()) as mock_transcribe:
            mock_transcribe.side_effect = Exception("Transcription failed")

            # 启动任务
            await asr_service.start_task(task.task_id, mock_audio_data)

            # 验证任务状态
            updated_task = asr_service.get_task(task.task_id)
            assert updated_task.status == "failed"
            assert updated_task.error == "Transcription failed"

    def test_get_task_status(self, asr_service):
        """测试：获取任务状态"""
        # 创建任务
        task = asr_service.create_task(
            episode_id="ep_status",
            audio_url="https://example.com/status.mp3"
        )

        # 获取任务状态
        status = asyncio.run(asr_service.get_task_status(task.task_id))

        assert status["task_id"] == task.task_id
        assert status["status"] == "pending"
        assert status["current_engine"] == "doubao"

    def test_get_task_status_not_found(self, asr_service):
        """测试：获取不存在的任务"""
        status = asyncio.run(asr_service.get_task_status("nonexistent_task"))

        assert status["error"] == "TASK_NOT_FOUND"


# ==================== 集成测试（可选，需要真实 API Key）====================

@pytest.mark.integration
class TestASRIntegration:
    """ASR 服务集成测试（需要真实 API Key）"""

    @pytest.mark.asyncio
    async def test_real_transcription(self):
        """测试：真实转录（需要配置 API Key）"""
        # TODO: 配置 API Key 后运行此测试
        pytest.skip("需要配置豆包 API Key")

    @pytest.mark.asyncio
    async def test_real_transcription_with_hotwords(self):
        """测试：真实转录（带热词）"""
        # TODO: 配置 API Key 后运行此测试
        pytest.skip("需要配置豆包 API Key")


# ==================== 运行测试 ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
