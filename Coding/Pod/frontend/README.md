# Frontend - Pod Studio

> **小宇宙深度学习助手前端项目**

**技术栈**: React 19 + TypeScript + Vite + Tailwind CSS

---

## 🚀 快速启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问
http://localhost:5173
```

---

## 📚 文档

- **前端快速启动**: [docs/frontend/FRONTEND_QUICKSTART.md](../docs/frontend/FRONTEND_QUICKSTART.md)
- **前端完整指南**: [docs/frontend/](../docs/frontend/)
- **项目工作历史**: [docs/development/PROJECT_WORK_HISTORY.md](../docs/development/PROJECT_WORK_HISTORY.md)
- **项目总文档**: [docs/](../docs/)

---

## 🛠️ 开发

### 构建
```bash
npm run build
```

### 类型检查
```bash
npx tsc --noEmit
```

### 代码检查
```bash
npm run lint
```

---

## 📂 项目结构

```
src/
├── components/          # 组件
│   ├── audio/          # 音频播放器
│   ├── transcript/     # 逐字稿
│   ├── chapters/       # 章节
│   ├── overview/       # 概览
│   ├── shownote/       # 节目单
│   └── ui/             # UI 组件
├── pages/              # 页面
├── stores/             # 状态管理
├── services/           # API 服务
├── styles/             # 样式
│   └── design-system-v2.css  # 设计系统
└── types/              # 类型定义
```

---

## 🎨 设计系统

**深邃有机** (Deep Organic)

- 色彩：深色背景 + 紫罗兰主色
- 效果：玻璃态 + 有机渐变
- 动效：微动效 + 细腻交互

详见：`src/styles/design-system-v2.css`

---

## 🔗 API 配置

后端地址：`http://localhost:8001/api/v1`

配置文件：`src/services/api.ts`

---

**完整文档**: [../docs/](../docs/)
