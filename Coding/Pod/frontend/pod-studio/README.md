# 小宇宙深度学习助手

> 对标 Scripod 的专业播客学习工具

**版本**: v2.0
**状态**: 开发中
**最后更新**: 2026-01-28

---

## 🎯 产品简介

小宇宙深度学习助手是一款基于 AI 的播客学习工具，提供精准转录、智能分章、句子级跳转等功能。

### 核心功能
- ✅ **链接解析** - 输入小宇宙链接，自动获取节目信息
- ✅ **语音转录** - 豆包 ASR 引擎，支持词级时间戳
- ✅ **AI 优化** - LLM 自动添加标点、合并段落
- ✅ **智能分章** - 自动生成章节结构
- ✅ **多模态展示** - 概览、章节、逐字稿、节目单

---

## 🚀 快速开始

### 安装与运行
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问
http://localhost:5173
```

### 构建生产版本
```bash
npm run build
npm run preview
```

---

## 📚 文档导航

### 📖 [项目完整指南](./PROJECT_GUIDE.md)
**必读** - 包含项目的完整信息：
- 🎨 设计系统详解
- 📂 项目结构说明
- 🐛 历史问题与解决方案
- 🔧 开发指南和调试技巧
- 🗑️ 文件清理清单

### 快速链接
- **设计系统**: `src/styles/design-system-v2.css`
- **主页面**: `src/pages/HomePage.tsx`
- **状态管理**: `src/stores/playerStore.ts`
- **API 封装**: `src/services/api.ts`

---

## 🎨 设计系统：深邃有机

拒绝紫色渐变陈词滥调，采用深邃有机设计语言：

**特点**：
- 深邃背景 + 有机渐变
- 玻璃态卡片 + 噪点纹理
- 微动效 + 细腻交互

**色彩**：
- 背景: `#0a0a0f`
- 主色: `#a78bfa` (紫罗兰)
- 玻璃态: `rgba(255, 255, 255, 0.03)`

---

## 🛠️ 技术栈

- **框架**: React 19 + TypeScript + Vite
- **样式**: Tailwind CSS + 自定义设计系统
- **状态**: Zustand
- **图标**: Lucide React
- **后端**: Express（独立项目）

---

## 📂 项目结构

```
src/
├── pages/
│   └── HomePage.tsx              # 主页面
├── components/
│   ├── audio/                    # 音频播放器
│   ├── transcript/               # 逐字稿查看器
│   ├── chapters/                 # 章节列表
│   ├── overview/                 # 概览页面
│   ├── shownote/                 # 节目单渲染器
│   ├── url/                      # URL 输入框
│   └── ui/                       # UI 组件
├── stores/
│   └── playerStore.ts            # 状态管理
├── services/
│   └── api.ts                    # API 调用
├── styles/
│   └── design-system-v2.css      # 设计系统
└── types/
    └── index.ts                  # 类型定义
```

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

- [ ] 概览页面完善（对标 Scripod）
- [ ] LLM 并发处理优化（减少 80% 等待时间）
- [ ] Highlights 自动提取
- [ ] 书签/笔记系统
- [ ] 全文搜索
- [ ] 导出功能
- [ ] 键盘快捷键
- [ ] 移动端适配

---

## 🐛 已知问题与解决方案

| 问题 | 解决方案 | 状态 |
|------|---------|------|
| Tab 切换数据丢失 | 添加本地状态管理 | ✅ 已解决 |
| 设计系统未生效 | 调整 CSS 导入顺序 | ✅ 已解决 |
| Shownote 格式丢失 | 自定义样式 | ✅ 已解决 |
| 转录按钮被推离屏幕 | 移到卡片顶部 | ✅ 已解决 |

详细问题记录见 [项目完整指南](./PROJECT_GUIDE.md)。

---

## 🔧 开发指南

### 调试技巧
```tsx
// 查看播放器状态
const playerState = usePlayerStore();
console.log('播放器:', playerState);

// 查看应用状态
console.log('当前状态:', { appState, activeTab, transcript });
```

### 常用命令
```bash
# 类型检查
npx tsc --noEmit

# 代码检查
npm run lint

# 构建生产版本
npm run build
```

---

## 📊 性能优化

### LLM 并发处理
**当前**: 串行处理 10000 字符需 80 秒
**优化**: 并发处理（5 个一批）减少到 16 秒

**实现**:
```python
# 后端实现
class AdaptiveConcurrencyProcessor:
    async def process_chunks(self, chunks):
        for i in range(0, len(chunks), 5):
            batch = chunks[i:i+5]
            await asyncio.gather(*[process_chunk(c) for c in batch])
```

---

## 🤝 贡献指南

### 代码规范
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
```

---

## 📞 联系

**产品经理**: James
**技术支持**: Claude Code
**开发时间**: 2026-01-20 ~ 2026-01-28

---

**查看完整文档**: [PROJECT_GUIDE.md](./PROJECT_GUIDE.md)
