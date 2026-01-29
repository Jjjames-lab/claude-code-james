import { FileText, BookOpen, Bookmark } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-transcript' | 'no-chapters' | 'no-bookmarks';
  action?: () => void;
}

export const EmptyState = ({ type, action }: EmptyStateProps) => {
  const states = {
    'no-transcript': {
      icon: FileText,
      title: '暂无逐字稿',
      description: '请先完成播客转录',
      actionText: null,
    },
    'no-chapters': {
      icon: BookOpen,
      title: '暂无章节',
      description: '点击下方按钮AI智能生成章节',
      actionText: 'AI 生成章节',
    },
    'no-bookmarks': {
      icon: Bookmark,
      title: '暂无书签',
      description: '点击逐字稿中的句子添加书签',
      actionText: null,
    },
  };

  const state = states[type];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {/* 图标 */}
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400 dark:text-slate-600" />
      </div>

      {/* 标题 */}
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
        {state.title}
      </h3>

      {/* 描述 */}
      <p className="text-slate-500 dark:text-slate-400 mb-6 text-center">
        {state.description}
      </p>

      {/* 操作按钮 */}
      {state.actionText && action && (
        <button
          onClick={action}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all duration-200 active:scale-95 shadow-sm hover:shadow"
        >
          {state.actionText}
        </button>
      )}
    </div>
  );
};
