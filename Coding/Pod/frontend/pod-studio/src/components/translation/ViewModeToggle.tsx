/**
 * ViewModeToggle - 视图模式切换按钮
 *
 * 在"仅原文"和"双语对照"之间切换
 */

import { useTranslationStore } from '../../stores/translationStore';

export const ViewModeToggle = () => {
  const { viewMode, setViewMode, translations } = useTranslationStore();

  // 如果没有翻译内容，不显示切换按钮
  if (translations.size === 0) {
    return null;
  }

  const isBilingual = viewMode === 'bilingual';

  return (
    <button
      onClick={() => setViewMode(isBilingual ? 'original' : 'bilingual')}
      className={`text-sm transition-colors px-3 py-1.5 rounded-lg ${
        isBilingual
          ? 'text-white bg-white/10'
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
      title={isBilingual ? '切换到仅原文' : '切换到双语对照'}
    >
      {isBilingual ? '双语' : '原文'}
    </button>
  );
};
