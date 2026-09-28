import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getNoteById, deleteNote } from '@/db/api';
import type { NoteWithCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<NoteWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getNoteById(id)
      .then(setNote)
      .catch((err) => {
        console.error('加载笔记失败:', err);
        toast.error('笔记加载失败');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteNote(id);
      toast.success('笔记已删除');
      navigate('/notes', { replace: true });
    } catch (err) {
      console.error('删除笔记失败:', err);
      toast.error('删除失败，请重试');
      setDeleting(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32 bg-muted" />
        <Skeleton className="h-10 w-2/3 bg-muted" />
        <Skeleton className="h-64 w-full bg-muted" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/notes')} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </Button>
        <Card className="sketch-line">
          <CardContent className="py-14 text-center text-muted-foreground">
            这篇笔记不存在或已被删除
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate('/notes')} className="gap-1.5 shrink-0">
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </Button>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/notes/${note.id}/edit`)} className="gap-1.5">
            <Pencil className="h-4 w-4" />
            编辑
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                删除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除这篇笔记？</AlertDialogTitle>
                <AlertDialogDescription>
                  「{note.title}」删除后将不可恢复，请确认不再需要它。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                  {deleting ? '删除中…' : '确认删除'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <article className="space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl md:text-4xl font-hand font-semibold leading-snug text-balance">
            {note.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">{note.category_name}</Badge>
            <span>创建于 {formatTime(note.created_at)}</span>
            <span>更新于 {formatTime(note.updated_at)}</span>
          </div>
        </header>

        <Card className="sketch-box">
          <CardContent className="p-5 md:p-8">
            <p className="whitespace-pre-wrap leading-8 text-foreground/90 notebook-lines">
              {note.content}
            </p>
          </CardContent>
        </Card>
      </article>
    </div>
  );
}
