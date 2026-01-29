import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Clock, User, Calendar } from 'lucide-react';
import { EpisodeListItem } from '../components/podcast/EpisodeListItem';
import { checkProcessedStatus } from '../utils/episodeStorage';
import { parsePodcast } from '../services/api';

interface PodcastData {
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
}

export const PodcastDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [podcastData, setPodcastData] = useState<PodcastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 检查路由传递的数据或从 API 获取
  useEffect(() => {
    const loadPodcastData = async () => {
      if (!id) return;

      // 优先使用路由传递的数据
      if (location.state?.podcastData) {
        setPodcastData(location.state.podcastData);
        setLoading(false);
        return;
      }

      // 否则从 API 获取
      try {
        setLoading(true);
        setError(null);

        // 构造播客 URL
        const podcastUrl = `https://www.xiaoyuzhoufm.com/podcast/${id}`;
        const result = await parsePodcast(podcastUrl, 5, 0); // 初始加载5集

        setPodcastData({
          podcastId: result.podcast_id,
          podcastName: result.podcast_name,
          hostName: result.host_name,
          description: result.description,
          logo: result.logo,
          episodes: result.episodes.map((ep: any) => ({
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

        // 检查是否还有更多
        setHasMore(result.episodes.length < result.total_episodes);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '加载播客信息失败';
        setError(errorMsg);
        console.error('Error loading podcast:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPodcastData();
  }, [id, location.state]);

  // 处理单集点击
  const handleEpisodeClick = (episodeId: string) => {
    navigate(`/episode/${episodeId}?view=tabs`);
  };

  // 返回上一页
  const handleBack = () => {
    navigate(-1);
  };

  // 加载更多节目
  const handleLoadMore = async () => {
    if (!podcastData || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);

      const podcastUrl = `https://www.xiaoyuzhoufm.com/podcast/${id}`;
      const result = await parsePodcast(
        podcastUrl,
        5, // 每次加载5集
        podcastData.episodes.length // 从当前数量开始
      );

      // 追加新节目
      const newEpisodes = result.episodes.map((ep: any) => ({
        episodeId: ep.episode_id,
        episodeTitle: ep.episode_title,
        audioUrl: ep.audio_url,
        duration: ep.duration,
        coverImage: ep.cover_image,
        showNotes: ep.show_notes,
        createdAt: ep.created_at,
      }));

      setPodcastData({
        ...podcastData,
        episodes: [...podcastData.episodes, ...newEpisodes],
      });

      // 检查是否还有更多
      setHasMore(podcastData.episodes.length + newEpisodes.length < result.total_episodes);
    } catch (err) {
      console.error('Error loading more episodes:', err);
      alert('加载更多失败，请重试');
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-red-400 text-lg mb-4">{error}</div>
        <button
          onClick={handleBack}
          className="px-6 py-3 rounded-xl text-white font-medium"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          返回首页
        </button>
      </div>
    );
  }

  if (!podcastData) {
    return null;
  }

  return (
    <div className="min-h-screen py-12 px-6">
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* 返回按钮 */}
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={handleBack}
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          ← 返回上一页
        </button>
      </div>

      {/* 播客信息 */}
      <div className="max-w-4xl mx-auto mb-8">
        <div
          className="p-8 rounded-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Logo 和基本信息 */}
          <div className="flex gap-8 mb-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div
                className="w-32 h-32 rounded-xl overflow-hidden"
                style={{
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(212, 197, 185, 0.2)',
                }}
              >
                {podcastData.logo ? (
                  <img
                    src={podcastData.logo}
                    alt={podcastData.podcastName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-500">
                    <span className="text-white text-5xl font-bold">
                      {podcastData.podcastName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 播客信息 */}
            <div className="flex-1">
              {/* 播客名称 */}
              <h1 className="text-4xl font-bold text-white mb-3">
                {podcastData.podcastName}
              </h1>

              {/* 主播 */}
              {podcastData.hostName && (
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-4 h-4" style={{ color: 'rgba(212, 197, 185, 0.7)' }} />
                  <span className="text-sm" style={{ color: 'rgba(212, 197, 185, 0.7)' }}>
                    主播：{podcastData.hostName}
                  </span>
                </div>
              )}

              {/* 节目总数 */}
              <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{podcastData.totalEpisodes} 集节目</span>
                </div>
              </div>
            </div>
          </div>

          {/* 播客介绍 */}
          {podcastData.description && (
            <div
              className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap pt-6"
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {podcastData.description}
            </div>
          )}
        </div>
      </div>

      {/* 最新节目列表 */}
      <div className="max-w-4xl mx-auto">
        <h2
          className="text-sm font-medium mb-4 px-2"
          style={{ color: 'rgba(212, 197, 185, 0.7)' }}
        >
          最新节目（{podcastData.episodes.length}/{podcastData.totalEpisodes}期）
        </h2>

        <div className="space-y-3">
          {podcastData.episodes.map((episode) => {
            const processed = checkProcessedStatus(episode.episodeId);

            return (
              <EpisodeListItem
                key={episode.episodeId}
                episodeId={episode.episodeId}
                episodeTitle={episode.episodeTitle}
                coverImage={episode.coverImage}
                duration={episode.duration}
                createdAt={episode.createdAt}
                podcastName={podcastData.podcastName}
                processed={processed}
                variant="list"
                onClick={() => handleEpisodeClick(episode.episodeId)}
              />
            );
          })}
        </div>

        {/* 加载更多按钮 */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'rgba(212, 197, 185, 0.15)',
                color: 'rgba(212, 197, 185, 1)',
                border: '1px solid rgba(212, 197, 185, 0.25)',
              }}
            >
              {loadingMore ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
