/**
 * Translation Store - 翻译状态管理
 *
 * 管理翻译状态、缓存、语言选择等
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translationService, TranslateSegment } from '../utils/translationService';

interface TranslationState {
  // 当前显示模式
  viewMode: 'original' | 'bilingual';

  // 翻译状态
  isTranslating: boolean;
  translatingProgress: { current: number; total: number } | null;

  // 翻译数据
  translations: Map<string, string>; // segmentId → 翻译文本

  // 当前选择的语言
  sourceLang: 'zh' | 'en' | 'other';
  targetLang: 'zh' | 'en' | 'ko' | 'ja';

  // Actions
  setViewMode: (mode: 'original' | 'bilingual') => void;
  setTargetLang: (lang: 'zh' | 'en' | 'ko' | 'ja') => void;
  setIsTranslating: (isTranslating: boolean) => void;
  setTranslatingProgress: (progress: { current: number; total: number } | null) => void;
  setTranslations: (translations: Map<string, string>) => void;
  clearTranslations: () => void;
  translateSegments: (segments: TranslateSegment[]) => Promise<void>;
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
      translations: new Map<string, string>(),

      // Actions
      setViewMode: (mode) => set({ viewMode: mode }),

      setTargetLang: (lang) => set({ targetLang: lang }),

      setIsTranslating: (isTranslating) => set({ isTranslating }),

      setTranslatingProgress: (progress) => set({ translatingProgress: progress }),

      setTranslations: (translations) => set({ translations }),

      clearTranslations: () => set({ translations: new Map() }),

      translateSegments: async (segments) => {
        const { targetLang, translations } = get();

        if (!targetLang) {
          console.warn('[TranslationStore] 未设置目标语言');
          return;
        }

        set({ isTranslating: true, translatingProgress: { current: 0, total: segments.length } });

        try {
          const result = await translationService.translate(
            segments,
            targetLang,
            (current, total) => {
              set({ translatingProgress: { current, total } });
            }
          );

          // 合并到现有翻译中
          const newTranslations = new Map(translations);
          for (const [id, text] of result) {
            newTranslations.set(id, text);
          }

          set({ translations: newTranslations });
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
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        translations: new Map(Object.entries(persistedState.translations || {})),
      }),
    }
  )
);
