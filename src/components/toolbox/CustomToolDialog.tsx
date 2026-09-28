import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTool, updateTool } from '@/db/api';
import type { Tool } from '@/types';
import { useToolbox } from './ToolboxProvider';
import { ALL_KEYS, RESERVED_KEYS } from './registry';
import { toast } from 'sonner';

const URL_PATTERN = /^https?:\/\/.+\..+/;

interface CustomToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTool: Tool | null;
}

/** 新增 / 编辑自定义工具弹窗（功能自助添加） */
export function CustomToolDialog({ open, onOpenChange, editingTool }: CustomToolDialogProps) {
  const { occupied, refreshTools } = useToolbox();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [shortcut, setShortcut] = useState('');
  const [saving, setSaving] = useState(false);

  // 打开时初始化表单
  useEffect(() => {
    if (open) {
      setName(editingTool?.name ?? '');
      setDescription(editingTool?.description ?? '');
      setUrl(editingTool?.url ?? '');
      setShortcut(editingTool?.shortcut ?? '');
    }
  }, [open, editingTool]);

  // 可分配按键：排除系统保留键与已被占用的键（编辑时保留自己的键）
  const availableKeys = ALL_KEYS.filter(
    (key) => key === editingTool?.shortcut || (!RESERVED_KEYS.includes(key) && !(key in occupied))
  );

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const trimmedUrl = url.trim();

    if (!trimmedName || !trimmedUrl || !shortcut) {
      toast.error('请输入完整工具信息');
      return;
    }
    if (!URL_PATTERN.test(trimmedUrl)) {
      toast.error('请输入有效的网址链接');
      return;
    }
    if (shortcut !== editingTool?.shortcut && shortcut in occupied) {
      toast.error('该快捷键已被占用，请更换其他按键');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        description: trimmedDesc || null,
        url: trimmedUrl,
        shortcut,
      };
      if (editingTool) {
        await updateTool(editingTool.id, payload);
        toast.success('工具已更新');
      } else {
        await createTool(payload);
        toast.success('工具已添加，按下对应按键即可唤起');
      }
      onOpenChange(false);
      await refreshTools();
    } catch (err) {
      console.error('保存自定义工具失败:', err);
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingTool ? '编辑自定义工具' : '添加自定义工具'}</DialogTitle>
          <DialogDescription>
            填入工具名称与链接，绑定一个单键快捷键，即可「按键直达」
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tool-name">工具名称</Label>
            <Input
              id="tool-name"
              placeholder="例如：百度翻译"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tool-desc">功能描述（可选）</Label>
            <Input
              id="tool-desc"
              placeholder="一句话说明它的用途"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={50}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tool-url">工具链接</Label>
            <Textarea
              id="tool-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              rows={2}
              disabled={saving}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tool-shortcut">快捷键</Label>
            {availableKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground">所有单键均已被占用，请先释放一些按键</p>
            ) : (
              <Select value={shortcut} onValueChange={setShortcut} disabled={saving}>
                <SelectTrigger id="tool-shortcut">
                  <SelectValue placeholder="选择一个按键" />
                </SelectTrigger>
                <SelectContent>
                  {availableKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                      {key === editingTool?.shortcut ? '（当前）' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving || availableKeys.length === 0}>
            {saving ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
