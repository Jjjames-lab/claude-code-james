/**
 * Translation Store - 翻译状态管理
 *
 * 管理翻译状态、缓存、语言选择等
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translationService, type TranslateSegment } from '../utils/translationService';

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
  setChapterTranslations: (translations: Map<number, { title: string; points: string[] }>) => void;
  clearTranslations: () => void;
  translateSegments: (segments: TranslateSegment[]) => Promise<void>;
  translateChapters: (chapters: Array<{ title: string; points: string[] }>) => Promise<void>;
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

      translateSegments: async (segments, chapters?: Array<{ title: string; points: string[] }>) => {
        const { targetLang } = get();

        if (!targetLang) {
          console.warn('[TranslationStore] 未设置目标语言');
          return;
        }

        const totalItems = segments.length + (chapters?.length || 0);
        set({ isTranslating: true, translatingProgress: { current: 0, total: totalItems } });

        try {
          // 分批翻译：每批10个段落（保守配置，确保稳定性）
          const BATCH_SIZE = 10;
          const batches = [];
          for (let i = 0; i < segments.length; i += BATCH_SIZE) {
            batches.push(segments.slice(i, i + BATCH_SIZE));
          }

          console.log(`[TranslationStore] 分 ${batches.length} 批翻译，每批 ${BATCH_SIZE} 个段落`);
          console.log(`[TranslationStore] 串行执行，确保稳定性`);

          const newTranslations = new Map<string, string>();

          // 串行执行：一次只发送一批
          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            console.log(`[TranslationStore] 正在翻译第 ${batchIndex + 1}/${batches.length} 批`);

            const result = await translationService.translate(
              batch,
              targetLang,
              (current, total) => {
                // 更新总体进度
                const completedCount = batchIndex * BATCH_SIZE + current;
                set({ translatingProgress: { current: completedCount, total: segments.length } });
              }
            );

            // 合并到现有翻译中
            for (const [id, text] of result) {
              newTranslations.set(id, text);
            }

            console.log(`[TranslationStore] 第 ${batchIndex + 1} 批完成，新增 ${result.size} 条`);

            // 更新翻译结果（实时显示）
            set({ translations: newTranslations });

            // 批次之间短暂暂停，避免API限流
            if (batchIndex < batches.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          console.log('[TranslationStore] 所有批次翻译完成');
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
        chapterTranslations: new Map(Object.entries(persistedState.chapterTranslations || {}).map(([k, v]: [Number(k), v])),
      }),
    }
  )
);
