#!/bin/bash

echo "=================================="
echo "  正在启动AI旅行顾问 - 前端界面"
echo "=================================="
echo ""

cd frontend

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "首次运行，正在安装依赖..."
    npm install
    echo ""
fi

echo "启动前端界面..."
echo ""
echo "启动后，请在浏览器打开: http://localhost:3000"
echo ""
npm start
