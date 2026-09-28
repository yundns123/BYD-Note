import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecentNotes, getCategories } from '@/db/api';
import type { Category, NoteWithCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Cpu, FlaskConical, Leaf, PenLine, ArrowRight, Clock, Languages, Sparkles } from 'lucide-react';
import { useToolbox } from '@/components/toolbox/ToolboxProvider';
import PageMeta from '@/components/common/PageMeta';
import { toast } from 'sonner';

const categoryIcons = [Cpu, FlaskConical, Leaf];

export default function HomePage() {
  const { toggle } = useToolbox();
  const [recentNotes, setRecentNotes] = useState<NoteWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getRecentNotes(5), getCategories()])
      .then(([notes, cats]) => {
        setRecentNotes(notes);
        setCategories(cats);
      })
      .catch((err) => console.error('加载首页数据失败:', err))
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <PageMeta
        title="终末地寻光笔记 - 个人学习笔记与知识存档"
        description="记录计算机硬件维护、基础自然科学常识与室内植物培育的个人学习笔记，支持笔记管理、中英重点标注与 Jev 工具箱单键唤起。"
        keywords="终末地寻光笔记, 个人学习笔记, 计算机硬件维护, 基础自然科学常识, 室内植物培育"
      />
      {/* 标题区 */}
      <section className="text-center space-y-4 pt-4 md:pt-8 animate-fade-in">
        <h1 className="text-3xl md:text-5xl font-hand font-semibold tracking-wide">
          终末地<span className="highlighter">寻光</span>笔记
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
          这里是我在业余时间钻研学习的一处小小存档地，记录计算机硬件维护、基础自然科学常识与室内植物培育三个方向上的知识点整理与亲身实践。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild>
            <Link to="/notes/new" className="gap-1.5">
              <PenLine className="h-4 w-4" />
              写一篇笔记
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/notes" className="gap-1.5">
              翻阅笔记
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/tools/annotate" className="gap-1.5">
              <Languages className="h-4 w-4" />
              中英重点标注
            </Link>
          </Button>
        </div>
      </section>

      {/* Jev 工具箱 */}
      <section className="sketch-line p-4 md:p-5 flex items-center gap-4">
        <span className="h-10 w-10 sketch-box flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-hand font-semibold">Jev 工具箱已就绪</p>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            点击右下角悬浮按钮唤出工具箱，或在非输入状态下按 T 唤出；H / B / N / E / A
            单键直达常用功能，还可自助添加工具并绑定专属按键。
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={toggle} className="shrink-0 hidden md:inline-flex">
          唤出工具箱
        </Button>
      </section>

      {/* 领域入口 */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-hand font-semibold text-left md:text-center">三个钻研方向</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {loading
            ? [...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-36 w-full bg-muted" />
              ))
            : categories.map((cat, idx) => {
                const Icon = categoryIcons[idx % categoryIcons.length];
                return (
                  <Link key={cat.id} to={`/notes?category=${cat.id}`} className="group block">
                    <Card className={`sketch-line h-full transition-transform duration-200 group-hover:-translate-y-1 ${idx % 2 === 0 ? 'md:-rotate-1' : 'md:rotate-1'}`}>
                      <CardHeader className="space-y-3">
                        <div className="h-10 w-10 sketch-box flex items-center justify-center">
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="font-hand text-lg">{cat.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          查看该领域的笔记 →
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
        </div>
      </section>

      {/* 最近更新 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-hand font-semibold">最近动笔</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/notes">全部笔记</Link>
          </Button>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full bg-muted" />
            ))}
          </div>
        ) : recentNotes.length === 0 ? (
          <Card className="sketch-line">
            <CardContent className="py-10 text-center text-muted-foreground">
              还没有笔记，点击上方「写一篇笔记」开始记录吧
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentNotes.map((note) => (
              <Link key={note.id} to={`/notes/${note.id}`} className="group block">
                <Card className="sketch-line transition-transform duration-200 group-hover:-translate-y-0.5">
                  <CardContent className="py-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-hand font-semibold truncate group-hover:underline underline-offset-4">
                        {note.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        更新于 {formatTime(note.updated_at)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{note.category_name}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
