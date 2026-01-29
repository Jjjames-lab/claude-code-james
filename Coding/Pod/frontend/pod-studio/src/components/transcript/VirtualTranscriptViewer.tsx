/**
 * VirtualTranscriptViewer - 虚拟化逐字稿展示组件
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：高性能、舒适阅读、不抢眼
 *
 * 使用 react-window 实现虚拟滚动，优化大量数据的渲染性能
 */

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { List } from 'react-window';
import { MessageSquare } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useNoteStore } from '../../stores/noteStore';
import { formatTime } from '../../utils';
import type { TranscriptSegment } from '../../types';

interface VirtualTranscriptViewerProps {
  segments: TranscriptSegment[];
  highlightedSegmentId?: string | null;
  podcastId?: string;
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

export const VirtualTranscriptViewer = ({
  segments,
  highlightedSegmentId,
  podcastId
}: VirtualTranscriptViewerProps) => {
  const { currentTime, seek, isPlaying } = usePlayerStore();
  const { selectedText, setSelectedText, openNoteInput, filterNotes } = useNoteStore();
  const [hoveredSentence, setHoveredSentence] = useState<string | null>(null);
  const [clickedSentence, setClickedSentence] = useState<string | null>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const listRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousIndexRef = useRef<number>(-1);
  const itemSizeCache = useRef<Map<number, number>>(new Map());

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

  // 计算当前应该高亮的段落索引
  const activeIndex = useMemo(() => {
    return segments.findIndex(
      (segment) => currentTime >= segment.startTime && currentTime <= segment.endTime
    );
  }, [segments, currentTime]);

  // 计算每个项目的高度
  const getItemSize = useCallback((index: number) => {
    // 检查缓存
    if (itemSizeCache.current.has(index)) {
      return itemSizeCache.current.get(index)!;
    }

    // 估算高度：基础 padding + 内容高度
    const baseHeight = 32; // padding (16px * 2)
    const lineHeight = 32.4; // 18px * 1.8
    const segment = segments[index];

    // 根据文字长度估算行数
    const textLength = segment?.text?.length || 0;
    const estimatedLines = Math.ceil(textLength / 50); // 假设每行约50个字符
    const contentHeight = estimatedLines * lineHeight;

    // 时间戳高度
    const timestampHeight = 32;

    // 笔记标识高度（如果有笔记）
    const noteBadgeHeight = hasNoteAtTimestamp(segment?.startTime || 0) ? 32 : 0;

    const totalHeight = baseHeight + timestampHeight + noteBadgeHeight + contentHeight + 16; // 16px extra spacing

    // 缓存结果
    itemSizeCache.current.set(index, totalHeight);

    return totalHeight;
  }, [segments, hasNoteAtTimestamp]);

  // 渲染单个段落
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const segment = segments[index];
    const isActive = index === activeIndex;
    const isHighlighted = highlightedSegmentId === segment.id;

    return (
      <div style={style}>
        <div
          id={`segment-${segment.id}`}
          data-segment-index={index}
          className="transition-all duration-250"
          style={{
            ...(isActive || isHighlighted ? {
              backgroundColor: 'rgba(212, 197, 185, 0.08)',
              borderRadius: '8px',
              padding: '16px 20px',
            } : {
              padding: '16px 20px',
            }),
            transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {/* 时间戳和笔记标识 */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-xs font-mono cursor-pointer hover:underline"
              style={{
                color: 'rgba(255, 255, 255, 0.3)',
                fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
                transition: 'color 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
              onClick={() => seek(segment.startTime)}
              title={`跳转到 ${formatTime(segment.startTime)}`}
            >
              {formatTime(segment.startTime)}
            </span>

            {/* 笔记标识 */}
            {hasNoteAtTimestamp(segment.startTime) && (
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(212, 197, 185, 0.08)',
                  color: 'rgba(212, 197, 185, 0.6)',
                  border: '1px solid rgba(212, 197, 185, 0.15)',
                  transition: 'all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(212, 197, 185, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(212, 197, 185, 0.15)';
                }}
                onClick={() => {
                  const notesSection = document.querySelector('[data-notes-section]');
                  if (notesSection) {
                    notesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                title={`该段落有 ${getNoteCountAtTimestamp(segment.startTime)} 条笔记`}
              >
                <MessageSquare className="w-3 h-3" style={{ width: '12px', height: '12px' }} />
                <span>{getNoteCountAtTimestamp(segment.startTime)}</span>
              </div>
            )}
          </div>

          {/* 转录文字 */}
          <div
            style={{
              color: 'rgba(232, 232, 232, 0.9)',
              fontSize: '18px',
              lineHeight: 1.8,
            }}
          >
            {segment.text}
          </div>
        </div>
      </div>
    );
  }, [segments, activeIndex, highlightedSegmentId, seek, hasNoteAtTimestamp, getNoteCountAtTimestamp]);

  // 滚动到高亮段落
  useEffect(() => {
    if (!highlightedSegmentId || !listRef.current) return;

    const index = segments.findIndex(s => s.id === highlightedSegmentId);
    if (index >= 0) {
      listRef.current.scrollToItem(index, 'center');
    }
  }, [highlightedSegmentId, segments]);

  // 自动滚动到当前播放的段落
  useEffect(() => {
    if (!isPlaying) return;
    if (activeIndex === previousIndexRef.current) return;
    if (activeIndex < 0) return;

    previousIndexRef.current = activeIndex;

    if (listRef.current) {
      listRef.current.scrollToItem(activeIndex, 'center');
    }
  }, [activeIndex, isPlaying]);

  return (
    <div className="w-full" ref={containerRef}>
      <div className="max-w-2xl mx-auto">
        <div style={{ height: 'calc(100vh - 16rem)' }}>
          <List
            ref={listRef}
            width="100%"
            height={window.innerHeight - 256} // calc(100vh - 16rem)
            rowHeight={getItemSize}
            rowCount={segments.length}
            overscanCount={5}
          >
            {Row}
          </List>
        </div>
      </div>
    </div>
  );
};
