import { useState } from 'react';

// ==================== 类型定义 ====================

interface PodcastCardProps {
  // 显示模式：simple（简洁） | full（完整）
  mode?: 'simple' | 'full';

  // 播客信息（simple 模式）
  podcastName?: string;
  hostName?: string;

  // 单集信息（full 模式）
  episodeId?: string;
  episodeTitle?: string;
  audioUrl?: string;
  duration?: number;
  coverImage?: string;
  showNotes?: string;

  // 交互事件
  onClick?: () => void;
  onStartTranscription?: () => void;

  // 状态
  isTranscribing?: boolean;
  transcribingProgress?: {
    stage: string;
    message: string;
    progress?: number;
  };

  // 是否可点击（视觉反馈）
  clickable?: boolean;
}

// ==================== 组件实现 ====================

export const PodcastCard = ({
  mode = 'full',
  podcastName,
  hostName,
  episodeId,
  episodeTitle,
  audioUrl,
  duration,
  coverImage,
  showNotes,
  onClick,
  onStartTranscription,
  isTranscribing = false,
  transcribingProgress,
  clickable = true,
}: PodcastCardProps) => {
  // ==================== Simple 模式：简洁显示 ====================
  if (mode === 'simple') {
    return (
      <div
        className={`w-full max-w-3xl mx-auto overflow-hidden transition-all duration-300 ${
          clickable ? 'cursor-pointer' : ''
        }`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
          if (clickable) {
            e.currentTarget.style.transform = 'scale(1.01)';
            e.currentTarget.style.borderColor = 'rgba(212, 197, 185, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (clickable) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          }
        }}
      >
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* 封面图 */}
            {coverImage && (
              <div className="flex-shrink-0">
                <div
                  className="w-32 h-32 rounded-xl overflow-hidden"
                  style={{
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(212, 197, 185, 0.2)',
                  }}
                >
                  <img
                    src={coverImage}
                    alt={podcastName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* 播客信息 */}
            <div className="flex-1">
              <h3
                className="text-xl font-bold text-white mb-2"
                style={{ color: 'rgba(232, 232, 232, 0.9)' }}
              >
                {podcastName || '未知播客'}
              </h3>
              <p
                className="text-sm"
                style={{ color: 'rgba(212, 197, 185, 0.7)' }}
              >
                {hostName && `主播：${hostName}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== Full 模式：完整显示 ====================
  return (
    <div
      className={`w-full max-w-3xl mx-auto overflow-hidden transition-all duration-500 ${
        clickable ? 'cursor-pointer' : ''
      }`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: isTranscribing
          ? '1px solid rgba(212, 197, 185, 0.2)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        boxShadow: isTranscribing
          ? '0 8px 32px rgba(212, 197, 185, 0.08)'
          : '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}
      onClick={onClick}
    >
      {/* 顶部封面和信息 */}
      <div className="p-6">
        <div className="flex gap-6">
          {/* 封面图 */}
          <div className="flex-shrink-0">
            <div
              className="w-32 h-32 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-500"
              style={{
                backgroundColor: 'rgba(212, 197, 185, 0.15)',
                boxShadow: isTranscribing
                  ? '0 8px 24px rgba(212, 197, 185, 0.2)'
                  : '0 4px 12px rgba(0, 0, 0, 0.2)',
                transform: isTranscribing ? 'scale(1.02)' : 'scale(1)',
                border: '1px solid rgba(212, 197, 185, 0.2)',
              }}
            >
              {coverImage ? (
                <img
                  src={coverImage}
                  alt={episodeTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-4xl font-bold">
                  {podcastName?.charAt(0)}
                </span>
              )}
            </div>
          </div>

          {/* 播客信息 */}
          <div className="flex-1 min-w-0">
            {/* 播客名称 */}
            <div
              className="text-sm font-medium mb-2"
              style={{ color: 'rgba(212, 197, 185, 0.7)' }}
            >
              {podcastName}
            </div>

            {/* 节目标题 */}
            <h2 className="text-xl font-bold text-white mb-3 line-clamp-2">
              {episodeTitle}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};
