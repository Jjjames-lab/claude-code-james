/**
 * 对话状态管理器
 * 根据已收集的信息，决定下一个应该问什么
 */

// 必需收集的信息字段
const REQUIRED_FIELDS = [
  'duration',        // 旅行天数
  'departureDate',   // 出发日期
  'travelers',       // 旅行人数
  'budget',          // 预算
  'preferences'      // 偏好（至少一个）
];

/**
 * 检查是否收集完所有必需信息
 */
function isChatComplete(collectedInfo) {
  return REQUIRED_FIELDS.every(field => {
    if (field === 'preferences') {
      // 偏好至少要有一个
      return collectedInfo[field] && collectedInfo[field].length > 0;
    }
    return collectedInfo[field] !== null && collectedInfo[field] !== undefined;
  });
}

/**
 * 获取缺失的信息
 */
function getMissingFields(collectedInfo) {
  return REQUIRED_FIELDS.filter(field => {
    if (field === 'preferences') {
      return !collectedInfo[field] || collectedInfo[field].length === 0;
    }
    return !collectedInfo[field];
  });
}

/**
 * 根据缺失信息，生成下一个话题建议
 */
function getNextTopic(collectedInfo) {
  const missing = getMissingFields(collectedInfo);

  if (missing.length === 0) {
    return {
      complete: true,
      message: '所有信息已收集完毕，可以生成行程了'
    };
  }

  // 找出最重要的缺失信息
  const priority = {
    'duration': 1,        // 最重要：天数
    'departureDate': 2,   // 出发日期
    'travelers': 3,       // 人数
    'budget': 4,          // 预算
    'preferences': 5      // 偏好
  };

  missing.sort((a, b) => priority[a] - priority[b]);
  const nextField = missing[0];

  return {
    complete: false,
    field: nextField,
    suggestions: getFieldSuggestions(nextField, collectedInfo)
  };
}

/**
 * 根据字段生成话题建议
 */
function getFieldSuggestions(field, collectedInfo) {
  const suggestions = {
    'duration': {
      topics: [
        '你计划玩多少天？',
        '这次旅行打算几天？',
      ],
      context: collectedInfo.departureDate
        ? `你提到${collectedInfo.departureDate}出发，那计划几天呢？`
        : '你大概计划玩几天？'
    },

    'departureDate': {
      topics: [
        '大概什么时候出发？',
        '计划几月份去呢？',
      ],
      context: collectedInfo.duration
        ? `你计划${collectedInfo.duration}，那什么时候出发呢？`
        : '你大概什么时候想去？'
    },

    'travelers': {
      topics: [
        '这次是你一个人去，还是和朋友/家人一起？',
        '几个人去呢？',
      ],
      context: '这次有同伴吗？'
    },

    'budget': {
      topics: [
        '大概的预算范围是多少？',
        '人均预算大概多少？',
      ],
      context: collectedInfo.travelers && collectedInfo.duration
        ? `根据${collectedInfo.travelers}、${collectedInfo.duration}的行程，你的预算大概是多少？`
        : '你的预算范围大概是多少？'
    },

    'preferences': {
      topics: [
        '你最喜欢什么样的旅行方式？',
        '旅行中你最在意什么？',
      ],
      context: '你比较偏爱什么类型的活动？比如美食、文化、自然风光...'
    }
  };

  return suggestions[field] || {};
}

/**
 * 生成对话引导提示（添加到System Prompt中）
 */
function generateGuidancePrompt(collectedInfo) {
  const next = getNextTopic(collectedInfo);

  if (next.complete) {
    return `
【对话状态】
你已经收集了所有必需信息，现在可以：
1. 总结一下用户的需求
2. 询问是否需要调整
3. 告诉用户即将生成行程

【需要总结的信息】
${formatSummary(collectedInfo)}
`;
  }

  return `
【对话状态】
当前还缺少信息：${next.field}

【下一步建议话题】
- ${next.suggestions.context}
- 不要直接问，要自然地融入对话
- 可以根据用户之前的回答来引导

【不要一次性问多个问题】
- 一次只问一个问题
- 问题要自然，不要像问卷调查
`;
}

/**
 * 格式化信息摘要
 */
function formatSummary(collectedInfo) {
  const lines = [];
  lines.push(`目的地：${collectedInfo.destination}`);
  lines.push(`出发地：${collectedInfo.origin}`);
  if (collectedInfo.departureDate) lines.push(`出发时间：${collectedInfo.departureDate}`);
  if (collectedInfo.duration) lines.push(`旅行天数：${collectedInfo.duration}`);
  if (collectedInfo.travelers) lines.push(`人数：${collectedInfo.travelers}`);
  if (collectedInfo.budget) lines.push(`预算：${collectedInfo.budget}`);
  if (collectedInfo.preferences && collectedInfo.preferences.length > 0) {
    lines.push(`偏好：${collectedInfo.preferences.join('、')}`);
  }
  return lines.join('\n');
}

module.exports = {
  isChatComplete,
  getMissingFields,
  getNextTopic,
  generateGuidancePrompt,
  formatSummary
};
