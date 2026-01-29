/**
 * TranscriptionStats - 转录统计卡片
 *
 * 显示转录完成后的性能统计
 */

import { Clock, DollarSign, Zap, TrendingUp, X } from 'lucide-react';

interface TranscriptionStatsProps {
  engine: string;
  duration: number; // 音频时长（毫秒）
  elapsedTime: number; // 转录耗时（毫秒）
  wordCount: number;
  onClose?: () => void;
}

export const TranscriptionStats = ({
  engine,
  duration,
  elapsedTime,
  wordCount,
  onClose,
}: TranscriptionStatsProps) => {
  // 计算统计数据
  const durationSeconds = duration / 1000;
  const elapsedSeconds = elapsedTime / 1000;
  const speed = durationSeconds / elapsedSeconds; // 处理速度（x倍实时）

  // 费用估算
  const funasrCost = durationSeconds * 0.00022;
  const doubaoCost = durationSeconds * 0.001;

  // 根据引擎计算实际费用
  const actualCost = engine === 'funasr' ? funasrCost : doubaoCost;
  const savedCost = engine === 'funasr' ? doubaoCost - funasrCost : 0;

  // 节省的时间（相比豆包标准版，假设豆包标准版是 8x 实时）
  const doubaoEstimatedTime = durationSeconds / 8;
  const savedTime = Math.max(0, doubaoEstimatedTime - elapsedSeconds);

  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{
        background: 'rgba(212, 197, 185, 0.08)',
        border: '1px solid rgba(212, 197, 185, 0.2)',
      }}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium" style={{ color: 'rgba(212, 197, 185, 0.9)' }}>
          转录统计
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-1 rounded"
            style={{
              backgroundColor: engine === 'funasr'
                ? 'rgba(34, 197, 94, 0.2)'
                : 'rgba(59, 130, 246, 0.2)',
              color: engine === 'funasr'
                ? 'rgba(34, 197, 94, 1)'
                : 'rgba(59, 130, 246, 1)',
            }}
          >
            {engine === 'funasr' ? 'FunASR' : '豆包标准版'}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 统计数据网格 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 速度 */}
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgba(212, 197, 185, 0.7)' }} />
          <div>
            <div className="text-xs mb-0.5" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              处理速度
            </div>
            <div className="text-base font-semibold" style={{ color: 'rgba(212, 197, 185, 0.95)' }}>
              {speed.toFixed(1)}x
            </div>
            <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              实时速度
            </div>
          </div>
        </div>

        {/* 耗时 */}
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgba(212, 197, 185, 0.7)' }} />
          <div>
            <div className="text-xs mb-0.5" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              转录耗时
            </div>
            <div className="text-base font-semibold" style={{ color: 'rgba(212, 197, 185, 0.95)' }}>
              {elapsedSeconds < 60
                ? `${elapsedSeconds.toFixed(0)}秒`
                : `${(elapsedSeconds / 60).toFixed(1)}分钟`}
            </div>
            <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              音频: {durationSeconds < 60
                ? `${durationSeconds.toFixed(0)}秒`
                : `${(durationSeconds / 60).toFixed(1)}分钟`}
            </div>
          </div>
        </div>

        {/* 费用 */}
        <div className="flex items-start gap-2">
          <DollarSign className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgba(212, 197, 185, 0.7)' }} />
          <div>
            <div className="text-xs mb-0.5" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              本期费用
            </div>
            <div className="text-base font-semibold" style={{ color: 'rgba(212, 197, 185, 0.95)' }}>
              ¥{actualCost.toFixed(3)}
            </div>
            {engine === 'funasr' && savedCost > 0 && (
              <div className="text-xs" style={{ color: 'rgba(34, 197, 94, 0.8)' }}>
                节省 ¥{savedCost.toFixed(3)}
              </div>
            )}
          </div>
        </div>

        {/* 词数 */}
        <div className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgba(212, 197, 185, 0.7)' }} />
          <div>
            <div className="text-xs mb-0.5" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              词语数量
            </div>
            <div className="text-base font-semibold" style={{ color: 'rgba(212, 197, 185, 0.95)' }}>
              {wordCount.toLocaleString()}
            </div>
            <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              平均每秒 {(wordCount / durationSeconds).toFixed(1)} 词
            </div>
          </div>
        </div>
      </div>

      {/* 优势提示（仅 FunASR） */}
      {engine === 'funasr' && (savedTime > 10 || savedCost > 0.1) && (
        <div
          className="mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
          style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }}
        >
          <span style={{ color: 'rgba(34, 197, 94, 1)' }}>✨</span>
          <span style={{ color: 'rgba(34, 197, 94, 0.9)' }}>
            {savedTime > 10 && `快 ${savedTime.toFixed(0)} 秒`}
            {savedTime > 10 && savedCost > 0.1 && ' · '}
            {savedCost > 0.1 && `省 ¥${savedCost.toFixed(2)}`}
            {savedTime > 10 && savedCost > 0.1 && ' 相比豆包标准版'}
          </span>
        </div>
      )}
    </div>
  );
};
