import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string | File;
  onTimeUpdate: (time: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
}

export default function AudioPlayer({
  audioUrl,
  onTimeUpdate,
  onPlayStateChange,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [actualUrl, setActualUrl] = useState<string>('');

  // 处理 File 对象或 URL 字符串
  useEffect(() => {
    if (audioUrl instanceof File) {
      // 如果是 File 对象，创建 blob URL
      const url = URL.createObjectURL(audioUrl);
      setActualUrl(url);

      // 清理函数：组件卸载时释放 URL
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      // 如果是字符串，直接使用
      setActualUrl(audioUrl);
    }
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onPlayStateChange(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onPlayStateChange]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }

    setIsPlaying(!isPlaying);
    onPlayStateChange(!isPlaying);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    setCurrentTime(audio.currentTime);
    onTimeUpdate(audio.currentTime);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setCurrentTime(time);
    onTimeUpdate(time);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = previousVolume;
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      audio.volume = 0;
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    if (newVolume > 0) {
      setPreviousVolume(newVolume);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass rounded-2xl p-6">
      <audio ref={audioRef} src={actualUrl} />

      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="relative">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-dark-surface rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
          />
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 h-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full pointer-events-none"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Skip Back */}
            <button
              onClick={() => skip(-15)}
              className="p-2 hover:bg-dark-surface rounded-lg transition-colors group"
              aria-label="后退15秒"
            >
              <SkipBack className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-14 h-14 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity glow-primary"
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white fill-white" />
              ) : (
                <Play className="w-6 h-6 text-white fill-white ml-1" />
              )}
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => skip(15)}
              className="p-2 hover:bg-dark-surface rounded-lg transition-colors group"
              aria-label="前进15秒"
            >
              <SkipForward className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </button>

            {/* Time Display */}
            <div className="text-sm font-mono text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-2 text-gray-600">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-dark-surface rounded-lg transition-colors group"
              aria-label={isMuted ? '取消静音' : '静音'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              ) : (
                <Volume2 className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-dark-surface rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-500 [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
