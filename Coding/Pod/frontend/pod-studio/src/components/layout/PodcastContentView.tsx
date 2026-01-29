import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { ChaptersSectionEnhanced } from '../chapters/ChaptersSectionEnhanced';
import { TranscriptViewer } from '../transcript/TranscriptViewer';
import type { TranscriptSegment } from '../../types';

interface PodcastContentViewProps {
  transcript: TranscriptSegment[];
  chapters: any;
  setChapters: (chapters: any) => void;
  onChapterClick?: (time: number) => void;
  highlightedSegmentId?: string | null;
  children?: React.ReactNode;
}

export const PodcastContentView = ({
  transcript,
  chapters,
  setChapters,
  onChapterClick,
  highlightedSegmentId,
  children,
}: PodcastContentViewProps) => {
  const [overviewCollapsed, setOverviewCollapsed] = useState(true); // 默认收起

  return (
    <div className="podcast-content-view flex flex-col h-full space-y-4">
      {/* 概览区域 - 可折叠 */}
      {children && (
        <div className="card-enhanced rounded-xl overflow-hidden">
          {/* 概览标题栏 - 始终显示 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">
              节目概览
            </h2>
            <button
              onClick={() => setOverviewCollapsed(!overviewCollapsed)}
              className="p-1 rounded-md hover:bg-white/10 transition-all"
            >
              {overviewCollapsed ? (
                <ChevronDown className="w-5 h-5 text-white" />
              ) : (
                <ChevronUp className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* 概览内容 - 可折叠 */}
          <div
            className={`transition-all duration-300 overflow-y-auto ${
              overviewCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100 p-6'
            }`}
          >
            {children}
          </div>
        </div>
      )}

      {/* 章节和逐字稿的并行布局 */}
      <div className="content-grid grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* 左侧: 章节导航 (固定, 独立滚动) */}
        <div className="chapters-sidebar">
          <div className="card-enhanced rounded-xl p-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                章节
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {chapters?.length || 0} 个
              </span>
            </div>
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-2">
              <ChaptersSectionEnhanced
                transcript={transcript}
                chapters={chapters}
                setChapters={setChapters}
                onChapterClick={onChapterClick}
              />
            </div>
          </div>
        </div>

        {/* 右侧: 逐字稿 (独立滚动) */}
        <div className="transcript-main">
          <div className="card-enhanced rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                逐字稿
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {transcript.length} 个段落
              </span>
            </div>
            <TranscriptViewer
              segments={transcript}
              highlightedSegmentId={highlightedSegmentId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
