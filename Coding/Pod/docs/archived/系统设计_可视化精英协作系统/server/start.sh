#!/bin/bash

# 可视化精英协作系统 V2 - 启动脚本

echo ""
echo "=================================="
echo "🚀 可视化精英协作系统 V2"
echo "=================================="
echo ""

# 进入脚本所在目录
cd "$(dirname "$0")"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未安装 Node.js"
    echo ""
    echo "请先安装 Node.js："
    echo "1. 访问 https://nodejs.org/"
    echo "2. 下载并安装 LTS 版本"
    echo "3. 重新运行此脚本"
    echo ""
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    echo ""
    npm install

    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ 依赖安装失败"
        echo "请检查网络连接或尝试使用国内镜像："
        echo "  npm config set registry https://registry.npmmirror.com"
        echo "  npm install"
        echo ""
        exit 1
    fi

    echo ""
    echo "✅ 依赖安装完成"
    echo ""
fi

# 启动服务器
echo "🎯 启动服务器..."
echo ""
npm start
