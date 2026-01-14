const axios = require('axios');
const config = require('../config/config');
const { generateGuidancePrompt, isChatComplete, formatSummary } = require('./dialogueManager');

// GLM API配置
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

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

【重要 - 智能推理】
你必须能够从用户的回答中**推理**出信息，而不是只会直接提取：

1. **计算天数**：
   - 用户说"2月16号出发，2月24号回来" → 你要计算：24-16=8天
   - 用户说"下周3出发，玩一周" → 你要计算：一周=7天
   - 用户说"端午假期" → 你要了解：3天

2. **推断人数**：
   - 用户说"我和我女朋友" → 推断：2人
   - 用户说"我们一家三口" → 推断：3人
   - 用户说"我和朋友们" → 需要问具体几个人
   - 用户说"独自旅行" → 推断：1人

3. **理解预算**：
   - 用户说"大概5000左右" → 记录：预算5000元
   - 用户说"不要太贵" → 需要进一步询问具体预算

请自然地对话，逐步了解用户需求。
记住：不是问卷式聊天，而是朋友式交流。
记住：要会推理！不要用户说什么你就记什么，要会计算！`;

/**
 * 调用GLM API进行对话
 * @param {string} userMessage - 用户消息
 * @param {Array} conversationHistory - 对话历史
 * @param {Object} collectedInfo - 已收集的信息
 * @returns {Promise<Object>} - AI回复和提取的信息
 */
async function chat(userMessage, conversationHistory, collectedInfo) {
  try {
    // 添加当前已收集信息的上下文
    const contextInfo = buildContextInfo(collectedInfo);

    // 生成对话引导提示
    const guidancePrompt = generateGuidancePrompt(collectedInfo);

    // 构建消息列表
    const messages = [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\n${guidancePrompt}\n\n【当前已了解的信息】\n${contextInfo}`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage
      }
    ];

    // 调用GLM API
    const response = await axios.post(
      GLM_API_URL,
      {
        model: 'glm-4-flash',  // 使用GLM-4-Flash模型（速度快）
        messages: messages,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1024,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.glmApiKey}`
        }
      }
    );

    // 提取AI回复
    const reply = response.data.choices[0].message.content;

    // 使用AI来提取信息（更智能）
    const extractedInfo = await extractInfoWithAI(userMessage, reply, collectedInfo);

    // 检查对话是否完成（更新后的信息）
    const updatedCollectedInfo = { ...collectedInfo, ...extractedInfo };
    const complete = isChatComplete(updatedCollectedInfo);

    return {
      reply,
      extractedInfo,
      conversationHistory: [
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage
        },
        {
          role: 'assistant',
          content: reply
        }
      ],
      // 新增：对话状态
      chatComplete: complete,
      summary: complete ? formatSummary(updatedCollectedInfo) : null
    };
  } catch (error) {
    console.error('GLM API调用失败:', error.response?.data || error.message);
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
 * 使用AI来智能提取信息
 */
async function extractInfoWithAI(userMessage, aiReply, collectedInfo) {
  const extracted = {};

  // 构建提取提示词
  const extractPrompt = `你是一个信息提取专家。从用户的回答中提取旅行信息。

用户说：${userMessage}

已收集的信息：
${JSON.stringify(collectedInfo, null, 2)}

请提取以下信息（如果提到的话）：
1. duration - 旅行天数（注意计算！如果用户说"2月16到2月24"，你要计算8天）
2. departureDate - 出发日期（月份或具体日期）
3. travelers - 人数（注意推断！"我和女朋友"=2人，"独自"=1人）
4. budget - 预算
5. preferences - 偏好（数组）

只返回JSON格式，不要其他文字：
{
  "duration": "8天" | null,
  "departureDate": "2月16日" | null,
  "travelers": "2人" | null,
  "budget": "5000元" | null,
  "preferences": ["美食", "文化"] | []
}`;

  try {
    // 调用GLM API进行信息提取
    const response = await axios.post(
      GLM_API_URL,
      {
        model: 'glm-4-flash',
        messages: [
          {
            role: 'system',
            content: '你是一个信息提取专家，只返回JSON格式，不要其他文字。'
          },
          {
            role: 'user',
            content: extractPrompt
          }
        ],
        temperature: 0.1,  // 低温度，更确定性的输出
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.glmApiKey}`
        }
      }
    );

    // 解析AI返回的JSON
    const extractedText = response.data.choices[0].message.content;
    const extractedData = JSON.parse(extractedText);

    // 合并提取的信息
    Object.keys(extractedData).forEach(key => {
      if (extractedData[key] && !collectedInfo[key]) {
        extracted[key] = extractedData[key];
      }
    });

    return extracted;
  } catch (error) {
    // 如果AI提取失败，回退到简单的正则匹配
    console.error('AI信息提取失败，使用简单匹配:', error.message);
    return extractInfoSimple(userMessage, collectedInfo);
  }
}

/**
 * 简单的信息提取（备用方案）
 */
function extractInfoSimple(message, collectedInfo) {
  const extracted = {};

  // 提取天数（简单的正则）
  const durationMatch = message.match(/(\d+)\s*天/);
  if (durationMatch && !collectedInfo.duration) {
    extracted.duration = `${durationMatch[1]}天`;
  }

  // 提取月份
  const monthMatch = message.match(/(\d+)月/);
  if (monthMatch && !collectedInfo.departureDate) {
    extracted.departureDate = `${monthMatch[1]}月`;
  }

  // 提取人数
  const peopleMatch = message.match(/(\d+)\s*人/);
  if (peopleMatch && !collectedInfo.travelers) {
    extracted.travelers = `${peopleMatch[1]}人`;
  }

  return extracted;
}

module.exports = {
  chat,
};
