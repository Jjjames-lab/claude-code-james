/**
 * useKeyboardShortcuts - 全局键盘快捷键管理
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：不打断用户，自然、高效
 */

import { useEffect, useRef } from 'react';

export type ShortcutHandler = (e: KeyboardEvent) => void;

export interface ShortcutConfig {
  key: string;
  handler: ShortcutHandler;
  description?: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault?: boolean;
}

export interface ShortcutGroup {
  name: string;
  shortcuts: ShortcutConfig[];
}

export const useKeyboardShortcuts = (shortcutGroups: ShortcutGroup[]) => {
  const handlersRef = useRef<Map<string, ShortcutHandler>>(new Map());

  useEffect(() => {
    // 构建快捷键映射
    const handlersMap = handlersRef.current;
    handlersMap.clear();

    shortcutGroups.forEach(group => {
      group.shortcuts.forEach(shortcut => {
        const key = buildShortcutKey(shortcut);
        handlersMap.set(key, shortcut.handler);
      });
    });

    // 全局键盘事件监听
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = buildShortcutKey({
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
      });

      const handler = handlersMap.get(key);
      if (handler) {
        if (handlersMap.get(key)?.call(e, e)) {
          // 如果 handler 返回 true 或 undefined，阻止默认行为
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutGroups]);

  return {
    // 供帮助面板使用
    shortcuts: shortcutGroups,
  };
};

/**
 * 构建快捷键的唯一标识
 */
function buildShortcutKey(shortcut: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('ctrl');
  if (shortcut.metaKey) parts.push('meta');
  if (shortcut.shiftKey) parts.push('shift');
  if (shortcut.altKey) parts.push('alt');

  parts.push(shortcut.key.toLowerCase());

  return parts.join('+');
}

/**
 * 格式化快捷键显示
 */
export function formatShortcut(shortcut: ShortcutConfig): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('⌃');
  if (shortcut.metaKey) parts.push('⌘');
  if (shortcut.shiftKey) parts.push('⇧');
  if (shortcut.altKey) parts.push('⌥');

  // 特殊键处理
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    'escape': 'Esc',
  };

  const keyDisplay = keyMap[shortcut.key.toLowerCase()] || shortcut.key.toUpperCase();
  parts.push(keyDisplay);

  return parts.join(' + ');
}

/**
 * 预定义的快捷键组
 */
export const predefinedShortcuts = {
  // 播放控制
  playback: {
    name: '播放控制',
    shortcuts: [
      {
        key: ' ',
        description: '播放/暂停',
        handler: () => true, // preventDefault
      },
      {
        key: 'arrowleft',
        metaKey: true,
        description: '后退 10 秒',
        handler: () => true,
      },
      {
        key: 'arrowright',
        metaKey: true,
        description: '前进 10 秒',
        handler: () => true,
      },
      {
        key: 'arrowleft',
        altKey: true,
        description: '后退 5 秒',
        handler: () => true,
      },
      {
        key: 'arrowright',
        altKey: true,
        description: '前进 5 秒',
        handler: () => true,
      },
    ],
  },

  // 搜索
  search: {
    name: '搜索',
    shortcuts: [
      {
        key: 'k',
        metaKey: true,
        ctrlKey: true,
        description: '打开搜索',
        handler: () => true,
      },
    ],
  },

  // 导航
  navigation: {
    name: '导航',
    shortcuts: [
      {
        key: '1',
        description: '切换到概览',
        handler: () => false, // 不阻止默认行为
      },
      {
        key: '2',
        description: '切换到章节',
        handler: () => false,
      },
      {
        key: '3',
        description: '切换到逐字稿',
        handler: () => false,
      },
      {
        key: '4',
        description: '切换到节目单',
        handler: () => false,
      },
      {
        key: 'escape',
        description: '关闭弹窗/返回',
        handler: () => true,
      },
    ],
  },

  // 速度控制
  speed: {
    name: '播放速度',
    shortcuts: [
      {
        key: '=',
        metaKey: true,
        description: '加速',
        handler: () => true,
      },
      {
        key: '-',
        metaKey: true,
        description: '减速',
        handler: () => true,
      },
      {
        key: '0',
        metaKey: true,
        description: '恢复正常速度',
        handler: () => true,
      },
    ],
  },
};
