/**
 * ExportMenu - 导出菜单组件
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：安静地导出，不阻断流程
 */

import { useState, useRef, useEffect } from 'react';
import { Download, FileText, File, Loader2 } from 'lucide-react';

interface ExportMenuProps {
  podcastId: string;
  podcastData: {
    title?: string;
    podcast_name?: string;
    duration?: number;
    show_notes?: string;
  };
  transcript: any[];
  notes?: any[];
  bookmarks?: any[];
}

type ExportFormat = 'markdown' | 'pdf' | 'text';
type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

export const ExportMenu = ({
  podcastId,
  podcastData,
  transcript,
  notes = [],
  bookmarks = [],
}: ExportMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 执行导出
  const handleExport = async (format: ExportFormat) => {
    setStatus('exporting');
    setError(null);
    setIsOpen(false);

    try {
      const response = await fetch('http://localhost:8001/api/v1/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          podcast_id: podcastId,
          format,
          podcast_data: podcastData,
          transcript,
          notes,
          bookmarks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      // 获取文件内容
      const blob = await response.blob();

      // 从响应头获取文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `export_${Date.now()}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // 清理
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus('success');

      // 2秒后重置状态
      setTimeout(() => {
        setStatus('idle');
      }, 2000);

    } catch (err) {
      console.error('[ExportMenu] 导出失败:', err);
      setError(err instanceof Error ? err.message : '导出失败');
      setStatus('error');

      // 3秒后重置错误状态
      setTimeout(() => {
        setStatus('idle');
        setError(null);
      }, 3000);
    }
  };

  // 格式选项配置
  const formatOptions = [
    {
      format: 'markdown' as ExportFormat,
      label: 'Markdown',
      description: '包含逐字稿、笔记、书签',
      icon: FileText,
      color: 'rgba(212, 197, 185, 0.7)',
    },
    {
      format: 'text' as ExportFormat,
      label: '纯文本',
      description: '仅包含逐字稿',
      icon: File,
      color: 'rgba(255, 255, 255, 0.5)',
    },
    // PDF 暂未实现
    // {
    //   format: 'pdf' as ExportFormat,
    //   label: 'PDF',
    //   description: '包含完整内容',
    //   icon: FileText,
    //   color: 'rgba(255, 255, 255, 0.5)',
    // },
  ];

  return (
    <div ref={menuRef} className="relative">
      {/* 导出按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={status === 'exporting'}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
        style={{
          backgroundColor:
            status === 'success'
              ? 'rgba(212, 197, 185, 0.15)'
              : status === 'error'
              ? 'rgba(239, 68, 68, 0.1)'
              : 'rgba(255, 255, 255, 0.03)',
          border:
            status === 'success'
              ? '1px solid rgba(212, 197, 185, 0.3)'
              : status === 'error'
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.08)',
          color:
            status === 'success'
              ? 'rgba(212, 197, 185, 0.9)'
              : status === 'error'
              ? 'rgba(239, 68, 68, 0.7)'
              : 'rgba(255, 255, 255, 0.5)',
          transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          cursor: status === 'exporting' ? 'not-allowed' : 'pointer',
          opacity: status === 'exporting' ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (status !== 'exporting') {
            if (status === 'success') {
              e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.2)';
            } else if (status === 'error') {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            } else {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
            }
          }
        }}
        onMouseLeave={(e) => {
          if (status === 'success') {
            e.currentTarget.style.backgroundColor = 'rgba(212, 197, 185, 0.15)';
          } else if (status === 'error') {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          } else {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
          }
        }}
      >
        {status === 'exporting' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>导出中...</span>
          </>
        ) : status === 'success' ? (
          <>
            <Download className="w-4 h-4" />
            <span>导出成功</span>
          </>
        ) : status === 'error' ? (
          <>
            <Download className="w-4 h-4" />
            <span>导出失败</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>导出</span>
          </>
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && status === 'idle' && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-xl p-2 z-50"
          style={{
            backgroundColor: '#1a1a1d',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            className="px-3 py-2 mb-2"
            style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              className="text-xs font-medium mb-1"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              选择导出格式
            </div>
            <div
              className="text-xs"
              style={{ color: 'rgba(255, 255, 255, 0.3)' }}
            >
              {transcript.length} 段逐字稿 · {notes.length} 条笔记 · {bookmarks.length} 个书签
            </div>
          </div>

          {formatOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.format}
                onClick={() => handleExport(option.format)}
                className="w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-all duration-250"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                }}
              >
                <div
                  className="p-2 rounded"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: option.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium mb-0.5"
                    style={{ color: 'rgba(232, 232, 232, 0.8)' }}
                  >
                    {option.label}
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                  >
                    {option.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div
          className="absolute right-0 mt-2 w-64 px-3 py-2 rounded-lg text-xs"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'rgba(239, 68, 68, 0.8)',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
