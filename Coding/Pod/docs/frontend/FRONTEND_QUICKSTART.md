# 🚀 快速启动指南

> **前后端完整运行步骤**

---

## ✅ 当前状态

- ✅ **前端代码**：`pod-studio/` - 完整可运行
- ✅ **后端代码**：`后端Backend/backend/` - 完整可运行
- ✅ **API 配置**：前端 → `http://localhost:8001`
- ✅ **依赖已安装**：前端 node_modules，后端 venv

---

## 📋 启动步骤

### 步骤 1: 启动后端

```bash
# 进入后端目录
cd "/Users/tbingy/Desktop/Claude Code/Coding/Pod/后端Backend/backend"

# 方式1: 使用启动脚本（推荐）
./start.sh

# 方式2: 手动启动
# 激活虚拟环境
source ../venv/bin/activate

# 启动 FastAPI 服务器
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

**验证后端启动成功**：
- 浏览器访问：http://localhost:8001/docs
- 看到 FastAPI 自动生成的 API 文档

---

### 步骤 2: 启动前端

```bash
# 新开一个终端窗口
# 进入前端目录
cd "/Users/tbingy/Desktop/Claude Code/Coding/Pod/前端 Frontend/pod-studio"

# 启动开发服务器
npm run dev
```

**验证前端启动成功**：
- 浏览器访问：http://localhost:5173
- 看到小宇宙深度学习助手界面

---

## 🧪 测试完整流程

### 1. 测试链接解析
```
1. 在前端输入小宇宙链接（任意）
2. 点击"发送"
3. 观察是否成功解析（显示封面、标题等）
```

### 2. 测试转录功能
```
1. 点击"开始转录"
2. 观察进度显示：
   - 下载音频 10-30%
   - 语音识别 30-90%
   - 处理结果 90-100%
3. 完成后查看逐字稿
```

### 3. 测试 AI 优化
```
1. 点击"AI 优化"按钮
2. 等待 LLM 处理
3. 切换"原始"/"优化"模式
4. 验证标点符号是否正确添加
```

---

## ⚠️ 常见问题

### 问题 1: 后端启动失败
```bash
# 检查虚拟环境
source ../venv/bin/activate
python --version  # 应该是 Python 3.10+

# 检查依赖
pip install -r requirements.txt

# 检查端口占用
lsof -i :8001
```

### 问题 2: 前端无法连接后端
```bash
# 确认后端已启动
curl http://localhost:8001/health

# 检查前端 API 配置
# 文件：src/services/api.ts
# 确认：API_BASE_URL = 'http://localhost:8001/api/v1'
```

### 问题 3: 转录失败
```
检查项：
- 后端日志：backend/logs/
- 音频 URL 是否可访问
- ASR 服务是否正常（豆包/千问）
```

---

## 🛠️ 开发工具推荐

### 终端复用
使用 **tmux** 或 **iTerm2** 分屏功能：
```
左屏：后端服务 (localhost:8001)
右屏：前端服务 (localhost:5173)
```

### 日志监控
```bash
# 实时查看后端日志
tail -f backend/logs/app.log

# 前端在浏览器控制台查看
```

---

## 📊 端口占用情况

| 服务 | 端口 | 用途 |
|------|------|------|
| 后端 API | 8001 | FastAPI 服务 |
| 前端开发服务器 | 5173 | Vite 开发服务器 |

**修改端口**（如果冲突）：
```bash
# 后端：修改 backend/main.py
uvicorn main:app --port 8002

# 前端：修改 vite.config.ts
server: { port: 5174 }
```

---

## 🎯 下一步

启动成功后，可以：

1. **阅读文档**
   - README.md - 项目概览
   - PROJECT_GUIDE.md - 完整指南
   - CHANGELOG.md - 版本历史

2. **继续开发**
   - 完善概览页面
   - 优化 LLM 性能
   - 添加新功能

3. **调试优化**
   - 查看后端日志
   - 检查前端控制台
   - 性能分析

---

**准备好了吗？开始启动吧！** 🚀
