# 播客逐字稿产品 PRD
## Product Requirements Document

**版本**: v1.0
**日期**: 2025-01-10
**产品经理**: James
**文档状态**: 最终版

---

## 目录
1. [产品定位与愿景](#1-产品定位与愿景)
2. [用户研究](#2-用户研究)
3. [核心功能设计](#3-核心功能设计)
4. [UI/UX设计规范](#4-uiux设计规范)
5. [技术实现方案](#5-技术实现方案)
6. [产品迭代路线图](#6-产品迭代路线图)
7. [成功指标](#7-成功指标)

---

## 1. 产品定位与愿景

### 1.1 产品名称
**「回声 Echo」** - 播客智能转录与理解平台

> 品牌理念：让每一次聆听都有回声

### 1.2 产品定位

**定位陈述**：
面向深度播客爱好者的智能转录平台，通过AI技术将音频转化为可搜索、可交互、可深度理解的内容资产，重新定义播客的消费方式。

**目标用户画像**：

**主要用户群 (70%)**:
- **年龄**: 25-40岁
- **职业**: 知识工作者、创业者、投资人、研究人员
- **特征**:
  - 每周收听3+小时播客
  - 习惯做笔记和知识管理
  - 愿意为高质量工具付费
  - 对信息获取效率有极高要求
  - 有品味，对审美要求高

**次要用户群 (30%)**:
- 播客创作者（需要转录自己的节目）
- 内容编辑（需要整理播客素材）
- 语言学习者（通过播客学习）

### 1.3 核心价值主张

**我们不只是一个转写工具，我们重新定义播客的消费方式**

| 传统播客消费 | 「回声 Echo」体验 |
|------------|-----------------|
| 线性收听，无法快速定位 | 全文搜索，3秒找到任意内容 |
| 听过就忘，难以回顾 | 永久保存的智能笔记库 |
| 无法引用分享 | 一键导出精美引用卡片 |
| 只能听，不能看 | 音字同步，多模态理解 |
| 孤立的音频 | 与Notion/Obsidian无缝连接 |

---

## 2. 用户研究

### 2.1 深度用户访谈洞察（基于10位重度播客用户）

**核心痛点**：

1. **"我听了100小时播客，但真正记住的不到10%"**
   - 问题：线性音频难以回顾和记忆
   - 机会：AI驱动的智能摘要和重点标记

2. **"记得某个嘉宾说过一句话，但找不到在哪里"**
   - 问题：音频无法全文搜索
   - 机会：实时转录+全文索引

3. **"想分享精彩观点给朋友，但只能转发整个音频"**
   - 问题：难以精准引用
   - 机会：一键生成引用卡片（含时间戳）

4. **"长播客（2小时+）太难坚持听完"**
   - 问题：注意力疲劳
   - 机会：AI智能章节划分+高光时刻

5. **"播客内容无法融入我的知识库"**
   - 问题：数据孤岛
   - 机会：与Notion/Obsidian等知识库工具集成

### 2.2 用户旅程地图

```
发现播客 → 快速预览（AI摘要）→ 决定是否收听 →
智能收听（实时字幕）→ 重点标记 → 智能回顾（ spaced repetition）→
知识沉淀（导出到知识库）→ 分享传播
```

### 2.3 竞品分析

| 竞品 | 优点 | 缺点 | 我们的差异化 |
|-----|------|------|------------|
| 飞书妙记 | 识别准确、企业级 | 无播客特性、UI臃肿 | 播客垂直场景、极简美学 |
| 通义听悟 | AI能力强 | 阿里生态绑定 | 开放、独立、设计至上 |
| Whisper本地部署 | 隐私安全 | 技术门槛高 | 零门槛、开箱即用 |
| 小宇宙App | 原生体验 | 无转写功能 | 补足其短板，成为生态伙伴 |

---

## 3. 核心功能设计

### 3.1 MVP功能矩阵（Phase 1）

#### 🎯 核心功能1：智能转录引擎

**功能描述**：
用户上传音频文件后，系统在30秒内完成转录，包括：
- 99%+准确率的语音转文字
- 自动说话人识别（Speaker Diarization）
- 智能标点修正
- 时间戳精确到词级别（Word-level Timestamps）

**技术方案**：
```python
# GLM-ASR API 配置
API_CONFIG = {
    "model": "GLM-ASR-2512",
    "pricing": "¥16/百万tokens",
    "features": {
        "speaker_diarization": True,
        "word_timestamps": True,
        "punctuation": True,
        "paragraphs": True
    },
    "segmentation": {
        "strategy": "25s + 2s overlap",
        "concurrency": 3,
        "max_duration": "无限制（通过ffmpeg分段）"
    }
}

# API Key 配置（用户需自行申请）
ZHIPUAI_API_KEY = "your-api-key-here"  # 格式: id.secret
# 申请地址: https://open.bigmodel.cn/usercenter/apikeys
```

**用户价值**：
- ✅ 无需等待，极速获取结果
- ✅ 多人对话清晰区分
- ✅ 适合长音频（无30分钟限制）

---

#### 🎯 核心功能2：沉浸式播放器

**功能描述**：
业界首个"音频优先"设计的播放器

**交互创新**：

1. **波形可视化**
   - 200条高精度波形柱
   - 渐变色进度指示（橙色→青色）
   - 当前位置动态高亮
   - 鼠标悬停预览时间戳

2. **音字同步（Karaoke模式）**
   - 当前播放词实时高亮（橙色光晕）
   - 自动滚动跟随
   - 点击任意词跳转播放（精度50ms）

3. **手势控制**
   - 双指长按：1.5x倍速
   - 单击波形：跳转播放
   - 双击空白：播放/暂停

4. **快捷键**
   - `空格`: 播放/暂停
   - `←/→`: 后退/前进15秒
   - `J/K`: 后退/前进5秒
   - `↑/↓`: 音量调节
   - `F`: 全屏模式
   - `?`: 显示快捷键帮助

**UI细节**：
- 播放按钮：渐变色圆形按钮，直径56px，带光晕效果
- 进度条：双层设计，底层灰色，顶层渐变（#f97316 → #06b6d4）
- 毛玻璃效果：backdrop-filter: blur(20px)
- 阴影：多层阴影营造深度感

---

#### 🎯 核心功能3：逐字稿智能展示

**功能描述**：
超越传统文本编辑器的交互体验

**视觉设计**：
```
┌─────────────────────────────────────────┐
│  📝 逐字稿                               │
├─────────────────────────────────────────┤
│                                          │
│  [SPEAKER_00] 🎤 嘉宾A                   │
│  ┌──────────────────────────┐           │
│  │ 今晚的他不是演奏者而是    │ ← 时间戳 00:15  │
│  │ 译者，以乐曲翻译那些      │           │
│  │ 难以言说的情绪。          │           │
│  └──────────────────────────┘           │
│         ↑ 当前播放词（高亮）              │
│                                          │
│  [SPEAKER_01] 🎙️ 嘉宾B                   │
│  被即兴的琴键接住并轻轻托起...           │
│                                          │
└─────────────────────────────────────────┘
```

**交互功能**：
1. **说话人视觉区分**
   - 嘉宾A：橙色主题 (#f97316)
   - 嘉宾B：青色主题 (#06b6d4)
   - 头像标识：渐变圆形+首字母

2. **时间戳显示**
   - 鼠标悬停段落：显示精确时间戳
   - 格式：`00:15:23`（时:分:秒）

3. **即时操作**
   - 选中文字：弹出操作菜单
     - 💾 复制（含时间戳）
     - 🎯 从此播放
     - 📌 添加标记
     - 📤 生成分享卡片

4. **全文搜索**
   - 实时搜索（0延迟）
   - 关键词高亮（黄色背景）
   - 点击结果跳转播放

---

#### 🎯 核心功能4：多格式导出

**功能描述**：
满足各种场景的导出需求

**导出格式**：

1. **TXT - 纯文本**
   ```
   [00:00:00] SPEAKER_00: 今晚的他不是演奏者而是译者...
   [00:00:15] SPEAKER_01: 被即兴的琴键接住并轻轻托起...
   ```

2. **JSON - 结构化数据**
   ```json
   {
     "metadata": {
       "title": "归从音乐会",
       "duration": 143.2,
       "speakers": ["SPEAKER_00", "SPEAKER_01"]
     },
     "segments": [
       {
         "speaker": "SPEAKER_00",
         "start": 0.0,
         "end": 15.3,
         "text": "今晚的他不是演奏者而是译者",
         "words": [
           {"text": "今晚", "start": 0.0, "end": 0.5},
           {"text": "的他", "start": 0.5, "end": 0.8}
         ]
       }
     ]
   }
   ```

3. **SRT - 字幕文件**
   ```
   1
   00:00:00,000 --> 00:00:15,300
   <font color="#f97316">[嘉宾A]</font> 今晚的他不是演奏者而是译者
   ```

4. **Markdown - 笔记格式**（新增）
   ```markdown
   # 归从音乐会

   ## 📊 元信息
   - **时长**: 2分23秒
   - **说话人**: 2人
   - **字数**: 714字

   ## 📝 逐字稿

   ### [嘉宾A] @ 00:00
   今晚的他不是演奏者而是译者，以乐曲翻译那些难以言说的情绪。

   ### [嘉宾B] @ 00:15
   被即兴的琴键接住并轻轻托起。
   ```

---

### 3.2 增强功能（Phase 2 - 3个月后）

#### 🚀 AI智能摘要
- 自动生成3句话摘要
- 提取5个核心观点
- 生成思维导图

#### 🚀 智能章节划分
- 自动识别话题转换
- 生成章节目录
- 一键跳转任意章节

#### 🚀 高光时刻
- AI识别精彩片段
- 生成15秒集锦
- 社交媒体分享

#### 🚀 知识库集成
- Notion同步
- Obsidian插件
- Readwise连接

---

### 3.3 终极愿景（Phase 3 - 6个月后）

#### 🌟 AI对话助手
- 基于播客内容的问答
- "这段话的主要观点是什么？"
- "找出所有提到'归从'的地方"

#### 🌟 多语言支持
- 实时翻译（英→中，中→英）
- 双语对照显示
- 支持多语言播客

#### 🌟 协作功能
- 多人共享笔记
- 评论和讨论
- 团队知识库

---

## 4. UI/UX设计规范

### 4.1 设计哲学

**核心原则**：
1. **隐形技术** - AI能力隐藏在极简界面之下
2. **即时反馈** - 所有操作<100ms响应
3. **情感化设计** - 每个动画都有意义
4. **呼吸感** - 充足留白，不拥挤

**设计语言**：
- **风格**: 未来主义极简主义
- **关键词**: 流动、透明、发光
- **灵感来源**:
  - Apple Vision Pro的玻璃态
  - Stripe的渐变美学
  - Linear的微交互动画

---

### 4.2 色彩系统

**主色调（Gradients）**：
```css
/* 主渐变 - 日落橙到深海蓝 */
--gradient-primary: linear-gradient(135deg, #f97316 0%, #06b6d4 100%);
--gradient-secondary: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);

/* 功能色 */
--color-primary: #f97316;    /* 橙色 - 主要操作 */
--color-accent: #06b6d4;     /* 青色 - 次要操作 */
--color-success: #10b981;    /* 绿色 - 成功状态 */
--color-error: #ef4444;      /* 红色 - 错误状态 */
--color-warning: #f59e0b;    /* 黄色 - 警告 */

/* 中性色 */
--color-bg: #0a0a0f;         /* 深黑背景 */
--color-card: #12121a;       /* 卡片背景 */
--color-border: #1e1e2e;     /* 边框颜色 */
--color-text-primary: #f3f4f6;  /* 主要文字 */
--color-text-secondary: #9ca3af; /* 次要文字 */
--color-text-tertiary: #6b7280;  /* 辅助文字 */
```

**渐变应用场景**：
- 播放按钮：主渐变
- 进度条：主渐变
- 波形高亮：主渐变
- 分隔线：15%透明度主渐变
- 光晕效果：blur(60px) + 20%透明度

---

### 4.3 字体系统

```css
/* 标题字体 */
--font-display: 'SF Pro Display', -apple-system, sans-serif;
--font-heading: 'Inter', system-ui, sans-serif;

/* 正文字体 */
--font-body: 'SF Pro Text', -apple-system, sans-serif;

/* 等宽字体（时间戳） */
--font-mono: 'SF Mono', 'Fira Code', monospace;

/* 字号规范 */
--text-4xl: 2.25rem;    /* 36px - 页面标题 */
--text-3xl: 1.875rem;   /* 30px - 章节标题 */
--text-2xl: 1.5rem;     /* 24px - 卡片标题 */
--text-xl: 1.25rem;     /* 20px - 小标题 */
--text-lg: 1.125rem;    /* 18px - 强调文字 */
--text-base: 1rem;      /* 16px - 正文 */
--text-sm: 0.875rem;    /* 14px - 辅助文字 */
--text-xs: 0.75rem;     /* 12px - 标签 */
```

**字重使用**：
- Regular (400): 正文
- Medium (500): 小标题
- Semibold (600): 标题
- Bold (700): 强调

---

### 4.4 间距系统

```css
/* 8pt Grid System */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
```

---

### 4.5 组件规范

#### 卡片（Glass Card）
```css
.glass {
  background: rgba(18, 18, 26, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.08);
}

.glass:hover {
  border-color: rgba(249, 115, 22, 0.3);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(249, 115, 22, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### 按钮
```css
/* 主按钮 */
.btn-primary {
  background: linear-gradient(135deg, #f97316 0%, #06b6d4 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}
```

#### 输入框
```css
.input {
  background: rgba(18, 18, 26, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  color: #f3f4f6;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #06b6d4;
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
}
```

---

### 4.6 动画规范

**缓动函数**：
```css
--ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1);
--ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);
--ease-spring: cubic-bezier(0.4, 0, 0.2, 1);
```

**动画时长**：
```css
--duration-instant: 100ms;   /* hover状态 */
--duration-fast: 200ms;      /* 轻微交互 */
--duration-normal: 300ms;    /* 标准交互 */
--duration-slow: 500ms;      /* 页面切换 */
--duration-slower: 800ms;    /* 首次加载 */
```

**常用动画**：
```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 上浮淡入 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 缩放淡入 */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 光晕脉冲 */
@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(249, 115, 22, 0.5);
  }
}
```

---

### 4.7 页面布局设计

#### 首页（上传页）
```
┌─────────────────────────────────────────────────────┐
│                                                      │
│                   [Logo: 回声]                        │
│                                                      │
│              🎙️ 播客逐字稿                            │
│           上传播客音频，AI自动生成高质量逐字稿         │
│                                                      │
│    ┌─────────────────────────────────────────┐      │
│    │                                         │      │
│    │        [拖拽音频到此处]                   │      │
│    │         或点击选择文件                    │      │
│    │                                         │      │
│    │    最大 25MB  •  支持长音频              │      │
│    │                                         │      │
│    └─────────────────────────────────────────┘      │
│                                                      │
│    ⚡ 极速转录    🎯 精准识别    👥 说话人区分        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### 转录结果页
```
┌─────────────────────────────────────────────────────┐
│  [← 返回]    归从音乐会  ⏱ 2:23    [导出] [分享]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  ▶  ⏮ 15s  ⏭ 15s  0:15 / 2:23  [音量]     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  ▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂               │   │
│  │  ▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂               │   │
│  │  （波形可视化，橙色→青色渐变）                   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────┬──────────────────────────┐   │
│  │  📝 逐字稿        │  📊 统计 & 导出           │   │
│  │                  │                          │   │
│  │  [嘉宾A] 🎤       │  • 字数: 714            │   │
│  │  今晚的他不是...   │  • 时长: 2:23           │   │
│  │                  │  • 片段: 6              │   │
│  │  [嘉宾B] 🎙️       │  • 说话人: 2人          │   │
│  │  被即兴的琴键...   │                          │   │
│  │                  │  导出选项:              │   │
│  │  [当前词高亮]      │  📄 纯文本              │   │
│  │                  │  { } JSON               │   │
│  │                  │  🎬 SRT字幕             │   │
│  │                  │  📝 Markdown            │   │
│  └──────────────────┴──────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 5. 技术实现方案

### 5.1 技术栈

**前端**：
```yaml
框架: React 18 + TypeScript
构建工具: Vite
状态管理: Zustand
路由: React Router v6
UI库: Tailwind CSS
动画: Framer Motion
音频处理: Web Audio API
图表: D3.js (可选)
```

**后端**：
```yaml
框架: FastAPI (Python 3.9+)
音频处理: ffmpeg + pydub
语音识别: GLM-ASR API
并发处理: asyncio + ThreadPoolExecutor
数据存储: 暂不需要（无状态服务）
```

**部署**：
```yaml
前端: Vercel / Netlify
后端: Railway / Render / 阿里云ECS
域名: echo.transcribe (示例)
```

---

### 5.2 GLM-ASR API 集成

#### 5.2.1 API Key 申请流程

1. **注册智谱AI账号**
   - 访问: https://open.bigmodel.cn/usercenter/apikeys
   - 完成实名认证

2. **创建API Key**
   - 点击"创建API Key"
   - 复制Key（格式：`1234567890.abcd1234abcd1234`）
   - **重要**: 仅显示一次，请妥善保存

3. **充值（按需）**
   - 新用户赠送额度
   - 转写成本：¥16/百万tokens
   - 建议初始充值：¥100

#### 5.2.2 配置文件

**后端配置** (`server.py`):
```python
import os
from dataclasses import dataclass
from typing import Optional
from zhipuai import ZhipuAI

@dataclass
class GLMConfig:
    """GLM-ASR API 配置"""

    # API Key（从环境变量读取，或直接填入）
    API_KEY: str = os.getenv(
        "ZHIPUAI_API_KEY",
        "your-api-key-here"  # 格式: id.secret
    )

    # 模型配置
    MODEL: str = "GLM-ASR-2512"  # CER: 0.0717

    # 价格配置
    PRICE_PER_MILLION_TOKENS: float = 16.0  # ¥16/百万tokens

    # 音频分段策略
    SEGMENT_DURATION: int = 25  # 每段25秒
    OVERLAP_DURATION: int = 2   # 重叠2秒
    MAX_WORKERS: int = 3        # 并发数

    # API参数
    TEMPERATURE: float = 0.3    # 降低随机性
    TOP_P: float = 0.9

    @property
    def client(self) -> ZhipuAI:
        """获取API客户端"""
        return ZhipuAI(api_key=self.API_KEY)

# 全局配置实例
glm_config = GLMConfig()
```

**环境变量** (`.env`):
```bash
# GLM-ASR API Key
ZHIPUAI_API_KEY=1234567890.abcd1234abcd1234

# 服务器配置
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:3000

# 音频处理
FFMPEG_PATH=/usr/local/bin/ffmpeg
FFPROBE_PATH=/usr/local/bin/ffprobe
```

#### 5.2.3 核心代码实现

**音频分段** (`server.py`):
```python
from pydub import AudioSegment
from concurrent.futures import ThreadPoolExecutor
import asyncio

async def split_audio(file_path: str) -> list[tuple[bytes, float, float]]:
    """
    将音频分段，每段25秒+2秒重叠

    Returns:
        [(segment_bytes, start_time, end_time), ...]
    """
    # 加载音频
    audio = AudioSegment.from_file(file_path)

    segments = []
    segment_duration = 25 * 1000  # 25秒（毫秒）
    overlap_duration = 2 * 1000   # 2秒重叠

    for i in range(0, len(audio), segment_duration - overlap_duration):
        segment = audio[i:i + segment_duration]

        # 导出为bytes
        buffer = io.BytesIO()
        segment.export(buffer, format="mp3")
        segment_bytes = buffer.getvalue()

        start_time = i / 1000.0  # 转为秒
        end_time = min((i + segment_duration) / 1000.0, len(audio) / 1000.0)

        segments.append((segment_bytes, start_time, end_time))

    return segments
```

**并发转录** (`server.py`):
```python
from zhipuai import ZhipuAI
import base64

async def transcribe_segment(
    client: ZhipuAI,
    segment_bytes: bytes,
    start_time: float,
    end_time: float
) -> dict:
    """
    转写单个音频片段
    """
    # 编码为base64
    audio_base64 = base64.b64encode(segment_bytes).decode("utf-8")

    # 调用GLM-ASR API
    response = client.audio.transcriptions.create(
        model=glm_config.MODEL,
        file=audio_base64,
        response_format="verbose_json",  # 包含词级时间戳
        timestamp_granularities=["word"],
        temperature=glm_config.TEMPERATURE,
    )

    return {
        "text": response.text,
        "words": response.words,
        "start_time": start_time,
        "end_time": end_time,
    }

async def transcribe_concurrent(
    segments: list[tuple[bytes, float, float]],
    progress_callback: Optional[callable] = None
) -> dict:
    """
    并发转录所有片段
    """
    client = glm_config.client
    results = []

    with ThreadPoolExecutor(max_workers=glm_config.MAX_WORKERS) as executor:
        loop = asyncio.get_event_loop()

        tasks = [
            loop.run_in_executor(
                executor,
                await transcribe_segment(client, seg, start, end)
            )
            for seg, start, end in segments
        ]

        # 执行并发任务
        for i, task in enumerate(asyncio.as_completed(tasks)):
            result = await task
            results.append(result)

            # 进度回调
            if progress_callback:
                progress = (i + 1) / len(segments) * 100
                progress_callback(progress)

    # 合并结果
    return merge_segments(results)
```

**结果合并** (`server.py`):
```python
def merge_segments(results: list[dict]) -> dict:
    """
    合并多个片段的转写结果

    策略：
    1. 移除重叠部分的重复内容
    2. 调整时间戳
    3. 合并说话人标记
    """
    full_text = []
    all_words = []

    for result in sorted(results, key=lambda x: x["start_time"]):
        # 简单策略：移除重叠部分
        # （实际可以更智能，基于文本相似度）
        if full_text and result["words"]:
            last_word_end = all_words[-1]["end"]
            first_word_start = result["words"][0"]["start"]

            # 如果有重叠，截断
            if first_word_start < last_word_end:
                # 调整时间戳
                offset = result["start_time"]
                for word in result["words"]:
                    word["start"] += offset
                    word["end"] += offset

        full_text.append(result["text"])
        all_words.extend(result["words"])

    return {
        "fullText": "".join(full_text),
        "words": all_words,
        "duration": max(r["end_time"] for r in results),
        "wordCount": len(all_words),
    }
```

#### 5.2.4 成本估算

**1小时音频的成本**：
```
假设：
- 语速：150词/分钟
- 1小时 = 9000词
- 中文平均：1词 ≈ 2.5 tokens

tokens = 9000 × 2.5 = 22,500 tokens
成本 = 22,500 / 1,000,000 × ¥16 = ¥0.36

结论：转写1小时播客仅需¥0.36
```

**定价策略**：
- 免费额度：每月30分钟
- Pro版：¥29/月，无限转写
- 团队版：¥99/月，支持协作

---

### 5.3 前端核心实现

**状态管理** (`src/stores/audioStore.ts`):
```typescript
import { create } from 'zustand';

interface AudioStore {
  // 数据
  currentAudio: AudioFile | null;
  transcription: TranscriptionResult | null;

  // UI状态
  isTranscribing: boolean;
  progress: number;

  // Actions
  setCurrentAudio: (audio: AudioFile) => void;
  setTranscription: (result: TranscriptionResult) => void;
  setTranscribing: (isTranscribing: boolean) => void;
  setProgress: (progress: number) => void;
  reset: () => void;
}

export const useAudioStore = create<AudioStore>()((set) => ({
  currentAudio: null,
  transcription: null,
  isTranscribing: false,
  progress: 0,

  setCurrentAudio: (audio) => set({ currentAudio: audio }),
  setTranscription: (result) => set({ transcription: result }),
  setTranscribing: (isTranscribing) => set({ isTranscribing }),
  setProgress: (progress) => set({ progress }),
  reset: () => set({
    currentAudio: null,
    transcription: null,
    isTranscribing: false,
    progress: 0,
  }),
}));
```

**API调用** (`src/utils/api.ts`):
```typescript
const API_BASE = 'http://localhost:8000';

export async function uploadAndTranscribe(
  file: File,
  onProgress?: (progress: number) => void
): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Transcription failed');
  }

  const reader = response.body?.getReader();
  // ... 处理流式响应和进度
}
```

---

## 6. 产品迭代路线图

### Phase 1: MVP（当前 - 1月）
**目标**: 验证核心价值

- ✅ 基础转录功能
- ✅ 播放器+波形
- ✅ 逐字稿展示
- ✅ 导出功能

**成功标准**：
- 100个内测用户
- 转录准确率>95%
- 用户满意度>4.5/5

---

### Phase 2: 增强版（2月 - 4月）
**目标**: 提升留存和付费转化

- 🚀 AI智能摘要
- 🚀 智能章节划分
- 🚀 高光时刻
- 🚀 用户账户系统
- 🚀 会员订阅

**成功标准**：
- 1000+注册用户
- 付费转化率>5%
- 月活跃率>40%

---

### Phase 3: 生态版（5月 - 7月）
**目标**: 构建知识管理生态

- 🌟 知识库集成（Notion/Obsidian）
- 🌟 AI对话助手
- 🌟 多语言支持
- 🌟 协作功能

**成功标准**：
- 5000+用户
- 与3个知识库平台集成
- NPS评分>60

---

### Phase 4: 平台化（8月+）
**目标**: 成为播客基础设施

- 🚀 播客搜索引擎
- 🚀 创作者工具套件
- 🚀 开放API平台
- 🚀 移动端App

**愿景**：
- 10万+用户
- 月处理100万+小时音频
- 成为播客行业的"Google"

---

## 7. 成功指标

### 7.1 北极星指标
**"用户每周使用回声处理播客的时长"**

### 7.2 关键指标

| 指标类型 | 指标名称 | 目标值 | 当前值 |
|---------|---------|--------|--------|
| **增长** | 月活跃用户(MAU) | 10,000 | - |
| | 新用户注册率 | 20% | - |
| **留存** | 次日留存 | 60% | - |
| | 7日留存 | 40% | - |
| | 30日留存 | 20% | - |
| **参与度** | 平均会话时长 | 15分钟 | - |
| | 每用户每周转录数 | 3个 | - |
| | 功能使用率(导出) | 50% | - |
| **商业** | 付费转化率 | 5% | - |
| | ARPU(月均收入) | ¥50 | - |
| | CAC(获客成本) | ¥30 | - |
| | LTV/CAC | >3 | - |
| **体验** | 转录准确率 | >95% | - |
| | 转录速度 | <30秒/10分钟 | - |
| | 用户满意度(CSAT) | >4.5/5 | - |
| | NPS | >50 | - |

### 7.3 阶段性里程碑

**第1个月**：
- ✅ 完成MVP开发
- ✅ 邀请50位内测用户
- ✅ 转录准确率达到95%

**第3个月**：
- 🎯 上线付费订阅
- 🎯 1000+注册用户
- 🎯 50+付费用户

**第6个月**：
- 🎯 5000+用户
- 🎯 200+付费用户
- 🎯 实现收支平衡

**第12个月**：
- 🎯 10万+用户
- 🎯 1000+付费用户
- 🎯 月营收5万+

---

## 附录

### A. 竞品对比表

| 功能 | 回声 Echo | 飞书妙记 | 通义听悟 | Otter.ai |
|-----|----------|---------|---------|----------|
| 中文支持 | ✅ 原生 | ✅ | ✅ | ❌ 仅英文 |
| 说话人识别 | ✅ | ✅ | ✅ | ✅ |
| 词级时间戳 | ✅ | ❌ | ❌ | ✅ |
| 播客优化 | ✅ | ❌ | ❌ | ❌ |
| 导出格式 | 4种 | 2种 | 3种 | 3种 |
| UI设计 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| API集成 | ✅ | ❌ | ❌ | ✅ |
| 定价 | ¥29/月 | 免费(企业) | 免费(阿里) | $8.95/月 |

---

### B. 技术架构图

```
┌─────────────────────────────────────────────────────────┐
│                    用户界面层                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  上传页面    │  │  播放器     │  │  逐字稿     │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   前端应用层 (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Zustand Store│  │ Framer Motion│  │ Tailwind CSS │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   API网关层 (FastAPI)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  CORS处理    │  │  文件上传    │  │  流式响应    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   业务逻辑层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  音频分段    │  │  并发转录    │  │  结果合并    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   外部服务层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ GLM-ASR API  │  │   FFmpeg     │  │   云存储     │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

### C. UI设计稿链接

**Figma设计文件**（待创建）:
- 桌面端: https://figma.com/file/echo/desktop
- 移动端: https://figma.com/file/echo/mobile
- 设计系统: https://figma.com/file/echo/design-system

**设计资源**:
- 图标库: Lucide React
- 插画: undraw.co
- 字体: SF Pro (Apple), Inter (Google Fonts)

---

### D. 开发团队

**MVP阶段**（1人）:
- 全栈工程师 × 1

**Phase 2**（3人）:
- 全栈工程师 × 1
- 前端工程师 × 1
- 产品设计师 × 1

**Phase 3**（5人）:
- 工程团队 × 3
- 设计团队 × 1
- 产品经理 × 1

---

### E. 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|-----|------|------|---------|
| GLM-ASR API不稳定 | 高 | 中 | 多模型备用方案（Whisper） |
| 成本超支 | 中 | 低 | 设置用量限制，优化分段策略 |
| 用户增长缓慢 | 高 | 中 | SEO优化，内容营销，社区建设 |
| 竞品抄袭 | 中 | 高 | 快速迭代，构建护城河（生态集成） |
| 法律风险（版权） | 高 | 低 | 添加免责声明，仅存储用户数据 |

---

### F. 联系方式

**产品负责人**: James
**邮箱**: [待补充]
**微信**: [待补充]
**Telegram**: [待补充]

---

## 结语

「回声 Echo」不仅仅是一个转写工具，我们的使命是**重新定义人类获取和消费音频内容的方式**。

在这个信息爆炸的时代，播客作为一种深度内容载体，正在被越来越多的高知人群接受。但音频的线性特性限制了其传播和沉淀的价值。

我们相信，通过AI技术的加持，播客可以从"听过即逝"的碎片内容，转变为"可检索、可引用、可沉淀"的知识资产。

**让每一次聆听，都有回声。**

---

**文档版本历史**:
- v1.0 (2025-01-10): 初版发布 - James
- [待更新]

**下次评审**: 2025-02-01
