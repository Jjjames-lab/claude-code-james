# ASR 双引擎切换机制技术规范

**版本**：v1.0
**创建日期**：2026-01-20
**创建者**：架构师 Architect
**状态**：待后端实现

---

## 1. 切换触发条件

### 1.1 自动切换场景（豆包 → 阿里云 Qwen）

| 触发场景 | 判断条件 | 超时时间 | 是否切换 | 备注 |
|---------|---------|---------|---------|------|
| **超时无响应** | 30s 内未返回任何响应 | 30s | ✅ 是 | 立即切换 |
| **500 错误** | HTTP 状态码 500 | - | ✅ 是 | 服务器内部错误 |
| **503 错误** | HTTP 状态码 503 | - | ✅ 是 | 服务不可用 |
| **504 错误** | HTTP 状态码 504 | - | ✅ 是 | 网关超时 |
| **网络异常** | 连接失败、DNS 解析失败 | 10s | ✅ 是 | 立即切换 |
| **400 错误** | HTTP 状态码 400 | - | ❌ 否 | 参数错误，不切换 |
| **401 错误** | HTTP 状态码 401 | - | ❌ 否 | API Key 无效 |
| **403 错误** | HTTP 状态码 403 | - | ❌ 否 | 权限不足 |
| **404 错误** | HTTP 状态码 404 | - | ❌ 否 | 资源不存在 |

### 1.2 不切换的场景（返回错误给用户）

- **参数错误**（400）：提示用户检查输入
- **认证失败**（401）：提示管理员检查 API Key
- **权限不足**（403）：提示权限配置问题
- **资源不存在**（404）：提示音频文件不可用

---

## 2. 切换流程

### 2.1 时序图

```
用户请求转录
    ↓
调用豆包 ASR
    ↓
[等待响应...]
    ↓
┌─────────────────────────────────┐
│ 触发切换条件（30s 超时 / 500 / 503） │
└─────────────────────────────────┘
    ↓
记录切换日志（时间、原因、豆包响应）
    ↓
切换到阿里云 Qwen
    ↓
通知前端："豆包引擎无响应，已切换至备用引擎"
    ↓
使用 Qwen 继续转录
    ↓
┌─────────────────────────────────┐
│ Qwen 是否成功？                  │
└─────────────────────────────────┘
    ↓              ↓
   成功            失败
    ↓              ↓
返回转录结果    返回 503 错误
                ASR_SERVICE_UNAVAILABLE
```

### 2.2 切换日志格式

```json
{
  "timestamp": "2026-01-20T10:30:00Z",
  "event": "asr_engine_switch",
  "from_engine": "doubao",
  "to_engine": "qwen",
  "reason": "timeout|500|503|network_error",
  "original_response": {
    "status_code": null,
    "error_message": "Connection timeout after 30s"
  },
  "switch_duration_ms": 125
}
```

---

## 3. 超时时间定义

| 操作 | 超时时间 | 理由 |
|------|---------|------|
| **豆包 ASR 响应** | 30s | PRD 要求，避免用户长时间等待 |
| **阿里云 Qwen 响应** | 30s | 与豆包保持一致 |
| **URL 解析（爬虫）** | 10s | 新增定义，避免用户等待 |
| **AI 纠偏（GLM）** | 30s | 长文本可能需要更长时间 |
| **网络连接** | 10s | 快速失败，切换引擎 |

---

## 4. 双引擎均失败的处理

### 4.1 返回给用户的错误

```json
{
  "success": false,
  "error": {
    "code": "ASR_SERVICE_UNAVAILABLE",
    "message": "转录服务暂时不可用，请稍后重试",
    "details": {
      "doubao_error": "Connection timeout after 30s",
      "qwen_error": "500 Internal Server Error",
      "suggestion": "建议稍后重试，或联系技术支持"
    }
  }
}
```

### 4.2 前端展示

```
⚠️ 转录失败

豆包引擎：连接超时
阿里云引擎：服务器错误

建议：
- 稍后重试
- 检查网络连接
- 联系技术支持

[重试] [取消]
```

---

## 5. 用户手动选择引擎

### 5.1 请求参数

```json
{
  "audio_url": "https://...",
  "episode_id": "123456",
  "engine": "qwen"  // 用户手动指定引擎
}
```

### 5.2 行为逻辑

- 如果用户指定 `engine: "qwen"`，直接使用 Qwen，不经过豆包
- 如果用户指定引擎失败，**不自动切换**，直接返回错误
- 前端需要明确提示："您选择的引擎不可用，是否尝试切换到备用引擎？"

---

## 6. 切换后进度处理

### 6.1 方案：切换后从头开始（MVP 阶段）

**理由**：
- ✅ 实现简单，避免状态同步复杂度
- ✅ 不同引擎的词级时间戳可能不一致
- ⚠️ 用户体验稍差（需要重新等待）

**实现**：
```python
# 后端伪代码
def switch_to_qwen(audio_url):
    logger.info("Switching to Qwen, starting from beginning")
    return qwen_asr_service.transcribe(audio_url, start_from=0)
```

### 6.2 后续优化方案（可选）

- **断点续传**：记录豆包已完成的进度，切换后从断点继续
- **混合结果**：豆包结果 + Qwen 结果拼接（需要时间戳对齐）

---

## 7. 错误码映射

| 原始错误 | 切换后返回给用户 | 备注 |
|---------|----------------|------|
| 豆包 30s 超时 | ASR_SERVICE_UNAVAILABLE (503) | 已尝试切换 |
| Qwen 也超时 | ASR_SERVICE_UNAVAILABLE (503) | 双引擎均失败 |
| 豆包 500 | ASR_SERVICE_UNAVAILABLE (503) | 已尝试切换 |
| 豆包 400 | INVALID_AUDIO_URL (1002) | 不切换，参数错误 |
| 豆包 401 | ASR_SERVICE_UNAVAILABLE (503) | API Key 无效 |
| 网络断开 | NETWORK_ERROR (9001) | 前端检测 |

---

## 8. 给后端的实现建议

### 8.1 代码结构

```python
# app/services/asr.py

class ASRService:
    def __init__(self):
        self.doubao_client = DoubaoClient()
        self.qwen_client = QwenClient()
        self.logger = setup_logger('asr_switch')

    def transcribe_with_fallback(self, audio_url: str, engine: str = None):
        """
        带容错的转录方法
        """
        # 用户手动指定引擎
        if engine == "qwen":
            return self._transcribe_qwen(audio_url)

        # 默认：先豆包，失败后切换 Qwen
        try:
            return self._transcribe_doubao(audio_url)
        except (TimeoutError, HTTP500, HTTP503) as e:
            self._log_switch_event(e)
            return self._transcribe_qwen(audio_url)

    def _transcribe_doubao(self, audio_url: str):
        """豆包转录（30s 超时）"""
        try:
            return self.doubao_client.transcribe(
                audio_url,
                timeout=30
            )
        except TimeoutError:
            raise ASRException("doubao_timeout")
        except HTTPStatusError as e:
            if e.response.status_code in [500, 503, 504]:
                raise ASRException(f"doubao_{e.response.status_code}")
            else:
                raise  # 400/401/403/404 不切换

    def _transcribe_qwen(self, audio_url: str):
        """阿里云 Qwen 转录（30s 超时）"""
        return self.qwen_client.transcribe(
            audio_url,
            timeout=30
        )

    def _log_switch_event(self, error: Exception):
        """记录切换日志"""
        self.logger.info({
            "event": "asr_engine_switch",
            "from": "doubao",
            "to": "qwen",
            "reason": str(error),
            "timestamp": datetime.now().isoformat()
        })
```

### 8.2 测试用例

后端需要实现的测试：

| 用例ID | 测试场景 | 预期行为 |
|--------|---------|---------|
| TC-SWITCH-001 | 豆包 30s 超时 | 自动切换到 Qwen |
| TC-SWITCH-002 | 豆包 500 错误 | 自动切换到 Qwen |
| TC-SWITCH-003 | 豆包 503 错误 | 自动切换到 Qwen |
| TC-SWITCH-004 | 豆包 400 错误 | 不切换，返回 400 |
| TC-SWITCH-005 | 双引擎均失败 | 返回 503 + 错误详情 |
| TC-SWITCH-006 | 用户手动指定 Qwen | 直接使用 Qwen |
| TC-SWITCH-007 | 切换日志记录 | 日志包含时间、原因 |

---

## 9. 给前端的实现建议

### 9.1 用户提示文案

| 场景 | 提示文案 |
|------|---------|
| 转录中 | "正在转录中，预计需要 30 分钟..." |
| 切换引擎 | "豆包引擎无响应，已切换至备用引擎，请稍候..." |
| 双引擎失败 | "转录服务暂时不可用，请稍后重试或联系技术支持" |
| 用户指定引擎失败 | "您选择的引擎不可用，是否尝试切换到备用引擎？" |

### 9.2 进度条处理

- 切换后进度条重新从 0% 开始
- 或者显示："已切换引擎，正在重新转录..."

---

## 10. 与产品经理测试清单的对应关系

| 测试清单中的问题 | 本文档的回应 |
|----------------|-------------|
| **ASR 切换触发条件不明确** | ✅ 第 1 节明确列出了 8 种切换/不切换场景 |
| **未定义 URL 解析超时** | ✅ 第 3 节补充定义：URL 解析超时 10s |
| **LocalStorage 容量超限** | ⚠️ 参见下一个补充文档（前端处理策略） |

---

**文档状态**：✅ 已完成
**下一步行动**：
1. 后端工程师根据本文档实现切换逻辑
2. 产品经理更新测试清单，标记此问题已解决
3. 前端工程师实现对应的用户提示文案

---

**变更记录**：
- 2026-01-20 v1.0：初始版本，回应产品经理审核问题
