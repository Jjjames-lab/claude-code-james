/**
 * SettingsStore - 设置状态管理
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：让用户的偏好得到妥善保存
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, defaultSettings } from '../types/settings';

interface SettingsStore extends Settings {
  /** 更新单个设置 */
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;

  /** 批量更新设置 */
  updateSettings: (updates: Partial<Settings>) => void;

  /** 重置所有设置 */
  resetSettings: () => void;

  /** 重置单个设置为默认值 */
  resetSetting: <K extends keyof Settings>(key: K) => void;
}

const STORAGE_KEY = 'bandu-settings';

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // 默认设置（会在 persist 中被覆盖）
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

      updateSetting: (key, value) => {
        set({ [key]: value });
        console.log('[SettingsStore] 设置已更新:', key, '=', value);
      },

      updateSettings: (updates) => {
        set(updates);
        console.log('[SettingsStore] 批量更新设置:', updates);
      },

      resetSettings: () => {
        const { defaultSettings } = require('../types/settings');
        set(defaultSettings);
        console.log('[SettingsStore] 所有设置已重置');
      },

      resetSetting: (key) => {
        const { defaultSettings } = require('../types/settings');
        set({ [key]: defaultSettings[key] });
        console.log('[SettingsStore] 设置已重置:', key);
      },
    }),
    {
      name: STORAGE_KEY,
      // 持久化所有设置
      partialize: (state) => ({
        theme: state.theme,
        autoplay: state.autoplay,
        volumeMemory: state.volumeMemory,
        skipSilence: state.skipSilence,
        autoTranscribe: state.autoTranscribe,
        transcriptLanguage: state.transcriptLanguage,
        autoBackup: state.autoBackup,
        backupInterval: state.backupInterval,
        maxHistoryItems: state.maxHistoryItems,
        enableNotifications: state.enableNotifications,
        notificationPermission: state.notificationPermission,
      }),
    }
  )
);
