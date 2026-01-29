import { Calendar, Clock, Play, Radio } from 'lucide-react';
import { formatTime } from '../../utils';

interface OverviewData {
  podcastName: string;
  episodeTitle: string;
  episodeDescription: string;
  coverImage: string;
  duration: number;
  publishDate: string;
  hostName?: string;
  tags?: string[];
}

interface OverviewSectionProps {
  data: OverviewData;
}

export const OverviewSection = ({ data }: OverviewSectionProps) => {
  return (
    <div className="overview-section space-y-8">
      {/* 顶部：封面图 + 基本信息 */}
      <div className="flex gap-5">
        {/* 封面图 */}
        <div className="flex-shrink-0">
          <div className="w-40 h-40 bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300">
            {data.coverImage ? (
              <img
                src={data.coverImage}
                alt={data.episodeTitle}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5">
                <Radio className="w-16 h-16 text-white/20" />
              </div>
            )}
          </div>
        </div>

        {/* 播客信息 */}
        <div className="flex-1 min-w-0">
          {/* 播客名称 */}
          <p className="text-sm font-medium text-violet-400 mb-2">
            {data.podcastName}
          </p>

          {/* 节目标题 */}
          <h1 className="text-2xl font-bold text-white mb-4 leading-tight">
            {data.episodeTitle}
          </h1>

          {/* 元信息行：日期 + 时长 + 播放按钮 */}
          <div className="flex items-center gap-4 text-sm text-slate-400">
            {/* 发布日期 */}
            {data.publishDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{data.publishDate}</span>
              </div>
            )}

            {/* 时长 */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatTime(data.duration)}</span>
            </div>

            {/* 播放按钮 */}
            <button
              className="ml-2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20
                       flex items-center justify-center
                       transition-all duration-200
                       hover:scale-105 active:scale-95
                       border border-white/10"
              aria-label="播放"
            >
              <Play className="w-5 h-5 text-white ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 分隔线 + Overview 标签 */}
      <div>
        <h2 className="text-lg font-semibold text-slate-300 mb-4">Overview</h2>
        <div className="border-t border-white/10" />
      </div>

      {/* 节目描述内容（Shownote的文本部分） */}
      {data.episodeDescription && (
        <div className="shownote-content text-base text-slate-300 leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: data.episodeDescription }} />
        </div>
      )}

      {/* 标签 */}
      {data.tags && data.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-white/10">
          {data.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1.5 text-xs font-medium
                       bg-violet-500/10 border border-violet-500/20
                       text-violet-300
                       rounded-lg
                       hover:bg-violet-500/20
                       transition-colors duration-200"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
