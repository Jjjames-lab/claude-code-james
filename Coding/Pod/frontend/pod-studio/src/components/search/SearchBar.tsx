/**
 * SearchBar - 搜索栏组件
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：快速找到想听的内容，不被打断
 */

import { useState, useEffect, useRef } from 'react';
import { Search, X, Command } from 'lucide-react';
import { useNoteStore } from '../../stores/noteStore';
import type { NoteFilter } from '../../stores/noteStore';
import { usePlayerStore } from '../../stores/playerStore';

interface SearchBarProps {
  podcastId: string;
}

interface SearchResult {
  note: Note;
  matchedText: string;
  contextBefore: string;
  contextAfter: string;
}

export const SearchBar = ({ podcastId }: SearchBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { seek } = usePlayerStore();
  const { filterNotes } = useNoteStore();

  // 快捷键支持：Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      // ESC 关闭
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
      // 上下箭头选择结果
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedResultIndex(prev =>
            Math.min(prev + 1, searchResults.length - 1)
          );
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedResultIndex(prev => Math.max(prev - 1, 0));
        }
        // Enter 跳转到选中结果
        if (e.key === 'Enter' && searchResults.length > 0) {
          e.preventDefault();
          const selected = searchResults[selectedResultIndex];
          if (selected) {
            seek(selected.note.timestamp);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, searchResults, selectedResultIndex]);

  // 自动聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 执行搜索
  useEffect(() => {
    if (!isOpen || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // 防抖搜索
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, searchQuery, podcastId]);

  const performSearch = (query: string) => {
    // 在笔记中搜索
    const filter: NoteFilter = {
      search: query,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    const notes = filterNotes(podcastId, filter);

    // 构建搜索结果
    const results: SearchResult[] = notes.map(note => {
      // 在笔记内容和选中的文字中搜索
      const noteLower = note.note.toLowerCase();
      const selectedTextLower = note.selectedText.toLowerCase();
      const queryLower = query.toLowerCase();

      const noteMatch = noteLower.includes(queryLower);
      const selectedTextMatch = selectedTextLower.includes(queryLower);

      let matchedText = '';
      if (noteMatch) {
        matchedText = note.note;
      } else if (selectedTextMatch) {
        matchedText = note.selectedText;
      }

      // 提取上下文（前后各20个字符）
      const allText = note.selectedText + ' ' + note.note;
      const matchIndex = allText.toLowerCase().indexOf(queryLower);
      const start = Math.max(0, matchIndex - 20);
      const end = Math.min(allText.length, matchIndex + query.length + 20);

      return {
        note,
        matchedText,
        contextBefore: allText.substring(start, matchIndex),
        contextAfter: allText.substring(matchIndex + query.length, end),
      };
    }).filter(result => result.matchedText);

    setSearchResults(results);
    setSelectedResultIndex(0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 跳转到搜索结果
  const jumpToResult = (result: SearchResult) => {
    seek(result.note.timestamp);
    setIsOpen(false);
  };

  return (
    <div>
      {/* 搜索按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: 'rgba(255, 255, 255, 0.5)',
          transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        }}
      >
        <Search className="w-4 h-4" />
        <span>搜索</span>
        <kbd
          className="ml-2 px-1.5 py-0.5 rounded text-xs"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          ⌘K
        </kbd>
      </button>

      {/* 搜索弹窗 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-start justify-center pt-20"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div
            className="w-full max-w-2xl mx-4 rounded-xl p-4"
            style={{
              backgroundColor: '#1a1a1d',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 搜索输入框 */}
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-5 h-5" style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索笔记内容..."
                className="flex-1 px-4 py-2 rounded-lg text-base"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(232, 232, 232, 0.9)',
                  outline: 'none',
                  transition: 'border 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(212, 197, 185, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-2 rounded text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 搜索结果 */}
            {searchQuery && searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  className="text-xs"
                  style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                >
                  找到 {searchResults.length} 条结果
                </div>

                {searchResults.map((result, index) => (
                  <div
                    key={result.note.id}
                    onClick={() => jumpToResult(result)}
                    className="p-3 rounded-lg cursor-pointer"
                    style={{
                      backgroundColor:
                        index === selectedResultIndex
                          ? 'rgba(212, 197, 185, 0.1)'
                          : 'rgba(255, 255, 255, 0.03)',
                      border:
                        index === selectedResultIndex
                          ? '1px solid rgba(212, 197, 185, 0.3)'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                      transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                    onMouseEnter={(e) => {
                      if (index !== selectedResultIndex) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (index !== selectedResultIndex) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-xs font-mono"
                        style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                      >
                        {formatTime(result.note.timestamp)}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        {result.note.category === 'thought' && '💭'}
                        {result.note.category === 'question' && '❓'}
                        {result.note.category === 'action' && '✅'}
                        {result.note.category === 'quote' && '💬'}
                      </span>
                    </div>

                    {/* 匹配的文字 */}
                    <div
                      className="text-sm leading-relaxed mb-2"
                      style={{
                        color: 'rgba(232, 232, 232, 0.7)',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: result.matchedText.replace(
                          new RegExp(searchQuery, 'gi'),
                          `<mark style="background: rgba(212, 197, 185, 0.3); color: inherit; padding: 0 2px; border-radius: 2px;">$&&</mark>`
                        ),
                      }}
                    />

                    {/* 上下文 */}
                    <div
                      className="text-xs"
                      style={{
                        color: 'rgba(255, 255, 255, 0.3)',
                      fontStyle: 'italic',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.4,
                      maxHeight: '40px',
                      overflow: 'hidden',
                    }}
                    >
                      {result.contextBefore && <span>...{result.contextBefore}</span>}
                      <mark style={{ background: 'rgba(212, 197, 185, 0.3)' }}>{searchQuery}</mark>
                      {result.contextAfter && <span>{result.contextAfter}...</span>}
                    </div>

                    {/* 笔记内容 */}
                    {result.note.note && (
                      <div
                        className="text-xs mt-2 pt-2"
                        style={{
                          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                          color: 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        {result.note.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8">
                <p style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  没有找到匹配的结果
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
