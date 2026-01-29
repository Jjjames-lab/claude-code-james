/**
 * BookmarkList - 书签列表组件
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：快速标记重要片段，方便回访
 */

import { useState, useEffect } from 'react';
import { Clock, Trash2, ExternalLink } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { formatTime } from '../../utils';
import { storageManager } from '../../utils/storageManager';

interface Bookmark {
  id: string;
  podcastId: string;
  timestamp: number;
  text: string;
  createdAt: string;
}

export const BookmarkList = ({ podcastId }: { podcastId: string }) => {
  const { seek } = usePlayerStore();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // 从 LocalStorage 加载书签
  useEffect(() => {
    loadBookmarks();
  }, [podcastId]);

  const loadBookmarks = () => {
    // 从历史记录中获取当前播客的书签
    const history = storageManager.loadHistory();
    const currentPodcast = history.find(h => h.id === podcastId);

    if (currentPodcast && currentPodcast.bookmarks) {
      setBookmarks(currentPodcast.bookmarks);
    } else {
      setBookmarks([]);
    }
  };

  // 添加书签
  const addBookmark = (timestamp: number) => {
    const newBookmark: Bookmark = {
      id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      podcastId,
      timestamp,
      text: `书签 ${formatTime(timestamp)}`,
      createdAt: new Date().toISOString(),
    };

    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);

    // 保存到 LocalStorage
    storageManager.saveNotes(podcastId, [...(storageManager.loadNotes(podcastId) || []), newBookmark] as any);

    // 更新历史记录
    storageManager.updateHistoryItem(podcastId, {
      bookmarks: updatedBookmarks
    } as any);

    console.log('[BookmarkList] 书签已添加:', newBookmark.id);
  };

  // 删除书签
  const handleDelete = (bookmarkId: string) => {
    if (confirm('确定要删除这个书签吗')) {
      const updatedBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
      setBookmarks(updatedBookmarks);

      // 保存到 LocalStorage
      storageManager.saveNotes(podcastId, updatedBookmarks as any);

      // 更新历史记录
      storageManager.updateHistoryItem(podcastId, {
        bookmarks: updatedBookmarks
      } as any);

      console.log('[BookmarkList] 书签已删除:', bookmarkId);
    }
  };

  // 跳转到时间戳
  const handleJumpToTimestamp = (timestamp: number) => {
    seek(timestamp);
  };

  return (
    <div>
      {/* 书签列表 */}
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-6">🔖</div>
          <h3
            className="text-xl font-medium mb-3"
            style={{ color: 'rgba(232, 232, 232, 0.9)' }}
          >
            还没有书签
          </h3>
          <p
            className="text-base"
            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          >
            标记重要的片段
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="group p-4 rounded-xl transition-all duration-250 cursor-pointer"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
              onClick={() => handleJumpToTimestamp(bookmark.timestamp)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              {/* 时间戳和删除按钮 */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJumpToTimestamp(bookmark.timestamp);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                >
                  <Clock className="w-3 h-3" />
                  {formatTime(bookmark.timestamp)}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(bookmark.id);
                  }}
                  className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors"
                  title="删除书签"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 书签描述 */}
              <div
                className="text-sm"
                style={{ color: 'rgba(232, 232, 232, 0.7)' }}
              >
                {bookmark.text}
              </div>

              {/* 创建时间 */}
              <div
                className="text-xs mt-2"
                style={{ color: 'rgba(255, 255, 255, 0.3)' }}
              >
                {new Date(bookmark.createdAt).toLocaleDateString('zh-CN', {
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
