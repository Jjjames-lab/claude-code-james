import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PodcastCard } from '../components/podcast/PodcastCard';
import { checkProcessedStatus, loadEpisodeData, saveEpisodeData } from '../utils/episodeStorage';
import { parseEpisode, startTranscription, generateChapters } from '../services/api';
import { AudioPlayerEnhanced } from '../components/audio/AudioPlayerEnhanced';
import { usePlayerStore } from '../stores/playerStore';
import { UrlInputEnhanced } from '../components/url/UrlInputEnhanced';
import { TranscriptViewer } from '../components/transcript/TranscriptViewer';
import { ChaptersSectionEnhanced } from '../components/chapters/ChaptersSectionEnhanced';
import type { ChapterData } from '../services/api';
import { Clock } from 'lucide-react';

// type TabKey = 'transcript' | 'chapters' | 'notes';

interface EpisodeData {
  episodeId: string;
  podcastId: string;
  episodeTitle: string;
  podcastName: string;
  coverImage: string;
  audioUrl: string;
  duration: number;
  showNotes: string;
}

export const EpisodeTabPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // 从 URL 查询参数获取视图模式
  const searchParams = new URLSearchParams(location.search);
  const viewMode = searchParams.get('view') === 'tabs' ? 'tabs' : 'cards';

  const [episodeData, setEpisodeData] = useState<EpisodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribingProgress, setTranscribingProgress] = useState<{
    stage: string;
    message: string;
    progress?: number;
  } | null>(null);

  // 保存的数据（从 LocalStorage 加载）
  const [savedData, setSavedData] = useState<any>(null);
  const [chapters, setChapters] = useState<ChapterData | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const { setCurrentPodcast } = usePlayerStore();

  // 加载单集数据
  useEffect(() => {
    const loadEpisode = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // 1. 检查是否已处理
        const processed = checkProcessedStatus(id);
        setIsProcessed(processed);

        // 2. 如果已处理，从 LocalStorage 加载
        if (processed) {
          const savedData = loadEpisodeData(id);
          if (savedData) {
            // 保存完整数据到状态
            setSavedData(savedData);

            // 保存章节数据
            if (savedData.chapters) {
              setChapters({ chapters: savedData.chapters });
            }

            // 检查是否有 podcastId，如果没有则重新调用 API
            if (!savedData.podcastId) {
              console.log('[EpisodeTabPage] LocalStorage 中的数据缺少 podcastId，重新调用 API');
              // 继续执行下面的 API 调用逻辑
            } else {
              setEpisodeData({
                episodeId: savedData.episodeId,
                podcastId: savedData.podcastId,
                episodeTitle: savedData.episodeTitle,
                podcastName: savedData.podcastName,
                coverImage: savedData.coverImage,
                audioUrl: savedData.audioUrl,
                duration: savedData.duration,
                showNotes: savedData.showNotes,
              });

              // 设置播放器
              setCurrentPodcast({
                id: savedData.episodeId,
                title: savedData.episodeTitle,
                description: savedData.podcastName,
                audioUrl: savedData.audioUrl,
                coverUrl: savedData.coverImage,
                duration: savedData.duration,
                createdAt: new Date().toISOString(),
                transcript: savedData.transcript || [],
              });

              setLoading(false);
              return;
            }
          }
        }

        // 3. 如果未处理或没有缓存，从 API 获取基本信息
        if (location.state?.episodeData && location.state.episodeData.podcastId) {
          // 使用路由传递的数据（只有当包含 podcastId 时才使用）
          const data = location.state.episodeData;
          setEpisodeData(data);

          // 设置播放器
          setCurrentPodcast({
            id: data.episodeId,
            title: data.episodeTitle,
            description: data.podcastName,
            audioUrl: data.audioUrl,
            coverUrl: data.coverImage,
            duration: data.duration,
            createdAt: new Date().toISOString(),
            transcript: [],
          });

          // 如果之前有保存的数据（但没有 podcastId），现在更新它
          const savedData = loadEpisodeData(id);
          if (savedData && savedData.transcript) {
            // 保留旧的转录数据，更新 podcastId
            saveEpisodeData({
              ...savedData,
              podcastId: data.podcastId,
            });
            console.log('[EpisodeTabPage] 已更新 LocalStorage 中的 podcastId');
          }
        } else {
          // 从 API 解析
          const episodeUrl = `https://www.xiaoyuzhoufm.com/episode/${id}`;
          const result = await parseEpisode(episodeUrl);

          // 调试日志：查看 API 返回的完整数据
          console.log('[EpisodeTabPage] API 返回数据:', result);
          console.log('[EpisodeTabPage] podcast_id:', result.podcast_id);

          const data = {
            episodeId: result.episode_id,
            podcastId: result.podcast_id || '',  // 使用 API 返回的 podcast_id
            episodeTitle: result.episode_title,
            podcastName: result.podcast_name,
            coverImage: result.cover_image,
            audioUrl: result.audio_url,
            duration: result.duration,
            showNotes: result.show_notes,
          };

          console.log('[EpisodeTabPage] 构造后的数据:', data);

          setEpisodeData(data);

          // 设置播放器
          setCurrentPodcast({
            id: data.episodeId,
            title: data.episodeTitle,
            description: data.podcastName,
            audioUrl: data.audioUrl,
            coverUrl: data.coverImage,
            duration: data.duration,
            createdAt: new Date().toISOString(),
            transcript: [],
          });

          // 如果之前有保存的数据（但没有 podcastId），现在更新它
          const savedData = loadEpisodeData(id);
          if (savedData && savedData.transcript) {
            // 保留旧的转录数据，更新 podcastId
            saveEpisodeData({
              ...savedData,
              podcastId: data.podcastId,
            });
            console.log('[EpisodeTabPage] 已更新 LocalStorage 中的 podcastId');
          }
        }
      } catch (error) {
        console.error('Error loading episode:', error);
        // 不要立即返回首页，而是显示错误信息
        if (error instanceof Error) {
          setError(error.message || '加载失败，请重试');
        } else {
          setError('加载失败，请重试');
        }
      } finally {
        setLoading(false);
      }
    };

    loadEpisode();
  }, [id, location.state, navigate, setCurrentPodcast]);

  // 点击 EPISODES 卡片：跳转到 Tab 视图
  const handleShowTabArea = () => {
    // 导航到 tab 视图（添加查询参数）
    navigate(`/episode/${id}?view=tabs`);
  };

  // 返回上一页
  const handleBack = () => {
    navigate(-1);
  };

  // 开始转录
  const handleStartTranscription = async () => {
    if (!episodeData) return;

    try {
      setIsTranscribing(true);
      setTranscribingProgress({
        stage: 'downloading',
        message: '正在获取音频',
        progress: 10,
      });

      // 1. ASR 转录
      console.log('[EpisodeTabPage] 开始 ASR 转录...');
      const transcriptResult = await startTranscription(
        episodeData.audioUrl,
        episodeData.episodeId,
        undefined,  // engine (使用默认)
        true,       // useStandard (使用豆包标准版)
        300000      // timeout (5分钟)
      );

      console.log('[EpisodeTabPage] ASR 转录完成:', {
        wordCount: transcriptResult.word_count,
        duration: transcriptResult.total_duration,
        utterancesCount: transcriptResult.utterances?.length,
      });

      setTranscribingProgress({
        stage: 'chapters',
        message: '正在生成章节',
        progress: 80,
      });

      // 2. 生成章节
      console.log('[EpisodeTabPage] 开始生成章节...');
      const chaptersResult = await generateChapters(
        transcriptResult.utterances?.map((u: any) => u.text).join('\n\n') || ''
      );

      console.log('[EpisodeTabPage] 章节生成完成:', {
        chaptersCount: chaptersResult.chapters?.length,
      });

      // 3. 保存到 LocalStorage
      console.log('[EpisodeTabPage] 保存到 LocalStorage...');
      const dataToSave = {
        ...episodeData,
        transcript: transcriptResult.words,
        utterances: transcriptResult.utterances,
        chapters: chaptersResult.chapters,
        processedAt: new Date().toISOString(),
        asrEngine: transcriptResult.asr_engine,
        wordCount: transcriptResult.word_count,
      };
      saveEpisodeData(dataToSave);

      // 更新状态
      setSavedData(dataToSave);
      setChapters({ chapters: chaptersResult.chapters });

      console.log('[EpisodeTabPage] 保存完成');

      setTranscribingProgress({
        stage: 'completed',
        message: '处理完成',
        progress: 100,
      });

      setTimeout(() => {
        setIsTranscribing(false);
        setTranscribingProgress(null);
        setIsProcessed(true);
      }, 500);
    } catch (error) {
      console.error('Transcription error:', error);
      const errorMessage = error instanceof Error ? error.message : '转录失败，请重试';
      alert(errorMessage);
      setIsTranscribing(false);
      setTranscribingProgress(null);
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
          返回上一页
        </button>
      </div>
    );
  }

  if (!episodeData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-white text-lg mb-4">未找到单集信息</div>
        <button
          onClick={handleBack}
          className="px-6 py-3 rounded-xl text-white font-medium"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          返回上一页
        </button>
      </div>
    );
  }

  // 如果是 tab 视图，显示 Tab 功能区
  if (viewMode === 'tabs') {
    return (
      <div className="min-h-screen">
        {/* 背景装饰 */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* 返回按钮 */}
        <div className="sticky top-0 z-20 px-6 py-4">
          <button
            onClick={handleBack}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            ← 返回上一页
          </button>
        </div>

        {/* Tab 功能区 - 双栏布局 */}
        <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
          {/* 双栏内容区 */}
          <div className="flex-1 flex overflow-hidden">
            {/* 左侧（40%）：播放器 + 章节导航 */}
            <div className="w-[40%] flex flex-col border-r border-white/10">
              {/* 上层：播放器窗口 */}
              <div className="p-4 border-b border-white/10 flex-shrink-0">
                <AudioPlayerEnhanced mode="full" />
              </div>

              {/* 下层：章节导航（竖向列表） */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {!isProcessed && !isTranscribing && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-white/60 text-lg mb-4">该单集尚未处理</p>
                      <button
                        onClick={handleStartTranscription}
                        className="px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-105"
                        style={{
                          backgroundColor: 'rgba(212, 197, 185, 0.2)',
                          color: 'rgba(212, 197, 185, 1)',
                          border: '1px solid rgba(212, 197, 185, 0.3)',
                          boxShadow: '0 8px 32px rgba(212, 197, 185, 0.1)',
                        }}
                      >
                        🎙️ Run AI Processing
                      </button>
                    </div>
                  </div>
                )}

                {isTranscribing && transcribingProgress && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="mb-4">
                        <div
                          className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-t-2 border-r-2 border-b-2 animate-spin"
                          style={{
                            borderColor: 'rgba(212, 197, 185, 0.2)',
                            borderTopColor: 'rgba(212, 197, 185, 1)',
                          }}
                        />
                      </div>
                      <p className="text-white text-lg font-medium mb-2">
                        {transcribingProgress.message}
                      </p>
                      <p className="text-white/60 text-sm">{transcribingProgress.stage}</p>
                    </div>
                  </div>
                )}

                {isProcessed && savedData && chapters && (
                  <div className="space-y-2">
                    {chapters.chapters.map((chapter, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.01] bg-white/5 hover:bg-white/8"
                        style={{
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                        onClick={() => {
                          const utterance = savedData.utterances[chapter.segment_index];
                          if (utterance) {
                            const { seek } = usePlayerStore.getState();
                            seek(utterance.start);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium flex-shrink-0"
                            style={{
                              backgroundColor: 'rgba(212, 197, 185, 0.15)',
                              color: 'rgba(212, 197, 185, 0.8)',
                            }}
                          >
                            {idx + 1}
                          </div>
                          {(() => {
                            const utterance = savedData.utterances[chapter.segment_index];
                            return utterance ? (
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs" style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                fontFamily: 'monospace',
                                color: 'rgba(255, 255, 255, 0.35)',
                              }}>
                                <Clock className="w-3 h-3" />
                                {Math.floor(utterance.start / 1000 / 60)}:{(Math.floor(utterance.start / 1000) % 60).toString().padStart(2, '0')}
                              </div>
                            ) : null;
                          })()}
                        </div>

                        <h3 className="text-sm font-medium text-white mb-1 leading-snug">
                          {chapter.title}
                        </h3>

                        {chapter.points && chapter.points.length > 0 && (
                          <ul className="space-y-0.5">
                            {chapter.points.slice(0, 2).map((point, pointIdx) => (
                              <li
                                key={pointIdx}
                                className="text-xs flex items-start gap-1.5 text-white/50 leading-relaxed"
                              >
                                <span className="flex-shrink-0 text-[10px]" style={{ color: 'rgba(212, 197, 185, 0.5)' }}>
                                  •
                                </span>
                                <span className="flex-1 line-clamp-1">{point}</span>
                              </li>
                            ))}
                            {chapter.points.length > 2 && (
                              <li className="text-xs text-white/30 pl-3.5">
                                +{chapter.points.length - 2} 更多
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 右侧（60%）：功能栏 + 文字稿 */}
            <div className="w-[60%] flex flex-col">
              {/* 功能栏 */}
              <div className="px-4 py-3 border-b border-white/10 flex gap-3 flex-wrap">
                <button className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                  翻译
                </button>
                <button className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-2">
                  Chat
                  {chatMessages.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{
                      backgroundColor: 'rgba(212, 197, 185, 0.2)',
                      color: 'rgba(212, 197, 185, 0.9)',
                    }}>
                      {chatMessages.length}
                    </span>
                  )}
                </button>
                <button className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-2">
                  笔记
                  {notes.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{
                      backgroundColor: 'rgba(212, 197, 185, 0.2)',
                      color: 'rgba(212, 197, 185, 0.9)',
                    }}>
                      {notes.length}
                    </span>
                  )}
                </button>
                <button className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                  自动
                </button>
                <button className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                  导出
                </button>
              </div>

              {/* 文字稿内容区 */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {!isProcessed && !isTranscribing && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/60">处理完成后显示文字稿</p>
                  </div>
                )}

                {isTranscribing && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/60">正在处理中...</p>
                  </div>
                )}

                {isProcessed && savedData && savedData.utterances && (
                  <TranscriptViewer
                    segments={savedData.utterances}
                    podcastId={episodeData.podcastId}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 样式 */}
        <style>{`
          @keyframes slideUp {
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
  }

  // 卡片视图（默认）
  return (
    <div className="min-h-screen">
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* 顶部区域：返回按钮和搜索框 */}
      <div className="px-6 pt-8 pb-12">
        {/* 返回按钮 */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            ← 返回上一页
          </button>
        </div>

        {/* 搜索区域 */}
        <div className="max-w-2xl mx-auto">
          {/* 标题 */}
          <h1
            className="text-4xl font-bold text-white mb-8 text-center"
          >
            SEARCH
          </h1>

          {/* URL 输入框 */}
          <UrlInputEnhanced
            onEpisodeParsed={(data) => {
              navigate(`/episode/${data.episodeId}`, {
                state: { episodeData: data },
              });
            }}
            onPodcastParsed={(data) => {
              navigate(`/podcast/${data.podcastId}`, {
                state: { podcastData: data },
              });
            }}
          />
        </div>
      </div>

      {/* 分隔线 */}
      <div className="max-w-3xl mx-auto px-6">
        <div style={{ borderTop: '1px solid rgba(212, 197, 185, 0.1)', marginBottom: '48px' }} />
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-12 space-y-6">
        {/* 上半部分：双分区卡片 */}

        {/* PODCASTS 分区 */}
        <div>
          <h2
            className="text-2xl font-bold mb-3 px-1"
            style={{ color: 'rgba(212, 197, 185, 0.9)' }}
          >
            PODCASTS
          </h2>
          <PodcastCard
            mode="simple"
            podcastName={episodeData.podcastName}
            coverImage={episodeData.coverImage}
            onClick={() => navigate(`/podcast/${episodeData.podcastId || ''}`)}
            clickable={!!episodeData.podcastId}
          />
        </div>

        {/* EPISODES 分区 */}
        <div>
          <h2
            className="text-2xl font-bold mb-3 px-1"
            style={{ color: 'rgba(212, 197, 185, 0.9)' }}
          >
            EPISODES
          </h2>
          <PodcastCard
            mode="full"
            episodeId={episodeData.episodeId}
            episodeTitle={episodeData.episodeTitle}
            podcastName={episodeData.podcastName}
            coverImage={episodeData.coverImage}
            showNotes={episodeData.showNotes}
            duration={episodeData.duration}
            audioUrl={episodeData.audioUrl}
            onClick={handleShowTabArea}
            clickable={true}
          />
        </div>
      </div>
    </div>
  );
};
