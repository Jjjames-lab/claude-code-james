# 小宇宙深度学习助手 - 项目完整指南

> **最后更新**: 2026-01-28
> **项目状态**: 开发中
> **当前版本**: v2.0

---

## 📋 项目概况

### 产品定位
对标 Scripod 的**小宇宙播客深度学习工具**，专注于提供：
- ✅ 精准的语音转录（ASR）
- ✅ 智能章节划分
- ✅ 句子级跳转播放
- ✅ AI 逐字稿优化
- ✅ 完整节目单呈现

### 核心功能
1. **链接解析** - 输入小宇宙链接，自动解析节目信息
2. **音频转录** - 豆包 ASR 引擎，支持词级时间戳
3. **智能优化** - LLM 自动添加标点、合并段落
4. **章节生成** - AI 自动生成章节结构
5. **多模态展示** - 概览、章节、逐字稿、节目单

### 技术栈
- **前端**: React 19 + TypeScript + Vite
- **样式**: Tailwind CSS + 自定义设计系统
- **状态**: Zustand
- **图标**: Lucide React
- **后端 API**: Express（独立后端项目）

---

## 🎯 产品设计

### 设计系统：深邃有机 (Deep Organic)

**设计理念**：
- 拒绝紫色渐变陈词滥调
- 深邃背景 + 有机渐变
- 玻璃态卡片 + 噪点纹理
- 微动效 + 细腻交互

**关键文件**：
- `src/styles/design-system-v2.css` - 设计系统定义
- `src/components/ui/GlassCard.tsx` - 可复用玻璃态卡片

**色彩系统**：
```css
--bg-deep: #0a0a0f;           /* 深邃背景 */
--primary: #a78bfa;           /* 紫罗兰主色 */
--primary-glow: rgba(167, 139, 250, 0.4);
--glass-bg: rgba(255, 255, 255, 0.03);
--glass-border: rgba(255, 255, 255, 0.08);
```

**布局结构**：
```
┌─────────────────────────────────────────┐
│  顶部导航（未来预留）                     │
├─────────────────────────────────────────┤
│  主内容区                                │
│  ┌────────┐  ┌──────────────────────┐  │
│  │ 左侧   │  │  右侧内容区           │  │
│  │ Tab栏  │  │  (概览/章节/逐字稿)   │  │
│  │ 224px  │  │  自适应宽度            │  │
│  └────────┘  └──────────────────────┘  │
├─────────────────────────────────────────┤
│  底部音频播放器（固定）                   │
└─────────────────────────────────────────┘
```

---

## 📂 项目结构详解

```
src/
├── pages/
│   └── HomePage.tsx                 # 主页面，状态管理核心
│
├── components/
│   ├── audio/
│   │   ├── AudioPlayer.tsx          # 基础播放器（已弃用）
│   │   └── AudioPlayerEnhanced.tsx  # 增强播放器（当前使用）
│   │
│   ├── transcript/
│   │   └── TranscriptViewer.tsx     # 逐字稿查看器
│   │
│   ├── chapters/
│   │   ├── ChaptersSection.tsx      # 基础章节（已弃用）
│   │   └── ChaptersSectionEnhanced.tsx # 增强章节（当前使用）
│   │
│   ├── overview/
│   │   └── OverviewSection.tsx      # 概览页面（对标 Scripod）
│   │
│   ├── shownote/
│   │   └── ShownoteRenderer.tsx     # 节目单渲染器
│   │
│   ├── url/
│   │   ├── UrlInput.tsx             # 基础输入（已弃用）
│   │   └── UrlInputEnhanced.tsx     # 增强输入（当前使用）
│   │
│   ├── loading/
│   │   ├── PodcastSkeleton.tsx      # 基础骨架屏（已弃用）
│   │   └── PodcastSkeletonEnhanced.tsx # 增强骨架屏（当前使用）
│   │
│   ├── podcast/
│   │   └── PodcastCard.tsx          # 节目卡片（转录进度显示）
│   │
│   ├── ui/
│   │   └── GlassCard.tsx            # 玻璃态卡片组件
│   │
│   └── tabs/
│       ├── TabInterface.tsx         # Tab 组件（已弃用，改用内联）
│       └── TabPanel.tsx
│
├── stores/
│   └── playerStore.ts               # 播放器状态管理（Zustand）
│
├── services/
│   └── api.ts                       # API 调用封装
│
├── types/
│   └── index.ts                     # TypeScript 类型定义
│
├── utils/
│   ├── index.ts                     # 工具函数
│   └── mockData.ts                  # Mock 数据（已弃用）
│
└── styles/
    ├── design-system-v2.css         # 新设计系统（当前使用）
    ├── globals-clean.css            # 清理后的全局样式
    ├── globals.css                  # 旧全局样式（已弃用）
    └── design-system.css            # 旧设计系统（已弃用）
```

---

## 🚀 功能实现进度

### ✅ 已完成

#### 1. 核心流程
- [x] URL 输入与解析
- [x] 节目信息展示（PodcastCard）
- [x] ASR 转录集成
- [x] 转录进度实时显示
- [x] 音频播放器
- [x] 逐字稿查看

#### 2. 设计系统
- [x] 深邃有机设计系统
- [x] 玻璃态卡片组件
- [x] 响应式布局
- [x] 动效系统

#### 3. 用户体验
- [x] 左侧 Tab 导航
- [x] 句子级跳转
- [x] 当前播放高亮
- [x] 节目单格式保留

#### 4. AI 功能
- [x] LLM 逐字稿优化
- [x] 原始/优化模式切换
- [x] 章节自动生成

### 🚧 进行中

#### 1. 概览页面优化
- [ ] 对标 Scripod 的 Overview 布局
- [ ] 优化封面图和信息展示
- [ ] 添加播放按钮

#### 2. 性能优化
- [ ] LLM 并发处理（减少 80% 等待时间）
- [ ] 流式响应
- [ ] 虚拟滚动（长逐字稿）

### 📋 待规划

#### 1. 高级功能
- [ ] 书签/笔记系统
- [ ] Highlights 提取
- [ ] 全文搜索
- [ ] 导出功能

#### 2. 体验优化
- [ ] 键盘快捷键
- [ ] 离线缓存
- [ ] 移动端适配

---

## 🐛 历史问题与解决方案

### 问题 1: 章节数据丢失
**现象**: 切换 Tab 后章节数据消失
**原因**: 组件重新渲染时状态未保留
**解决**:
- 在 `ChaptersSectionEnhanced` 中添加本地状态管理
- 从 `transcript` 计算当前激活章节

**代码位置**: `src/components/chapters/ChaptersSectionEnhanced.tsx:35-50`

### 问题 2: 设计系统未生效
**现象**: 新设计未显示，仍看到旧紫色渐变
**原因**: `globals.css` 中的旧样式覆盖了新设计
**解决**:
- 创建 `globals-clean.css` 只保留必要样式
- 调整 `index.css` 导入顺序

**相关文件**:
- `src/styles/globals-clean.css`
- `src/index.css`

### 问题 3: 节目单格式丢失
**现象**: Shownote 的加粗、分行等格式消失
**原因**: Tailwind prose 类覆盖了原始 HTML 样式
**解决**:
- 移除 prose 类
- 在 `design-system-v2.css` 中自定义 `.shownote-content` 样式

**代码位置**: `src/styles/design-system-v2.css:164-304`

### 问题 4: 转录按钮被推离屏幕
**现象**: 展开节目详情后，转录按钮看不见了
**原因**: 按钮在卡片底部，展开后被推到视口外
**解决**:
- 将转录按钮移到卡片顶部
- 添加最大高度和滚动到节目详情区域

**代码位置**: `src/components/podcast/PodcastCard.tsx:94-167`

### 问题 5: LLM 优化后仍无标点
**现象**: LLM 优化后逐字稿仍然缺少标点符号
**原因**: Prompt 不够明确
**解决**:
- 优化 Prompt，明确要求添加标点
- 添加验证逻辑检查结果

**状态**: 待进一步测试

### 问题 6: 假设性错误（AI 编程陷阱）
**现象**: 多次出现"想当然"的假设，未实际验证
**表现**:
- 未读取文件就声称"代码中..."
- 未分析截图就描述布局
- 未运行代码就说"应该可以"

**规避方案**:
1. **Read First**: 先用 Read 工具读取文件
2. **Verify Before Claim**: 声称前先验证
3. **Test After Code**: 写代码后一定要测试
4. **Show Evidence**: 展示证据（代码行号、文件路径）

**规则**:
- ❌ 不要说"代码中应该有..." → ✅ 用 Read 查看后说"代码中第X行是..."
- ❌ 不要说"布局看起来是..." → ✅ 分析截图后说"我在图中看到..."

---

### 问题 7: 重复造轮子（2026-01-29）
**现象**: 在已有完整组件的情况下，提出要重新创建相同功能
**表现**:
- 提出要创建 TranscriptViewer 组件（已存在）
- 认为需要实现 LLM Polish 添加标点（ASR 已返回带标点的 utterances）
- 提出要创建章节组件（ChaptersSectionEnhanced 已完整实现）

**根本原因**:
1. 没有在开发前检查已有组件
2. 没有阅读技术现状文档
3. 对后端 API 返回数据结构理解错误

**解决方案**:
1. ✅ **创建技术现状文档**: `docs/development/TECHNICAL_STATUS.md`
   - 完整的组件清单（含 Props 和功能说明）
   - 完整的 API 清单（含请求/响应格式）
   - 已完成功能列表
   - 常见问题解决方案

2. ✅ **强制检查流程**:
   ```bash
   # 开发前必做
   Glob pattern="**/components/**/*.tsx"  # 检查组件
   Grep pattern="关键词" output_mode="files_with_matches"  # 搜索功能
   ```

3. ✅ **后端数据理解**:
   - ASR 返回的 `utterances` **已包含标点符号**
   - 不需要额外调用 `polishTranscript` 添加标点
   - `generateChapters` 需要封装到 `api.ts`（参考 ChaptersSectionEnhanced 第 70 行）

**实际待办事项**（正确版本）:
1. 在 `EpisodeTabPage.tsx` 集成转录功能
   - 调用已有的 `startTranscription()` API
   - 调用 `generateChapters()` API（需封装到 api.ts）
   - 保存到 LocalStorage（已有 `saveEpisodeData()`）

2. Tab 内容区域使用已有组件
   - Overview: `OverviewSection`
   - Transcript: `TranscriptViewer`
   - Chapters: `ChaptersSectionEnhanced`
   - Notes: `NoteList`

3. 补充 `generateChapters` 到 `api.ts`
   - 参考 `ChaptersSectionEnhanced.tsx` 第 70-81 行的实现

**教训**:
- 📖 **先读文档，再写代码**
- 🔍 **先搜代码，再建组件**
- ✅ **先测功能，再确需求**

**相关文件**:
- `docs/development/TECHNICAL_STATUS.md` - 技术现状文档（新增）
- `src/components/transcript/TranscriptViewer.tsx` - 已存在
- `src/components/chapters/ChaptersSectionEnhanced.tsx` - 已存在
- `src/components/overview/OverviewSection.tsx` - 已存在
- `src/services/api.ts` - 已有 `startTranscription()`, `polishTranscript()`

---

### 问题 8：界面布局设计决策（2026-01-29）
**背景**: 用户参考 Z.ai 的界面设计，提出了双栏布局需求

**用户需求**:
1. 左侧播放器区域（60%）：播放器窗口 + 章节导航
2. 右侧文字稿区域（40%）：功能栏 + 文字稿内容区
3. 选中文字交互：二选一（笔记 or 解释）
4. 移除 SHOWNOTES Tab

**设计决策**:
- ✅ 左侧：播放器窗口（老式收音机风格）+ 章节导航（竖向列表）
- ✅ 右侧：功能栏（翻译 | Chat | 笔记 | 自动 | 导出）+ 文字稿内容区
- ✅ 选中文字 → 弹出二选一（笔记 or 解释）
- ✅ 笔记功能：自动保存，点击功能栏查看和编辑
- ✅ Chat 功能：基于上下文与 AI 对话讨论

**技术实现**:
- 使用 Flexbox 实现左右分栏（60% + 40%）
- 各区域独立滚动
- 播放进度触发章节高亮和文字稿同步滚动
- 功能栏状态显示：笔记(3)、Chat(2)（仅数字，不提醒）

**相关文档**:
- `docs/development/TECHNICAL_STATUS.md` - 新增"界面布局设计 v2.0"章节

---

## 🔧 开发指南

### 启动项目
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问
http://localhost:5173
```

### 调试技巧
1. **查看状态**:
   ```tsx
   console.log('当前状态:', { appState, activeTab, transcript });
   ```

2. **查看播放器状态**:
   ```tsx
   const playerState = usePlayerStore();
   console.log('播放器:', playerState);
   ```

3. **网络请求调试**:
   - 打开浏览器 DevTools → Network
   - 查看 `/api/v1/...` 请求

### 常用命令
```bash
# 构建
npm run build

# 预览构建
npm run preview

# 类型检查
npx tsc --noEmit

# 代码检查
npm run lint
```

---

## 📝 关键代码说明

### 1. 状态管理 (playerStore.ts)
```typescript
interface PlayerStore {
  // 播放状态
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  // 播客数据
  currentPodcast: Podcast | null;

  // 操作方法
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setCurrentPodcast: (podcast: Podcast) => void;
}
```

**使用**:
```tsx
const { isPlaying, currentTime, seek } = usePlayerStore();
```

### 2. 转录模式切换
```tsx
const [transcriptMode, setTranscriptMode] = useState<'original' | 'optimized'>('original');
const [originalTranscript, setOriginalTranscript] = useState<TranscriptSegment[]>([]);
const [optimizedTranscript, setOptimizedTranscript] = useState<TranscriptSegment[]>([]);

// 切换模式
const handleTranscriptModeChange = (mode: 'original' | 'optimized') => {
  if (mode === 'optimized' && optimizedTranscript.length > 0) {
    setTranscript(optimizedTranscript);
    setTranscriptMode('optimized');
  } else {
    setTranscript(originalTranscript);
    setTranscriptMode('original');
  }
};
```

### 3. 章节高亮同步
```tsx
const activeChapterIndex = useMemo(() => {
  if (!transcript || transcript.length === 0) return -1;

  const currentSegmentIndex = transcript.findIndex(
    (seg) => currentTime >= seg.startTime && (!seg.endTime || currentTime <= seg.endTime)
  );

  if (currentSegmentIndex === -1) return -1;

  // 找到对应章节
  const currentSegment = transcript[currentSegmentIndex];
  return chapters?.chapters?.findIndex(
    (ch: any) => currentTime >= ch.start && (!ch.end || currentTime <= ch.end)
  ) ?? -1;
}, [chapters, transcript, currentTime]);
```

---

## 🎨 设计文件说明

### 设计系统文件

#### `design-system-v2.css` (当前使用)
- ✅ 深邃有机设计
- ✅ 玻璃态效果
- ✅ 有机渐变背景
- ✅ Shownote 样式

#### `design-system.css` (已弃用)
- ❌ 旧紫色渐变设计
- ❌ 可删除

#### `globals.css` (已弃用)
- ❌ 包含旧视觉样式
- ❌ 可删除

#### `globals-clean.css` (当前使用)
- ✅ 只保留必要基础样式
- ✅ 不包含视觉样式

### 组件命名规范

**Enhanced 组件** (当前使用):
- `UrlInputEnhanced.tsx`
- `AudioPlayerEnhanced.tsx`
- `ChaptersSectionEnhanced.tsx`
- `PodcastSkeletonEnhanced.tsx`

**基础组件** (已弃用，可删除):
- `UrlInput.tsx`
- `AudioPlayer.tsx`
- `ChaptersSection.tsx`
- `PodcastSkeleton.tsx`

---

## 🗑️ 可删除文件清单

### 可以安全删除的文件
```bash
# 旧组件
src/components/url/UrlInput.tsx
src/components/audio/AudioPlayer.tsx
src/components/chapters/ChaptersSection.tsx
src/components/loading/PodcastSkeleton.tsx
src/components/tabs/TabInterface.tsx
src/components/tabs/TabPanel.tsx

# 旧样式
src/styles/design-system.css
src/styles/globals.css

# 旧文档
README.md (Vite 默认模板)
PROJECT_README.md (早期文档，内容过时)

# Mock 数据
src/utils/mockData.ts
```

### 需要保留的文件
```bash
# 核心页面
src/pages/HomePage.tsx

# 当前使用的组件
src/components/url/UrlInputEnhanced.tsx
src/components/audio/AudioPlayerEnhanced.tsx
src/components/chapters/ChaptersSectionEnhanced.tsx
src/components/loading/PodcastSkeletonEnhanced.tsx
src/components/transcript/TranscriptViewer.tsx
src/components/overview/OverviewSection.tsx
src/components/shownote/ShownoteRenderer.tsx
src/components/podcast/PodcastCard.tsx
src/components/ui/GlassCard.tsx

# 样式系统
src/styles/design-system-v2.css
src/styles/globals-clean.css

# 状态和工具
src/stores/playerStore.ts
src/services/api.ts
src/utils/index.ts
src/types/index.ts
```

---

## 📊 性能优化建议

### 1. LLM 处理优化
**问题**: 当前串行处理 10000 字符需 80 秒

**解决方案**:
```python
# 并发处理（GLM-4-Flash 支持 5 个并发）
class AdaptiveConcurrencyProcessor:
    def __init__(self, max_concurrent=5):
        self.max_concurrent = max_concurrent

    async def process_chunks(self, chunks):
        # 5 个一批并发处理
        for i in range(0, len(chunks), 5):
            batch = chunks[i:i+5]
            await asyncio.gather(*[process_chunk(c) for c in batch])
```

**效果**: 80 秒 → 16 秒（减少 80%）

### 2. 虚拟滚动
**问题**: 长逐字稿（10000+ 段）渲染卡顿

**解决方案**:
```tsx
import { VirtualList } from 'react-virtual';

<VirtualList
  items={transcript}
  renderItem={(segment) => <TranscriptSegment data={segment} />}
/>
```

### 3. 懒加载
**问题**: 首屏加载慢

**解决方案**:
```tsx
import { lazy, Suspense } from 'react';

const OverviewSection = lazy(() => import('./components/overview/OverviewSection'));

<Suspense fallback={<Skeleton />}>
  <OverviewSection />
</Suspense>
```

---

## 🔍 测试指南

### 端到端测试流程

#### 1. 测试 URL 解析
```
1. 打开 http://localhost:5173
2. 输入小宇宙链接
3. 验证：节目信息正确显示
4. 验证：封面图、标题、时长
```

#### 2. 测试转录流程
```
1. 点击"开始转录"
2. 观察进度显示：
   - 下载音频 (10-30%)
   - 语音识别 (30-90%)
   - 处理结果 (90-100%)
3. 验证：完成后显示逐字稿
4. 验证：播放器可播放
```

#### 3. 测试 Tab 切换
```
1. 切换到"章节" Tab
2. 点击章节标题
3. 验证：音频跳转到对应时间
4. 切换回"概览"
5. 验证：章节数据未消失
```

#### 4. 测试 AI 优化
```
1. 点击"AI 优化"按钮
2. 等待 LLM 处理完成
3. 切换"原始"/"优化"模式
4. 验证：优化后文本有标点
5. 验证：时间戳映射正确
```

---

## 🚨 常见错误排查

### 错误 1: API 500 错误
```
检查项：
- 后端服务是否启动
- API 地址是否正确 (src/services/api.ts)
- 音频 URL 是否有效
```

### 错误 2: 转录结果为空
```
检查项：
- ASR 服务是否正常
- episode_id 是否正确
- 查看后端日志
```

### 错误 3: 样式未生效
```
检查项：
- index.css 导入顺序
- 浏览器缓存（清除后重试）
- Tailwind 配置
```

### 错误 4: 播放器无声音
```
检查项：
- 音频 URL 是否可访问
- 浏览器自动播放策略
- 音量是否为 0
```

---

## 📈 未来规划

### Phase 1: 核心完善 (当前)
- [ ] 完善 Overview 页面
- [ ] 优化 LLM 处理性能
- [ ] 修复已知 Bug

### Phase 2: 高级功能
- [ ] Highlights 自动提取
- [ ] 书签/笔记系统
- [ ] 全文搜索
- [ ] 导出（PDF/Markdown）

### Phase 3: 体验优化
- [ ] 键盘快捷键
- [ ] 离线 PWA
- [ ] 移动端适配
- [ ] 主题切换

---

## 🤝 贡献指南

### 代码规范
1. 使用 TypeScript 类型注解
2. 组件使用函数式 + Hooks
3. 样式优先使用 Tailwind
4. 复杂逻辑添加注释

### Git 提交规范
```bash
# 功能
git commit -m "feat: 添加章节自动生成功能"

# 修复
git commit -m "fix: 修复 Tab 切换数据丢失问题"

# 样式
git commit -m "style: 优化玻璃态卡片效果"

# 重构
git commit -m "refactor: 重构 API 调用逻辑"
```

---

## 📞 联系与支持

**项目维护者**: James (产品经理)
**开发日期**: 2026-01-20 ~ 2026-01-28
**技术支持**: Claude Code

---

**祝开发顺利！** 🚀
