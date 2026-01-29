/**
 * ChaptersSectionEnhanced - 章节展示组件（极简折叠版）
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：克制、清晰、不抢眼
 *
 * 方案1：极简折叠版
 * - 默认只显示标题（~50px 高度）
 * - 点击展开查看要点
 * - 要点内联显示：原文 / 翻译
 */

import { useState, useMemo } from 'react';
import { Clock, ChevronRight, ChevronDown } from 'lucide-react';
import { formatTime } from '../../utils';
import { usePlayerStore } from '../../stores/playerStore';
import { useTranslationStore } from '../../stores/translationStore';

interface Chapter {
  title: string;
  points: string[];
  segment_index: number;
}

interface ChapterData {
  chapters: Chapter[];
}

interface ChaptersSectionEnhancedProps {
  transcript: Array<{
    startTime: number;
    endTime?: number;
    text?: string;
  }>;
  chapters: ChapterData | null;
  setChapters: (chapters: ChapterData | null) => void;
  onChapterClick?: (time: number) => void;
}

export const ChaptersSectionEnhanced = ({
  transcript,
  chapters,
  setChapters,
  onChapterClick,
}: ChaptersSectionEnhancedProps) => {
  console.log('[ChaptersSectionEnhanced] 渲染 - 新版本（极简折叠版）');

  const { currentTime } = usePlayerStore();
  const { viewMode, chapterTranslations } = useTranslationStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 展开状态管理：存储展开的章节索引
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  // 切换章节展开/收起
  const toggleChapter = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡

    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  // 计算当前激活的章节
  const activeChapterIndex = useMemo(() => {
    if (!chapters || !transcript.length) return -1;

    const currentSegmentIndex = transcript.findIndex(
      (seg) => currentTime >= seg.startTime && (!seg.endTime || currentTime <= seg.endTime)
    );

    if (currentSegmentIndex === -1) return -1;

    for (let i = chapters.chapters.length - 1; i >= 0; i--) {
      if (chapters.chapters[i].segment_index <= currentSegmentIndex) {
        return i;
      }
    }

    return -1;
  }, [chapters, transcript, currentTime]);

  const handleGenerateChapters = async () => {
    setLoading(true);
    setError(null);

    try {
      const transcriptText = transcript.map((seg) => seg.text || '').join('\n\n');

      const response = await fetch('http://localhost:8001/api/v1/llm/generate-chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptText }),
      });

      if (!response.ok) {
        throw new Error(`生成章节失败 (${response.status})`);
      }

      const result = await response.json();
      setChapters(result.data);
    } catch (err) {
      console.error('生成章节失败:', err);
      setError(err instanceof Error ? err.message : '生成章节失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChapterClick = (segmentIndex: number) => {
    if (!transcript.length || !onChapterClick) return;

    const segment = transcript[segmentIndex];
    if (segment && onChapterClick) {
      onChapterClick(segment.startTime);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 生成按钮 */}
      {!chapters && !loading && (
        <div className="text-center">
          <button
            onClick={handleGenerateChapters}
            className="w-full p-6 rounded-xl
                     bg-white/5 backdrop-blur-xl border border-white/10
                     hover:bg-white/10 hover:border-white/20
                     transition-all duration-250"
            style={{
              transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-xl">✨</span>
              <span className="text-lg font-medium text-white/90">
                生成章节
              </span>
            </div>
            <p className="text-sm text-white/40">
              帮你理清内容结构
            </p>
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-20">
          <div
            className="w-14 h-14 mx-auto mb-6 rounded-full"
            style={{
              backgroundColor: 'rgba(212, 197, 185, 0.4)',
              animation: 'breathe 3s ease-in-out infinite',
            }}
          />
          <p
            className="text-base mb-2"
            style={{ color: 'rgba(232, 232, 232, 0.7)' }}
          >
            正在分析内容结构
          </p>
          <p
            className="text-sm"
            style={{ color: 'rgba(255, 255, 255, 0.3)' }}
          >
            需要一点时间，请耐心等待
          </p>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div
          className="p-8 rounded-xl text-center"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
          }}
        >
          <p
            className="mb-6"
            style={{ color: 'rgba(239, 68, 68, 0.8)', fontSize: '15px' }}
          >
            {error}
          </p>
          <button
            onClick={handleGenerateChapters}
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-250"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'rgba(239, 68, 68, 0.8)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            再试一次
          </button>
        </div>
      )}

      {/* 章节列表 - 极简折叠版 */}
      {chapters && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {chapters.chapters.map((chapter, idx) => {
            const segment = transcript[chapter.segment_index];
            const startTime = segment?.startTime;
            const isActive = idx === activeChapterIndex;
            const isExpanded = expandedChapters.has(idx);
            const hasTranslation = viewMode === 'bilingual' && chapterTranslations.has(idx);
            const translation = hasTranslation ? chapterTranslations.get(idx) : null;

            return (
              <div
                key={idx}
                className="rounded-xl cursor-pointer"
                style={{
                  background: isActive
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)'}`,
                  transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  // 极简 padding
                  padding: isExpanded ? '12px 16px' : '10px 14px',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isActive
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(255, 255, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isActive
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(255, 255, 255, 0.02)';
                }}
              >
                {/* 章节头部（单行紧凑） */}
                <div
                  className="flex items-center gap-2"
                  onClick={() => handleChapterClick(chapter.segment_index)}
                >
                  {/* 展开/收起图标 */}
                  <button
                    onClick={(e) => toggleChapter(idx, e)}
                    className="flex-shrink-0 p-1 rounded transition-transform"
                    style={{
                      color: isActive
                        ? 'rgba(212, 197, 185, 0.7)'
                        : 'rgba(255, 255, 255, 0.3)',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {/* 序号 - 更小 */}
                  <span
                    className="text-xs font-medium flex-shrink-0"
                    style={{
                      color: isActive
                        ? 'rgba(212, 197, 185, 0.8)'
                        : 'rgba(255, 255, 255, 0.35)',
                      minWidth: '16px',
                    }}
                  >
                    {idx + 1}
                  </span>

                  {/* 时间戳 - 更小更紧凑 */}
                  {startTime !== undefined && startTime !== null && (
                    <span
                      className="text-xs flex-shrink-0"
                      style={{
                        fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
                        color: 'rgba(255, 255, 255, 0.3)',
                        minWidth: '36px',
                      }}
                    >
                      {formatTime(startTime)}
                    </span>
                  )}

                  {/* 章节标题 */}
                  <span
                    className="text-sm font-medium truncate"
                    style={{
                      color: isActive
                        ? 'rgba(232, 232, 232, 0.95)'
                        : 'rgba(232, 232, 232, 0.65)',
                      transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                  >
                    {chapter.title}
                  </span>

                  {/* 要点数量提示（未展开时） */}
                  {!isExpanded && chapter.points && chapter.points.length > 0 && (
                    <span
                      className="text-xs ml-auto flex-shrink-0"
                      style={{
                        color: 'rgba(255, 255, 255, 0.25)',
                      }}
                    >
                      {chapter.points.length} 个要点
                    </span>
                  )}
                </div>

                {/* 章节标题翻译（双语模式） */}
                {hasTranslation && translation?.title && (
                  <div
                    className="text-xs mt-1 ml-7 truncate"
                    style={{
                      color: isActive
                        ? 'rgba(212, 197, 185, 0.65)'
                        : 'rgba(212, 197, 185, 0.45)',
                    }}
                  >
                    {translation.title}
                  </div>
                )}

                {/* 章节要点（展开时显示） */}
                {isExpanded && chapter.points && chapter.points.length > 0 && (
                  <div
                    className="mt-3 pt-3"
                    style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      marginLeft: '28px',
                    }}
                  >
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {chapter.points.map((point, pointIdx) => {
                        const translatedPoint = hasTranslation && translation
                          ? translation.points[pointIdx]
                          : null;

                        return (
                          <li
                            key={pointIdx}
                            className="text-xs flex items-start gap-2"
                            style={{
                              lineHeight: 1.7,
                              color: isActive
                                ? 'rgba(232, 232, 232, 0.7)'
                                : 'rgba(232, 232, 232, 0.45)',
                            }}
                          >
                            <span
                              className="flex-shrink-0 mt-0.5"
                              style={{
                                color: isActive
                                  ? 'rgba(212, 197, 185, 0.5)'
                                  : 'rgba(212, 197, 185, 0.3)',
                              }}
                            >
                              •
                            </span>
                            <span className="flex-1">
                              {point}
                              {translatedPoint && (
                                <span
                                  style={{
                                    color: isActive
                                      ? 'rgba(212, 197, 185, 0.65)'
                                      : 'rgba(212, 197, 185, 0.45)',
                                    marginLeft: '6px',
                                  }}
                                >
                                   / {translatedPoint}
                                </span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes breathe {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};
