const express = require('express');
const router = express.Router();
const { sendMessage, resetChat } = require('../controllers/chatController');

// 发送消息
router.post('/', sendMessage);

// 重置对话
router.post('/reset', resetChat);

module.exports = router;
