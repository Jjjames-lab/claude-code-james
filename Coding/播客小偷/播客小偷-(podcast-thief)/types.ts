export interface TranscriptItem {
  speaker: string;
  time: string;
  content: string;
}

export interface Keyword {
  word: string;
  weight: number; // 0 to 1
}

export interface PodcastAnalysis {
  title: string;
  summary: string;
  overview: string[];
  keywords: Keyword[];
  transcript: TranscriptItem[];
}

export enum AppState {
  IDLE,
  ANALYZING_LINK,
  EXTRACTING_AUDIO,
  TRANSCRIBING,
  COMPLETED,
  ERROR
}
