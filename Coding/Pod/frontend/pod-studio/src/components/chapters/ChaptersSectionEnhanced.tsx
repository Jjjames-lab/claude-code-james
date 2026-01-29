/**
 * ChaptersSectionEnhanced - 章节展示组件
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：克制、清晰、不抢眼
 */

import { useState, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { formatTime } from '../../utils';
import { usePlayerStore } from '../../stores/playerStore';

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
  const { currentTime } = usePlayerStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      {/* 生成按钮 - 克制的设计 */}
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

      {/* 加载状态 - 缓慢的呼吸灯 */}
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

      {/* 错误状态 - 温和的提示 */}
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

      {/* 章节列表 */}
      {chapters && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {chapters.chapters.map((chapter, idx) => {
            const segment = transcript[chapter.segment_index];
            const startTime = segment?.startTime;
            const isActive = idx === activeChapterIndex;

            return (
              <div
                key={idx}
                onClick={() => handleChapterClick(chapter.segment_index)}
                className="p-5 rounded-xl cursor-pointer"
                style={{
                  background: isActive
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  // 悬停时微妙右移
                  transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                }}
              >
                {/* 章节头部 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* 序号 */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium"
                      style={{
                        background: isActive
                          ? 'rgba(212, 197, 185, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        color: isActive
                          ? 'rgba(212, 197, 185, 0.9)'
                          : 'rgba(255, 255, 255, 0.4)',
                        transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      }}
                    >
                      {idx + 1}
                    </div>

                    {/* 时间戳 */}
                    {startTime !== undefined && startTime !== null && (
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
                          color: 'rgba(255, 255, 255, 0.4)',
                          transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        }}
                      >
                        <Clock className="w-3 h-3" />
                        {formatTime(startTime)}
                      </div>
                    )}
                  </div>
                </div>

                {/* 章节标题 */}
                <h3
                  className="text-base font-medium mb-3 leading-snug"
                  style={{
                    color: isActive
                      ? 'rgba(232, 232, 232, 0.95)'
                      : 'rgba(232, 232, 232, 0.7)',
                    transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                >
                  {chapter.title}
                </h3>

                {/* 章节要点 */}
                {chapter.points && chapter.points.length > 0 && (
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {chapter.points.map((point, pointIdx) => (
                      <li
                        key={pointIdx}
                        className="text-sm flex items-start gap-2"
                        style={{
                          lineHeight: 1.6,
                          color: isActive
                            ? 'rgba(232, 232, 232, 0.6)'
                            : 'rgba(232, 232, 232, 0.4)',
                          transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        }}
                      >
                        <span
                          className="flex-shrink-0 mt-0.5 text-xs"
                          style={{
                            color: isActive
                              ? 'rgba(212, 197, 185, 0.6)'
                              : 'rgba(255, 255, 255, 0.2)',
                          }}
                        >
                          •
                        </span>
                        <span className="flex-1">{point}</span>
                      </li>
                    ))}
                  </ul>
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
