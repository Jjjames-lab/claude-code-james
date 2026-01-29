# Go 后端迁移 - 阶段 1 验收测试

## 测试环境准备

### 前置条件
- Go 1.21+ 已安装
- Docker 已安装（可选）

### 环境变量配置

复制环境变量模板：
```bash
cd backend-go
cp .env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：
```bash
APP_PORT=8080
APP_DEBUG=true
APP_LOGLEVEL=info

# 豆包 ASR 配置
DOUBAO_APP_ID=your_app_id
DOUBAO_ACCESS_TOKEN=your_access_token

# 阿里云 Qwen 配置
QWEN_API_KEY=your_api_key
```

## 验收测试步骤

### 1. 本地运行测试

#### 1.1 安装依赖
```bash
cd backend-go
make deps
```

预期输出：
```
Installing dependencies...
Dependencies installed
```

#### 1.2 运行服务
```bash
make run
```

预期输出：
```
Running server...
{"level":"info","ts":"2026-01-21T10:00:00Z","caller":"backend-go/cmd/server/main.go:25","msg":"Starting server","port":"8080","env":"development"}
[GIN-debug] Listening and serving on :8080
```

#### 1.3 测试健康检查端点
在另一个终端窗口执行：
```bash
curl http://localhost:8080/api/v1/health
```

预期输出：
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

#### 1.4 测试 CORS
```bash
curl -H "Origin: http://localhost:3000" \
      -H "Access-Control-Request-Method: GET" \
      -H "Access-Control-Request-Headers: Content-Type" \
      -X OPTIONS \
      http://localhost:8080/api/v1/health
```

预期响应头：
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Origin,Content-Type,Authorization
```

### 2. 构建测试

#### 2.1 构建二进制文件
```bash
make build
```

预期输出：
```
Building binary...
Build complete: bin/server
```

#### 2.2 运行构建的二进制
```bash
./bin/server
```

预期输出：
```
{"level":"info","ts":"2026-01-21T10:00:00Z","caller":"backend-go/cmd/server/main.go:25","msg":"Starting server","port":"8080","env":"development"}
[GIN-debug] Listening and serving on :8080
```

#### 2.3 再次测试健康检查
```bash
curl http://localhost:8080/api/v1/health
```

### 3. Docker 测试（可选）

#### 3.1 构建镜像
```bash
make docker-build
```

预期输出：
```
Building Docker image...
# [构建步骤输出...]
Docker image built
```

#### 3.2 运行容器
```bash
make docker-run
```

或使用 docker-compose：
```bash
docker-compose up -d
```

预期输出：
```
Running Docker container...
[+] Running 1/1
 ✔ Pod backend-go-1  Started
```

#### 3.3 测试容器化服务
```bash
curl http://localhost:8080/api/v1/health
```

预期输出与本地运行相同。

#### 3.4 查看日志
```bash
docker-compose logs -f backend-go
```

预期输出包含：
```
backend-go-1  | {"level":"info","ts":"2026-01-21T10:00:00Z","caller":"backend-go/cmd/server/main.go:25","msg":"Starting server","port":"8080","env":"development"}
backend-go-1  | [GIN-debug] Listening and serving on :8080
```

### 4. 性能基准测试（可选）

#### 4.1 使用 Apache Bench
```bash
# 安装 ab: brew install httpd (macOS)
ab -n 1000 -c 10 http://localhost:8080/api/v1/health
```

预期结果：
```
Requests per second:    5000+ [#/sec] (mean)
Time per request:       2 [ms] (mean)
Failed requests:        0
```

## 验收标准

✅ **所有测试通过的标准：**

1. ✅ 服务成功启动，无错误日志
2. ✅ `/api/v1/health` 端点返回正确的 JSON 响应
3. ✅ 响应包含 `status`, `timestamp`, `services` 字段
4. ✅ CORS 头部正确设置
5. ✅ 日志使用 Zap 结构化格式
6. ✅ 配置通过 Viper 从环境变量加载
7. ✅ Docker 镜像成功构建和运行
8. ✅ 健康检查响应时间 < 10ms

## 故障排查

### 问题 1: 服务无法启动
```bash
# 检查端口占用
lsof -i :8080

# 更改端口
export APP_PORT=8081
make run
```

### 问题 2: 环境变量未加载
```bash
# 确认 .env 文件存在
cat .env

# 手动设置环境变量
export DOUBAO_APP_ID=your_app_id
export DOUBAO_ACCESS_TOKEN=your_access_token
export QWEN_API_KEY=your_api_key
```

### 问题 3: Docker 构建失败
```bash
# 清理并重新构建
docker system prune -f
make docker-build
```

### 问题 4: CORS 错误
检查 `internal/api/middleware/cors.go` 中的配置：
```go
AllowAllOrigins:  true,
AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
```

## 测试结果记录

测试日期：_____________

测试人：_____________

| 测试项 | 结果 | 备注 |
|--------|------|------|
| 依赖安装 | ☐ 通过 ☐ 失败 | |
| 服务启动 | ☐ 通过 ☐ 失败 | |
| 健康检查端点 | ☐ 通过 ☐ 失败 | |
| CORS 配置 | ☐ 通过 ☐ 失败 | |
| 二进制构建 | ☐ 通过 ☐ 失败 | |
| Docker 构建 | ☐ 通过 ☐ 失败 | |
| Docker 运行 | ☐ 通过 ☐ 失败 | |
| 日志格式验证 | ☐ 通过 ☐ 失败 | |

**总体评估：** ☐ 通过验收  ☐ 需要修复

---

**阶段 1 完成标准：**
- [x] Go 项目初始化完成
- [x] 健康检查端点实现
- [x] Viper + Zap 配置完成
- [x] CORS 中间件添加
- [x] Makefile 编写完成
- [x] Docker 容器化完成
- [ ] 验收测试通过（待执行）

**下一步：阶段 2 - ASR 服务迁移（预计 3 天）**
