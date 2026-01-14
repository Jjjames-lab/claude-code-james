const fs = require('fs').promises;
const path = require('path');

/**
 * 数据服务 - 读取越南旅行数据
 */
class DataService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data/output');
    this.cache = {};
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 读取JSON文件
   */
  async readJsonFile(filename) {
    try {
      const filepath = path.join(this.dataDir, filename);
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`读取文件失败: ${filename}`, error);
      return null;
    }
  }

  /**
   * 获取所有景点
   */
  async getAttractions() {
    const cacheKey = 'attractions';

    // 检查缓存
    if (this.isCacheValid(cacheKey)) {
      return this.cache[cacheKey].data;
    }

    // 读取数据
    const data = await this.readJsonFile('attractions.json');

    if (data) {
      // 更新缓存
      this.updateCache(cacheKey, data);
    }

    return data || [];
  }

  /**
   * 根据城市获取景点
   */
  async getAttractionsByCity(city) {
    const attractions = await this.getAttractions();
    return attractions.filter(a => a.city === city);
  }

  /**
   * 根据类别获取景点
   */
  async getAttractionsByCategory(category) {
    const attractions = await this.getAttractions();
    return attractions.filter(a => a.category.includes(category));
  }

  /**
   * 根据ID获取景点
   */
  async getAttractionById(id) {
    const attractions = await this.getAttractions();
    return attractions.find(a => a.id === id);
  }

  /**
   * 获取所有美食
   */
  async getFood() {
    const cacheKey = 'food';

    if (this.isCacheValid(cacheKey)) {
      return this.cache[cacheKey].data;
    }

    const data = await this.readJsonFile('food.json');

    if (data) {
      this.updateCache(cacheKey, data);
    }

    return data || [];
  }

  /**
   * 根据城市获取美食
   */
  async getFoodByCity(city) {
    const food = await this.getFood();
    return food.filter(f => !f.city || f.city === '越南' || f.city === city);
  }

  /**
   * 获取热门美食
   */
  async getPopularFood() {
    const food = await this.getFood();
    return food.filter(f => f.must_try);
  }

  /**
   * 搜索景点和美食
   */
  async search(keyword) {
    const [attractions, food] = await Promise.all([
      this.getAttractions(),
      this.getFood()
    ]);

    const results = {
      attractions: attractions.filter(a =>
        a.name.includes(keyword) ||
        a.description.includes(keyword) ||
        a.tags.some(t => t.includes(keyword))
      ),
      food: food.filter(f =>
        f.name.includes(keyword) ||
        f.description.includes(keyword)
      )
    };

    return results;
  }

  /**
   * 更新缓存
   */
  updateCache(key, data) {
    this.cache[key] = {
      data,
      timestamp: Date.now()
    };
  }

  /**
   * 检查缓存是否有效
   */
  isCacheValid(key) {
    const cached = this.cache[key];
    if (!cached) return false;

    const now = Date.now();
    return (now - cached.timestamp) < this.cacheTimeout;
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache = {};
  }
}

// 导出单例
module.exports = new DataService();
