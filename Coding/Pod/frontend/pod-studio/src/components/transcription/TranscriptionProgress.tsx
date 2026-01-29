import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { getTranscriptionStatus, type TranscriptTaskResponse } from '../../services/api';

interface TranscriptionProgressProps {
  taskId: string;
  onComplete: (result: TranscriptTaskResponse['result']) => void;
  onError: (error: string) => void;
}

export const TranscriptionProgress = ({
  taskId,
  onComplete,
  onError,
}: TranscriptionProgressProps) => {
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [progress, setProgress] = useState(0);
  const [engine, setEngine] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<number>(0);

  // 轮询任务状态
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const result = await getTranscriptionStatus(taskId);

        if (result.progress !== undefined) {
          setProgress(result.progress);
        }

        if (result.engine) {
          setEngine(result.engine);
        }

        if (result.estimated_time !== undefined) {
          setEstimatedTime(result.estimated_time);
        }

        if (result.status === 'completed') {
          setStatus('completed');
          setProgress(100);
          clearInterval(pollInterval);
          if (result.result) {
            onComplete(result.result);
          }
        } else if (result.status === 'failed') {
          setStatus('failed');
          clearInterval(pollInterval);
          onError('转录失败，请重试');
        }
      } catch (err) {
        setStatus('failed');
        clearInterval(pollInterval);
        onError(err instanceof Error ? err.message : '查询状态失败');
      }
    }, 2000); // 每2秒查询一次

    return () => clearInterval(pollInterval);
  }, [taskId, onComplete, onError]);

  // 状态图标和文本
  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          icon: <Loader2 className="w-6 h-6 animate-spin text-blue-500" />,
          title: '正在转录中...',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-700 dark:text-blue-400',
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
          title: '转录完成！',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-700 dark:text-green-400',
        };
      case 'failed':
        return {
          icon: <XCircle className="w-6 h-6 text-red-500" />,
          title: '转录失败',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-700 dark:text-red-400',
        };
      default:
        return {
          icon: <AlertCircle className="w-6 h-6 text-yellow-500" />,
          title: '未知状态',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-700 dark:text-yellow-400',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`w-full max-w-3xl mx-auto
                    px-6 py-4
                    ${config.bgColor}
                    border ${config.borderColor}
                    rounded-xl
                    transition-all duration-300`}>
      <div className="flex items-center gap-4">
        {/* 状态图标 */}
        <div className="flex-shrink-0">
          {config.icon}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 min-w-0">
          {/* 标题 */}
          <div className={`font-semibold mb-2 ${config.textColor}`}>
            {config.title}
          </div>

          {/* 进度条 */}
          {status === 'processing' && (
            <div className="space-y-2">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* 详细信息 */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div>
                  {progress > 0 ? `进度: ${progress}%` : '准备中...'}
                </div>
                <div className="flex items-center gap-3">
                  {engine && <span>引擎: {engine}</span>}
                  {estimatedTime > 0 && <span>预计: {Math.ceil(estimatedTime / 60)}分钟</span>}
                </div>
              </div>
            </div>
          )}

          {/* 完成状态 */}
          {status === 'completed' && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              转录结果已准备就绪，可以开始查看了
            </div>
          )}

          {/* 失败状态 */}
          {status === 'failed' && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              请检查音频链接是否有效，或稍后重试
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
