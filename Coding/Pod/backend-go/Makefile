.PHONY: build run test clean docker-build docker-run deps

# 构建二进制
build:
	@echo "Building binary..."
	@go build -o bin/server cmd/server/main.go
	@echo "Build complete: bin/server"

# 运行
run:
	@echo "Running server..."
	@go run cmd/server/main.go

# 测试
test:
	@echo "Running tests..."
	@go test -v ./...

# 清理
clean:
	@echo "Cleaning..."
	@rm -rf bin/
	@echo "Clean complete"

# 安装依赖
deps:
	@echo "Installing dependencies..."
	@go mod tidy
	@go mod download
	@echo "Dependencies installed"

# Docker 构建
docker-build:
	@echo "Building Docker image..."
	@docker build -t pod-backend-go:latest .
	@echo "Docker image built"

# Docker 运行
docker-run:
	@echo "Running Docker container..."
	@docker-compose up -d

# 格式化代码
fmt:
	@echo "Formatting code..."
	@go fmt ./...

# 代码检查
lint:
	@echo "Running linter..."
	@golangci-lint run
