import React, { createContext, useContext, useState, useEffect } from 'react';
import { chatApi } from '../services/api';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: '你好！👋 我是你的AI旅行顾问小星，来自织女星系。我可以帮你规划越南之旅。你已经想好去越南了吗？还是想先了解一下？',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [collectedInfo, setCollectedInfo] = useState({
    destination: '越南',
    origin: '北京',
    duration: null,
    departureDate: null,
    travelers: null,
    budget: null,
    preferences: []
  });
  const [chatComplete, setChatComplete] = useState(false);
  const [summary, setSummary] = useState(null);

  const sendMessage = async (content) => {
    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // 显示加载状态
    setIsLoading(true);

    try {
      // 调用后端API
      const response = await chatApi.sendMessage(content, collectedInfo);

      // 添加AI回复
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

      // 更新收集到的信息
      if (response.extractedInfo) {
        setCollectedInfo(prev => ({
          ...prev,
          ...response.extractedInfo
        }));
      }

      // 更新对话状态
      setChatComplete(response.chatComplete || false);
      setSummary(response.summary || null);
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '抱歉，我遇到了一些问题。请稍后再试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([{
      id: 1,
      role: 'assistant',
      content: '你好！👋 我是你的AI旅行顾问小星，来自织女星系。我可以帮你规划越南之旅。你已经想好去越南了吗？还是想先了解一下？',
      timestamp: new Date()
    }]);
    setCollectedInfo({
      destination: '越南',
      origin: '北京',
      duration: null,
      departureDate: null,
      travelers: null,
      budget: null,
      preferences: []
    });
    setChatComplete(false);
    setSummary(null);
  };

  const updateCollectedInfo = (key, value) => {
    setCollectedInfo(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const value = {
    messages,
    isLoading,
    collectedInfo,
    chatComplete,
    summary,
    sendMessage,
    updateCollectedInfo,
    resetChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
