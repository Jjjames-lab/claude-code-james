const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

/**
 * 获取所有景点
 */
router.get('/attractions', async (req, res) => {
  try {
    const attractions = await dataService.getAttractions();
    res.json({
      success: true,
      count: attractions.length,
      data: attractions
    });
  } catch (error) {
    console.error('获取景点失败:', error);
    res.status(500).json({
      success: false,
      error: '获取景点失败'
    });
  }
});

/**
 * 根据城市获取景点
 */
router.get('/attractions/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const attractions = await dataService.getAttractionsByCity(city);
    res.json({
      success: true,
      count: attractions.length,
      city,
      data: attractions
    });
  } catch (error) {
    console.error('获取景点失败:', error);
    res.status(500).json({
      success: false,
      error: '获取景点失败'
    });
  }
});

/**
 * 根据ID获取景点
 */
router.get('/attractions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const attraction = await dataService.getAttractionById(id);

    if (!attraction) {
      return res.status(404).json({
        success: false,
        error: '景点不存在'
      });
    }

    res.json({
      success: true,
      data: attraction
    });
  } catch (error) {
    console.error('获取景点失败:', error);
    res.status(500).json({
      success: false,
      error: '获取景点失败'
    });
  }
});

/**
 * 获取所有美食
 */
router.get('/food', async (req, res) => {
  try {
    const food = await dataService.getFood();
    res.json({
      success: true,
      count: food.length,
      data: food
    });
  } catch (error) {
    console.error('获取美食失败:', error);
    res.status(500).json({
      success: false,
      error: '获取美食失败'
    });
  }
});

/**
 * 获取热门美食
 */
router.get('/food/popular', async (req, res) => {
  try {
    const food = await dataService.getPopularFood();
    res.json({
      success: true,
      count: food.length,
      data: food
    });
  } catch (error) {
    console.error('获取美食失败:', error);
    res.status(500).json({
      success: false,
      error: '获取美食失败'
    });
  }
});

/**
 * 搜索景点和美食
 */
router.get('/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const results = await dataService.search(keyword);

    res.json({
      success: true,
      keyword,
      results: {
        attractions: results.attractions.length,
        food: results.food.length
      },
      data: results
    });
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({
      success: false,
      error: '搜索失败'
    });
  }
});

/**
 * 获取越南数据概览
 */
router.get('/overview', async (req, res) => {
  try {
    const [attractions, food] = await Promise.all([
      dataService.getAttractions(),
      dataService.getFood()
    ]);

    // 统计数据
    const cities = [...new Set(attractions.map(a => a.city))];
    const categories = [...new Set(attractions.flatMap(a => a.category))];

    res.json({
      success: true,
      overview: {
        total_attractions: attractions.length,
        total_food: food.length,
        cities: cities,
        categories: categories
      }
    });
  } catch (error) {
    console.error('获取概览失败:', error);
    res.status(500).json({
      success: false,
      error: '获取概览失败'
    });
  }
});

module.exports = router;
