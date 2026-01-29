/**
 * BackupPanel - 数据备份和恢复面板
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：让用户对自己的数据有掌控感
 */

import { useState, useRef, useEffect } from 'react';
import { Download, Upload, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { backupService } from '../../utils/backupService';
import { storageManager } from '../../utils/storageManager';
import type { BackupData } from '../../utils/backupService';

export const BackupPanel = () => {
  const [backupInfo, setBackupInfo] = useState<{
    historyCount: number;
    notesCount: number;
    hasLastPlayed: boolean;
  } | null>(null);
  const [restorePreview, setRestorePreview] = useState<{
    info: any;
    backup: BackupData;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载当前数据统计
  useEffect(() => {
    loadCurrentStats();
  }, []);

  const loadCurrentStats = () => {
    try {
      const history = storageManager.loadHistory();

      // 计算笔记总数
      let totalNotes = 0;
      const notesData = localStorage.getItem(storageManager.NOTES_KEY);
      if (notesData) {
        const entries = JSON.parse(notesData);
        entries.forEach(([, notes]: [string, any[]]) => {
          totalNotes += notes.length;
        });
      }

      const lastPlayed = storageManager.loadLastPlayed();

      setBackupInfo({
        historyCount: history.length,
        notesCount: totalNotes,
        hasLastPlayed: !!lastPlayed,
      });
    } catch (error) {
      console.error('[BackupPanel] 加载统计失败:', error);
    }
  };

  // 下载备份
  const handleDownloadBackup = () => {
    try {
      backupService.downloadBackup();
      showMessage('success', '备份文件已下载');
    } catch (error) {
      console.error('[BackupPanel] 下载失败:', error);
      showMessage('error', '下载备份失败');
    }
  };

  // 选择备份文件
  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = backupService.importBackup(text);
      const info = backupService.getBackupInfo(backup);

      setRestorePreview({ info, backup });
      showMessage('info', '已选择备份文件，请确认恢复');
    } catch (error) {
      console.error('[BackupPanel] 文件解析失败:', error);
      showMessage('error', '备份文件格式无效');
    }

    // 清空 input 以允许重复选择同一文件
    e.target.value = '';
  };

  // 确认恢复
  const handleConfirmRestore = () => {
    if (!restorePreview) return;

    if (confirm(`确定要恢复备份吗？\n\n此操作将覆盖当前所有数据。\n\n备份日期：${restorePreview.info.date}\n\n建议：恢复前请先下载当前数据的备份。`)) {
      setIsRestoring(true);

      try {
        backupService.restoreFromBackup(restorePreview.backup);

        // 重新加载统计
        loadCurrentStats();

        // 清除预览
        setRestorePreview(null);

        showMessage('success', '数据恢复成功，页面将刷新');

        // 延迟刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        console.error('[BackupPanel] 恢复失败:', error);
        showMessage('error', '恢复失败，请重试');
      } finally {
        setIsRestoring(false);
      }
    }
  };

  // 取消恢复
  const handleCancelRestore = () => {
    setRestorePreview(null);
    setMessage(null);
  };

  // 显示消息
  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });

    // 3秒后自动清除
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 当前数据统计 */}
      {backupInfo && (
        <div
          className="p-6 rounded-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <h3
            className="text-lg font-medium mb-4"
            style={{ color: 'rgba(232, 232, 232, 0.9)' }}
          >
            当前数据
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div
                className="text-3xl font-bold mb-2"
                style={{ color: 'rgba(212, 197, 185, 0.8)' }}
              >
                {backupInfo.historyCount}
              </div>
              <div
                className="text-sm"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                个播客记录
              </div>
            </div>

            <div
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div
                className="text-3xl font-bold mb-2"
                style={{ color: 'rgba(212, 197, 185, 0.8)' }}
              >
                {backupInfo.notesCount}
              </div>
              <div
                className="text-sm"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                条笔记
              </div>
            </div>

            <div
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div
                className="text-3xl font-bold mb-2"
                style={{
                  color: backupInfo.hasLastPlayed
                    ? 'rgba(212, 197, 185, 0.8)'
                    : 'rgba(255, 255, 255, 0.2)'
                }}
              >
                {backupInfo.hasLastPlayed ? '✓' : '-'}
              </div>
              <div
                className="text-sm"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                播放记录
              </div>
            </div>
          </div>

          {/* 下载备份按钮 */}
          <div className="mt-6">
            <button
              onClick={handleDownloadBackup}
              disabled={isRestoring}
              className="w-full px-6 py-3 rounded-lg text-sm font-medium transition-all duration-250 flex items-center justify-center gap-3"
              style={{
                backgroundColor: 'rgba(212, 197, 185, 0.1)',
                border: '1px solid rgba(212, 197, 185, 0.25)',
                color: 'rgba(212, 197, 185, 0.8)',
                cursor: isRestoring ? 'not-allowed' : 'pointer',
                opacity: isRestoring ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isRestoring) {
                  e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Download className="w-5 h-5" />
              <span>下载备份文件</span>
            </button>
            <p
              className="text-xs mt-2 text-center"
              style={{ color: 'rgba(255, 255, 255, 0.3)' }}
            >
              建议定期备份，防止数据丢失
            </p>
          </div>
        </div>
      )}

      {/* 恢复数据 */}
      <div
        className="p-6 rounded-xl"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <h3
          className="text-lg font-medium mb-4"
          style={{ color: 'rgba(232, 232, 232, 0.9)' }}
        >
          恢复数据
        </h3>

        {!restorePreview ? (
          <>
            <p
              className="text-sm mb-6"
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              选择之前下载的备份文件，恢复您的数据。恢复将覆盖当前所有数据，请谨慎操作。
            </p>

            <button
              onClick={handleSelectFile}
              className="w-full px-6 py-3 rounded-lg text-sm font-medium transition-all duration-250 flex items-center justify-center gap-3"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
              }}
            >
              <Upload className="w-5 h-5" />
              <span>选择备份文件</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </>
        ) : (
          <div className="space-y-4">
            {/* 备份文件信息 */}
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'rgba(212, 197, 185, 0.05)',
                border: '1px solid rgba(212, 197, 185, 0.1)',
              }}
            >
              <div className="flex items-start gap-3">
                <Info
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  style={{ color: 'rgba(212, 197, 185, 0.7)' }}
                />
                <div className="flex-1">
                  <div
                    className="text-sm font-medium mb-2"
                    style={{ color: 'rgba(212, 197, 185, 0.8)' }}
                  >
                    备份文件信息
                  </div>
                  <div className="space-y-1">
                    <div
                      className="text-xs flex justify-between"
                      style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                    >
                      <span>备份版本</span>
                      <span>{restorePreview.info.version}</span>
                    </div>
                    <div
                      className="text-xs flex justify-between"
                      style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                    >
                      <span>备份日期</span>
                      <span>{restorePreview.info.date}</span>
                    </div>
                    <div
                      className="text-xs flex justify-between"
                      style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                    >
                      <span>播客记录</span>
                      <span>{restorePreview.info.historyCount} 个</span>
                    </div>
                    <div
                      className="text-xs flex justify-between"
                      style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                    >
                      <span>笔记数量</span>
                      <span>{restorePreview.info.notesCount} 条</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 警告提示 */}
            <div
              className="flex items-start gap-3 p-4 rounded-lg"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.1)',
              }}
            >
              <AlertCircle
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                style={{ color: 'rgba(239, 68, 68, 0.6)' }}
              />
              <div
                className="text-sm"
                style={{ color: 'rgba(239, 68, 68, 0.7)' }}
              >
                恢复操作将覆盖当前所有数据，建议先下载当前数据的备份文件
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-250"
                style={{
                  backgroundColor: isRestoring
                    ? 'rgba(212, 197, 185, 0.3)'
                    : 'rgba(212, 197, 185, 0.15)',
                  border: '1px solid rgba(212, 197, 185, 0.3)',
                  color: '#0f0f11',
                  cursor: isRestoring ? 'not-allowed' : 'pointer',
                  opacity: isRestoring ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isRestoring) {
                    e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.25)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.15)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {isRestoring ? '恢复中...' : '确认恢复'}
              </button>

              <button
                onClick={handleCancelRestore}
                disabled={isRestoring}
                className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-250"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: isRestoring ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isRestoring) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className="flex items-center gap-3 p-4 rounded-lg"
          style={{
            backgroundColor:
              message.type === 'success'
                ? 'rgba(212, 197, 185, 0.08)'
                : message.type === 'error'
                ? 'rgba(239, 68, 68, 0.08)'
                : 'rgba(59, 130, 246, 0.08)',
            border:
              message.type === 'success'
                ? '1px solid rgba(212, 197, 185, 0.15)'
                : message.type === 'error'
                ? '1px solid rgba(239, 68, 68, 0.15)'
                : '1px solid rgba(59, 130, 246, 0.15)',
          }}
        >
          {message.type === 'success' && (
            <CheckCircle className="w-5 h-5" style={{ color: 'rgba(212, 197, 185, 0.7)' }} />
          )}
          {message.type === 'error' && (
            <AlertCircle className="w-5 h-5" style={{ color: 'rgba(239, 68, 68, 0.7)' }} />
          )}
          {message.type === 'info' && (
            <Info className="w-5 h-5" style={{ color: 'rgba(59, 130, 246, 0.7)' }} />
          )}
          <span
            className="text-sm"
            style={{
              color:
                message.type === 'success'
                  ? 'rgba(212, 197, 185, 0.8)'
                  : message.type === 'error'
                  ? 'rgba(239, 68, 68, 0.8)'
                  : 'rgba(59, 130, 246, 0.8)',
            }}
          >
            {message.text}
          </span>
        </div>
      )}
    </div>
  );
};
