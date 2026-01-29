/**
 * TranscriptViewer - 逐字稿展示组件
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：阅读器风格 - 文字优先，微妙提示
 */

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { MessageSquare, PenTool } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useNoteStore } from '../../stores/noteStore';
import { formatTime } from '../../utils';
import type { TranscriptSegment } from '../../types';

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  highlightedSegmentId?: string | null;
  podcastId?: string;
}

// 合并后的段落类型
interface MergedParagraph {
  segments: TranscriptSegment[];
  startTime: number;
  endTime: number;
  text: string;
  id: string;
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
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastActiveIndexRef = useRef<number>(-1);
  const lastScrollTimeRef = useRef<number>(0);

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
    const tolerance = 5000;
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

  // 合并段落：每 3-5 个 segment 合并为一个段落（约 100-200 字）
  const mergedParagraphs = useMemo(() => {
    const paragraphs: MergedParagraph[] = [];
    let currentParagraph: TranscriptSegment[] = [];
    let currentLength = 0;

    segments.forEach((segment) => {
      const segmentLength = segment.text.length;

      // 如果当前段落已经够长，或者遇到明显的段落分隔（空行），就开始新段落
      if (currentLength > 0 && (currentLength > 150 || segment.text.startsWith('\n'))) {
        paragraphs.push({
          segments: currentParagraph,
          startTime: currentParagraph[0].start,
          endTime: currentParagraph[currentParagraph.length - 1].end,
          text: currentParagraph.map(s => s.text).join(''),
          id: currentParagraph[0].id,
        });
        currentParagraph = [];
        currentLength = 0;
      }

      currentParagraph.push(segment);
      currentLength += segmentLength;
    });

    // 添加最后一个段落
    if (currentParagraph.length > 0) {
      paragraphs.push({
        segments: currentParagraph,
        startTime: currentParagraph[0].start,
        endTime: currentParagraph[currentParagraph.length - 1].end,
        text: currentParagraph.map(s => s.text).join(''),
        id: currentParagraph[0].id,
      });
    }

    return paragraphs;
  }, [segments]);

  // 计算当前应该高亮的段落索引
  const activeParagraphIndex = useMemo(() => {
    return mergedParagraphs.findIndex(
      (para) => currentTime >= para.startTime && currentTime <= para.endTime
    );
  }, [mergedParagraphs, currentTime]);

  // 滚动到高亮段落（手动跳转时）
  useEffect(() => {
    if (!highlightedSegmentId || !containerRef.current) return;

    const targetElement = document.getElementById(`paragraph-${highlightedSegmentId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedSegmentId]);

  // 自动滚动到当前播放的段落
  useEffect(() => {
    // 防抖：避免频繁滚动
    const now = Date.now();
    if (now - lastScrollTimeRef.current < 500) return;

    if (activeParagraphIndex < 0) return;
    if (activeParagraphIndex === lastActiveIndexRef.current) return;

    // 更新缓存和时间
    lastActiveIndexRef.current = activeParagraphIndex;
    lastScrollTimeRef.current = now;

    const container = containerRef.current;
    if (!container) return;

    const activeElement = container.querySelector(`[data-paragraph-index="${activeParagraphIndex}"]`);
    if (!activeElement) return;

    // 平滑滚动到视口中心
    activeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [activeParagraphIndex]);

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
    const segmentElement = range.commonAncestorContainer.parentElement?.closest('[data-start-time]');
    if (!segmentElement) return;

    const timestamp = parseFloat(segmentElement.getAttribute('data-start-time') || '0');
    if (isNaN(timestamp)) return;

    setSelection({
      text: selectedText,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      timestamp,
      rect,
    });
  }, []);

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
      {/* 文字稿容器 */}
      <div
        ref={containerRef}
        className="overflow-y-auto pr-2"
        style={{
          fontSize: '17px',
          lineHeight: 1.9,
          height: '100%',
        }}
      >
        {mergedParagraphs.map((paragraph, paraIndex) => {
          const isActive = paraIndex === activeParagraphIndex;

          return (
            <div
              key={paragraph.id || `paragraph-${paraIndex}`}
              id={`paragraph-${paragraph.id || paraIndex}`}
              data-paragraph-index={paraIndex}
              data-start-time={paragraph.startTime}
              className="group relative"
              style={{
                padding: '12px 16px',
                margin: '8px 0',
                // 当前段落：明显的视觉提示
                ...(isActive ? {
                  backgroundColor: 'rgba(212, 197, 185, 0.08)',
                  borderLeft: '4px solid rgba(212, 197, 185, 0.8)',
                  paddingLeft: '12px',
                  borderRadius: '4px',
                } : {
                  borderLeft: '4px solid transparent',
                  paddingLeft: '12px',
                }),
              }}
            >
              {/* 时间戳和笔记标识 - 常驻显示 */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs font-mono cursor-pointer hover:underline"
                  style={{
                    color: 'rgba(212, 197, 185, 0.6)',
                  }}
                  onClick={() => seek(paragraph.startTime)}
                  title={`跳转到 ${formatTime(paragraph.startTime)}`}
                >
                  {formatTime(paragraph.startTime)}
                </span>

                {/* 笔记标识 */}
                {paragraph.segments.some(seg => {
                  const segStart = seg.start;  // 使用 start 字段
                  return hasNoteAtTimestamp(segStart);
                }) && (
                  <div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer text-xs"
                    style={{
                      backgroundColor: 'rgba(212, 197, 185, 0.1)',
                      color: 'rgba(212, 197, 185, 0.8)',
                    }}
                    title={`该段落有笔记`}
                  >
                    <MessageSquare className="w-3 h-3" style={{ width: '11px', height: '11px' }} />
                  </div>
                )}
              </div>

              {/* 转录文字 */}
              <div
                style={{
                  color: isActive ? 'rgba(232, 232, 232, 1)' : 'rgba(232, 232, 232, 0.85)',
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {paragraph.segments.map((segment, segIndex) => (
                  <span
                    key={`${paragraph.id || paraIndex}-${segIndex}`}
                    data-start-time={segment.start}
                    onClick={() => seek(segment.start)}
                    title={`跳转到 ${formatTime(segment.start)}`}
                  >
                    {segment.text}
                  </span>
                ))}
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
          <PenTool className="w-4 h-4" />
          <span className="text-sm font-medium">添加笔记</span>
        </div>
      )}
    </div>
  );
};
