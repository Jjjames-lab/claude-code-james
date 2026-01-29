# 更新日志

## [2.0.0] - 2026-01-28

### 🎨 重大更新：深邃有机设计系统

#### 新增
- ✨ 全新"深邃有机"设计系统
- ✨ 玻璃态卡片组件 (`GlassCard.tsx`)
- ✨ 有机渐变背景动画
- ✨ 增强版组件：UrlInputEnhanced, AudioPlayerEnhanced, ChaptersSectionEnhanced
- ✨ 转录进度实时显示（Waves 动画 + Shimmer 进度条）

#### 改进
- 🎯 左侧 Tab 导航布局（224px 固定宽度）
- 🎯 Shownote 格式完整保留（加粗、斜体、链接、列表）
- 🎯 转录按钮移至卡片顶部，避免被推离屏幕
- 🎯 概览页面重新设计（对标 Scripod）

#### 修复
- 🐛 修复 Tab 切换章节数据丢失问题
- 🐛 修复设计系统未生效（CSS 导入顺序）
- 🐛 修复 Shownote HTML 格式丢失（移除 prose 类）
- 🐛 修复节目详情展开后转录按钮不可见

#### 删除
- 🗑️ 清理旧组件：UrlInput, AudioPlayer, ChaptersSection, PodcastSkeleton
- 🗑️ 清理旧样式：design-system.css, globals.css
- 🗑️ 清理旧文档：PROJECT_README.md, FRONTEND_UPGRADE_GUIDE.md
- 🗑️ 清理 Mock 数据：mockData.ts

---

## [1.5.0] - 2026-01-26

### 新增
- ✨ AI 逐字稿优化功能
- ✨ 原始/优化模式切换
- ✨ 章节自动生成

### 改进
- 🎯 优化 LLM Prompt
- 🎯 添加转录模式切换 UI

---

## [1.0.0] - 2026-01-20

### 初始版本
- ✅ URL 输入与解析
- ✅ ASR 转录集成
- ✅ 音频播放器
- ✅ 逐字稿查看
- ✅ 基础 Tab 导航
- ✅ 句子级跳转
- ✅ 播放器状态管理（Zustand）

---

## 规划中

### [2.1.0] - 计划中
- [ ] 概览页面完善（Scripod 对标）
- [ ] LLM 并发处理优化（减少 80% 等待时间）
- [ ] 虚拟滚动（长逐字稿）
- [ ] Highlights 自动提取

### [2.2.0] - 计划中
- [ ] 书签/笔记系统
- [ ] 全文搜索
- [ ] 导出功能（PDF/Markdown）
- [ ] 键盘快捷键

### [3.0.0] - 计划中
- [ ] 移动端适配
- [ ] PWA 离线支持
- [ ] 主题切换（深色/浅色）

---

**版本规范**: 遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)
