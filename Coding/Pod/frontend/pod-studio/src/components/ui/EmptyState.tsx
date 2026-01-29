/**
 * EmptyState - 统一的空状态组件
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：温暖的邀请，不让人感到空虚
 */

import { LucideIcon, BookOpen, FileText, Bookmark, Sparkles, Search, Mic, Hourglass } from 'lucide-react';

interface EmptyStateProps {
  /** 图标（emoji 或 LucideIcon） */
  icon?: string | React.ComponentType<LucideIcon>;

  /** 标题 */
  title: string;

  /** 描述 */
  description?: string;

  /** 操作按钮文本 */
  actionText?: string;

  /** 操作按钮点击事件 */
  onAction?: () => void;

  /** 大小变体 */
  size?: 'small' | 'medium' | 'large';

  /** 是否居中 */
  centered?: boolean;
}

export const EmptyState = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  size = 'medium',
  centered = true,
}: EmptyStateProps) => {
  // 根据大小设置样式
  const sizeStyles = {
    small: {
      icon: 'text-4xl',
      title: 'text-lg',
      description: 'text-sm',
      padding: 'py-12',
    },
    medium: {
      icon: 'text-6xl',
      title: 'text-xl',
      description: 'text-base',
      padding: 'py-20',
    },
    large: {
      icon: 'text-7xl',
      title: 'text-2xl',
      description: 'text-lg',
      padding: 'py-24',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div
      className={`flex flex-col items-center justify-center ${styles.padding} ${centered ? 'text-center' : ''}`}
    >
      {/* 图标 */}
      {icon && (
        <div className={`${styles.icon} mb-4`}>
          {typeof icon === 'string' ? icon : null}
        </div>
      )}

      {/* 标题 */}
      <h3
        className={`${styles.title} font-medium mb-3`}
        style={{ color: 'rgba(232, 232, 232, 0.9)' }}
      >
        {title}
      </h3>

      {/* 描述 */}
      {description && (
        <p
          className={`${styles.description} mb-8 max-w-md`}
          style={{ color: 'rgba(255, 255, 255, 0.4)' }}
        >
          {description}
        </p>
      )}

      {/* 操作按钮 */}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: 'rgba(212, 197, 185, 0.1)',
            border: '1px solid rgba(212, 197, 185, 0.3)',
            color: 'rgba(212, 197, 185, 0.9)',
            transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.2)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// 预定义的空状态场景
export const EmptyStates = {
  // 历史记录空状态
  noHistory: (
    <EmptyState
      icon={BookOpen}
      title="还没有记录"
      description="慢慢来，不着急"
    />
  ),

  // 笔记空状态
  noNotes: (
    <EmptyState
      icon={FileText}
      title="还没有笔记"
      description="选中文字，记下想法"
    />
  ),

  // 书签空状态
  noBookmarks: (
    <EmptyState
      icon={Bookmark}
      title="还没有书签"
      description="标记重要的片段"
    />
  ),

  // Highlights 空状态（加载中）
  loadingHighlights: (
    <EmptyState
      icon={Sparkles}
      title="正在提取金句"
      description="需要一点时间，请耐心等待"
    />
  ),

  // 搜索空状态
  noSearchResults: (
    <EmptyState
      icon={Search}
      title="没有找到匹配"
      description="试试其他关键词"
    />
  ),

  // 搜索框空状态
  searchEmpty: (
    <EmptyState
      icon={Search}
      title="搜索逐字稿"
      description="输入关键词，快速找到你想听的内容"
      size="small"
    />
  ),

  // 播客列表空状态
  noPodcasts: (
    <EmptyState
      icon={Mic}
      title="还没有播客"
      description="粘贴小宇宙节目链接开始使用"
      actionText="添加第一个播客"
    />
  ),

  // 转录中状态
  transcribing: (
    <EmptyState
      icon={Hourglass}
      title="正在转录中"
      description="需要一点时间，请耐心等待"
      size="large"
    />
  ),
};
