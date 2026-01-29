/**
 * ToastContainer - 通知容器组件
 *
 * 专业的通知系统，替代原生 alert
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, type ToastType } from '../../stores/toastStore';

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
};

const toastStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'rgba(34, 197, 94, 0.1)',
    border: 'rgba(34, 197, 94, 0.2)',
    icon: 'rgba(34, 197, 94, 0.9)',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.2)',
    icon: 'rgba(239, 68, 68, 0.9)',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.2)',
    icon: 'rgba(59, 130, 246, 0.9)',
  },
  warning: {
    bg: 'rgba(251, 191, 36, 0.1)',
    border: 'rgba(251, 191, 36, 0.2)',
    icon: 'rgba(251, 191, 36, 0.9)',
  },
};

interface ToastItemProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  onClose: () => void;
}

const ToastItem = ({ id, type, title, message, onClose }: ToastItemProps) => {
  const styles = toastStyles[type];

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl backdrop-blur-xl shadow-lg"
      style={{
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
        animation: 'toastSlideIn 0.3s ease-out',
        minWidth: '320px',
        maxWidth: '420px',
      }}
    >
      {/* 图标 */}
      <div className="flex-shrink-0 mt-0.5" style={{ color: styles.icon }}>
        {toastIcons[type]}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium mb-0.5"
          style={{ color: 'rgba(232, 232, 232, 0.95)' }}
        >
          {title}
        </div>
        {message && (
          <div
            className="text-xs leading-relaxed"
            style={{ color: 'rgba(232, 232, 232, 0.6)' }}
          >
            {message}
          </div>
        )}
      </div>

      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-lg transition-colors hover:bg-white/5"
        style={{ color: 'rgba(255, 255, 255, 0.3)' }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  // 监听 toasts 变化，打印调试信息
  useEffect(() => {
    if (toasts.length > 0) {
      console.log('[ToastContainer] 当前通知数量:', toasts.length);
    }
  }, [toasts]);

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      style={{ maxHeight: 'calc(100vh - 32px)' }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>,
    document.body
  );
};
