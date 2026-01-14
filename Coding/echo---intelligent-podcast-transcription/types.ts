export interface Word {
  text: string;
  start: number;
  end: number;
}

export interface Segment {
  speaker: string;
  text: string;
  start: number;
  end: number;
  words: Word[];
}

export interface TranscriptionResult {
  fullText: string;
  duration: number;
  segments: Segment[];
  words: Word[]; // Flattened for easier search
}

export interface AudioMetadata {
  name: string;
  size: number;
  duration: number;
  url: string;
  file: File;
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface UserConfig {
  apiKey: string;
}
