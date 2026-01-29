# Bookshelf Sounds

> **我们不追求去抢夺任何人的注意力，而更愿意保护你的注意力，能放到你感兴趣的地方。这里是一个可以帮助你更好使用播客的地方，帮助你记录你的笔记、理解播客内容、发散你的好奇心。这里是像星际穿越中的男主女儿会在的书柜旁，很安心，虽然没有人在旁边，但是书柜里其实是有个爱你的人在陪伴着你啊。**

**版本**: v2.1.0 | **状态**: 活跃开发中 | **更新**: 2026-01-29

---

## 📖 新成员必读（启动项目前必看！）

### 第一次参与本项目？
**按顺序阅读以下文档**（约 15 分钟）：

1. **📄 产品文档索引**（5 分钟）
   ```bash
   open docs/product/产品文档_README.md
   ```
   了解文档结构、版本管理、更新机制

2. **📄 产品变更日志**（3 分钟）
   ```bash
   open docs/product/CHANGELOG.md
   ```
   了解历史版本和最新变更

3. **📄 产品需求总览**（7 分钟）
   ```bash
   open docs/product/产品需求文档_总览.md
   ```
   理解完整产品愿景、功能、架构

### 开始新功能开发前？
**检查清单**：
- [ ] 阅读相关功能需求文档
- [ ] 查看设计规范（UI/UX）
- [ ] 确认技术方案
- [ ] 检查是否有依赖功能

### 📌 重要提醒
- ✅ **所有需求/设计变更必须更新产品文档**
- ✅ **使用 Git commit 格式：`docs: 更新 xxx 功能需求（v2.1.0）`**
- ✅ **详细需求在 `docs/product/功能需求/` 目录**
- ✅ **设计规范在 `docs/product/设计规范/` 目录**

---

## 🎯 项目简介

小宇宙深度学习助手是一款基于 AI 的播客学习工具，提供精准转录、智能分章、句子级跳转等功能。

### 核心功能
- ✅ **链接解析** - 输入小宇宙链接，自动获取节目信息
- ✅ **语音转录** - 豆包 ASR 引擎，支持词级时间戳
- ✅ **AI 优化** - LLM 自动添加标点、合并段落
- ✅ **智能分章** - 自动生成章节结构
- ✅ **多模态展示** - 概览、章节、逐字稿、节目单

---

## 🚀 快速开始

### 前置要求
- Node.js 18+
- Python 3.10+
- 两个终端窗口

### 启动步骤

#### 1️⃣ 启动后端
```bash
cd backend/backend
./start.sh
# 或
source ../venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

#### 2️⃣ 启动前端
```bash
cd frontend/pod-studio
npm run dev
```

#### 3️⃣ 访问应用
- **前端**: http://localhost:5173
- **后端 API**: http://localhost:8001/docs

**详细启动指南**: 查看 [QUICKSTART.md](./QUICKSTART.md)

---

## 📂 项目结构

```
Pod/
├── frontend/              # 前端项目 (React + TypeScript + Vite)
│   └── pod-studio/
│       ├── src/
│       ├── PROJECT_GUIDE.md    # 前端完整指南
│       └── README.md
│
├── backend/               # 后端项目 (Python + FastAPI)
│   └── backend/
│       ├── app/
│       ├── main.py
│       └── requirements.txt
│
├── backend-go/            # Go 后端（备选）
│
├── docs/                  # 项目文档
│   ├── product/           # 产品文档
│   ├── technical/         # 技术文档
│   ├── development/       # 开发记录
│   ├── research/          # 调研资料
│   └── archived/          # 归档文档
│
├── services/              # 外部服务配置
├── infrastructure/        # 基础设施（MinIO等）
├── scripts/               # 工具脚本
├── roles/                 # 角色相关（产品、设计、架构）
└── _shared/               # 共享资源
```

---

## 📚 文档导航

### 必读文档
- 📖 [QUICKSTART.md](./QUICKSTART.md) - 快速启动指南
- 📖 [CHANGELOG.md](./CHANGELOG.md) - 版本变更记录

### 产品文档
- [产品需求文档 (MVP 1.0)](./docs/product/小宇宙深度学习助手%20-%20产品需求文档%20(MVP%201.0).md)
- [完整产品文档](./docs/product/小宇宙深度学习助手-完整产品文档.md)
- [Scripod 调研报告](./docs/product/Scripod产品调研报告.md)

### 技术文档
- [技术路线规划](./docs/technical/技术路线规划方案.md)
- [豆包 ASR 深度分析](./docs/technical/豆包ASR深度分析报告.md)
- [性能优化报告](./docs/technical/性能优化报告.md)

### 开发记录
- [工作日志](./docs/development/工作日志_2026-01-27.md)
- [任务完成总结](./docs/development/任务完成总结_2026-01-27.md)
- [测试报告](./docs/development/测试报告_2026-01-28.md)

### 前端文档
- [前端快速启动](./docs/frontend/FRONTEND_QUICKSTART.md)
- [前端项目说明](./frontend/README.md)
- [项目工作历史](./docs/development/PROJECT_WORK_HISTORY.md)

---

## 🛠️ 技术栈

### 前端
- **框架**: React 19 + TypeScript + Vite
- **样式**: Tailwind CSS + 自定义设计系统
- **状态**: Zustand
- **图标**: Lucide React

### 后端
- **框架**: FastAPI (Python 3.10+)
- **ASR**: 豆包 / 千问
- **AI**: 智谱 GLM-4
- **存储**: MinIO (对象存储)

---

## ✨ 已实现功能

### 核心流程
- [x] URL 输入与解析
- [x] 节目信息展示
- [x] ASR 转录集成
- [x] 转录进度实时显示
- [x] 音频播放器
- [x] 逐字稿查看

### AI 功能
- [x] LLM 逐字稿优化
- [x] 原始/优化模式切换
- [x] 章节自动生成

### 用户体验
- [x] 左侧 Tab 导航
- [x] 句子级跳转
- [x] 当前播放高亮
- [x] 节目单格式保留

---

## 🚧 待完成功能

### Phase 1: 核心完善（当前）
- [ ] 概览页面完善（对标 Scripod）
- [ ] LLM 并发处理优化（减少 80% 等待时间）

### Phase 2: 高级功能
- [ ] Highlights 自动提取
- [ ] 书签/笔记系统
- [ ] 全文搜索
- [ ] 导出功能（PDF/Markdown）

### Phase 3: 体验优化
- [ ] 键盘快捷键
- [ ] 离线 PWA
- [ ] 移动端适配
- [ ] 主题切换

---

## 🐛 已知问题

| 问题 | 状态 | 解决方案 |
|------|------|---------|
| Tab 切换数据丢失 | ✅ 已解决 | 添加本地状态管理 |
| 设计系统未生效 | ✅ 已解决 | 调整 CSS 导入顺序 |
| Shownote 格式丢失 | ✅ 已解决 | 自定义样式 |
| 转录按钮被推离屏幕 | ✅ 已解决 | 移到卡片顶部 |

详细问题记录见 [前端项目指南](./frontend/pod-studio/PROJECT_GUIDE.md)

---

## 🤝 贡献指南

### 开发规范
1. 使用 TypeScript 类型注解
2. 组件使用函数式 + Hooks
3. 样式优先使用 Tailwind
4. 复杂逻辑添加注释

### Git 提交规范
```bash
feat: 添加新功能
fix: 修复问题
style: 样式调整
refactor: 重构代码
docs: 更新文档
```

---

## 📞 联系

**产品经理**: James
**技术支持**: Claude Code
**开发时间**: 2026-01-20 ~ 2026-01-28

---

**查看完整文档**: [docs/](./docs/)
