import { supabase } from './supabase';
import type { Category, Note, NoteWithCategory, NoteSortBy, SortOrder, Tool } from '@/types';

// ==================== 分类相关 ====================

// 获取所有分类（按排序值升序）
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (Array.isArray(data) ? data : []) as Category[];
};

// 新增分类
export const createCategory = async (name: string) => {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
};

// 重命名分类
export const updateCategory = async (id: string, name: string) => {
  const { error } = await supabase.from('categories').update({ name }).eq('id', id);
  if (error) throw error;
};

// 删除分类（分类下存在笔记时数据库外键会阻止删除）
export const deleteCategory = async (id: string) => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
};

// 统计指定分类下的笔记数量
export const getNoteCountByCategory = async (categoryId: string) => {
  const { count, error } = await supabase
    .from('notes')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId);
  if (error) throw error;
  return count ?? 0;
};

// ==================== 笔记相关 ====================

interface NoteFilters {
  categoryId?: string;
  search?: string;
  sortBy?: NoteSortBy;
  sortOrder?: SortOrder;
}

// 获取笔记列表（支持分类筛选、关键词搜索、时间排序）
export const getNotes = async (filters?: NoteFilters) => {
  const sortBy = filters?.sortBy ?? 'updated_at';
  const ascending = filters?.sortOrder === 'asc';

  let query = supabase
    .from('notes')
    .select('*, categories(name)')
    .order(sortBy, { ascending });

  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters?.search) {
    const keyword = filters.search.replace(/[%,]/g, '');
    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  return (Array.isArray(data) ? data : []).map((row) => {
    const { categories, ...note } = row as Note & { categories: { name: string } | null };
    return { ...note, category_name: categories?.name ?? '未分类' } as NoteWithCategory;
  });
};

// 获取最近更新的笔记
export const getRecentNotes = async (limit = 5) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*, categories(name)')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (Array.isArray(data) ? data : []).map((row) => {
    const { categories, ...note } = row as Note & { categories: { name: string } | null };
    return { ...note, category_name: categories?.name ?? '未分类' } as NoteWithCategory;
  });
};

// 获取单条笔记
export const getNoteById = async (id: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*, categories(name)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { categories, ...note } = data as Note & { categories: { name: string } | null };
  return { ...note, category_name: categories?.name ?? '未分类' } as NoteWithCategory;
};

// 新建笔记
export const createNote = async (note: { title: string; content: string; category_id: string }) => {
  const { data, error } = await supabase.from('notes').insert(note).select().single();
  if (error) throw error;
  return data as Note;
};

// 更新笔记
export const updateNote = async (
  id: string,
  note: { title: string; content: string; category_id: string }
) => {
  const { error } = await supabase.from('notes').update(note).eq('id', id);
  if (error) throw error;
};

// 删除单条笔记
export const deleteNote = async (id: string) => {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
};

// 批量删除笔记
export const deleteNotes = async (ids: string[]) => {
  const { error } = await supabase.from('notes').delete().in('id', ids);
  if (error) throw error;
};

// ==================== 自定义工具相关 ====================

// 获取全部自定义工具
export const getTools = async () => {
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (Array.isArray(data) ? data : []) as Tool[];
};

// 新增自定义工具
export const createTool = async (tool: {
  name: string;
  description: string | null;
  url: string;
  shortcut: string;
}) => {
  const { error } = await supabase.from('tools').insert(tool);
  if (error) throw error;
};

// 更新自定义工具
export const updateTool = async (
  id: string,
  tool: { name: string; description: string | null; url: string; shortcut: string }
) => {
  const { error } = await supabase.from('tools').update(tool).eq('id', id);
  if (error) throw error;
};

// 删除自定义工具
export const deleteTool = async (id: string) => {
  const { error } = await supabase.from('tools').delete().eq('id', id);
  if (error) throw error;
};
