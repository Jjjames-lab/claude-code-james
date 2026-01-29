# 🚀 快速开始指南

> **小宇宙深度学习助手 - 启动步骤**

---

## ✅ 前置要求

- **Node.js** 18+ ([下载](https://nodejs.org/))
- **Python** 3.10+ ([下载](https://www.python.org/))
- 两个终端窗口（或使用 tmux/iTerm2 分屏）

---

## 📋 启动步骤

### 步骤 1: 启动后端服务

**打开第一个终端窗口**：

```bash
# 进入后端目录
cd /Users/tbingy/Desktop/Claude\ Code/Coding/Pod/backend/backend

# 方式1: 使用启动脚本（推荐）
./start.sh

# 方式2: 手动启动
source ../venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

**验证后端启动成功**：
- 看到：`Uvicorn running on http://0.0.0.0:8001`
- 浏览器访问：http://localhost:8001/docs
- 看到 FastAPI 自动生成的 API 文档

---

### 步骤 2: 启动前端服务

**打开第二个终端窗口**：

```bash
# 进入前端目录
cd /Users/tbingy/Desktop/Claude\ Code/Coding/Pod/frontend/pod-studio

# 启动开发服务器
npm run dev
```

**验证前端启动成功**：
- 看到：`Local: http://localhost:5173`
- 浏览器自动打开（或手动访问）
- 看到小宇宙深度学习助手界面

---

## 🧪 测试完整流程

### 1. 测试链接解析
```
1. 在前端输入小宇宙链接（任意有效链接）
2. 点击"发送"按钮
3. ✅ 成功：显示封面、标题、时长等信息
```

### 2. 测试转录功能
```
1. 点击"开始转录"按钮
2. 观察进度显示：
   - 下载音频 10-30%
   - 语音识别 30-90%
   - 处理结果 90-100%
3. ✅ 成功：显示逐字稿内容
```

### 3. 测试播放功能
```
1. 点击任意句子
2. ✅ 成功：音频跳转到对应时间并播放
3. 检查当前播放句子是否高亮
```

### 4. 测试 AI 优化
```
1. 点击左侧"AI 优化"按钮
2. 等待 LLM 处理完成
3. 切换"原始"/"优化"模式
4. ✅ 成功：优化后的文本有标点符号
```

---

## ⚠️ 常见问题

### 问题 1: 后端启动失败

**症状**：`ModuleNotFoundError` 或 `Command not found`

**解决方案**：
```bash
# 检查 Python 版本
python --version  # 应该是 3.10+

# 检查虚拟环境
cd ../
ls -la venv/      # 确认虚拟环境存在

# 重新激活
source venv/bin/activate

# 安装依赖
pip install -r backend/requirements.txt
```

---

### 问题 2: 前端无法连接后端

**症状**：`Network Error` 或 `ERR_CONNECTION_REFUSED`

**解决方案**：
```bash
# 确认后端已启动
curl http://localhost:8001/health

# 如果返回 404，检查路由
curl http://localhost:8001/api/v1/health

# 检查前端 API 配置
# 文件：frontend/pod-studio/src/services/api.ts
# 确认：API_BASE_URL = 'http://localhost:8001/api/v1'
```

---

### 问题 3: 转录失败

**症状**：转录长时间无响应或返回错误

**检查项**：
```bash
# 1. 查看后端日志
tail -f backend/logs/app.log

# 2. 检查音频 URL 是否可访问
# 在浏览器中直接打开音频链接

# 3. 检查 ASR 服务配置
# 文件：backend/.env
# 确认豆包/千问的 API Key 配置正确
```

---

### 问题 4: 端口被占用

**症状**：`Address already in use`

**解决方案**：
```bash
# 查找占用端口的进程
lsof -i :8001  # 后端端口
lsof -i :5173  # 前端端口

# 杀死进程
kill -9 <PID>

# 或修改端口
# 后端：uvicorn main:app --port 8002
# 前端：修改 vite.config.ts → server: { port: 5174 }
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
tail -f backend/backend/logs/app.log

# 前端在浏览器控制台查看
# Chrome: F12 → Console
```

### API 测试
```bash
# 使用 curl 测试后端 API
curl -X POST http://localhost:8001/api/v1/episode/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.xiaoyuzhoufm.com/episode/..."}'
```

---

## 📊 端口占用情况

| 服务 | 端口 | 用途 |
|------|------|------|
| 后端 API | 8001 | FastAPI 服务 |
| 前端开发服务器 | 5173 | Vite 开发服务器 |

---

## 🎯 下一步

启动成功后，您可以：

1. **阅读文档**
   - [README.md](./README.md) - 项目概览
   - [前端项目指南](./frontend/pod-studio/PROJECT_GUIDE.md) - 前端详细文档
   - [CHANGELOG.md](./CHANGELOG.md) - 版本历史

2. **继续开发**
   - 完善概览页面
   - 优化 LLM 性能
   - 添加新功能

3. **调试优化**
   - 查看后端日志
   - 检查前端控制台
   - 性能分析

---

## 📞 获取帮助

遇到问题？

1. 查看 [常见问题](./docs/archived/当前项目核心问题分析.md)
2. 查看 [测试报告](./docs/development/测试报告_2026-01-28.md)
3. 检查 [修复报告](./docs/technical/修复报告_2026-01-28.md)

---

**准备好了吗？开始启动吧！** 🚀
