// 领域分类类型
export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

// 笔记类型
export interface Note {
  id: string;
  title: string;
  content: string;
  category_id: string;
  created_at: string;
  updated_at: string;
}

// 带分类信息的笔记
export interface NoteWithCategory extends Note {
  category_name: string;
}

// 笔记排序方式
export type NoteSortBy = 'created_at' | 'updated_at';
export type SortOrder = 'asc' | 'desc';

// 自定义工具类型（Jev 工具箱）
export interface Tool {
  id: string;
  name: string;
  description: string | null;
  url: string;
  shortcut: string;
  created_at: string;
  updated_at: string;
}
