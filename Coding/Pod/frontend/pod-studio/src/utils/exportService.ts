/**
 * Export Service - 导出服务
 *
 * 支持多种导出格式：
 * - Markdown (.md)
 * - Word (.docx)
 * - 复制到剪贴板
 * - JSON (.json)
 */

import type { ChapterData } from '../services/api';

export interface ExportData {
  episodeId: string;
  episodeTitle: string;
  podcastName: string;
  duration: number;
  publishDate?: string;
  showNotes?: string;
  utterances: Array<{
    start: number;
    text: string;
  }>;
  chapters?: ChapterData;
  translations?: Map<string, string>;
  chapterTranslations?: Map<number, { title: string; points: string[] }>;
  viewMode?: 'original' | 'bilingual';
}

export class ExportService {
  /**
   * 导出为 Markdown
   */
  static exportToMarkdown(data: ExportData) {
    const markdown = this.generateMarkdown(data);
    this.downloadFile(markdown, `${data.episodeTitle}.md`, 'text/markdown');
  }

  /**
   * 导出为 Word（.docx）
   */
  static exportToWord(data: ExportData) {
    // Word 文档本质上是格式化的文本
    // 我们使用 HTML 格式，然后以 .doc 扩展名保存（Word 可以打开）
    const html = this.generateWordHTML(data);
    this.downloadFile(html, `${data.episodeTitle}.doc`, 'application/msword');
  }

  /**
   * 复制到剪贴板
   */
  static async copyToClipboard(data: ExportData): Promise<boolean> {
    try {
      const markdown = this.generateMarkdown(data);
      await navigator.clipboard.writeText(markdown);
      return true;
    } catch (error) {
      console.error('[ExportService] 复制到剪贴板失败:', error);
      return false;
    }
  }

  /**
   * 导出为 JSON
   */
  static exportToJSON(data: ExportData) {
    const jsonData = {
      meta: {
        episodeId: data.episodeId,
        episodeTitle: data.episodeTitle,
        podcastName: data.podcastName,
        duration: data.duration,
        publishDate: data.publishDate,
        exportDate: new Date().toISOString(),
      },
      chapters: data.chapters,
      utterances: data.utterances,
      translations: data.translations ? Object.fromEntries(data.translations) : undefined,
      chapterTranslations: data.chapterTranslations ? Object.fromEntries(data.chapterTranslations) : undefined,
    };

    const json = JSON.stringify(jsonData, null, 2);
    this.downloadFile(json, `${data.episodeTitle}.json`, 'application/json');
  }

  /**
   * 生成 Markdown 内容
   */
  private static generateMarkdown(data: ExportData): string {
    const lines: string[] = [];

    // 标题
    lines.push(`# ${data.episodeTitle}`);
    lines.push('');

    // 元信息
    lines.push('**播客**: ' + data.podcastName);
    if (data.publishDate) {
      lines.push('**发布日期**: ' + data.publishDate);
    }
    lines.push('**时长**: ' + this.formatDuration(data.duration));
    lines.push('');

    // 节目简介
    if (data.showNotes) {
      lines.push('## 节目简介');
      lines.push('');
      lines.push(data.showNotes);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    // 章节
    if (data.chapters && data.chapters.chapters.length > 0) {
      lines.push('## 目录');
      lines.push('');

      data.chapters.chapters.forEach((chapter, idx) => {
        const translation = data.chapterTranslations?.get(idx);
        const utterance = data.utterances[chapter.segment_index];
        const timestamp = utterance ? this.formatTimestamp(utterance.start) : '';

        lines.push(`### ${idx + 1}. ${chapter.title} ${timestamp}`);

        // 翻译的标题
        if (translation?.title) {
          lines.push(`*${translation.title}*`);
        }

        // 要点
        if (chapter.points && chapter.points.length > 0) {
          chapter.points.forEach((point, pointIdx) => {
            const translatedPoint = translation?.points[pointIdx];
            if (translatedPoint) {
              lines.push(`- ${point} / ${translatedPoint}`);
            } else {
              lines.push(`- ${point}`);
            }
          });
        }

        lines.push('');
      });

      lines.push('---');
      lines.push('');
    }

    // 完整逐字稿
    lines.push('## 完整逐字稿');
    lines.push('');

    data.utterances.forEach((utt) => {
      const timestamp = this.formatTimestamp(utt.start);
      const translation = data.translations?.get(utt.start.toString());

      if (data.viewMode === 'bilingual' && translation) {
        lines.push(`**[${timestamp}]** ${utt.text}`);
        lines.push(`> ${translation}`);
        lines.push('');
      } else {
        lines.push(`**[${timestamp}]** ${utt.text}`);
        lines.push('');
      }
    });

    return lines.join('\n');
  }

  /**
   * 生成 Word HTML 内容
   */
  private static generateWordHTML(data: ExportData): string {
    const markdown = this.generateMarkdown(data);

    // 简单的 Markdown 到 HTML 转换（基础版）
    let html = markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^> (.*$)/gim, '<blockquote style="color: #666;">$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.episodeTitle}</title>
  <style>
    body { font-family: "Microsoft YaHei", Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 30px; }
    h3 { color: #888; }
    blockquote { margin: 10px 0; padding-left: 20px; border-left: 3px solid #ddd; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
  ${html}
</body>
</html>
    `;
  }

  /**
   * 下载文件
   */
  private static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * 格式化时长
   */
  private static formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}分${seconds}秒`;
  }

  /**
   * 格式化时间戳
   */
  private static formatTimestamp(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
