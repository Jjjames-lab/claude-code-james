#!/bin/bash

echo "=================================="
echo "  正在启动AI旅行顾问 - 后端服务"
echo "=================================="
echo ""

cd backend

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "首次运行，正在安装依赖..."
    npm install
    echo ""
fi

echo "启动后端服务器..."
echo ""
npm run dev
