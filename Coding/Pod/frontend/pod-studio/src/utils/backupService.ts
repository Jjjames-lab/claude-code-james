/**
 * BackupService - 数据备份和恢复服务
 *
 * 提供用户数据的完整备份和恢复功能
 */

import { storageManager } from './storageManager';

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    history: any[];
    notes: Map<string, any[]>;
    lastPlayed: {
      podcastId: string;
      time: number;
      timestamp: number;
    } | null;
  };
}

export class BackupService {
  /**
   * 创建完整数据备份
   */
  createBackup(): BackupData {
    try {
      const history = storageManager.loadHistory();
      const lastPlayed = storageManager.loadLastPlayed();

      // 获取所有笔记
      const notesMap = new Map<string, any[]>();
      // 尝试从 localStorage 获取所有笔记数据
      const notesData = localStorage.getItem(storageManager.NOTES_KEY);
      if (notesData) {
        const entries = JSON.parse(notesData);
        entries.forEach(([podcastId, notes]: [string, any[]]) => {
          notesMap.set(podcastId, notes);
        });
      }

      const backup: BackupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          history,
          notes: notesMap,
          lastPlayed,
        },
      };

      console.log('[BackupService] 备份创建成功');
      return backup;
    } catch (error) {
      console.error('[BackupService] 创建备份失败:', error);
      throw error;
    }
  }

  /**
   * 从备份恢复数据
   */
  restoreFromBackup(backup: BackupData): void {
    try {
      // 验证备份格式
      if (!backup.version || !backup.data) {
        throw new Error('无效的备份文件格式');
      }

      const { history, notes, lastPlayed } = backup.data;

      // 恢复历史记录
      if (history && Array.isArray(history)) {
        history.forEach(item => {
          storageManager.addToHistory(item);
        });
        console.log(`[BackupService] 恢复了 ${history.length} 条历史记录`);
      }

      // 恢复笔记
      if (notes && notes instanceof Map) {
        const entries = Array.from(notes.entries());
        const notesData = JSON.stringify(entries);
        localStorage.setItem(storageManager.NOTES_KEY, notesData);
        console.log(`[BackupService] 恢复了 ${entries.length} 个播客的笔记`);
      }

      // 恢复最后播放状态
      if (lastPlayed) {
        localStorage.setItem(
          storageManager.LAST_PLAYED_KEY,
          JSON.stringify(lastPlayed)
        );
        console.log('[BackupService] 恢复了最后播放状态');
      }

      console.log('[BackupService] 数据恢复成功');
    } catch (error) {
      console.error('[BackupService] 恢复数据失败:', error);
      throw error;
    }
  }

  /**
   * 将备份导出为 JSON 文件
   */
  exportBackup(): string {
    const backup = this.createBackup();
    return JSON.stringify(backup, null, 2);
  }

  /**
   * 从 JSON 字符串导入备份
   */
  importBackup(jsonString: string): BackupData {
    try {
      const backup = JSON.parse(jsonString) as BackupData;

      // 验证备份格式
      if (!backup.version || !backup.data) {
        throw new Error('备份文件格式无效');
      }

      return backup;
    } catch (error) {
      console.error('[BackupService] 导入备份失败:', error);
      throw new Error('备份文件解析失败');
    }
  }

  /**
   * 触发浏览器下载备份文件
   */
  downloadBackup(): void {
    try {
      const backupData = this.exportBackup();
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = `伴读备份_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('[BackupService] 备份文件已下载');
    } catch (error) {
      console.error('[BackupService] 下载备份失败:', error);
      throw error;
    }
  }

  /**
   * 获取备份信息（用于显示）
   */
  getBackupInfo(backup: BackupData): {
    version: string;
    date: string;
    historyCount: number;
    notesCount: number;
    hasLastPlayed: boolean;
  } {
    const { history, notes, lastPlayed } = backup.data;

    // 计算笔记总数
    let totalNotes = 0;
    if (notes instanceof Map) {
      notes.forEach(noteList => {
        totalNotes += noteList.length;
      });
    }

    return {
      version: backup.version,
      date: new Date(backup.timestamp).toLocaleString('zh-CN'),
      historyCount: history?.length || 0,
      notesCount: totalNotes,
      hasLastPlayed: !!lastPlayed,
    };
  }
}

// 全局备份服务实例
export const backupService = new BackupService();
