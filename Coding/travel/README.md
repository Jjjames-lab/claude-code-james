# 🌍 AI旅行顾问

> 来自宇宙的善意，为你规划地球之旅

一个**对话式AI旅行顾问**，通过自然对话了解用户需求，生成个性化旅行行程。

## ✨ 核心特点

- 🤝 **对话式交互** - 不是问卷调查，而是自然对话
- 🌌 **外星人视角** - 来自织女星系的小星，独特而有趣
- ❤️ **平等包容** - 不给人贴标签，尊重每个人的选择
- 🎯 **个性化推荐** - 基于真实需求生成行程

## 🎯 产品理念

> **我们不需要"懂你"（定义你），我们需要"懂这次的你"（理解你）**

- ❌ 不用问卷、不打分、不贴标签
- ✅ 自然对话、理解陪伴、动态生成

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd travel

# 安装所有依赖
npm run install:all
```

### 配置

```bash
# 复制环境变量模板
cd backend
cp .env.example .env

# 编辑 .env 文件，填入你的 Anthropic API Key
# ANTHROPIC_API_KEY=your_actual_api_key_here
```

### 启动

```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run dev:backend  # 终端1
npm run dev:frontend # 终端2
```

### 访问

- 前端：http://localhost:3000
- 后端：http://localhost:3001

详细说明请查看 [开发指南.md](./开发指南.md)

---

## 📁 项目结构

```
travel/
├── frontend/           # React前端
│   ├── src/
│   │   ├── components/    # 聊天窗口、侧边栏
│   │   ├── context/       # 状态管理
│   │   └── services/      # API调用
│   └── package.json
│
├── backend/            # Node.js后端
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── routes/        # 路由
│   │   └── services/      # Claude API集成
│   ├── server.js
│   └── package.json
│
├── PRD.md                            # 产品需求文档
├── AI人设系统-外星人旅行顾问.md       # AI人设设计
├── 旅行性格画像问卷系统.md            # 系统设计
├── memory.md                         # 项目记忆
└── 开发指南.md                       # 开发文档
```

---

## 🛠️ 技术栈

### 前端
- React 18
- Tailwind CSS
- Axios
- React Context

### 后端
- Node.js
- Express
- Anthropic SDK (Claude API)
- CORS

---

## 📊 开发进度

### ✅ 已完成

- [x] 产品设计（PRD + 人设系统）
- [x] 基础架构搭建
- [x] 前端聊天界面
- [x] 后端API服务
- [x] Claude API集成
- [x] 基础对话功能

### 🚧 进行中

- [ ] 优化对话能力
- [ ] 改进信息提取

### 📋 计划中

- [ ] Phase 2: 对话能力提升
- [ ] Phase 3: 数据爬虫
- [ ] Phase 4: 行程生成引擎
- [ ] Phase 5: 优化测试

---

## 🎨 界面预览

### 主界面

- 左侧：聊天窗口
- 右侧：信息侧边栏（实时显示已收集的信息）

### 交互流程

1. 用户开始对话
2. AI自然地了解需求
3. 侧边栏实时更新信息
4. 最终生成个性化行程

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

---

## 📄 许可证

ISC

---

## 🙏 致谢

感谢 James 的产品理念和设计指导。

**核心价值**：不给人贴标签，只懂现在的你。
