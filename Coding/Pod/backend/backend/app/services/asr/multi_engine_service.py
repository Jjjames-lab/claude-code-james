"""
多引擎 ASR 服务

实现三种竞速策略：
1. Fallback - 主备切换
2. Race - 并行竞速
3. Mixed - 混合策略（PushToTalk 实战方案）
"""

import asyncio
import logging
from typing import Optional, Literal
from datetime import datetime

from .base import ASREngine, TranscriptResult

logger = logging.getLogger(__name__)


class MultiEngineASRService:
    """多引擎 ASR 服务"""

    def __init__(
        self,
        primary_engine: ASREngine,
        backup_engine: ASREngine,
        retry_delay: float = 0.5
    ):
        self.primary = primary_engine
        self.backup = backup_engine
        self.retry_delay = retry_delay

    async def transcribe_with_fallback(
        self,
        audio_data: bytes
    ) -> TranscriptResult:
        """
        主备切换策略

        流程：
        1. 先尝试主引擎（带重试）
        2. 主引擎失败后，切换到备用引擎
        3. 记录切换日志

        Args:
            audio_data: 音频二进制数据

        Returns:
            TranscriptResult: 转录结果

        Raises:
            Exception: 所有引擎都失败
        """
        audio_size = len(audio_data)
        logger.info(f"[Fallback] 启动主备切换转录, 音频大小: {audio_size} bytes")

        # 1. 尝试主引擎
        try:
            logger.info(f"[Fallback] 🔄 尝试主引擎: {self.primary.get_engine_name()}")
            result = await self.primary.transcribe(audio_data)
            logger.info(f"[Fallback] ✅ 主引擎转录成功: {result.text[:50]}...")
            return result
        except Exception as e:
            logger.warning(f"[Fallback] ⚠️ 主引擎失败: {e}")

        # 2. 切换到备用引擎
        try:
            logger.info(f"[Fallback] 🔄 切换到备用引擎: {self.backup.get_engine_name()}")
            result = await self.backup.transcribe(audio_data)
            logger.info(f"[Fallback] ✅ 备用引擎转录成功: {result.text[:50]}...")

            # 记录切换事件
            logger.info({
                "event": "asr_engine_switch",
                "from": self.primary.get_engine_type().value,
                "to": self.backup.get_engine_type().value,
                "reason": "primary_failed",
                "timestamp": datetime.now().isoformat()
            })

            return result

        except Exception as e:
            logger.error(f"[Fallback] ❌ 备用引擎也失败: {e}")
            raise Exception(
                f"所有引擎都失败 - "
                f"主引擎: {self.primary.get_engine_name()}, "
                f"备用引擎: {self.backup.get_engine_name()}"
            )

    async def transcribe_with_race(
        self,
        audio_data: bytes
    ) -> TranscriptResult:
        """
        并行竞速策略

        流程：
        1. 主备引擎同时启动
        2. 谁先返回用谁的
        3. 取消另一个任务

        Args:
            audio_data: 音频二进制数据

        Returns:
            TranscriptResult: 最先返回的转录结果
        """
        audio_size = len(audio_data)
        logger.info(f"[Race] 启动并行竞速转录, 音频大小: {audio_size} bytes")

        # 创建两个任务
        primary_task = asyncio.create_task(
            self._transcribe_with_logging(self.primary, audio_data, "主引擎")
        )

        backup_task = asyncio.create_task(
            self._transcribe_with_logging(self.backup, audio_data, "备用引擎")
        )

        # 等待第一个成功
        done, pending = await asyncio.wait(
            {primary_task, backup_task},
            return_when=asyncio.FIRST_COMPLETED
        )

        # 取消未完成的任务
        for task in pending:
            task.cancel()

        # 获取结果
        result = None
        for task in done:
            try:
                result = task.result()
                break
            except Exception as e:
                logger.error(f"[Race] 任务失败: {e}")

        if result:
            logger.info(f"[Race] ✅ 竞速获胜: {result.engine.value}")
            return result
        else:
            raise Exception("所有引擎都失败")

    async def transcribe_with_mixed_strategy(
        self,
        audio_data: bytes
    ) -> TranscriptResult:
        """
        混合策略（PushToTalk 实战验证）

        流程：
        1. 备用引擎在后台启动
        2. 主引擎进行重试（最多 2 次）
        3. 每次重试前检查备用引擎是否已完成
        4. 如果备用引擎先完成，立即使用

        Args:
            audio_data: 音频二进制数据

        Returns:
            TranscriptResult: 转录结果
        """
        audio_size = len(audio_data)
        logger.info(f"[Mixed] 启动混合策略转录, 音频大小: {audio_size} bytes")

        # 1. 启动备用引擎任务
        backup_result: Optional[TranscriptResult] = None
        backup_error: Optional[Exception] = None
        backup_done = asyncio.Event()

        async def backup_task():
            nonlocal backup_result, backup_error
            try:
                logger.info(f"[Mixed] 🚀 备用引擎 ({self.backup.get_engine_name()}) 后台启动")
                backup_result = await self.backup.transcribe(audio_data)
                logger.info(f"[Mixed] ✅ 备用引擎完成: {backup_result.text[:50]}...")
            except Exception as e:
                logger.error(f"[Mixed] ❌ 备用引擎失败: {e}")
                backup_error = e
            finally:
                backup_done.set()

        asyncio.create_task(backup_task())

        # 2. 主引擎重试循环
        max_retries = 2
        primary_last_error = None

        for attempt in range(max_retries + 1):
            # 重试前检查备用引擎
            if attempt > 0:
                logger.warning(f"[Mixed] ⏳ 主引擎第 {attempt} 次重试前，检查备用引擎...")

                if backup_done.is_set():
                    if backup_result:
                        logger.info(f"[Mixed] ✅ 发现备用引擎已完成，立即使用")
                        return backup_result
                    else:
                        logger.warning(f"[Mixed] ⚠️ 备用引擎也失败了，继续主引擎重试")

                await asyncio.sleep(self.retry_delay)

            # 尝试主引擎
            try:
                logger.info(f"[Mixed] 🔄 主引擎第 {attempt + 1} 次尝试")
                result = await self.primary.transcribe(audio_data)
                logger.info(f"[Mixed] ✅ 主引擎转录成功: {result.text[:50]}...")
                return result
            except Exception as e:
                logger.error(f"[Mixed] ❌ 主引擎第 {attempt + 1} 次失败: {e}")
                primary_last_error = e

        # 3. 主引擎全部失败，等待备用引擎
        logger.warning(f"[Mixed] ⚠️ 主引擎全部失败，等待备用引擎...")
        await backup_done.wait()

        if backup_result:
            logger.info(f"[Mixed] ✅ 使用备用引擎结果: {backup_result.text[:50]}...")
            return backup_result
        else:
            logger.error(f"[Mixed] ❌ 所有引擎都失败")
            logger.error(f"[Mixed]    主引擎错误: {primary_last_error}")
            logger.error(f"[Mixed]    备用引擎错误: {backup_error}")
            raise Exception(
                f"所有引擎都失败 - "
                f"主引擎: {primary_last_error}, "
                f"备用引擎: {backup_error}"
            )

    async def _transcribe_with_logging(
        self,
        engine: ASREngine,
        audio_data: bytes,
        label: str
    ) -> TranscriptResult:
        """带日志的转录"""
        try:
            logger.info(f"[Race] 🚀 {label} ({engine.get_engine_name()}) 任务启动")
            result = await engine.transcribe(audio_data)
            logger.info(f"[Race] ✅ {label} 转录成功: {result.text[:50]}...")
            return result
        except Exception as e:
            logger.error(f"[Race] ❌ {label} 转录失败: {e}")
            raise
