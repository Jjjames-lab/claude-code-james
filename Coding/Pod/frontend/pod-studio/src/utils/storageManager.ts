/**
 * StorageManager - LocalStorage 持久化管理器
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：数据不丢失，用户可以安心离开
 */

interface StorageData {
  currentPodcast: any | null;
  transcripts: Map<string, any>;
  notes: Map<string, any[]>;
  history: HistoryItem[];
  lastPlayed: {
    podcastId: string;
    time: number;
    timestamp: number;
  } | null;
}

export interface HistoryItem {
  id: string;
  title: string;
  podcastName: string;
  coverImage?: string;
  duration: number;
  transcript: any[];
  notes: any[];
  createdAt: string;
  lastPlayedAt: string;
  lastPosition: number;
}

class StorageManager {
  private readonly CURRENT_PODCAST_KEY = 'pod_helper_current_podcast';
  private readonly TRANSCRIPTS_KEY = 'pod_helper_transcripts';
  private readonly NOTES_KEY = 'pod_helper_notes';
  private readonly HISTORY_KEY = 'pod_helper_history';
  private readonly LAST_PLAYED_KEY = 'pod_helper_last_played';

  private readonly MAX_STORAGE_SIZE = 4.5 * 1024 * 1024; // 4.5MB (localStorage 限制 5MB)
  private readonly MAX_HISTORY_ITEMS = 50;

  /**
   * 保存当前播客状态
   */
  saveCurrentPodcast(podcast: any): void {
    try {
      const data = JSON.stringify(podcast);
      this.checkAndCleanStorage(data.length);

      localStorage.setItem(this.CURRENT_PODCAST_KEY, data);
      console.log('[Storage] 当前播客已保存');
    } catch (error) {
      console.error('[Storage] 保存播客失败:', error);
      this.handleStorageError();
    }
  }

  /**
   * 加载当前播客状态
   */
  loadCurrentPodcast(): any | null {
    try {
      const data = localStorage.getItem(this.CURRENT_PODCAST_KEY);
      if (data) {
        const podcast = JSON.parse(data);
        console.log('[Storage] 当前播客已加载');
        return podcast;
      }
      return null;
    } catch (error) {
      console.error('[Storage] 加载播客失败:', error);
      return null;
    }
  }

  /**
   * 清除当前播客状态
   */
  clearCurrentPodcast(): void {
    localStorage.removeItem(this.CURRENT_PODCAST_KEY);
    console.log('[Storage] 当前播客已清除');
  }

  /**
   * 保存转录结果
   */
  saveTranscript(podcastId: string, transcript: any[]): void {
    try {
      const transcripts = this.loadAllTranscripts();
      transcripts.set(podcastId, transcript);

      const data = JSON.stringify(Array.from(transcripts.entries()));
      this.checkAndCleanStorage(data.length);

      localStorage.setItem(this.TRANSCRIPTS_KEY, data);
      console.log('[Storage] 转录结果已保存:', podcastId);
    } catch (error) {
      console.error('[Storage] 保存转录失败:', error);
      this.handleStorageError();
    }
  }

  /**
   * 加载转录结果
   */
  loadTranscript(podcastId: string): any[] | null {
    try {
      const transcripts = this.loadAllTranscripts();
      return transcripts.get(podcastId) || null;
    } catch (error) {
      console.error('[Storage] 加载转录失败:', error);
      return null;
    }
  }

  /**
   * 加载所有转录
   */
  private loadAllTranscripts(): Map<string, any[]> {
    try {
      const data = localStorage.getItem(this.TRANSCRIPTS_KEY);
      if (data) {
        const entries = JSON.parse(data);
        return new Map(entries);
      }
      return new Map();
    } catch (error) {
      console.error('[Storage] 加载所有转录失败:', error);
      return new Map();
    }
  }

  /**
   * 保存笔记
   */
  saveNotes(podcastId: string, notes: any[]): void {
    try {
      const allNotes = this.loadAllNotes();
      allNotes.set(podcastId, notes);

      const data = JSON.stringify(Array.from(allNotes.entries()));
      this.checkAndCleanStorage(data.length);

      localStorage.setItem(this.NOTES_KEY, data);
      console.log('[Storage] 笔记已保存:', podcastId, notes.length, '条');
    } catch (error) {
      console.error('[Storage] 保存笔记失败:', error);
      this.handleStorageError();
    }
  }

  /**
   * 加载笔记
   */
  loadNotes(podcastId: string): any[] {
    try {
      const allNotes = this.loadAllNotes();
      return allNotes.get(podcastId) || [];
    } catch (error) {
      console.error('[Storage] 加载笔记失败:', error);
      return [];
    }
  }

  /**
   * 加载所有笔记
   */
  private loadAllNotes(): Map<string, any[]> {
    try {
      const data = localStorage.getItem(this.NOTES_KEY);
      if (data) {
        const entries = JSON.parse(data);
        return new Map(entries);
      }
      return new Map();
    } catch (error) {
      console.error('[Storage] 加载所有笔记失败:', error);
      return new Map();
    }
  }

  /**
   * 添加到历史记录
   */
  addToHistory(item: HistoryItem): void {
    try {
      let history = this.loadHistory();

      // 移除重复项
      history = history.filter(h => h.id !== item.id);

      // 添加到开头
      history.unshift(item);

      // 限制历史记录数量
      if (history.length > this.MAX_HISTORY_ITEMS) {
        history = history.slice(0, this.MAX_HISTORY_ITEMS);
      }

      const data = JSON.stringify(history);
      this.checkAndCleanStorage(data.length);

      localStorage.setItem(this.HISTORY_KEY, data);
      console.log('[Storage] 已添加到历史:', item.title);
    } catch (error) {
      console.error('[Storage] 添加历史失败:', error);
      this.handleStorageError();
    }
  }

  /**
   * 更新历史记录（更新播放位置）
   */
  updateHistoryItem(podcastId: string, updates: Partial<HistoryItem>): void {
    try {
      const history = this.loadHistory();
      const index = history.findIndex(item => item.id === podcastId);

      if (index !== -1) {
        history[index] = {
          ...history[index],
          ...updates,
          lastPlayedAt: new Date().toISOString(),
        };

        const data = JSON.stringify(history);
        localStorage.setItem(this.HISTORY_KEY, data);
        console.log('[Storage] 历史记录已更新:', podcastId);
      }
    } catch (error) {
      console.error('[Storage] 更新历史失败:', error);
    }
  }

  /**
   * 加载历史记录
   */
  loadHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(this.HISTORY_KEY);
      if (data) {
        const history = JSON.parse(data);
        // 按最后播放时间排序
        return history.sort((a: HistoryItem, b: HistoryItem) =>
          new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime()
        );
      }
      return [];
    } catch (error) {
      console.error('[Storage] 加载历史失败:', error);
      return [];
    }
  }

  /**
   * 删除历史记录项
   */
  deleteHistoryItem(podcastId: string): void {
    try {
      const history = this.loadHistory();
      const filtered = history.filter(item => item.id !== podcastId);

      const data = JSON.stringify(filtered);
      localStorage.setItem(this.HISTORY_KEY, data);
      console.log('[Storage] 历史记录已删除:', podcastId);
    } catch (error) {
      console.error('[Storage] 删除历史失败:', error);
    }
  }

  /**
   * 清空历史记录
   */
  clearHistory(): void {
    localStorage.removeItem(this.HISTORY_KEY);
    console.log('[Storage] 历史记录已清空');
  }

  /**
   * 保存最后播放状态
   */
  saveLastPlayed(podcastId: string, time: number): void {
    try {
      const data = JSON.stringify({
        podcastId,
        time,
        timestamp: Date.now(),
      });
      localStorage.setItem(this.LAST_PLAYED_KEY, data);
      console.log('[Storage] 最后播放状态已保存:', podcastId, time);
    } catch (error) {
      console.error('[Storage] 保存播放状态失败:', error);
    }
  }

  /**
   * 加载最后播放状态
   */
  loadLastPlayed(): {
    podcastId: string;
    time: number;
    timestamp: number;
  } | null {
    try {
      const data = localStorage.getItem(this.LAST_PLAYED_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('[Storage] 加载播放状态失败:', error);
      return null;
    }
  }

  /**
   * 检查存储容量
   */
  checkCapacity(): boolean {
    try {
      const totalSize = this.getStorageSize();
      const usagePercent = (totalSize / this.MAX_STORAGE_SIZE) * 100;

      console.log(`[Storage] 容量使用: ${(usagePercent).toFixed(1)}%`);

      if (usagePercent > 90) {
        console.warn('[Storage] 存储空间不足，需要清理');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Storage] 检查容量失败:', error);
      return false;
    }
  }

  /**
   * 计算当前存储大小
   */
  private getStorageSize(): number {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }

  /**
   * 清理旧数据
   */
  private cleanupOldItems(): void {
    console.log('[Storage] 开始清理旧数据');

    try {
      // 清理超过30天的历史记录
      const history = this.loadHistory();
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const filtered = history.filter(item =>
        new Date(item.lastPlayedAt).getTime() > thirtyDaysAgo
      );

      if (filtered.length < history.length) {
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(filtered));
        console.log('[Storage] 已清理', history.length - filtered.length, '条旧历史记录');
      }

      // 清理没有对应历史记录的转录数据
      const historyIds = new Set(filtered.map(h => h.id));
      const transcripts = this.loadAllTranscripts();

      for (const [podcastId] of transcripts.entries()) {
        if (!historyIds.has(podcastId)) {
          transcripts.delete(podcastId);
          console.log('[Storage] 已清理旧转录数据:', podcastId);
        }
      }

      const transcriptsData = JSON.stringify(Array.from(transcripts.entries()));
      localStorage.setItem(this.TRANSCRIPTS_KEY, transcriptsData);

    } catch (error) {
      console.error('[Storage] 清理失败:', error);
    }
  }

  /**
   * 检查并清理存储空间
   */
  private checkAndCleanStorage(additionalSize: number): void {
    const currentSize = this.getStorageSize();
    const newSize = currentSize + additionalSize;

    if (newSize > this.MAX_STORAGE_SIZE) {
      console.warn('[Storage] 存储空间不足，开始清理');
      this.cleanupOldItems();

      // 再次检查
      const sizeAfterCleanup = this.getStorageSize();
      if (sizeAfterCleanup + additionalSize > this.MAX_STORAGE_SIZE) {
        throw new Error('存储空间不足，请清理一些历史记录');
      }
    }
  }

  /**
   * 处理存储错误
   */
  private handleStorageError(): void {
    console.error('[Storage] 存储错误，尝试清理');

    try {
      this.cleanupOldItems();

      // 如果还是不行，清空所有历史
      if (!this.checkCapacity()) {
        console.warn('[Storage] 清理后仍不足，清空历史记录');
        this.clearHistory();
      }
    } catch (error) {
      console.error('[Storage] 处理存储错误失败:', error);
    }
  }

  /**
   * 导出所有数据（用于备份）
   */
  exportAllData(): string {
    const data = {
      currentPodcast: this.loadCurrentPodcast(),
      transcripts: Array.from(this.loadAllTranscripts().entries()),
      notes: Array.from(this.loadAllNotes().entries()),
      history: this.loadHistory(),
      lastPlayed: this.loadLastPlayed(),
      exportDate: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * 导入数据（用于恢复）
   */
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.currentPodcast) {
        this.saveCurrentPodcast(data.currentPodcast);
      }

      if (data.transcripts) {
        localStorage.setItem(this.TRANSCRIPTS_KEY, JSON.stringify(data.transcripts));
      }

      if (data.notes) {
        localStorage.setItem(this.NOTES_KEY, JSON.stringify(data.notes));
      }

      if (data.history) {
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(data.history));
      }

      if (data.lastPlayed) {
        localStorage.setItem(this.LAST_PLAYED_KEY, JSON.stringify(data.lastPlayed));
      }

      console.log('[Storage] 数据导入成功');
      return true;
    } catch (error) {
      console.error('[Storage] 数据导入失败:', error);
      return false;
    }
  }

  /**
   * 清空所有数据
   */
  clearAll(): void {
    localStorage.removeItem(this.CURRENT_PODCAST_KEY);
    localStorage.removeItem(this.TRANSCRIPTS_KEY);
    localStorage.removeItem(this.NOTES_KEY);
    localStorage.removeItem(this.HISTORY_KEY);
    localStorage.removeItem(this.LAST_PLAYED_KEY);
    console.log('[Storage] 所有数据已清空');
  }
}

// 导出单例
export const storageManager = new StorageManager();
