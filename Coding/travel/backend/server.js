const express = require('express');
const cors = require('cors');
const config = require('./src/config/config');
const chatRoutes = require('./src/routes/chat');
const dataRoutes = require('./src/routes/data');
const itineraryRoutes = require('./src/routes/itinerary');

const app = express();

// 中间件
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api/chat', chatRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/itinerary', itineraryRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: config.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   AI旅行顾问 - 后端服务已启动              ║
║   🌍 来自宇宙的善意，为你规划地球之旅      ║
╠═══════════════════════════════════════════╣
║   服务器地址: http://localhost:${PORT}      ║
║   健康检查: http://localhost:${PORT}/health  ║
╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;
