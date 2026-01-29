/**
 * 笔记类型定义
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：让用户可以安静地记录想法
 */

/**
 * 单个笔记的类型定义
 */
export interface Note {
  /** 唯一标识符 */
  id: string;

  /** 所属播客的 ID */
  podcastId: string;

  /** 音频时间戳（毫秒） */
  timestamp: number;

  /** 用户选中的文字 */
  selectedText: string;

  /** 用户的笔记内容 */
  note: string;

  /** 创建时间 */
  createdAt: string;

  /** 最后更新时间 */
  updatedAt: string;

  /** 笔记标签（可选） */
  tags?: string[];

  /** 笔记分类（可选） */
  category?: 'thought' | 'question' | 'action' | 'quote';
}

/**
 * 笔记创建时的输入数据
 */
export interface NoteInput {
  /** 音频时间戳（毫秒） */
  timestamp: number;

  /** 用户选中的文字 */
  selectedText: string;

  /** 用户的笔记内容 */
  note: string;

  /** 笔记标签（可选） */
  tags?: string[];

  /** 笔记分类（可选） */
  category?: Note['category'];
}

/**
 * 笔记统计数据
 */
export interface NoteStats {
  /** 总笔记数量 */
  total: number;

  /** 按分类统计 */
  byCategory: {
    thought: number;
    question: number;
    action: number;
    quote: number;
  };

  /** 最近创建的笔记 */
  recent: Note[];
}

/**
 * 笔记过滤选项
 */
export interface NoteFilter {
  /** 按分类过滤 */
  category?: Note['category'];

  /** 按标签过滤 */
  tags?: string[];

  /** 搜索关键词 */
  search?: string;

  /** 排序方式 */
  sortBy?: 'createdAt' | 'timestamp' | 'updatedAt';

  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc';
}
