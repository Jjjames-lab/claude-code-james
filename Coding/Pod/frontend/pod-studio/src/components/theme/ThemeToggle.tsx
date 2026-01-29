/**
 * ThemeToggle - 主题切换组件
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：让用户轻松选择舒适的主题
 */

import { useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import type { ThemeType } from '../../types/theme';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = ({ className = '' }: ThemeToggleProps) => {
  const { themeType, setTheme, getResolvedTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  const themes: Array<{ value: ThemeType; label: string; icon: React.ReactNode; description: string }> = [
    {
      value: 'light',
      label: '明亮',
      icon: <Sun className="w-4 h-4" />,
      description: '温暖的白天模式',
    },
    {
      value: 'dark',
      label: '暗黑',
      icon: <Moon className="w-4 h-4" />,
      description: '护眼的夜间模式',
    },
    {
      value: 'auto',
      label: '自动',
      icon: <Monitor className="w-4 h-4" />,
      description: `跟随系统（当前：${getResolvedTheme() === 'dark' ? '暗黑' : '明亮'}）`,
    },
  ];

  const currentTheme = themes.find(t => t.value === themeType) || themes[1];

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* 主题按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border-default)',
          color: 'var(--color-text-primary)',
          transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
          e.currentTarget.style.borderColor = 'var(--color-border-default)';
        }}
        title="切换主题"
      >
        <span style={{ color: 'var(--color-accent-primary)' }}>
          {currentTheme.icon}
        </span>
        <span>{currentTheme.label}</span>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 z-[100]"
            style={{ background: 'transparent' }}
            onClick={() => setIsOpen(false)}
          />

          {/* 菜单 */}
          <div
            className="absolute right-0 top-full mt-2 w-56 rounded-xl z-[101]"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-default)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* 菜单标题 */}
            <div
              className="px-4 py-3 border-b text-xs font-medium"
              style={{
                borderColor: 'var(--color-border-subtle)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              选择主题
            </div>

            {/* 主题选项 */}
            <div className="py-2">
              {themes.map((theme) => {
                const isActive = theme.value === themeType;

                return (
                  <button
                    key={theme.value}
                    onClick={() => handleThemeChange(theme.value)}
                    className="w-full px-4 py-3 flex items-start gap-3 transition-colors"
                    style={{
                      backgroundColor: isActive ? 'var(--color-accent-muted)' : 'transparent',
                      transition: 'background-color 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div
                      className="mt-0.5 p-1.5 rounded"
                      style={{
                        backgroundColor: isActive
                          ? 'var(--color-accent-muted)'
                          : 'var(--color-bg-tertiary)',
                        color: isActive
                          ? 'var(--color-accent-primary)'
                          : 'var(--color-text-secondary)',
                      }}
                    >
                      {theme.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div
                        className="text-sm font-medium mb-0.5"
                        style={{
                          color: isActive
                            ? 'var(--color-accent-primary)'
                            : 'var(--color-text-primary)',
                        }}
                      >
                        {theme.label}
                        {isActive && (
                          <span className="ml-2 text-xs">✓</span>
                        )}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {theme.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 快捷键提示 */}
            <div
              className="px-4 py-2 border-t text-xs"
              style={{
                borderColor: 'var(--color-border-subtle)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              点击外部关闭
            </div>
          </div>
        </>
      )}
    </div>
  );
};
