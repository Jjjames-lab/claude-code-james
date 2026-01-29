/**
 * StatsPanel - 学习统计面板
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：让用户看到自己的进步，激励持续学习
 */

import { useState, useEffect } from 'react';
import { Clock, Book, Bookmark, TrendingUp, Award, Calendar, BarChart3, Mic, Star, Headphones, FileText, BookmarkCheck } from 'lucide-react';
import { statsService } from '../../utils/statsService';
import type { LearningStats, Achievement } from '../../utils/statsService';

export const StatsPanel = () => {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载统计数据
    setTimeout(() => {
      try {
        const calculatedStats = statsService.calculateStats();
        setStats(calculatedStats);
      } catch (error) {
        console.error('[StatsPanel] 加载统计失败:', error);
      } finally {
        setLoading(false);
      }
    }, 500); // 短暂延迟，让过渡更平滑
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div
          className="w-14 h-14 mb-6 rounded-full"
          style={{
            backgroundColor: 'rgba(212, 197, 185, 0.4)',
            animation: 'breathe 3s ease-in-out infinite',
          }}
        />
        <p
          className="text-base"
          style={{ color: 'rgba(232, 232, 232, 0.7)' }}
        >
          正在统计数据...
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <BarChart3 className="w-16 h-16 mb-6" style={{ color: 'rgba(212, 197, 185, 0.3)' }} />
        <h3
          className="text-xl font-medium mb-3"
          style={{ color: 'rgba(232, 232, 232, 0.7)' }}
        >
          暂无统计数据
        </h3>
        <p
          className="text-base"
          style={{ color: 'rgba(255, 255, 255, 0.3)' }}
        >
          开始收听播客后，这里会显示你的学习统计
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Headphones}
          label="总收听时长"
          value={statsService.formatDuration(stats.totalListeningTime)}
        />
        <StatCard
          icon={Mic}
          label="收听播客"
          value={`${stats.podcastsListened} 个`}
        />
        <StatCard
          icon={FileText}
          label="创建笔记"
          value={`${stats.totalNotes} 条`}
        />
        <StatCard
          icon={BookmarkCheck}
          label="添加书签"
          value={`${stats.totalBookmarks} 个`}
        />
      </div>

      {/* 连续学习统计 */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <StatCard
          icon="📅"
          label="活跃天数"
          value={`${stats.activeDays} 天`}
        />
        <StatCard
          icon="🔥"
          label="当前连续"
          value={`${stats.currentStreak} 天`}
        />
        <StatCard
          icon="⭐"
          label="最长连续"
          value={`${stats.longestStreak} 天`}
        />
      </div>

      {/* 成就系统 */}
      {stats.achievements.length > 0 && (
        <div
          className="p-6 rounded-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <h3
            className="text-lg font-medium mb-4 flex items-center gap-2"
            style={{ color: 'rgba(232, 232, 232, 0.9)' }}
          >
            <Award className="w-5 h-5" style={{ color: 'rgba(212, 197, 185, 0.6)' }} />
            学习成就
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </div>
      )}

      {/* 最关注的播客 */}
      {stats.topPodcasts.length > 0 && (
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
            最关注的播客
          </h3>

          <div className="space-y-2">
            {stats.topPodcasts.map((podcast, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: 'rgba(212, 197, 185, 0.1)',
                      color: 'rgba(212, 197, 185, 0.7)',
                    }}
                  >
                    {index + 1}
                  </div>
                  <span
                    className="text-sm"
                    style={{ color: 'rgba(232, 232, 232, 0.8)' }}
                  >
                    {podcast.name}
                  </span>
                </div>
                <div
                  className="text-sm font-mono px-3 py-1 rounded"
                  style={{
                    backgroundColor: 'rgba(212, 197, 185, 0.08)',
                    color: 'rgba(212, 197, 185, 0.7)',
                  }}
                >
                  {podcast.count} 次
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 学习习惯分析 */}
      {(stats.hourlyActivity.some(v => v > 0) || stats.weeklyActivity.some(v => v > 0)) && (
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
            学习习惯
          </h3>

          {/* 时段分布 */}
          {stats.hourlyActivity.some(v => v > 0) && (
            <div className="mb-6">
              <h4
                className="text-sm font-medium mb-3"
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
                喜欢在什么时候听
              </h4>
              <div className="flex items-end gap-1 h-24">
                {stats.hourlyActivity.map((count, hour) => {
                  const maxCount = Math.max(...stats.hourlyActivity);
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  const isActive = count > 0;

                  return (
                    <div
                      key={hour}
                      className="flex-1 flex flex-col items-center justify-end"
                      style={{ gap: '8px' }}
                    >
                      <div
                        className="w-full rounded-t transition-all duration-500"
                        style={{
                          height: `${height}%`,
                          backgroundColor: isActive
                            ? 'rgba(212, 197, 185, 0.5)'
                            : 'transparent',
                          minHeight: isActive ? '4px' : '0',
                        }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                      >
                        {hour % 3 === 0 ? statsService.getTimePeriodName(hour) : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 周分布 */}
          {stats.weeklyActivity.some(v => v > 0) && (
            <div>
              <h4
                className="text-sm font-medium mb-3"
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
                最近一周
              </h4>
              <div className="flex items-end gap-1 h-24">
                {stats.weeklyActivity.map((count, dayIndex) => {
                  const maxCount = Math.max(...stats.weeklyActivity);
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  const isActive = count > 0;

                  return (
                    <div
                      key={dayIndex}
                      className="flex-1 flex flex-col items-center justify-end"
                      style={{ gap: '8px' }}
                    >
                      <div
                        className="w-full rounded-t transition-all duration-500"
                        style={{
                          height: `${height}%`,
                          backgroundColor: isActive
                            ? 'rgba(212, 197, 185, 0.5)'
                            : 'transparent',
                          minHeight: isActive ? '4px' : '0',
                        }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                      >
                        {statsService.getWeekdayName(dayIndex)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 统计卡片组件
interface StatCardProps {
  icon: any; // lucide-react icon component
  label: string;
  value: string;
}

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div
      className="p-5 rounded-xl text-center"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
      }}
    >
      <div className="mb-2 flex justify-center">
        <Icon className="w-10 h-10" style={{ color: 'rgba(212, 197, 185, 0.6)' }} />
      </div>
      <div
        className="text-2xl font-bold mb-1"
        style={{ color: 'rgba(212, 197, 185, 0.8)' }}
      >
        {value}
      </div>
      <div
        className="text-xs"
        style={{ color: 'rgba(255, 255, 255, 0.4)' }}
      >
        {label}
      </div>
    </div>
  );
}

// 成就卡片组件
interface AchievementCardProps {
  achievement: Achievement;
}

function AchievementCard({ achievement }: AchievementCardProps) {
  const Icon = achievement.icon;

  return (
    <div
      className="p-4 rounded-lg"
      style={{
        backgroundColor: achievement.unlocked
          ? 'rgba(212, 197, 185, 0.08)'
          : 'rgba(255, 255, 255, 0.02)',
        border: achievement.unlocked
          ? '1px solid rgba(212, 197, 185, 0.15)'
          : '1px solid rgba(255, 255, 255, 0.06)',
        transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: achievement.unlocked
              ? 'rgba(212, 197, 185, 0.1)'
              : 'rgba(255, 255, 255, 0.03)',
            filter: achievement.unlocked ? 'none' : 'grayscale(1) opacity(0.3)',
          }}
        >
          <Icon
            className="w-6 h-6"
            style={{
              color: achievement.unlocked
                ? 'rgba(212, 197, 185, 0.8)'
                : 'rgba(255, 255, 255, 0.4)',
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-medium mb-1"
            style={{
              color: achievement.unlocked
                ? 'rgba(212, 197, 185, 0.9)'
                : 'rgba(255, 255, 255, 0.4)',
            }}
          >
            {achievement.title}
          </div>
          <div
            className="text-xs mb-2"
            style={{
              color: achievement.unlocked
                ? 'rgba(232, 232, 232, 0.7)'
                : 'rgba(255, 255, 255, 0.3)',
            }}
          >
            {achievement.description}
          </div>

          {/* 进度条 */}
          {!achievement.unlocked && achievement.target && achievement.progress !== undefined && (
            <div className="w-full h-1.5 rounded-full overflow-hidden mt-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${achievement.progress}%`,
                  backgroundColor: 'rgba(212, 197, 185, 0.4)',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
