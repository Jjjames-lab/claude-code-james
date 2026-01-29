# 豆包 ASR 集成实现指南

> **文档版本**：v2.0
> **最后更新**：2026-01-20
> **参考来源**：PushToTalk Rust 实现 + 豆包官方文档
> **目标读者**：后端工程师

---

## 📋 目录

1. [API 概览](#api-概览)
2. [认证方式](#认证方式)
3. [极速版实现（≤ 2小时）](#极速版实现≤-2-小时)
4. [标准版实现（> 2小时）](#标准版实现-2-小时)
5. [错误处理](#错误处理)
6. [智能分流策略](#智能分流策略)
7. [最佳实践](#最佳实践)
8. [集成示例](#集成示例)

---

## 1️⃣ API 概览

### 版本对比

| 特性 | 极速版 | 标准版 |
|------|----------------------|------------------|
| **API URL** | `/api/v3/auc/bigmodel/recognize/flash` | `/api/v3/auc/bigmodel/submit` + `/query` |
| **请求方式** | 一次请求返回结果 | submit + query 轮询 |
| **音频时长** | ≤ 2小时 | ≥ 5小时 |
| **音频大小** | ≤ 100MB | 更大 |
| **音频传递** | Base64 / URL | URL only |
| **资源 ID** | `volc.bigasr.auc_turbo` | `volc.seedasr.auc` |
| **响应速度** | 极快 | 需要轮询等待 |

### 基本信息

| 项目 | 值 |
|------|-----|
| **服务商** | 豆包语音（字节跳动） |
| **接口名称** | 录音文件识别（极速版 + 标准版） |
| **请求方式** | `POST` |
| **音频格式** | WAV / MP3 / OGG OPUS |

---

## 3️⃣ 极速版实现（≤ 2小时）

### 适用场景
- 音频时长 ≤ 2小时
- 需要快速返回结果
- 支持词级时间戳

### 数据模型

```python
import asyncio
import base64
import json
import uuid
from typing import List, Dict, Any, Optional
import httpx
from pydantic import BaseModel

# ==================== 数据模型 ====================

class TranscriptWord(BaseModel):
    """词级别的转录结果"""
    text: str
    start_time: int  # 毫秒
    end_time: int    # 毫秒
    confidence: int

class TranscriptUtterance(BaseModel):
    """句子级别的转录结果"""
    text: str
    start_time: int  # 毫秒
    end_time: int    # 毫秒
    words: List[TranscriptWord]

class TranscriptResult(BaseModel):
    """完整的转录结果"""
    text: str                    # 完整文本
    duration: int                # 音频时长（毫秒）
    utterances: List[TranscriptUtterance]  # 句子列表
    log_id: str                  # 请求日志 ID

# ==================== 豆包 ASR 客户端 ====================

class DoubaoASRClient:
    """
    豆包 ASR 极速版客户端

    基于 PushToTalk Rust 实现，适配 Python FastAPI
    """

    def __init__(
        self,
        app_id: str,
        access_token: str,
        timeout: float = 30.0,
        hotwords: Optional[List[str]] = None
    ):
        """
        初始化客户端

        Args:
            app_id: 豆包 APP ID
            access_token: 豆包 Access Token
            timeout: 请求超时时间（秒）
            hotwords: 热词列表，提升特定词识别准确率
        """
        self.app_id = app_id
        self.access_token = access_token
        self.timeout = timeout
        self.hotwords = hotwords or []
        self.base_url = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash"

    def _build_headers(self) -> Dict[str, str]:
        """构建请求头"""
        return {
            "X-Api-App-Key": self.app_id,
            "X-Api-Access-Key": self.access_token,
            "X-Api-Resource-Id": "volc.bigasr.auc_turbo",
            "X-Api-Request-Id": str(uuid.uuid4()),
            "X-Api-Sequence": "-1",
        }

    def _build_request_body(self, audio_data: bytes) -> Dict[str, Any]:
        """构建请求体"""
        # Base64 编码音频数据
        audio_base64 = base64.b64encode(audio_data).decode("utf-8")

        # 构建热词配置
        request_obj = {"model_name": "bigmodel"}

        if self.hotwords:
            hotwords_json = [{"word": w} for w in self.hotwords]
            context = json.dumps({"hotwords": hotwords_json})
            request_obj["corpus"] = {"context": context}

        # 完整请求体
        return {
            "user": {"uid": self.app_id},
            "audio": {"data": audio_base64},
            "request": request_obj
        }

    async def transcribe(
        self,
        audio_data: bytes,
        retry_count: int = 2,
        retry_delay: float = 0.5
    ) -> TranscriptResult:
        """
        转录音频数据

        Args:
            audio_data: 音频文件的二进制数据
            retry_count: 失败重试次数
            retry_delay: 重试间隔（秒）

        Returns:
            TranscriptResult: 转录结果

        Raises:
            httpx.TimeoutException: 请求超时
            httpx.HTTPError: HTTP 错误
            ValueError: 响应解析失败
        """
        headers = self._build_headers()
        request_body = self._build_request_body(audio_data)

        last_error = None

        # 重试循环
        for attempt in range(retry_count + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        self.base_url,
                        headers=headers,
                        json=request_body
                    )

                    # 检查响应头状态码
                    status_code = response.headers.get("X-Api-Status-Code", "")
                    api_message = response.headers.get("X-Api-Message", "")
                    log_id = response.headers.get("X-Tt-Logid", "")

                    if status_code != "20000000":
                        raise ValueError(
                            f"豆包 ASR 失败: code={status_code}, message={api_message}"
                        )

                    # 解析响应体
                    result_data = response.json()

                    # 提取词级别时间戳
                    utterances = []
                    for utt in result_data.get("result", {}).get("utterances", []):
                        words = [
                            TranscriptWord(
                                text=w["text"],
                                start_time=w["start_time"],
                                end_time=w["end_time"],
                                confidence=w.get("confidence", 0)
                            )
                            for w in utt.get("words", [])
                        ]

                        utterances.append(
                            TranscriptUtterance(
                                text=utt["text"],
                                start_time=utt["start_time"],
                                end_time=utt["end_time"],
                                words=words
                            )
                        )

                    return TranscriptResult(
                        text=result_data["result"]["text"],
                        duration=result_data["audio_info"]["duration"],
                        utterances=utterances,
                        log_id=log_id
                    )

            except httpx.TimeoutException as e:
                last_error = e
                print(f"豆包 ASR 超时（尝试 {attempt + 1}/{retry_count + 1}）")

            except (httpx.HTTPError, ValueError) as e:
                last_error = e
                print(f"豆包 ASR 错误（尝试 {attempt + 1}/{retry_count + 1}）: {e}")

            # 重试前等待
            if attempt < retry_count:
                await asyncio.sleep(retry_delay)

        # 所有重试都失败
        raise last_error or Exception("豆包 ASR 转录失败")

    def update_hotwords(self, hotwords: List[str]):
        """更新热词列表"""
        self.hotwords = hotwords


# ==================== 使用示例 ====================

async def main():
    """示例：转录音频文件"""
    # 初始化客户端（使用环境变量中的 API Key）
    client = DoubaoASRClient(
        app_id="3850845308",
        access_token="iowKNMA-P7ZjwTWKcVoRu_H8pQavteyy",
        hotwords=["豆包", "ASR", "播客"]
    )

    # 读取音频文件
    with open("test_audio.mp3", "rb") as f:
        audio_data = f.read()

    # 转录
    result = await client.transcribe(audio_data)

    # 打印结果
    print(f"转录文本: {result.text}")
    print(f"音频时长: {result.duration / 1000:.2f} 秒")
    print(f"句子数量: {len(result.utterances)}")
    print(f"Log ID: {result.log_id}")

    # 打印逐字稿
    for utt in result.utterances:
        print(f"[{utt.start_time/1000:.2f}s - {utt.end_time/1000:.2f}s] {utt.text}")
        for word in utt.words:
            print(f"  {word.start_time/1000:.2f}s: {word.text}")


if __name__ == "__main__":
    asyncio.run(main())
```

---

## 4️⃣ 标准版实现（> 2小时）

### 适用场景
- 音频时长 > 2小时（支持 ≥ 5小时）
- 需要处理超长播客
- 通过 URL 传递音频文件

### 工作流程

1. **Submit**：提交音频 URL → 获取 task_id
2. **Query**：轮询查询结果（每 2-5 秒）
3. **完成**：获取转录结果

### 完整实现

```python
import asyncio
import json
import uuid
from typing import List, Dict, Any, Optional
import httpx
from pydantic import BaseModel

# ==================== 标准版客户端 ====================

class DoubaoASRStandardClient:
    """
    豆包 ASR 标准版客户端（Submit + Query 模式）

    适用于 > 2小时的长音频
    """

    def __init__(
        self,
        app_id: str,
        access_token: str,
        timeout: float = 30.0,
        hotwords: Optional[List[str]] = None
    ):
        """
        初始化客户端

        Args:
            app_id: 豆包 APP ID
            access_token: 豆包 Access Token
            timeout: 请求超时时间（秒）
            hotwords: 热词列表
        """
        self.app_id = app_id
        self.access_token = access_token
        self.timeout = timeout
        self.hotwords = hotwords or []
        self.submit_url = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/submit"
        self.query_url = "https://openspeech.bytedance.com/api/v3/auc/bigmodel/query"

    def _build_headers(self, request_id: str) -> Dict[str, str]:
        """构建请求头"""
        return {
            "X-Api-App-Key": self.app_id,
            "X-Api-Access-Key": self.access_token,
            "X-Api-Resource-Id": "volc.seedasr.auc",  # 标准版资源 ID
            "X-Api-Request-Id": request_id,
            "X-Api-Sequence": "-1",
        }

    async def submit(
        self,
        audio_url: str,
        format: str = "mp3"
    ) -> str:
        """
        提交转录任务

        Args:
            audio_url: 音频文件的公网 URL（必须可访问）
            format: 音频格式（mp3/wav/ogg）

        Returns:
            task_id: 任务 ID，用于查询结果

        Raises:
            ValueError: 提交失败
        """
        request_id = str(uuid.uuid4())
        headers = self._build_headers(request_id)

        # 构建请求体
        request_obj = {"model_name": "bigmodel"}

        if self.hotwords:
            hotwords_json = [{"word": w} for w in self.hotwords]
            context = json.dumps({"hotwords": hotwords_json})
            request_obj["corpus"] = {"context": context}

        request_body = {
            "user": {"uid": self.app_id},
            "audio": {
                "url": audio_url,
                "format": format
            },
            "request": request_obj
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                self.submit_url,
                headers=headers,
                json=request_body
            )

            # 检查响应头状态码
            status_code = response.headers.get("X-Api-Status-Code", "")
            api_message = response.headers.get("X-Api-Message", "")

            if status_code != "20000000":
                raise ValueError(
                    f"豆包标准版提交失败: code={status_code}, message={api_message}"
                )

            return request_id  # 使用 request_id 作为 task_id

    async def query(self, task_id: str) -> Dict[str, Any]:
        """
        查询转录结果

        Args:
            task_id: 任务 ID

        Returns:
            转录结果字典

        Raises:
            ValueError: 查询失败
        """
        headers = self._build_headers(task_id)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                self.query_url,
                headers=headers,
                json={}  # query 请求体为空
            )

            status_code = response.headers.get("X-Api-Status-Code", "")
            api_message = response.headers.get("X-Api-Message", "")

            if status_code not in ["20000000", "20000001", "20000002"]:
                raise ValueError(
                    f"豆包标准版查询失败: code={status_code}, message={api_message}"
                )

            # 返回状态码和响应体
            result_data = response.json()
            return {
                "status_code": status_code,
                "message": api_message,
                "data": result_data
            }

    async def transcribe(
        self,
        audio_url: str,
        format: str = "mp3",
        poll_interval: float = 3.0,
        max_poll_time: float = 600.0
    ) -> TranscriptResult:
        """
        提交并轮询查询转录结果

        Args:
            audio_url: 音频文件的公网 URL
            format: 音频格式
            poll_interval: 轮询间隔（秒）
            max_poll_time: 最大轮询时间（秒）

        Returns:
            TranscriptResult: 转录结果
        """
        # 1. 提交任务
        task_id = await self.submit(audio_url, format)
        print(f"豆包标准版: 任务已提交, task_id={task_id}")

        # 2. 轮询查询
        start_time = asyncio.get_event_loop().time()

        while True:
            # 检查超时
            elapsed = asyncio.get_event_loop().time() - start_time
            if elapsed > max_poll_time:
                raise TimeoutError(f"轮询超时（{max_poll_time}秒）")

            # 查询结果
            result = await self.query(task_id)
            status_code = result["status_code"]

            # 判断状态
            if status_code == "20000000":  # 成功
                print(f"豆包标准版: 转录完成, 耗时 {elapsed:.1f}秒")

                # 解析结果（格式与极速版一致）
                data = result["data"]
                utterances = []
                for utt in data.get("result", {}).get("utterances", []):
                    words = [
                        TranscriptWord(
                            text=w["text"],
                            start_time=w["start_time"],
                            end_time=w["end_time"],
                            confidence=w.get("confidence", 0)
                        )
                        for w in utt.get("words", [])
                    ]

                    utterances.append(
                        TranscriptUtterance(
                            text=utt["text"],
                            start_time=utt["start_time"],
                            end_time=utt["end_time"],
                            words=words
                        )
                    )

                return TranscriptResult(
                    text=data["result"]["text"],
                    duration=data["audio_info"]["duration"],
                    utterances=utterances,
                    log_id=task_id
                )

            elif status_code in ["20000001", "20000002"]:  # 处理中 / 队列中
                print(f"豆包标准版: 处理中... ({elapsed:.1f}秒)")
                await asyncio.sleep(poll_interval)

            else:
                raise ValueError(f"未知状态码: {status_code}, message={result['message']}")


# ==================== 使用示例 ====================

async def main_standard():
    """标准版使用示例"""
    client = DoubaoASRStandardClient(
        app_id="3850845308",
        access_token="iowKNMA-P7ZjwTWKcVoRu_H8pQavteyy",
        hotwords=["豆包", "ASR", "播客"]
    )

    # 音频必须先上传到可访问的 URL（如 OSS/S3）
    audio_url = "https://your-bucket.oss-cn-beijing.aliyuncs.com/long-audio.mp3"

    # 转录（自动轮询）
    result = await client.transcribe(audio_url, format="mp3")

    print(f"转录文本: {result.text}")
    print(f"音频时长: {result.duration / 1000 / 60:.2f} 分钟")
```

---

## 5️⃣ 错误处理

### 错误码对照表

| 错误码 | 含义 | 处理建议 | 适用版本 |
|--------|------|---------|---------|
| `20000000` | 成功 | 正常处理 | 全部 |
| `20000001` | 正在处理中 | 继续轮询 | 标准版 |
| `20000002` | 任务在队列中 | 继续轮询 | 标准版 |
| `20000003` | 静音音频 | 提示用户音频无内容 | 全部 |
| `45000001` | 请求参数无效 | 检查参数格式 | 全部 |
| `45000002` | 空音频 | 检查音频文件是否损坏 | 全部 |
| `45000151` | 音频格式不正确 | 检查音频格式 | 全部 |
| `55000031` | 服务器繁忙 | 重试或切换备用引擎 | 全部 |
| `550XXXX` | 服务内部错误 | 重试或切换备用引擎 | 全部 |

### 重试策略

**极速版**：
```python
MAX_RETRIES = 2          # 最多重试 2 次
RETRY_DELAY = 0.5        # 重试间隔 500ms
TIMEOUT = 30.0           # 超时时间 30 秒
```

**标准版**：
```python
POLL_INTERVAL = 3.0      # 轮询间隔 3 秒
MAX_POLL_TIME = 600.0    # 最大轮询时间 10 分钟
```

---

## 6️⃣ 智能分流策略

### 自动选择引擎

根据音频时长自动选择极速版或标准版：

```python
import asyncio
from typing import Union
import httpx

class SmartDoubaoASR:
    """
    豆包 ASR 智能客户端

    根据音频时长自动选择极速版或标准版
    """

    def __init__(
        self,
        app_id: str,
        access_token: str,
        hotwords: Optional[List[str]] = None,
        # 极速版配置
        flash_timeout: float = 30.0,
        # 标准版配置
        standard_poll_interval: float = 3.0,
        standard_max_poll_time: float = 600.0
    ):
        self.app_id = app_id
        self.access_token = access_token
        self.hotwords = hotwords or []

        # 初始化两个客户端
        self.flash_client = DoubaoASRClient(
            app_id=app_id,
            access_token=access_token,
            timeout=flash_timeout,
            hotwords=hotwords
        )

        self.standard_client = DoubaoASRStandardClient(
            app_id=app_id,
            access_token=access_token,
            timeout=30.0,
            hotwords=hotwords
        )

        self.standard_poll_interval = standard_poll_interval
        self.standard_max_poll_time = standard_max_poll_time

    async def transcribe(
        self,
        audio_data: bytes = None,
        audio_url: str = None,
        format: str = "mp3",
        duration_seconds: int = None
    ) -> TranscriptResult:
        """
        智能转录：根据音频时长自动选择引擎

        Args:
            audio_data: 音频二进制数据（极速版）
            audio_url: 音频 URL（标准版）
            format: 音频格式
            duration_seconds: 音频时长（秒），用于判断使用哪个版本

        Returns:
            TranscriptResult: 转录结果
        """
        # 判断使用哪个版本
        use_standard = duration_seconds and duration_seconds > 7200  # > 2小时

        if use_standard:
            if not audio_url:
                raise ValueError("标准版需要提供 audio_url")

            print(f"⏰ 音频时长 {duration_seconds/60:.1f} 分钟，使用标准版")
            return await self.standard_client.transcribe(
                audio_url=audio_url,
                format=format,
                poll_interval=self.standard_poll_interval,
                max_poll_time=self.standard_max_poll_time
            )
        else:
            if not audio_data:
                raise ValueError("极速版需要提供 audio_data")

            print(f"⚡ 音频时长 {duration_seconds/60 if duration_seconds else 0:.1f} 分钟，使用极速版")
            return await self.flash_client.transcribe(audio_data)


# ==================== 使用示例 ====================

async def main_smart():
    """智能分流示例"""
    client = SmartDoubaoASR(
        app_id="3850845308",
        access_token="iowKNMA-P7ZjwTWKcVoRu_H8pQavteyy",
        hotwords=["豆包", "ASR", "播客"]
    )

    # 场景1：短音频（使用极速版）
    with open("short_audio.mp3", "rb") as f:
        audio_data = f.read()

    result1 = await client.transcribe(
        audio_data=audio_data,
        duration_seconds=1800  # 30分钟
    )

    # 场景2：长音频（使用标准版）
    result2 = await client.transcribe(
        audio_url="https://your-bucket.oss-cn-beijing.aliyuncs.com/long-audio.mp3",
        duration_seconds=10800  # 3小时
    )
```

---

## 7️⃣ 最佳实践

### 1. 音频上传（标准版必需）

标准版要求音频通过 URL 传递，需要先上传到对象存储：

```python
import oss2
import asyncio

class AudioUploader:
    """音频上传器（阿里云 OSS）"""

    def __init__(self, access_key_id: str, access_key_secret: str, bucket: str, endpoint: str):
        self.auth = oss2.Auth(access_key_id, access_key_secret)
        self.bucket = oss2.Bucket(self.auth, endpoint, bucket)

    async def upload_audio(self, audio_data: bytes, filename: str) -> str:
        """
        上传音频到 OSS

        Returns:
            音频的公网 URL
        """
        # 上传到 OSS
        self.bucket.put_object(filename, audio_data)

        # 生成公网 URL（假设 bucket 是公共读）
        url = f"https://{self.bucket.bucket_name}.{self.endpoint.replace('https://', '')}/{filename}"
        return url


# 使用示例
async def upload_and_transcribe():
    """上传并转录长音频"""
    # 1. 上传音频
    uploader = AudioUploader(
        access_key_id="your_access_key",
        access_key_secret="your_secret",
        bucket="your-bucket",
        endpoint="https://oss-cn-beijing.aliyuncs.com"
    )

    with open("long_audio.mp3", "rb") as f:
        audio_data = f.read()

    audio_url = await uploader.upload_audio(audio_data, "episodes/episode-123.mp3")

    # 2. 使用标准版转录
    client = DoubaoASRStandardClient(
        app_id="3850845308",
        access_token="iowKNMA-P7ZjwTWKcVoRu_H8pQavteyy"
    )

    result = await client.transcribe(audio_url)
    return result
```

### 2. 环境变量管理

使用 `.env` 文件存储敏感信息：

```bash
# .env
DOUBAO_APP_ID=3850845308
DOUBAO_ACCESS_TOKEN=iowKNMA-P7ZjwTWKcVoRu_H8pQavteyy
```

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    doubao_app_id: str
    doubao_access_token: str

    class Config:
        env_file = ".env"

settings = Settings()
```

### 2. 日志记录

```python
import logging

logger = logging.getLogger(__name__)

# 在 transcribe 方法中添加日志
logger.info(f"豆包 ASR: 开始转录，音频大小 {len(audio_data)} bytes")
logger.info(f"豆包 ASR: status_code={status_code}, message={api_message}")
logger.info(f"豆包 ASR: 转录完成，文本={result.text}")
```

### 3. 性能优化

**并发控制**（豆包限制 2 并发）：

```python
import asyncio

async def transcribe_multiple(audio_list: List[bytes]):
    """批量转录（控制并发数为 2）"""
    client = DoubaoASRClient(...)

    semaphore = asyncio.Semaphore(2)  # 限制并发

    async def transcribe_with_limit(audio):
        async with semaphore:
            return await client.transcribe(audio)

    results = await asyncio.gather(
        *[transcribe_with_limit(audio) for audio in audio_list]
    )
    return results
```

### 4. 音频预处理

```python
from pydub import AudioSegment

def preprocess_audio(audio_data: bytes) -> bytes:
    """
    音频预处理：
    1. 转换为 MP3 格式（如果不是）
    2. 调整采样率到 16kHz（豆包推荐）
    3. 转换为单声道
    """
    audio = AudioSegment.from_file(audio_data)

    audio = audio.set_frame_rate(16000)  # 16kHz
    audio = audio.set_channels(1)        # 单声道

    # 导出为 MP3
    output = io.BytesIO()
    audio.export(output, format="mp3")
    return output.read()
```

---

## 8️⃣ 集成示例

### FastAPI 接口集成

```python
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List
import io

router = APIRouter()

# 初始化客户端（单例）
doubao_client = DoubaoASRClient(
    app_id=settings.doubao_app_id,
    access_token=settings.doubao_access_token,
    hotwords=["豆包", "ASR", "播客", "人工智能"]
)

@router.post("/api/v1/asr/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    转录音频文件

    Args:
        file: 音频文件（支持 MP3/WAV/OGG OPUS）

    Returns:
        {
            "success": true,
            "data": {
                "text": "转录文本",
                "duration": 12345,  // 毫秒
                "utterances": [...]
            }
        }
    """
    try:
        # 读取音频数据
        audio_data = await file.read()

        # 转录
        result = await doubao_client.transcribe(audio_data)

        return {
            "success": True,
            "data": result.dict()
        }

    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="转录超时")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/v1/asr/transcribe-url")
async def transcribe_from_url(url: str):
    """
    从 URL 转录音频

    Args:
        url: 音频文件的公网 URL

    Returns:
        转录结果
    """
    try:
        # 下载音频
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            audio_data = response.content

        # 转录
        result = await doubao_client.transcribe(audio_data)

        return {
            "success": True,
            "data": result.dict()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 与小宇宙解析接口联调

```python
@router.post("/api/v1/episode/transcribe")
async def parse_and_transcribe(url: str):
    """
    解析小宇宙 URL 并转录音频

    Args:
        url: 小宇宙播客链接

    Returns:
        播客信息 + 转录结果
    """
    # 1. 解析小宇宙 URL
    episode_info = await parse_xiaoyuzhou_url(url)

    # 2. 下载音频
    async with httpx.AsyncClient() as client:
        response = await client.get(episode_info["audio_url"])
        audio_data = response.content

    # 3. 转录
    transcript = await doubao_client.transcribe(audio_data)

    # 4. 返回完整结果
    return {
        "success": True,
        "data": {
            **episode_info,
            "transcript": transcript.dict()
        }
    }
```

---

## 📚 参考资料

### 官方文档
- [豆包 ASR 极速版文档](https://www.volcengine.com/docs/6561/1631584?lang=zh)
- [豆包 ASR 标准版文档](https://www.volcengine.com/docs/6561/1354868?lang=zh)
- [阿里云 Qwen ASR 文档](https://help.aliyun.com/zh/model-studio/qwen-asr-api-reference)（对比参考）

### 项目内部文档
- `_shared/12_asr_credentials.md` - API 认证信息
- `_shared/01_api_spec.json` - API 接口规范
- `_shared/08_multi_engine_fallback_design.md` - 多引擎兜底设计

### 参考实现
- `push-2-talk/src-tauri/src/asr/http/doubao.rs` - Rust 极速版实现

---

## ✅ 下一步行动

### 实现任务
1. **创建服务模块**：`backend/app/services/asr_service.py`
   - 实现 `DoubaoASRClient`（极速版）
   - 实现 `DoubaoASRStandardClient`（标准版）
   - 实现 `SmartDoubaoASR`（智能分流）

2. **创建配置文件**：`backend/app/config/asr_config.py`
   - 环境变量管理
   - 热词配置

3. **集成对象存储**：`backend/app/services/storage.py`
   - 阿里云 OSS 上传器
   - 生成公网 URL

4. **编写单元测试**：`backend/tests/test_asr.py`
   - 极速版测试
   - 标准版测试
   - 智能分流测试

5. **FastAPI 接口集成**
   - POST /api/v1/asr/transcribe（极速版）
   - POST /api/v1/asr/transcribe-long（标准版）
   - POST /api/v1/episode/transcribe（解析 + 转录）

### 准备工作
- [ ] 准备阿里云 OSS 账号（用于标准版音频上传）
- [ ] 准备测试音频（短音频 + 长音频）
- [ ] 使用 API Key 进行真实测试
- [ ] 接入多引擎兜底（豆包 + 阿里云）

---

**文档状态**：✅ v2.0 就绪，支持极速版 + 标准版，可供后端工程师使用
