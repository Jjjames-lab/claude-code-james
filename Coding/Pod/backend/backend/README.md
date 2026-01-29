# 小宇宙深度学习助手 API

## 📖 项目简介

小宇宙播客深度学习助手后端服务，提供节目解析、ASR 转录、AI 纠偏等核心功能。

**技术栈**：FastAPI + Playwright + 豆包 ASR + 阿里云 Qwen ASR

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 进入项目目录
cd backend

# 创建虚拟环境（推荐）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 安装 Playwright 浏览器
playwright install chromium
```

### 2. 配置环境变量

```bash
# 复制配置模板
cp .env.example .env

# 编辑 .env 文件，填入 API Key（可选）
# 豆包 ASR API Key：https://console.volcengine.com/
```

### 3. 启动服务

```bash
# 开发模式（支持热重载）
python main.py

# 或使用 uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

服务启动后访问：
- **API 文档**：http://localhost:8000/docs
- **健康检查**：http://localhost:8000/api/v1/health

---

## 📡 API 接口

### 1. 小宇宙解析接口

**接口**：`POST /api/v1/episode/parse`

**请求**：
```json
{
  "url": "https://xiaoyuzhoufm.com/episode/123456"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "episode_id": "123456",
    "audio_url": "https://cdn.xiaoyuzhoufm.com/episodes/xxx.mp3",
    "duration": 3600,
    "cover_image": "https://image.xiaoyuzhoufm.com/xxx.jpg",
    "show_notes": "节目介绍...",
    "episode_title": "第123期：深度学习实践",
    "podcast_name": "技术杂谈"
  }
}
```

**错误码**：
- `1001`：无效的 URL 格式
- `1403`：反爬虫拦截
- `1404`：节目不存在
- `1504`：请求超时

---

## 📁 项目结构

```
backend/
├── app/
│   ├── api/
│   │   └── routes/          # API 路由
│   ├── services/            # 业务逻辑层
│   │   ├── crawler.py       # 小宇宙爬虫
│   │   └── asr.py           # ASR 转录（TODO）
│   ├── models/              # 数据模型
│   │   └── schemas.py       # Pydantic 模型
│   └── utils/               # 工具函数
│       ├── logger.py        # 日志工具
│       └── errors.py        # 错误码定义
├── logs/                    # 日志目录（自动创建）
├── main.py                  # 应用入口
├── config.py                # 配置管理
├── requirements.txt         # Python 依赖
├── .env.example             # 环境变量模板
└── README.md                # 本文件
```

---

## ⚙️ 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `DOUBAO_ACCESS_KEY` | 豆包 ASR Access Key | - | 否 |
| `DOUBAO_SECRET_KEY` | 豆包 ASR Secret Key | - | 否 |
| `CRAWLER_TIMEOUT` | 爬虫超时时间（秒） | 30 | 否 |
| `DEBUG` | 调试模式 | true | 否 |

### 获取豆包 API Key

1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 注册并登录
3. 进入「账号管理」→「API 密钥管理」
4. 创建新的 Access Key
5. 复制到 `.env` 文件

---

## 🔧 开发指南

### 添加新接口

1. 在 `app/api/routes/` 创建路由文件
2. 在 `main.py` 中注册路由
3. 在 `app/models/schemas.py` 定义数据模型

### 调试技巧

- 查看日志文件：`logs/app_2026-01-19.log`
- 使用 API 文档测试：http://localhost:8000/docs
- 开启 DEBUG 模式查看详细日志

---

## 🐛 常见问题

### 1. Playwright 浏览器安装失败

```bash
# 手动安装
playwright install chromium
```

### 2. 爬虫被反爬拦截

- 等待一段时间后重试
- 检查网络连接是否正常
- 可以尝试更换 IP（生产环境）

### 3. ASR 功能不可用

- 检查 `.env` 文件是否配置了 API Key
- 查看 API Key 是否有效
- 参考 [火山引擎文档](https://www.volcengine.com/docs/6561/79820)

---

## 📝 待完成功能

- [ ] 豆包 ASR 集成
- [ ] 阿里云 Qwen ASR 集成
- [ ] GLM AI 纠偏接口
- [ ] 转录任务状态查询
- [ ] SSE 实时进度推送
- [ ] 单元测试

---

## 📄 许可证

MIT License
