const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const STATE_FILE = path.join(__dirname, '../state.json');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// API: 获取状态
app.get('/api/state', (req, res) => {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    res.json(state);
  } catch (error) {
    console.error('Error reading state:', error);
    res.status(500).json({ error: 'Failed to read state' });
  }
});

// API: 更新状态
app.post('/api/update', (req, res) => {
  try {
    const update = req.body;

    console.log('\n📝 收到状态更新:');
    console.log(`  角色: ${update.roleId}`);
    console.log(`  状态: ${update.status}`);
    if (update.taskName) console.log(`  任务: ${update.taskName}`);
    if (update.eventMessage) console.log(`  事件: ${update.eventMessage}`);

    // 读取现有状态
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

    // 更新角色
    const roleIndex = state.roles.findIndex(r => r.id === update.roleId);
    if (roleIndex === -1) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    // 更新基本信息
    state.roles[roleIndex].status = update.status;

    // 更新任务信息
    if (update.status === 'working' && update.taskName) {
      state.roles[roleIndex].currentTask = {
        name: update.taskName,
        progress: update.progress,
        spentMinutes: update.spentTime,
        estimatedMinutes: update.estimatedTime
      };
    } else if (update.status === 'idle') {
      state.roles[roleIndex].currentTask = null;
    }

    // 添加事件
    if (update.eventMessage) {
      const now = new Date();
      const timeStr = now.getHours().toString().padStart(2, '0') + ':' +
                     now.getMinutes().toString().padStart(2, '0');

      state.events.unshift({
        time: timeStr,
        type: update.status === 'working' ? '🟡' : '✅',
        from: state.roles[roleIndex].name,
        message: update.eventMessage
      });

      // 只保留最近10条
      if (state.events.length > 10) {
        state.events = state.events.slice(0, 10);
      }
    }

    // 更新最后更新时间
    state.metadata.lastUpdate = new Date().toISOString();

    // 写入文件
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    console.log('✅ 状态更新成功\n');

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating state:', error);
    res.status(500).json({ error: 'Failed to update state' });
  }
});

// SSE: 实时推送
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  console.log('📡 新的 SSE 客户端已连接');

  let lastMtime = 0;

  const check = () => {
    try {
      const mtime = fs.statSync(STATE_FILE).mtimeMs;
      if (mtime !== lastMtime) {
        lastMtime = mtime;
        res.write(`data: ${mtime}\n\n`);
      }
    } catch (err) {
      console.error('Error checking file:', err);
    }
    setTimeout(check, 1000);
  };

  check();

  req.on('close', () => {
    console.log('📡 SSE 客户端已断开');
  });
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 可视化精英协作系统 V2 已启动！');
  console.log('='.repeat(50));
  console.log(`\n📊 看板地址: http://localhost:${PORT}/demo.html`);
  console.log(`📝 更新界面: http://localhost:${PORT}/update.html`);
  console.log(`\n💡 提示:`);
  console.log(`   - 按 Ctrl+C 停止服务器`);
  console.log(`   - 修改状态后看板会自动刷新`);
  console.log('\n' + '='.repeat(50) + '\n');
});
