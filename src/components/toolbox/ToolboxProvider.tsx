import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tool } from '@/types';
import { getTools } from '@/db/api';
import { BUILTIN_TOOLS, PANEL_TOGGLE_KEY } from './registry';
import { FloatingLauncher } from './FloatingLauncher';
import { ToolboxPanel } from './ToolboxPanel';

interface ToolboxContextValue {
  /** 工具箱面板是否展开 */
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  /** 用户自定义工具（来自数据库） */
  tools: Tool[];
  refreshTools: () => Promise<void>;
  /** 已被占用的快捷键映射：键 → 工具名 */
  occupied: Record<string, string>;
}

const ToolboxContext = createContext<ToolboxContextValue | null>(null);

export const useToolbox = () => {
  const ctx = useContext(ToolboxContext);
  if (!ctx) throw new Error('useToolbox 必须在 ToolboxProvider 内使用');
  return ctx;
};

export function ToolboxProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const navigate = useNavigate();

  const refreshTools = useCallback(async () => {
    try {
      setTools(await getTools());
    } catch (err) {
      console.error('加载自定义工具失败:', err);
    }
  }, []);

  useEffect(() => {
    refreshTools();
  }, [refreshTools]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  // 已占用快捷键（内置 + 自定义）
  const occupied = useMemo(() => {
    const map: Record<string, string> = {};
    BUILTIN_TOOLS.forEach((t) => {
      map[t.shortcut] = t.name;
    });
    tools.forEach((t) => {
      map[t.shortcut] = t.name;
    });
    return map;
  }, [tools]);

  // 全局单键快捷键监听：非输入状态下按下单键即可唤起对应工具
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'Escape') {
        if (open) setOpen(false);
        return;
      }

      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isTyping || e.repeat) return;

      const key = e.key.length === 1 ? e.key.toUpperCase() : '';
      if (!key) return;

      if (key === PANEL_TOGGLE_KEY) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      const builtin = BUILTIN_TOOLS.find((t) => t.shortcut === key);
      if (builtin) {
        e.preventDefault();
        setOpen(false);
        navigate(builtin.path);
        return;
      }

      const custom = tools.find((t) => t.shortcut === key);
      if (custom) {
        e.preventDefault();
        setOpen(false);
        window.open(custom.url, '_blank', 'noopener,noreferrer');
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate, open, tools]);

  return (
    <ToolboxContext.Provider value={{ open, setOpen, toggle, tools, refreshTools, occupied }}>
      {children}
      <FloatingLauncher />
      <ToolboxPanel />
    </ToolboxContext.Provider>
  );
}
