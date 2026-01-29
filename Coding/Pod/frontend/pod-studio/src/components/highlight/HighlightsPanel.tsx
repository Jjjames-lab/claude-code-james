/**
 * HighlightsPanel - Highlights 展示面板组件
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：让用户可以快速发现和回顾精彩片段
 */

import { useState, useEffect } from 'react';
import { Sparkles, Copy, Trash2, ExternalLink } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { formatTime } from '../../utils';

interface Highlight {
  id: string;
  text: string;
  timestamp: number;
  reason: string;
  category: 'quote' | 'insight' | 'data' | 'conclusion';
}

interface HighlightsPanelProps {
  transcript: string;
  podcastId: string;
}

export const HighlightsPanel = ({ transcript, podcastId }: HighlightsPanelProps) => {
  const { seek } = usePlayerStore();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 生成 Highlights
  const handleGenerateHighlights = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8001/api/v1/llm/generate-highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          max_highlights: 10,
          topic: '',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setHighlights(result.data.highlights);
      } else {
        throw new Error('API 返回格式错误');
      }

    } catch (err) {
      console.error('[HighlightsPanel] 生成 Highlights 失败:', err);
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setLoading(false);
    }
  };

  // 跳转到时间戳
  const handleJumpToTimestamp = (timestamp: number) => {
    seek(timestamp);
  };

  // 复制到剪贴板
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 可以添加复制成功的提示
      console.log('[HighlightsPanel] 已复制到剪贴板');
    } catch (err) {
      console.error('[HighlightsPanel] 复制失败:', err);
    }
  };

  // 删除高亮
  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条金句吗')) {
      setHighlights(prev => prev.filter(h => h.id !== id));
    }
  };

  // 获取分类标签
  const getCategoryLabel = (category: Highlight['category']) => {
    const labels = {
      quote: '💬 金句',
      insight: '💡 洞察',
      data: '📊 数据',
      conclusion: '✅ 结论',
    };
    return labels[category] || category;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 生成按钮 */}
      {!loading && highlights.length === 0 && (
        <button
          onClick={handleGenerateHighlights}
          className="w-full p-6 rounded-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-2xl">✨</span>
            <span
              className="text-lg font-medium"
              style={{ color: 'rgba(232, 232, 232, 0.9)' }}
            >
              提取金句
            </span>
          </div>
          <p
            className="text-sm"
            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          >
            AI 帮你发现播客中的精彩片段
          </p>
        </button>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {/* 呼吸动画圆圈 */}
          <div
            className="w-14 h-14 mx-auto mb-6 rounded-full"
            style={{
              backgroundColor: 'rgba(212, 197, 185, 0.4)',
              animation: 'breathe 3s ease-in-out infinite',
            }}
          />
          <p
            className="text-base mb-2"
            style={{ color: 'rgba(232, 232, 232, 0.7)' }}
          >
            正在提取精彩片段
          </p>
          <p
            className="text-sm"
            style={{ color: 'rgba(255, 255, 255, 0.3)' }}
          >
            需要一点时间，请耐心等待
          </p>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div
          className="p-8 rounded-xl text-center"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
          }}
        >
          <p
            className="mb-6"
            style={{ color: 'rgba(239, 68, 68, 0.8)', fontSize: '15px' }}
          >
            {error}
          </p>
          <button
            onClick={handleGenerateHighlights}
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-250"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'rgba(239, 68, 68, 0.8)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            再试一次
          </button>
        </div>
      )}

      {/* Highlights 列表 */}
      {!loading && highlights.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {highlights.map((highlight, index) => (
            <div
              key={highlight.id || index}
              className="group p-5 rounded-xl transition-all duration-250"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              {/* 头部：分类和时间戳 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* 分类标签 */}
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs"
                    style={{
                      backgroundColor: 'rgba(212, 197, 185, 0.1)',
                      color: 'rgba(212, 197, 185, 0.7)',
                    }}
                  >
                    {getCategoryLabel(highlight.category)}
                  </span>

                  {/* 时间戳 */}
                  <button
                    onClick={() => handleJumpToTimestamp(highlight.timestamp)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'rgba(255, 255, 255, 0.4)',
                      transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                    title="跳转到这个位置"
                  >
                    <Clock className="w-3 h-3" />
                    {formatTime(highlight.timestamp)}
                  </button>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-250">
                  <button
                    onClick={() => handleCopy(highlight.text)}
                    className="p-2 rounded text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
                    title="复制"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(highlight.id || `${index}`)}
                    className="p-2 rounded text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 高光文字 */}
              <div
                className="text-base leading-relaxed mb-3 p-3 rounded"
                style={{
                  backgroundColor: 'rgba(212, 197, 185, 0.05)',
                  borderLeft: '3px solid rgba(212, 197, 185, 0.2)',
                  color: 'rgba(232, 232, 232, 0.8)',
                }}
              >
                "{highlight.text}"
              </div>

              {/* 重要性理由 */}
              {highlight.reason && (
                <div className="text-sm mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  💡 {highlight.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes breathe {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};
