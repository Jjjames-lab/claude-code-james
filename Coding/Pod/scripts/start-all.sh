#!/bin/bash

echo "==================================="
echo "  Starting All Services"
echo "==================================="
echo ""

# 1. 启动 MinIO
echo "1. Starting MinIO..."
cd minio
docker-compose up -d
echo "✅ MinIO started"
echo ""

# 2. 启动 Python 爬虫服务
echo "2. Starting Python Crawler Service..."
cd "../后端Backend"

# 检查虚拟环境是否存在
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# 启动爬虫服务（后台运行）
./start-crawler.sh &
CRAWLER_PID=$!
echo "✅ Python Crawler Service started (PID: $CRAWLER_PID)"
echo ""

# 等待爬虫服务启动
echo "Waiting for crawler service to initialize..."
sleep 3

# 3. 启动 Go 后端服务
echo "3. Starting Go Backend Service..."
cd ../backend-go

# 运行 Go 服务（前台运行）
echo "✅ Starting Go Backend..."
echo ""
echo "==================================="
echo "All services started!"
echo "  - MinIO: http://localhost:9001 (minioadmin/minioadmin)"
echo "  - Crawler: http://localhost:8001"
echo "  - Go Backend: http://localhost:8080"
echo "==================================="
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# 设置 trap，当用户中断时清理
trap "echo ''; echo 'Stopping services...'; kill $CRAWLER_PID 2>/dev/null; cd minio && docker-compose down; exit" INT TERM

# 启动 Go 服务（前台）
make run

# 清理
echo "Stopping services..."
kill $CRAWLER_PID 2>/dev/null
cd ../minio
docker-compose down
echo "All services stopped."
