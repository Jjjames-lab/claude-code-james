/**
 * AudioPlayerEnhanced - 播放器组件
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：克制、安静、尊重、不抢眼
 *
 * 支持两种模式：
 * - compact: 底部简洁播放条（默认隐藏）
 * - full: 老式收音机风格窗口
 */

import { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Star,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { formatTime } from '../../utils';

// 播放速度选项
const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

type PlayerMode = 'compact' | 'full';

interface AudioPlayerEnhancedProps {
  mode?: PlayerMode;
}

export const AudioPlayerEnhanced = ({ mode = 'compact' }: AudioPlayerEnhancedProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedControl, setShowSpeedControl] = useState(false);

  const {
    currentPodcast,
    isPlaying,
    currentTime,
    volume,
    isMuted,
    duration,
    setIsPlaying,
    setCurrentTime,
    setVolume,
    setIsMuted,
    setDuration,
    togglePlayPause,
    toggleMute,
    skip,
  } = usePlayerStore();

  // 初始化音频事件
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentPodcast) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime * 1000);

      // 保存播放位置到 LocalStorage（每5秒保存一次）
      if (Math.floor(audio.currentTime) % 5 === 0) {
        const storage = (window as any).storageManager;
        if (storage && currentPodcast) {
          storage.saveLastPlayed(currentPodcast.id, audio.currentTime * 1000);
        }
      }
    };

    const handleLoadedMetadata = () => {
      const audioDuration = audio.duration;
      if (!isNaN(audioDuration) && isFinite(audioDuration)) {
        setDuration(audioDuration * 1000);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentPodcast, setCurrentTime, setDuration, setIsPlaying]);

  // 控制播放
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentPodcast) return;

    if (isPlaying) {
      audio.play().catch((err) => console.error('播放失败:', err));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentPodcast]);

  // 设置播放速度
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // 同步音量变化到 audio 元素
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 同步时间跳转到 audio 元素（外部跳转，非播放进度）
  const previousTimeRef = useRef<number>(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 检测是否是外部跳转（通过差值判断）
    const timeDiff = Math.abs(currentTime - previousTimeRef.current);
    const isExternalSeek = timeDiff > 200; // 超过200ms认为是外部跳转

    if (isExternalSeek) {
      const targetTime = currentTime / 1000;
      // 只有当差值较大时才跳转，避免干扰正常播放
      if (Math.abs(audio.currentTime - targetTime) > 0.2) {
        audio.currentTime = targetTime;
      }
    }

    previousTimeRef.current = currentTime;
  }, [currentTime]);

  // 处理进度条点击
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = (percent * duration) / 1000;

    audio.currentTime = newTime;
    setCurrentTime(newTime * 1000);
  };

  // 处理音量变化
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // 切换播放速度
  const cycleSpeed = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    setPlaybackSpeed(PLAYBACK_SPEEDS[nextIndex]);
  };

  if (!currentPodcast) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Compact 模式：底部播放条（默认隐藏，方便以后切换）
  if (mode === 'compact') {
    return null; // 暂时隐藏
  }

  // Full 模式：老式收音机风格窗口
  return (
    <div className="w-full">
      {/* 老式收音机风格播放器 */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.95) 0%, rgba(20, 20, 25, 0.98) 100%)',
          border: '1px solid rgba(212, 197, 185, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(212, 197, 185, 0.05)',
        }}
      >
        {/* 内部装饰纹理 */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative p-6 space-y-5">
          {/* 上层：封面和基本信息 */}
          <div className="flex items-center gap-4">
            {/* 封面图 - 圆角矩形 */}
            <div
              className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0"
              style={{
                border: '2px solid rgba(212, 197, 185, 0.2)',
                boxShadow: '0 4px 16px rgba(212, 197, 185, 0.15)',
              }}
            >
              {currentPodcast.coverUrl ? (
                <img
                  src={currentPodcast.coverUrl}
                  alt={currentPodcast.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(212, 197, 185, 0.15)',
                  }}
                >
                  <span className="text-3xl">🎵</span>
                </div>
              )}
            </div>

            {/* 节目信息 */}
            <div className="flex-1 min-w-0">
              <h3
                className="text-lg font-semibold mb-1 truncate"
                style={{
                  color: 'rgba(232, 232, 232, 0.95)',
                  letterSpacing: '-0.01em',
                }}
              >
                {currentPodcast.title}
              </h3>
              <p
                className="text-sm mb-2"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                {currentPodcast.description}
              </p>

              {/* 时长和收藏 */}
              <div className="flex items-center gap-3">
                <div
                  className="px-3 py-1 rounded-lg text-xs font-mono"
                  style={{
                    backgroundColor: 'rgba(212, 197, 185, 0.1)',
                    color: 'rgba(212, 197, 185, 0.8)',
                    border: '1px solid rgba(212, 197, 185, 0.15)',
                  }}
                >
                  {formatTime(duration)}
                </div>

                <button
                  className="p-1.5 rounded-lg transition-all duration-200"
                  style={{
                    color: 'rgba(255, 255, 255, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'rgba(212, 197, 185, 0.8)';
                    e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(212, 197, 185, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                  title="收藏"
                >
                  <Star className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="space-y-2">
            <div
              onClick={handleProgressClick}
              className="group relative h-2 rounded-full cursor-pointer overflow-hidden"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                transition: 'height 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              {/* 进度 */}
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, rgba(212, 197, 185, 0.6) 0%, rgba(212, 197, 185, 0.8) 100%)',
                }}
              >
                {/* 播放头 */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-lg"
                  style={{
                    backgroundColor: 'rgba(212, 197, 185, 1)',
                    boxShadow: '0 0 12px rgba(212, 197, 185, 0.4)',
                  }}
                />
              </div>
            </div>

            {/* 时间显示 */}
            <div className="flex justify-between">
              <span
                className="text-sm font-mono"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                {formatTime(currentTime)}
              </span>
              <span
                className="text-sm font-mono"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-between">
            {/* 左侧：后退/播放/前进 */}
            <div className="flex items-center gap-2">
              {/* 后退 */}
              <button
                onClick={() => skip(-15)}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                }}
                title="后退 15 秒"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* 播放/暂停 */}
              <button
                onClick={togglePlayPause}
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(212, 197, 185, 0.9)',
                  color: '#0f0f11',
                  boxShadow: '0 4px 16px rgba(212, 197, 185, 0.25)',
                  transition: 'all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 1)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(212, 197, 185, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.9)';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 197, 185, 0.25)';
                }}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" fill="currentColor" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                )}
              </button>

              {/* 前进 */}
              <button
                onClick={() => skip(15)}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                }}
                title="前进 15 秒"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* 右侧：倍速和音量 */}
            <div className="flex items-center gap-3">
              {/* 播放速度 */}
              <button
                onClick={cycleSpeed}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  transition: 'all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(212, 197, 185, 0.8)';
                  e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(212, 197, 185, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                {playbackSpeed}x
              </button>

              {/* 音量控制 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    transition: 'all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  }}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-3
                             [&::-webkit-slider-thumb]:h-3
                             [&::-webkit-slider-thumb]:bg-white/70
                             [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:transition-all
                             [&::-webkit-slider-thumb]:hover:bg-white/90"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 隐藏的音频元素 */}
      <audio ref={audioRef} src={currentPodcast.audioUrl} />
    </div>
  );
};
