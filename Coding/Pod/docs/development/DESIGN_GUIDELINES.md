# 设计规范（Design Guidelines）

## 核心原则

### 1. 不使用 Emoji
**所有设计元素禁止使用 emoji**，使用以下替代方案：
- **图标**：使用 `lucide-react` 图标库
- **图片**：用户提供或设计的图片资源
- **SVG 图标**：自定义 SVG 图标
- **CSS 图形**：纯 CSS 实现的视觉效果

**原因**：
- Emoji 样式在不同系统/浏览器中不一致
- 无法精确控制颜色、大小
- 不符合专业设计美学
- 难以维护品牌一致性

## 当前需要替换的 Emoji

### 高优先级（用户可见界面）

#### AudioPlayerEnhanced.tsx
- ❌ `📊` (时长显示) - 第261行
  - **替代方案**：纯文本时间显示，或使用 Clock 图标

#### EpisodeTabPage.tsx
- ❌ `🎙️ Run AI Processing` - 第396行
  - **替代方案**：使用 Mic 图标 + 文字

#### HomePage.tsx
- ❌ `📊` (概览 Tab) - 多处
- ❌ `⚙️` (设置 Tab)
- ❌ `⌨️` (快捷键 Tab)
  - **替代方案**：使用 lucide-react 图标

### 中优先级（功能标识）

#### TranscriptViewer.tsx
- ❌ `💭` (添加笔记按钮) - 第334行
  - **替代方案**：使用 MessageSquare 或 PenTool 图标

#### NoteInputModal.tsx
- ❌ `💭 想法` (笔记类型)
  - **替代方案**：使用 Lightbulb 图标 + 文字

#### StatsPanel.tsx
- ❌ `📊` (统计面板标题)
- ❌ `🎙️` (播客统计)
- ❌ `⭐` (收藏统计)
  - **替代方案**：使用 BarChart3, Mic, Star 图标

#### EmptyState.tsx
- ❌ `🎙️` (空状态图标)
  - **替代方案**：使用 Mic 图标

### 低优先级（内部组件）

#### HighlightsPanel.tsx
- ❌ `📊 数据` (高亮类型)
- ❌ `📈` (图表类型)

#### HistoryPanel.tsx
- ❌ `⏱️` (时长显示)
  - **替代方案**：使用 Clock 图标

#### SearchBar.tsx
- ❌ `💭` (想法笔记搜索)
  - **替代方案**：使用 Lightbulb 图标

## 图标库使用规范

### lucide-react 图标库（已安装）

**常用图标推荐**：

| 功能 | 推荐图标 | 说明 |
|------|---------|------|
| 时长/时间 | `Clock` | 时间显示 |
| 播放/控制 | `Play`, `Pause`, `SkipBack`, `SkipForward` | 播放控制 |
| 音量 | `Volume2`, `VolumeX` | 音量控制 |
| 收藏/星标 | `Star` | 收藏功能 |
| 笔记/想法 | `MessageSquare`, `PenTool`, `Lightbulb` | 笔记相关 |
| 播客/音频 | `Mic`, `Radio`, `Headphones` | 音频内容 |
| 统计/数据 | `BarChart3`, `TrendingUp`, `PieChart` | 数据统计 |
| 设置 | `Settings`, `Gear` | 设置功能 |
| 搜索 | `Search` | 搜索功能 |
| 空状态 | `Inbox`, `FileQuestion` | 空状态提示 |
| 操作 | `Plus`, `Trash2`, `Edit`, `Download` | 通用操作 |

### 使用示例

```tsx
// ❌ 错误：使用 emoji
<div>📊 {formatTime(duration)}</div>

// ✅ 正确：使用图标
<div className="flex items-center gap-2">
  <Clock className="w-4 h-4" style={{ color: 'rgba(212, 197, 185, 0.6)' }} />
  <span>{formatTime(duration)}</span>
</div>

// ❌ 错误：使用 emoji
<button>💭 添加笔记</button>

// ✅ 正确：使用图标
<button className="flex items-center gap-2">
  <PenTool className="w-4 h-4" />
  <span>添加笔记</span>
</button>
```

## 图片资源使用规范

### 需要用户提供资源的情况

如果需要以下类型的视觉元素，请告知用户：

1. **图标**：功能图标、品牌图标
2. **插图**：空状态插图、功能说明插图
3. **背景图**：装饰性背景
4. **示例图**：功能演示图片

### 图片规范

- **格式**：SVG（优先）、PNG、JPG
- **尺寸**：根据实际需求，提供 @2x、@3x 高清版本
- **颜色**：提供单色版本和彩色版本
- **样式**：符合极简白风格设计

## 代码审查检查清单

在提交代码前，确保：

- [ ] 代码中不包含任何 emoji
- [ ] 所有图标使用 lucide-react 或自定义 SVG
- [ ] 如需图片/视频资源，已向用户确认
- [ ] 设计符合"极简白"风格
- [ ] 颜色使用设计系统中的规范颜色

## 违反规范的后果

如果发现代码中使用 emoji：

1. **立即停止**当前开发
2. **报告问题**：告知用户具体位置
3. **等待指示**：用户会提供替代方案
4. **修改代码**：按照指示替换 emoji

## 版本历史

- **2025-01-29**: 创建设计规范，定义禁用 emoji 原则
- 待更新：替换所有现有 emoji
