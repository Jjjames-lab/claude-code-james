# 阿里云 OSS 开通和配置教程

> **目标读者**：后端工程师
> **用途**：豆包 ASR 标准版需要音频 URL（OSS 存储）
> **创建时间**：2026-01-20

---

## 📋 目录

1. [开通阿里云 OSS](#1️⃣-开通阿里云-oss)
2. [创建 Bucket](#2️⃣-创建-bucket)
3. [配置访问权限](#3️⃣-配置访问权限)
4. [获取 Access Key](#4️⃣-获取-access-key)
5. [测试上传](#5️⃣-测试上传)
6. [环境变量配置](#6️⃣-环境变量配置)
7. [成本估算](#7️⃣-成本估算)

---

## 1️⃣ 开通阿里云 OSS

### 步骤 1：登录阿里云控制台

1. 访问 [阿里云官网](https://www.aliyun.com/)
2. 登录账号（如果没有，先注册）
3. 进入控制台

### 步骤 2：开通 OSS 服务

1. 在控制台搜索框输入"OSS"
2. 点击"对象存储 OSS"
3. 点击"立即开通"
4. 选择按量付费（推荐）
5. 同意服务协议，点击"立即开通"

**费用说明**：
- 开通免费，按实际使用量计费
- 详见本文档末尾的"成本估算"

---

## 2️⃣ 创建 Bucket

### 步骤 1：进入 OSS 管理控制台

1. 开通成功后，进入 [OSS 控制台](https://oss.console.aliyun.com/)
2. 点击左侧菜单"Bucket 列表"
3. 点击"创建 Bucket"

### 步骤 2：配置 Bucket 参数

| 参数 | 推荐配置 | 说明 |
|------|---------|------|
| **Bucket 名称** | `pod-studio-audio` | 全局唯一，小写字母和数字 |
| **地域** | 华北2（北京）| 选择离用户最近的地域 |
| **存储类型** | 标准存储 | 适合频繁访问的音频文件 |
| **读写权限** | **公共读** | ⚠️ 豆包 ASR 需要公网访问 |
| **其他选项** | 默认 | 使用默认配置即可 |

### ⚠️ 重要：读写权限选择

**为什么选择"公共读"？**
- 豆包 ASR 标准版需要通过公网 URL 访问音频
- 如果选择"私有"，需要配置签名 URL，更复杂
- "公共读"意味着任何人都可以读取文件（但无法删除）

**安全建议**：
- Bucket 只用于存储音频文件
- 不存储敏感信息
- 文件名使用随机 UUID，避免被猜测

### 步骤 3：确认创建

点击"确定"，等待 1-2 秒，Bucket 创建成功。

---

## 3️⃣ 配置访问权限

### 验证 Bucket 权限

1. 在 Bucket 列表中，点击刚创建的 Bucket 名称
2. 点击左侧菜单"权限管理"
3. 确认"读写权限"显示为"公共读"

### 配置跨域访问（CORS）- 可选

如果前端需要直接访问 OSS，需要配置 CORS：

1. 点击左侧菜单"数据安全" → "跨域设置"
2. 点击"创建规则"
3. 配置如下：

```json
{
  "来源": "*",
  "允许 Methods": ["GET", "POST"],
  "允许 Headers": "*",
  "暴露 Headers": ["ETag"],
  "缓存时间": 0
}
```

**注意**：豆包 ASR 不需要 CORS，这个配置是给前端用的。

---

## 4️⃣ 获取 Access Key

### 步骤 1：创建 RAM 用户（推荐）

**为什么使用 RAM 子用户？**
- 主账号 AccessKey 权限过大，存在安全风险
- RAM 子用户可以只授予 OSS 读写权限
- 符合最小权限原则

### 步骤 2：创建 AccessKey

1. 点击右上角头像 → "AccessKey 管理"
2. 或者直接访问 [RAM 控制台](https://ram.console.aliyun.com/manage/ak)
3. 点击"创建 AccessKey"

**注意**：
- 如果是主账号，会提示创建子用户（推荐）
- 如果是子用户，直接创建即可

### 步骤 3：保存 AccessKey

创建成功后，会显示：
- **AccessKey ID**（类似：`LTAI5t...`）
- **AccessKey Secret**（类似：`KZd3x...`）

⚠️ **重要**：AccessKey Secret 只显示一次，请立即复制保存！

### 步骤 4：授予 OSS 权限

如果是新建的 RAM 子用户，需要授权：

1. 进入 [RAM 用户控制台](https://ram.console.aliyun.com/users)
2. 找到刚创建的用户，点击用户名
3. 点击"权限管理" → "添加权限"
4. 搜索并选择以下权限：
   - `AliyunOSSFullAccess`（OSS 完整权限）
   - 或者更细粒度的权限：
     - `oss:PutObject`（上传文件）
     - `oss:GetObject`（下载文件）
     - `oss:DeleteObject`（删除文件）
5. 点击"确定"

---

## 5️⃣ 测试上传

### 安装 Python OSS SDK

```bash
pip install oss2
```

### 测试脚本

创建文件 `test_oss.py`：

```python
import oss2

# 替换为你的配置
ACCESS_KEY_ID = "你的AccessKeyID"
ACCESS_KEY_SECRET = "你的AccessKeySecret"
ENDPOINT = "https://oss-cn-beijing.aliyuncs.com"  # 北京地域
BUCKET_NAME = "pod-studio-audio"

# 创建 Bucket 对象
auth = oss2.Auth(ACCESS_KEY_ID, ACCESS_KEY_SECRET)
bucket = oss2.Bucket(auth, ENDPOINT, BUCKET_NAME)

# 测试上传
test_file = "test_audio.mp3"
with open(test_file, "rb") as f:
    result = bucket.put_object("uploads/test.mp3", f)

print(f"上传成功！ETag: {result.etag}")

# 生成公网 URL
filename = "uploads/test.mp3"
url = f"https://{BUCKET_NAME}.{ENDPOINT.replace('https://', '')}/{filename}"
print(f"公网 URL: {url}")

# 测试访问（用浏览器打开 URL，看能否下载）
```

### 运行测试

```bash
# 准备一个测试音频文件
echo "test" > test_audio.mp3

# 运行测试脚本
python test_oss.py
```

### 验证结果

1. 检查输出是否显示"上传成功"
2. 复制输出的 URL，用浏览器打开
3. 确认能正常下载文件

---

## 6️⃣ 环境变量配置

### 创建 `.env` 文件

在项目根目录（`后端Backend/`）创建 `.env` 文件：

```bash
# 豆包 ASR
DOUBAO_APP_ID=3850845308
DOUBAO_ACCESS_TOKEN=iowKNMA-P7ZjwTWKcVoRu_H8pQavteyy

# 阿里云 OSS
OSS_ACCESS_KEY_ID=你的AccessKeyID
OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
OSS_BUCKET_NAME=pod-studio-audio
OSS_ENDPOINT=https://oss-cn-beijing.aliyuncs.com
```

### 更新 `.gitignore`

确保 `.env` 文件不被提交到 Git：

```bash
# .gitignore
.env
*.pyc
__pycache__/
```

### 读取配置（Python）

创建 `backend/app/config/settings.py`：

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """应用配置"""

    # 豆包 ASR
    doubao_app_id: str
    doubao_access_token: str

    # 阿里云 OSS
    oss_access_key_id: str
    oss_access_key_secret: str
    oss_bucket_name: str
    oss_endpoint: str

    class Config:
        env_file = ".env"

# 全局配置实例
settings = Settings()
```

---

## 7️⃣ 成本估算

### OSS 计费项

| 计费项 | 单价 | 说明 |
|--------|------|------|
| **存储费用** | ¥0.12/GB/月 | 按平均存储量计费 |
| **外网流出流量** | ¥0.50/GB | 豆包下载音频时产生 |
| **请求次数** | ¥0.01/万次 | 上传/下载请求 |

### 典型场景估算

假设每月转录 100 集播客，平均每集 100MB：

| 项目 | 计算 | 月费用 |
|------|------|--------|
| **存储** | 100集 × 100MB = 10GB | 10GB × ¥0.12 = **¥1.2** |
| **流量** | 100集 × 100MB = 10GB | 10GB × ¥0.50 = **¥5.0** |
| **请求** | 100次上传 + 100次下载 = 200次 | 200/万 × ¥0.01 = **¥0.0002** |
| **合计** | - | **约 ¥6.2/月** |

### 节省成本技巧

1. **设置生命周期规则**：自动删除旧文件
   - 进入 Bucket → "文件管理" → "生命周期"
   - 规则：30天后自动删除

2. **使用低频访问存储**：
   - 如果音频不常访问，选择"低频访问存储"
   - 单价更低（¥0.08/GB/月）

3. **使用 CDN 回源**：
   - 如果有大量下载，可以配置 CDN
   - 降低 OSS 流量费用

---

## 🎯 快速检查清单

开通完成后，请确认以下信息：

- [ ] OSS 服务已开通
- [ ] Bucket 已创建（名称：`pod-studio-audio`）
- [ ] Bucket 权限为"公共读"
- [ ] AccessKey 已创建（ID 和 Secret 已保存）
- [ ] RAM 用户已授权（OSS 读写权限）
- [ ] 测试上传成功
- [ ] 公网 URL 可以访问
- [ ] `.env` 文件已配置
- [ ] `.gitignore` 已添加 `.env`

---

## 🆘 常见问题

### Q1: 上传成功但无法访问 URL？

**原因**：Bucket 权限不是"公共读"

**解决**：
1. 进入 Bucket → "权限管理"
2. 将"读写权限"改为"公共读"

### Q2: 提示"AccessDenied"？

**原因**：RAM 用户没有 OSS 权限

**解决**：
1. 进入 RAM 控制台 → 用户 → 权限管理
2. 添加 `AliyunOSSFullAccess` 权限

### Q3: 哪个地域选最好？

**推荐**：
- 国内用户：华北2（北京）或 华东2（上海）
- 海外用户：香港 或 新加坡

### Q4: Bucket 名称已被占用？

**解决**：
- 在名称后加随机字符串，如 `pod-studio-audio-xyz123`
- 或使用你的名字缩写，如 `pod-studio-audio-james`

---

## 📞 下一步

配置完成后，可以开始实现：

1. **创建 OSS 上传服务**：`backend/app/services/storage.py`
2. **集成到 ASR 服务**：标准版自动上传 → 转录
3. **测试完整流程**：上传 → 转录 → 返回结果

---

**文档状态**：✅ 就绪
**最后更新**：2026-01-20
