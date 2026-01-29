import { useState, useEffect } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useThemeStore } from '../stores/themeStore';
import { storageManager } from '../utils/storageManager';
import { BarChart3, Settings, Keyboard, FileText, FileTextPlus, File } from 'lucide-react';

// === 新设计组件 (v2.0) ===
import { AudioPlayerEnhanced } from '../components/audio/AudioPlayerEnhanced';
import { UrlInputEnhanced } from '../components/url/UrlInputEnhanced';
import { ChaptersSectionEnhanced } from '../components/chapters/ChaptersSectionEnhanced';
import { PodcastList } from '../components/podcast/PodcastList';

// === 保留的原组件（用于其他功能）===
import { TranscriptViewer } from '../components/transcript/TranscriptViewer';
import { VirtualTranscriptViewer } from '../components/transcript/VirtualTranscriptViewer';
import { PodcastCard } from '../components/podcast/PodcastCard';
import { OverviewSection } from '../components/overview/OverviewSection';
import { ShownoteRenderer } from '../components/shownote/ShownoteRenderer';
import { HistoryPanel } from '../components/history/HistoryPanel';
import { ExportMenu } from '../components/export/ExportMenu';
import { KeyboardShortcutsHelp } from '../components/keyboard/KeyboardShortcutsHelp';
import { ThemeToggle } from '../components/theme/ThemeToggle';
import { useKeyboardShortcuts, predefinedShortcuts } from '../hooks/useKeyboardShortcuts';
import { startTranscription, polishTranscript } from '../services/api';
import type { Podcast, TranscriptSegment } from '../types';
import { BackupPanel } from '../components/backup/BackupPanel';
import { StatsPanel } from '../components/stats/StatsPanel';
import { SettingsPage } from '../components/settings/SettingsPage';

type AppState = 'input' | 'parsed' | 'transcribing' | 'completed' | 'podcast-list' | 'history' | 'backup' | 'stats' | 'settings';
type TabKey = 'overview' | 'chapters' | 'transcript' | 'shownote';

export const HomePage = () => {
  const { currentPodcast, setCurrentPodcast, seek, togglePlayPause } = usePlayerStore();
  const { toggleTheme } = useThemeStore();
  const [appState, setAppState] = useState<AppState>('input');
  const [highlightedSegmentId, setHighlightedSegmentId] = useState<string | null>(null);  // 新增：高亮段落ID
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);  // 快捷键帮助面板

  // 页面加载时恢复状态
  useEffect(() => {
    const restoreState = () => {
      const savedPodcast = storageManager.loadCurrentPodcast();
      const lastPlayed = storageManager.loadLastPlayed();

      if (savedPodcast) {
        console.log('[HomePage] 恢复上次播客:', savedPodcast.title);

        // 恢复播客状态
        setCurrentPodcast(savedPodcast);
        setTranscript(savedPodcast.transcript || []);
        setOriginalTranscript(savedPodcast.transcript || []);
        setOptimizedTranscript([]);

        // 恢复解析信息
        setParsedEpisode({
          episodeId: savedPodcast.id,
          episodeTitle: savedPodcast.title,
          podcastName: savedPodcast.description || '',
          audioUrl: savedPodcast.audioUrl,
          duration: savedPodcast.duration,
          coverImage: savedPodcast.coverUrl,
          showNotes: savedPodcast.description || '',
        });

        // 设置为完成状态
        setAppState('completed');

        // 恢复播放位置（如果有）
        if (lastPlayed && lastPlayed.podcastId === savedPodcast.id) {
          console.log('[HomePage] 恢复播放位置:', lastPlayed.time);

          // 检查是否接近结尾（最后5%或最后30秒）
          const isNearEnd =
            savedPodcast.duration &&
            (lastPlayed.time > savedPodcast.duration * 0.95 ||
              lastPlayed.time > savedPodcast.duration - 30000);

          if (isNearEnd) {
            // 询问是否从头开始
            const shouldRestart = confirm(
              `上次播放已接近结尾（${formatTimeForConfirm(lastPlayed.time)}），\n是否从头开始播放？\n\n点击"确定"从头开始，点击"取消"继续上次位置。`
            );

            if (shouldRestart) {
              seek(0);
            } else {
              seek(lastPlayed.time);
            }
          } else {
            seek(lastPlayed.time);
          }
        }
      }
    };

    restoreState();
  }, [setCurrentPodcast, seek]);

  // 辅助函数：格式化时间用于确认对话框
  const formatTimeForConfirm = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const [parsedEpisode, setParsedEpisode] = useState<{
    episodeId: string;
    episodeTitle: string;
    podcastName: string;
    audioUrl: string;
    duration: number;
    coverImage: string;
    showNotes: string;
  } | null>(null);

  const [parsedPodcast, setParsedPodcast] = useState<{
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
  } | null>(null);

  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [originalTranscript, setOriginalTranscript] = useState<TranscriptSegment[]>([]);  // 原始转录
  const [optimizedTranscript, setOptimizedTranscript] = useState<TranscriptSegment[]>([]); // AI优化后
  const [transcriptMode, setTranscriptMode] = useState<'original' | 'optimized'>('original');  // 当前显示模式
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [chapters, setChapters] = useState<any>(null);  // 章节数据状态
  const [transcribingProgress, setTranscribingProgress] = useState<{
    stage: string;
    message: string;
    progress?: number;
  } | null>(null);

  // 键盘快捷键系统
  useKeyboardShortcuts([
    // 播放控制
    {
      name: '播放控制',
      shortcuts: [
        {
          key: ' ',
          description: '播放/暂停',
          handler: () => {
            togglePlayPause();
            return true;
          },
        },
        {
          key: 'ArrowLeft',
          metaKey: true,
          description: '后退 10 秒',
          handler: () => {
            const currentTime = usePlayerStore.getState().currentTime;
            seek(Math.max(0, currentTime - 10));
            return true;
          },
        },
        {
          key: 'ArrowRight',
          metaKey: true,
          description: '前进 10 秒',
          handler: () => {
            const currentTime = usePlayerStore.getState().currentTime;
            seek(currentTime + 10);
            return true;
          },
        },
      ],
    },
    // 搜索（已有组件处理，这里占位）
    {
      name: '搜索',
      shortcuts: [
        {
          key: 'k',
          metaKey: true,
          ctrlKey: true,
          description: '打开搜索',
          handler: () => false, // SearchBar 组件已处理
        },
      ],
    },
    // 导航
    {
      name: '导航',
      shortcuts: [
        {
          key: '1',
          description: '切换到概览',
          handler: () => {
            if (appState === 'completed') setActiveTab('overview');
            return false;
          },
        },
        {
          key: '2',
          description: '切换到章节',
          handler: () => {
            if (appState === 'completed') setActiveTab('chapters');
            return false;
          },
        },
        {
          key: '3',
          description: '切换到逐字稿',
          handler: () => {
            if (appState === 'completed') setActiveTab('transcript');
            return false;
          },
        },
        {
          key: '4',
          description: '切换到节目单',
          handler: () => {
            if (appState === 'completed') setActiveTab('shownote');
            return false;
          },
        },
        {
          key: '/',
          description: '显示快捷键帮助',
          handler: () => {
            setShortcutsHelpOpen(true);
            return true;
          },
        },
      ],
    },
    // 视图和主题
    {
      name: '视图',
      shortcuts: [
        {
          key: 't',
          description: '切换主题（明亮/暗黑/自动）',
          handler: () => {
            toggleTheme();
            return true;
          },
        },
      ],
    },
  ]);

  // 处理链接解析成功
  const handleEpisodeParsed = (data: {
    episodeId: string;
    episodeTitle: string;
    podcastName: string;
    audioUrl: string;
    duration: number;
    coverImage: string;
    showNotes: string;
  }) => {
    setParsedEpisode(data);
    setParsedPodcast(null); // 清除播客数据
    setAppState('parsed');
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
    setParsedPodcast(data);
    setParsedEpisode(null); // 清除单集数据
    setAppState('podcast-list');
  };

  // 开始转录
  const handleStartTranscription = async () => {
    if (!parsedEpisode) return;

    try {
      setAppState('transcribing');
      setTranscribingProgress({
        stage: 'downloading',
        message: '正在获取音频',
        progress: 10
      });

      // 模拟下载进度
      let downloadProgress = 10;
      const downloadInterval = setInterval(() => {
        downloadProgress += 5;
        if (downloadProgress >= 30) {
          clearInterval(downloadInterval);
        } else {
          setTranscribingProgress({
            stage: 'downloading',
            message: '正在获取音频',
            progress: downloadProgress
          });
        }
      }, 500);

      // ASR转录
      setTranscribingProgress({
        stage: 'transcribing',
        message: '正在转录文字',
        progress: 30
      });

      const result = await startTranscription(
        parsedEpisode.audioUrl,
        parsedEpisode.episodeId,
        'doubao',
        true  // 使用豆包标准版
      );

      setTranscribingProgress({
        stage: 'processing',
        message: '正在整理',
        progress: 90
      });

      console.log('ASR转录完成，使用ASR自动分段...');
      console.log('转录结果:', JSON.stringify(result, null, 2));

      // 直接使用 ASR 的分段（无需 LLM）
      await handleTranscriptionWithASR(result);

      setTranscribingProgress({
        stage: 'processing',
        message: '准备好了',
        progress: 100
      });

      // 延迟一下让用户看到100%
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '遇到了问题';
      console.error('Transcription error:', error);
      alert(`遇到了一些问题，${errorMsg}`);
      setAppState('parsed');
      setTranscribingProgress(null);
    }
  };

  // 处理播客列表中的集数点击
  const handleEpisodeFromPodcastClick = (episode: {
    episodeId: string;
    episodeTitle: string;
    audioUrl: string;
    duration: number;
    coverImage: string;
    showNotes: string;
    createdAt: string;
  }) => {
    // 将播客列表中点击的集数转换为 parsedEpisode 格式
    const podcastName = parsedPodcast?.podcastName || '';
    setParsedEpisode({
      episodeId: episode.episodeId,
      episodeTitle: episode.episodeTitle,
      podcastName: podcastName,
      audioUrl: episode.audioUrl,
      duration: episode.duration,
      coverImage: episode.coverImage,
      showNotes: episode.showNotes,
    });
    setParsedPodcast(null); // 清除播客列表状态
    setAppState('parsed'); // 进入已解析状态
  };

  // 处理播客信息区域点击
  const handlePodcastInfoClick = () => {
    // TODO: 显示播客详情页面
    console.log('Show podcast details for:', parsedPodcast?.podcastName);
  };

  // 使用ASR的自动分段
  const handleTranscriptionWithASR = async (result: any) => {
    try {
      console.log('[handleTranscriptionWithASR] 开始处理转录结果');
      console.log('[handleTranscriptionWithASR] 结果类型:', typeof result);
      console.log('[handleTranscriptionWithASR] 结果keys:', Object.keys(result || {}));
      console.log('[handleTranscriptionWithASR] utterances:', result?.utterances);

      // 检查结果格式
      if (!result.utterances || !Array.isArray(result.utterances)) {
        console.error('[handleTranscriptionWithASR] 错误：缺少utterances字段或不是数组');
        console.error('[handleTranscriptionWithASR] result.utterances:', result?.utterances);
        throw new Error('转录结果格式错误：缺少utterances字段');
      }

      console.log('ASR分段数量:', result.utterances.length);

      // 直接使用 ASR 的 utterances 作为分段
      const segments = result.utterances.map((utt: any, index: number) => ({
        id: `seg-${index}`,
        speaker: utt.speaker || '说话人',
        text: utt.text,
        words: utt.words || [],
        startTime: utt.start || utt.start_time || 0,
        endTime: utt.end || utt.end_time || 0,
      }));

      console.log('分段完成，共', segments.length, '个段落');
      setTranscript(segments);
      setOriginalTranscript(segments);  // 保存原始转录
      setOptimizedTranscript([]);        // 重置优化版本
      setTranscriptMode('original');     // 切换到原始模式

      // 创建播客对象
      const podcast: Podcast = {
        id: parsedEpisode!.episodeId,
        title: parsedEpisode!.episodeTitle || '未知节目',
        description: parsedEpisode!.podcastName || '未知播客',
        audioUrl: parsedEpisode!.audioUrl,
        coverUrl: parsedEpisode!.coverImage,
        duration: parsedEpisode!.duration || result.total_duration || 0,
        createdAt: new Date().toISOString(),
        transcript: segments,
      };

      setCurrentPodcast(podcast);
      setAppState('completed');

      // 保存到 LocalStorage
      storageManager.saveCurrentPodcast(podcast);
      storageManager.saveTranscript(podcast.id, segments);

      // 添加到历史记录
      storageManager.addToHistory({
        id: podcast.id,
        title: podcast.title,
        podcastName: podcast.description,
        coverImage: podcast.coverUrl,
        duration: podcast.duration,
        transcript: segments,
        notes: [],
        createdAt: podcast.createdAt,
        lastPlayedAt: new Date().toISOString(),
        lastPosition: 0,
      });

    } catch (error) {
      console.error('Error processing transcription result:', error);
      alert(`处理时遇到了问题，${error instanceof Error ? error.message : '请再试一次'}`);
      setAppState('parsed');
    }
  };

  // 切换转录模式（原始 vs AI优化）
  const handleTranscriptModeChange = async (mode: 'original' | 'optimized') => {
    if (!currentPodcast) return;

    setTranscriptMode(mode);

    if (mode === 'original' && originalTranscript.length > 0) {
      // 切换到原始模式
      setTranscript(originalTranscript);
      const updatedPodcast = {
        ...currentPodcast,
        transcript: originalTranscript,
      };
      setCurrentPodcast(updatedPodcast);
    } else if (mode === 'optimized' && optimizedTranscript.length > 0) {
      // 切换到优化模式
      setTranscript(optimizedTranscript);
      const updatedPodcast = {
        ...currentPodcast,
        transcript: optimizedTranscript,
      };
      setCurrentPodcast(updatedPodcast);
    } else if (mode === 'optimized' && optimizedTranscript.length === 0) {
      // 还没有优化结果，提示用户先优化
      alert('需要先优化才能切换模式');
      setTranscriptMode('original');
    }
  };

  // AI 优化：使用 LLM 纠正同音词和专有名词
  const handleOptimizeWithLLM = async () => {
    if (!currentPodcast?.transcript) {
      alert('暂时没有逐字稿');
      return;
    }

    try {
      // 提取原始文本（所有段落拼接）
      const rawText = currentPodcast.transcript
        .map(seg => seg.text)
        .join('');

      console.log('开始LLM优化，文本长度:', rawText.length);
      console.log('原始逐字稿段落数:', currentPodcast.transcript.length);

      // 调用 LLM 处理
      const llmResult = await polishTranscript(
        rawText,
        currentPodcast.description,
        ['深度学习', '人工智能', '播客']
      );

      const polishedText = llmResult.polished_text;
      console.log('LLM优化完成，处理后长度:', polishedText.length);
      console.log('优化后文本预览:', polishedText.substring(0, 100) + '...');

      // 使用原始的词级时间戳映射
      const allWords = currentPodcast.transcript.flatMap(seg => seg.words || []);
      console.log('原始词级数据:', allWords.length, '个词');

      if (allWords.length === 0) {
        console.warn('没有词级数据，使用简化模式');
        // 如果没有词级数据，直接使用文本段落
        const simplifiedSegments = polishedText
          .split(/\n\s*\n/)
          .filter(p => p.trim())
          .map((text, index) => ({
            id: `seg-${index}`,
            speaker: '说话人',
            text: text.trim(),
            words: [],
            startTime: (index * 30000), // 估算时间
            endTime: (index + 1) * 30000,
          }));

        setCurrentPodcast({
          ...currentPodcast,
          transcript: simplifiedSegments,
        });
        setTranscript(simplifiedSegments);

        alert('优化完成了');
        return;
      }

      const optimizedSegments = mapPolishedTextToTimestamps(polishedText, allWords);
      console.log('时间戳映射完成，生成段落数:', optimizedSegments.length);

      // 保存优化版本，但不自动切换
      setOptimizedTranscript(optimizedSegments);

      // 如果当前是优化模式，立即显示；否则提示用户
      if (transcriptMode === 'optimized') {
        setTranscript(optimizedSegments);
        const optimizedPodcast = {
          ...currentPodcast,
          transcript: optimizedSegments,
        };
        setCurrentPodcast(optimizedPodcast);
        alert('优化完成了，已切换到优化模式');
      } else {
        alert('优化完成了，点击切换查看');
      }

      console.log('UI更新完成');
    } catch (error) {
      console.error('LLM优化失败:', error);
      alert(`优化时遇到了问题，${error instanceof Error ? error.message : '请再试一次'}`);
    }
  };

  // 将LLM处理后的文本映射回时间戳
  const mapPolishedTextToTimestamps = (
    polishedText: string,
    words: any[]
  ): TranscriptSegment[] => {
    // 按段落分割（支持单换行符和双换行符）
    const hasDoubleNewline = polishedText.includes('\n\n');
    const paragraphs = polishedText
      .split(hasDoubleNewline ? /\n\n+/ : /\n+/)
      .filter(p => p.trim());

    const segments: TranscriptSegment[] = [];

    // 计算原始文本的总长度（用于估算段落比例）
    const totalRawChars = words.reduce((sum, w) => sum + w.text.length, 0);
    const totalPolishedChars = polishedText.length;

    // 计算缩放比例（处理后的文本可能因为添加标点而变长）
    const ratio = totalRawChars / totalPolishedChars;

    let wordIndex = 0; // 当前词索引

    paragraphs.forEach((paragraph, pIndex) => {
      // 估算这个段落对应的原始字符数（考虑标点增加的影响）
      const estimatedRawChars = Math.round(paragraph.length * ratio);

      // 找到对应的词范围
      let currentCharCount = 0;
      let segmentWords: any[] = [];
      let segmentStartTime = 0;
      let segmentEndTime = 0;

      // 累积词直到达到估算的字符数
      while (wordIndex < words.length && currentCharCount < estimatedRawChars) {
        const word = words[wordIndex];
        if (!segmentWords.length) {
          // 第一个词的开始时间作为段落开始时间
          segmentStartTime = word.start;
        }
        segmentWords.push(word);
        currentCharCount += word.text.length;
        segmentEndTime = word.end;
        wordIndex++;
      }

      // 如果没有找到任何词，使用上一个段落的结束时间或0
      if (segmentWords.length === 0) {
        const lastSegment = segments[segments.length - 1];
        segmentStartTime = lastSegment ? lastSegment.endTime : 0;
        segmentEndTime = segmentStartTime;

        console.warn(`段落 ${pIndex + 1} 未找到对应的词，使用时间 ${segmentStartTime}`);
      }

      // 创建段落
      segments.push({
        id: `seg-${pIndex}`,
        speaker: '说话人',
        text: paragraph.trim(),
        words: segmentWords,
        startTime: segmentStartTime,
        endTime: segmentEndTime,
      });
    });

    console.log(`时间戳映射完成: ${segments.length} 个段落, ${words.length} 个词`);
    return segments;
  };

  return (
    <div className="min-h-screen relative">
      {/* 主内容区域 */}
      <main className="relative z-10">
        {/* 状态1: 输入链接 */}
        {appState === 'input' && (
          <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-20">
            {/* 标题 */}
            <div className="text-center mb-12 sm:mb-16" style={{ animation: 'fadeInUp 400ms ease-out' }}>
              <h1
                className="mb-4"
                style={{
                  fontSize: 'clamp(48px, 8vw, 64px)',
                  fontWeight: 600,
                  color: 'rgba(232, 232, 232, 0.9)',
                  letterSpacing: '-0.02em',
                }}
              >
                Bookshelf Sounds
              </h1>
            </div>

            {/* 输入区域 */}
            <div
              className="w-full max-w-3xl mb-16"
              style={{ animation: 'fadeInUp 400ms ease-out 300ms both' }}
            >
              <UrlInputEnhanced onEpisodeParsed={handleEpisodeParsed} onPodcastParsed={handlePodcastParsed} />
            </div>

            {/* 历史记录和数据管理入口 */}
            <div className="flex flex-col sm:flex-row gap-4" style={{ animation: 'fadeInUp 400ms ease-out 400ms both' }}>
              <button
                onClick={() => setAppState('history')}
                className="flex items-center gap-3 px-5 py-2.5 rounded-lg text-sm transition-all duration-250"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                }}
              >
                <span style={{ fontSize: '20px' }}>📚</span>
                <span style={{ fontWeight: 500 }}>
                  历史记录 ({storageManager.loadHistory().length}条)
                </span>
              </button>

              {/* 数据管理按钮 */}
              <button
                onClick={() => setAppState('backup')}
                className="flex items-center gap-3 px-5 py-2.5 rounded-lg text-sm transition-all duration-250"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                }}
              >
                <span style={{ fontSize: '20px' }}>💾</span>
                <span style={{ fontWeight: 500 }}>
                  数据管理
                </span>
              </button>

              {/* 学习统计按钮 */}
              <button
                onClick={() => setAppState('stats')}
                className="flex items-center gap-3 px-5 py-2.5 rounded-lg text-sm transition-all duration-250"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                }}
              >
                <BarChart3 style={{ width: '20px', height: '20px' }} />
                <span style={{ fontWeight: 500 }}>
                  学习统计
                </span>
              </button>

              {/* 设置按钮 */}
              <button
                onClick={() => setAppState('settings')}
                className="flex items-center gap-3 px-5 py-2.5 rounded-lg text-sm transition-all duration-250"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                }}
              >
                <Settings style={{ width: '20px', height: '20px' }} />
                <span style={{ fontWeight: 500 }}>
                  设置
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 状态5: 历史记录 */}
        {appState === 'history' && (
          <div className="h-screen px-6 py-20 max-w-4xl mx-auto">
            <div className="mb-8">
              <button
                onClick={() => setAppState('input')}
                className="flex items-center gap-2 text-slate-400 hover:text-white
                         transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回
              </button>
            </div>
            <HistoryPanel />
          </div>
        )}

        {/* 状态6: 数据管理/备份 */}
        {appState === 'backup' && (
          <div className="h-screen px-6 py-20 max-w-3xl mx-auto">
            <div className="mb-8">
              <button
                onClick={() => setAppState('input')}
                className="flex items-center gap-2 text-slate-400 hover:text-white
                         transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回
              </button>
            </div>

            {/* 标题 */}
            <div className="mb-8">
              <h1
                className="text-3xl font-semibold mb-3"
                style={{ color: 'rgba(232, 232, 232, 0.9)' }}
              >
                数据管理
              </h1>
              <p
                className="text-base"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                备份和恢复您的数据，让想法安全留存
              </p>
            </div>

            <BackupPanel />
          </div>
        )}

        {/* 状态7: 学习统计 */}
        {appState === 'stats' && (
          <div className="h-screen px-6 py-20 max-w-4xl mx-auto">
            <div className="mb-8">
              <button
                onClick={() => setAppState('input')}
                className="flex items-center gap-2 text-slate-400 hover:text-white
                         transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回
              </button>
            </div>

            {/* 标题 */}
            <div className="mb-8">
              <h1
                className="text-3xl font-semibold mb-3"
                style={{ color: 'rgba(232, 232, 232, 0.9)' }}
              >
                学习统计
              </h1>
              <p
                className="text-base"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                看见你的进步，保持学习习惯
              </p>
            </div>

            <StatsPanel />
          </div>
        )}

        {/* 状态8: 设置 */}
        {appState === 'settings' && (
          <div className="h-screen px-6 py-8 max-w-4xl mx-auto">
            <SettingsPage onBack={() => setAppState('input')} />
          </div>
        )}

        {/* 其他状态 */}
        {appState !== 'input' && appState !== 'history' && (
          <div className="h-screen flex items-center justify-center px-6 py-20">

          {/* 状态2: 已解析，显示播客卡片 */}
          {(appState === 'parsed' || appState === 'transcribing') && parsedEpisode && (
            <div className="animate-scale-in">
              <PodcastCard
                episodeId={parsedEpisode.episodeId}
                episodeTitle={parsedEpisode.episodeTitle}
                podcastName={parsedEpisode.podcastName}
                audioUrl={parsedEpisode.audioUrl}
                duration={parsedEpisode.duration}
                coverImage={parsedEpisode.coverImage}
                showNotes={parsedEpisode.showNotes}
                onStartTranscription={handleStartTranscription}
                isTranscribing={appState === 'transcribing'}
                transcribingProgress={transcribingProgress || undefined}
              />
            </div>
          )}

          {/* 状态: 播客列表 */}
          {appState === 'podcast-list' && parsedPodcast && (
            <PodcastList
              podcastId={parsedPodcast.podcastId}
              podcastName={parsedPodcast.podcastName}
              hostName={parsedPodcast.hostName}
              description={parsedPodcast.description}
              logo={parsedPodcast.logo}
              episodes={parsedPodcast.episodes}
              totalEpisodes={parsedPodcast.totalEpisodes}
              onEpisodeClick={handleEpisodeFromPodcastClick}
              onInfoClick={handlePodcastInfoClick}
            />
          )}

          {/* 状态4: 转录完成，显示完整功能界面 */}
          {appState === 'completed' && transcript.length > 0 && (
            <div className="w-full max-w-7xl mx-auto animate-fade-in-up pb-24 md:pb-0">
              {/* 左右布局：左侧 Tab + 右侧内容 */}
              <div className="flex gap-6 h-[calc(100vh-8rem)]">
                {/* 左侧 Tab 栏 - 仅桌面端显示 */}
                <div className="hidden md:block w-56 flex-shrink-0">
                  <div className="sticky top-0 space-y-4">
                    {/* 播客信息卡片 */}
                    {parsedEpisode && (
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 overflow-hidden flex-shrink-0">
                            {parsedEpisode.coverImage ? (
                              <img
                                src={parsedEpisode.coverImage}
                                alt={parsedEpisode.episodeTitle}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                {parsedEpisode.podcastName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-violet-400 truncate">
                              {parsedEpisode.podcastName}
                            </div>
                            <div className="text-sm font-semibold text-white truncate">
                              {parsedEpisode.episodeTitle}
                            </div>
                          </div>
                        </div>

                        {/* 快速操作 */}
                        <div className="flex gap-2">
                          <button
                            onClick={handleOptimizeWithLLM}
                            className="flex-1 px-3 py-1.5 text-xs font-medium
                                     bg-gradient-to-r from-violet-500 to-purple-500
                                     text-white rounded-lg
                                     hover:shadow-lg hover:shadow-violet-500/20
                                     transition-all"
                          >
                            AI 优化
                          </button>
                          <button
                            onClick={() => {
                              setParsedEpisode(null);
                              setTranscript([]);
                              setAppState('input');
                            }}
                            className="flex-1 px-3 py-1.5 text-xs font-medium
                                     bg-white/5 border border-white/10
                                     text-slate-300 rounded-lg
                                     hover:bg-white/10
                                     transition-colors"
                          >
                            新节目
                          </button>
                        </div>

                        {/* 导出功能 */}
                        {appState === 'completed' && parsedEpisode && (
                          <div className="mt-4">
                            <ExportMenu
                              podcastId={parsedEpisode.episodeId}
                              podcastData={{
                                title: parsedEpisode.episodeTitle,
                                podcast_name: parsedEpisode.podcastName,
                                duration: parsedEpisode.duration,
                                show_notes: parsedEpisode.showNotes,
                              }}
                              transcript={transcript}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 导航 */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2">
                      <div className="space-y-1">
                        {[
                          { key: 'overview', label: '概览', icon: BarChart3 },
                          { key: 'chapters', label: '章节', icon: FileText },
                          { key: 'transcript', label: '逐字稿', icon: FileTextPlus },
                          { key: 'shownote', label: '节目单', icon: File },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as TabKey)}
                            className={`w-full px-3 py-2.5 rounded-lg
                                       flex items-center gap-3
                                       transition-all duration-200
                                       ${activeTab === tab.key
                                         ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                         : 'text-slate-400 hover:text-white hover:bg-white/5'
                                       }`}
                          >
                            <tab.icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{tab.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 转录模式切换 */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3">
                      <div className="text-xs text-slate-400 mb-2">转录模式</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-300">
                          {transcriptMode === 'original' ? '原始' : '优化'}
                        </span>
                        <button
                          onClick={() => handleTranscriptModeChange(transcriptMode === 'original' ? 'optimized' : 'original')}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            transcriptMode === 'optimized'
                              ? 'bg-violet-500'
                              : 'bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              transcriptMode === 'optimized' ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {originalTranscript.length > 0 && `${originalTranscript.length}段`}
                        {optimizedTranscript.length > 0 && ` / ${optimizedTranscript.length}段`}
                      </div>
                    </div>

                    {/* 快捷键帮助按钮 */}
                    <button
                      onClick={() => setShortcutsHelpOpen(true)}
                      className="w-full px-3 py-2.5 rounded-lg
                               flex items-center justify-center gap-2
                               transition-all duration-200
                               bg-white/5 border border-white/10
                               text-slate-400 hover:text-white hover:bg-white/8"
                      style={{
                        fontSize: '13px',
                      }}
                      title="按 ? 查看所有快捷键"
                    >
                      <Keyboard className="w-4 h-4" />
                      <span className="font-medium">快捷键</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-mono"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        /
                      </span>
                    </button>

                    {/* 主题切换 */}
                    <div className="mt-4">
                      <ThemeToggle className="w-full" />
                    </div>
                  </div>
                </div>

                {/* 右侧内容区域 */}
                <div className="flex-1 min-w-0">
                  <div className="h-full overflow-y-auto custom-scrollbar pr-2">
                    {activeTab === 'overview' && parsedEpisode && (
                      <OverviewSection
                        data={{
                          podcastName: parsedEpisode.podcastName,
                          episodeTitle: parsedEpisode.episodeTitle,
                          episodeDescription: parsedEpisode.showNotes,
                          coverImage: parsedEpisode.coverImage,
                          duration: parsedEpisode.duration,
                          publishDate: new Date().toLocaleDateString('zh-CN'),
                          hostName: undefined,
                          tags: ['播客', '学习'],
                        }}
                      />
                    )}

                    {activeTab === 'chapters' && (
                      <ChaptersSectionEnhanced
                        transcript={transcript}
                        chapters={chapters}
                        setChapters={setChapters}
                        onChapterClick={(time) => {
                          const targetSegment = transcript.find(seg =>
                            seg.startTime <= time && (!seg.endTime || time <= seg.endTime)
                          );
                          if (targetSegment) {
                            setHighlightedSegmentId(targetSegment.id);
                            seek(time);
                            setTimeout(() => {
                              setHighlightedSegmentId(null);
                            }, 2000);
                          }
                        }}
                      />
                    )}

                    {activeTab === 'transcript' && (
                      <>
                        {/* 根据段落数量选择使用虚拟滚动或普通渲染 */}
                        {transcript.length > 100 ? (
                          <VirtualTranscriptViewer
                            segments={transcript}
                            highlightedSegmentId={highlightedSegmentId}
                            podcastId={parsedEpisode?.episodeId}
                          />
                        ) : (
                          <TranscriptViewer
                            segments={transcript}
                            highlightedSegmentId={highlightedSegmentId}
                            podcastId={parsedEpisode?.episodeId}
                          />
                        )}
                      </>
                    )}

                    {activeTab === 'shownote' && parsedEpisode && (
                      <ShownoteRenderer
                        htmlContent={parsedEpisode.showNotes}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        )}

        {/* 移动端底部 Tab 导航 */}
        {appState === 'completed' && transcript.length > 0 && (
          <div className="md:hidden fixed bottom-20 left-0 right-0 z-40 px-4">
            <div
              className="rounded-xl p-2"
              style={{
                backgroundColor: 'rgba(15, 15, 17, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div className="flex items-center justify-around">
                {[
                  { key: 'overview' as TabKey, icon: BarChart3, label: '概览' },
                  { key: 'chapters' as TabKey, icon: FileText, label: '章节' },
                  { key: 'transcript' as TabKey, icon: FileTextPlus, label: '逐字稿' },
                  { key: 'shownote' as TabKey, icon: File, label: '节目单' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200"
                    style={
                      activeTab === tab.key
                        ? {
                            backgroundColor: 'rgba(212, 197, 185, 0.15)',
                            color: 'rgba(212, 197, 185, 0.9)',
                          }
                        : {
                            backgroundColor: 'transparent',
                            color: 'rgba(255, 255, 255, 0.4)',
                          }
                    }
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 固定在底部的播放器 */}
      {currentPodcast && (
        <footer className="fixed bottom-0 left-0 right-0 z-50">
          <AudioPlayerEnhanced />
        </footer>
      )}

      {/* 快捷键帮助面板 */}
      <KeyboardShortcutsHelp
        isOpen={shortcutsHelpOpen}
        onClose={() => setShortcutsHelpOpen(false)}
        shortcuts={[
          {
            name: '播放控制',
            shortcuts: [
              {
                key: ' ',
                description: '播放/暂停',
                handler: () => true,
              },
              {
                key: 'ArrowLeft',
                metaKey: true,
                description: '后退 10 秒',
                handler: () => true,
              },
              {
                key: 'ArrowRight',
                metaKey: true,
                description: '前进 10 秒',
                handler: () => true,
              },
            ],
          },
          {
            name: '搜索',
            shortcuts: [
              {
                key: 'k',
                metaKey: true,
                ctrlKey: true,
                description: '打开搜索',
                handler: () => true,
              },
            ],
          },
          {
            name: '导航',
            shortcuts: [
              {
                key: '1',
                description: '切换到概览',
                handler: () => true,
              },
              {
                key: '2',
                description: '切换到章节',
                handler: () => true,
              },
              {
                key: '3',
                description: '切换到逐字稿',
                handler: () => true,
              },
              {
                key: '4',
                description: '切换到节目单',
                handler: () => true,
              },
              {
                key: '/',
                description: '显示快捷键帮助',
                handler: () => true,
              },
            ],
          },
        ]}
      />
    </div>
  );
};
