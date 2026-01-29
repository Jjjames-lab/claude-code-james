/**
 * SettingsPage - 设置页面
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：让用户轻松管理应用偏好
 */

import { useState } from 'react';
import {
  Palette,
  Play,
  Database,
  Bell,
  Info,
  RotateCcw,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useThemeStore } from '../../stores/themeStore';
import { ThemeToggle } from '../theme/ThemeToggle';
import { BackupPanel } from '../backup/BackupPanel';

interface SettingsPageProps {
  onBack: () => void;
}

export const SettingsPage = ({ onBack }: SettingsPageProps) => {
  const {
    autoplay,
    volumeMemory,
    skipSilence,
    autoTranscribe,
    transcriptLanguage,
    autoBackup,
    backupInterval,
    maxHistoryItems,
    enableNotifications,
    updateSetting,
    resetSetting,
  } = useSettingsStore();

  const [showBackup, setShowBackup] = useState(false);

  // 设置项分组
  const settingsGroups = [
    {
      id: 'appearance',
      title: '外观',
      icon: <Palette className="w-5 h-5" />,
      description: '自定义应用的外观',
      settings: [
        {
          key: 'theme' as const,
          label: '主题',
          description: '选择明亮、暗黑或自动模式',
          control: <ThemeToggle />,
        },
      ],
    },
    {
      id: 'player',
      title: '播放器',
      icon: <Play className="w-5 h-5" />,
      description: '播放器行为设置',
      settings: [
        {
          key: 'autoplay' as const,
          label: '自动播放',
          description: '选择播客后自动开始播放',
          control: (
            <ToggleSwitch
              checked={autoplay}
              onChange={(checked) => updateSetting('autoplay', checked)}
            />
          ),
          reset: () => resetSetting('autoplay'),
        },
        {
          key: 'volumeMemory' as const,
          label: '音量记忆',
          description: '记住上次播放的音量',
          control: (
            <ToggleSwitch
              checked={volumeMemory}
              onChange={(checked) => updateSetting('volumeMemory', checked)}
            />
          ),
          reset: () => resetSetting('volumeMemory'),
        },
        {
          key: 'skipSilence' as const,
          label: '跳过静音',
          description: '自动跳过静音部分（即将推出）',
          control: (
            <ToggleSwitch
              checked={skipSilence}
              onChange={(checked) => updateSetting('skipSilence', checked)}
              disabled
            />
          ),
          reset: () => resetSetting('skipSilence'),
        },
      ],
    },
    {
      id: 'transcription',
      title: '转录',
      icon: <Database className="w-5 h-5" />,
      description: '音频转录设置',
      settings: [
        {
          key: 'autoTranscribe' as const,
          label: '自动转录',
          description: '添加音频后自动开始转录',
          control: (
            <ToggleSwitch
              checked={autoTranscribe}
              onChange={(checked) => updateSetting('autoTranscribe', checked)}
            />
          ),
          reset: () => resetSetting('autoTranscribe'),
        },
        {
          key: 'transcriptLanguage' as const,
          label: '转录语言',
          description: '默认转录语言',
          control: (
            <select
              value={transcriptLanguage}
              onChange={(e) => updateSetting('transcriptLanguage', e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="zh-CN">中文（简体）</option>
              <option value="zh-TW">中文（繁体）</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
          ),
          reset: () => resetSetting('transcriptLanguage'),
        },
      ],
    },
    {
      id: 'data',
      title: '数据管理',
      icon: <Database className="w-5 h-5" />,
      description: '管理备份数据',
      settings: [
        {
          key: 'autoBackup' as const,
          label: '自动备份',
          description: '定期自动备份数据',
          control: (
            <ToggleSwitch
              checked={autoBackup}
              onChange={(checked) => updateSetting('autoBackup', checked)}
            />
          ),
          reset: () => resetSetting('autoBackup'),
        },
        {
          key: 'backupInterval' as const,
          label: '备份间隔',
          description: '自动备份的间隔天数',
          control: (
            <select
              value={backupInterval}
              onChange={(e) => updateSetting('backupInterval', Number(e.target.value))}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value={1}>每天</option>
              <option value={7}>每周</option>
              <option value={30}>每月</option>
            </select>
          ),
          reset: () => resetSetting('backupInterval'),
        },
      ],
      actions: [
        {
          label: '备份数据',
          description: '下载所有数据备份文件',
          icon: <Download className="w-4 h-4" />,
          onClick: () => setShowBackup(true),
          style: 'primary' as const,
        },
      ],
    },
    {
      id: 'notifications',
      title: '通知',
      icon: <Bell className="w-5 h-5" />,
      description: '通知设置',
      settings: [
        {
          key: 'enableNotifications' as const,
          label: '启用通知',
          description: '接收学习提醒和更新通知',
          control: (
            <ToggleSwitch
              checked={enableNotifications}
              onChange={(checked) => updateSetting('enableNotifications', checked)}
            />
          ),
          reset: () => resetSetting('enableNotifications'),
        },
      ],
    },
    {
      id: 'about',
      title: '关于',
      icon: <Info className="w-5 h-5" />,
      description: '应用信息',
      info: [
        { label: '版本', value: '1.0.0' },
        { label: '名称', value: '伴读' },
        { label: '愿景', value: '慢下来，深思考' },
      ],
    },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            设置
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            管理你的应用偏好和数据
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg text-sm font-medium"
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
        >
          返回
        </button>
      </div>

      {/* 设置分组 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {settingsGroups.map((group) => (
          <div
            key={group.id}
            className="rounded-xl p-6"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-default)',
            }}
          >
            {/* 分组标题 */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-accent-muted)',
                  color: 'var(--color-accent-primary)',
                }}
              >
                {group.icon}
              </div>
              <div>
                <h3
                  className="text-lg font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {group.title}
                </h3>
                <p
                  className="text-xs"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {group.description}
                </p>
              </div>
            </div>

            {/* 设置项 */}
            {group.settings && (
              <div className="space-y-4">
                {group.settings.map((setting) => (
                  <div
                    key={setting.key}
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <div className="flex-1">
                      <div
                        className="text-sm font-medium mb-1"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {setting.label}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {setting.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {setting.control}
                      {setting.reset && (
                        <button
                          onClick={setting.reset}
                          className="p-2 rounded text-xs"
                          style={{
                            color: 'var(--color-text-tertiary)',
                            transition: 'all 250ms ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--color-accent-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--color-text-tertiary)';
                          }}
                          title="重置为默认值"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 信息项 */}
            {group.info && (
              <div className="space-y-3">
                {group.info.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <span
                      className="text-sm"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 操作按钮 */}
            {group.actions && (
              <div className="flex gap-3">
                {group.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className="flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                    style={
                      action.style === 'primary'
                        ? {
                            backgroundColor: 'var(--color-accent-primary)',
                            color: 'var(--color-bg-primary)',
                            border: '1px solid transparent',
                            transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          }
                        : {
                            backgroundColor: 'var(--color-bg-tertiary)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border-default)',
                            transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          }
                    }
                    onMouseEnter={(e) => {
                      if (action.style === 'primary') {
                        e.currentTarget.style.transform = 'scale(1.02)';
                      } else {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                        e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (action.style === 'primary') {
                        e.currentTarget.style.transform = 'scale(1)';
                      } else {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)';
                        e.currentTarget.style.borderColor = 'var(--color-border-default)';
                      }
                    }}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 备份面板 */}
      {showBackup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'var(--color-overlay-default)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowBackup(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl p-6"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-default)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowBackup(false)}
              className="absolute top-4 right-4 p-2 rounded-lg"
              style={{
                color: 'var(--color-text-tertiary)',
              }}
              title="关闭"
            >
              ✕
            </button>
            <BackupPanel />
          </div>
        </div>
      )}
    </div>
  );
};

// ToggleSwitch 组件
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{
        backgroundColor: checked ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
        transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
        style={{
          transition: 'transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      />
    </button>
  );
}
