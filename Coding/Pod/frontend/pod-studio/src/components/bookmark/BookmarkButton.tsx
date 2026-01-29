/**
 * BookmarkButton - 书签按钮组件
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：快速标记，不打断听讲
 */

import { Bookmark } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

interface BookmarkButtonProps {
  podcastId: string;
}

export const BookmarkButton = ({ podcastId }: BookmarkButtonProps) => {
  const { currentTime } = usePlayerStore();
  const [isBookmarked, setIsBookmarked] = useState(false);

  // 检查当前位置是否已标记
  const checkBookmarked = () => {
    // TODO: 从 storageManager 检查
    return false;
  };

  // 添加书签
  const handleAddBookmark = () => {
    if (!currentTime) return;

    // TODO: 调用 storageManager 添加书签
    console.log('[BookmarkButton] 添加书签:', currentTime);
    setIsBookmarked(true);

    // 3秒后恢复状态
    setTimeout(() => setIsBookmarked(false), 3000);
  };

  return (
    <button
      onClick={handleAddBookmark}
      className="w-9 h-9 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/5 flex items-center justify-center"
      style={{
        transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
      title={isBookmarked ? '已标记' : '添加书签'}
    >
      <Bookmark
        className="w-4 h-4"
        style={{
          fill: isBookmarked ? 'currentColor' : 'none',
        }}
      />
    </button>
  );
};
