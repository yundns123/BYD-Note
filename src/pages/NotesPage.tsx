import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getNotes, getCategories } from '@/db/api';
import type { Category, NoteWithCategory, NoteSortBy, SortOrder } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Search, PenLine, NotebookText } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { toast } from 'sonner';

export default function NotesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState<NoteWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const categoryId = searchParams.get('category') ?? 'all';
  const [sortBy, setSortBy] = useState<NoteSortBy>('updated_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.error('加载分类失败:', err));
  }, []);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    getNotes({
      categoryId: categoryId === 'all' ? undefined : categoryId,
      search: search || undefined,
      sortBy,
      sortOrder,
    })
      .then(setNotes)
      .catch((err) => {
        console.error('加载笔记失败:', err);
        toast.error('笔记加载失败');
      })
      .finally(() => setLoading(false));
  }, [categoryId, search, sortBy, sortOrder]);

  const handleCategoryChange = (value: string) => {
    if (value === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  const excerpt = useMemo(
    () => (content: string) => {
      const plain = content.replace(/\s+/g, ' ').trim();
      return plain.length > 90 ? `${plain.slice(0, 90)}…` : plain;
    },
    []
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageMeta
        title="全部笔记 - 终末地寻光笔记"
        description="浏览全部学习笔记，支持按领域筛选、关键词搜索与创建时间、更新时间排序，涵盖计算机硬件维护、基础自然科学与室内植物培育三大领域。"
        keywords="学习笔记, 笔记列表, 知识整理, 笔记检索, 领域筛选"
      />
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-hand font-semibold truncate">全部笔记</h1>
          <p className="text-sm text-muted-foreground mt-1">知识点整理与实践记录的存档</p>
        </div>
        <Button asChild className="shrink-0 gap-1.5">
          <Link to="/notes/new">
            <PenLine className="h-4 w-4" />
            <span className="hidden md:inline">写笔记</span>
          </Link>
        </Button>
      </div>

      {/* 搜索与筛选 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索标题或正文…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryId} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="选择领域" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部领域</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={`${sortBy}-${sortOrder}`}
          onValueChange={(v) => {
            const [by, order] = v.split('-') as [NoteSortBy, SortOrder];
            setSortBy(by);
            setSortOrder(order);
          }}
        >
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_at-desc">最近更新优先</SelectItem>
            <SelectItem value="updated_at-asc">最早更新优先</SelectItem>
            <SelectItem value="created_at-desc">最新创建优先</SelectItem>
            <SelectItem value="created_at-asc">最早创建优先</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 笔记列表 */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full bg-muted" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <Card className="sketch-line">
          <CardContent className="py-14 text-center space-y-3">
            <NotebookText className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">未找到相关笔记</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note, idx) => (
            <Link key={note.id} to={`/notes/${note.id}`} className="group block animate-fade-in">
              <Card className={`sketch-line transition-transform duration-200 group-hover:-translate-y-0.5 ${idx % 2 === 0 ? 'md:-rotate-[0.4deg]' : 'md:rotate-[0.4deg]'}`}>
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-start gap-3">
                    <h2 className="flex-1 min-w-0 font-hand font-semibold text-lg truncate group-hover:underline underline-offset-4">
                      {note.title}
                    </h2>
                    <Badge variant="secondary" className="shrink-0">{note.category_name}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{excerpt(note.content)}</p>
                  <p className="text-xs text-muted-foreground">
                    创建于 {formatTime(note.created_at)} · 更新于 {formatTime(note.updated_at)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
