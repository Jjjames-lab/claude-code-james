/**
 * ExportDropdown - 导出下拉菜单组件
 *
 * 支持4种导出格式：
 * - Markdown (.md)
 * - Word (.doc)
 * - 复制到剪贴板
 * - JSON (.json)
 */

import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Copy, Database, ChevronDown } from 'lucide-react';

interface ExportDropdownProps {
  episodeData: {
    episodeId: string;
    episodeTitle: string;
    podcastName: string;
    duration: number;
    showNotes?: string;
  };
  utterances: Array<{ start: number; text: string }>;
  chapters?: any;
  translations?: Map<string, string>;
  chapterTranslations?: Map<number, { title: string; points: string[] }>;
  viewMode?: 'original' | 'bilingual';
}

type ExportFormat = 'markdown' | 'word' | 'clipboard' | 'json';

interface ExportOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void | Promise<void>;
}

export const ExportDropdown = ({
  episodeData,
  utterances,
  chapters,
  translations,
  chapterTranslations,
  viewMode,
}: ExportDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 动态导入 ExportService
  const handleExport = async (format: ExportFormat) => {
    setIsExporting(format);

    try {
      const { ExportService } = await import('../utils/exportService');
      const data = {
        ...episodeData,
        utterances,
        chapters,
        translations,
        chapterTranslations,
        viewMode,
      };

      switch (format) {
        case 'markdown':
          ExportService.exportToMarkdown(data);
          break;
        case 'word':
          ExportService.exportToWord(data);
          break;
        case 'clipboard':
          const success = await ExportService.copyToClipboard(data);
          if (!success) {
            alert('复制失败，请手动复制');
          }
          break;
        case 'json':
          ExportService.exportToJSON(data);
          break;
      }
    } catch (error) {
      console.error('[ExportDropdown] 导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  };

  const options: ExportOption[] = [
    {
      id: 'markdown',
      label: 'Markdown',
      description: '适合博客、笔记软件',
      icon: <FileText className="w-4 h-4" />,
      action: () => handleExport('markdown'),
    },
    {
      id: 'word',
      label: 'Word 文档',
      description: '适合办公、分享',
      icon: <Download className="w-4 h-4" />,
      action: () => handleExport('word'),
    },
    {
      id: 'clipboard',
      label: '复制到剪贴板',
      description: '快速分享',
      icon: <Copy className="w-4 h-4" />,
      action: () => handleExport('clipboard'),
    },
    {
      id: 'json',
      label: 'JSON 数据',
      description: '数据备份',
      icon: <Database className="w-4 h-4" />,
      action: () => handleExport('json'),
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        <span>导出</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl z-50"
          style={{
            background: 'rgba(30, 30, 30, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div className="py-2">
            {options.map((option) => {
              const loading = isExporting === option.id;

              return (
                <button
                  key={option.id}
                  onClick={option.action}
                  disabled={loading}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  style={{
                    color: 'rgba(232, 232, 232, 0.8)',
                  }}
                >
                  <div
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: 'rgba(212, 197, 185, 0.7)' }}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      option.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium mb-0.5">
                      {option.label}
                    </div>
                    <div className="text-xs leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                      {option.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
