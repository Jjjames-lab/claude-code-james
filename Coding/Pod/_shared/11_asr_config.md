# ASR 服务配置文档

> **创建时间**：2026-01-20
> **创建者**：产品经理 James
> **用途**：提供给后端工程师，用于 ASR 服务集成

---

## 🔑 豆包 ASR（主引擎）

### 服务信息
- **服务商**：豆包语音（字节跳动）
- **模型**：录音文件识别大模型-极速版
- **当前资源**：试用期 20 小时时长，2 并发

### 认证信息
| 参数 | 值 |
|------|-----|
| **APP ID** | `3850845308` |
| **Access Token** | `iowKNMA-P7ZjwTWKcVoRu_H8pQavteyy` |
| **Secret Key** | `Ng4mAZu6DQ0kAmA04D1SHXJzmjHZloZj` |
| **实例 ID** | `Speech_Recognition_Seed_AUC2000000580063045282` |

### API 文档
- **极速版**：https://www.volcengine.com/docs/6561/1631584?lang=zh
- **标准版**（备用）：https://www.volcengine.com/docs/6561/1354868?lang=zh
- **流式识别**（备用）：https://www.volcengine.com/docs/6561/1354869?lang=zh

### 使用限制
| 项目 | 限制说明 |
|------|---------|
| **音频时长** | 不超过 2 小时（超过需使用标准版） |
| **音频大小** | 不超过 100MB |
| **音频格式** | 支持 WAV / MP3 / OGG OPUS |
| **资源 ID** | 需开通 `volc.bigasr.auc_turbo` 权限 |
| **上传文件** | 建议大小 20MB 以内 |
| **多声道** | 相比单声道，处理时长会相应增长 |

### 当前额度
- **剩余时长**：20 小时（试用期）
- **并发数**：2

---

## 🔑 阿里云 ASR（备用引擎）

### 认证信息
| 参数 | 值 |
|------|-----|
| **ID** | `3192188` |
| **API KEY** | `sk-2f39e33d6b644f3a882811d3049a0217` |
| **归属账户** | `1283538970018556` |

### API 文档
https://bailian.console.aliyun.com/cn-beijing/?tab=api#/api

---

## 🎯 集成建议

### 引擎切换策略
1. **主引擎**：豆包 ASR 极速版
2. **备用引擎**：阿里云 ASR
3. **切换条件**（参考 `_shared/05_asr_switching_spec.md`）：
   - 豆包 ASR 超时（30 秒）
   - 豆包 ASR 返回 500/503 错误
   - 豆包 ASR 重试 2 次后仍失败

### 额度监控
- ⚠️ 豆包 ASR 试用期只有 20 小时
- 建议：添加额度监控，剩余 < 5 小时时发送警告
- 建议：记录每次转录消耗的时长

### 配置文件示例
```python
# backend/app/config/asr_config.py

DOUBAO_CONFIG = {
    "app_id": "3850845308",
    "access_token": "iowKNMA-P7ZjwTWKcVoRu_H8pQavteyy",
    "secret_key": "Ng4mAZu6DQ0kAmA04D1SHXJzmjHZloZj",
    "instance_id": "Speech_Recognition_Seed_AUC2000000580063045282",
    "api_url": "https://openspeech.bytedance.com/api/v1/auc",
    "timeout": 30,  # 秒
    "max_retries": 2,
}

ALIYUN_CONFIG = {
    "id": "3192188",
    "api_key": "sk-2f39e33d6b644f3a882811d3049a0217",
    "api_url": "https://bailian.console.aliyun.com/api",
    "timeout": 30,
}

SWITCH_CONFIG = {
    "timeout": 30,  # 主引擎超时时间
    "max_retries": 2,  # 主引擎最大重试次数
    "retry_interval": 0.5,  # 重试间隔（秒）
}
```

---

## 📝 注意事项

### 安全提醒
⚠️ **重要**：这些是敏感信息，请勿：
- ❌ 提交到 Git 仓库
- ❌ 在公开渠道分享
- ❌ 写在前端代码中

✅ **正确做法**：
- ✅ 使用环境变量存储
- ✅ 使用配置文件（添加到 `.gitignore`）
- ✅ 仅在后端服务中使用

### 环境变量设置示例
```bash
# .env 文件（添加到 .gitignore）
DOUBAO_APP_ID=3850845308
DOUBAO_ACCESS_TOKEN=iowKNMA-P7ZjwTWKcVoRu_H8pQavteyy
DOUBAO_SECRET_KEY=Ng4mAZu6DQ0kAmA04D1SHXJzmjHZloZj
DOUBAO_INSTANCE_ID=Speech_Recognition_Seed_AUC2000000580063045282
ALIYUN_ID=3192188
ALIYUN_API_KEY=sk-2f39e33d6b644f3a882811d3049a0217
```

---

## 🔄 后续步骤

### 后端工程师需要做的：
1. ✅ 阅读 API 文档（豆包极速版）
2. ✅ 实现豆包 ASR 集成（HTTP 模式）
3. ✅ 实现阿里云 ASR 集成（备用引擎）
4. ✅ 实现双引擎切换逻辑（参考架构师的 `_shared/09_multi_engine_architecture.md`）
5. ✅ 添加日志记录（每次调用的耗时、成功/失败）
6. ✅ 添加额度监控（记录已使用时长）

### 测试计划：
1. 使用《测试播客列表.md》中的 4 个播客进行测试
2. 验证双引擎切换是否正常工作
3. 验证转录准确率是否达标

---

**配置完成！后端工程师可以开始 ASR 集成工作了。** 🚀
