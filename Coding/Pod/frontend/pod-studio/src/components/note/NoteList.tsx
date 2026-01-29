/**
 * NoteList - 笔记列表组件
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：让用户的想法清晰可见
 */

import { useEffect, useState } from 'react';
import { Clock, Trash2, Edit3, ExternalLink, Lightbulb, Help, CheckCircle, MessageSquare, Inbox } from 'lucide-react';
import { useNoteStore } from '../../stores/noteStore';
import { usePlayerStore } from '../../stores/playerStore';
import { formatTime } from '../../utils';
import type { Note } from '../../stores/noteStore';
import { NoteInputModal } from './NoteInputModal';

interface NoteListProps {
  podcastId: string;
  onJumpToTranscript?: (timestamp: number) => void;  // 新增：跳转到逐字稿的回调
}

export const NoteList = ({ podcastId, onJumpToTranscript }: NoteListProps) => {
  const { currentPodcastNotes, deleteNote, getNotes, loadNotes, setEditingNote } = useNoteStore();
  const { seek } = usePlayerStore();
  const [filter, setFilter] = useState<'all' | 'thought' | 'question' | 'action' | 'quote'>('all');

  // 跳转到时间戳
  const handleJumpToTimestamp = (timestamp: number) => {
    seek(timestamp);
  };

  // 在逐字稿中查看
  const handleViewInTranscript = (timestamp: number) => {
    // 先跳转到对应时间
    seek(timestamp);
    // 然后调用回调（如果提供）
    if (onJumpToTranscript) {
      onJumpToTranscript(timestamp);
    }
  };

  // 加载笔记
  useEffect(() => {
    loadNotes(podcastId);
  }, [podcastId]);

  const filteredNotes = filter === 'all'
    ? currentPodcastNotes
    : currentPodcastNotes.filter(note => note.category === filter);

  // 删除笔记
  const handleDelete = (note: Note) => {
    if (confirm('确定要删除这条笔记吗')) {
      deleteNote(podcastId, note.id);
    }
  };


  // 格式化分类标签
  const getCategoryLabel = (category: Note['category']) => {
    const labels = {
      thought: { icon: Lightbulb, label: '想法' },
      question: { icon: Help, label: '疑问' },
      action: { icon: CheckCircle, label: '行动' },
      quote: { icon: MessageSquare, label: '引用' },
    };
    return labels[category] || { icon: Lightbulb, label: category };
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  };

  if (currentPodcastNotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-6">📝</div>
        <h3
          className="text-xl font-medium mb-3"
          style={{ color: 'rgba(232, 232, 232, 0.9)' }}
        >
          还没有笔记
        </h3>
        <p
          className="text-base"
          style={{ color: 'rgba(255, 255, 255, 0.4)' }}
        >
          选中文字，记下想法
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* NoteInputModal */}
      <NoteInputModal podcastId={podcastId} />

      {/* 过滤器 */}
      {currentPodcastNotes.length > 0 && (
        <div className="flex gap-2 mb-6">
          {[
            { value: 'all', label: '全部', icon: null },
            { value: 'thought', label: '想法', icon: Lightbulb },
            { value: 'question', label: '疑问', icon: Help },
            { value: 'action', label: '行动', icon: CheckCircle },
            { value: 'quote', label: '引用', icon: MessageSquare },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-250 flex items-center gap-2"
              style={{
                backgroundColor:
                  filter === f.value
                    ? 'rgba(212, 197, 185, 0.2)'
                    : 'rgba(255, 255, 255, 0.03)',
                border:
                  filter === f.value
                    ? '1px solid rgba(212, 197, 185, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                color:
                  filter === f.value
                    ? 'rgba(212, 197, 185, 0.9)'
                    : 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {f.icon && <f.icon className="w-4 h-4" />}
              <span>{f.label}</span>
              <span className="text-xs opacity-60">({f.value === 'all' ? currentPodcastNotes.length : currentPodcastNotes.filter(n => n.category === f.value).length})</span>
            </button>
          ))}
        </div>
      )}

      {/* 笔记列表 */}
      {filteredNotes.length === 0 && filter !== 'all' ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="w-16 h-16 mb-4" style={{ color: 'rgba(255, 255, 255, 0.2)' }} />
          <p style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            这个分类下还没有笔记
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="group p-5 rounded-xl transition-all duration-250"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              {/* 头部：时间戳和分类 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* 时间戳 */}
                  <button
                    onClick={() => handleJumpToTimestamp(note.timestamp)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'rgba(255, 255, 255, 0.4)',
                      transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                    title="跳转到这个位置"
                  >
                    <Clock className="w-3 h-3" />
                    {formatTime(note.timestamp)}
                  </button>

                  {/* 在逐字稿中查看按钮 */}
                  {note.selectedText && onJumpToTranscript && (
                    <button
                      onClick={() => handleViewInTranscript(note.timestamp)}
                      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: 'rgba(212, 197, 185, 0.08)',
                        color: 'rgba(212, 197, 185, 0.6)',
                        border: '1px solid rgba(212, 197, 185, 0.15)',
                        transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(212, 197, 185, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(212, 197, 185, 0.15)';
                      }}
                      title="在逐字稿中查看这段文字"
                    >
                      <ExternalLink className="w-3 h-3" style={{ width: '12px', height: '12px' }} />
                      <span>逐字稿</span>
                    </button>
                  )}

                  {/* 分类 */}
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs"
                    style={{
                      backgroundColor: 'rgba(212, 197, 185, 0.1)',
                      color: 'rgba(212, 197, 185, 0.7)',
                    }}
                  >
                    {(() => {
                      const categoryInfo = getCategoryLabel(note.category);
                      const Icon = categoryInfo.icon;
                      return (
                        <>
                          <Icon className="w-3 h-3" />
                          <span>{categoryInfo.label}</span>
                        </>
                      );
                    })()}
                  </span>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-250">
                  <button
                    onClick={() => setEditingNote(note)}
                    className="p-2 rounded text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
                    title="编辑"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(note)}
                    className="p-2 rounded text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 选中的文字 */}
              {note.selectedText && (
                <div className="mb-3">
                  <div
                    className="text-xs mb-1.5"
                    style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                  >
                    选中的文字
                  </div>
                  <div
                    className="text-sm p-2 rounded leading-relaxed"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontStyle: 'italic',
                    }}
                  >
                    "{note.selectedText}"
                  </div>
                </div>
              )}

              {/* 笔记内容 */}
              {note.note && (
                <div>
                  <div
                    className="text-xs mb-1.5"
                    style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                  >
                    你的笔记
                  </div>
                  <div
                    className="text-sm leading-relaxed"
                    style={{ color: 'rgba(232, 232, 232, 0.8)' }}
                  >
                    {note.note}
                  </div>
                </div>
              )}

              {/* 底部：创建/编辑时间 */}
              <div
                className="text-xs mt-3 pt-3"
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  color: 'rgba(255, 255, 255, 0.3)',
                }}
              >
                {note.updatedAt && note.updatedAt !== note.createdAt
                  ? `最后编辑于 ${formatDate(note.updatedAt)}`
                  : formatDate(note.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
