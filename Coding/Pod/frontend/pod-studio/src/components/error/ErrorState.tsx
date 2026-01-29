import { Link, Mic, Cpu } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  type: 'parse' | 'transcribe' | 'llm';
  onRetry?: () => void;
}

export const ErrorState = ({ error, type, onRetry }: ErrorStateProps) => {
  const errorConfig = {
    'parse': {
      icon: Link,
      title: '链接解析失败',
      description: '请检查链接是否正确，或稍后重试',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-700 dark:text-red-400',
    },
    'transcribe': {
      icon: Mic,
      title: '转录失败',
      description: 'ASR服务异常，请稍后重试',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-700 dark:text-red-400',
    },
    'llm': {
      icon: Cpu,
      title: 'AI处理失败',
      description: 'LLM服务异常，请稍后重试',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-700 dark:text-red-400',
    },
  };

  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center py-20 px-4 ${config.bgColor} ${config.borderColor} border rounded-lg`}>
      {/* 图标 */}
      <div className={`w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center mb-4`}>
        <Icon className={`w-8 h-8 ${config.textColor}`} />
      </div>

      {/* 标题 */}
      <h3 className={`text-xl font-semibold ${config.textColor} mb-2`}>
        {config.title}
      </h3>

      {/* 描述 */}
      <p className="text-slate-600 dark:text-slate-400 mb-4 text-center">
        {config.description}
      </p>

      {/* 错误详情 */}
      {error && (
        <div className="mb-6 max-w-md">
          <p className={`text-sm font-mono p-3 bg-white dark:bg-slate-800 border ${config.borderColor} rounded ${config.textColor} break-all`}>
            {error}
          </p>
        </div>
      )}

      {/* 重试按钮 */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 active:scale-95 shadow-sm hover:shadow"
        >
          重试
        </button>
      )}
    </div>
  );
};
