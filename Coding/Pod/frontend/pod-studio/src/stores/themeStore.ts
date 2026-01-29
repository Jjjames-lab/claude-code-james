/**
 * ThemeStore - 主题状态管理
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：让用户选择舒适的视觉体验
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeType, Theme } from '../types/theme';

interface ThemeStore {
  /** 主题类型 */
  themeType: ThemeType;

  /** 设置主题类型 */
  setTheme: (theme: ThemeType) => void;

  /** 获取当前实际主题（解析 auto 模式） */
  getResolvedTheme: () => 'light' | 'dark';

  /** 切换主题（light -> dark -> auto -> light） */
  toggleTheme: () => void;
}

const STORAGE_KEY = 'bandu-theme';

// 检测系统主题偏好
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'dark';

  // 检查媒体查询
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      themeType: 'dark',  // 默认暗色主题，符合"慢下来，深思考"的愿景

      setTheme: (theme: ThemeType) => {
        set({ themeType: theme });

        // 应用主题到 DOM
        applyTheme(theme);
      },

      getResolvedTheme: () => {
        const { themeType } = get();
        if (themeType === 'auto') {
          return getSystemTheme();
        }
        return themeType;
      },

      toggleTheme: () => {
        const { themeType } = get();
        const nextTheme: ThemeType =
          themeType === 'light' ? 'dark' : themeType === 'dark' ? 'auto' : 'light';

        get().setTheme(nextTheme);
      },
    }),
    {
      name: STORAGE_KEY,
      // 只持久化 themeType
      partialize: (state) => ({ themeType: state.themeType }),
    }
  )
);

/**
 * 应用主题到 DOM
 */
function applyTheme(themeType: ThemeType) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 解析 auto 模式
  const resolvedTheme = themeType === 'auto' ? getSystemTheme() : themeType;

  // 移除旧的主题类
  root.classList.remove('theme-light', 'theme-dark');

  // 添加新的主题类
  root.classList.add(`theme-${resolvedTheme}`);

  // 设置 data-theme 属性（用于 CSS 选择器）
  root.setAttribute('data-theme', resolvedTheme);

  // 设置 CSS 自定义属性
  applyThemeColors(resolvedTheme);

  console.log('[ThemeStore] 主题已切换:', themeType, '→', resolvedTheme);
}

/**
 * 应用主题颜色 CSS 变量
 */
function applyThemeColors(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 动态导入颜色配置
  import('../types/theme').then(({ lightThemeColors, darkThemeColors }) => {
    const colors = theme === 'light' ? lightThemeColors : darkThemeColors;

    // 背景色
    root.style.setProperty('--color-bg-primary', colors.background.primary);
    root.style.setProperty('--color-bg-secondary', colors.background.secondary);
    root.style.setProperty('--color-bg-tertiary', colors.background.tertiary);
    root.style.setProperty('--color-bg-elevated', colors.background.elevated);

    // 文字色
    root.style.setProperty('--color-text-primary', colors.text.primary);
    root.style.setProperty('--color-text-secondary', colors.text.secondary);
    root.style.setProperty('--color-text-tertiary', colors.text.tertiary);
    root.style.setProperty('--color-text-disabled', colors.text.disabled);

    // 主题色
    root.style.setProperty('--color-accent-primary', colors.accent.primary);
    root.style.setProperty('--color-accent-secondary', colors.accent.secondary);
    root.style.setProperty('--color-accent-muted', colors.accent.muted);

    // 边框色
    root.style.setProperty('--color-border-default', colors.border.default);
    root.style.setProperty('--color-border-subtle', colors.border.subtle);
    root.style.setProperty('--color-border-strong', colors.border.strong);

    // 状态色
    root.style.setProperty('--color-status-success', colors.status.success);
    root.style.setProperty('--color-status-warning', colors.status.warning);
    root.style.setProperty('--color-status-error', colors.status.error);
    root.style.setProperty('--color-status-info', colors.status.info);

    // 遮罩
    root.style.setProperty('--color-overlay-default', colors.overlay.default);
    root.style.setProperty('--color-overlay-blur', colors.overlay.blur);
  });
}

/**
 * 监听系统主题变化（auto 模式下）
 */
export function initSystemThemeListener() {
  if (typeof window === 'undefined' || !window.matchMedia) return;

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = () => {
    const { themeType, getResolvedTheme } = useThemeStore.getState();

    // 只在 auto 模式下响应系统主题变化
    if (themeType === 'auto') {
      applyTheme('auto');
      console.log('[ThemeStore] 系统主题已变化，当前实际主题:', getResolvedTheme());
    }
  };

  // 现代浏览器使用 addEventListener
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
  } else {
    // 旧版浏览器兼容
    mediaQuery.addListener(handleChange);
  }

  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.removeListener(handleChange);
    }
  };
}

/**
 * 初始化主题（在应用启动时调用）
 */
export function initTheme() {
  const { themeType } = useThemeStore.getState();
  applyTheme(themeType);
  initSystemThemeListener();
}
