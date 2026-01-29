import { useState, useRef } from 'react';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { parseEpisode, parsePodcast } from '../../services/api';

interface UrlInputEnhancedProps {
  onEpisodeParsed: (data: {
    episodeId: string;
    episodeTitle: string;
    podcastName: string;
    audioUrl: string;
    duration: number;
    coverImage: string;
    showNotes: string;
  }) => void;
  onPodcastParsed?: (data: {
    podcastId: string;
    podcastName: string;
    hostName: string;
    description: string;
    logo: string;
    episodes: Array<{
      episodeId: string;
      episodeTitle: string;
      audioUrl: string;
      duration: number;
      coverImage: string;
      showNotes: string;
      createdAt: string;
    }>;
    totalEpisodes: number;
  }) => void;
}

export const UrlInputEnhanced = ({ onEpisodeParsed, onPodcastParsed }: UrlInputEnhancedProps) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError('请输入小宇宙链接');
      return;
    }

    if (!url.includes('xiaoyuzhou')) {
      setError('请输入有效的小宇宙播客链接');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 检测 URL 类型
      const isPodcastUrl = url.includes('/podcast/');

      if (isPodcastUrl) {
        // 播客主页链接
        if (!onPodcastParsed) {
          setError('暂不支持播客主页链接');
          return;
        }

        const result = await parsePodcast(url);

        onPodcastParsed({
          podcastId: result.podcast_id,
          podcastName: result.podcast_name,
          hostName: result.host_name,
          description: result.description,
          logo: result.logo,
          episodes: result.episodes.map(ep => ({
            episodeId: ep.episode_id,
            episodeTitle: ep.episode_title,
            audioUrl: ep.audio_url,
            duration: ep.duration,
            coverImage: ep.cover_image,
            showNotes: ep.show_notes,
            createdAt: ep.created_at,
          })),
          totalEpisodes: result.total_episodes,
        });
      } else {
        // 单集链接
        const result = await parseEpisode(url);

        onEpisodeParsed({
          episodeId: result.episode_id,
          episodeTitle: result.episode_title,
          podcastName: result.podcast_name,
          audioUrl: result.audio_url,
          duration: result.duration,
          coverImage: result.cover_image,
          showNotes: result.show_notes,
        });
      }

      setUrl('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('解析失败，请检查链接是否正确');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim() && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* 装饰性光晕 */}
      <div
        className={`absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 rounded-3xl blur-xl transition-opacity duration-500 ${
          isFocused ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 主输入框 */}
      <div
        className={`relative transition-all duration-500 ease-out ${
          isFocused ? 'scale-[1.02]' : 'scale-100'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 输入容器 */}
        <div
          className={`relative backdrop-blur-xl bg-white/5 border-2 rounded-3xl transition-all duration-300 ${
            isFocused
              ? 'border-white/20 shadow-2xl shadow-purple-500/10'
              : isHovered
              ? 'border-white/15 shadow-xl'
              : 'border-white/10 shadow-lg'
          }`}
        >
          {/* 图标 */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2">
            <div
              className={`transition-all duration-300 ${
                isFocused ? 'scale-110 rotate-12' : 'scale-100 rotate-0'
              }`}
            >
              <Sparkles className="w-6 h-6 text-violet-400" />
            </div>
          </div>

          {/* 输入框 */}
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="粘贴链接..."
            className="w-full h-20 px-20 pr-40 bg-transparent text-white text-lg placeholder:text-white/40 focus:outline-none transition-all duration-300"
          />

          {/* 字符计数 */}
          <div className="absolute right-40 top-1/2 -translate-y-1/2 text-xs text-white/30 font-mono">
            {url.length > 0 && `${url.length} 字符`}
          </div>

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={!url.trim() || isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-14 px-8 rounded-2xl font-semibold text-base transition-all duration-300 flex items-center gap-2 ${
              url.trim() && !isLoading && (isFocused || isHovered)
                ? 'bg-white text-black scale-105 shadow-xl'
                : url.trim() && !isLoading
                ? 'bg-white/90 text-black shadow-lg'
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>解析中...</span>
              </>
            ) : (
              <>
                <span>发送</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 px-6 py-3 bg-red-500/10 border border-red-400/30 rounded-xl text-red-300 text-sm text-center animate-shake">
            {error}
          </div>
        )}

        {/* 装饰性边角 */}
        {isFocused && (
          <>
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-violet-400/50 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-fuchsia-400/50 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-purple-400/50 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-pink-400/50 rounded-br-lg" />
          </>
        )}
      </div>
    </div>
  );
};

// 添加动画关键帧
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
  }

  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
`;
document.head.appendChild(style);
