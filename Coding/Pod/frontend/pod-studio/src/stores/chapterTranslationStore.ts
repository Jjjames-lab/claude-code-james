/**
 * Chapter Translation Store - 章节翻译状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChapterTranslationState {
  // 翻译数据: chapterIndex → { title, points }
  translations: Map<number, { title: string; points: string[] }>;

  // 当前是否正在翻译
  isTranslating: boolean;

  // Actions
  setTranslations: (translations: Map<number, { title: string; points: string[] }>) => void;
  translateChapter: (
    chapterIndex: number,
    title: string,
    points: string[],
    targetLang: string
  ) => Promise<void>;
  translateAllChapters: (
    chapters: Array<{ title: string; points: string[] }>,
    targetLang: string
  ) => Promise<void>;
}

export const useChapterTranslationStore = create<ChapterTranslationState>()(
  persist(
    (set, get) => ({
      translations: new Map(),
      isTranslating: false,

      setTranslations: (translations) => set({ translations }),

      translateChapter: async (chapterIndex, title, points, targetLang) => {
        set({ isTranslating: true });

        try {
          // 构造翻译请求
          const segments = [
            { id: `ch${chapterIndex}_title`, text: title },
            ...points.map((point, idx) => ({
              id: `ch${chapterIndex}_point${idx}`,
              text: point
            }))
          ];

          const response = await fetch('http://localhost:8000/api/v1/llm/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              segments,
              target_lang: targetLang
            }),
          });

          if (!response.ok) {
            throw new Error(`翻译失败: ${response.status}`);
          }

          const result = await response.json();
          const { translations } = result.data;

          // 解析翻译结果
          const translatedTitle = translations.find((t: any) => t.id === `ch${chapterIndex}_title`)?.translated_text || title;
          const translatedPoints = points.map((_, idx) => {
            const translated = translations.find((t: any) => t.id === `ch${chapterIndex}_point${idx}`);
            return translated?.translated_text || '';
          });

          // 更新状态
          const { translations: currentTranslations } = get();
          const newTranslations = new Map(currentTranslations);
          newTranslations.set(chapterIndex, {
            title: translatedTitle,
            points: translatedPoints
          });

          set({ translations: newTranslations });
        } catch (error) {
          console.error('[ChapterTranslationStore] 翻译失败:', error);
          throw error;
        } finally {
          set({ isTranslating: false });
        }
      },

      translateAllChapters: async (chapters, targetLang) => {
        set({ isTranslating: true });

        try {
          const newTranslations = new Map<number, { title: string; points: string[] }>();

          // 逐个翻译章节
          for (let i = 0; i < chapters.length; i++) {
            const chapter = chapters[i];

            const segments = [
              { id: `ch${i}_title`, text: chapter.title },
              ...chapter.points.map((point, idx) => ({
                id: `ch${i}_point${idx}`,
                text: point
              }))
            ];

            const response = await fetch('http://localhost:8000/api/v1/llm/translate', {
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
            const { translations } = result.data;

            const translatedTitle = translations.find((t: any) => t.id === `ch${i}_title`)?.translated_text || chapter.title;
            const translatedPoints = chapter.points.map((_, idx) => {
              const translated = translations.find((t: any) => t.id === `ch${i}_point${idx}`);
              return translated?.translated_text || '';
            });

            newTranslations.set(i, {
              title: translatedTitle,
              points: translatedPoints
            });

            // 实时更新
            set({ translations: newTranslations });
          }
        } catch (error) {
          console.error('[ChapterTranslationStore] 批量翻译失败:', error);
          throw error;
        } finally {
          set({ isTranslating: false });
        }
      },
    }),
    {
      name: 'chapter-translation-storage',
      partialize: (state) => ({
        translations: Object.fromEntries(state.translations),
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        translations: new Map(Object.entries(persistedState.translations || {}).map(([k, v]: [Number(k), v])),
      }),
    }
  )
);
