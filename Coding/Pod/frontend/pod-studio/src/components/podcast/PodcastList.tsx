import { useState } from 'react';
import { Clock, User, Clock as ClockIcon } from 'lucide-react';

// 时间格式化工具函数
const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

interface Episode {
  episodeId: string;
  episodeTitle: string;
  audioUrl: string;
  duration: number;
  coverImage: string;
  showNotes: string;
  createdAt: string;
}

interface PodcastListProps {
  podcastId: string;
  podcastName: string;
  hostName: string;
  description: string;
  logo: string;
  episodes: Episode[];
  totalEpisodes: number;
  onEpisodeClick: (episode: Episode) => void;
  onInfoClick: () => void;
}

export const PodcastList = ({
  podcastId,
  podcastName,
  hostName,
  description,
  logo,
  episodes,
  totalEpisodes,
  onEpisodeClick,
  onInfoClick,
}: PodcastListProps) => {
  const [hoveredEpisode, setHoveredEpisode] = useState<string | null>(null);

  return (
    <div className="w-full max-w-4xl mx-auto animate-scale-in space-y-6">
      {/* 播客信息区域 */}
      <div
        className="p-6 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.01]"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
        onClick={onInfoClick}
      >
        <div className="flex gap-6">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div
              className="w-32 h-32 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105"
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(212, 197, 185, 0.2)',
              }}
            >
              {logo ? (
                <img
                  src={logo}
                  alt={podcastName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-500">
                  <span className="text-white text-4xl font-bold">
                    {podcastName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 播客信息 */}
          <div className="flex-1 min-w-0">
            {/* 播客名称 */}
            <h1 className="text-3xl font-bold text-white mb-2">
              {podcastName}
            </h1>

            {/* 主播名称 */}
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4" style={{ color: 'rgba(212, 197, 185, 0.7)' }} />
              <span className="text-sm" style={{ color: 'rgba(212, 197, 185, 0.7)' }}>
                {hostName || '未知主播'}
              </span>
            </div>

            {/* 播客介绍 */}
            <div
              className="text-sm text-slate-300 line-clamp-3 leading-relaxed"
              style={{
                maxHeight: '60px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {description || '暂无介绍'}
            </div>

            {/* 统计信息 */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                <ClockIcon className="w-3.5 h-3.5" />
                <span>{totalEpisodes} 集节目</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 节目列表 */}
      <div className="space-y-3">
        <div className="px-2">
          <h2 className="text-sm font-medium" style={{ color: 'rgba(212, 197, 185, 0.7)' }}>
            最新节目
          </h2>
        </div>

        {episodes.map((episode, index) => (
          <div
            key={episode.episodeId}
            className="p-4 rounded-xl cursor-pointer transition-all duration-300"
            style={{
              backgroundColor: hoveredEpisode === episode.episodeId
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: hoveredEpisode === episode.episodeId
                ? '1px solid rgba(212, 197, 185, 0.2)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: hoveredEpisode === episode.episodeId
                ? '0 8px 32px rgba(212, 197, 185, 0.08)'
                : '0 8px 32px rgba(0, 0, 0, 0.2)',
              transform: hoveredEpisode === episode.episodeId ? 'scale(1.01)' : 'scale(1)',
            }}
            onMouseEnter={() => setHoveredEpisode(episode.episodeId)}
            onMouseLeave={() => setHoveredEpisode(null)}
            onClick={() => onEpisodeClick(episode)}
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
                  {episode.coverImage ? (
                    <img
                      src={episode.coverImage}
                      alt={episode.episodeTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-500">
                      <span className="text-white text-xl font-bold">
                        {podcastName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 节目信息 */}
              <div className="flex-1 min-w-0">
                {/* 节目标题 */}
                <h3 className="text-base font-semibold text-white mb-1.5 line-clamp-2">
                  {episode.episodeTitle}
                </h3>

                {/* 时长和发布时间 */}
                <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(episode.duration * 1000)}</span>
                  </div>
                  {episode.createdAt && (
                    <div className="flex items-center gap-1">
                      <span>·</span>
                      <span>{new Date(episode.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 箭头指示器 */}
              <div className="flex items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor: hoveredEpisode === episode.episodeId
                      ? 'rgba(212, 197, 185, 0.1)'
                      : 'rgba(255, 255, 255, 0.03)',
                    transform: hoveredEpisode === episode.episodeId ? 'translateX(4px)' : 'translateX(0)',
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
