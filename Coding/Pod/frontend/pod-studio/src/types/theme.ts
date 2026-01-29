/**
 * Theme - 主题类型定义
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：温暖的明暗主题，保护用户眼睛
 */

export type ThemeType = 'light' | 'dark' | 'auto';

export interface Theme {
  type: ThemeType;
  // auto 模式下的实际主题
  resolvedTheme: 'light' | 'dark';
}

export interface ThemeColors {
  // 背景色
  background: {
    primary: string;      // 主背景
    secondary: string;    // 次背景
    tertiary: string;     // 第三层背景
    elevated: string;     // 悬浮卡片背景
  };

  // 文字色
  text: {
    primary: string;      // 主文字
    secondary: string;    // 次文字
    tertiary: string;     // 辅助文字
    disabled: string;     // 禁用文字
  };

  // 主题色
  accent: {
    primary: string;      // 主强调色
    secondary: string;    // 次强调色
    muted: string;        // 弱强调色
  };

  // 边框色
  border: {
    default: string;      // 默认边框
    subtle: string;       // 细边框
    strong: string;       // 强边框
  };

  // 状态色
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  // 遮罩
  overlay: {
    default: string;
    blur: string;
  };
}

// 主题配色方案
export const lightThemeColors: ThemeColors = {
  background: {
    primary: '#faf9f7',      // 温暖的米白色
    secondary: '#f5f3f0',    // 稍深的米色
    tertiary: '#efede9',     // 更深的米色
    elevated: '#ffffff',     // 白色卡片
  },
  text: {
    primary: '#2c2a29',      // 深灰黑
    secondary: '#5c5a58',    // 中灰
    tertiary: '#8c8a88',     // 浅灰
    disabled: '#bcbaba',     // 更浅灰
  },
  accent: {
    primary: '#c4a882',      // 温暖的金棕色
    secondary: '#d4c5b9',    // 米色
    muted: 'rgba(196, 168, 130, 0.1)',  // 淡金棕色
  },
  border: {
    default: 'rgba(44, 42, 41, 0.08)',  // 浅边框
    subtle: 'rgba(44, 42, 41, 0.04)',   // 更浅边框
    strong: 'rgba(44, 42, 41, 0.15)',   // 强边框
  },
  status: {
    success: '#5b9f5b',     // 柔和的绿色
    warning: '#c9a655',     // 温暖的黄色
    error: '#c45b5b',       // 柔和的红色
    info: '#5b8fc4',        // 柔和的蓝色
  },
  overlay: {
    default: 'rgba(44, 42, 41, 0.5)',
    blur: 'rgba(44, 42, 41, 0.3)',
  },
};

export const darkThemeColors: ThemeColors = {
  background: {
    primary: '#0f0f11',      // 深色背景
    secondary: '#1a1a1d',    // 次深色
    tertiary: '#242428',     // 第三层
    elevated: '#2a2a2e',     // 悬浮卡片
  },
  text: {
    primary: '#e8e8e8',      // 主文字
    secondary: 'rgba(232, 232, 232, 0.7)',  // 次文字
    tertiary: 'rgba(255, 255, 255, 0.4)',   // 辅助文字
    disabled: 'rgba(255, 255, 255, 0.2)',   // 禁用文字
  },
  accent: {
    primary: '#d4c5b9',      // 米色强调色
    secondary: '#c4a882',    // 金棕色
    muted: 'rgba(212, 197, 185, 0.1)',      // 淡米色
  },
  border: {
    default: 'rgba(255, 255, 255, 0.08)',   // 浅边框
    subtle: 'rgba(255, 255, 255, 0.04)',    // 更浅边框
    strong: 'rgba(255, 255, 255, 0.15)',    // 强边框
  },
  status: {
    success: '#7cb97c',     // 柔和的绿色
    warning: '#d4b56a',     // 温暖的黄色
    error: '#d47c7c',       // 柔和的红色
    info: '#7ca3d4',        // 柔和的蓝色
  },
  overlay: {
    default: 'rgba(0, 0, 0, 0.6)',
    blur: 'rgba(0, 0, 0, 0.4)',
  },
};
