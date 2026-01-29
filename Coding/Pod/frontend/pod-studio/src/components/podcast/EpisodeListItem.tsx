import { useState } from 'react';
import { Clock, Calendar, Check } from 'lucide-react';

// ==================== 类型定义 ====================

interface EpisodeListItemProps {
  // 单集信息
  episodeId: string;
  episodeTitle: string;
  coverImage?: string;
  duration: number;
  createdAt: string;
  podcastName?: string;

  // 处理状态
  processed: boolean;

  // 样式变体
  variant?: 'card' | 'list';

  // 点击事件
  onClick: () => void;
}

// ==================== 辅助函数 ====================

/**
 * 格式化时长
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 格式化日期
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '-');
  } catch {
    return dateString;
  }
}

// ==================== 组件实现 ====================

export const EpisodeListItem = ({
  episodeId,
  episodeTitle,
  coverImage,
  duration,
  createdAt,
  podcastName,
  processed,
  variant = 'list',
  onClick,
}: EpisodeListItemProps) => {
  const [hovered, setHovered] = useState(false);

  // ==================== List 变体：列表项 ====================
  if (variant === 'list') {
    return (
      <div
        className="p-4 rounded-xl cursor-pointer transition-all duration-300"
        style={{
          backgroundColor: hovered
            ? 'rgba(255, 255, 255, 0.06)'
            : 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: hovered
            ? '1px solid rgba(212, 197, 185, 0.2)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: hovered
            ? '0 8px 32px rgba(212, 197, 185, 0.08)'
            : '0 8px 32px rgba(0, 0, 0, 0.2)',
          transform: hovered ? 'scale(1.01)' : 'scale(1)',
          transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
      >
        <div className="flex gap-4">
          {/* 封面图 */}
          <div className="flex-shrink-0">
            <div
              className="w-16 h-16 rounded-lg overflow-hidden"
              style={{
                border: '1px solid rgba(212, 197, 185, 0.15)',
              }}
            >
              {coverImage ? (
                <img
                  src={coverImage}
                  alt={episodeTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-500">
                  <span className="text-white text-xl font-bold">
                    {podcastName?.charAt(0) || '?'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 节目信息 */}
          <div className="flex-1 min-w-0">
            {/* 节目标题 */}
            <h3 className="text-base font-semibold text-white mb-1.5 line-clamp-2">
              {episodeTitle}
            </h3>

            {/* 时长和发布日期 */}
            <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(duration * 1000)}</span>
              </div>
              {createdAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* 处理状态 */}
          <div className="flex items-center">
            {processed ? (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  color: 'rgba(34, 197, 94, 0.9)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                }}
              >
                <Check className="w-3 h-3" />
                <span>已处理</span>
              </div>
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: hovered ? 'rgba(212, 197, 185, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  transition: 'all 150ms ease',
                  transform: hovered ? 'translateX(4px)' : 'translateX(0)',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: 'rgba(212, 197, 185, 0.7)' }}
                >
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== Card 变体：大卡片 ====================
  return (
    <div
      className="w-full max-w-3xl mx-auto overflow-hidden rounded-xl cursor-pointer transition-all duration-500"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        transform: hovered ? 'scale(1.01)' : 'scale(1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* 顶部封面和信息 */}
      <div className="p-6">
        <div className="flex gap-6">
          {/* 封面图 */}
          <div className="flex-shrink-0">
            <div
              className="w-32 h-32 rounded-xl flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor: 'rgba(212, 197, 185, 0.15)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
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
                  {podcastName?.charAt(0) || '?'}
                </span>
              )}
            </div>
          </div>

          {/* 节目信息 */}
          <div className="flex-1 min-w-0">
            {/* 播客名称 */}
            {podcastName && (
              <div
                className="text-sm font-medium mb-2"
                style={{ color: 'rgba(212, 197, 185, 0.7)' }}
              >
                {podcastName}
              </div>
            )}

            {/* 节目标题 */}
            <h2 className="text-xl font-bold text-white mb-3 line-clamp-2">
              {episodeTitle}
            </h2>

            {/* 时长和发布日期 */}
            <div className="flex items-center gap-4 text-sm mb-3" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(duration * 1000)}</span>
              </div>
              {createdAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(createdAt)}</span>
                </div>
              )}
            </div>

            {/* 处理状态 */}
            {processed && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  color: 'rgba(34, 197, 94, 0.9)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                }}
              >
                <Check className="w-3 h-3" />
                <span>已处理</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
