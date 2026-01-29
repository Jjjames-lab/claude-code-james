#!/bin/bash

echo "========================================="
echo "  小宇宙深度学习助手 API - 快速启动脚本"
echo "========================================="
echo ""

# 检查 Python 版本
echo "📌 检查 Python 版本..."
python --version

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo ""
    echo "⚠️  虚拟环境不存在，正在创建..."
    python -m venv venv
    echo "✅ 虚拟环境创建完成"
fi

# 激活虚拟环境
echo ""
echo "🔌 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo ""
echo "📦 安装 Python 依赖..."
pip install -q -r requirements.txt
echo "✅ 依赖安装完成"

# 检查 Playwright 浏览器
echo ""
echo "🌐 检查 Playwright 浏览器..."
if ! playwright install chromium 2>/dev/null; then
    echo "⚠️  Playwright 浏览器未安装，正在安装..."
    playwright install chromium
fi
echo "✅ Playwright 浏览器就绪"

# 检查环境变量
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  .env 文件不存在，从模板创建..."
    cp .env.example .env
    echo "✅ .env 文件已创建，请根据需要编辑 API Key"
fi

echo ""
echo "========================================="
echo "  🚀 启动服务..."
echo "========================================="
echo ""
echo "📍 API 文档: http://localhost:8000/docs"
echo "📍 健康检查: http://localhost:8000/api/v1/health"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 启动服务
python main.py
