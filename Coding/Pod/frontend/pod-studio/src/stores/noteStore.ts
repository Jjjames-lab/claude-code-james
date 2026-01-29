/**
 * NoteStore - 笔记状态管理
 *
 * 产品愿景：慢下来，深思考
 * 设计原则：让用户的想法得到妥善保存
 */

import { create } from 'zustand';
import { storageManager } from '../utils/storageManager';

// 笔记类型定义
export interface Note {
  id: string;
  podcastId: string;
  timestamp: number;
  selectedText: string;
  note: string;
  tags?: string[];
  category?: 'thought' | 'question' | 'action' | 'quote';
  createdAt: string;
  updatedAt: string;
}

export interface NoteInput {
  timestamp: number;
  selectedText: string;
  note: string;
  tags?: string[];
  category?: Note['category'];
}

export interface NoteStats {
  total: number;
  byCategory: {
    thought: number;
    question: number;
    action: number;
    quote: number;
  };
  recent: Note[];
}

export interface NoteFilter {
  category?: Note['category'];
  tags?: string[];
  search?: string;
  sortBy?: 'createdAt' | 'timestamp' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

interface NoteStore {
  /** 所有笔记，按播客 ID 分组 */
  notes: Map<string, Note[]>;

  /** 当前播客的笔记 */
  currentPodcastNotes: Note[];

  /** 选中的文字（用于创建笔记） */
  selectedText: {
    text: string;
    timestamp: number;
  } | null;

  /** 笔记输入弹窗是否显示 */
  isNoteInputOpen: boolean;

  /** 正在编辑的笔记 */
  editingNote: Note | null;

  /** 设置选中的文字 */
  setSelectedText: (text: string, timestamp: number) => void;

  /** 清除选中的文字 */
  clearSelectedText: () => void;

  /** 打开笔记输入弹窗 */
  openNoteInput: () => void;

  /** 关闭笔记输入弹窗 */
  closeNoteInput: () => void;

  /** 添加笔记 */
  addNote: (podcastId: string, input: NoteInput) => void;

  /** 更新笔记 */
  updateNote: (podcastId: string, noteId: string, updates: Partial<Note>) => void;

  /** 设置编辑中的笔记 */
  setEditingNote: (note: Note | null) => void;

  /** 删除笔记 */
  deleteNote: (podcastId: string, noteId: string) => void;

  /** 获取指定播客的笔记 */
  getNotes: (podcastId: string) => Note[];

  /** 加载指定播客的笔记 */
  loadNotes: (podcastId: string) => void;

  /** 获取笔记统计 */
  getStats: () => NoteStats;

  /** 过滤笔记 */
  filterNotes: (podcastId: string, filter: NoteFilter) => Note[];
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: new Map(),
  currentPodcastNotes: [],
  selectedText: null,
  isNoteInputOpen: false,
  editingNote: null,

  setSelectedText: (text: string, timestamp: number) => {
    set({ selectedText: { text, timestamp } });
  },

  clearSelectedText: () => {
    set({ selectedText: null });
  },

  openNoteInput: () => {
    set({ isNoteInputOpen: true });
  },

  closeNoteInput: () => {
    set({ isNoteInputOpen: false });
    // 关闭时清除编辑状态
    set({ editingNote: null });
  },

  setEditingNote: (note: Note | null) => {
    set({ editingNote: note });
    // 设置编辑笔记时打开弹窗
    if (note) {
      set({ isNoteInputOpen: true });
    }
  },

  addNote: (podcastId: string, input: NoteInput) => {
    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      podcastId,
      timestamp: input.timestamp,
      selectedText: input.selectedText,
      note: input.note,
      tags: input.tags || [],
      category: input.category || 'thought',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { notes } = get();
    const podcastNotes = notes.get(podcastId) || [];
    const updatedNotes = [...podcastNotes, newNote];

    notes.set(podcastId, updatedNotes);
    set({
      notes: new Map(notes),
      currentPodcastNotes: updatedNotes
    });

    // 保存到 LocalStorage
    storageManager.saveNotes(podcastId, updatedNotes);

    console.log('[NoteStore] 笔记已添加:', newNote.id);
  },

  updateNote: (podcastId: string, noteId: string, updates: Partial<Note>) => {
    const { notes } = get();
    const podcastNotes = notes.get(podcastId) || [];

    const updatedNotes = podcastNotes.map(note =>
      note.id === noteId
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    );

    notes.set(podcastId, updatedNotes);
    set({
      notes: new Map(notes),
      currentPodcastNotes: updatedNotes
    });

    // 保存到 LocalStorage
    storageManager.saveNotes(podcastId, updatedNotes);

    console.log('[NoteStore] 笔记已更新:', noteId);
  },

  deleteNote: (podcastId: string, noteId: string) => {
    const { notes } = get();
    const podcastNotes = notes.get(podcastId) || [];
    const updatedNotes = podcastNotes.filter(note => note.id !== noteId);

    notes.set(podcastId, updatedNotes);
    set({
      notes: new Map(notes),
      currentPodcastNotes: updatedNotes
    });

    // 保存到 LocalStorage
    storageManager.saveNotes(podcastId, updatedNotes);

    console.log('[NoteStore] 笔记已删除:', noteId);
  },

  getNotes: (podcastId: string) => {
    const { notes } = get();
    return notes.get(podcastId) || [];
  },

  loadNotes: (podcastId: string) => {
    const loadedNotes = storageManager.loadNotes(podcastId);
    const { notes } = get();

    notes.set(podcastId, loadedNotes);
    set({
      notes: new Map(notes),
      currentPodcastNotes: loadedNotes
    });

    console.log('[NoteStore] 笔记已加载:', podcastId, loadedNotes.length, '条');
  },

  getStats: () => {
    const { notes } = get();
    const allNotes = Array.from(notes.values()).flat();

    const stats: NoteStats = {
      total: allNotes.length,
      byCategory: {
        thought: allNotes.filter(n => n.category === 'thought').length,
        question: allNotes.filter(n => n.category === 'question').length,
        action: allNotes.filter(n => n.category === 'action').length,
        quote: allNotes.filter(n => n.category === 'quote').length,
      },
      recent: allNotes
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    };

    return stats;
  },

  filterNotes: (podcastId: string, filter: NoteFilter) => {
    const { notes } = get();
    let filteredNotes = notes.get(podcastId) || [];

    // 按分类过滤
    if (filter.category) {
      filteredNotes = filteredNotes.filter(note => note.category === filter.category);
    }

    // 按标签过滤
    if (filter.tags && filter.tags.length > 0) {
      filteredNotes = filteredNotes.filter(note =>
        note.tags && filter.tags.some(tag => note.tags.includes(tag))
      );
    }

    // 搜索过滤
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filteredNotes = filteredNotes.filter(note =>
        note.note.toLowerCase().includes(searchLower) ||
        note.selectedText.toLowerCase().includes(searchLower)
      );
    }

    // 排序
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'desc';

    filteredNotes.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredNotes;
  },
}));
