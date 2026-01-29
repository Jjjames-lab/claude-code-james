# ASR 服务测试说明

> **文档版本**：v1.0
> **创建时间**：2026-01-20
> **目标读者**：后端工程师

---

## 📋 测试结构

```
tests/
├── __init__.py           # 测试包初始化
├── test_asr.py           # ASR 服务单元测试
├── test_crawler.py       # 爬虫服务测试（待创建）
└── README.md             # 本文档
```

---

## 🚀 快速开始

### 安装测试依赖

```bash
pip install pytest pytest-asyncio pytest-mock pytest-cov
```

### 运行所有测试

```bash
# 在项目根目录运行
pytest tests/ -v

# 带覆盖率报告
pytest tests/ --cov=app --cov-report=html
```

### 运行特定测试

```bash
# 只运行 ASR 测试
pytest tests/test_asr.py -v

# 只运行极速版测试
pytest tests/test_asr.py::TestDoubaoASRFlashClient -v

# 只运行集成测试
pytest tests/test_asr.py::TestASRIntegration -v
```

---

## 📊 测试覆盖范围

### 单元测试（Unit Tests）

**豆包极速版客户端**（`TestDoubaoASRFlashClient`）：
- ✅ `test_transcribe_success` - 转录成功
- ✅ `test_transcribe_with_retry` - 重试机制
- ✅ `test_transcribe_api_error` - API 错误处理

**豆包标准版客户端**（`TestDoubaoASRStandardClient`）：
- ✅ `test_transcribe_with_polling` - 轮询查询

**ASR 服务管理器**（`TestASRService`）：
- ✅ `test_create_task` - 创建任务
- ✅ `test_get_task` - 获取任务
- ✅ `test_start_task_success` - 启动任务成功
- ✅ `test_start_task_failure` - 启动任务失败
- ✅ `test_get_task_status` - 获取任务状态
- ✅ `test_get_task_status_not_found` - 任务不存在

### 集成测试（Integration Tests）

**真实 API 测试**（`TestASRIntegration`）：
- ⏸️ `test_real_transcription` - 真实转录（需要 API Key）
- ⏸️ `test_real_transcription_with_hotwords` - 带热词的转录（需要 API Key）

---

## 🔧 测试配置

### 创建 `.env.test` 文件

```bash
# 豆包 ASR（使用测试 API Key）
DOUBAO_APP_ID=3850845308
DOUBAO_ACCESS_TOKEN=iowKNMA-P7ZjwTWKcVoRu_H8pQavteyy

# 阿里云 OSS（如果测试标准版）
OSS_ACCESS_KEY_ID=your_test_key
OSS_ACCESS_KEY_SECRET=your_test_secret
OSS_BUCKET_NAME=test-bucket
OSS_ENDPOINT=https://oss-cn-beijing.aliyuncs.com
```

### 更新 `pytest.ini`（可选）

在项目根目录创建 `pytest.ini`：

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --strict-markers
    --tb=short
markers =
    integration: 集成测试（需要真实 API Key）
    slow: 慢速测试（执行时间 > 1秒）
    unit: 单元测试
```

---

## 📝 编写新测试

### 示例：测试新的错误处理

```python
class TestNewErrorHandling:
    """新错误处理测试"""

    @pytest.mark.asyncio
    async def test_timeout_error(self):
        """测试：超时错误处理"""
        client = DoubaoASRFlashClient()

        # Mock 超时
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(side_effect=httpx.TimeoutException("Timeout"))
            mock_client_class.return_value.__aenter__.return_value = mock_client

            # 执行并验证
            with pytest.raises(httpx.TimeoutException):
                await client.transcribe(b"fake_audio")
```

---

## 🎯 测试最佳实践

### 1. 使用 Mock 避免真实 API 调用

```python
# ✅ 推荐：使用 Mock
with patch("httpx.AsyncClient") as mock_client:
    mock_response = Mock()
    mock_response.headers = {"X-Api-Status-Code": "20000000"}
    # ...

# ❌ 不推荐：直接调用真实 API
result = await client.transcribe(real_audio_data)
```

### 2. 测试边界情况

```python
@pytest.mark.parametrize("duration,expected_engine", [
    (1800, "flash"),      # 30分钟 → 极速版
    (7200, "flash"),      # 2小时 → 极速版
    (7201, "standard"),   # 2小时1秒 → 标准版
    (10800, "standard"),  # 3小时 → 标准版
])
async def test_smart_routing(duration, expected_engine):
    """测试：智能路由策略"""
    # ...
```

### 3. 测试异步代码

```python
@pytest.mark.asyncio
async def test_async_operation():
    """测试：异步操作"""
    result = await async_function()
    assert result is not None
```

---

## 🐛 调试测试

### 运行单个测试并打印输出

```bash
pytest tests/test_asr.py::TestDoubaoASRFlashClient::test_transcribe_success -v -s
```

### 使用 pdb 断点调试

```python
def test_with_debugger():
    """测试：使用调试器"""
    import pdb; pdb.set_trace()  # 设置断点
    result = some_function()
    assert result
```

### 查看 Mock 调用历史

```python
def test_mock_history():
    """测试：查看 Mock 调用"""
    mock_client = AsyncMock()
    # ... 执行一些操作
    print(mock_client.call_args_list)  # 打印调用历史
    print(mock_client.call_count)       # 打印调用次数
```

---

## 📈 测试覆盖率目标

| 模块 | 目标覆盖率 | 当前覆盖率 |
|------|-----------|-----------|
| `asr_config.py` | 90% | 待测试 |
| `asr_service.py` | 85% | 待测试 |
| `crawler.py` | 80% | 待测试 |

查看覆盖率报告：

```bash
pytest tests/ --cov=app --cov-report=html
open htmlcov/index.html
```

---

## ⚠️ 注意事项

### 1. 集成测试需要真实 API Key

集成测试（`TestASRIntegration`）需要配置真实的豆包 API Key。

运行集成测试前：
1. 创建 `.env.test` 文件
2. 填入真实的 API Key
3. 运行：`pytest tests/test_asr.py -m integration`

### 2. 测试音频文件

准备测试音频文件：
```
tests/fixtures/
├── short_audio.mp3      # 10秒短音频
├── medium_audio.mp3     # 30分钟中音频
└── long_audio.mp3       # 3小时长音频
```

### 3. Mock 数据准备

使用固定的 Mock 数据确保测试可重复：

```python
@pytest.fixture
def mock_response():
    """固定的 Mock 响应"""
    return {
        "audio_info": {"duration": 10000},
        "result": {
            "utterances": [...]
        }
    }
```

---

## 🔄 持续集成（CI）

### GitHub Actions 示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - run: pip install -r requirements.txt
      - run: pip install pytest pytest-cov
      - run: pytest tests/ --cov=app --cov-report=xml
      - uses: codecov/codecov-action@v2
```

---

## 📞 下一步

1. **完善单元测试**：达到 85% 覆盖率
2. **添加集成测试**：使用真实 API Key 测试
3. **性能测试**：测试并发转录、超时处理
4. **端到端测试**：测试完整的转录流程

---

**文档状态**：✅ 就绪
