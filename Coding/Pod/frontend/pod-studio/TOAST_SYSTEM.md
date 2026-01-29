# Toast 通知系统

## 概述
已实现专业的 Toast 通知系统，替代不专业的原生 `alert()` 弹窗。

## 文件结构

### 1. Store - `src/stores/toastStore.ts`
管理所有通知的状态：
- `toasts`: 当前显示的通知列表
- `addToast()`: 添加新通知
- `removeToast()`: 移除指定通知
- `clearAll()`: 清空所有通知

### 2. 组件 - `src/components/ui/ToastContainer.tsx`
渲染通知容器和单个 Toast：
- 使用 Portal 渲染到 document.body
- 支持4种类型：success, error, info, warning
- 每种类型有独特的图标和颜色
- 3秒后自动关闭（可配置）
- 支持手动关闭

### 3. 全局集成 - `src/App.tsx`
在应用根部添加 `<ToastContainer />`，确保全局可用。

## 使用方式

```typescript
import { useToastStore } from '@/stores/toastStore';

const { addToast } = useToastStore();

// 成功提示
addToast({
  type: 'success',
  title: '翻译完成',
  message: `逐字稿 114 个段落 · 章节 8 个`,
});

// 错误提示
addToast({
  type: 'error',
  title: '翻译失败',
  message: '网络连接超时',
});

// 警告提示
addToast({
  type: 'warning',
  title: '无法翻译',
  message: '请先完成转录处理',
});

// 信息提示
addToast({
  type: 'info',
  title: '提示',
  message: '长按可以选择文字',
});

// 自定义关闭时间（不自动关闭）
addToast({
  type: 'info',
  title: '长时间任务',
  message: '正在处理中...',
  duration: 0, // 不自动关闭
});
```

## 视觉设计

### 颜色方案
- **Success**: 绿色系 `rgba(34, 197, 94)`
- **Error**: 红色系 `rgba(239, 68, 68)`
- **Info**: 蓝色系 `rgba(59, 130, 246)`
- **Warning**: 黄色系 `rgba(251, 191, 36)`

### 布局
- 固定在右上角
- 最大宽度 420px
- 垂直堆叠，最多显示 3-4 个
- 毛玻璃背景 `backdrop-blur-xl`

### 动画
- 入场：从右侧滑入 `toastSlideIn`
- 持续时间：300ms
- 缓动函数：ease-out

## 已替换的 alert

### EpisodeTabPage.tsx
✅ 转录失败 → error Toast
✅ 请先完成转录 → warning Toast
✅ 翻译完成 → success Toast
✅ 翻译失败 → error Toast

### 其他页面
以下页面仍使用 alert，待替换：
- HomePage.tsx (多处)
- PodcastDetailPage.tsx (1处)

## 设计原则

1. **非模态**: 不阻塞用户操作
2. **自动消失**: 3秒后自动关闭
3. **可手动关闭**: 点击 X 立即关闭
4. **信息清晰**: 标题 + 详细信息
5. **视觉统一**: 遵循极简白设计系统
6. **动画流畅**: 入场动画柔和自然

## 下一步优化

- [ ] 替换 HomePage.tsx 中的所有 alert
- [ ] 替换 PodcastDetailPage.tsx 中的 alert
- [ ] 添加进度条 Toast（用于长时间任务）
- [ ] 支持操作按钮（如"撤销"、"重试"）
- [ ] 支持堆叠位置配置（top/bottom, left/right）
