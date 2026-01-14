import React from 'react';
import { useChat } from '../context/ChatContext';

const Sidebar = () => {
  const { collectedInfo } = useChat();

  // 信息项组件
  const InfoItem = ({ icon, label, value, status }) => {
    return (
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-400'}`}>
            {value || '待确认'}
          </span>
          {status === 'confirmed' && (
            <span className="text-green-500 text-sm">✓</span>
          )}
          {status === 'pending' && (
            <span className="text-yellow-500 text-sm">⏳</span>
          )}
        </div>
      </div>
    );
  };

  // 标签组件
  const Tag = ({ text, onRemove }) => {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
        {text}
        {onRemove && (
          <button
            onClick={onRemove}
            className="hover:text-primary-900 focus:outline-none"
          >
            ×
          </button>
        )}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 标题 */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">旅行信息</h2>
        <p className="text-xs text-gray-500 mt-1">我会逐步了解你的需求</p>
      </div>

      {/* 信息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <InfoItem
          icon="📍"
          label="出发地"
          value={collectedInfo.origin}
          status="confirmed"
        />

        <InfoItem
          icon="🎯"
          label="目的地"
          value={collectedInfo.destination}
          status="confirmed"
        />

        <InfoItem
          icon="📅"
          label="旅行天数"
          value={collectedInfo.duration ? `${collectedInfo.duration}天` : null}
          status={collectedInfo.duration ? 'confirmed' : 'pending'}
        />

        <InfoItem
          icon="📆"
          label="出发日期"
          value={collectedInfo.departureDate}
          status={collectedInfo.departureDate ? 'confirmed' : 'pending'}
        />

        <InfoItem
          icon="👥"
          label="旅行人数"
          value={collectedInfo.travelers}
          status={collectedInfo.travelers ? 'confirmed' : 'pending'}
        />

        <InfoItem
          icon="💰"
          label="预算范围"
          value={collectedInfo.budget}
          status={collectedInfo.budget ? 'confirmed' : 'pending'}
        />

        {/* 偏好标签 */}
        {collectedInfo.preferences && collectedInfo.preferences.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎨</span>
              <span className="text-sm font-medium text-gray-700">旅行偏好</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {collectedInfo.preferences.map((pref, index) => (
                <Tag key={index} text={pref} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          ✨ 随时可以在对话中修改这些信息
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
