import { Home, NotebookText, PenLine, Settings, Languages } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// 内置工具定义
export interface BuiltinTool {
  id: string;
  name: string;
  description: string;
  shortcut: string;
  path: string;
  icon: LucideIcon;
}

// 内置应用注册表（「按 C 键即可写 C 语言」理念：单键直达）
export const BUILTIN_TOOLS: BuiltinTool[] = [
  { id: 'home', name: '首页', description: '回到笔记本的门厅', shortcut: 'H', path: '/', icon: Home },
  { id: 'notes', name: '全部笔记', description: '翻阅所有学习记录', shortcut: 'B', path: '/notes', icon: NotebookText },
  { id: 'new-note', name: '写笔记', description: '立刻动笔记录一篇', shortcut: 'N', path: '/notes/new', icon: PenLine },
  {
    id: 'annotate',
    name: '中英重点标注',
    description: '写中文，划词自动标注英文',
    shortcut: 'E',
    path: '/tools/annotate',
    icon: Languages,
  },
  { id: 'admin', name: '管理面板', description: '笔记与分类的整理维护', shortcut: 'A', path: '/admin', icon: Settings },
];

// 工具箱面板唤出/收起键
export const PANEL_TOGGLE_KEY = 'T';

// 系统保留按键（内置工具 + 面板开关）
export const RESERVED_KEYS: string[] = [...BUILTIN_TOOLS.map((t) => t.shortcut), PANEL_TOGGLE_KEY];

// 可分配的全部单键（A-Z、0-9）
export const ALL_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
