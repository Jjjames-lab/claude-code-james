#!/bin/bash

# Bookshelf Sounds 项目启动脚本
# 每次打开项目时运行此脚本，确保了解最新状态

echo "🎧 Bookshelf Sounds 项目启动检查"
echo "======================================"
echo ""
echo "📅 当前日期: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  警告: 你有未提交的更改"
    git status --short
    echo ""
fi

echo "📋 必读检查清单:"
echo "======================================"
echo ""

# 读取 CHANGELOG 第一行
if [ -f "docs/product/CHANGELOG.md" ]; then
    current_version=$(head -n 1 "docs/product/CHANGELOG.md")
    echo "✅ 当前产品版本: $current_version"
    echo ""
fi

echo "1. 你是第一次参与本项目吗？"
echo "   → 请阅读: docs/product/产品文档_README.md"
echo ""
echo "2. 想了解最新变更？"
echo "   → 请阅读: docs/product/CHANGELOG.md"
echo ""
echo "3. 开始开发新功能？"
echo "   → 请阅读: docs/development/CHECKLIST.md"
echo ""

echo "🔗 快速打开文档:"
echo "======================================"
echo "open docs/product/产品文档_README.md      # 文档索引"
echo "open docs/product/CHANGELOG.md              # 变更日志"
echo "open docs/product/产品需求文档_总览.md      # 产品需求"
echo "open docs/development/CHECKLIST.md          # 开发清单"
echo ""

# 询问是否立即打开文档
read -p "是否立即打开产品文档索引？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open docs/product/产品文档_README.md
fi

echo ""
echo "🚀 准备就绪！开始工作吧！"
echo "======================================"
