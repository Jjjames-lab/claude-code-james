# Echo 项目记忆

## 项目信息
- **项目名称**: Echo（回声）- 智能播客转录平台
- **位置**: `/Users/tbingy/Desktop/Claude Code/Coding/echo---intelligent-podcast-transcription`
- **PRD文档**: `/Users/tbingy/Desktop/Claude Code/PRD-播客逐字稿产品.md`

## 当前状态
- **现有代码**: React + TypeScript 前端项目（Vite）
- **实现功能**: 音频上传、GLM-4转录调用、波形可视化、播放器、逐字稿显示、导出功能
- **UI状态**: 不需要改造现有UI（除非与PRD需求冲突）

## 核心结论（2025-01-10）

### 技术可行性分析
**结论**: PRD需求不能仅用纯前端实现，必须采用**前后端分离架构**

### 关键技术障碍
1. **音频分段处理**
   - PRD要求：25秒+2秒重叠分段（使用pydub+ffmpeg）
   - 问题：浏览器无法运行Python或ffmpeg
   - 影响：无法处理长音频（4小时播客）

2. **API文件大小限制**
   - GLM-ASR API有单次请求限制
   - 必须在后端用ffmpeg分段后并发调用

3. **API Key安全性**
   - 当前代码将API Key暴露在前端（constants.ts）
   - 必须移到后端环境变量

4. **并发控制**
   - PRD要求：3个并发转录任务
   - 需要后端ThreadPoolExecutor

## 确定的技术路线

### 推荐方案：FastAPI后端 + React前端

**后端技术栈**：
- FastAPI (Python 3.9+)
- pydub + ffmpeg（音频分段）
- zhipuai（GLM-ASR API调用）
- asyncio + ThreadPoolExecutor（并发控制）

**前端改造**：
- 保留现有UI
- 修改API调用层：指向自己的后端
- 移除暴露的API Key

**部署**：
- 后端：Railway / Render / 阿里云ECS
- 前端：Vercel / Netlify

## 下一步行动计划

### 待完成任务
1. ✅ 分析PRD中的音频处理要求
2. ✅ 评估纯前端方案的可行性
3. ✅ 制定技术路线方案

### 下次继续的任务（优先级排序）
1. **创建后端项目结构**
   - 初始化FastAPI项目
   - 配置依赖（requirements.txt）
   - 设置环境变量

2. **实现核心后端功能**
   - `audio_processor.py` - 音频分段（pydub+ffmpeg）
   - `transcriber.py` - GLM-ASR API调用
   - `main.py` - FastAPI路由和接口

3. **测试后端功能**
   - 本地测试音频分段
   - 测试并发转录
   - 验证长音频处理

4. **改造前端API调用**
   - 修改 `services/glmService.ts`
   - 指向新的后端地址
   - 移除暴露的API Key

## 重要技术细节

### GLM-ASR API配置
```python
API_CONFIG = {
    "model": "GLM-ASR-2512",
    "pricing": "¥16/百万tokens",
    "segmentation": {
        "strategy": "25s + 2s overlap",
        "concurrency": 3,
    }
}
```

### 音频分段策略
- 每段时长：25秒
- 重叠时长：2秒
- 并发数：3
- 目的：突破API单次请求限制

## 项目文件结构（规划）

```
echo-backend/
├── main.py              # FastAPI入口
├── audio_processor.py   # 音频分段
├── transcriber.py       # GLM-ASR调用
├── config.py            # 配置
├── requirements.txt     # 依赖
└── .env                 # 环境变量（API Key）
```

## 用户偏好
- **角色**: 产品经理，不会写代码
- **需求**: 理解技术方案，看懂数据
- **风格**: 喜欢中文沟通
- **产品哲学**: "简单" - 专注一个功能做到极致
- **UI要求**: 保留现有UI，除非与PRD需求有确认性冲突

## 对话历史
- 2025-01-10: 深度技术可行性分析，确定前后端分离方案
