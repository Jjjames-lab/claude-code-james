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
          // 清除旧缓存（因为之前使用的是错误的key）
          const newTranslations = new Map<string, string>();
          console.log('[TranslationStore] 清除旧翻译缓存');

          // 分批翻译：每批25个段落
          const BATCH_SIZE = 25;
          const batches = [];
          for (let i = 0; i < segments.length; i += BATCH_SIZE) {
            batches.push(segments.slice(i, i + BATCH_SIZE));
          }

          console.log(`[TranslationStore] 分 ${batches.length} 批翻译，每批最多 ${BATCH_SIZE} 个段落`);

          // 并发翻译：同时发送2批请求（平衡速度和稳定性）
          const CONCURRENT_BATCHES = 2;

          for (let batchStart = 0; batchStart < batches.length; batchStart += CONCURRENT_BATCHES) {
            const concurrentBatches = batches.slice(batchStart, batchStart + CONCURRENT_BATCHES);

            // 并发执行多个批次
            const results = await Promise.all(
              concurrentBatches.map(async (batch, idx) => {
                const batchIndex = batchStart + idx;
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

                return { result, batchIndex };
              })
            );

            // 合并所有并发批次的翻译结果
            for (const { result, batchIndex } of results) {
              for (const [id, text] of result) {
                newTranslations.set(id, text);
              }
              console.log(`[TranslationStore] 第 ${batchIndex + 1} 批完成，新增 ${result.size} 条`);
            }

            // 更新翻译结果（实时显示）
            set({ translations: newTranslations });
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
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        translations: new Map(Object.entries(persistedState.translations || {})),
      }),
    }
  )
);
