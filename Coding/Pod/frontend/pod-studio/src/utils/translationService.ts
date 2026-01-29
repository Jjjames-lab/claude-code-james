/**
 * TranslationService - 翻译服务
 *
 * 提供批量翻译、缓存管理、语言检测等功能
 */

// 翻译段落
export interface TranslateSegment {
  id: string;
  text: string;
}

// 翻译结果
export interface TranslatedSegment {
  id: string;
  translated_text: string;
}

// 翻译缓存项
interface TranslationCacheItem {
  segmentId: string;
  originalText: string;
  translatedText: string;
  targetLang: string;
  timestamp: number;
}

// 翻译响应
interface TranslationAPIResponse {
  success: boolean;
  data: {
    translations: TranslatedSegment[];
    total: number;
    model: string;
    provider: string;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export class TranslationService {
  private cache: Map<string, TranslationCacheItem> = new Map();

  /**
   * 批量翻译
   */
  async translate(
    segments: TranslateSegment[],
    targetLang: 'zh' | 'en' | 'ko' | 'ja',
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, string>> {
    const translations = new Map<string, string>();

    // 过滤未缓存的段落
    const uncachedSegments: TranslateSegment[] = [];
    const cachedTranslations: Map<string, string> = new Map();

    for (const segment of segments) {
      const cacheKey = `${segment.id}_${targetLang}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < 7 * 24 * 60 * 60 * 1000) {
        // 缓存有效（7天内）
        cachedTranslations.set(segment.id, cached.translatedText);
      } else {
        uncachedSegments.push(segment);
      }
    }

    console.log(`[TranslationService] 缓存命中: ${cachedTranslations.size}/${segments.length}`);

    // 翻译未缓存的段落
    if (uncachedSegments.length > 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/llm/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            segments: uncachedSegments,
            target_lang: targetLang,
          }),
        });

        if (!response.ok) {
          throw new Error(`翻译请求失败: ${response.status}`);
        }

        const result: TranslationAPIResponse = await response.json();

        if (result.success && result.data) {
          // 保存到缓存
          for (const trans of result.data.translations) {
            translations.set(trans.id, trans.translated_text);

            // 更新缓存
            this.cache.set(
              `${trans.id}_${targetLang}`,
              {
                segmentId: trans.id,
                originalText: uncachedSegments.find(s => s.id === trans.id)?.text || '',
                translatedText: trans.translated_text,
                targetLang,
                timestamp: Date.now(),
              }
            );
          }

          // 触发进度回调
          onProgress?.(result.data.total, uncachedSegments.length);
        }
      } catch (error) {
        console.error('[TranslationService] 翻译失败:', error);
        throw error;
      }
    }

    // 合并缓存和新的翻译结果
    for (const [id, text] of cachedTranslations) {
      translations.set(id, text);
    }

    // 保存到本地存储
    this.saveCache();

    return translations;
  }

  /**
   * 检测文本语言（简单版）
   */
  detectLanguage(text: string): 'zh' | 'en' | 'other' {
    // 检测是否包含中文字符
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    // 检测是否包含英文单词
    const hasEnglish = /[a-zA-Z]{3,}/.test(text);

    if (hasChinese && !hasEnglish) return 'zh';
    if (hasEnglish && !hasChinese) return 'en';
    if (hasChinese && hasEnglish) return 'other'; // 混合

    // 默认根据字符集判断
    return /[\u4e00-\u9fa5]/.test(text) ? 'zh' : 'en';
  }

  /**
   * 获取可用目标语言列表
   */
  getAvailableTargetLanguages(sourceLang: 'zh' | 'en' | 'other'): Array<{ code: string; name: string; flag: string }> {
    const languages = [
      { code: 'zh', name: '中文', flag: '🇨🇳' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'ko', name: '韩语', flag: '🇰🇷' },
      { code: 'ja', name: '日语', flag: '🇯🇵' },
    ];

    // 过滤掉源语言
    return languages.filter(lang => lang.code !== sourceLang);
  }

  /**
   * 从本地存储加载缓存
   */
  loadCache(): void {
    try {
      const data = localStorage.getItem('translation_cache');
      if (data) {
        const cacheArray: TranslationCacheItem[] = JSON.parse(data);
        this.cache.clear();

        // 只加载 7 天内的缓存
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        for (const item of cacheArray) {
          if (now - item.timestamp < sevenDays) {
            this.cache.set(`${item.segmentId}_${item.targetLang}`, item);
          }
        }

        console.log(`[TranslationService] 加载缓存: ${this.cache.size} 条`);
      }
    } catch (error) {
      console.error('[TranslationService] 加载缓存失败:', error);
    }
  }

  /**
   * 保存缓存到本地存储
   */
  private saveCache(): void {
    try {
      const cacheArray = Array.from(this.cache.values());
      localStorage.setItem('translation_cache', JSON.stringify(cacheArray));
      console.log(`[TranslationService] 保存缓存: ${cacheArray.length} 条`);
    } catch (error) {
      console.error('[TranslationService] 保存缓存失败:', error);
    }
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
    try {
      localStorage.removeItem('translation_cache');
      console.log('[TranslationService] 缓存已清空');
    } catch (error) {
      console.error('[TranslationService] 清空缓存失败:', error);
    }
  }

  /**
   * 格式化语言显示
   */
  formatLanguage(lang: string): string {
    const langMap: Record<string, string> = {
      'zh': '中文',
      'en': 'English',
      'ko': '한국어',
      'ja': '日本語',
    };
    return langMap[lang] || lang;
  }
}

// 全局翻译服务实例
export const translationService = new TranslationService();

// 初始化时加载缓存
translationService.loadCache();
