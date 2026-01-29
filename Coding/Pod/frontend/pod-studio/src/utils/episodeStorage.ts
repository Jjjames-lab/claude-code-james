/**
 * LocalStorage 管理模块
 * 管理已处理的单集数据和完整单集信息
 */

// ==================== 类型定义 ====================

export interface ProcessedEpisode {
  episodeId: string;
  podcastId: string;
  episodeTitle: string;
  podcastName: string;
  processedAt: string; // ISO 8601 时间戳
}

export interface EpisodeData {
  episodeId: string;
  podcastId: string;
  episodeTitle: string;
  podcastName: string;
  coverImage: string;
  audioUrl: string;
  duration: number;
  showNotes: string;

  // 转录数据
  transcript?: any[]; // TranscriptWord[]
  chapters?: any[]; // Chapter[]
  notes?: any[]; // Note[]

  // 元数据
  processedAt: string;
}

// ==================== 常量定义 ====================

const STORAGE_KEYS = {
  PROCESSED_EPISODES: 'bookshelf_sounds_processed_episodes',
  EPISODE_DATA_PREFIX: 'bookshelf_sounds_episode_',
} as const;

const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

// ==================== 辅助函数 ====================

/**
 * 获取所有已处理的单集列表
 */
function getProcessedEpisodesList(): ProcessedEpisode[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROCESSED_EPISODES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[LocalStorage] Error reading processed episodes list:', error);
    return [];
  }
}

/**
 * 保存已处理的单集列表
 */
function saveProcessedEpisodesList(list: ProcessedEpisode[]): boolean {
  try {
    const data = JSON.stringify(list);

    // 检查存储大小
    if (data.length > MAX_STORAGE_SIZE) {
      console.warn('[LocalStorage] Processed episodes list too large, trimming...');
      // 保留最新的 100 个
      const trimmed = list.slice(-100);
      localStorage.setItem(STORAGE_KEYS.PROCESSED_EPISODES, JSON.stringify(trimmed));
      return true;
    }

    localStorage.setItem(STORAGE_KEYS.PROCESSED_EPISODES, data);
    return true;
  } catch (error) {
    console.error('[LocalStorage] Error saving processed episodes list:', error);
    return false;
  }
}

/**
 * 获取存储使用情况
 */
function getStorageUsage(): { used: number; total: number; percentage: number } {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return {
    used: total,
    total: MAX_STORAGE_SIZE,
    percentage: (total / MAX_STORAGE_SIZE) * 100,
  };
}

// ==================== 主要 API ====================

/**
 * 检查单集是否已处理
 * @param episodeId 单集 ID
 * @returns 是否已处理
 */
export function checkProcessedStatus(episodeId: string): boolean {
  const list = getProcessedEpisodesList();
  return list.some(item => item.episodeId === episodeId);
}

/**
 * 获取已处理单集的信息
 * @param episodeId 单集 ID
 * @returns 已处理单集信息，如果不存在则返回 null
 */
export function getProcessedEpisodeInfo(episodeId: string): ProcessedEpisode | null {
  const list = getProcessedEpisodesList();
  return list.find(item => item.episodeId === episodeId) || null;
}

/**
 * 标记单集为已处理
 * @param info 已处理单集信息
 */
export function markEpisodeAsProcessed(info: ProcessedEpisode): boolean {
  try {
    const list = getProcessedEpisodesList();

    // 检查是否已存在
    const existingIndex = list.findIndex(item => item.episodeId === info.episodeId);

    if (existingIndex >= 0) {
      // 更新现有记录
      list[existingIndex] = info;
    } else {
      // 添加新记录
      list.push(info);
    }

    return saveProcessedEpisodesList(list);
  } catch (error) {
    console.error('[LocalStorage] Error marking episode as processed:', error);
    return false;
  }
}

/**
 * 保存完整的单集数据
 * @param data 单集数据
 * @returns 是否保存成功
 */
export function saveEpisodeData(data: EpisodeData): boolean {
  try {
    const key = STORAGE_KEYS.EPISODE_DATA_PREFIX + data.episodeId;
    const jsonData = JSON.stringify(data);

    // 检查存储大小
    const usage = getStorageUsage();
    if (usage.percentage > 90) {
      console.warn('[LocalStorage] Storage almost full, consider cleaning up old data');
    }

    localStorage.setItem(key, jsonData);

    // 同时标记为已处理
    const processedInfo: ProcessedEpisode = {
      episodeId: data.episodeId,
      podcastId: data.podcastId,
      episodeTitle: data.episodeTitle,
      podcastName: data.podcastName,
      processedAt: new Date().toISOString(),
    };

    markEpisodeAsProcessed(processedInfo);

    console.log(`[LocalStorage] Episode data saved: ${data.episodeTitle}`);
    return true;
  } catch (error) {
    console.error('[LocalStorage] Error saving episode data:', error);

    // 可能是配额超限
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('[LocalStorage] Storage quota exceeded!');
      // TODO: 实现清理策略（删除最旧的数据）
    }

    return false;
  }
}

/**
 * 加载单集数据
 * @param episodeId 单集 ID
 * @returns 单集数据，如果不存在则返回 null
 */
export function loadEpisodeData(episodeId: string): EpisodeData | null {
  try {
    const key = STORAGE_KEYS.EPISODE_DATA_PREFIX + episodeId;
    const data = localStorage.getItem(key);

    if (!data) {
      console.log(`[LocalStorage] Episode data not found: ${episodeId}`);
      return null;
    }

    const episodeData: EpisodeData = JSON.parse(data);
    console.log(`[LocalStorage] Episode data loaded: ${episodeData.episodeTitle}`);
    return episodeData;
  } catch (error) {
    console.error('[LocalStorage] Error loading episode data:', error);
    return null;
  }
}

/**
 * 删除单集数据
 * @param episodeId 单集 ID
 */
export function deleteEpisodeData(episodeId: string): boolean {
  try {
    const key = STORAGE_KEYS.EPISODE_DATA_PREFIX + episodeId;
    localStorage.removeItem(key);

    // 从已处理列表中移除
    const list = getProcessedEpisodesList();
    const filtered = list.filter(item => item.episodeId !== episodeId);
    saveProcessedEpisodesList(filtered);

    console.log(`[LocalStorage] Episode data deleted: ${episodeId}`);
    return true;
  } catch (error) {
    console.error('[LocalStorage] Error deleting episode data:', error);
    return false;
  }
}

/**
 * 清理所有数据（谨慎使用）
 */
export function clearAllData(): boolean {
  try {
    // 只删除 Bookshelf Sounds 相关的数据
    const keysToDelete: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key === STORAGE_KEYS.PROCESSED_EPISODES || key.startsWith(STORAGE_KEYS.EPISODE_DATA_PREFIX))) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => localStorage.removeItem(key));

    console.log(`[LocalStorage] Cleared ${keysToDelete.length} items`);
    return true;
  } catch (error) {
    console.error('[LocalStorage] Error clearing data:', error);
    return false;
  }
}

/**
 * 获取存储统计信息
 */
export function getStorageStats() {
  const list = getProcessedEpisodesList();
  const usage = getStorageUsage();

  return {
    totalProcessed: list.length,
    storageUsage: usage,
    oldestEpisode: list.length > 0 ? list[0].processedAt : null,
    newestEpisode: list.length > 0 ? list[list.length - 1].processedAt : null,
  };
}
