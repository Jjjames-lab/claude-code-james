# 小宇宙深度学习助手 - 设计系统 Design Tokens

> **版本**：v1.0
> **更新日期**：2026-01-19
> **设计理念**：冷静、专注、沉浸

---

## 📐 设计哲学

基于产品定位「深度学习工具」，设计系统遵循以下原则：

1. **冷静克制** - 使用中性色调，避免视觉干扰
2. **阅读友好** - 优化长时间阅读体验，降低视觉疲劳
3. **沉浸专注** - 暗色模式优先，减少眼睛刺激
4. **简单极致** - 每个设计决策都有明确目的

---

## 🎨 色彩体系

### 主色调（Primary）

**设计思路**：使用冷灰色系营造专业、冷静的氛围

| 用途 | Light Mode | Dark Mode | Tailwind Class | 说明 |
|------|-----------|-----------|----------------|------|
| **主色** | `#3B82F6` | `#60A5FA` | `blue-500` / `blue-400` | 品牌色，用于主要行动点 |
| **主色 Hover** | `#2563EB` | `#3B82F6` | `blue-600` / `blue-500` | 交互反馈 |
| **主色 Disabled** | `#93C5FD` | `#1E3A8A` | `blue-300` / `blue-900` | 不可用状态 |

### 中性色（Neutral）

**设计思路**：提供舒适的阅读背景和文字对比度

| 用途 | Light Mode | Dark Mode | Tailwind Class | 说明 |
|------|-----------|-----------|----------------|------|
| **背景主色** | `#FFFFFF` | `#0F172A` | `white` / `slate-900` | 主背景 |
| **背景次要** | `#F8FAFC` | `#1E293B` | `slate-50` / `slate-800` | 卡片、面板 |
| **背景三级** | `#F1F5F9` | `#334155` | `slate-100` / `slate-700` | 悬浮、分隔 |
| **文字主色** | `#0F172A` | `#F8FAFC` | `slate-900` / `slate-50` | 标题、重要内容 |
| **文字次要** | `#475569` | `#CBD5E1` | `slate-600` / `slate-300` | 正文 |
| **文字三级** | `#94A3B8` | `#64748B` | `slate-400` / `slate-500` | 标注、辅助信息 |
| **边框色** | `#E2E8F0` | `#334155` | `slate-200` / `slate-700` | 分割线、边框 |

### 语义色（Semantic）

**设计思路**：柔和的提示色，避免过于刺眼

| 类型 | Light Mode | Dark Mode | Tailwind Class | 使用场景 |
|------|-----------|-----------|----------------|----------|
| **Success** | `#10B981` | `#34D399` | `emerald-500` / `emerald-400` | 转录完成、保存成功 |
| **Warning** | `#F59E0B` | `#FBBF24` | `amber-500` / `amber-400` | 网络延迟、需要纠偏 |
| **Error** | `#EF4444` | `#F87171` | `red-500` / `red-400` | 转录失败、网络错误 |
| **Info** | `#3B82F6` | `#60A5FA` | `blue-500` / `blue-400` | 加载中、提示信息 |

### 播放器专属色

**设计思路**：播放进度使用渐变，增强视觉层次

| 元素 | Light Mode | Dark Mode | Tailwind Class |
|------|-----------|-----------|----------------|
| **播放进度条** | `#3B82F6` → `#8B5CF6` | `#60A5FA` → `#A78BFA` | `from-blue-500 to-purple-500` |
| **已播放高亮** | `#DBEAFE` / `#1E40AF` | `#1E3A8A` / `#60A5FA` | `blue-100` / `blue-600` |
| **当前播放词** | `#3B82F6` / `#FFFFFF` | `#60A5FA` / `#FFFFFF` | `blue-500` / `white` |

---

## 🔤 字体层级

### 字体族（Font Family）

**设计思路**：优先使用系统字体，提升加载速度和渲染效果

```css
/* Tailwind Config */
fontFamily: {
  sans: [
    'PingFang SC',           /* 苹方（macOS/iOS） */
    'Microsoft YaHei',       /* 微软雅黑（Windows） */
    'Source Han Sans CN',    /* 思源黑体（跨平台） */
    'sans-serif'
  ],
  mono: [
    'SF Mono',               /* SF Mono（macOS） */
    'Menlo',                 /* Menlo（macOS 备选） */
    'Consolas',              /* Consolas（Windows） */
    'monospace'
  ]
}
```

### 字体尺寸与行高

**设计思路**：行高 1.6-1.8 适合中文阅读，标题层级清晰

| 层级 | 尺寸 | 字重 | 行高 | Tailwind Class | 使用场景 |
|------|------|------|------|----------------|----------|
| **H1** | 32px | 700 | 1.2 | `text-3xl font-bold leading-tight` | 页面主标题 |
| **H2** | 24px | 600 | 1.3 | `text-2xl font-semibold leading-tight` | 区块标题 |
| **H3** | 20px | 600 | 1.4 | `text-xl font-semibold` | 卡片标题 |
| **H4** | 18px | 500 | 1.4 | `text-lg font-medium` | 小节标题 |
| **Body Large** | 16px | 400 | 1.75 | `text-base leading-relaxed` | 播客逐字稿正文 |
| **Body** | 15px | 400 | 1.6 | `text-[15px] leading-normal` | 常规正文 |
| **Body Small** | 14px | 400 | 1.5 | `text-sm leading-normal` | 次要内容 |
| **Caption** | 12px | 400 | 1.4 | `text-xs leading-tight` | 时间戳、标注 |
| **Button** | 14px | 500 | 1.4 | `text-sm font-medium` | 按钮文字 |

### 字母间距（Letter Spacing）

**设计思路**：中文适当增加字母间距提升可读性

| 场景 | 值 | Tailwind Class |
|------|-----|----------------|
| **大标题** | 0.02em | `tracking-wide` |
| **正文** | 0 | `tracking-normal` |
| **按钮** | 0.01em | `tracking-wide` |
| **时间戳** | 0.05em | `tracking-wider` |

---

## 📏 间距系统

### 4px 栅格系统

**设计思路**：基于 4px 的倍数，保持视觉一致性

| Token | 值 | Tailwind Class | 使用场景 |
|-------|-----|----------------|----------|
| **0** | 0px | `p-0` / `m-0` | 无间距 |
| **1** | 4px | `p-1` / `m-1` | 紧密元素 |
| **2** | 8px | `p-2` / `m-2` | 小间距 |
| **3** | 12px | `p-3` / `m-3` | 内边距（小） |
| **4** | 16px | `p-4` / `m-4` | 内边距（标准） |
| **5** | 20px | `p-5` / `m-5` | 内边距（中） |
| **6** | 24px | `p-6` / `m-6` | 卡片内边距 |
| **8** | 32px | `p-8` / `m-8` | 区块间距 |
| **10** | 40px | `p-10` / `m-10` | 大间距 |
| **12** | 48px | `p-12` / `m-12` | 页面边距 |
| **16** | 64px | `p-16` / `m-16` | 超大间距 |

### 布局宽度

**设计思路**：限制最大宽度，提升长文本阅读体验

| 场景 | 宽度 | Tailwind Class |
|------|------|----------------|
| **移动端** | 100% | `w-full` |
| **平板** | 768px | `max-w-3xl` |
| **桌面端** | 1024px | `max-w-5xl` |
| **大屏** | 1280px | `max-w-6xl` |
| **逐字稿阅读宽度** | 720px | `max-w-4xl` | （最佳阅读宽度 60-75 字符）

---

## 🎬 动画参数

### 时长（Duration）

**设计思路**：快速反馈，但不突兀

| 级别 | 时间 | Tailwind Class | 使用场景 |
|------|------|----------------|----------|
| **Fast** | 150ms | `duration-150` | 按钮点击、Hover |
| **Base** | 200ms | `duration-200` | 颜色变化、淡入淡出 |
| **Normal** | 300ms | `duration-300` | 滑动、展开收起 |
| **Slow** | 500ms | `duration-500` | 页面切换、模态框 |

### 缓动函数（Easing）

**设计思路**：使用自然流畅的缓动

| 类型 | Cubic Bezier | Tailwind Class | 使用场景 |
|------|--------------|----------------|----------|
| **Ease Out** | `cubic-bezier(0, 0, 0.2, 1)` | `ease-out` | 退出动画 |
| **Ease In** | `cubic-bezier(0.4, 0, 1, 1)` | `ease-in` | 进入动画 |
| **Ease In Out** | `cubic-bezier(0.4, 0, 0.2, 1)` | `ease-in-out` | 往返动画 |
| **Custom** | `cubic-bezier(0.25, 0.1, 0.25, 1)` | 自定义 | 播放进度条 |

### 常用动画组合

```css
/* 按钮点击反馈 */
hover:scale-105 active:scale-95 transition-transform duration-150 ease-out

/* 卡片悬浮效果 */
hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ease-out

/* 淡入淡出 */
opacity-0 → opacity-100 transition-opacity duration-300 ease-in-out

/* 播放进度平滑移动 */
transition-all duration-100 ease-linear
```

---

## 🌗 暗色模式策略

### 切换方案

**优先暗色模式**：基于「深度学习工具」的定位，建议默认使用暗色模式

```javascript
// Tailwind Config
module.exports = {
  darkMode: 'class', // 手动切换
  // 或
  darkMode: 'media', // 跟随系统（推荐）
}
```

### 暗色模式优化

1. **不使用纯黑**：`#000000` → `#0F172A`（slate-900）
2. **提升对比度**：文字使用 `slate-50` 而非 `slate-200`
3. **降低饱和度**：颜色减淡 10-20%，避免刺眼

### 暗色模式阅读优化

- **段落间距增加**：`mb-6` 而非 `mb-4`
- **字体稍大**：正文 15px 而非 14px
- **背景层次**：使用 slate-900/800/700 创建深度

---

## 🧩 组件样式示例

### 播放器样式

```tsx
// 播放进度条
<div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100 ease-linear" style={{width: '45%'}} />
</div>

// 播放按钮
<button className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors duration-150 active:scale-95">
  <PlayIcon className="w-6 h-6" />
</button>
```

### 逐字稿样式

```tsx
// 逐字稿卡片
<div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
  <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
    深度学习是人工智能的一个分支...
  </p>
  <span className="text-xs text-slate-400 mt-2 tracking-wider">00:05:23</span>
</div>

// 当前播放词高亮
<span className="px-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded transition-colors duration-100">
  深度学习
</span>
```

---

## 📱 响应式断点

遵循 Tailwind 默认断点：

| Breakpoint | Min Width | CSS | 使用场景 |
|------------|-----------|-----|----------|
| **sm** | 640px | `@media (min-width: 640px)` | 手机横屏 |
| **md** | 768px | `@media (min-width: 768px)` | 平板 |
| **lg** | 1024px | `@media (min-width: 1024px)` | 桌面 |
| **xl** | 1280px | `@media (min-width: 1280px)` | 大屏 |
| **2xl** | 1536px | `@media (min-width: 1536px)` | 超大屏 |

---

## 🎯 前端实施建议

### 1. Tailwind Config 配置

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'media', // 跟随系统
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#151e2e', // 自定义暗色背景
        }
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'Source Han Sans CN', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '15': ['15px', { lineHeight: '1.6' }],
      }
    }
  }
}
```

### 2. CSS 变量（备选方案）

如果需要动态主题切换，可使用 CSS 变量：

```css
:root {
  --color-bg-primary: #FFFFFF;
  --color-text-primary: #0F172A;
  --font-family-base: 'PingFang SC', sans-serif;
}

.dark {
  --color-bg-primary: #0F172A;
  --color-text-primary: #F8FAFC;
}
```

### 3. 性能优化建议

- **避免频繁的 DOM 操作**：使用 CSS transform 而非 top/left
- **虚拟列表**：逐字稿超过 1000 条时使用 `react-window`
- **懒加载**：播客封面图使用 `loading="lazy"`
- **防抖节流**：播放进度更新使用 `requestAnimationFrame`

### 4. 可访问性（A11y）

- **色彩对比度**：确保文字与背景对比度 ≥ 4.5:1
- **焦点状态**：所有可交互元素有清晰的 `focus:ring`
- **语义化 HTML**：使用 `<article>` `<section>` `<time>` 等标签
- **ARIA 标签**：播放按钮添加 `aria-label="播放"`

---

## 📚 参考资料

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Material Design Color System](https://material.io/design/color/)
- [Apple Human Interface Guidelines - Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

---

**文档维护**：本文档应随产品迭代持续更新，任何设计决策的变更都应在此记录。
