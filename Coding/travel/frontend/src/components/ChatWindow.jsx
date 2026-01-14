import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { itineraryApi } from '../services/api';

const ChatWindow = () => {
  const { messages, isLoading, sendMessage, chatComplete, summary, resetChat, collectedInfo } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理发送消息
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  // 处理生成行程
  const handleGenerateItinerary = async () => {
    if (!collectedInfo || isGenerating) return;

    // 调试：查看当前收集的信息
    console.log('📊 当前收集的信息：', collectedInfo);
    console.log('✅ 对话是否完成：', chatComplete);

    setIsGenerating(true);
    try {
      // 调用行程生成API
      const response = await itineraryApi.generate(collectedInfo);

      if (response.success) {
        setGeneratedItinerary(response.data);

        // 添加行程消息到对话
        const itineraryText = await itineraryApi.format(response.data);
        const itineraryMessage = {
          id: Date.now(),
          role: 'assistant',
          content: itineraryText.text,
          timestamp: new Date().toISOString()
        };

        // 这里需要通过context来添加消息，暂时先setGeneratedItinerary
        console.log('行程生成成功：', response.data);
      } else {
        alert('生成失败：' + response.error);
      }
    } catch (error) {
      console.error('生成行程失败：', error);
      alert('生成行程失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 消息列表区域 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {/* AI头像 */}
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✨</span>
                  <span className="text-sm font-medium text-gray-600">小星</span>
                </div>
              )}

              {/* 消息内容 */}
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>

              {/* 时间戳 */}
              <div
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}

        {/* 加载动画 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* 生成的行程显示 */}
        {generatedItinerary && (
          <div className="mx-auto mb-4 bg-white border-2 border-primary-200 rounded-2xl p-6 max-w-2xl shadow-lg">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🌍</div>
              <h3 className="text-xl font-bold text-primary-800 mb-1">你的专属越南行程</h3>
              <p className="text-sm text-gray-600">
                {generatedItinerary.overview?.total_days}天之旅 · {generatedItinerary.overview?.cities?.join('、')}
              </p>
            </div>

            {/* 预算概览 */}
            {generatedItinerary.overview?.budget_breakdown && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm font-bold text-gray-700 mb-2">💰 预算估算</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(generatedItinerary.overview.budget_breakdown).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">
                        {key === 'accommodation' && '住宿'}
                        {key === 'food' && '餐饮'}
                        {key === 'transportation' && '交通'}
                        {key === 'activities' && '活动'}
                        {key === 'total' && '总计'}
                      </span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 行程亮点 */}
            {generatedItinerary.overview?.highlights && (
              <div className="mb-4">
                <div className="text-sm font-bold text-gray-700 mb-2">✨ 行程亮点</div>
                <ul className="space-y-1">
                  {generatedItinerary.overview.highlights.map((highlight, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start">
                      <span className="text-primary-500 mr-2">•</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 每日行程 */}
            {generatedItinerary.daily_itinerary && (
              <div className="space-y-3 mb-4">
                {generatedItinerary.daily_itinerary.map((day, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-sm text-primary-700">
                        第{day.day}天：{day.date}
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {day.theme}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {day.activities?.map((activity, actIndex) => (
                        <div key={actIndex} className="text-xs border-l-2 border-primary-300 pl-2">
                          <div className="text-gray-500 mb-0.5">🕐 {activity.time}</div>
                          <div className="font-medium text-gray-800">{activity.name}</div>
                          {activity.description && (
                            <div className="text-gray-600 mt-0.5">{activity.description}</div>
                          )}
                          {activity.tips && (
                            <div className="text-gray-500 mt-1 italic">💡 {activity.tips}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 重要提示 */}
            {generatedItinerary.overview?.tips && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="text-sm font-bold text-yellow-800 mb-2">⚠️ 重要提示</div>
                <ul className="space-y-1">
                  {generatedItinerary.overview.tips.map((tip, index) => (
                    <li key={index} className="text-xs text-yellow-700 flex items-start">
                      <span className="mr-2">{index + 1}.</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setGeneratedItinerary(null);
                  resetChat();
                }}
                className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-600 transition-colors text-sm"
              >
                重新规划
              </button>
              <button
                onClick={() => alert('保存功能即将推出！')}
                className="flex-1 border border-primary-500 text-primary-600 py-2 px-4 rounded-lg font-medium hover:bg-primary-50 transition-colors text-sm"
              >
                保存行程
              </button>
            </div>
          </div>
        )}

        {/* 对话完成提示 */}
        {chatComplete && !generatedItinerary && (
          <div className="mx-auto mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 max-w-md">
            <div className="text-center">
              <div className="text-2xl mb-2">🎉</div>
              <h3 className="text-lg font-bold text-green-800 mb-2">信息收集完成！</h3>
              <p className="text-sm text-green-700 mb-3">
                我已经了解你的需求了，正在为你生成行程...
              </p>
              {summary && (
                <div className="bg-white rounded-lg p-3 mb-3 text-xs text-left">
                  <div className="font-bold text-gray-700 mb-1">你的旅行信息：</div>
                  <div className="text-gray-600 whitespace-pre-line">{summary}</div>
                </div>
              )}
              <button
                onClick={handleGenerateItinerary}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? '生成中... ⏳' : '生成专属行程 ✨'}
              </button>
              <button
                onClick={resetChat}
                className="w-full mt-2 text-sm text-green-600 hover:text-green-800 underline"
              >
                重新开始
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入消息..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            发送
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Enter键发送，Shift+Enter换行
        </p>
      </div>
    </div>
  );
};

export default ChatWindow;
