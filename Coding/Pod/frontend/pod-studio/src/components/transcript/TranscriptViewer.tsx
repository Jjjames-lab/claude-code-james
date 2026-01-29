/**
 * TranscriptViewer - 逐字稿展示组件
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：舒适阅读、不抢眼、尊重内容
 */

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useNoteStore } from '../../stores/noteStore';
import { formatTime } from '../../utils';
import type { TranscriptSegment } from '../../types';

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  highlightedSegmentId?: string | null;
  podcastId?: string;  // 新增：用于获取该播客的笔记
}

// 句子片段类型
interface SentenceFragment {
  text: string;
  startTime: number;
  endTime: number;
  words: any[];
}

// 选中的文字状态
interface SelectionState {
  text: string;
  startOffset: number;
  endOffset: number;
  timestamp: number;
  rect: DOMRect | null;
}

export const TranscriptViewer = ({ segments, highlightedSegmentId, podcastId }: TranscriptViewerProps) => {
  const { currentTime, seek, isPlaying } = usePlayerStore();
  const { selectedText, setSelectedText, openNoteInput, notes, filterNotes } = useNoteStore();
  const [hoveredSentence, setHoveredSentence] = useState<string | null>(null);
  const [clickedSentence, setClickedSentence] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousIndexRef = useRef<number>(-1);

  // 获取当前播客的笔记
  const podcastNotes = useMemo(() => {
    if (!podcastId) return [];
    return filterNotes(podcastId, {
      sortBy: 'timestamp',
      sortOrder: 'asc',
    });
  }, [podcastId, filterNotes]);

  // 检查某个时间戳是否有笔记
  const hasNoteAtTimestamp = useCallback((timestamp: number) => {
    const tolerance = 5000; // 5秒容差
    return podcastNotes.some(note =>
      Math.abs(note.timestamp - timestamp) < tolerance
    );
  }, [podcastNotes]);

  // 获取某个时间戳的笔记数量
  const getNoteCountAtTimestamp = useCallback((timestamp: number) => {
    const tolerance = 5000;
    return podcastNotes.filter(note =>
      Math.abs(note.timestamp - timestamp) < tolerance
    ).length;
  }, [podcastNotes]);

  // 滚动到高亮段落
  useEffect(() => {
    if (!highlightedSegmentId || !containerRef.current) return;

    const targetElement = document.getElementById(`segment-${highlightedSegmentId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedSegmentId]);

  // 计算当前应该高亮的段落索引
  const activeIndex = useMemo(() => {
    return segments.findIndex(
      (segment) => currentTime >= segment.startTime && currentTime <= segment.endTime
    );
  }, [segments, currentTime]);

  // 自动滚动到当前播放的段落（仅在播放时）
  useEffect(() => {
    if (!isPlaying) return;
    if (activeIndex === previousIndexRef.current) return;
    if (activeIndex < 0) return;

    previousIndexRef.current = activeIndex;

    const container = containerRef.current;
    if (!container) return;

    const activeElement = container.querySelector(`[data-segment-index="${activeIndex}"]`);
    if (!activeElement) return;

    activeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [activeIndex, isPlaying]);

  // 将段落拆分成句子片段
  const segmentSentences = useMemo(() => {
    return segments.map((segment) => {
      const sentences: SentenceFragment[] = [{
        text: segment.text,
        startTime: segment.startTime,
        endTime: segment.endTime,
        words: segment.words || []
      }];

      return { segment, sentences };
    });
  }, [segments]);

  // 处理句子悬停
  const handleSentenceMouseEnter = useCallback((sentenceId: string) => {
    setHoveredSentence(sentenceId);
  }, []);

  const handleSentenceMouseLeave = useCallback(() => {
    setHoveredSentence(null);
  }, []);

  // 处理句子点击
  const handleSentenceClick = useCallback((sentenceId: string, startTime: number) => {
    seek(startTime);

    setClickedSentence(sentenceId);

    // 2秒后清除高亮
    setTimeout(() => {
      setClickedSentence(null);
    }, 2000);
  }, [seek]);

  // 检测文字选择
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (!selectedText) {
      setSelection(null);
      return;
    }

    const range = selection.getRangeAt(0);
    if (!range) return;

    const rect = range.getBoundingClientRect();
    const container = containerRef.current;
    if (!container) return;

    // 找到选中的文字对应的时间戳
    const segmentElement = range.commonAncestorContainer.parentElement?.closest('[data-segment-index]');
    if (!segmentElement) return;

    const segmentIndex = parseInt(segmentElement.getAttribute('data-segment-index') || '0');
    const segment = segments[segmentIndex];
    if (!segment) return;

    setSelection({
      text: selectedText,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      timestamp: segment.startTime,
      rect,
    });
  }, [segments]);

  // 清除文字选择
  const clearSelection = useCallback(() => {
    window.getSelection().removeAllRanges();
    setSelection(null);
  }, []);

  // 点击"添加笔记"按钮
  const handleAddNote = useCallback(() => {
    if (!selection) return;

    setSelectedText(selection.text, selection.timestamp);
    openNoteInput();

    // 清除选择
    clearSelection();
  }, [selection, setSelectedText, openNoteInput, clearSelection]);

  // 点击页面其他地方清除选择
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const container = containerRef.current;

      if (container && !container.contains(target)) {
        clearSelection();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearSelection]);

  return (
    <div className="w-full h-full" onMouseUp={handleMouseUp}>
      {/* 文字稿容器 - 直接使用父容器高度 */}
      <div
        ref={containerRef}
        className="overflow-y-auto pr-2"
        style={{
          fontSize: '16px',
          lineHeight: 1.8,
          height: '100%',
        }}
      >
        {segmentSentences.map(({ segment, sentences }, segIndex) => {
            const isActive = segIndex === activeIndex;
            const isHighlighted = highlightedSegmentId === segment.id;

            return (
              <div
                key={segment.id}
                id={`segment-${segment.id}`}
                data-segment-index={segIndex}
                className="group transition-all duration-250"
                style={{
                  // 当前播放的段落有极淡背景
                  ...(isActive || isHighlighted ? {
                    backgroundColor: 'rgba(212, 197, 185, 0.05)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    margin: '4px 0',
                  } : {
                    padding: '4px 12px',
                    margin: '2px 0',
                  }),
                  transition: 'all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              >
                {/* 时间戳和笔记标识 - 极简 */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-mono cursor-pointer hover:underline"
                    style={{
                      color: 'rgba(255, 255, 255, 0.25)',
                    }}
                    onClick={() => seek(segment.startTime)}
                    title={`跳转到 ${formatTime(segment.startTime)}`}
                  >
                    {formatTime(segment.startTime)}
                  </span>

                  {/* 笔记标识 */}
                  {hasNoteAtTimestamp(segment.startTime) && (
                    <div
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer text-xs"
                      style={{
                        backgroundColor: 'rgba(212, 197, 185, 0.08)',
                        color: 'rgba(212, 197, 185, 0.7)',
                      }}
                      title={`该段落有 ${getNoteCountAtTimestamp(segment.startTime)} 条笔记`}
                    >
                      <MessageSquare className="w-3 h-3" style={{ width: '11px', height: '11px' }} />
                      <span>{getNoteCountAtTimestamp(segment.startTime)}</span>
                    </div>
                  )}
                </div>

                {/* 转录文字 - 舒适阅读 */}
                <div style={{ color: 'rgba(232, 232, 232, 0.9)' }}>
                  {sentences.map((sentence, sentIndex) => {
                    const sentenceId = `${segment.id}-${sentIndex}`;
                    const isHovered = hoveredSentence === sentenceId;
                    const isClicked = clickedSentence === sentenceId;

                    return (
                      <span
                        key={sentenceId}
                        onMouseEnter={() => handleSentenceMouseEnter(sentenceId)}
                        onMouseLeave={handleSentenceMouseLeave}
                        onClick={() => handleSentenceClick(sentenceId, sentence.startTime)}
                        className="transition-all duration-150 cursor-pointer"
                        style={{
                          // 极淡的高亮
                          ...(isHovered || isClicked ? {
                            backgroundColor: 'rgba(212, 197, 185, 0.15)',
                            borderRadius: '4px',
                            padding: '2px 4px',
                            margin: '0 -4px',
                          } : {}),
                        }}
                        title={`点击跳转至 ${formatTime(sentence.startTime)}`}
                      >
                        {sentence.text}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}

        {/* 底部留白 */}
        <div style={{ height: '128px' }} />
      </div>

      {/* 浮动的"添加笔记"按钮 */}
      {selection && selection.rect && (
        <div
          className="fixed z-[100] px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 cursor-pointer transition-all duration-250"
          style={{
            top: `${selection.rect.top - 50}px`,
            left: `${selection.rect.left + (selection.rect.width / 2) - 80}px`,
            backgroundColor: 'rgba(212, 197, 185, 0.95)',
            color: '#0f0f11',
            transform: 'translateX(-50%)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          }}
          onClick={handleAddNote}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          }}
        >
          <span className="text-sm">💭</span>
          <span className="text-sm font-medium">添加笔记</span>
        </div>
      )}
    </div>
  );
};
