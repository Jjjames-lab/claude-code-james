# Bookshelf Sounds 技术现状文档

**版本**: v1.0
**最后更新**: 2026-01-29
**目的**: 为未来的 Claude Code 会话提供完整的技术现状参考，避免重复造轮子

---

## 📋 目录

1. [项目结构](#项目结构)
2. [前端已有组件清单](#前端已有组件清单)
3. [前端 API 服务](#前端-api-服务)
4. [后端 API 清单](#后端-api-清单)
5. [数据存储结构](#数据存储结构)
6. [已完成功能](#已完成功能)
7. [当前待办事项](#当前待办事项)
8. [常见问题与解决方案](#常见问题与解决方案)

---

## 项目结构

```
Bookshelf Sounds/
├── frontend/pod-studio/          # React 前端
│   ├── src/
│   │   ├── components/           # 组件目录
│   │   │   ├── audio/           # 音频播放器
│   │   │   ├── chapters/        # 章节组件
│   │   │   ├── transcript/      # 逐字稿组件
│   │   │   ├── overview/        # 概览组件
│   │   │   ├── note/            # 笔记组件
│   │   │   ├── podcast/         # 播客卡片
│   │   │   └── ...
│   │   ├── pages/               # 页面组件
│   │   ├── services/            # API 服务
│   │   ├── stores/              # Zustand 状态管理
│   │   └── utils/               # 工具函数
│   └── package.json
│
└── backend/backend/              # FastAPI 后端
    ├── backend/app/
    │   ├── api/routes/          # API 路由
    │   │   ├── asr.py           # ASR 转录
    │   │   ├── llm.py           # LLM 处理
    │   │   └── crawler.py       # 爬虫
    │   └── services/            # 业务逻辑
    └── requirements.txt
```

---

## 前端已有组件清单

### 🎵 音频相关

#### `AudioPlayerEnhanced.tsx`
**路径**: `src/components/audio/AudioPlayerEnhanced.tsx`

**功能**: 增强型音频播放器

**主要功能**:
- 播放/暂停
- 进度条拖拽
- 时间显示
- 播放速度控制
- 音量控制
- 键盘快捷键支持

**状态管理**: 使用 `usePlayerStore`

---

### 📝 逐字稿相关

#### `TranscriptViewer.tsx`
**路径**: `src/components/transcript/TranscriptViewer.tsx`

**功能**: 逐字稿展示组件

**Props**:
```typescript
interface TranscriptViewerProps {
  segments: TranscriptSegment[];      // 转录段落
  highlightedSegmentId?: string;      // 高亮的段落ID
  podcastId?: string;                 // 播客ID（用于关联笔记）
}
```

**主要功能**:
- ✅ 逐字稿展示（支持句子级别和词级别）
- ✅ 当前播放位置高亮
- ✅ 点击跳转到指定时间
- ✅ 自动滚动跟随播放
- ✅ 文字选中支持
- ✅ 笔记标记显示
- ✅ 响应式设计

**TranscriptSegment 类型**:
```typescript
interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
  words?: any[];
}
```

#### `VirtualTranscriptViewer.tsx`
**路径**: `src/components/transcript/VirtualTranscriptViewer.tsx`

**功能**: 虚拟化逐字稿查看器（适用于超长文本）

---

### 📖 章节相关

#### `ChaptersSectionEnhanced.tsx`
**路径**: `src/components/chapters/ChaptersSectionEnhanced.tsx`

**功能**: 章节展示和生成组件

**Props**:
```typescript
interface ChaptersSectionEnhancedProps {
  transcript: Array<{
    startTime: number;
    endTime?: number;
    text?: string;
  }>;
  chapters: ChapterData | null;
  setChapters: (chapters: ChapterData | null) => void;
  onChapterClick?: (time: number) => void;
}
```

**主要功能**:
- ✅ 自动生成章节（调用 LLM API）
- ✅ 章节列表展示
- ✅ 点击章节跳转到对应时间
- ✅ 当前章节高亮
- ✅ 加载状态显示
- ✅ 错误处理和重试

**ChapterData 类型**:
```typescript
interface ChapterData {
  chapters: Array<{
    title: string;
    points: string[];
    segment_index: number;
  }>;
}
```

**内部 API 调用**:
```typescript
fetch('http://localhost:8001/api/v1/llm/generate-chapters', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ transcript: transcriptText }),
});
```

---

### 📊 概览相关

#### `OverviewSection.tsx`
**路径**: `src/components/overview/OverviewSection.tsx`

**功能**: 播客概览展示

**Props**:
```typescript
interface OverviewSectionProps {
  data: OverviewData;
}

interface OverviewData {
  podcastName: string;
  episodeTitle: string;
  episodeDescription: string;
  coverImage: string;
  duration: number;
  publishDate: string;
  hostName?: string;
  tags?: string[];
}
```

**主要功能**:
- ✅ 封面图展示
- ✅ 播客信息展示
- ✅ 节目描述（Shownote）渲染
- ✅ 元信息显示（时长、日期）
- ✅ 播放按钮

---

### 📒 笔记相关

#### `NoteList.tsx`
**路径**: `src/components/note/NoteList.tsx`

**功能**: 笔记列表展示

#### `NoteInputModal.tsx`
**路径**: `src/components/note/NoteInputModal.tsx`

**功能**: 笔记输入弹窗

**状态管理**: 使用 `useNoteStore`

---

### 🎨 布局相关

#### `PodcastContentView.tsx`
**路径**: `src/components/layout/PodcastContentView.tsx`

**功能**: 播客内容主布局

**Props**:
```typescript
interface PodcastContentViewProps {
  transcript: TranscriptSegment[];
  chapters: any;
  setChapters: (chapters: any) => void;
  onChapterClick?: (time: number) => void;
  highlightedSegmentId?: string | null;
  children?: React.ReactNode;  // 用于概览区域
}
```

**布局结构**:
```
┌─────────────────────────────────────┐
│  概览区域（可折叠）                   │
├──────────────┬──────────────────────┤
│  章节导航      │  逐字稿内容           │
│  (左侧固定)    │  (独立滚动)          │
└──────────────┴──────────────────────┘
```

---

### 🃏 播客卡片

#### `PodcastCard.tsx`
**路径**: `src/components/podcast/PodcastCard.tsx`

**功能**: 播客/单集卡片组件

**Props**:
```typescript
interface PodcastCardProps {
  mode: 'simple' | 'full';
  // ... 其他 props
}
```

**模式**:
- `simple`: 简洁模式（仅封面 + 名称）
- `full`: 完整模式（封面 + 标题 + 描述 + 时长 + 播放按钮）

#### `EpisodeListItem.tsx`
**路径**: `src/components/podcast/EpisodeListItem.tsx`

**功能**: 单集列表项组件

**Props**:
```typescript
interface EpisodeListItemProps {
  episodeId: string;
  episodeTitle: string;
  coverImage: string;
  duration: number;
  createdAt: string;
  podcastName: string;
  processed: boolean;
  variant: 'card' | 'list';
  onClick?: () => void;
}
```

---

### 🔍 其他组件

#### `UrlInputEnhanced.tsx`
**路径**: `src/components/url/UrlInputEnhanced.tsx`

**功能**: URL 输入框组件

**回调**:
```typescript
onEpisodeParsed: (data: EpisodeParseResponse) => void;
onPodcastParsed: (data: PodcastParseResponse) => void;
```

---

## 前端 API 服务

**路径**: `src/services/api.ts`

### 已实现的 API 函数

#### 1. `parseEpisode(url)`
**功能**: 解析小宇宙单集链接

**返回**:
```typescript
interface EpisodeParseResponse {
  episode_id: string;
  podcast_id: string;
  audio_url: string;
  duration: number;
  cover_image: string;
  show_notes: string;
  episode_title: string;
  podcast_name: string;
}
```

---

#### 2. `parsePodcast(url, limit, offset)`
**功能**: 解析小宇宙播客主页链接

**返回**:
```typescript
interface PodcastParseResponse {
  podcast_id: string;
  podcast_name: string;
  host_name: string;
  description: string;
  logo: string;
  episodes: EpisodeInfo[];
  total_episodes: number;
}
```

---

#### 3. `startTranscription(audioUrl, episodeId, engine, useStandard, timeout)`
**功能**: 启动 ASR 转录任务

**参数**:
- `audioUrl`: 音频文件地址
- `episodeId`: 节目 ID（保留参数，未使用）
- `engine`: ASR 引擎（可选）
- `useStandard`: 是否使用豆包标准版（默认 false）
- `timeout`: 超时时间（默认 300000ms）

**返回**:
```typescript
interface TranscriptResult {
  words: TranscriptWord[];
  utterances: Utterance[];      // ⚠️ 重要：已包含句子级分段
  total_duration: number;
  asr_engine: string;
  word_count: number;
}

interface Utterance {
  text: string;
  start: number;
  end: number;
  words: TranscriptWord[];
  speaker: string;
}
```

**⚠️ 重要**: ASR 返回的 `utterances` 已经包含标点符号和分段，不需要额外调用 `polishTranscript`

---

#### 4. `polishTranscript(rawText, topic, keywords)`
**功能**: LLM 逐字稿处理

**⚠️ 注意**: 当前版本 ASR 已返回标点符号，此函数可能不需要使用

**返回**:
```typescript
{
  polished_text: string;
  model: string;
}
```

---

#### 5. `getTranscriptionStatus(taskId)`
**功能**: 查询转录任务状态

**返回**:
```typescript
interface TranscriptTaskResponse {
  task_id: string;
  status: 'processing' | 'completed' | 'failed';
  estimated_time?: number;
  engine?: string;
  progress?: number;
  current_engine?: string;
  result?: TranscriptResult;
}
```

---

#### 6. `correctText(textSegment, contextBefore, contextAfter)`
**功能**: AI 纠偏

---

#### 7. `healthCheck()`
**功能**: 健康检查

---

### ⚠️ 需要补充的 API 函数

#### `generateChapters(transcript, topic, keywords)`
**状态**: ❌ 未在 `api.ts` 中封装

**临时方案**: `ChaptersSectionEnhanced` 组件内部直接调用

**端点**: `POST /api/v1/llm/generate-chapters`

**需要封装**:
```typescript
export async function generateChapters(
  transcript: string,
  topic?: string,
  keywords?: string[]
): Promise<ChapterData> {
  const response = await fetch(`${PYTHON_API_BASE_URL}/llm/generate-chapters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, topic, keywords }),
  });

  const result = await response.json();
  return result.data;
}
```

---

## 后端 API 清单

### ASR 转录 (`/api/v1/asr/)

**路径**: `backend/backend/app/api/routes/asr.py`

#### `POST /api/v1/asr/transcribe`
**功能**: 转录上传的音频文件

**请求**:
```
file: UploadFile
strategy: "fallback" | "race" | "mixed"
```

**返回**:
```json
{
  "success": true,
  "data": {
    "text": "转录文本",
    "duration": 12345,
    "engine": "doubao",
    "words": [...],
    "utterances": [...],  // ⚠️ 已包含句子级分段
    "word_count": 123
  }
}
```

---

#### `POST /api/v1/asr/transcribe-url`
**功能**: 从 URL 转录音频

**请求**:
```
url: string
strategy: "fallback" | "race" | "mixed"
use_standard: boolean
```

**返回**: 同上

---

#### `GET /api/v1/asr/engines`
**功能**: 获取可用的 ASR 引擎列表

---

#### `GET /api/v1/asr/health`
**功能**: ASR 服务健康检查

---

### LLM 处理 (`/api/v1/llm/)

**路径**: `backend/backend/app/api/routes/llm.py`

#### `POST /api/v1/llm/polish`
**功能**: 处理逐字稿（添加标点、分段、纠正错误）

**请求**:
```json
{
  "raw_text": "string",
  "topic": "string (optional)",
  "keywords": ["string"] (optional)
}
```

**返回**:
```json
{
  "polished_text": "string",
  "model": "string",
  "provider": "string"
}
```

---

#### `POST /api/v1/llm/generate-chapters`
**功能**: 生成播客章节

**请求**:
```json
{
  "transcript": "string",
  "topic": "string (optional)",
  "keywords": ["string"] (optional)
}
```

**返回**:
```json
{
  "success": true,
  "data": {
    "chapters": [
      {
        "title": "章节标题",
        "points": ["要点1", "要点2"],
        "segment_index": 0
      }
    ],
    "model": "string"
  }
}
```

---

#### `POST /api/v1/llm/generate-highlights`
**功能**: 提取高光片段（金句）

---

#### `GET /api/v1/llm/health`
**功能**: LLM 服务健康检查

---

### 爬虫 (`/api/crawler/)

**路径**: `backend/backend/app/api/routes/crawler.py`

#### `POST /api/crawler/parse-podcast`
**功能**: 解析播客主页

---

## 数据存储结构

### LocalStorage 结构

**路径**: `src/utils/episodeStorage.ts`

#### `EpisodeData` 接口
```typescript
interface EpisodeData {
  // 基本信息
  episodeId: string;
  podcastId: string;
  episodeTitle: string;
  podcastName: string;
  coverImage: string;
  audioUrl: string;
  duration: number;
  showNotes: string;

  // 转录数据
  transcript?: TranscriptWord[];      // 词级数据
  utterances?: Utterance[];          // 句子级数据
  chapters?: any[];                   // 章节数据
  notes?: any[];                      // 笔记数据

  // 元数据
  processedAt: string;
  asrEngine?: string;
  wordCount?: number;
}
```

#### 存储函数
- `saveEpisodeData(data: EpisodeData)`: 保存单集数据
- `loadEpisodeData(episodeId: string)`: 加载单集数据
- `checkProcessedStatus(episodeId: string)`: 检查是否已处理
- `deleteEpisodeData(episodeId: string)`: 删除单集数据

---

## 已完成功能

### ✅ v2.0.0 - 基础转录系统
- [x] ASR 转录（豆包/千问双引擎）
- [x] 词级时间戳
- [x] 句子级分段（utterances）
- [x] LLM 章节生成
- [x] LocalStorage 持久化
- [x] 音频播放器
- [x] 逐字稿查看器
- [x] 章节展示组件
- [x] 概览组件
- [x] 笔记系统（基础版）

### ✅ v2.1.0 - 播客列表功能
- [x] 播客主页解析
- [x] 单集列表展示
- [x] 播客卡片组件
- [x] 单集列表项组件
- [x] LocalStorage 数据管理
- [x] 双模式显示（simple/full）
- [x] 处理状态标记

---

## 当前待办事项

### 🚀 v2.1.0 - 待完成

#### 1. EpisodeTabPage 转录功能集成
**文件**: `src/pages/EpisodeTabPage.tsx`

**当前问题**: `handleStartTranscription()` 只是模拟 loading

**需要修改**:
```typescript
const handleStartTranscription = async () => {
  if (!episodeData) return;

  try {
    setIsTranscribing(true);

    // 1. 调用 ASR API（已存在）
    const transcriptResult = await startTranscription(
      episodeData.audioUrl,
      episodeData.episodeId
    );

    // 2. 生成章节（需要封装 generateChapters API）
    const chaptersResult = await generateChapters(transcriptResult.text);

    // 3. 保存到 LocalStorage（已存在）
    saveEpisodeData({
      ...episodeData,
      transcript: transcriptResult.words,
      utterances: transcriptResult.utterances,
      chapters: chaptersResult.chapters,
      processedAt: new Date().toISOString(),
    });

    setIsProcessed(true);
  } catch (error) {
    // 错误处理
  } finally {
    setIsTranscribing(false);
  }
};
```

---

#### 2. Tab 内容区域实现
**文件**: `src/pages/EpisodeTabPage.tsx`

**当前问题**: Tab 内容区域显示"开发中"

**需要修改**:
```typescript
{activeTab === 'overview' && (
  <OverviewSection
    data={{
      podcastName: episodeData.podcastName,
      episodeTitle: episodeData.episodeTitle,
      episodeDescription: episodeData.showNotes,
      coverImage: episodeData.coverImage,
      duration: episodeData.duration,
      publishDate: '', // 需要补充
    }}
  />
)}

{activeTab === 'transcript' && (
  <TranscriptViewer
    segments={savedData.utterances || []}
    podcastId={episodeData.podcastId}
  />
)}

{activeTab === 'chapters' && (
  <ChaptersSectionEnhanced
    transcript={savedData.utterances || []}
    chapters={savedData.chapters || null}
    setChapters={() => {}}
    onChapterClick={(time) => {
      // 跳转到指定时间
      const { seek } = usePlayerStore.getState();
      seek(time);
    }}
  />
)}

{activeTab === 'notes' && (
  <NoteList podcastId={episodeData.podcastId} />
)}
```

---

#### 3. 补充 `generateChapters` API 函数
**文件**: `src/services/api.ts`

**需要添加**:
```typescript
export async function generateChapters(
  transcript: string,
  topic?: string,
  keywords?: string[]
): Promise<ChapterData> {
  const response = await fetch(`${PYTHON_API_BASE_URL}/llm/generate-chapters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, topic, keywords }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError('LLM_ERROR', error.detail || '生成章节失败', response.status);
  }

  const result = await response.json();
  return result.data;
}

// 导出
const api = {
  // ... 已有导出
  generateChapters,
};

export default api;
```

---

## 常见问题与解决方案

### ❌ 问题1: 重复造轮子
**场景**: 没有充分检查已有组件就开始新建组件

**解决方案**:
1. ✅ **开发前必查**: 使用 `Glob` 和 `Grep` 检查是否已有类似组件
2. ✅ **优先复用**: 已有组件优先复用，不满足需求时再修改
3. ✅ **查阅文档**: 先阅读 `TECHNICAL_STATUS.md`

**检查清单**:
```bash
# 检查组件是否存在
Glob pattern="**/components/**/*.tsx"

# 搜索相关功能
Grep pattern="关键词" output_mode="files_with_matches"
```

---

### ❌ 问题2: API 调用理解错误
**场景**: 以为 ASR 返回的数据没有标点符号，需要 LLM 处理

**实际情况**: ASR 返回的 `utterances` 已经包含标点符号和分段

**解决方案**:
1. ✅ **查阅后端代码**: 查看实际返回的数据结构
2. ✅ **打印日志**: 在开发时打印实际返回数据
3. ✅ **阅读接口文档**: 查阅后端 API 文档或代码注释

---

### ❌ 问题3: 不了解已有功能
**场景**: 提出要实现已经存在的功能

**解决方案**:
1. ✅ **阅读本文档**: 每次会话开始时阅读 `TECHNICAL_STATUS.md`
2. ✅ **检查组件清单**: 查看"前端已有组件清单"部分
3. ✅ **查看已完成功能**: 确认功能是否已在其他版本实现

---

### ❌ 问题4: 文档滞后
**场景**: 代码已经更新，文档没有同步

**解决方案**:
1. ✅ **及时更新**: 修改代码后立即更新文档
2. ✅ **版本标记**: 在文档中标注最后更新时间和版本
3. ✅ **变更日志**: 记录重要的变更

---

## 快速参考

### 常用文件路径

```
前端:
  组件:      frontend/pod-studio/src/components/
  页面:      frontend/pod-studio/src/pages/
  API:       frontend/pod-studio/src/services/api.ts
  存储:      frontend/pod-studio/src/utils/episodeStorage.ts
  状态:      frontend/pod-studio/src/stores/

后端:
  ASR:       backend/backend/app/api/routes/asr.py
  LLM:       backend/backend/app/api/routes/llm.py
  爬虫:      backend/backend/app/api/routes/crawler.py

文档:
  技术现状:  docs/development/TECHNICAL_STATUS.md
  产品需求:  docs/product/产品需求文档_总览.md
  更新日志:  docs/product/CHANGELOG.md
```

---

### 关键技术栈

**前端**:
- React 18
- TypeScript
- Zustand (状态管理)
- React Router v6
- Tailwind CSS

**后端**:
- FastAPI
- Python 3.10+
- Playwright (爬虫)

**ASR 引擎**:
- 豆包 ASR (主引擎)
- 千问 ASR (备用引擎)

**LLM 服务**:
- MiniMax
- GLM

---

## 🎨 界面布局设计 v2.0

### 整体架构：双栏布局

**设计理念**：左右分栏，主次分明，形成"播放+文稿"的核心学习场景

```
┌──────────────────────────────────────────────────┐
├──────────────────────────────┬─────────────────────┤
│       左侧（40%）             │     右侧（60%）       │
│                              │                     │
│  ┌──────────────────────┐   │  ┌─────────────────┐ │
│  │   播放器窗口         │   │  │  功能栏         │ │
│  │   （老式收音机风格）   │   │  │ 翻译 | Chat | 笔记│ │
│  │                     │   │  └─────────────────┘ │
│  │  ┌─────────────┐     │   │                     │
│  │  │  🎵 封面图    │     │   │  ┌─────────────────┐ │
│  │  └─────────────┘     │   │  │  文字稿内容区    │ │
│  │  标题：声动早咖啡     │   │  │  (滚动区域)      │ │
│  │  主播：梦一           │   │  │                 │ │
│  │  📊 15:00            │   │  │  (与播放器同步)   │ │
│  │                     │   │  │                 │ │
│  │  ▬▬●▬▬ 3:45/15:00  │   │  │  (选中文字→弹窗)  │ │
│  │  ⏸  ▶  ⏩ 1.0x      │   │  └─────────────────┘ │
│  │  ⭐️ 收藏             │   │                     │
│  └──────────────────────┘   │                     │
│  ┌──────────────────────┐   │                     │
│  │  章节导航（竖向列表）  │   │                     │
│  │  ───────────────────│   │                     │
│  │  📍 Ch1 开场          │   │                     │
│  │    0:00 - 3:45       │   │                     │
│  │  ───────────────────│   │                     │
│  │  📍 Ch2 上市          │   │                     │
│  │    3:45 - 7:20       │   │                     │
│  │  ───────────────────│   │                     │
│  │  📍 Ch3 比亚迪        │   │                     │
│  │    7:20 - 11:00      │   │                     │
│  │  ───────────────────│   │                     │
│  │  (可滚动)            │   │                     │
│  └──────────────────────┘   │                     │
└──────────────────────────────┴─────────────────────┘
```

---

### 左侧：播放器区域（40%）

#### 1. 上层：播放器窗口
- **老式收音机风格设计**
- **显示内容**：
  - 封面图（圆形或圆角矩形）
  - 节目标题
  - 主播信息
  - 节目时长
  - 播放控制（进度条、播放/暂停、倍速、音量）
  - 收藏按钮

#### 2. 下层：章节导航（竖向列表）
- **垂直滚动列表**
- **每个章节卡片**：
  - 章节序号（Chapter 1, 2, 3...）
  - 章节标题
  - 时间范围（0:00-3:45）
  - 当前章节高亮显示
- **交互**：点击章节 → 播放器跳转 → 右侧文字稿滚动到对应位置

---

### 右侧：文字稿区域（40%）

#### 1. 上层：功能栏
```
┌──────────────────────────────────────────────────────┐
│  翻译  │  Chat  │  笔记  │  自动  │  导出 PRO │
└──────────────────────────────────────────────────────┘
```

**状态显示**：
- 默认状态：普通显示
- 有笔记后：`笔记(3)` - 显示笔记数量
- 有 Chat 后：`Chat(2)` - 显示消息数量（仅数字，不提醒）

#### 2. 下层：文字稿内容区
- **可滚动文本区域**
- **实时同步**：当前播放位置高亮
- **笔记标记**：有笔记的段落显示 🔖 图标
- **选中文字交互**：
  ```
  用户选中文字 → 弹出选项框
  ┌─────────────────────┐
  │  📝 添加到笔记        │
  │  💬 让 AI 解释        │
  └─────────────────────┘
  ```

---

### 交互流程

#### 流程 1：添加笔记
```
1. 用户选中文字："门店数量超过2万家"
2. 选择 "添加到笔记"
3. 自动保存到笔记系统
4. 功能栏 "笔记" 显示：笔记(3)
5. 点击 "笔记" → 打开笔记侧边栏
6. 显示所有笔记，可继续编辑
```

#### 流程 2：AI 解释
```
1. 用户选中文字："门店数量超过2万家"
2. 选择 "让 AI 解释"
3. 自动放入 Chat 功能
4. 功能栏 "Chat" 显示：Chat(1)
5. 点击 "Chat" → 打开 AI 对话侧边栏
6. 显示对话历史，可继续讨论
```

---

### 核心特性

1. **实时同步**：播放进度 → 左侧章节高亮 → 右侧文字稿滚动
2. **快速导航**：点击章节 → 播放器跳转 → 文字稿同步滚动
3. **笔记关联**：选中文字 → 一键添加笔记 → 自动关联时间戳和原文
4. **AI 对话**：选中文字 → 一键放入 Chat → 基于上下文解释讨论

---

### 技术实现要点

1. **双栏布局**：使用 Flexbox 实现左右分栏
2. **固定比例**：左侧 60%，右侧 40%
3. **独立滚动**：各区域可独立滚动，互不影响
4. **实时同步**：播放器进度触发章节高亮和文字稿滚动
5. **状态管理**：使用 Zustand 管理笔记和 Chat 状态

---

## 版本历史

### v1.1 (2026-01-29)
- ✅ 新增：界面布局设计 v2.0（双栏布局）
- ✅ 新增：选中文字交互（笔记 or 解释二选一）
- ✅ 新增：功能栏状态显示（笔记数量、Chat 消息数）
- ✅ 移除：SHOWNOTES Tab

### v1.0 (2026-01-29)
- ✅ 初始版本
- ✅ 完整的组件清单
- ✅ API 服务清单
- ✅ 数据结构说明
- ✅ 已完成功能列表
- ✅ 待办事项清单
- ✅ 常见问题解决方案

---

**⚠️ 重要提示**: 每次修改代码后，请同步更新本文档，确保文档始终反映最新的技术现状。
