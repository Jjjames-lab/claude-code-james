# 播客逐字稿服务 - PodScript

> 🎙️ AI驱动的播客逐字稿生成工具
>
> 支持说话人区分 • 实时同步 • 多格式导出

---

## ✨ 特性

- 🎯 **高准确率识别**：基于智谱GLM-ASR模型，字符错误率仅0.0717
- 👥 **说话人自动区分**：智能识别不同对话者，支持A/B对话标记
- ⚡ **极速转录**：25秒分段+2秒重叠策略，并发处理
- 🎨 **精美界面**：音频可视化、逐字高亮、沉浸式体验
- 💾 **多格式导出**：支持TXT、JSON、SRT字幕格式
- 🌙 **深色主题**：护眼的夜间模式

---

## 🏗️ 技术架构

### 前端
- **框架**：React 18 + TypeScript
- **构建工具**：Vite 5
- **样式**：Tailwind CSS 3
- **动画**：Framer Motion
- **状态管理**：Zustand
- **路由**：React Router v6

### 后端
- **框架**：Python FastAPI
- **音频处理**：pydub
- **API集成**：智谱GLM-ASR-2512
- **并发处理**：ThreadPoolExecutor

### AI模型
- **语音识别**：智谱GLM-ASR-2512 (CER: 0.0717)
- **定价**：16元/百万tokens
- **限制**：单次请求≤30秒，采用分段策略

---

## 📁 项目结构

```
podcast-transcription/
├── podcast-app/              # 前端应用
│   ├── src/
│   │   ├── components/       # React组件
│   │   ├── pages/            # 页面组件
│   │   ├── stores/           # 状态管理
│   │   ├── utils/            # 工具函数
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── podcast_transcription_service.py  # 后端服务
├── test_glm_asr.py                   # API测试脚本
├── podcast_analysis_charts/          # 可视化图表
├── 播客逐字稿产品可行性分析报告.md
└── 播客逐字稿产品可行性分析报告.pptx
```

---

## 🚀 快速开始

### 前置要求

- Node.js 18+
- Python 3.9+
- 智谱AI API Key

### 安装依赖

#### 前端
```bash
cd podcast-app
npm install
```

#### 后端
```bash
pip install fastapi uvicorn python-multipart pydub requests
```

### 配置API Key

编辑 `podcast_transcription_service.py`:
```python
API_KEY = "your_api_key_here"  # 替换为你的API Key
```

### 启动服务

#### 后端服务
```bash
python podcast_transcription_service.py
```

#### 前端应用
```bash
cd podcast-app
npm run dev
```

访问：http://localhost:3000

---

## 📊 成本分析

### 定价模型

**智谱GLM-ASR-2512**：16元/百万tokens

- 1分钟音频 ≈ 150-200 tokens
- 1小时播客 ≈ 9,000-12,000 tokens
- **成本 ≈ ¥0.144-0.192/小时**

### 不同用户规模成本

| 用户数 | 人均转录 | 月度成本 |
|--------|----------|----------|
| 10人 | 2小时/月 | ¥2.88-3.84 |
| 100人 | 5小时/月 | ¥72-96 |
| 1,000人 | 20小时/月 | ¥288-384 |

### 盈亏平衡

假设定价¥29/月（标准版）：
- **盈亏平衡点：2个付费用户** ✅
- 毛利率：98%+

---

## 🎨 设计理念

### Audio-First Immersive（音频优先沉浸式）

- **动态声波背景**：粒子动画营造氛围
- **实时波形可视化**：播放时波形跳动
- **逐字高亮同步**：如音乐可视化般流畅
- **霓虹渐变配色**：珊瑚橙+青色，独特而非紫色俗套

### 配色方案

```css
--color-primary: #f97316    /* Electric Coral */
--color-accent: #06b6d4     /* Cyan */
--color-dark-bg: #0a0a0f    /* Deep Black */
```

### 字体选择

- **Display**: CalSans（标题）
- **Body**: Suisse Int'l / Inter（正文）
- **Mono**: JetBrains Mono（代码/时间）

---

## 🔧 核心功能

### 1. 音频分段处理

**挑战**：GLM-ASR限制≤30秒/次

**解决方案**：25秒分段+2秒重叠
- 避免句子截断
- 保持上下文连贯
- 并发处理提升速度

### 2. 实时同步

**技术实现**：
- Audio Element API监听播放进度
- requestAnimationFrame高精度同步
- CSS动态类切换实现高亮

### 3. 波形可视化

**技术方案**：
- Web Audio API解码音频
- 提取振幅数据
- Canvas 2D绘制
- 渐变色显示播放进度

---

## 📝 使用示例

### 上传与转录

1. 拖拽音频文件到上传区域
2. 等待转录完成（显示进度条）
3. 自动跳转到结果页面

### 播放与高亮

1. 点击播放按钮
2. 波形随播放跳动
3. 当前单词实时高亮
4. 点击任意单词跳转

### 导出功能

- **TXT**：纯文本格式
- **JSON**：结构化数据，包含时间戳
- **SRT**：字幕格式，支持导入视频编辑器

---

## 🚧 开发路线图

### v1.0 - MVP（当前）
- ✅ 基础转录功能
- ✅ 说话人区分（简单交替）
- ✅ 音频播放器
- ✅ 波形可视化
- ✅ 逐字高亮
- ✅ 导出功能

### v1.5 - 优化（计划中）
- [ ] 真实说话人分离（pyannote）
- [ ] 小宇宙链接解析
- [ ] 批量处理
- [ ] 用户账户系统

### v2.0 - 增强功能
- [ ] 播客知识管理
- [ ] AI摘要生成
- [ ] 笔记与标注
- [ ] 分享功能

---

## 🛠️ 故障排除

### 问题：音频无法加载
**解决**：确保音频格式为MP3、WAV或M4A

### 问题：转写失败
**解决**：
1. 检查API Key是否正确
2. 确认网络连接
3. 查看浏览器控制台错误信息

### 问题：波形不显示
**解决**：
1. 检查浏览器是否支持Web Audio API
2. 尝试使用Chrome或Firefox最新版

---

## 📄 License

MIT License

---

## 🙏 致谢

- **智谱AI**：提供GLM-ASR模型
- **Framer Motion**：优秀的动画库
- **Tailwind CSS**：实用优先的CSS框架

---

**Made with ❤️ by James & Claude**

> 🎙️ 让声音可见，让思想留存
