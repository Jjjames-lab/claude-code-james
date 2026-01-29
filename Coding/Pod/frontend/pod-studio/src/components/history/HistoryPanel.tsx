/**
 * HistoryPanel - 历史记录组件
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：安静、温暖、尊重
 */

import { useState, useEffect } from 'react';
import { storageManager } from '../../utils/storageManager';
import { usePlayerStore } from '../../stores/playerStore';

// 历史记录项类型
interface HistoryItem {
  id: string;
  title: string;
  podcastName: string;
  coverImage?: string;
  duration: number;
  transcript: any[];
  notes: any[];
  createdAt: string;
  lastPlayedAt: string;
  lastPosition: number;
}

export const HistoryPanel = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'hasNotes'>('all');
  const { setCurrentPodcast, seek } = usePlayerStore();

  // 加载历史记录
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const items = storageManager.loadHistory();
    setHistory(items);
  };

  // 过滤历史记录
  const filteredHistory = history.filter(item => {
    if (filter === 'hasNotes') {
      return item.notes && item.notes.length > 0;
    }
    return true;
  });

  // 继续播放
  const handleContinue = (item: HistoryItem) => {
    // 恢复播客
    const podcast = {
      id: item.id,
      title: item.title,
      description: item.podcastName,
      audioUrl: '',  // 需要从原始数据获取
      coverUrl: item.coverImage,
      duration: item.duration,
      createdAt: item.createdAt,
      transcript: item.transcript,
    };

    setCurrentPodcast(podcast);

    // 跳转到上次播放位置
    if (item.lastPosition > 0) {
      seek(item.lastPosition);
    }

    // 更新最后播放时间
    storageManager.updateHistoryItem(item.id, {
      lastPlayedAt: new Date().toISOString(),
    });
  };

  // 删除历史记录
  const handleDelete = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();

    if (confirm('确定要删除这条记录吗')) {
      storageManager.deleteHistoryItem(itemId);
      loadHistory();
    }
  };

  // 清空所有历史
  const handleClearAll = () => {
    if (confirm('确定要清空所有历史记录吗')) {
      storageManager.clearHistory();
      loadHistory();
    }
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  // 格式化时间戳为 HH:MM:SS
  const formatTimestamp = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算播放进度
  const getProgress = (item: HistoryItem) => {
    if (!item.duration || item.duration === 0) return 0;
    return Math.min(100, Math.max(0, (item.lastPosition / item.duration) * 100));
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-semibold text-white">
          你的记录
        </h2>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            清空全部
          </button>
        )}
      </div>

      {/* 过滤器 */}
      {history.length > 0 && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            全部 ({history.length})
          </button>
          <button
            onClick={() => setFilter('hasNotes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'hasNotes'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            有笔记 ({history.filter(h => h.notes && h.notes.length > 0).length})
          </button>
        </div>
      )}

      {/* 历史记录列表 */}
      {filteredHistory.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <div className="text-6xl mb-6">📚</div>
          <h3 className="text-2xl font-semibold text-white mb-3">
            还没有记录
          </h3>
          <p className="text-slate-400 text-lg mb-8">
            慢慢来，不着急
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => handleContinue(item)}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6
                       hover:bg-white/10 hover:border-white/20
                       transition-all duration-200 cursor-pointer group"
            >
              <div className="flex gap-4">
                {/* 封面图 */}
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500
                              flex-shrink-0 overflow-hidden">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                      {item.podcastName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  {/* 标题 */}
                  <h3 className="text-lg font-semibold text-white mb-1 truncate">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">
                    {item.podcastName}
                  </p>

                  {/* 元信息 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        📅 {formatDate(item.lastPlayedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        ⏱️ {formatTime(item.duration)}
                      </span>
                      {item.notes && item.notes.length > 0 && (
                        <span className="flex items-center gap-1">
                          💬 {item.notes.length}条笔记
                        </span>
                      )}
                    </div>

                    {/* 播放进度 */}
                    {item.lastPosition > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: 'rgba(212, 197, 185, 0.7)' }}>
                            上次播放到 {formatTimestamp(item.lastPosition)}
                          </span>
                          <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                            {Math.round(getProgress(item))}%
                          </span>
                        </div>
                        <div
                          className="h-1 rounded-full overflow-hidden"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${getProgress(item)}%`,
                              backgroundColor: 'rgba(212, 197, 185, 0.4)',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContinue(item);
                    }}
                    className="px-4 py-2 text-sm font-medium
                             bg-violet-500/20 text-violet-300 border border-violet-500/30
                             rounded-lg hover:bg-violet-500/30
                             transition-colors"
                  >
                    继续
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="px-4 py-2 text-sm font-medium
                             bg-white/5 text-slate-400 border border-white/10
                             rounded-lg hover:bg-white/10 hover:text-red-400
                             transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
