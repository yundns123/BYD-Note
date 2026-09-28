import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Highlighter, Languages, Loader2, NotebookPen, X } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

// 经 Edge Function 调用百度翻译，查询选中中文对应的英文术语
async function translateToEnglish(text: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('text-translation', {
    body: { q: text, from: 'auto', to: 'en' },
  });
  if (error) {
    // 读取 Edge Function 返回的真实错误信息（如配额超限、余额不足）
    const ctx = (error as { context?: Response }).context;
    const detail = await ctx?.text().catch(() => '');
    throw new Error(detail || error.message);
  }
  if (data?.error_code) throw new Error(`API 错误 ${data.error_code}：${data.error_msg}`);
  const dst: string | undefined = data?.result?.trans_result?.[0]?.dst;
  if (!dst?.trim()) throw new Error('未查询到英文术语');
  return dst.trim();
}

// 匹配「中文（English）」格式的标注
const ANNOTATION_SOURCE =
  '([\\u4e00-\\u9fa5A-Za-z0-9][\\u4e00-\\u9fa5A-Za-z0-9 .\\-]{0,19})（([A-Za-z][A-Za-z0-9 .\\-/+&]{0,40})）';

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface Annotation {
  cn: string;
  en: string;
}

/** 中英重点标注工具：写中文，划词自动查询英文术语并生成对照 */
export default function AnnotatePage() {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [content, setContent] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0, raw: '', text: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [english, setEnglish] = useState('');
  const [translating, setTranslating] = useState(false);
  const [statusText, setStatusText] = useState('');

  const debounceRef = useRef<number | undefined>(undefined);
  const translatingRef = useRef(false);
  const dialogOpenRef = useRef(false);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    dialogOpenRef.current = dialogOpen;
  }, [dialogOpen]);

  // 卸载时清理防抖定时器
  useEffect(() => () => window.clearTimeout(debounceRef.current), []);

  // 提取已标注词条
  const annotations: Annotation[] = useMemo(() => {
    const list: Annotation[] = [];
    const re = new RegExp(ANNOTATION_SOURCE, 'g');
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      list.push({ cn: match[1], en: match[2] });
    }
    return list;
  }, [content]);

  // 预览渲染：英文标注以柔和样式强调
  const previewNodes = useMemo(() => {
    const nodes: React.ReactNode[] = [];
    let last = 0;
    let key = 0;
    const re = new RegExp(ANNOTATION_SOURCE, 'g');
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      const idx = match.index;
      if (idx > last) {
        nodes.push(<span key={key++}>{content.slice(last, idx)}</span>);
      }
      nodes.push(
        <span key={key++}>
          {match[1]}
          <span className="highlighter font-medium">（{match[2]}）</span>
        </span>
      );
      last = idx + match[0].length;
    }
    if (last < content.length) {
      nodes.push(<span key={key++}>{content.slice(last)}</span>);
    }
    return nodes;
  }, [content]);

  const updateSelection = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const raw = ta.value.slice(ta.selectionStart, ta.selectionEnd);
    const next = {
      start: ta.selectionStart,
      end: ta.selectionEnd,
      raw,
      text: raw.trim(),
    };
    setSelection(next);

    // 鼠标滑动选中后，防抖触发自动查询英文术语
    window.clearTimeout(debounceRef.current);
    if (!next.text) return;
    debounceRef.current = window.setTimeout(() => void autoAnnotate(next), 500);
  };

  // 划词自动标注：自动查询英文术语并生成「中文」格式对照
  const autoAnnotate = async (sel: typeof selection) => {
    const text = sel.text;

    // 空白或纯标点不触发
    if (!/[\u4e00-\u9fa5A-Za-z0-9]/.test(text)) return;
    // 选区包含括号或已处于标注格式内，忽略避免嵌套
    if (/^[（(]|[)）]$/.test(text) || new RegExp(ANNOTATION_SOURCE).test(text)) {
      toast('该选区已包含标注，请选中具体词汇');
      return;
    }
    if (contentRef.current[sel.end] === '（' || contentRef.current[sel.start - 1] === '（') {
      toast('该词已有标注，如需修改请先移除原标注');
      return;
    }
    // 选中文本过长，不适合作术语标注
    if (text.length > 40) {
      toast.error('选中文本过长，请选中具体词汇');
      return;
    }
    if (translatingRef.current || dialogOpenRef.current) return;

    translatingRef.current = true;
    setTranslating(true);
    setStatusText(`正在查询「${text}」的英文术语…`);
    const snapshot = contentRef.current;

    try {
      const en = await translateToEnglish(text);
      // 查询期间正文被修改则放弃插入，避免错位
      if (contentRef.current !== snapshot) {
        toast.error('正文已修改，请重新选词标注');
        return;
      }
      const annotatedRaw = sel.raw.replace(text, () => `${text}（${en}）`);
      setContent((c) => `${c.slice(0, sel.start)}${annotatedRaw}${c.slice(sel.end)}`);
      toast.success(`已标注：${text}（${en}）`);
      setSelection({ start: 0, end: 0, raw: '', text: '' });
    } catch (err) {
      console.error('查询英文术语失败:', err);
      // 兜底：转手动输入英文
      toast.error('英文术语查询失败，请手动输入');
      setEnglish('');
      setDialogOpen(true);
    } finally {
      translatingRef.current = false;
      setTranslating(false);
      setStatusText('');
    }
  };

  // 手动标注兜底入口
  const openAnnotateDialog = () => {
    window.clearTimeout(debounceRef.current);
    if (!selection.text) {
      toast.error('请先在正文中选中要标注的词');
      return;
    }
    setEnglish('');
    setDialogOpen(true);
  };

  const confirmAnnotate = () => {
    const en = english.trim();
    if (!en) {
      toast.error('请输入对应的英文术语');
      return;
    }
    const { start, end, raw } = selection;
    setContent((c) => `${c.slice(0, start)}${raw}（${en}）${c.slice(end)}`);
    setDialogOpen(false);
  };

  const removeAnnotation = (ann: Annotation) => {
    const pattern = `${ann.cn}（${ann.en}）`;
    const re = new RegExp(escapeRegExp(pattern), 'g');
    setContent((c) => c.replace(re, ann.cn));
  };

  const saveAsNote = () => {
    if (!content.trim()) {
      toast.error('标注内容为空，无法生成笔记');
      return;
    }
    navigate('/notes/new', {
      state: {
        prefillTitle: `中英标注 · ${new Date().toLocaleDateString('zh-CN')}`,
        prefillContent: content,
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <PageMeta
        title="中英重点标注工具 - 终末地寻光笔记"
        description="写中文，鼠标滑动选中重点词即自动查询英文术语并生成中英对照，一键将标注内容保存为学习笔记。"
        keywords="中英重点标注, 划词翻译, 英文术语标注, 中英对照"
      />
      <Button variant="ghost" onClick={() => navigate('/')} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        返回首页
      </Button>

      <div>
        <h1 className="text-2xl md:text-3xl font-hand font-semibold">中英重点标注</h1>
        <p className="text-sm text-muted-foreground mt-1">
          写下中文，鼠标滑动选中重点词即自动查询英文术语，生成「中文」格式对照并存为笔记
        </p>
      </div>

      <Card className="sketch-box">
        <CardContent className="p-5 md:p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="annotate-content">中文正文</Label>
            <Textarea
              id="annotate-content"
              ref={textareaRef}
              placeholder="写下中文内容，滑动鼠标选中重点词，将自动查询英文并标注……"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onSelect={updateSelection}
              onMouseUp={updateSelection}
              onKeyUp={updateSelection}
              rows={10}
              className="notebook-lines leading-7 resize-y"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {translating ? (
              <span className="flex items-center gap-2 text-sm text-muted-foreground min-h-9">
                <Loader2 className="h-4 w-4 animate-spin" />
                {statusText}
              </span>
            ) : (
              <Button
                variant="secondary"
                onClick={openAnnotateDialog}
                disabled={!selection.text}
                className="gap-1.5"
              >
                <Highlighter className="h-4 w-4" />
                手动标注{selection.text ? `「${selection.text.slice(0, 12)}」` : ''}
              </Button>
            )}
            <Button onClick={saveAsNote} className="gap-1.5 ml-auto" disabled={translating}>
              <NotebookPen className="h-4 w-4" />
              保存为笔记
            </Button>
          </div>

          {annotations.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                已标注 {annotations.length} 个词条
              </p>
              <div className="flex flex-wrap gap-2">
                {annotations.map((ann, i) => (
                  <Badge key={`${ann.cn}-${ann.en}-${i}`} variant="secondary" className="gap-1 py-1.5 pl-2.5 pr-1">
                    <span className="font-hand">{ann.cn}</span>
                    <span className="text-muted-foreground">=</span>
                    <span className="font-mono text-xs">{ann.en}</span>
                    <button
                      type="button"
                      onClick={() => removeAnnotation(ann)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                      aria-label={`移除标注 ${ann.cn}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 对照预览 */}
      <Card className="sketch-line">
        <CardContent className="p-5 md:p-6">
          <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <Languages className="h-4 w-4" />
            对照预览
          </p>
          {content.trim() ? (
            <p className="whitespace-pre-wrap leading-8">{previewNodes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">还没有内容，先在上面动笔吧</p>
          )}
        </CardContent>
      </Card>

      {/* 标注输入弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle>标注重点词</DialogTitle>
            <DialogDescription>为「{selection.text}」填写对应的英文术语</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="annotate-en">英文术语</Label>
            <Input
              id="annotate-en"
              placeholder="例如：radiator"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmAnnotate();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmAnnotate}>标注</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
