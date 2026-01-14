import { create } from 'zustand';

export interface AudioFile {
  id: string;
  name: string;
  url: string | File; // 可以是字符串 URL 或 File 对象
  duration: number;
  file: File;
}

export interface TranscriptionResult {
  fullText: string;
  segments: Array<{
    text: string;
    start: number;
    end: number;
    speaker: string;
  }>;
  duration: number;
  wordCount: number;
}

interface AudioStore {
  currentAudio: AudioFile | null;
  transcription: TranscriptionResult | null;
  isTranscribing: boolean;
  progress: number;
  setCurrentAudio: (audio: AudioFile | null) => void;
  setTranscription: (result: TranscriptionResult | null) => void;
  setTranscribing: (isTranscribing: boolean) => void;
  setProgress: (progress: number) => void;
  reset: () => void;
}

export const useAudioStore = create<AudioStore>()((set) => ({
  currentAudio: null,
  transcription: null,
  isTranscribing: false,
  progress: 0,

  setCurrentAudio: (audio) => set({ currentAudio: audio }),
  setTranscription: (result) => set({ transcription: result }),
  setTranscribing: (isTranscribing) => set({ isTranscribing }),
  setProgress: (progress) => set({ progress }),
  reset: () => set({
    currentAudio: null,
    transcription: null,
    isTranscribing: false,
    progress: 0,
  }),
}));
