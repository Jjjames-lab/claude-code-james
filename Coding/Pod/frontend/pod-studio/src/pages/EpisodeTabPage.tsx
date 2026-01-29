import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PodcastCard } from '../components/podcast/PodcastCard';
import { checkProcessedStatus, loadEpisodeData, saveEpisodeData } from '../utils/episodeStorage';
import { parseEpisode, startTranscription, generateChapters } from '../services/api';
import { AudioPlayerEnhanced } from '../components/audio/AudioPlayerEnhanced';
import { usePlayerStore } from '../stores/playerStore';
import { useTranslationStore } from '../stores/translationStore';
import { useToastStore } from '../stores/toastStore';
import { UrlInputEnhanced } from '../components/url/UrlInputEnhanced';
import { TranscriptViewer } from '../components/transcript/TranscriptViewer';
import { ChaptersSectionEnhanced } from '../components/chapters/ChaptersSectionEnhanced';
import { TranslationButton } from '../components/translation/TranslationButton';
import { ViewModeToggle } from '../components/translation/ViewModeToggle';
import { ExportDropdown } from '../components/export/ExportDropdown';
import { TranscriptionStats } from '../components/transcript/TranscriptionStats';
import type { ChapterData } from '../services/api';
import { Clock, Mic, ChevronRight, ChevronDown } from 'lucide-react';

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
  const [useFunasr, setUseFunasr] = useState(true); // 默认使用 FunASR（更便宜更快）
  const [transcriptionStartTime, setTranscriptionStartTime] = useState<number>(0); // 转录开始时间
  const [showTranscriptionStats, setShowTranscriptionStats] = useState(false); // 显示统计信息
  const [transcriptionStats, setTranscriptionStats] = useState<{
    engine: string;
    duration: number;
    elapsedTime: number;
    wordCount: number;
    speakerCount?: number;
  } | null>(null);
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
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set()); // 章节展开状态

  const { setCurrentPodcast } = usePlayerStore();
  const { translateSegments, setViewMode, viewMode: translationViewMode, targetLang, isTranslatingChapters, chapterTranslations, translations } = useTranslationStore();
  const { addToast } = useToastStore();

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
      setTranscriptionStartTime(Date.now()); // 记录开始时间
      setTranscribingProgress({
        stage: 'downloading',
        message: '正在获取音频',
        progress: 10,
      });

      // 1. ASR 转录
      console.log('[EpisodeTabPage] 开始 ASR 转录，引擎:', useFunasr ? 'FunASR (推荐)' : '豆包标准版');
      const transcriptResult = await startTranscription(
        episodeData.audioUrl,
        episodeData.episodeId,
        undefined,  // engine (使用默认)
        !useFunasr,  // useStandard (如果不使用 FunASR，则用豆包标准版)
        useFunasr,   // useFunasr (使用 FunASR)
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

      // 计算转录统计
      const elapsedTime = Date.now() - transcriptionStartTime;
      const stats = {
        engine: transcriptResult.asr_engine,
        duration: transcriptResult.total_duration,
        elapsedTime: elapsedTime,
        wordCount: transcriptResult.word_count,
        speakerCount: transcriptResult.speaker_count,
      };
      setTranscriptionStats(stats);
      setShowTranscriptionStats(true);

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

      // 解析错误信息
      let errorMessage = '转录失败，请重试';
      let suggestion = '请检查网络连接后重试';

      if (error instanceof Error) {
        const errorLower = error.message.toLowerCase();

        if (errorLower.includes('timeout') || errorLower.includes('超时')) {
          errorMessage = '转录超时';
          suggestion = useFunasr
            ? 'FunASR 处理时间较长，请稍后重试或切换到豆包标准版'
            : '音频文件较长，请稍后重试或尝试使用 FunASR';
        } else if (errorLower.includes('audio') || errorLower.includes('音频')) {
          errorMessage = '音频处理失败';
          suggestion = '音频文件可能损坏或格式不支持，请尝试其他音频';
        } else if (errorLower.includes('network') || errorLower.includes('网络') || errorLower.includes('fetch')) {
          errorMessage = '网络连接失败';
          suggestion = '请检查网络连接，确保可以访问服务器';
        } else if (errorLower.includes('401') || errorLower.includes('403') || errorLower.includes('unauthorized')) {
          errorMessage = 'API 认证失败';
          suggestion = 'API 密钥可能已过期，请联系管理员更新配置';
        } else if (errorLower.includes('quota') || errorLower.includes('额度') || errorLower.includes('limit')) {
          errorMessage = 'API 额度不足';
          suggestion = '当前引擎额度已用完，请尝试切换到其他引擎';
        } else {
          errorMessage = error.message || '转录失败，请重试';
        }
      }

      addToast({
        type: 'error',
        title: errorMessage,
        message: suggestion,
        duration: 8000, // 显示更长时间
      });

      setIsTranscribing(false);
      setTranscribingProgress(null);
    }
  };

  // 处理翻译请求（同时翻译逐字稿和章节）
  const handleTranslate = async (targetLang: string) => {
    if (!savedData?.utterances) {
      addToast({
        type: 'warning',
        title: '无法翻译',
        message: '请先完成转录处理',
      });
      return;
    }

    try {
      // 切换到双语模式
      setViewMode('bilingual');

      // 构造待翻译的段落（使用 start 作为唯一 ID）
      const segments = savedData.utterances.map((utt: any) => ({
        id: utt.start?.toString() || `seg-${Math.random().toString(36).substr(2, 9)}`,
        text: utt.text,
      }));

      // 准备章节数据
      const chaptersData = chapters?.chapters || [];

      console.log('[EpisodeTabPage] 开始翻译:', {
        segmentsCount: segments.length,
        chaptersCount: chaptersData.length,
        total: segments.length + chaptersData.length
      });

      // 调用翻译（同时翻译逐字稿和章节）
      await translateSegments(segments, chaptersData);

      addToast({
        type: 'success',
        title: '翻译完成',
        message: `逐字稿 ${segments.length} 个段落 · 章节 ${chaptersData.length} 个`,
      });
    } catch (error) {
      console.error('[EpisodeTabPage] 翻译失败:', error);
      const errorMessage = error instanceof Error ? error.message : '翻译失败，请重试';
      addToast({
        type: 'error',
        title: '翻译失败',
        message: errorMessage,
      });
    }
  };

  // 切换章节展开/收起
  const toggleChapter = (idx: number) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
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

                      {/* FunASR 开关 */}
                      <div className="mb-3 text-center">
                        <label
                          htmlFor="funasr-toggle"
                          className="text-sm cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg transition-colors inline-flex"
                          style={{
                            backgroundColor: useFunasr ? 'rgba(212, 197, 185, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <input
                            id="funasr-toggle"
                            type="checkbox"
                            checked={useFunasr}
                            onChange={(e) => setUseFunasr(e.target.checked)}
                            className="w-4 h-4 rounded"
                            style={{
                              accentColor: 'rgba(212, 197, 185, 1)',
                            }}
                          />
                          <span className="text-white/80 text-sm">
                            {useFunasr ? '⚡ FunASR (推荐)' : '豆包标准版'}
                          </span>
                        </label>
                        <div className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                          {useFunasr
                            ? '速度快 5 倍 · 费用省 78%'
                            : '稳定可靠 · 备用方案'}
                        </div>
                      </div>

                      <button
                        onClick={handleStartTranscription}
                        className="px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-105 flex items-center gap-3"
                        style={{
                          backgroundColor: 'rgba(212, 197, 185, 0.2)',
                          color: 'rgba(212, 197, 185, 1)',
                          border: '1px solid rgba(212, 197, 185, 0.3)',
                          boxShadow: '0 8px 32px rgba(212, 197, 185, 0.1)',
                        }}
                      >
                        <Mic className="w-5 h-5" />
                        <span>Run AI Processing</span>
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
                  <>
                    {/* 转录统计卡片 */}
                    {showTranscriptionStats && transcriptionStats && (
                      <TranscriptionStats
                        engine={transcriptionStats.engine}
                        duration={transcriptionStats.duration}
                        elapsedTime={transcriptionStats.elapsedTime}
                        wordCount={transcriptionStats.wordCount}
                        onClose={() => setShowTranscriptionStats(false)}
                      />
                    )}

                    {/* 章节列表 - 极简折叠版 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {chapters.chapters.map((chapter, idx) => {
                        const translation = translationViewMode === 'bilingual' ? chapterTranslations.get(idx) : null;
                        const isExpanded = expandedChapters.has(idx);

                        return (
                          <div
                            key={idx}
                            className="rounded-xl cursor-pointer"
                            style={{
                              background: 'rgba(255, 255, 255, 0.02)',
                              backdropFilter: 'blur(20px)',
                              border: '1px solid rgba(255, 255, 255, 0.04)',
                              transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                              padding: isExpanded ? '12px 16px' : '10px 14px',
                              overflow: 'hidden',
                            }}
                            onClick={() => toggleChapter(idx)}
                          >
                            {/* 章节头部（单行紧凑） */}
                            <div className="flex items-center gap-2">
                              {/* 展开/收起图标（仅视觉指示） */}
                              <span
                                className="flex-shrink-0 transition-transform"
                                style={{
                                  color: 'rgba(212, 197, 185, 0.7)',
                                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                  transition: 'transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </span>

                              {/* 序号 */}
                              <span
                                className="text-xs font-medium flex-shrink-0"
                                style={{
                                  color: 'rgba(212, 197, 185, 0.8)',
                                  minWidth: '16px',
                                }}
                              >
                                {idx + 1}
                              </span>

                              {/* 时间戳 */}
                              {(() => {
                                const utterance = savedData.utterances[chapter.segment_index];
                                return utterance ? (
                                  <span
                                    className="text-xs flex-shrink-0"
                                    style={{
                                      fontFamily: 'monospace',
                                      color: 'rgba(255, 255, 255, 0.3)',
                                      minWidth: '36px',
                                    }}
                                  >
                                    {Math.floor(utterance.start / 1000 / 60)}:{(Math.floor(utterance.start / 1000) % 60).toString().padStart(2, '0')}
                                  </span>
                                ) : null;
                              })()}

                              {/* 章节标题 */}
                              <span
                                className="text-sm font-medium truncate flex-1"
                                style={{
                                  color: 'rgba(232, 232, 232, 0.75)',
                                  transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                }}
                              >
                                {chapter.title}
                              </span>

                              {/* 要点数量提示（未展开时） */}
                              {!isExpanded && chapter.points && chapter.points.length > 0 && (
                                <span
                                  className="text-xs flex-shrink-0"
                                  style={{
                                    color: 'rgba(255, 255, 255, 0.25)',
                                  }}
                                >
                                  {chapter.points.length} 个要点
                                </span>
                              )}
                            </div>

                            {/* 章节标题翻译 */}
                            {translation && translation.title && (
                              <div
                                className="text-xs mt-1 ml-7 truncate"
                                style={{
                                  color: 'rgba(212, 197, 185, 0.55)',
                                }}
                              >
                                {translation.title}
                              </div>
                            )}

                            {/* 章节要点（展开时显示） */}
                            {isExpanded && chapter.points && chapter.points.length > 0 && (
                              <div
                                className="mt-3 pt-3"
                                style={{
                                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                  marginLeft: '28px',
                                }}
                              >
                                <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {chapter.points.map((point, pointIdx) => {
                                    const translatedPoint = translation && translation.points[pointIdx];

                                    return (
                                      <li
                                        key={pointIdx}
                                        className="text-xs flex items-start gap-2"
                                        style={{
                                          lineHeight: 1.7,
                                          color: 'rgba(232, 232, 232, 0.55)',
                                        }}
                                      >
                                        <span
                                          className="flex-shrink-0 mt-0.5"
                                          style={{
                                            color: 'rgba(212, 197, 185, 0.4)',
                                          }}
                                        >
                                          •
                                        </span>
                                        <span className="flex-1">
                                          {point}
                                          {translatedPoint && (
                                            <span
                                              style={{
                                                color: 'rgba(212, 197, 185, 0.55)',
                                                marginLeft: '6px',
                                              }}
                                            >
                                               / {translatedPoint}
                                            </span>
                                          )}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 右侧（60%）：功能栏 + 文字稿 */}
            <div className="w-[60%] flex flex-col">
              {/* 功能栏 */}
              <div className="px-4 py-3 border-b border-white/10 flex gap-3 flex-wrap">
                <TranslationButton onTranslate={handleTranslate} />
                <ViewModeToggle />

                {/* 导出下拉菜单 */}
                {savedData && chapters && (
                  <ExportDropdown
                    episodeData={{
                      episodeId: id || '',
                      episodeTitle: savedData.episodeTitle || '未知标题',
                      podcastName: savedData.podcastName || '未知播客',
                      duration: savedData.duration || 0,
                      showNotes: savedData.showNotes,
                    }}
                    utterances={savedData.utterances || []}
                    chapters={chapters}
                    translations={translations}
                    chapterTranslations={chapterTranslations}
                    viewMode={translationViewMode}
                  />
                )}

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
              </div>

              {/* 文字稿内容区 */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
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
