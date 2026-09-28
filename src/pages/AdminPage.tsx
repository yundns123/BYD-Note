import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getNotes,
  deleteNotes,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getNoteCountByCategory,
} from '@/db/api';
import type { Category, NoteWithCategory } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { NotebookText, FolderOpen, Trash2, Pencil, Plus } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { toast } from 'sonner';

export default function AdminPage() {
  const [notes, setNotes] = useState<NoteWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // 分类编辑弹窗状态
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [notesData, catsData] = await Promise.all([
        getNotes({ sortBy: 'updated_at', sortOrder: 'desc' }),
        getCategories(),
      ]);
      setNotes(notesData);
      setCategories(catsData);

      const counts: Record<string, number> = {};
      await Promise.all(
        catsData.map(async (cat) => {
          counts[cat.id] = await getNoteCountByCategory(cat.id);
        })
      );
      setCategoryCounts(counts);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('加载管理数据失败:', err);
      toast.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const allChecked = notes.length > 0 && selectedIds.size === notes.length;

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(notes.map((n) => n.id)) : new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      await deleteNotes(Array.from(selectedIds));
      toast.success(`已删除 ${selectedIds.size} 篇笔记`);
      await loadData();
    } catch (err) {
      console.error('批量删除失败:', err);
      toast.error('删除失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    const name = categoryName.trim();
    if (!name) {
      toast.error('请输入分类名称');
      return;
    }
    const duplicated = categories.some(
      (cat) => cat.name === name && cat.id !== editingCategory?.id
    );
    if (duplicated) {
      toast.error('该分类已存在');
      return;
    }

    setSavingCategory(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, name);
        toast.success('分类已更新');
      } else {
        await createCategory(name);
        toast.success('分类已创建');
      }
      setCategoryDialogOpen(false);
      await loadData();
    } catch (err) {
      console.error('保存分类失败:', err);
      toast.error('保存失败，请重试');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    const count = categoryCounts[cat.id] ?? 0;
    if (count > 0) {
      toast.error('该分类下存在笔记，无法删除');
      return;
    }
    try {
      await deleteCategory(cat.id);
      toast.success('分类已删除');
      await loadData();
    } catch (err) {
      console.error('删除分类失败:', err);
      toast.error('删除失败，该分类下可能仍存在笔记');
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const totalNotes = useMemo(() => notes.length, [notes]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 bg-muted" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full bg-muted" />
          ))}
        </div>
        <Skeleton className="h-72 w-full bg-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageMeta
        title="管理面板 - 终末地寻光笔记"
        description="管理全部学习笔记与领域分类，支持批量删除笔记、查看各领域笔记统计，以及新增、重命名、删除领域分类。"
        keywords="笔记管理, 分类管理, 批量删除, 笔记统计"
      />
      <div>
        <h1 className="text-2xl md:text-3xl font-hand font-semibold">管理面板</h1>
        <p className="text-sm text-muted-foreground mt-1">笔记与领域分类的整理维护</p>
      </div>

      {/* 统计信息 */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="sketch-line">
          <CardHeader className="pb-2">
            <CardDescription>笔记总数</CardDescription>
            <CardTitle className="text-2xl font-hand">{totalNotes}</CardTitle>
          </CardHeader>
        </Card>
        {categories.map((cat) => (
          <Card key={cat.id} className="sketch-line">
            <CardHeader className="pb-2">
              <CardDescription className="truncate">{cat.name}</CardDescription>
              <CardTitle className="text-2xl font-hand">{categoryCounts[cat.id] ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="notes">
        <TabsList>
          <TabsTrigger value="notes" className="gap-1.5">
            <NotebookText className="h-4 w-4" />
            笔记管理
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5">
            <FolderOpen className="h-4 w-4" />
            分类管理
          </TabsTrigger>
        </TabsList>

        {/* 笔记管理 */}
        <TabsContent value="notes" className="mt-4">
          <Card className="sketch-line min-w-0">
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <div className="min-w-0 flex-1">
                <CardTitle className="font-hand text-lg">全部笔记</CardTitle>
                <CardDescription>勾选后可批量删除，删除前会再次确认</CardDescription>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={selectedIds.size === 0}
                    className="gap-1.5 text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                    删除所选{selectedIds.size > 0 ? `（${selectedIds.size}）` : ''}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除所选笔记？</AlertDialogTitle>
                    <AlertDialogDescription>
                      将删除 {selectedIds.size} 篇笔记，删除后不可恢复。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBatchDelete} disabled={deleting}>
                      {deleting ? '删除中…' : '确认删除'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">暂无笔记</p>
              ) : (
                <div className="w-full max-w-full overflow-x-auto bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 whitespace-nowrap">
                          <Checkbox
                            checked={allChecked}
                            onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                            aria-label="全选"
                          />
                        </TableHead>
                        <TableHead className="whitespace-nowrap">标题</TableHead>
                        <TableHead className="whitespace-nowrap">领域</TableHead>
                        <TableHead className="whitespace-nowrap">创建时间</TableHead>
                        <TableHead className="whitespace-nowrap">更新时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notes.map((note) => (
                        <TableRow key={note.id}>
                          <TableCell className="whitespace-nowrap">
                            <Checkbox
                              checked={selectedIds.has(note.id)}
                              onCheckedChange={(checked) => toggleSelect(note.id, checked === true)}
                              aria-label={`选择 ${note.title}`}
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Link to={`/notes/${note.id}`} className="hover:underline underline-offset-4 font-medium">
                              {note.title}
                            </Link>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="secondary">{note.category_name}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{formatTime(note.created_at)}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatTime(note.updated_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 分类管理 */}
        <TabsContent value="categories" className="mt-4">
          <Card className="sketch-line">
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <div className="min-w-0 flex-1">
                <CardTitle className="font-hand text-lg">领域分类</CardTitle>
                <CardDescription>新增或重命名分类；分类下存在笔记时不可删除</CardDescription>
              </div>
              <Button size="sm" onClick={openCreateCategory} className="gap-1.5 shrink-0">
                <Plus className="h-4 w-4" />
                新增分类
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {categories.map((cat) => {
                const count = categoryCounts[cat.id] ?? 0;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 sketch-line px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-hand font-semibold truncate">{cat.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{count} 篇笔记</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => openEditCategory(cat)} className="gap-1 shrink-0">
                      <Pencil className="h-3.5 w-3.5" />
                      重命名
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-destructive hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除分类「{cat.name}」？</AlertDialogTitle>
                          <AlertDialogDescription>
                            {count > 0
                              ? `该分类下仍有 ${count} 篇笔记，将无法删除。请先将笔记移至其他分类或删除笔记。`
                              : '删除后不可恢复。'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCategory(cat)}>
                            确认删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 分类新增/编辑弹窗 */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? '重命名分类' : '新增分类'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? '为分类起一个新名字' : '创建一个新的笔记领域分类'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="category-name">分类名称</Label>
            <Input
              id="category-name"
              placeholder="例如：读书笔记"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              maxLength={30}
              disabled={savingCategory}
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCategoryDialogOpen(false)} disabled={savingCategory}>
              取消
            </Button>
            <Button onClick={handleSaveCategory} disabled={savingCategory}>
              {savingCategory ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
