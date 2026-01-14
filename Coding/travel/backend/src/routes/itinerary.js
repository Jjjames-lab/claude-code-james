const express = require('express');
const router = express.Router();
const itineraryService = require('../services/itineraryService');

/**
 * 生成行程
 */
router.post('/generate', async (req, res) => {
  try {
    const { userInfo } = req.body;

    // 验证必需字段
    if (!userInfo) {
      return res.status(400).json({
        success: false,
        error: '缺少用户信息'
      });
    }

    // 验证用户信息完整性
    const requiredFields = ['duration', 'departureDate', 'travelers', 'budget', 'preferences'];
    const missingFields = requiredFields.filter(field => !userInfo[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `信息不完整，缺少：${missingFields.join(', ')}`
      });
    }

    console.log('收到行程生成请求：', userInfo);

    // 生成行程
    const itinerary = await itineraryService.generateItinerary(userInfo);

    // 返回结果
    res.json({
      success: true,
      data: itinerary
    });

  } catch (error) {
    console.error('生成行程失败：', error);
    res.status(500).json({
      success: false,
      error: error.message || '生成行程失败'
    });
  }
});

/**
 * 格式化行程为文本
 */
router.post('/format', async (req, res) => {
  try {
    const { itinerary } = req.body;

    if (!itinerary) {
      return res.status(400).json({
        success: false,
        error: '缺少行程数据'
      });
    }

    const text = itineraryService.formatItineraryAsText(itinerary);

    res.json({
      success: true,
      text
    });

  } catch (error) {
    console.error('格式化行程失败：', error);
    res.status(500).json({
      success: false,
      error: '格式化行程失败'
    });
  }
});

module.exports = router;
