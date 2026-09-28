import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Plus, Pencil, Trash2, ExternalLink, Wand2 } from 'lucide-react';
import { useToolbox } from './ToolboxProvider';
import { BUILTIN_TOOLS, PANEL_TOGGLE_KEY } from './registry';
import { CustomToolDialog } from './CustomToolDialog';
import { deleteTool } from '@/db/api';
import type { Tool } from '@/types';
import { toast } from 'sonner';

/** Jev 工具箱启动面板：内置应用 + 自定义工具的单键直达入口 */
export function ToolboxPanel() {
  const { open, setOpen, tools, refreshTools } = useToolbox();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  const keyword = search.trim().toLowerCase();

  const filteredBuiltin = useMemo(
    () =>
      BUILTIN_TOOLS.filter(
        (t) =>
          !keyword ||
          t.name.toLowerCase().includes(keyword) ||
          t.description.toLowerCase().includes(keyword)
      ),
    [keyword]
  );

  const filteredCustom = useMemo(
    () =>
      tools.filter(
        (t) =>
          !keyword ||
          t.name.toLowerCase().includes(keyword) ||
          (t.description ?? '').toLowerCase().includes(keyword) ||
          t.url.toLowerCase().includes(keyword)
      ),
    [tools, keyword]
  );

  const closePanel = () => setOpen(false);

  const openBuiltin = (path: string) => {
    closePanel();
    navigate(path);
  };

  const openCustom = (url: string) => {
    closePanel();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setDialogOpen(true);
  };

  const handleDelete = async (tool: Tool) => {
    try {
      await deleteTool(tool.id);
      toast.success(`已移除工具「${tool.name}」`);
      await refreshTools();
    } catch (err) {
      console.error('删除自定义工具失败:', err);
      toast.error('删除失败，请重试');
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearch('');
        }}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-3xl max-h-[90dvh] overflow-y-auto sketch-box">
          <DialogHeader>
            <DialogTitle className="font-hand text-2xl">Jev 工具箱</DialogTitle>
            <DialogDescription>
              点击卡片直达 · 非输入状态下按下单键即可唤起 · {PANEL_TOGGLE_KEY} 唤出/收起 · Esc 关闭
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索工具…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 内置应用 */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">内置应用</h3>
            {filteredBuiltin.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">未找到相关工具</p>
            ) : (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {filteredBuiltin.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => openBuiltin(tool.path)}
                    className="sketch-line flex items-center gap-3 p-4 text-left transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <span className="h-10 w-10 sketch-box flex items-center justify-center shrink-0">
                      <tool.icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-hand font-semibold truncate">{tool.name}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                        {tool.description}
                      </span>
                    </span>
                    <Badge variant="secondary" className="shrink-0 font-mono">
                      {tool.shortcut}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* 自定义工具 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-muted-foreground">我的工具</h3>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => {
                  setEditingTool(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                添加自定义工具
              </Button>
            </div>
            {filteredCustom.length === 0 ? (
              <div className="sketch-line p-5 text-center space-y-2">
                <Wand2 className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {tools.length === 0
                    ? '还没有自定义工具，点击上方「添加自定义工具」开始自助扩展吧'
                    : '未找到相关工具'}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {filteredCustom.map((tool) => (
                  <div key={tool.id} className="sketch-line flex items-center gap-3 p-4">
                    <button
                      type="button"
                      onClick={() => openCustom(tool.url)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <span className="h-10 w-10 sketch-box flex items-center justify-center shrink-0">
                        <ExternalLink className="h-5 w-5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-hand font-semibold truncate">{tool.name}</span>
                        <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                          {tool.description || tool.url}
                        </span>
                      </span>
                    </button>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="secondary" className="font-mono">
                        {tool.shortcut}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(tool)}
                          aria-label={`编辑 ${tool.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(tool)}
                          aria-label={`删除 ${tool.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </DialogContent>
      </Dialog>

      <CustomToolDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingTool={editingTool}
      />
    </>
  );
}
