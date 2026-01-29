// 播客逐字稿数据类型（符合 API 契约）
export interface TranscriptWord {
  text: string;
  start: number; // 毫秒
  end: number; // 毫秒
  speaker: string;
}

export interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  words: TranscriptWord[];
  startTime: number; // 段落开始时间（毫秒）
  endTime: number; // 段落结束时间（毫秒）
}

// 播客信息类型
export interface Podcast {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  coverUrl?: string;
  duration: number; // 毫秒
  createdAt: string;
  transcript: TranscriptSegment[];
}

// 播放器状态
export interface PlayerState {
  currentPodcast: Podcast | null;
  isPlaying: boolean;
  currentTime: number; // 毫秒
  volume: number;
  isMuted: boolean; // 是否静音
  duration: number; // 毫秒
  bufferedRanges: TimeRange[];
}

// 时间范围类型
export interface TimeRange {
  start: number;
  end: number;
}

