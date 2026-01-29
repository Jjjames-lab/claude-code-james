# MinIO 本地存储服务

小宇宙播客深度学习助手 - MinIO 对象存储服务

## 📋 存储桶说明

| 存储桶 | 用途 | 访问权限 |
|--------|------|---------|
| `podcasts-audio` | 播客音频文件 | 下载（公开） |
| `asr-results` | ASR 转录结果 | 下载（公开） |
| `user-notes` | 用户笔记 | 私有 |
| `collab-docs` | 协作文档 | 私有 |

## 🚀 快速开始

### 启动 MinIO

```bash
# 进入 MinIO 目录
cd minio

# 启动服务（后台运行）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 访问管理控制台

- **URL**: http://localhost:9001
- **用户名**: `minioadmin`
- **密码**: `minioadmin`

### API 端点

- **API URL**: http://localhost:9000

## 📊 数据持久化

所有数据存储在 `./data` 目录中：

```bash
minio/
├── docker-compose.yml
├── README.md
└── data/              # MinIO 数据目录
    ├── .minio.sys/    # 系统文件
    ├── podcasts-audio/
    ├── asr-results/
    ├── user-notes/
    └── collab-docs/
```

## 🔧 常用命令

### 查看容器状态

```bash
docker-compose ps
```

### 查看日志

```bash
# 所有日志
docker-compose logs -f

# 只看 MinIO 日志
docker-compose logs -f minio

# 只看初始化日志
docker-compose logs -f create-buckets
```

### 重新创建存储桶

```bash
# 停止并删除容器
docker-compose down

# 删除数据（⚠️ 警告：会删除所有数据）
rm -rf data/*

# 重新启动
docker-compose up -d
```

### 执行 MinIO 客户端命令

```bash
# 进入容器
docker exec -it pod-minio sh

# 使用 mc 命令
mc alias set local http://localhost:9000 minioadmin minioadmin
mc ls local/
mc tree local/
```

## 🧪 验证测试

### 测试 1：检查容器状态

```bash
docker ps | grep pod-minio
```

应该看到两个容器：
- `pod-minio` - MinIO 服务
- `pod-minio-init` - 初始化容器（执行完会退出）

### 测试 2：访问管理控制台

1. 打开浏览器访问 http://localhost:9001
2. 使用 `minioadmin/minioadmin` 登录
3. 确认4个存储桶已创建

### 测试 3：API 连接测试

```bash
curl http://localhost:9000/minio/health/live
```

应该返回：`OK`

### 测试 4：Go 客户端测试

在 `backend-go` 目录运行：

```bash
make run
```

查看日志，确认 MinIO 连接成功。

## 📝 配置说明

### 环境变量

| 变量 | 值 | 说明 |
|------|-----|------|
| `MINIO_ROOT_USER` | `minioadmin` | 管理员用户名 |
| `MINIO_ROOT_PASSWORD` | `minioadmin` | 管理员密码 |
| `MINIO_ENDPOINT` | `localhost:9000` | API 端点 |

### 端口映射

| 端口 | 用途 |
|------|------|
| `9000` | MinIO API |
| `9001` | Web 管理控制台 |

## 🔒 安全提示

⚠️ **生产环境注意事项**：

1. **修改默认密码**：不要在生产环境使用 `minioadmin`
2. **启用 HTTPS**：配置 SSL 证书
3. **访问控制**：限制管理控制台访问
4. **备份策略**：定期备份 `data` 目录

## 🐛 故障排查

### 问题 1：容器无法启动

```bash
# 查看日志
docker-compose logs minio

# 检查端口占用
lsof -i :9000
lsof -i :9001

# 解决方案：停止占用端口的进程或修改 docker-compose.yml 中的端口
```

### 问题 2：存储桶未创建

```bash
# 手动创建存储桶
docker exec -it pod-minio-init sh
mc alias set local http://minio:9000 minioadmin minioadmin
mc mb local/podcasts-audio
mc mb local/asr-results
mc mb local/user-notes
mc mb local/collab-docs
```

### 问题 3：数据丢失

```bash
# 检查数据目录权限
ls -la data/

# 重新设置权限
chmod -R 777 data/
```

## 📚 相关文档

- [MinIO 官方文档](https://docs.min.io/)
- [MinIO Go SDK](https://min.io/docs/minio/linux/developers/go/minio-go.html)
- [Docker Compose 文档](https://docs.docker.com/compose/)

---

**创建日期**: 2026-01-21
**维护者**: 后端工程师
