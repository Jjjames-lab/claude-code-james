/**
 * StatsService - 学习统计服务
 *
 * 分析用户学习数据，提供统计洞察
 */

import { storageManager } from './storageManager';
import { Trophy, BookOpen, GraduationCap, Pencil, FileText, Flame, Star, Award } from 'lucide-react';

export interface LearningStats {
  totalListeningTime: number;  // 总收听时长（毫秒）
  podcastsListened: number;     // 听过的播客数量
  totalNotes: number;           // 笔记总数
  totalBookmarks: number;       // 书签总数
  activeDays: number;           // 活跃天数
  currentStreak: number;        // 当前连续学习天数
  longestStreak: number;        // 最长连续学习天数
  topPodcasts: Array<{         // 最关注的播客
    name: string;
    count: number;
  }>;
  hourlyActivity: number[];     // 24小时活跃度分布
  weeklyActivity: number[];     // 最近7天活跃度
  achievements: Achievement[];  // 成就列表
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any; // React component (lucide-react icon)
  unlocked: boolean;
  progress?: number;  // 0-100
  target?: number;
}

export class StatsService {
  /**
   * 计算所有学习统计
   */
  calculateStats(): LearningStats {
    try {
      const history = storageManager.loadHistory();

      // 基础统计
      const stats: LearningStats = {
        totalListeningTime: 0,
        podcastsListened: history.length,
        totalNotes: 0,
        totalBookmarks: 0,
        activeDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        topPodcasts: [],
        hourlyActivity: new Array(24).fill(0),
        weeklyActivity: new Array(7).fill(0),
        achievements: this.calculateAchievements(history),
      };

      // 播客名称计数
      const podcastCounts = new Map<string, number>();

      // 日期集合（用于计算活跃天数）
      const activeDates = new Set<string>();
      const today = new Date().toDateString();

      // 当前连续天数
      let currentStreak = 0;
      let checkDate = new Date();

      // 最长连续天数
      let longestStreak = 0;
      let tempStreak = 0;
      let prevDateStr = '';

      // 遍历历史记录
      history.forEach(item => {
        // 收听时长（假设听了一半就算）
        const listenedTime = (item.duration || 0) * 0.5;
        stats.totalListeningTime += listenedTime;

        // 笔记和书签
        if (item.notes) {
          stats.totalNotes += item.notes.length;
        }
        if (item.bookmarks) {
          stats.totalBookmarks += item.bookmarks.length;
        }

        // 播客计数
        const podcastName = item.podcastName || '未知播客';
        podcastCounts.set(podcastName, (podcastCounts.get(podcastName) || 0) + 1);

        // 活跃日期
        if (item.lastPlayedAt) {
          const dateStr = new Date(item.lastPlayedAt).toDateString();
          activeDates.add(dateStr);

          // 小时分布
          const hour = new Date(item.lastPlayedAt).getHours();
          stats.hourlyActivity[hour] += 1;

          // 周分布
          const dayOfWeek = new Date(item.lastPlayedAt).getDay();
          stats.weeklyActivity[dayOfWeek] += 1;
        }
      });

      // 活跃天数
      stats.activeDays = activeDates.size;

      // 计算连续学习天数
      stats.currentStreak = this.calculateCurrentStreak(activeDates);
      stats.longestStreak = this.calculateLongestStreak(activeDates);

      // 最关注的播客（Top 5）
      stats.topPodcasts = Array.from(podcastCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 更新成就进度
      stats.achievements = this.updateAchievementProgress(stats.achievements, stats);

      return stats;
    } catch (error) {
      console.error('[StatsService] 计算统计失败:', error);
      throw error;
    }
  }

  /**
   * 计算当前连续学习天数
   */
  private calculateCurrentStreak(activeDates: Set<string>): number {
    const today = new Date();
    let streak = 0;
    let checkDate = new Date(today);

    while (true) {
      const dateStr = checkDate.toDateString();
      if (activeDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * 计算最长连续学习天数
   */
  private calculateLongestStreak(activeDates: Set<string>): number {
    const sortedDates = Array.from(activeDates).sort();
    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);

      const diffTime = currDate.getTime() - prevDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }

      maxStreak = Math.max(maxStreak, currentStreak);
    }

    return maxStreak;
  }

  /**
   * 计算成就
   */
  private calculateAchievements(history: any[]): Achievement[] {
    const achievements: Achievement[] = [
      {
        id: 'first_podcast',
        title: '初次相遇',
        description: '收听第一个播客',
        icon: Trophy,
        unlocked: history.length > 0,
      },
      {
        id: 'five_podcasts',
        title: '学海无涯',
        description: '收听5个播客',
        icon: BookOpen,
        unlocked: history.length >= 5,
        progress: Math.min(100, (history.length / 5) * 100),
        target: 5,
      },
      {
        id: 'ten_podcasts',
        title: '博学多才',
        description: '收听10个播客',
        icon: GraduationCap,
        unlocked: history.length >= 10,
        progress: Math.min(100, (history.length / 10) * 100),
        target: 10,
      },
      {
        id: 'first_note',
        title: '勤学善思',
        description: '创建第一条笔记',
        icon: Pencil,
        unlocked: history.some(h => h.notes && h.notes.length > 0),
      },
      {
        id: 'ten_notes',
        title: '笔记达人',
        description: '创建10条笔记',
        icon: FileText,
        unlocked: false,  // 动态计算
        progress: 0,
        target: 10,
      },
      {
        id: 'three_day_streak',
        title: '持之以恒',
        description: '连续学习3天',
        icon: Flame,
        unlocked: false,  // 动态计算
        progress: 0,
        target: 3,
      },
      {
        id: 'seven_day_streak',
        title: '一周不辍',
        description: '连续学习7天',
        icon: Star,
        unlocked: false,  // 动态计算
        progress: 0,
        target: 7,
      },
      {
        id: 'thirty_day_streak',
        title: '月度冠军',
        description: '连续学习30天',
        icon: Award,
        unlocked: false,  // 动态计算
        progress: 0,
        target: 30,
      },
    ];

    return achievements;
  }

  /**
   * 更新成就进度
   */
  private updateAchievementProgress(achievements: Achievement[], stats: LearningStats): Achievement[] {
    return achievements.map(achievement => {
      if (achievement.unlocked) return achievement;

      switch (achievement.id) {
        case 'ten_notes':
          achievement.progress = Math.min(100, (stats.totalNotes / achievement.target!) * 100);
          achievement.unlocked = stats.totalNotes >= achievement.target!;
          break;
        case 'three_day_streak':
        case 'seven_day_streak':
        case 'thirty_day_streak':
          achievement.progress = Math.min(100, (stats.currentStreak / achievement.target!) * 100);
          achievement.unlocked = stats.currentStreak >= achievement.target!;
          break;
      }

      return achievement;
    });
  }

  /**
   * 格式化时长
   */
  formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  }

  /**
   * 获取星期名称
   */
  getWeekdayName(dayIndex: number): string {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[dayIndex];
  }

  /**
   * 获取时段名称
   */
  getTimePeriodName(hour: number): string {
    if (hour >= 0 && hour < 6) return '凌晨';
    if (hour >= 6 && hour < 9) return '早晨';
    if (hour >= 9 && hour < 12) return '上午';
    if (hour >= 12 && hour < 14) return '中午';
    if (hour >= 14 && hour < 18) return '下午';
    if (hour >= 18 && hour < 22) return '晚上';
    return '深夜';
  }
}

// 全局统计服务实例
export const statsService = new StatsService();
