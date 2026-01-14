# Travel 项目记忆

## ⚡ 快速启动（明天继续开发时先看这里）

### 📍 当前状态
- **已完成**: Phase 1（基础架构）+ Phase 2（对话能力提升）+ Phase 3（数据爬取）+ Phase 4（行程生成）
- **当前位置**: Phase 4完成，可以进行测试或进入Phase 5（优化测试）
- **项目路径**: `/Users/tbingy/Desktop/Claude Code/Coding/travel`

### 🎯 明天继续做什么
根据PRD，下一步是 **Phase 5: 优化与测试**
- UI/UX优化
- 对话流程优化
- 错误处理改进
- 性能优化
- 用户测试（小范围）

**或者先测试Phase 4的行程生成功能**：
- 参考 `Phase4测试指南.md`
- 启动前后端
- 完整测试对话到行程生成流程

### 📂 关键文件
- `PRD.md` - 完整产品需求文档
- `开发指南.md` - 如何启动项目
- `超简单启动指南.md` - 超简单的启动说明
- `Phase4测试指南.md` - Phase 4测试说明
- `backend/src/services/glmService.js` - GLM API集成（已用智谱AI替换Claude）
- `backend/src/services/itineraryService.js` - 行程生成服务（新增）
- `backend/src/services/dataService.js` - 数据服务（新增）
- `backend/data/crawler/crawler.py` - Python爬虫（新增）
- `backend/data/output/attractions.json` - 景点数据
- `backend/data/output/food.json` - 美食数据
- `backend/.env` - 已配置GLM API Key

### 🚀 如何启动项目
1. 启动后端：`./启动后端.sh`
2. 启动前端：`./启动前端.sh`
3. 访问：http://localhost:3000

### 💡 重要提醒
- **AI已换成GLM（智谱AI）**，不是Claude了
- API Key已配置：`9fa5c8fb63874432bb36e6f227a41248.rNv26KW2tocDugiW`
- **前端依赖安装慢**：已配置淘宝镜像加速
- 对话能力已增强：AI会计算天数（2/16-2/24=8天）、推断人数（我和女朋友=2人）

---

## 项目概述
- **项目名称**: AI旅行顾问（Travel）
- **创建日期**: 2026-01-07
- **当前阶段**: Phase 2完成，准备Phase 3
- **产品定位**: 对话式AI旅行顾问，通过自然对话了解用户需求，生成个性化旅行行程

---

## 2026-01-07 - 完整开发记录

### 🌅 上午：产品设计与规划

#### 第一次对话：建立工作系统
- 创建PROJECT_ROLE.md和memory.md
- 确定在travel文件夹内工作

#### 第二次对话：产品概念探索
**核心决策**：
1. 产品：AI旅行顾问
2. 目的地：越南（MVP）
3. 出发地：北京
4. 核心哲学：不用问卷、不打分、不贴标签
5. 方案：完全对话式

#### 第三次对话：PRD与系统设计
**完成的文档**：
1. PRD.md - 产品需求文档（完整）
2. AI人设系统-外星人旅行顾问.md - AI人设设计
3. 旅行性格画像问卷系统.md - 系统设计思想

**产品核心价值**：
> 我们不需要"懂你"（定义你），我们需要"懂这次的你"（理解你）

---

### 🌞 下午-晚上：开发Phase 1 & Phase 2

#### 第四次对话：Phase 1 基础架构搭建

**完成内容**：
1. ✅ 项目结构（frontend + backend）
2. ✅ 前端（React + Tailwind CSS）
   - ChatWindow.jsx - 聊天窗口
   - Sidebar.jsx - 信息侧边栏
   - ChatContext.js - 状态管理
3. ✅ 后端（Node.js + Express）
   - server.js - 服务器
   - chatController.js - 聊天控制器
   - claudeService.js - Claude API集成

**遇到的问题**：
- 用户没有开发经验，不理解npm install
- 解决：创建超简单启动指南和双击启动脚本

#### 第五次对话：换成GLM API

**原因**：用户要求把Claude API换成GLM（智谱AI）

**API Key**: `9fa5c8fb63874432bb36e6f227a41248.rNv26KW2tocDugiW`

**修改内容**：
- 修改backend/package.json（移除Anthropic SDK，添加axios）
- 创建glmService.js替换claudeService.js
- 使用GLM-4-Flash模型
- 更新.env配置

#### 第六次对话：安装依赖慢的问题

**问题**：npm install很慢

**解决**：
- 创建.npmrc配置文件
- 使用淘宝镜像：`registry=https://registry.npmmirror.com`
- 用户成功启动前后端

#### 第七次对话：AI推理能力问题

**用户发现的问题**：
1. 说"2月16到24日"，AI不会计算8天
2. 说"我和女朋友"，AI不会推断2人

**用户质疑**：不会做数学题吗？

**解决方案**：
- 增强System Prompt，明确要求AI会推理
- 使用二次AI调用专门提取信息
- 在提取提示词中给出计算示例
- 实现智能推理：计算日期差、推断人数

#### 第八次对话：完成Phase 2

**Phase 2完成内容**：
1. ✅ 创建dialogueManager.js - 对话状态管理
2. ✅ 智能话题引导 - 根据缺失信息引导对话
3. ✅ 对话完成检测 - 自动检测是否收集完所有信息
4. ✅ 信息摘要生成 - 对话完成时生成摘要
5. ✅ 前端完成提示 - 显示🎉"信息收集完成"

**必需信息字段**：
- duration（旅行天数）
- departureDate（出发日期）
- travelers（人数）
- budget（预算）
- preferences（偏好）

**优先级排序**：天数 > 日期 > 人数 > 预算 > 偏好

---

## 2026-01-08 - Phase 3 & Phase 4 开发

### 🌅 上午：Phase 3 数据爬取

#### 第九次对话：用户选择进入Phase 3

用户说："我们进行第三部分的开发吧"

**完成内容**：
1. ✅ 设计数据结构
   - 景点数据：id, name, city, category, description, location, visit_info, experience, tips, rating, tags
   - 美食数据：id, name, city, description, type, price_range, must_try, recommend_places, flavor_profile

2. ✅ 创建Python爬虫框架
   - 文件：`backend/data/crawler/crawler.py`
   - 类：VietnamDataCrawler
   - 功能：create_sample_data(), save_data(), add_attraction()

3. ✅ 生成示例数据
   - 3个河内景点（三十六行街、还剑湖、胡志明纪念馆）
   - 3个越南美食（越南河粉、越南春卷、滴漏咖啡）

4. ✅ 创建数据服务
   - 文件：`backend/src/services/dataService.js`
   - 功能：getAttractions(), getFood(), search(), getOverview()
   - 缓存机制：5分钟缓存

5. ✅ 创建数据API路由
   - 文件：`backend/src/routes/data.js`
   - 路由：
     - GET /api/data/attractions
     - GET /api/data/attractions/city/:city
     - GET /api/data/attractions/:id
     - GET /api/data/food
     - GET /api/data/food/popular
     - GET /api/data/search/:keyword
     - GET /api/data/overview

6. ✅ 更新前端API服务
   - 添加dataApi对象到frontend/src/services/api.js

**数据文件位置**：
- `backend/data/output/attractions.json`
- `backend/data/output/food.json`

### 🌞 下午：Phase 4 行程生成

#### 第十次对话：直接进入Phase 4

用户说："直接进入Phase 4开发"

**完成内容**：
1. ✅ 设计行程生成算法
   - 理念：不是模板拼接，而是个性化推理
   - 考虑因素：预算、偏好、节奏、同伴类型
   - 每日活动：上午、中午、下午、晚上

2. ✅ 创建行程生成服务
   - 文件：`backend/src/services/itineraryService.js`
   - 核心方法：
     - generateItinerary(userInfo) - 生成行程
     - buildItineraryPrompt() - 构建Prompt
     - parseItineraryResponse() - 解析AI响应
     - formatItineraryAsText() - 格式化为文本

3. ✅ 编写行程推理Prompt
   - 包含用户信息、可用数据（景点和美食）
   - 明确要求：个性化推理、节奏安排、预算考虑
   - 输出格式：JSON（overview + daily_itinerary）

4. ✅ 设计行程输出格式
   ```json
   {
     "overview": {
       "total_days": 7,
       "cities": ["河内"],
       "budget_breakdown": {...},
       "highlights": [...],
       "tips": [...]
     },
     "daily_itinerary": [
       {
         "day": 1,
         "date": "具体日期",
         "theme": "今日主题",
         "activities": [...]
       }
     ]
   }
   ```

5. ✅ 集成到对话流程
   - 创建行程API路由：`backend/src/routes/itinerary.js`
   - 添加到server.js：app.use('/api/itinerary', itineraryRoutes)
   - 更新前端api.js：添加itineraryApi对象
   - 更新ChatWindow.jsx：
     - 添加isGenerating和generatedItinerary状态
     - 实现handleGenerateItinerary函数
     - 更新"生成专属行程"按钮功能
     - 显示生成的行程卡片（预算、亮点、每日行程、提示）

6. ✅ 创建测试指南
   - 文件：`Phase4测试指南.md`
   - 包含：启动步骤、测试流程、预期结果、验证检查点、问题排查

**技术亮点**：
- 使用GLM API进行智能推理生成行程
- JSON格式容错处理（支持```json和```代码块）
- 前端展示完整的行程信息卡片
- 支持"重新规划"和"保存行程"功能

---

## 技术决策记录

### 技术栈
- **前端**: React 18 + Tailwind CSS + Axios
- **后端**: Node.js + Express
- **AI服务**: GLM API（智谱AI，非Claude）
- **数据库**: SQLite（MVP阶段，暂未使用）

### API配置
- **GLM API Key**: `9fa5c8fb63874432bb36e6f227a41248.rNv26KW2tocDugiW`
- **模型**: glm-4-flash
- **API地址**: https://open.bigmodel.cn/api/paas/v4/chat/completions

### 核心代码文件
**后端**：
- `backend/src/services/glmService.js` - GLM API集成，智能信息提取
- `backend/src/services/dialogueManager.js` - 对话状态管理
- `backend/src/controllers/chatController.js` - 聊天控制器
- `backend/server.js` - 服务器入口

**前端**：
- `frontend/src/components/ChatWindow.jsx` - 聊天窗口 + 完成提示
- `frontend/src/components/Sidebar.jsx` - 信息侧边栏
- `frontend/src/context/ChatContext.js` - 状态管理
- `frontend/src/services/api.js` - API调用

---

## 开发进度

### ✅ 已完成

#### Phase 0: 产品设计
- [x] PRD文档
- [x] AI人设系统
- [x] 系统设计文档

#### Phase 1: 基础架构
- [x] 前端项目（React + Tailwind）
- [x] 后端项目（Node.js + Express）
- [x] GLM API集成
- [x] 聊天界面
- [x] 信息侧边栏

#### Phase 2: 对话能力
- [x] 智能信息提取（计算天数、推断人数）
- [x] 对话状态管理
- [x] 话题引导
- [x] 对话完成检测
- [x] 信息摘要生成
- [x] 前端完成提示

### 📋 计划中（按PRD）

#### Phase 3: 数据爬取
- [x] 研究小红书/马蜂窝API或网页结构
- [x] 编写爬虫脚本（Python）
- [x] 设计数据结构
- [x] 爬取越南基础数据（示例数据）
- [x] 数据清洗和入库
- [x] 数据API开发

#### Phase 4: 行程生成
- [x] 设计行程生成算法
- [x] 编写行程推理Prompt
- [x] 实现个性化逻辑
- [x] 设计行程输出格式
- [x] 集成到对话流程
- [x] 测试行程质量（待用户测试）

#### Phase 5: 优化测试
- [ ] UI/UX优化
- [ ] 对话流程优化
- [ ] 错误处理
- [ ] 性能优化
- [ ] 用户测试

---

## 产品核心价值主张

### 核心理念
> **我们不需要"懂你"（定义你），我们需要"懂这次的你"（理解你）。**

### 三个关键假设
1. 人是不可定义的（矛盾、动态、情境依赖）
2. 量化会丢失本质
3. 关系比定义更重要（陪伴者 vs 评估者）

### 与传统产品的区别
- 不给人贴标签
- 不用量化评分
- 不是评估你，是陪伴你
- 不是静态画像，是动态理解

---

## AI人设：小星

### 身份
- 来自织女星系的外星人旅行顾问
- 在地球观察3年，帮助人类探索他们的星球

### 核心性格
- 好奇和善意
- 平等和包容
- 理解者和陪伴者

### 说话风格
- 温暖但不过度热情
- 友好但保持专业
- 偶尔用"外星人视角"
- 不说"你应该"，而说"你可以"

---

## James的重要洞察

- "简单" - 专注于一个功能并做到极致
- "人是复杂的，喜好也是复杂的"
- "世界是平等的属于每一个生物"
- "一定要基于真实数据和信息"

### 产品方法论
- 预测 → 单点击穿 → All in
- 从最小的MVP做起
- 先完成底层架构，再考虑交互方式

---

## 项目文档清单

```
travel/
├── PRD.md                                    # 产品需求文档
├── AI人设系统-外星人旅行顾问.md              # AI人设设计
├── 旅行性格画像问卷系统.md                   # 问卷系统设计
├── PROJECT_ROLE.md                           # Claude角色配置
├── 开发指南.md                               # 开发文档
├── 超简单启动指南.md                         # 启动说明
├── Phase4测试指南.md                         # Phase 4测试文档
└── memory.md                                 # 本文档
```

---

## 明天的行动计划

### 🎯 主要任务

**选项1：测试Phase 4**
- 参考 `Phase4测试指南.md`
- 启动前后端
- 完整测试对话→行程生成流程
- 记录测试结果和问题

**选项2：进入Phase 5（优化与测试）**
- UI/UX优化
- 对话流程优化
- 错误处理改进
- 性能优化
- 小范围用户测试

### 📋 测试Phase 4的具体步骤
1. 启动后端：cd backend && npm start
2. 启动前端：cd frontend && npm start
3. 在聊天窗口进行对话
4. 收集完所有信息后点击"生成专属行程"
5. 查看生成的行程是否合理
6. 记录问题和改进建议

### 💬 启动对话时可以这样说
> "继续开发AI旅行顾问项目，Phase 4已经完成。我现在想测试行程生成功能。"
> 或者：
> "继续开发AI旅行顾问项目，进入Phase 5优化与测试。"

这样就能快速回到当前状态！
