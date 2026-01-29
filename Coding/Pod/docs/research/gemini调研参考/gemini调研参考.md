# gemini调研参考  
  
  
这是打造高质量复刻产品的关键一步。既然我们要追求“颗粒级”精度，我们就不能只告诉 AI “做一个像 Scripod 的界面”，而是要给它一套**“视觉规范书”（Visual Spec Sheet）**。  
# 这套专门针对前端 UI 和交互的提示词。它跳过了后端逻辑，专注于 CSS、Tailwind 类名、布局结构和微交互动画。  
  
## 核心策略：  
我们将整个界面拆解为三个核心层级：  
1. **Global Foundation（全局基石）**：字体、色彩、间距系统。  
2. **Structural Layout（骨架布局）**：侧边栏、主内容区、悬浮播放器的空间关系。  
3. **Component Micro-Details（组件微细节）**：卡片的圆角、阴影、文字层级、播放器的毛玻璃效果。  
以下是双语版本。**英文版（English Version）** 是专门写给 Claude Code 的，采用了它最能理解的前端技术术语；**中文版（Chinese Version）** 是给你作为产品经理审核用的，确保符合你心中的预期。  
  
## 📋 English Version (For Claude Code)  
**Copy and paste this entire block to Claude Code.**  
# Role  
You are a Lead UI/UX Engineer specializing in "Pixel-Perfect" implementation using **Next.js 14**, **Tailwind CSS**, and **Framer Motion**.  
  
# Objective  
Replicate the exact visual style and interaction of scripod.com for a podcast application called "PodNote". Focus ONLY on the Frontend UI.  
  
# 1. Global Design System (The "Scripod" Look)  
* **Font Stack**: Use `Inter` or system sans-serif. It must feel clean and editorial.  
* **Background**: Pure white (`bg-white`) for the main content. Very light gray (`bg-gray-50`) for the sidebar.  
* **Borders**: Ultra-subtle. Use `border-gray-100` or `border-gray-200`. Never use dark borders.  
* **Shadows**: Minimalist. Use `shadow-sm` for cards, but remove shadows for a flat look where possible.  
* **Whitespace**: "Airy" design. Increase standard padding by 20%. Use `gap-6` or `gap-8`.  
  
# 2. Layout Architecture  
Create a standard "Dashboard" layout:  
* **Sidebar (Left)**: Fixed width (`w-64`), full height. Contains Logo and Navigation.  
* **Main Content (Right)**: Scrollable area. Max-width `max-w-5xl` centered.  
* **Player Bar (Bottom)**: Fixed position (`fixed bottom-0`), full width, z-index 50.  
  
# 3. Component Specs (Pixel-Level Detail)  
  
## A. The Episode Card (Feed Item)  
* **Container**: `flex flex-col gap-3 p-0 bg-transparent`. No border, no background on the container itself.  
* **Thumbnail**: Aspect ratio video (16:9) or square. `rounded-xl`. `border border-black/5`.  
* **Typography Hierarchy**:  
    1.  **Podcast Name**: `text-xs font-bold text-gray-500 uppercase tracking-wide`.  
    2.  **Episode Title**: `text-lg font-bold text-gray-900 leading-snug hover:text-blue-600 transition-colors cursor-pointer`.  
    3.  **Summary List**: Use `<ul>`. Bullets should be small dots (`text-gray-300`). Text is `text-sm text-gray-600 leading-relaxed`.  
    4.  **Metadata (Footer)**: `text-[10px]` or `text-xs`. `font-bold text-gray-400 uppercase`. Example: "2 DAYS AGO • 45M".  
  
## B. The "Deep Dive" Transcript View  
* **Layout**: Split view. Left side: Chapter Nav. Right side: Transcript.  
* **Transcript Text**:  
    * Font size: `text-[17px]`.  
    * Line height: `leading-[1.8]` (Loose).  
    * Color: `text-slate-700`.  
* **Speaker Label**: `text-xs font-bold text-slate-400 mb-1 block uppercase tracking-wider`.  
* **Active Sentence Interaction**:  
    * When a sentence is active (playing): Apply `bg-blue-50/80` and `text-blue-900`.  
    * Hover state: `hover:bg-gray-50 cursor-pointer`.  
  
## C. The Sticky Player  
* **Visual**: Glassmorphism effect. `backdrop-blur-xl bg-white/90 border-t border-gray-100`.  
* **Height**: `h-20`.  
* **Controls**: Minimalist icons (Play, Pause, Skip). Thin stroke (`stroke-[1.5]`).  
* **Progress Bar**: Ultra-thin (`h-1`). On hover, expand to `h-2`.  
  
# 4. Interaction Instructions  
* Implement smooth transitions (`duration-200`) for all hover states.  
* The "Transcript" needs to feel like reading a high-end magazine, not a code editor.  
  
Please generate the base layout code and the Episode Card component first.  
  
  
  
# 交互逻辑与功能分区规范（Interaction & Functional Specs）  
  
## 核心逻辑：给 AI 的“交互说明书”  
这份提示词重点定义了三个维度：  
1. **Zone (分区)**：屏幕被划分成了哪几块功能区。  
2. **Action (动作)**：鼠标点击、悬停时触发的具体事件。  
3. **State (状态)**：数据如何在不同页面间传递（比如播放器必须全局常驻）。  
## 📋 English Prompt (For Claude Code)  
**Copy and paste this block. It tells the AI exactly how the app functions.**  
  
# Phase 3: Functional Specifications & Interaction Logic  
  
Now that the UI styling is defined, we need to implement the core functionality, routing, and user interaction flows.  
  
## 1. App Architecture & State Management  
* **Framework**: Next.js 14 App Router.  
* **State Library**: Use `Zustand` for global state. This is CRITICAL.  
* **Global Player Requirement**: The `<PlayerBar />` component must live in the `layout.tsx`.  
    * *Why?* When a user navigates from the Homepage to an Episode Detail page, the audio must **NOT** stop playing. The state (current episode, isPlaying, currentTime) must be persistent across route changes.  
  
## 2. Page 1: The Library (Home) - Functional Zones  
**Route**: `/` (Root)  
  
### Zone A: The Sidebar (Navigation)  
* **Items**: "Trending", "Library", "Saved".  
* **Interaction**:  
    * Clicking "Trending" -> updates main view to show latest feed.  
    * Clicking "Saved" -> filters feed to show bookmarked episodes.  
  
### Zone B: The Feed (Main Content)  
* **Component**: `EpisodeCard` (Iterated list).  
* **Interaction / Click Targets**:  
    * **Target**: The entire Card surface.  
    * **Action**: `router.push('/episode/[id]')`. Navigates to the Detail Page.  
    * **Target**: The "Play" button (if visible on hover).  
    * **Action**:  
        1. Load this episode into the Global Player Store.  
        2. Set `isPlaying = true`.  
        3. Do NOT navigate away (User stays on feed, audio starts).  
  
## 3. Page 2: The Deep Dive (Detail Page) - Functional Zones  
**Route**: `/episode/[id]` (Dynamic Route)  
  
### Zone A: The Header (Context)  
* **Elements**: Large Episode Title, Podcast Cover Art, "Play/Pause" Big Button.  
* **Interaction**:  
    * **Click Big Play Button**:  
        * If current episode is loaded: Toggle Play/Pause.  
        * If different episode: Replace global player state with this episode and auto-play.  
  
### Zone B: The Transcript (The "Active Book")  
* **Data Structure**: The transcript is an array of objects: `{ id, speaker, start_time, end_time, text }`.  
* **Sync Logic (The "Scripod" Magic)**:  
    1.  **Audio -> Text**: Listen to `audioRef.currentTime`. Determine which segment is active. Apply `.active-segment` class (highlight style) to that text block automatically.  
    2.  **Text -> Audio**:  
        * **Event**: `onClick` on any text segment.  
        * **Action**: `player.seek(segment.start_time)`. The audio immediately jumps to that word.  
    3.  **Auto-Scroll**: When the active segment changes, smoothly scroll the container so the text is vertically centered. (Use `scrollIntoView({ behavior: 'smooth', block: 'center' })`).  
  
### Zone C: The Chapters (Sidebar/Drawer)  
* **Elements**: List of timestamps + titles (e.g., "05:00 - The Pivot").  
* **Interaction**:  
    * **Click**: Seeks player to that specific timestamp.  
  
## 4. The Global Player (Bottom Bar) - Functional Zones  
* **Visibility**: Always visible (`position: fixed bottom-0`).  
* **Elements**:  
    * **Left**: Mini thumbnail + scrolling title (Marquee effect).  
    * **Center**: Controls (Back 15s, Play/Pause, Forward 30s).  
    * **Bottom Edge**: Progress Bar.  
* **Interaction**:  
    * **Click Progress Bar**: Calculates percentage of width clicked -> Updates `audio.currentTime`.  
  
## 5. Mock Data Requirement for Functionality  
To make this functional without a real backend yet:  
* Create a file `data/mock-episode.json`.  
* Include a **Real MP3 URL** (use a public domain MP3 or a sample hosted file).  
* Include a **JSON Transcript** with real timestamps matching that MP3 so we can test the "Click-to-Seek" feature.  
  
Please implement the **Zustand store** first, then the **Routing logic**, and finally the **Transcript Sync** mechanism.  
  
  
  
