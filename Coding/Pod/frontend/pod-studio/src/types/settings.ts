/**
 * Settings - 设置类型定义
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：让用户轻松管理应用偏好
 */

export type ThemeType = 'light' | 'dark' | 'auto';

export interface Settings {
  // === 外观 ===
  theme: ThemeType;

  // === 播放器 ===
  autoplay: boolean;           // 自动播放
  volumeMemory: boolean;       // 音量记忆
  skipSilence: boolean;        // 跳过静音（未来功能）

  // === 转录 ===
  autoTranscribe: boolean;     // 自动转录
  transcriptLanguage: string;  // 转录语言

  // === 数据 ===
  autoBackup: boolean;         // 自动备份
  backupInterval: number;      // 备份间隔（天）
  maxHistoryItems: number;     // 最大历史记录数

  // === 通知 ===
  enableNotifications: boolean; // 启用通知
  notificationPermission: 'default' | 'granted' | 'denied';
}

export const defaultSettings: Settings = {
  theme: 'dark',
  autoplay: false,
  volumeMemory: true,
  skipSilence: false,
  autoTranscribe: true,
  transcriptLanguage: 'zh-CN',
  autoBackup: false,
  backupInterval: 7,
  maxHistoryItems: 50,
  enableNotifications: false,
  notificationPermission: 'default',
};
