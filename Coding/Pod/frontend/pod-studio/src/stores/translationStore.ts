/**
 * Translation Store - 翻译状态管理
 *
 * 管理翻译状态、缓存、语言选择等
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translationService, type TranslateSegment } from '../utils/translationService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface TranslationState {
  // 当前显示模式
  viewMode: 'original' | 'bilingual';

  // 翻译状态
  isTranslating: boolean;
  translatingProgress: { current: number; total: number } | null;
  isTranslatingChapters: boolean;

  // 翻译数据
  translations: Map<string, string>; // segmentId → 翻译文本
  chapterTranslations: Map<number, { title: string; points: string[] }>; // chapterIndex → {title, points}

  // 当前选择的语言
  sourceLang: 'zh' | 'en' | 'other';
  targetLang: 'zh' | 'en' | 'ko' | 'ja';

  // Actions
  setViewMode: (mode: 'original' | 'bilingual') => void;
  setTargetLang: (lang: 'zh' | 'en' | 'ko' | 'ja') => void;
  setIsTranslating: (isTranslating: boolean) => void;
  setTranslatingProgress: (progress: { current: number; total: number } | null) => void;
  setTranslations: (translations: Map<string, string>) => void;
  setChapterTranslations: (chapterTranslations: Map<number, { title: string; points: string[] }>) => void;
  clearTranslations: () => void;
  translateSegments: (segments: TranslateSegment[], chapters?: Array<{ title: string; points: string[] }>) => Promise<void>;
}

export const useTranslationStore = create<TranslationState>()(
  persist(
    (set, get) => ({
      // 当前显示模式（默认原文）
      viewMode: 'original',
      sourceLang: 'zh',
      targetLang: 'en',

      // 翻译状态
      isTranslating: false,
      translatingProgress: null,
      isTranslatingChapters: false,
      translations: new Map<string, string>(),
      chapterTranslations: new Map<number, { title: string; points: string[] }>(),

      // Actions
      setViewMode: (mode) => set({ viewMode: mode }),

      setTargetLang: (lang) => set({ targetLang: lang }),

      setIsTranslating: (isTranslating) => set({ isTranslating }),

      setTranslatingProgress: (progress) => set({ translatingProgress: progress }),

      setTranslations: (translations) => set({ translations }),

      setChapterTranslations: (chapterTranslations) => set({ chapterTranslations }),

      clearTranslations: () => set({ translations: new Map(), chapterTranslations: new Map() }),

      translateSegments: async (segments, chapters) => {
        const { targetLang, translations: currentTranslations, chapterTranslations: currentChapterTranslations } = get();

        if (!targetLang) {
          console.warn('[TranslationStore] 未设置目标语言');
          return;
        }

        const totalItems = segments.length + (chapters?.length || 0);
        set({ isTranslating: true, translatingProgress: { current: 0, total: totalItems } });

        try {
          const newTranslations = new Map(currentTranslations);
          const newChapterTranslations = new Map(currentChapterTranslations);

          // 1. 翻译逐字稿
          const BATCH_SIZE = 10;
          const batches = [];
          for (let i = 0; i < segments.length; i += BATCH_SIZE) {
            batches.push(segments.slice(i, i + BATCH_SIZE));
          }

          console.log(`[TranslationStore] 开始翻译逐字稿，共 ${batches.length} 批`);

          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            console.log(`[TranslationStore] 正在翻译第 ${batchIndex + 1}/${batches.length} 批`);

            const result = await translationService.translate(
              batch,
              targetLang,
              (current, total) => {
                const completedCount = batchIndex * BATCH_SIZE + current;
                set({ translatingProgress: { current: completedCount, total: totalItems } });
              }
            );

            for (const [id, text] of result) {
              newTranslations.set(id, text);
            }

            console.log(`[TranslationStore] 第 ${batchIndex + 1} 批完成，新增 ${result.size} 条`);
            set({ translations: newTranslations });

            if (batchIndex < batches.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          // 2. 翻译章节
          if (chapters && chapters.length > 0) {
            console.log(`[TranslationStore] 开始翻译章节，共 ${chapters.length} 个`);

            for (let i = 0; i < chapters.length; i++) {
              const chapter = chapters[i];

              const segments = [
                { id: `ch${i}_title`, text: chapter.title },
                ...chapter.points.map((point, idx) => ({
                  id: `ch${i}_point${idx}`,
                  text: point
                }))
              ];

              const response = await fetch(`${API_BASE_URL}/llm/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  segments,
                  target_lang: targetLang
                }),
              });

              if (!response.ok) {
                throw new Error(`翻译第${i + 1}个章节失败: ${response.status}`);
              }

              const result = await response.json();
              const { translations: chapterTranslationsList } = result.data;

              const translatedTitle = chapterTranslationsList.find((t: any) => t.id === `ch${i}_title`)?.translated_text || chapter.title;
              const translatedPoints = chapter.points.map((_, idx) => {
                const translated = chapterTranslationsList.find((t: any) => t.id === `ch${i}_point${idx}`);
                return translated?.translated_text || '';
              });

              newChapterTranslations.set(i, {
                title: translatedTitle,
                points: translatedPoints
              });

              set({ chapterTranslations: newChapterTranslations });
            }
          }

          console.log('[TranslationStore] 所有翻译完成');
        } catch (error) {
          console.error('[TranslationStore] 翻译失败:', error);
          throw error;
        } finally {
          set({ isTranslating: false, translatingProgress: null });
        }
      },
    }),
    {
      name: 'translation-storage',
      partialize: (state) => ({
        viewMode: state.viewMode,
        sourceLang: state.sourceLang,
        targetLang: state.targetLang,
        translations: Object.fromEntries(state.translations),
        chapterTranslations: Object.fromEntries(state.chapterTranslations),
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        translations: new Map(Object.entries(persistedState.translations || {})),
        chapterTranslations: new Map(Object.entries(persistedState.chapterTranslations || {}).map(([k, v]) => [Number(k), v])),
      }),
    }
  )
);
