import axios from 'axios';

// 后端API基础URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 聊天API
export const chatApi = {
  // 发送消息
  sendMessage: async (message, collectedInfo, conversationHistory = []) => {
    const response = await apiClient.post('/chat', {
      message,
      collectedInfo,
      conversationHistory
    });
    return response.data;
  },

  // 重置对话
  resetChat: async () => {
    const response = await apiClient.post('/chat/reset');
    return response.data;
  },
};

// 行程API
export const itineraryApi = {
  // 生成行程
  generate: async (userInfo) => {
    const response = await apiClient.post('/itinerary/generate', { userInfo });
    return response.data;
  },

  // 格式化行程为文本
  format: async (itinerary) => {
    const response = await apiClient.post('/itinerary/format', { itinerary });
    return response.data;
  },
};

// 数据API
export const dataApi = {
  // 获取所有景点
  getAttractions: async () => {
    const response = await apiClient.get('/data/attractions');
    return response.data;
  },

  // 根据城市获取景点
  getAttractionsByCity: async (city) => {
    const response = await apiClient.get(`/data/attractions/city/${encodeURIComponent(city)}`);
    return response.data;
  },

  // 获取景点详情
  getAttractionById: async (id) => {
    const response = await apiClient.get(`/data/attractions/${id}`);
    return response.data;
  },

  // 获取所有美食
  getFood: async () => {
    const response = await apiClient.get('/data/food');
    return response.data;
  },

  // 获取热门美食
  getPopularFood: async () => {
    const response = await apiClient.get('/data/food/popular');
    return response.data;
  },

  // 搜索
  search: async (keyword) => {
    const response = await apiClient.get(`/data/search/${encodeURIComponent(keyword)}`);
    return response.data;
  },

  // 获取数据概览
  getOverview: async () => {
    const response = await apiClient.get('/data/overview');
    return response.data;
  },
};

export default apiClient;
