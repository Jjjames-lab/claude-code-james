# 豆包ASR（火山引擎）深度分析报告

> **分析日期**：2026-01-27
> **基于文档**：火山引擎豆包录音文件识别API文档
> **关键发现**：豆包ASR原生支持句子级时间戳和标点符号！

---

## 一、核心发现

### 1.1 豆包ASR的原生能力

根据文档，豆包ASR **直接支持** 我们需要的所有功能：

| 功能 | API参数 | 默认值 | 我们的状态 |
|------|---------|--------|-----------|
| **句子级时间戳** | `show_utterances: true` | false | ❌ 未启用 |
| **标点符号** | `enable_punc: true` | false | ❌ 未启用 |
| **词级时间戳** | `words` 数组 | 自动包含 | ✅ 已有 |
| **说话人分离** | `enable_speaker_info: true` | false | ❌ 未启用 |
| **语速信息** | `show_speech_rate: true` | false | ❌ 未启用 |
| **音量信息** | `show_volume: true` | false | ❌ 未启用 |

### 1.2 返回数据结构

**启用 `show_utterances: true` 后的返回结构**：

```json
{
  "audio_info": {"duration": 3696},
  "result": {
    "text": "这是字节跳动， 今日头条母公司。",
    "utterances": [
      {
        "definite": true,
        "end_time": 1705,
        "start_time": 0,
        "text": "这是字节跳动，",  // ← 已有标点！
        "words": [
          {"text": "这", "start_time": 740, "end_time": 860},
          {"text": "是", "start_time": 860, "end_time": 1020},
          {"text": "字", "start_time": 1020, "end_time": 1200},
          // ... 词级时间戳
        ]
      },
      {
        "definite": true,
        "end_time": 3696,
        "start_time": 2110,
        "text": "今日头条母公司。",  // ← 已有标点！
        "words": [
          {"text": "今", "start_time": 2910, "end_time": 3070},
          {"text": "日", "start_time": 3070, "end_time": 3230},
          // ... 词级时间戳
        ]
      }
    ]
  }
}
```

**关键发现**：
- ✅ `utterances[].text` **包含完整标点**（句号、逗号等）
- ✅ `utterances[].start_time` / `end_time` **毫秒级时间戳**
- ✅ `utterances[].words` **词级时间戳数组**
- ✅ 句子边界清晰，自然分段

---

## 二、我们当前的问题

### 2.1 当前ASR调用参数（推测）

根据代码分析，我们当前可能只使用了基础参数：

```python
# 当前调用（推测）
response = await client.post(
    "http://localhost:8001/api/v1/asr/transcribe-url",
    json={
        "url": audio_url,
        "strategy": "doubao"
    }
)

# 问题：没有启用关键参数
# - enable_punc: false (默认)
# - show_utterances: false (默认)
```

**结果**：
- ❌ 句子级时间戳丢失
- ❌ 标点符号丢失
- ❌ 需要额外处理

### 2.2 正确用法

根据文档，**只需要启用两个参数**：

```python
# 正确调用
response = await client.post(
    "http://localhost:8001/api/v1/asr/transcribe-url",
    json={
        "url": audio_url,
        "strategy": "doubao",
        "request": {
            "model_name": "bigmodel",
            "enable_punc": True,        # ← 启用标点！
            "show_utterances": True,    # ← 启用句子级输出！
        }
    }
)
```

**结果**：
- ✅ 句子级时间戳直接可用
- ✅ 标点符号自动添加
- ✅ 无需额外处理

---

## 三、解决方案

### 3.1 方案一：修改后端API调用（推荐）

**修改位置**：`后端Backend/backend/app/services/asr_service.py`

```python
# 当前代码（推测）
async def transcribe_with_doubao(audio_data: bytes) -> TranscriptResult:
    # ... 调用豆包ASR

# 需要修改为：
async def transcribe_with_doubao(audio_data: bytes) -> TranscriptResult:
    # 启用标点和句子级输出
    request_params = {
        "model_name": "bigmodel",
        "enable_punc": True,        # 启用标点符号
        "show_utterances": True,    # 启用句子级输出
        "show_speech_rate": False,  # 可选：语速信息
        "show_volume": False,       # 可选：音量信息
        "enable_itn": True,         # 文本规范化
    }

    # 发送请求
    response = await client.post(
        VOLCANO_API_URL,
        headers=build_headers(),
        json={
            "user": {"uid": config.uid},
            "audio": {
                "format": "m4a",  # 小宇宙音频格式
                "url": audio_url
            },
            "request": request_params
        }
    )

    # 解析结果
    result = response.json()

    # 直接使用utterances
    utterances = result.get("result", {}).get("utterances", [])

    return TranscriptResult(
        text=result.get("result", {}).get("text", ""),
        utterances=[
            {
                "text": utt["text"],
                "start": utt["start_time"],
                "end": utt["end_time"],
                "words": utt.get("words", [])
            }
            for utt in utterances
        ]
    )
```

### 3.2 方案二：修改前端代码

**修改位置**：`前端 Frontend/pod-studio/src/pages/HomePage.tsx`

```typescript
// 当前代码（段落级）
const segments = result.utterances.map((utt: any, index: number) => ({
  id: `seg-${index}`,
  speaker: utt.speaker || '说话人',
  text: utt.text,  // 段落级文本
  words: utt.words || [],
  startTime: utt.start || utt.start_time || 0,
  endTime: utt.end || utt.end_time || 0,
}));

// 修改后（句子级，直接使用）
const segments = result.utterances.map((utt: any, index: number) => ({
  id: `seg-${index}`,
  speaker: utt.speaker || '说话人',
  text: utt.text,  // 句子级文本，已包含标点！
  words: utt.words || [],
  startTime: utt.start_time,  // 毫秒
  endTime: utt.end_time,      // 毫秒
}));
```

---

## 四、对比分析

### 4.1 数据结构对比

| 维度 | 豆包ASR (启用参数后) | OpenAI Whisper | Scripod前端代码 |
|------|---------------------|----------------|-----------------|
| **句子级文本** | ✅ `utterances[].text` | ✅ `segments[].text` | ✅ `a.children[].title` |
| **句子时间戳** | ✅ `start_time/end_time` (ms) | ✅ `start/end` (s) | ✅ `a.time` |
| **词级时间戳** | ✅ `words[].start_time/end_time` | ✅ 可选 | ✅ `t.timestamps` |
| **标点符号** | ✅ `enable_punc: true` | ✅ 自动 | ✅ 已有 |
| **分段方式** | 语义分句/VAD分句 | 自动检测 | 智能分割 |
| **语言支持** | 中英日等15种 | 多语言 | 多语言 |

### 4.2 结论

**豆包ASR完全能满足我们的需求**：

1. ✅ **句子级时间戳** - 原生支持，无需算法计算
2. ✅ **标点符号** - 参数控制，自动添加
3. ✅ **词级时间戳** - 内置，无需额外处理
4. ✅ **免费额度** - 100小时/月，足够使用

**不需要**：
- ❌ 更换ASR服务商
- ❌ 自研时间戳映射算法
- ❌ 额外后处理

---

## 五、行动计划

### 5.1 第一步：修改后端API

**任务**：修改豆包ASR调用参数

```python
# 文件：后端Backend/backend/app/services/asr_service.py

# 找到转录函数，添加参数
async def transcribe_doubao(audio_url: str) -> dict:
    # 构建请求参数
    params = {
        "request": {
            "model_name": "bigmodel",
            "enable_punc": True,        # 新增：启用标点
            "show_utterances": True,    # 新增：启用句子级输出
            "enable_itn": True,         # 文本规范化
            "show_speech_rate": False,  # 可选
            "show_volume": False,       # 可选
        }
    }

    # 发送请求
    response = await http_client.post(
        VOLCANO_API_URL,
        headers=build_volcano_headers(),
        json={
            "user": {"uid": config.VOLCANO_UID},
            "audio": {
                "url": audio_url,
                "format": "m4a"  # 小宇宙音频格式
            },
            "request": params["request"]
        }
    )

    return parse_response(response)
```

**预期工作量**：1-2小时

**验收标准**：
- [ ] API调用成功
- [ ] 返回结果包含 `utterances` 数组
- [ ] `utterances[].text` 包含标点
- [ ] `utterances[].start_time/end_time` 正确

### 5.2 第二步：修改前端解析

**任务**：使用新的数据格式

```typescript
// 文件：前端 Frontend/pod-studio/src/pages/HomePage.tsx

// 修改 handleTranscriptionWithASR 函数
const handleTranscriptionWithASR = async (result: any) => {
    // 检查utterances结构
    if (!result.utterances || !Array.isArray(result.utterances)) {
        throw new Error('转录结果格式错误：缺少utterances字段');
    }

    // 直接使用utterances
    const segments = result.utterances.map((utt: any, index: number) => ({
        id: `seg-${index}`,
        speaker: utt.speaker || '说话人',
        text: utt.text,  // 已经是带标点的句子级文本
        words: utt.words || [],  // 词级时间戳
        startTime: utt.start_time || utt.start || 0,
        endTime: utt.end_time || utt.end || 0,
    }));

    // ... 后续逻辑不变
};
```

**预期工作量**：1小时

**验收标准**：
- [ ] 段落文本包含标点符号
- [ ] 分段自然（多个句子一段）
- [ ] 时间戳正确
- [ ] 点击跳转正常

### 5.3 第三步：测试验证

**测试用例**：

```typescript
// 测试1：验证标点符号
const hasPunctuation = segments.every(seg =>
    seg.text.includes('，') ||
    seg.text.includes('。') ||
    seg.text.includes('！') ||
    seg.text.includes('？')
);

// 测试2：验证时间戳
const timestampsValid = segments.every(seg =>
    seg.startTime >= 0 &&
    seg.endTime > seg.startTime
);

// 测试3：验证词级数据
const wordsValid = segments.every(seg =>
    Array.isArray(seg.words) &&
    seg.words.every(w => w.start >= 0 && w.end > w.start)
);
```

**预期工作量**：30分钟

---

## 六、额外发现

### 6.1 其他有用的参数

文档中还有几个有趣的参数：

| 参数 | 功能 | 潜在用途 |
|------|------|----------|
| `enable_speaker_info` | 说话人分离 | 多人对话场景 |
| `enable_emotion_detection` | 情绪检测 | 内容分析 |
| `enable_gender_detection` | 性别检测 | 内容分析 |
| `boosting_table_name` | 热词优化 | 专有名词识别 |
| `sensitive_words_filter` | 敏感词过滤 | 内容合规 |

### 6.2 推荐开启的参数组合

**基础版**（推荐）：
```json
{
    "model_name": "bigmodel",
    "enable_punc": true,
    "show_utterances": true,
    "enable_itn": true
}
```

**增强版**（可选）：
```json
{
    "model_name": "bigmodel",
    "enable_punc": true,
    "show_utterances": true,
    "enable_itn": true,
    "show_speech_rate": true,   // 语速信息
    "show_volume": true,        // 音量信息
    "enable_speaker_info": true // 说话人分离
}
```

---

## 七、总结

### 7.1 核心结论

1. **豆包ASR完全支持句子级时间戳**
   - 只需启用两个参数：`enable_punc` + `show_utterances`
   - 无需算法计算，原生支持
   - 标点符号自动添加

2. **我们之前的问题**
   - ❌ 没有启用关键参数
   - ❌ 误以为需要额外算法
   - ❌ 前端代码逻辑复杂化

3. **解决方案**
   - 修改后端API调用参数
   - 修改前端解析逻辑
   - **预计工作量：半天**

### 7.2 立即行动

```bash
# 1. 修改后端API参数
# 文件：后端Backend/backend/app/services/asr_service.py

# 2. 修改前端解析逻辑
# 文件：前端 Frontend/pod-studio/src/pages/HomePage.tsx

# 3. 测试验证
# - 验证标点符号
# - 验证时间戳
# - 验证点击跳转
```

### 7.3 预期效果

修改后，我们将获得：
- ✅ **完整的句子级时间戳**（毫秒精度）
- ✅ **带标点的自然分段文本**
- ✅ **词级时间戳数据**
- ✅ **与Scripod相同的功能体验**

---

**报告完成**：2026-01-27
**下一步**：根据本报告实施修改
