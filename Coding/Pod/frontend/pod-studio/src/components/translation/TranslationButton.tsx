/**
 * TranslationButton - 翻译按钮组件
 *
 * 提供翻译功能入口，包括语言选择和翻译状态显示
 */

import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { useTranslationStore } from '../../stores/translationStore';
import { LanguageSelector } from './LanguageSelector';

interface TranslationButtonProps {
  onTranslate?: (targetLang: string) => void;
}

export const TranslationButton = ({ onTranslate }: TranslationButtonProps) => {
  const {
    targetLang,
    isTranslating,
    translatingProgress,
    setTargetLang,
  } = useTranslationStore();

  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const handleClick = () => {
    if (isTranslating) return;
    setShowLanguageSelector(true);
  };

  const handleLanguageSelect = (lang: 'zh' | 'en' | 'ko' | 'ja') => {
    setTargetLang(lang);
    setShowLanguageSelector(false);
    onTranslate?.(lang);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isTranslating}
        className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        title={targetLang ? `翻译为 ${getLanguageName(targetLang)}` : '选择翻译语言'}
      >
        {isTranslating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              翻译中 {translatingProgress && `(${translatingProgress.current}/${translatingProgress.total})`}
            </span>
          </>
        ) : (
          <>
            <Languages className="w-4 h-4" />
            <span>翻译</span>
            {targetLang && (
              <span className="px-1.5 py-0.5 rounded text-xs" style={{
                backgroundColor: 'rgba(212, 197, 185, 0.2)',
                color: 'rgba(212, 197, 185, 0.9)',
              }}>
                {getLanguageFlag(targetLang)}
              </span>
            )}
          </>
        )}
      </button>

      {showLanguageSelector && (
        <LanguageSelector
          onClose={() => setShowLanguageSelector(false)}
          onSelect={handleLanguageSelect}
        />
      )}
    </>
  );
};

function getLanguageName(lang: string): string {
  const names = {
    'zh': '中文',
    'en': 'English',
    'ko': '한국어',
    'ja': '日本語',
  };
  return names[lang] || lang;
}

function getLanguageFlag(lang: string): string {
  const flags = {
    'zh': '🇨🇳',
    'en': '🇺🇸',
    'ko': '🇰🇷',
    'ja': '🇯🇵',
  };
  return flags[lang] || '';
}
