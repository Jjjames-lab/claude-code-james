#!/bin/bash

echo "Starting Python Crawler Service..."

# 进入脚本所在目录
cd "$(dirname "$0")"

# 激活虚拟环境（如果存在）
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# 启动服务（端口 8001）
echo "Starting Crawler Service on port 8001..."
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
