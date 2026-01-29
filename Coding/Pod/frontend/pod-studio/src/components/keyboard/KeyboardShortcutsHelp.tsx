/**
 * KeyboardShortcutsHelp - 快捷键帮助面板
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：清晰的说明，不侵入
 */

import { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { formatShortcut } from '../../hooks/useKeyboardShortcuts';

interface ShortcutConfig {
  key: string;
  handler: (e: KeyboardEvent) => void;
  description?: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

interface ShortcutGroup {
  name: string;
  shortcuts: ShortcutConfig[];
}

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutGroup[];
}

export const KeyboardShortcutsHelp = ({
  isOpen,
  onClose,
  shortcuts,
}: KeyboardShortcutsHelpProps) => {
  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 150ms ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-xl"
        style={{
          backgroundColor: '#1a1a1d',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: 'rgba(212, 197, 185, 0.1)',
              }}
            >
              <Keyboard
                className="w-5 h-5"
                style={{ color: 'rgba(212, 197, 185, 0.7)' }}
              />
            </div>
            <div>
              <h2
                className="text-lg font-semibold"
                style={{ color: 'rgba(232, 232, 232, 0.9)' }}
              >
                键盘快捷键
              </h2>
              <p
                className="text-xs"
                style={{ color: 'rgba(255, 255, 255, 0.3)' }}
              >
                高效操作，不被打断
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{
              color: 'rgba(255, 255, 255, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="overflow-y-auto custom-scrollbar p-6">
          <div
            className="grid gap-6"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            {shortcuts.map((group) => (
              <div
                key={group.name}
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div
                  className="text-xs font-medium mb-3 px-2"
                  style={{ color: 'rgba(212, 197, 185, 0.7)' }}
                >
                  {group.name}
                </div>

                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 px-2 py-1.5 rounded"
                      style={{
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'rgba(255, 255, 255, 0.03)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div
                        className="text-sm"
                        style={{
                          color: 'rgba(232, 232, 232, 0.7)',
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {shortcut.description}
                      </div>

                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono flex-shrink-0"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: 'rgba(212, 197, 185, 0.8)',
                        }}
                      >
                        {formatShortcut(shortcut)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部提示 */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            className="text-xs"
            style={{ color: 'rgba(255, 255, 255, 0.3)' }}
          >
            按 ESC 或点击外部关闭
          </div>

          <div
            className="text-xs"
            style={{ color: 'rgba(255, 255, 255, 0.3)' }}
          >
            慢下来，深思考
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};
