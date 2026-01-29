/**
 * LanguageSelector - 语言选择器组件
 *
 * 提供目标语言选择功能，自动过滤源语言
 */

import { createPortal } from 'react-dom';
import { translationService } from '../../utils/translationService';

interface LanguageSelectorProps {
  onClose: () => void;
  onSelect: (lang: 'zh' | 'en' | 'ko' | 'ja') => void;
}

export const LanguageSelector = ({ onClose, onSelect }: LanguageSelectorProps) => {
  // 检测源语言（简化版，默认假设是中文）
  const sourceLang: 'zh' | 'en' | 'other' = 'zh';

  // 获取可用目标语言
  const availableLanguages = translationService.getAvailableTargetLanguages(sourceLang);

  const handleSelect = (langCode: string) => {
    onSelect(langCode as 'zh' | 'en' | 'ko' | 'ja');
  };

  return createPortal(
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
        onClick={onClose}
      />

      {/* 语言选择器 */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-full max-w-sm">
        <div
          className="rounded-xl p-4 shadow-2xl"
          style={{
            backgroundColor: 'rgba(30, 30, 35, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* 标题 */}
          <h3 className="text-lg font-semibold text-white mb-4">
            选择翻译语言
          </h3>

          {/* 语言列表 */}
          <div className="space-y-2">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className="w-full px-4 py-3 rounded-lg text-left transition-all duration-200 hover:scale-[1.02] flex items-center gap-3"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(212, 197, 185, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-white font-medium">{lang.name}</span>
              </button>
            ))}
          </div>

          {/* 取消按钮 */}
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            取消
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};
