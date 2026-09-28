import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getNoteById, createNote, updateNote, getCategories } from '@/db/api';
import type { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { toast } from 'sonner';

export default function NoteEditPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();

  // 新建模式下接收外部工具（如中英标注）预填的内容
  const prefill = !isEdit
    ? (location.state as { prefillTitle?: string; prefillContent?: string } | null)
    : null;

  const [title, setTitle] = useState(prefill?.prefillTitle ?? '');
  const [content, setContent] = useState(prefill?.prefillContent ?? '');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => {
        console.error('加载分类失败:', err);
        toast.error('分类加载失败');
      });

    if (isEdit && id) {
      getNoteById(id)
        .then((note) => {
          if (!note) {
            toast.error('笔记不存在');
            navigate('/notes', { replace: true });
            return;
          }
          setTitle(note.title);
          setContent(note.content);
          setCategoryId(note.category_id);
        })
        .catch((err) => {
          console.error('加载笔记失败:', err);
          toast.error('笔记加载失败');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, navigate]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('请输入笔记标题');
      return;
    }
    if (!categoryId) {
      toast.error('请选择所属领域');
      return;
    }
    if (!content.trim()) {
      toast.error('请输入笔记内容');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        await updateNote(id, { title: title.trim(), content: content.trim(), category_id: categoryId });
        toast.success('笔记已更新');
        navigate(`/notes/${id}`);
      } else {
        const created = await createNote({ title: title.trim(), content: content.trim(), category_id: categoryId });
        toast.success('笔记已保存');
        navigate(`/notes/${created.id}`);
      }
    } catch (err) {
      console.error('保存笔记失败:', err);
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32 bg-muted" />
        <Skeleton className="h-12 w-full bg-muted" />
        <Skeleton className="h-64 w-full bg-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {!isEdit && (
        <PageMeta
          title="写笔记 - 终末地寻光笔记"
          description="新建一篇学习笔记，填写标题、选择所属领域并记录正文内容，保存后自动归档到对应的领域分类。"
          keywords="新建笔记, 写笔记, 笔记编辑, 学习记录"
        />
      )}
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        返回
      </Button>

      <h1 className="text-2xl md:text-3xl font-hand font-semibold">
        {isEdit ? '修改笔记' : '写一篇笔记'}
      </h1>

      <Card className="sketch-box">
        <CardContent className="p-5 md:p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="note-title">标题</Label>
            <Input
              id="note-title"
              placeholder="给这篇笔记起个名字"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-category">所属领域</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={saving}>
              <SelectTrigger id="note-category">
                <SelectValue placeholder="选择一个领域" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-content">正文</Label>
            <Textarea
              id="note-content"
              placeholder="记录知识点、操作步骤、心得感悟……"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              disabled={saving}
              className="notebook-lines leading-7 resize-y"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => navigate(-1)} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
