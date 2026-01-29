# 多引擎兜底架构设计

> **文档版本**：v1.0
> **创建日期**：2026-01-21
> **创建者**：架构师 Architect
> **参考来源**：PushToTalk Rust 实现 + 豆包/阿里云官方文档
> **目标读者**：后端工程师

---

## 📋 目录

1. [架构概览](#1-架构概览)
2. [接口抽象层设计](#2-接口抽象层设计)
3. [竞速策略设计](#3-竞速策略设计)
4. [配置管理规范](#4-配置管理规范)
5. [错误处理规范](#5-错误处理规范)
6. [性能优化建议](#6-性能优化建议)
7. [Python 实现框架](#7-python-实现框架)
8. [日志与监控](#8-日志与监控)

---

## 1. 架构概览

### 1.1 设计目标

| 目标 | 描述 | 优先级 |
|------|------|--------|
| **高可用性** | 主引擎失败时自动切换到备用引擎 | P0 |
| **低延迟** | 主备并行竞速，取最先返回结果 | P0 |
| **可扩展** | 支持动态添加新的 ASR 引擎 | P1 |
| **可观测** | 完整的日志和指标监控 | P1 |

### 1.2 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         ASR Service Layer                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │            MultiEngineASRService                        │   │
│   │                                                         │   │
│   │  - transcribe_with_fallback()  # 主备切换策略           │   │
│   │  - transcribe_with_race()     # 并行竞速策略            │   │
│   └────────────┬────────────────────────────────────────┬───┘   │
│                │                                        │         │
│        ┌───────▼────────┐                      ┌───────▼───────┐ │
│        │ Primary Engine │                      │Backup Engine  │ │
│        │   (豆包)       │                      │  (阿里云 Qwen)│ │
│        └────────────────┘                      └───────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Engine Abstraction Layer                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   interface ASREngine(ABC):                                      │
│       - async transcribe(audio_data: bytes) -> TranscriptResult │
│       - get_engine_name() -> str                                 │
│       - get_engine_type() -> EngineType                          │
│                                                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   │ DoubaoEngine │  │ QwenEngine   │  │SenseVoice... │         │
│   └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 引擎对比

| 特性 | 豆包 ASR (主) | 阿里云 Qwen (备) |
|------|--------------|------------------|
| **API URL** | `openspeech.bytedance.com` | `dashscope.aliyuncs.com` |
| **认证方式** | App ID + Access Token | Bearer Token (API Key) |
| **音频传递** | Base64 | Base64 |
| **超时时间** | 30s | 30s |
| **重试次数** | 2 次 | 2 次 |
| **词级时间戳** | ✅ 支持 | ✅ 支持 |
| **并发限制** | 2 | - |

---

## 2. 接口抽象层设计

### 2.1 抽象基类

```python
from abc import ABC, abstractmethod
from enum import Enum
from typing import Optional, List
from dataclasses import dataclass
from datetime import datetime

class EngineType(Enum):
    """引擎类型"""
    DOUBAO = "doubao"
    QWEN = "qwen"
    SENSEVOICE = "sensevoice"

@dataclass
class TranscriptWord:
    """词级别转录结果"""
    text: str
    start_time: int  # 毫秒
    end_time: int    # 毫秒
    confidence: float = 1.0

@dataclass
class TranscriptResult:
    """转录结果"""
    text: str                      # 完整文本
    duration: int                  # 音频时长（毫秒）
    words: List[TranscriptWord]    # 词级时间戳
    engine: EngineType             # 使用的引擎
    log_id: str                    # 请求日志 ID
    timestamp: datetime            # 转录时间

class ASREngine(ABC):
    """
    ASR 引擎抽象基类

    所有 ASR 引擎必须实现此接口，确保统一调用方式
    """

    def __init__(
        self,
        timeout: float = 30.0,
        max_retries: int = 2,
        retry_delay: float = 0.5,
        hotwords: Optional[List[str]] = None
    ):
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.hotwords = hotwords or []

    @abstractmethod
    async def transcribe(self, audio_data: bytes) -> TranscriptResult:
        """
        转录音频数据

        Args:
            audio_data: 音频二进制数据

        Returns:
            TranscriptResult: 转录结果

        Raises:
            TimeoutError: 请求超时
            HTTPError: HTTP 错误
            ValueError: 响应解析失败
        """
        pass

    @abstractmethod
    def get_engine_name(self) -> str:
        """获取引擎名称"""
        pass

    @abstractmethod
    def get_engine_type(self) -> EngineType:
        """获取引擎类型"""
        pass

    def update_hotwords(self, hotwords: List[str]):
        """热更新词库"""
        self.hotwords = hotwords
```

### 2.2 豆包引擎实现

```python
import httpx
import uuid
import base64
import json

class DoubaoASREngine(ASREngine):
    """豆包 ASR 引擎（极速版）"""

    API_URL = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash"
    RESOURCE_ID = "volc.bigasr.auc_turbo"

    def __init__(
        self,
        app_id: str,
        access_token: str,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.app_id = app_id
        self.access_token = access_token
        self.client = httpx.AsyncClient(timeout=self.timeout)

    async def transcribe(self, audio_data: bytes) -> TranscriptResult:
        """转录音频（带重试）"""
        last_error = None

        for attempt in range(self.max_retries + 1):
            try:
                return await self._transcribe_once(audio_data)
            except (httpx.TimeoutException, httpx.HTTPError, ValueError) as e:
                last_error = e
                if attempt < self.max_retries:
                    await asyncio.sleep(self.retry_delay)

        raise last_error

    async def _transcribe_once(self, audio_data: bytes) -> TranscriptResult:
        """单次转录请求"""
        # 构建请求体
        audio_base64 = base64.b64encode(audio_data).decode("utf-8")

        request_obj = {"model_name": "bigmodel"}

        if self.hotwords:
            hotwords_json = [{"word": w} for w in self.hotwords]
            context = json.dumps({"hotwords": hotwords_json})
            request_obj["corpus"] = {"context": context}

        request_body = {
            "user": {"uid": self.app_id},
            "audio": {"data": audio_base64},
            "request": request_obj
        }

        # 发送请求
        request_id = str(uuid.uuid4())

        response = await self.client.post(
            self.API_URL,
            headers={
                "X-Api-App-Key": self.app_id,
                "X-Api-Access-Key": self.access_token,
                "X-Api-Resource-Id": self.RESOURCE_ID,
                "X-Api-Request-Id": request_id,
                "X-Api-Sequence": "-1",
            },
            json=request_body
        )

        # 检查响应头
        status_code = response.headers.get("X-Api-Status-Code", "")
        api_message = response.headers.get("X-Api-Message", "")
        log_id = response.headers.get("X-Tt-Logid", "")

        if status_code != "20000000":
            raise ValueError(f"豆包 ASR 失败: code={status_code}, message={api_message}")

        # 解析响应体
        result_data = response.json()

        # 提取词级时间戳
        words = []
        for utt in result_data.get("result", {}).get("utterances", []):
            for w in utt.get("words", []):
                words.append(TranscriptWord(
                    text=w["text"],
                    start_time=w["start_time"],
                    end_time=w["end_time"],
                    confidence=w.get("confidence", 100) / 100.0
                ))

        return TranscriptResult(
            text=result_data["result"]["text"],
            duration=result_data["audio_info"]["duration"],
            words=words,
            engine=EngineType.DOUBAO,
            log_id=log_id,
            timestamp=datetime.now()
        )

    def get_engine_name(self) -> str:
        return "豆包 ASR"

    def get_engine_type(self) -> EngineType:
        return EngineType.DOUBAO
```

### 2.3 阿里云 Qwen 引擎实现

```python
class QwenASREngine(ASREngine):
    """阿里云 Qwen ASR 引擎"""

    API_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
    MODEL = "qwen3-asr-flash"

    def __init__(
        self,
        api_key: str,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=self.timeout)

    async def transcribe(self, audio_data: bytes) -> TranscriptResult:
        """转录音频（带重试）"""
        last_error = None

        for attempt in range(self.max_retries + 1):
            try:
                return await self._transcribe_once(audio_data)
            except (httpx.TimeoutException, httpx.HTTPError, ValueError) as e:
                last_error = e
                if attempt < self.max_retries:
                    await asyncio.sleep(self.retry_delay)

        raise last_error

    async def _transcribe_once(self, audio_data: bytes) -> TranscriptResult:
        """单次转录请求"""
        audio_base64 = base64.b64encode(audio_data).decode("utf-8")

        # 词库用顿号分隔
        corpus_text = "、".join(self.hotwords) if self.hotwords else ""

        request_body = {
            "model": self.MODEL,
            "input": {
                "messages": [
                    {
                        "role": "system",
                        "content": [{"text": corpus_text}] if corpus_text else []
                    },
                    {
                        "role": "user",
                        "content": [{"audio": f"data:audio/wav;base64,{audio_base64}"}]
                    }
                ]
            },
            "parameters": {
                "result_format": "message",
                "enable_itn": False,
                "disfluency_removal": True,
                "language": "zh"
            }
        }

        response = await self.client.post(
            self.API_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json=request_body
        )

        if not response.is_success:
            error_text = response.text
            raise ValueError(f"Qwen API 失败 ({response.status_code}): {error_text}")

        result_data = response.json()

        # 解析文本
        text = result_data["output"]["choices"][0]["message"]["content"][0]["text"]

        # Qwen 不返回词级时间戳，生成简单的词级结构
        words = [TranscriptWord(
            text=text,
            start_time=0,
            end_time=0,  # Qwen 不支持
            confidence=1.0
        )]

        return TranscriptResult(
            text=text,
            duration=0,  # Qwen 响应不包含时长
            words=words,
            engine=EngineType.QWEN,
            log_id="",
            timestamp=datetime.now()
        )

    def get_engine_name(self) -> str:
        return "阿里云 Qwen ASR"

    def get_engine_type(self) -> EngineType:
        return EngineType.QWEN
```

---

## 3. 竞速策略设计

### 3.1 主备切换策略（Fallback）

**适用场景**：节省备用引擎配额

```python
import asyncio
from typing import Tuple

class MultiEngineASRService:
    """多引擎 ASR 服务"""

    def __init__(
        self,
        primary_engine: ASREngine,
        backup_engine: ASREngine
    ):
        self.primary = primary_engine
        self.backup = backup_engine

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

        Returns:
            TranscriptResult: 转录结果

        Raises:
            Exception: 所有引擎都失败
        """
        logger.info(f"启动主备切换转录, 音频大小: {len(audio_data)} bytes")

        # 1. 尝试主引擎
        try:
            logger.info(f"🔄 尝试主引擎: {self.primary.get_engine_name()}")
            result = await self.primary.transcribe(audio_data)
            logger.info(f"✅ 主引擎转录成功: {result.text[:50]}...")
            return result
        except Exception as e:
            logger.warning(f"⚠️ 主引擎失败: {e}")

        # 2. 切换到备用引擎
        try:
            logger.info(f"🔄 切换到备用引擎: {self.backup.get_engine_name()}")
            result = await self.backup.transcribe(audio_data)
            logger.info(f"✅ 备用引擎转录成功: {result.text[:50]}...")

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
            logger.error(f"❌ 备用引擎也失败: {e}")
            raise Exception(
                f"所有引擎都失败 - "
                f"主引擎: {self.primary.get_engine_name()}, "
                f"备用引擎: {self.backup.get_engine_name()}"
            )
```

### 3.2 并行竞速策略（Race）

**适用场景**：追求最低延迟

```python
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

    Returns:
        TranscriptResult: 最先返回的转录结果
    """
    logger.info(f"启动并行竞速转录, 音频大小: {len(audio_data)} bytes")

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
            logger.error(f"任务失败: {e}")

    if result:
        logger.info(f"✅ 竞速获胜: {result.engine.value}")
        return result
    else:
        raise Exception("所有引擎都失败")

async def _transcribe_with_logging(
    self,
    engine: ASREngine,
    audio_data: bytes,
    label: str
) -> TranscriptResult:
    """带日志的转录"""
    try:
        logger.info(f"🚀 {label} ({engine.get_engine_name()}) 任务启动")
        result = await engine.transcribe(audio_data)
        logger.info(f"✅ {label} 转录成功: {result.text[:50]}...")
        return result
    except Exception as e:
        logger.error(f"❌ {label} 转录失败: {e}")
        raise
```

### 3.3 混合策略（PushToTalk 实战方案）

**优势**：
- 主引擎带重试，提高成功率
- 备用引擎并行运行，节省时间
- 主引擎重试期间检查备用引擎结果

```python
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

    Returns:
        TranscriptResult: 转录结果
    """
    logger.info(f"启动混合策略转录, 音频大小: {len(audio_data)} bytes")

    # 1. 启动备用引擎任务
    backup_result: Optional[TranscriptResult] = None
    backup_error: Optional[Exception] = None
    backup_done = asyncio.Event()

    async def backup_task():
        nonlocal backup_result, backup_error
        try:
            logger.info(f"🚀 备用引擎 ({self.backup.get_engine_name()}) 后台启动")
            backup_result = await self.backup.transcribe(audio_data)
            logger.info(f"✅ 备用引擎完成: {backup_result.text[:50]}...")
        except Exception as e:
            logger.error(f"❌ 备用引擎失败: {e}")
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
            logger.warning(f"⏳ 主引擎第 {attempt} 次重试前，检查备用引擎...")

            if backup_done.is_set():
                if backup_result:
                    logger.info(f"✅ 发现备用引擎已完成，立即使用")
                    return backup_result
                else:
                    logger.warning(f"⚠️ 备用引擎也失败了，继续主引擎重试")

            await asyncio.sleep(self.retry_delay)

        # 尝试主引擎
        try:
            logger.info(f"🔄 主引擎第 {attempt + 1} 次尝试")
            result = await self.primary.transcribe(audio_data)
            logger.info(f"✅ 主引擎转录成功: {result.text[:50]}...")
            return result
        except Exception as e:
            logger.error(f"❌ 主引擎第 {attempt + 1} 次失败: {e}")
            primary_last_error = e

    # 3. 主引擎全部失败，等待备用引擎
    logger.warning(f"⚠️ 主引擎全部失败，等待备用引擎...")
    await backup_done.wait()

    if backup_result:
        logger.info(f"✅ 使用备用引擎结果: {backup_result.text[:50]}...")
        return backup_result
    else:
        logger.error(f"❌ 所有引擎都失败")
        logger.error(f"   主引擎错误: {primary_last_error}")
        logger.error(f"   备用引擎错误: {backup_error}")
        raise Exception(
            f"所有引擎都失败 - "
            f"主引擎: {primary_last_error}, "
            f"备用引擎: {backup_error}"
        )
```

---

## 4. 配置管理规范

### 4.1 环境变量配置

```bash
# .env 文件（添加到 .gitignore）

# ========== 豆包 ASR（主引擎） ==========
DOUBAO_APP_ID=3850845308
DOUBAO_ACCESS_TOKEN=iowKNMA-P7ZjwTWKcVoRu_H8pQavteyy
DOUBAO_SECRET_KEY=Ng4mAZu6DQ0kAmA04D1SHXJzmjHZloZj

# ========== 阿里云 Qwen（备用引擎） ==========
ALIYUN_API_KEY=sk-2f39e33d6b644f3a882811d3049a0217

# ========== 超时和重试配置 ==========
ASR_TIMEOUT=30          # 单次请求超时（秒）
ASR_MAX_RETRIES=2       # 最大重试次数
ASR_RETRY_DELAY=0.5     # 重试间隔（秒）

# ========== 策略选择 ==========
ASR_STRATEGY=fallback   # fallback / race / mixed
```

### 4.2 Pydantic 配置模型

```python
from pydantic_settings import BaseSettings
from typing import List

class ASRSettings(BaseSettings):
    """ASR 配置"""

    # 豆包配置
    doubao_app_id: str
    doubao_access_token: str
    doubao_secret_key: str = ""

    # 阿里云配置
    aliyun_api_key: str

    # 超时和重试
    asr_timeout: float = 30.0
    asr_max_retries: int = 2
    asr_retry_delay: float = 0.5

    # 策略
    asr_strategy: str = "fallback"  # fallback / race / mixed

    # 热词
    hotwords: List[str] = ["豆包", "ASR", "播客", "人工智能"]

    class Config:
        env_file = ".env"

# 使用
settings = ASRSettings()
```

### 4.3 服务工厂模式

```python
class ASREngineFactory:
    """ASR 引擎工厂"""

    @staticmethod
    def create_primary(settings: ASRSettings) -> ASREngine:
        """创建主引擎"""
        return DoubaoASREngine(
            app_id=settings.doubao_app_id,
            access_token=settings.doubao_access_token,
            timeout=settings.asr_timeout,
            max_retries=settings.asr_max_retries,
            retry_delay=settings.asr_retry_delay,
            hotwords=settings.hotwords
        )

    @staticmethod
    def create_backup(settings: ASRSettings) -> ASREngine:
        """创建备用引擎"""
        return QwenASREngine(
            api_key=settings.aliyun_api_key,
            timeout=settings.asr_timeout,
            max_retries=settings.asr_max_retries,
            retry_delay=settings.asr_retry_delay,
            hotwords=settings.hotwords
        )

    @staticmethod
    def create_service(settings: ASRSettings) -> MultiEngineASRService:
        """创建多引擎服务"""
        primary = ASREngineFactory.create_primary(settings)
        backup = ASREngineFactory.create_backup(settings)

        return MultiEngineASRService(
            primary_engine=primary,
            backup_engine=backup
        )
```

---

## 5. 错误处理规范

### 5.1 自定义异常类

```python
class ASRError(Exception):
    """ASR 基础异常"""
    pass

class ASRTimeoutError(ASRError):
    """ASR 超时"""
    pass

class ASRHTTPError(ASRError):
    """ASR HTTP 错误"""

    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"HTTP {status_code}: {message}")

class ASRParseError(ASRError):
    """ASR 响应解析失败"""
    pass

class ASREngineExhaustedError(ASRError):
    """所有引擎都失败"""

    def __init__(self, errors: dict):
        self.errors = errors
        super().__init__(f"所有引擎都失败: {errors}")
```

### 5.2 错误码映射

| 原始错误 | 映射错误码 | HTTP 状态 | 用户提示 |
|---------|-----------|----------|---------|
| 豆包超时 (30s) | ASR_PRIMARY_TIMEOUT | 503 | "转录服务繁忙，已切换备用引擎" |
| 豆包 500/503 | ASR_PRIMARY_ERROR | 503 | "转录服务异常，已切换备用引擎" |
| 豆包 400 | INVALID_AUDIO_FORMAT | 400 | "音频格式不支持" |
| 豆包 401 | ASR_AUTH_FAILED | 503 | "服务认证失败，请联系技术支持" |
| 双引擎均失败 | ASR_SERVICE_UNAVAILABLE | 503 | "转录服务暂时不可用，请稍后重试" |
| 网络断开 | NETWORK_ERROR | 503 | "网络连接失败，请检查网络" |

### 5.3 重试决策树

```
收到错误
    │
    ├─ 超时 (Timeout) → ✅ 重试
    ├─ 500/503 → ✅ 重试
    ├─ 网络异常 → ✅ 重试
    ├─ 400 (参数错误) → ❌ 不重试，返回错误
    ├─ 401 (认证失败) → ❌ 不重试，返回错误
    └─ 403/404 → ❌ 不重试，返回错误
```

---

## 6. 性能优化建议

### 6.1 连接池管理

```python
# 使用共享连接池
class ConnectionPoolManager:
    """连接池管理器"""

    _instance = None
    _limits = httpx.Limits(
        max_connections=10,      # 最大连接数
        max_keepalive_connections=5  # 保持活跃的连接数
    )

    @classmethod
    def get_client(cls, timeout: float = 30.0) -> httpx.AsyncClient:
        """获取共享客户端"""
        if cls._instance is None:
            cls._instance = httpx.AsyncClient(
                limits=cls._limits,
                timeout=timeout
            )
        return cls._instance
```

### 6.2 并发控制

```python
import asyncio

classConcurrencyLimiter:
    """并发限制器"""

    def __init__(self, max_concurrent: int = 2):
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def transcribe_batch(
        self,
        service: MultiEngineASRService,
        audio_list: List[bytes]
    ) -> List[TranscriptResult]:
        """批量转录（控制并发）"""
        async def transcribe_one(audio):
            async with self.semaphore:
                return await service.transcribe_with_fallback(audio)

        results = await asyncio.gather(
            *[transcribe_one(audio) for audio in audio_list]
        )
        return results
```

### 6.3 缓存策略

```python
from functools import lru_cache
import hashlib

class TranscriptionCache:
    """转录缓存（基于音频内容哈希）"""

    def __init__(self, ttl: int = 3600):
        self.cache = {}
        self.ttl = ttl

    def _hash_audio(self, audio_data: bytes) -> str:
        """计算音频哈希"""
        return hashlib.md5(audio_data).hexdigest()

    async def get(self, audio_data: bytes) -> Optional[TranscriptResult]:
        """获取缓存"""
        key = self._hash_audio(audio_data)
        if key in self.cache:
            result, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                logger.info(f"✅ 缓存命中: {key}")
                return result
        return None

    async def set(self, audio_data: bytes, result: TranscriptResult):
        """设置缓存"""
        key = self._hash_audio(audio_data)
        self.cache[key] = (result, time.time())
```

---

## 7. Python 实现框架

### 7.1 完整服务类

```python
# backend/app/services/asr_service.py

import logging
from typing import Optional
from .config import ASRSettings
from .engines import DoubaoASREngine, QwenASREngine, MultiEngineASRService

logger = logging.getLogger(__name__)

class ASRService:
    """ASR 服务入口"""

    def __init__(self, settings: ASRSettings):
        self.settings = settings
        self.service = ASREngineFactory.create_service(settings)

    async def transcribe(
        self,
        audio_data: bytes,
        strategy: Optional[str] = None
    ) -> TranscriptResult:
        """
        转录音频

        Args:
            audio_data: 音频二进制数据
            strategy: 策略选择（fallback/race/mixed），默认使用配置

        Returns:
            TranscriptResult: 转录结果

        Raises:
            ASREngineExhaustedError: 所有引擎都失败
        """
        strategy = strategy or self.settings.asr_strategy

        logger.info(f"开始转录, 策略={strategy}, 音频大小={len(audio_data)}")

        try:
            if strategy == "fallback":
                result = await self.service.transcribe_with_fallback(audio_data)
            elif strategy == "race":
                result = await self.service.transcribe_with_race(audio_data)
            elif strategy == "mixed":
                result = await self.service.transcribe_with_mixed_strategy(audio_data)
            else:
                raise ValueError(f"未知策略: {strategy}")

            logger.info(f"转录完成, 引擎={result.engine.value}, 文本长度={len(result.text)}")
            return result

        except Exception as e:
            logger.error(f"转录失败: {e}")
            raise
```

### 7.2 FastAPI 集成

```python
# backend/app/api/routes/asr.py

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from ..services.asr_service import ASRService
from ..config import get_asr_settings

router = APIRouter()

@router.post("/api/v1/asr/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    asr_service: ASRService = Depends(create_asr_service)
):
    """
    转录音频文件

    Returns:
        {
            "success": true,
            "data": {
                "text": "转录文本",
                "duration": 12345,
                "engine": "doubao",
                "words": [...]
            }
        }
    """
    try:
        # 读取音频
        audio_data = await file.read()

        # 转录
        result = await asr_service.transcribe(audio_data)

        return {
            "success": True,
            "data": {
                "text": result.text,
                "duration": result.duration,
                "engine": result.engine.value,
                "words": [
                    {
                        "text": w.text,
                        "start_time": w.start_time,
                        "end_time": w.end_time
                    }
                    for w in result.words
                ]
            }
        }

    except Exception as e:
        logger.error(f"转录接口错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 8. 日志与监控

### 8.1 结构化日志

```python
import structlog

logger = structlog.get_logger()

# 转录开始
logger.info(
    "asr_transcription_start",
    engine=engine.get_engine_name(),
    strategy="fallback",
    audio_size=len(audio_data),
    episode_id=episode_id
)

# 引擎切换
logger.info(
    "asr_engine_switch",
    from_engine="doubao",
    to_engine="qwen",
    reason="timeout",
    duration_ms=125
)

# 转录完成
logger.info(
    "asr_transcription_complete",
    engine=result.engine.value,
    text_length=len(result.text),
    duration_ms=result.duration,
    log_id=result.log_id
)
```

### 8.2 指标监控

```python
from prometheus_client import Counter, Histogram, Gauge

# 指标定义
asr_requests_total = Counter(
    'asr_requests_total',
    'ASR 请求总数',
    ['engine', 'status']
)

asr_duration_seconds = Histogram(
    'asr_duration_seconds',
    'ASR 请求耗时',
    ['engine']
)

asr_engine_switches_total = Counter(
    'asr_engine_switches_total',
    'ASR 引擎切换次数',
    ['from_engine', 'to_engine']
)

# 使用
asr_requests_total.labels(engine='doubao', status='success').inc()
asr_duration_seconds.labels(engine='doubao').observe(1.25)
asr_engine_switches_total.labels(from_engine='doubao', to_engine='qwen').inc()
```

### 8.3 额度监控

```python
class QuotaMonitor:
    """豆包额度监控"""

    def __init__(self, quota_hours: float = 20.0):
        self.quota_hours = quota_hours
        self.used_hours = 0.0

    def record_usage(self, audio_duration_seconds: float):
        """记录使用时长"""
        self.used_hours += audio_duration_seconds / 3600

        # 额度警告
        usage_rate = self.used_hours / self.quota_hours
        if usage_rate > 0.8:
            logger.warning(f"⚠️ 豆包额度使用率: {usage_rate*100:.1f}%")

    def is_quota_exceeded(self) -> bool:
        """检查是否超限"""
        return self.used_hours >= self.quota_hours
```

---

## 9. 测试建议

### 9.1 单元测试

```python
# tests/test_asr_service.py

import pytest

@pytest.mark.asyncio
async def test_fallback_success():
    """测试主备切换成功"""
    service = create_mock_service(primary_should_fail=True)
    result = await service.transcribe_with_fallback(audio_data)
    assert result.engine == EngineType.QWEN

@pytest.mark.asyncio
async def test_both_engines_fail():
    """测试双引擎失败"""
    service = create_mock_service(both_should_fail=True)
    with pytest.raises(ASREngineExhaustedError):
        await service.transcribe_with_fallback(audio_data)

@pytest.mark.asyncio
async def test_race_strategy():
    """测试竞速策略"""
    service = create_mock_service()
    result = await service.transcribe_with_race(audio_data)
    assert result.engine in [EngineType.DOUBAO, EngineType.QWEN]
```

### 9.2 集成测试

```python
@pytest.mark.asyncio
async def test_real_doubao_api():
    """真实豆包 API 测试"""
    client = DoubaoASREngine(
        app_id=settings.doubao_app_id,
        access_token=settings.doubao_access_token
    )

    with open("test_audio.mp3", "rb") as f:
        audio_data = f.read()

    result = await client.transcribe(audio_data)
    assert result.text
    assert result.engine == EngineType.DOUBAO
```

---

## 10. 与现有文档的对应关系

| 文档 | 对应内容 |
|------|---------|
| `_shared/05_asr_switching_spec.md` | 本文档的竞速策略实现 |
| `_shared/07_doubao_asr_implementation.md` | 本文档的豆包引擎实现 |
| `_shared/11_asr_config.md` | 本文档的配置管理 |

---

## ✅ 下一步行动

### 后端工程师需要实现：
1. [ ] 创建 `backend/app/services/asr/` 目录
2. [ ] 实现 `ASREngine` 抽象基类
3. [ ] 实现 `DoubaoASREngine`（参考 `07_doubao_asr_implementation.md`）
4. [ ] 实现 `QwenASREngine`
5. [ ] 实现 `MultiEngineASRService`（三种策略）
6. [ ] 配置环境变量和 Pydantic Settings
7. [ ] 集成到 FastAPI 接口
8. [ ] 编写单元测试

### 测试计划：
1. 使用《测试播客列表.md》中的 4 个播客
2. 验证主备切换逻辑
3. 验证竞速策略
4. 验证词级时间戳准确性

---

**文档状态**：✅ v1.0 完成
**参考实现**：PushToTalk `src-tauri/src/asr/race_strategy.rs`
