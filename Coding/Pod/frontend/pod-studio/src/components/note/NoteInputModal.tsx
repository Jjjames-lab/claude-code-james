/**
 * NoteInputModal - 笔记输入弹窗
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：安静的思考过程，不打断用户
 */

import { useState, useEffect, useRef } from 'react';
import { X, Lightbulb, Help, CheckCircle, MessageSquare } from 'lucide-react';
import { useNoteStore } from '../../stores/noteStore';

interface NoteInputModalProps {
  podcastId: string;
}

export const NoteInputModal = ({ podcastId }: NoteInputModalProps) => {
  const {
    selectedText,
    editingNote,
    isNoteInputOpen,
    closeNoteInput,
    addNote,
    updateNote,
  } = useNoteStore();

  const [note, setNote] = useState('');
  const [category, setCategory] = useState<'thought' | 'question' | 'action' | 'quote'>('thought');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 判断是否是编辑模式
  const isEditMode = !!editingNote;

  // 预填充编辑数据
  useEffect(() => {
    if (editingNote && isNoteInputOpen) {
      setNote(editingNote.note || '');
      setCategory(editingNote.category || 'thought');
    } else if (!isNoteInputOpen) {
      // 重置状态
      setNote('');
      setCategory('thought');
    }
  }, [editingNote, isNoteInputOpen]);

  // 自动聚焦输入框
  useEffect(() => {
    if (isNoteInputOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isNoteInputOpen]);

  // ESC 关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNoteInputOpen) {
        closeNoteInput();
      }
      // Ctrl/Cmd + Enter 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isNoteInputOpen) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isNoteInputOpen]);

  // 重置状态
  useEffect(() => {
    if (!isNoteInputOpen) {
      setNote('');
      setCategory('thought');
    }
  }, [isNoteInputOpen]);

  const handleSave = () => {
    if (!note.trim()) return;

    if (isEditMode && editingNote) {
      // 编辑模式：更新现有笔记
      updateNote(podcastId, editingNote.id, {
        note: note.trim(),
        category,
      });
    } else {
      // 新增模式：创建新笔记
      if (!selectedText) return;

      addNote(podcastId, {
        timestamp: selectedText.timestamp,
        selectedText: selectedText.text,
        note: note.trim(),
        category,
      });
    }

    // 清空并关闭
    setNote('');
    setCategory('thought');
    closeNoteInput();
  };

  if (!isNoteInputOpen || (!selectedText && !isEditMode)) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 modal-overlay"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={closeNoteInput}
    >
      {/* 弹窗内容 */}
      <div
        className="relative w-full max-w-lg modal-content"
        style={{
          backgroundColor: '#1a1a1d',
          borderRadius: '12px',
          padding: 'clamp(20px, 5vw, 32px)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={closeNoteInput}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10"
          style={{
            transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          title="关闭 (ESC)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 标题 */}
        <h2
          className="text-xl font-medium mb-6"
          style={{ color: 'rgba(232, 232, 232, 0.9)' }}
        >
          {isEditMode ? '编辑笔记' : '记下想法'}
        </h2>

        {/* 选中的文字（仅新增模式显示） */}
        {!isEditMode && selectedText && (
          <div className="mb-6">
            <div
              className="text-sm mb-2"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              选中的文字
            </div>
            <div
              className="p-3 rounded-lg text-sm leading-relaxed"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: 'rgba(255, 255, 255, 0.6)',
                fontStyle: 'italic',
              }}
            >
              "{selectedText.text}"
            </div>
            <div
              className="text-xs mt-2 font-mono"
              style={{ color: 'rgba(255, 255, 255, 0.3)' }}
            >
              时间戳: {formatTime(selectedText.timestamp)}
            </div>
          </div>
        )}

        {/* 笔记输入 */}
        <div className="mb-6">
          <label
            htmlFor="note-input"
            className="block text-sm mb-2"
            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          >
            你的笔记
          </label>
          <textarea
            ref={inputRef}
            id="note-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="在这里记录你的想法..."
            className="w-full min-h-[120px] p-3 rounded-lg resize-none"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'rgba(232, 232, 232, 0.9)',
              fontSize: '16px',
              lineHeight: 1.6,
              outline: 'none',
              transition: 'border 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(212, 197, 185, 0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }}
          />
          <div
            className="text-right text-xs mt-1"
            style={{ color: 'rgba(255, 255, 255, 0.3)' }}
          >
            {note.length} 字
          </div>
        </div>

        {/* 分类选择 */}
        <div className="mb-6">
          <div
            className="text-sm mb-2"
            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          >
            分类（可选）
          </div>
          <div className="flex gap-2">
            {[
              { value: 'thought', label: '想法', icon: Lightbulb },
              { value: 'question', label: '疑问', icon: Help },
              { value: 'action', label: '行动', icon: CheckCircle },
              { value: 'quote', label: '引用', icon: MessageSquare },
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value as any)}
                className="px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                style={{
                  backgroundColor:
                    category === cat.value
                      ? 'rgba(212, 197, 185, 0.2)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border:
                    category === cat.value
                      ? '1px solid rgba(212, 197, 185, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                  color:
                    category === cat.value
                      ? 'rgba(212, 197, 185, 0.9)'
                      : 'rgba(255, 255, 255, 0.5)',
                  transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
                onMouseEnter={(e) => {
                  if (category !== cat.value) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (category !== cat.value) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
              >
                <cat.icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={closeNoteInput}
            className="flex-1 px-6 py-3 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.6)',
              transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!note.trim()}
            className="flex-1 px-6 py-3 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: note.trim()
                ? 'rgba(212, 197, 185, 0.9)'
                : 'rgba(212, 197, 185, 0.3)',
              border: '1px solid transparent',
              color: note.trim()
                ? '#0f0f11'
                : 'rgba(15, 15, 17, 0.5)',
              cursor: note.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
            onMouseEnter={(e) => {
              if (note.trim()) {
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            保存
          </button>
        </div>

        {/* 快捷键提示 */}
        <div
          className="text-xs text-center mt-4"
          style={{ color: 'rgba(255, 255, 255, 0.3)' }}
        >
          ESC 关闭 · Ctrl/Cmd + Enter 保存
        </div>
      </div>
    </div>
  );
};

// 辅助函数：格式式化时间
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
