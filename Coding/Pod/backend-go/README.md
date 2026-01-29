# Go 后端服务

小宇宙播客深度学习助手 - Go 后端服务

## 技术栈

- **框架**: Gin
- **配置**: Viper
- **日志**: Zap
- **CORS**: gin-contrib/cors
- **HTTP 客户端**: go-resty/resty
- **ASR 引擎**: 豆包 ASR、阿里云 Qwen ASR
- **对象存储**: MinIO (本地存储)
- **爬虫服务**: Python Playwright (HTTP 调用)

## 快速开始

### 前置要求

- Go 1.21+
- Docker (可选)

### 本地开发

```bash
# 安装依赖
make deps

# 运行服务
make run

# 构建二进制
make build
./bin/server
```

### Docker 部署

```bash
# 构建并运行
make docker-build
make docker-run

# 或者直接使用 docker-compose
docker-compose up -d
```

## API 端点

### 健康检查

```bash
curl http://localhost:8080/api/v1/health
```

**响应**：
```json
{
  "status": "healthy",
  "timestamp": "2026-01-21T10:00:00Z",
  "services": {
    "asr_doubao": "available",
    "asr_qwen": "available"
  }
}
```

### ASR 转录

**POST /api/v1/asr/transcribe** - 转录音频文件

```bash
# 使用默认引擎（auto - 自动选择）
curl -X POST http://localhost:8080/api/v1/asr/transcribe \
  -F "file=@test.mp3"

# 指定引擎
curl -X POST http://localhost:8080/api/v1/asr/transcribe \
  -F "file=@test.mp3" \
  -F "engine=doubao"
```

**响应**：
```json
{
  "success": true,
  "data": {
    "text": "深度学习是机器学习的一个分支...",
    "duration": 3600,
    "engine": "doubao",
    "words": [
      {"text": "深度", "start_time": 1000, "end_time": 1500, "speaker": "Speaker 0"},
      {"text": "学习", "start_time": 1500, "end_time": 2000, "speaker": "Speaker 0"}
    ],
    "word_count": 123,
    "log_id": "req-abc123",
    "timestamp": "2026-01-21T10:00:00Z"
  }
}
```

**查询参数**：
- `engine`: 引擎类型（`doubao`、`qwen`、`auto`，默认 `auto`）

**GET /api/v1/asr/engines** - 获取可用引擎列表

```bash
curl http://localhost:8080/api/v1/asr/engines
```

**响应**：
```json
{
  "success": true,
  "data": {
    "engines": [
      {"name": "Doubao", "type": "doubao", "status": "available", "is_primary": true},
      {"name": "Qwen", "type": "qwen", "status": "available", "is_primary": false}
    ],
    "count": 2
  }
}
```

### 爬虫服务

**POST /api/v1/crawler/parse** - 解析小宇宙播客链接

```bash
curl -X POST http://localhost:8080/api/v1/crawler/parse \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.xiaoyuzhou.com/episode/xxx",
    "wait_time": 3000
  }'
```

**响应**：
```json
{
  "success": true,
  "data": {
    "title": "播客标题",
    "audio_url": "音频链接",
    "duration": 3600,
    "episode_id": "xxx",
    "cover_image": "封面图",
    "show_notes": "节目备注"
  }
}
```

**注意**：此端点通过 HTTP 调用 Python 爬虫服务（端口 8001），需要先启动爬虫服务。

## 环境变量

参考 `.env.example` 文件配置环境变量。

## 项目结构

```
backend-go/
├── cmd/server/main.go       # 应用入口
├── internal/
│   ├── api/
│   │   ├── handler/        # HTTP 处理器
│   │   │   ├── health.go   # 健康检查
│   │   │   ├── asr.go      # ASR 转录
│   │   │   ├── crawler.go  # 爬虫服务
│   │   │   └── response.go # 统一响应格式
│   │   ├── middleware/     # 中间件
│   │   │   ├── cors.go
│   │   │   └── logger.go
│   │   └── router/         # 路由配置
│   ├── config/             # 配置管理
│   ├── model/              # 数据模型
│   │   └── transcript.go   # 转录结果模型
│   └── service/
│       ├── asr/            # ASR 服务
│       │   ├── client.go   # ASR 客户端接口
│       │   ├── doubao.go   # 豆包 ASR 实现
│       │   ├── qwen.go     # 阿里云 Qwen 实现
│       │   ├── multi_engine.go # 多引擎服务
│       │   └── factory.go  # 工厂函数
│       ├── storage/        # MinIO 存储服务
│       │   ├── minio.go    # MinIO 客户端封装
│       │   └── cleanup.go  # 文件清理服务
│       └── crawler/        # 爬虫服务
│           └── http_client.go # 爬虫 HTTP 客户端
├── pkg/logger/             # 日志工具
├── tests/                  # 测试
│   └── unit/
│       └── asr_test.go     # ASR 单元测试
├── Makefile
├── Dockerfile
└── docker-compose.yml
```

## MinIO 对象存储

本项目使用 MinIO 作为本地对象存储服务，用于存储音频文件和转录结果。

### 启动 MinIO

MinIO 服务配置在项目根目录的 `minio/` 文件夹中：

```bash
# 进入 MinIO 目录
cd ../minio

# 启动 MinIO 服务（包括创建存储桶）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 访问管理控制台
# http://localhost:9001
# 用户名: minioadmin
# 密码: minioadmin
```

### 存储桶

| 存储桶 | 用途 |
|--------|------|
| `podcasts-audio` | 播客音频文件 |
| `asr-results` | ASR 转录结果（JSON） |
| `user-notes` | 用户笔记 |
| `collab-docs` | 协作文档 |

### 自动清理

系统会自动清理 7 天前的音频和转录结果文件，清理间隔为 1 小时。

配置环境变量：
- `CLEANUP_INTERVAL`: 清理间隔（默认 1h）
- `FILE_RETENTION_DAYS`: 文件保留天数（默认 7）

详见 `minio/README.md`。

## 开发指南

### 添加新路由

1. 在 `internal/api/handler/` 创建处理器
2. 在 `internal/api/router/router.go` 注册路由

### 添加中间件

在 `internal/api/middleware/` 创建中间件，然后在 `router.go` 中注册。

## 测试

```bash
make test
```

## 构建

```bash
make build
```

二进制文件输出到 `bin/server`。

---

**迁移进度**: 阶段4/5（爬虫服务集成）
