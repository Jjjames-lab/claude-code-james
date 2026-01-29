import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UrlInputEnhanced } from '../components/url/UrlInputEnhanced';

type AppState = 'input';

export const InputPage = () => {
  const navigate = useNavigate();
  const [appState] = useState<AppState>('input');

  // 处理链接解析成功（单集）
  const handleEpisodeParsed = (data: {
    episodeId: string;
    episodeTitle: string;
    podcastName: string;
    audioUrl: string;
    duration: number;
    coverImage: string;
    showNotes: string;
  }) => {
    // 跳转到单集 Tab 页面
    navigate(`/episode/${data.episodeId}`, {
      state: {
        episodeData: data,
      },
    });
  };

  // 处理播客主页解析成功
  const handlePodcastParsed = (data: {
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
  }) => {
    // 跳转到播客详情页
    navigate(`/podcast/${data.podcastId}`, {
      state: {
        podcastData: data,
      },
    });
  };

  return (
    <div className="min-h-screen">
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* 主要内容 */}
      <main className="relative z-10">
        {/* 输入页面 */}
        {appState === 'input' && (
          <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
            {/* 标题 */}
            <div className="text-center mb-12" style={{ animation: 'fadeInUp 400ms ease-out' }}>
              <h1 className="text-5xl font-bold text-white mb-4">
                Bookshelf Sounds
              </h1>
            </div>

            {/* URL 输入框 */}
            <div className="w-full max-w-2xl" style={{ animation: 'fadeInUp 400ms ease-out 100ms both' }}>
              <UrlInputEnhanced
                onEpisodeParsed={handleEpisodeParsed}
                onPodcastParsed={handlePodcastParsed}
              />
            </div>
          </div>
        )}
      </main>

      {/* 样式 */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
