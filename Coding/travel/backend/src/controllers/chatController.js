const { chat } = require('../services/glmService');

/**
 * 处理聊天消息
 */
async function sendMessage(req, res) {
  try {
    const { message, collectedInfo, conversationHistory = [] } = req.body;

    // 验证输入
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: '消息不能为空'
      });
    }

    // 调用Claude服务
    const response = await chat(message, conversationHistory, collectedInfo || {});

    // 返回响应
    res.json({
      reply: response.reply,
      extractedInfo: response.extractedInfo,
      conversationHistory: response.conversationHistory,
      chatComplete: response.chatComplete || false,
      summary: response.summary || null
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({
      error: error.message || '服务器内部错误'
    });
  }
}

/**
 * 重置对话
 */
function resetChat(req, res) {
  // 简单实现，返回初始状态
  res.json({
    message: '对话已重置',
    initialState: {
      collectedInfo: {
        destination: '越南',
        origin: '北京',
        duration: null,
        departureDate: null,
        travelers: null,
        budget: null,
        preferences: []
      },
      conversationHistory: []
    }
  });
}

module.exports = {
  sendMessage,
  resetChat,
};
