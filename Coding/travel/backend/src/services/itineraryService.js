const glmService = require('./glmService');
const dataService = require('./dataService');

/**
 * 行程生成服务
 * 核心理念：不是模板拼接，而是个性化推理
 */
class ItineraryService {
  /**
   * 生成个性化行程
   * @param {Object} userInfo - 用户信息
   * @param {number} userInfo.duration - 旅行天数
   * @param {string} userInfo.departureDate - 出发日期
   * @param {number} userInfo.travelers - 人数
   * @param {number} userInfo.budget - 预算（人均）
   * @param {Array} userInfo.preferences - 偏好列表
   * @returns {Promise<Object>} 生成的行程
   */
  async generateItinerary(userInfo) {
    try {
      console.log('开始生成行程，用户信息：', userInfo);

      // 1. 获取旅行数据
      const [attractions, food] = await Promise.all([
        dataService.getAttractions(),
        dataService.getFood()
      ]);

      console.log(`已加载 ${attractions.length} 个景点，${food.length} 个美食`);

      // 2. 构建行程生成的Prompt
      const itineraryPrompt = this.buildItineraryPrompt(userInfo, attractions, food);

      // 3. 调用GLM生成行程
      const aiResponse = await glmService.callWithReasoning(itineraryPrompt);

      // 4. 解析AI返回的行程
      const itinerary = this.parseItineraryResponse(aiResponse, userInfo);

      console.log('行程生成成功');
      return itinerary;

    } catch (error) {
      console.error('生成行程失败：', error);
      throw new Error('生成行程失败，请稍后重试');
    }
  }

  /**
   * 构建行程生成的Prompt
   */
  buildItineraryPrompt(userInfo, attractions, food) {
    const { duration, departureDate, travelers, budget, preferences } = userInfo;

    return `你是一个专业的旅行规划师，正在为用户规划越南旅行行程。

【用户信息】
- 旅行天数：${duration}天
- 出发日期：${departureDate}
- 旅行人数：${travelers}人
- 人均预算：${budget}元（不含机票）
- 旅行偏好：${preferences.join('、')}

【可用数据】
景点数据（共${attractions.length}个）：
${JSON.stringify(attractions, null, 2)}

美食数据（共${food.length}个）：
${JSON.stringify(food, null, 2)}

【任务】
请根据用户信息和可用数据，生成一个${duration}天的个性化旅行行程。

【要求】
1. **个性化推理** - 不要使用模板，要根据用户偏好进行推理
   - 如果用户喜欢"美食"，每天安排1-2个当地特色美食体验
   - 如果用户喜欢"文化"，多安排历史景点和博物馆
   - 如果用户喜欢"自然"，多安排公园、湖泊等自然景观
   - 根据人数调整：情侣可以安排浪漫景点，家庭要考虑儿童友好

2. **节奏安排** - 根据用户偏好控制每日活动数量
   - 偏好中有"放松"：每天2-3个活动，留充足休息时间
   - 偏好中有"充实"：每天3-4个活动，充分利用时间
   - 默认：每天2-3个活动

3. **预算考虑** - 人均${budget}元在越南是舒适型预算
   - 住宿：200-300元/晚（${travelers}人合住，人均100-150元）
   - 餐饮：人均80-120元/天（包含当地特色餐厅）
   - 景点：大部分免费或很便宜
   - 交通：城市间交通约200-500元

4. **每日安排格式】
   - 上午（9:00-12:00）：1个主要活动
   - 中午（12:00-13:30）：推荐当地美食
   - 下午（14:00-17:00）：1个活动或休息
   - 晚上（18:00-20:00）：晚餐推荐
   - 晚上（20:00后）：可选夜生活或休息

【输出格式】
请严格按照以下JSON格式输出行程：

{
  "overview": {
    "total_days": ${duration},
    "cities": ["河内"],
    "budget_breakdown": {
      "accommodation": "估算金额",
      "food": "估算金额",
      "transportation": "估算金额",
      "activities": "估算金额",
      "total": "总金额"
    },
    "highlights": ["行程亮点1", "行程亮点2", "行程亮点3"],
    "tips": ["重要提示1", "重要提示2"]
  },
  "daily_itinerary": [
    {
      "day": 1,
      "date": "具体日期（根据出发日期计算）",
      "theme": "今日主题",
      "activities": [
        {
          "time": "09:00-12:00",
          "type": "景点/美食/休息",
          "name": "活动名称",
          "description": "详细描述",
          "location": "具体位置",
          "cost": "费用估算",
          "tips": "实用建议"
        }
      ]
    }
  ]
}

注意事项：
1. 必须返回有效的JSON格式
2. 景点和美食名称必须从提供的【可用数据】中选择
3. 每日活动要具体，不能太笼统
4. 费用估算要合理，符合用户预算
5. 根据出发日期计算具体日期
6. 日期计算示例：如果2月16日出发，第1天就是2月16日

现在请生成这个${duration}天的越南旅行行程：`;
  }

  /**
   * 解析AI返回的行程
   */
  parseItineraryResponse(aiResponse, userInfo) {
    try {
      // 提取JSON部分
      let jsonStr = aiResponse;

      // 尝试提取 ```json ... ``` 代码块
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      // 尝试提取 ``` ... ``` 代码块
      const codeMatch = aiResponse.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        jsonStr = codeMatch[1];
      }

      // 解析JSON
      const itinerary = JSON.parse(jsonStr);

      // 验证基本结构
      if (!itinerary.overview || !itinerary.daily_itinerary) {
        throw new Error('行程格式不完整');
      }

      // 添加元数据
      itinerary.metadata = {
        generated_at: new Date().toISOString(),
        user_info: userInfo,
        version: '1.0'
      };

      return itinerary;

    } catch (error) {
      console.error('解析行程响应失败：', error);
      console.error('AI原始响应：', aiResponse);

      // 返回一个默认的错误响应
      return {
        error: true,
        message: '行程生成失败，请重试',
        suggestion: '您可以尝试调整需求后重新生成'
      };
    }
  }

  /**
   * 格式化行程为用户友好的文本
   */
  formatItineraryAsText(itinerary) {
    if (itinerary.error) {
      return `❌ ${itinerary.message}\n\n💡 ${itinerary.suggestion}`;
    }

    let text = '🎉 行程生成成功！\n\n';

    // 概览
    text += '📋 行程概览\n';
    text += `📍 城市：${itinerary.overview.cities.join('、')}\n`;
    text += `⏰ 天数：${itinerary.overview.total_days}天\n`;
    text += `💰 预算估算：人均${itinerary.overview.budget_breakdown.total}\n\n`;

    // 亮点
    text += '✨ 行程亮点\n';
    itinerary.overview.highlights.forEach((highlight, index) => {
      text += `${index + 1}. ${highlight}\n`;
    });
    text += '\n';

    // 每日行程
    text += '📅 每日行程\n\n';
    itinerary.daily_itinerary.forEach((day, index) => {
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `第${day.day}天：${day.date}\n`;
      text += `主题：${day.theme}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      day.activities.forEach(activity => {
        text += `🕐 ${activity.time}\n`;
        text += `📍 ${activity.type}：${activity.name}\n`;
        text += `   ${activity.description}\n`;
        if (activity.location) {
          text += `   📍 位置：${activity.location}\n`;
        }
        if (activity.cost) {
          text += `   💰 费用：${activity.cost}\n`;
        }
        if (activity.tips) {
          text += `   💡 建议：${activity.tips}\n`;
        }
        text += '\n';
      });
    });

    // 重要提示
    if (itinerary.overview.tips && itinerary.overview.tips.length > 0) {
      text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      text += '⚠️ 重要提示\n';
      itinerary.overview.tips.forEach((tip, index) => {
        text += `${index + 1}. ${tip}\n`;
      });
    }

    return text;
  }
}

module.exports = new ItineraryService();
