import { useMemo } from 'react';

/**
 * Shownote渲染组件
 * 目标：100%完整呈现小宇宙节目单，保持原有格式和内容
 */

interface ShownoteRendererProps {
  htmlContent: string;
  className?: string;
}

export const ShownoteRenderer = ({ htmlContent, className = '' }: ShownoteRendererProps) => {
  // 处理HTML内容，添加响应式和样式
  const processedHtml = useMemo(() => {
    if (!htmlContent) return '<p>暂无节目单内容</p>';

    let processed = htmlContent;

    // 1. 处理图片 - 添加响应式和懒加载
    processed = processed.replace(
      /<img([^>]*?)src="([^"]*?)"([^>]*?)>/gi,
      (_match, attrsBefore, src, attrsAfter) => {
        // 保留原有属性，添加我们的样式
        const responsiveImg = `
          <img
            src="${src}"
            ${attrsBefore}
            ${attrsAfter}
            class="rounded-lg shadow-sm max-w-full h-auto my-4 transition-transform hover:scale-[1.02]"
            loading="lazy"
            style="max-width: 100%; height: auto;"
          />
        `;
        return responsiveImg;
      }
    );

    // 2. 处理链接 - 添加安全属性和样式
    processed = processed.replace(
      /<a([^>]*?)href="([^"]*?)"([^>]*?)>/gi,
      (_match, attrsBefore, href, attrsAfter) => {
        // 添加安全属性和新窗口打开
        const safeLink = `
          <a
            href="${href}"
            ${attrsBefore}
            ${attrsAfter}
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-blue-300 dark:decoration-blue-700 underline-offset-2 hover:decoration-2 transition-colors"
          >
        `;
        return safeLink;
      }
    );

    // 3. 处理段落 - 确保间距
    processed = processed.replace(
      /<p([^>]*?)>/gi,
      '<p$1 class="mb-4 text-slate-700 dark:text-slate-300 leading-relaxed">'
    );

    // 4. 处理标题 - 应用层级样式
    processed = processed.replace(
      /<h1([^>]*?)>/gi,
      '<h1$1 class="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-6 mb-4">'
    );
    processed = processed.replace(
      /<h2([^>]*?)>/gi,
      '<h2$1 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-5 mb-3">'
    );
    processed = processed.replace(
      /<h3([^>]*?)>/gi,
      '<h3$1 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mt-4 mb-2">'
    );

    // 5. 处理列表 - 美化样式
    processed = processed.replace(
      /<ul([^>]*?)>/gi,
      '<ul$1 class="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4 mb-4">'
    );
    processed = processed.replace(
      /<ol([^>]*?)>/gi,
      '<ol$1 class="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 ml-4 mb-4">'
    );
    processed = processed.replace(
      /<li([^>]*?)>/gi,
      '<li$1 class="text-slate-700 dark:text-slate-300">'
    );

    // 6. 处理强调文本
    processed = processed.replace(
      /<strong([^>]*?)>/gi,
      '<strong$1 class="font-semibold text-slate-900 dark:text-slate-50">'
    );
    processed = processed.replace(
      /<em([^>]*?)>/gi,
      '<em$1 class="italic text-slate-800 dark:text-slate-200">'
    );

    // 7. 处理引用
    processed = processed.replace(
      /<blockquote([^>]*?)>/gi,
      '<blockquote$1 class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg">'
    );

    // 8. 处理代码
    processed = processed.replace(
      /<code([^>]*?)>/gi,
      '<code$1 class="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm font-mono text-slate-800 dark:text-slate-200">'
    );

    // 9. 处理分隔线
    processed = processed.replace(
      /<hr([^>]*?)>/gi,
      '<hr$1 class="my-8 border-t border-slate-200 dark:border-slate-700">'
    );

    // 10. 处理表格
    processed = processed.replace(
      /<table([^>]*?)>/gi,
      '<table$1 class="w-full border-collapse my-6">'
    );
    processed = processed.replace(
      /<th([^>]*?)>/gi,
      '<th$1 class="border border-slate-300 dark:border-slate-600 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-left font-semibold text-slate-900 dark:text-slate-50">'
    );
    processed = processed.replace(
      /<td([^>]*?)>/gi,
      '<td$1 class="border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300">'
    );

    // 11. 处理特殊字符实体
    processed = processed.replace(/&lt;/g, '<');
    processed = processed.replace(/&gt;/g, '>');
    processed = processed.replace(/&quot;/g, '"');
    processed = processed.replace(/&#39;/g, "'");
    processed = processed.replace(/&amp;/g, '&');

    return processed;
  }, [htmlContent]);

  return (
    <div className={`text-base leading-relaxed ${className}`}>
      <div
        className="prose prose-slate dark:prose-invert max-w-none shownote-content [&_img]:rounded-lg [&_img]:shadow-sm [&_img]:my-4 [&_img]:transition-transform [&_img:hover]:scale-105 [&_a]:text-blue-600 [&_a:hover]:text-blue-800 dark:[&_a]:text-blue-400 dark:[&_a:hover]:text-blue-300 [&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-slate-50 [&_p]:mb-4 [&_p]:leading-relaxed [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-4 [&_blockquote]:bg-blue-50 dark:[&_blockquote]:bg-blue-900/20 [&_blockquote]:rounded-r-lg"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    </div>
  );
};
