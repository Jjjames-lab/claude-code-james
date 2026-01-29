import { create } from 'zustand';
import type { Podcast, PlayerState } from '../types';

interface PlayerStore extends PlayerState {
  // Actions
  setCurrentPodcast: (podcast: Podcast | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (isMuted: boolean) => void;
  setDuration: (duration: number) => void;
  setBufferedRanges: (ranges: { start: number; end: number }[]) => void;
  togglePlayPause: () => void;
  toggleMute: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  reset: () => void;
}

const initialState: PlayerState = {
  currentPodcast: null,
  isPlaying: false,
  currentTime: 0,
  volume: 1,
  isMuted: false,
  duration: 0,
  bufferedRanges: [],
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  ...initialState,

  setCurrentPodcast: (podcast) => {
    set({ currentPodcast: podcast });
  },

  setIsPlaying: (isPlaying) => {
    set({ isPlaying });
  },

  setCurrentTime: (time) => {
    set({ currentTime: time });
  },

  setVolume: (volume) => {
    set({ volume: Math.max(0, Math.min(1, volume)) });
  },

  setIsMuted: (isMuted) => {
    set({ isMuted });
  },

  setDuration: (duration) => {
    set({ duration });
  },

  setBufferedRanges: (ranges) => {
    set({ bufferedRanges: ranges });
  },

  togglePlayPause: () => {
    const { isPlaying } = get();
    set({ isPlaying: !isPlaying });
  },

  toggleMute: () => {
    const { isMuted } = get();
    set({ isMuted: !isMuted });
  },

  seek: (time) => {
    const { duration } = get();
    // 只有在 duration 已加载时才进行边界限制
    if (duration > 0) {
      set({ currentTime: Math.max(0, Math.min(duration, time)) });
    } else {
      set({ currentTime: Math.max(0, time) });
    }
  },

  skip: (seconds) => {
    const { currentTime, duration } = get();
    const newTime = Math.max(0, currentTime + seconds);
    // 只有在 duration 已加载时才进行边界限制
    if (duration > 0) {
      set({ currentTime: Math.min(duration, newTime) });
    } else {
      set({ currentTime: newTime });
    }
  },

  reset: () => {
    set(initialState);
  },
}));
