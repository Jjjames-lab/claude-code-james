const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config/config');

// 初始化Anthropic客户端
const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey,
});

// AI人设System Prompt
const SYSTEM_PROMPT = `你是小星，一个来自织女星系的外星人旅行顾问。

【基本信息】
- 你在地球观察了3年，正在帮助人类探索他们的星球
- 你对人类充满好奇和善意
- 你有丰富的旅行知识，但你不炫耀、不说教

【核心性格】
1. 平等和包容 - 你尊重每个生物，不分物种、性别、国籍
2. 理解者 - 你试图理解用户，而不是定义用户
3. 陪伴者 - 你和用户一起探索，而不是替用户做决定

【说话风格】
- 温暖但不过度热情
- 友好但保持专业
- 偶尔用"外星人视角"看地球旅行
- 用比喻和故事，不说教
- 不说"你应该"，而说"你可以"

【语言禁忌】
❌ 不评判："你这样不对..."
❌ 不定义："你是个XX型的人..."
❌ 不炫耀："我作为AI..."
❌ 不强迫："你应该..."

【推荐表达】
✅ 建议："你可以考虑..."
✅ 理解："我理解你的..."
✅ 合作："我们一起来..."
✅ 赞美："你这个想法很好..."

【价值观】
- 世界是平等的属于每一个生物
- 不给人贴标签，不定义人
- 尊重用户的自由意志
- 每个旅行者都是宇宙探索者

【当前任务】
帮助用户规划越南之旅（出发地：北京）

【需要收集的信息】
- 旅行时间（天数）
- 出发日期（月份）
- 旅行人数及关系
- 预算范围
- 旅行偏好（节奏、活动类型、禁忌等）

请自然地对话，逐步了解用户需求。
记住：不是问卷式聊天，而是朋友式交流。

【重要】每次回复后，请在回复的JSON字段中标记提取到的新信息（如果有）。`;

/**
 * 调用Claude API进行对话
 * @param {string} userMessage - 用户消息
 * @param {Array} conversationHistory - 对话历史
 * @param {Object} collectedInfo - 已收集的信息
 * @returns {Promise<Object>} - AI回复和提取的信息
 */
async function chat(userMessage, conversationHistory, collectedInfo) {
  try {
    // 构建消息列表
    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage
      }
    ];

    // 添加当前已收集信息的上下文
    const contextInfo = buildContextInfo(collectedInfo);

    // 调用Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: `${SYSTEM_PROMPT}\n\n【当前已了解的信息】\n${contextInfo}`,
      messages: messages,
    });

    // 提取AI回复
    const reply = response.content[0].text;

    // 尝试从回复中提取信息
    const extractedInfo = extractInfoFromMessage(reply, collectedInfo);

    return {
      reply,
      extractedInfo,
      conversationHistory: [
        ...messages,
      {
        role: 'assistant',
        content: reply
      }]
    };
  } catch (error) {
    console.error('Claude API调用失败:', error);
    throw new Error('AI服务暂时不可用，请稍后再试');
  }
}

/**
 * 构建上下文信息
 */
function buildContextInfo(collectedInfo) {
  const parts = [];

  if (collectedInfo.destination) parts.push(`目的地: ${collectedInfo.destination}`);
  if (collectedInfo.origin) parts.push(`出发地: ${collectedInfo.origin}`);
  if (collectedInfo.duration) parts.push(`天数: ${collectedInfo.duration}`);
  if (collectedInfo.departureDate) parts.push(`出发日期: ${collectedInfo.departureDate}`);
  if (collectedInfo.travelers) parts.push(`人数: ${collectedInfo.travelers}`);
  if (collectedInfo.budget) parts.push(`预算: ${collectedInfo.budget}`);
  if (collectedInfo.preferences && collectedInfo.preferences.length > 0) {
    parts.push(`偏好: ${collectedInfo.preferences.join(', ')}`);
  }

  return parts.length > 0 ? parts.join('\n') : '暂无信息';
}

/**
 * 从AI回复中提取信息（简单版本，后续可以优化）
 */
function extractInfoFromMessage(reply, collectedInfo) {
  const extracted = {};

  // 简单的关键词匹配（后续可以改用AI提取）
  // 提取天数
  const durationMatch = reply.match(/(\d+)\s*天/);
  if (durationMatch && !collectedInfo.duration) {
    extracted.duration = `${durationMatch[1]}天`;
  }

  // 提取月份
  const monthMatch = reply.match(/(\d+)月/);
  if (monthMatch && !collectedInfo.departureDate) {
    extracted.departureDate = `${monthMatch[1]}月`;
  }

  // 提取人数
  const peopleMatch = reply.match(/(\d+)\s*人/);
  if (peopleMatch && !collectedInfo.travelers) {
    extracted.travelers = `${peopleMatch[1]}人`;
  }

  return extracted;
}

module.exports = {
  chat,
};
