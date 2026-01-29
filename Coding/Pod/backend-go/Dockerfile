# 构建阶段
FROM golang:1.21-alpine AS builder

# 安装必要的工具
RUN apk add --no-cache git

# 设置工作目录
WORKDIR /app

# 复制 go.mod 和 go.sum
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建二进制
RUN CGO_ENABLED=0 GOOS=linux go build -o server cmd/server/main.go

# 运行阶段
FROM alpine:latest

# 安装 ca 证书（如果需要）
RUN apk --no-cache add ca-certificates

WORKDIR /app

# 从构建阶段复制二进制
COPY --from=builder /app/server .

# 暴露端口
EXPOSE 8080

# 运行服务
CMD ["./server"]
