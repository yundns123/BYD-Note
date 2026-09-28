import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, NotebookPen, Settings } from 'lucide-react';

const menuItems = [
  { title: '首页', icon: Home, path: '/' },
  { title: '全部笔记', icon: NotebookPen, path: '/notes' },
  { title: '管理面板', icon: Settings, path: '/admin' },
];

// ===== 共享区块 =====

/** 品牌区：折叠时仅显示图标，展开时淡入标题 */
function BrandBlock({ expanded }: { expanded: boolean }) {
  return (
    <Link
      to="/"
      className={`flex items-center border-b border-sidebar-border min-h-16 ${
        expanded ? 'gap-3 px-3' : 'justify-center px-2'
      }`}
    >
      <div className="h-9 w-9 sketch-box flex items-center justify-center shrink-0">
        <NotebookPen className="h-4 w-4 text-foreground" />
      </div>
      {expanded && (
        <div className="flex flex-col min-w-0 animate-in fade-in duration-200">
          <span className="font-hand font-semibold text-base leading-tight whitespace-nowrap">
            终末地寻光笔记
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">个人学习存档</span>
        </div>
      )}
    </Link>
  );
}

/** 导航菜单：折叠时仅图标（悬停展开后显示文字） */
function NavMenu({ expanded }: { expanded: boolean }) {
  const location = useLocation();

  return (
    <nav className="flex-1 px-2 py-3 space-y-1 overflow-hidden">
      {expanded && (
        <p className="px-2.5 pb-1 text-xs font-medium text-muted-foreground animate-in fade-in duration-200">
          导航
        </p>
      )}
      {menuItems.map((item) => {
        const active = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            title={item.title}
            className={`flex items-center min-h-12 rounded-md transition-colors ${
              expanded ? 'gap-3 px-2.5' : 'justify-center'
            } ${
              active
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {expanded && (
              <span className="whitespace-nowrap animate-in fade-in duration-200">{item.title}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** 页脚签名：仅展开时显示 */
function FooterBlock({ expanded }: { expanded: boolean }) {
  return (
    <div className="border-t border-sidebar-border min-h-14 flex items-center px-3">
      {expanded && (
        <span className="text-xs text-muted-foreground font-hand whitespace-nowrap animate-in fade-in duration-200">
          记录于业余时光的点点滴滴
        </span>
      )}
    </div>
  );
}

// ===== 桌面端：自动折叠侧边栏 =====

/**
 * 桌面端左侧导航：默认折叠为图标窄条，鼠标悬停自动展开，移开自动收回。
 * 展开态以浮层覆盖正文（不挤压内容），悬停意图防抖避免鼠标划过时闪烁。
 */
export function DesktopSidebar() {
  const [expanded, setExpanded] = useState(false);
  const enterTimer = useRef<number | undefined>(undefined);
  const leaveTimer = useRef<number | undefined>(undefined);

  const handleMouseEnter = () => {
    window.clearTimeout(leaveTimer.current);
    window.clearTimeout(enterTimer.current);
    enterTimer.current = window.setTimeout(() => setExpanded(true), 120);
  };

  const handleMouseLeave = () => {
    window.clearTimeout(enterTimer.current);
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setExpanded(false), 150);
  };

  useEffect(
    () => () => {
      window.clearTimeout(enterTimer.current);
      window.clearTimeout(leaveTimer.current);
    },
    []
  );

  return (
    <aside className="hidden md:block shrink-0 w-16 relative z-50">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`absolute inset-y-0 left-0 flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden transition-[width] duration-200 ease-in-out ${
          expanded ? 'w-64 shadow-lg' : 'w-16'
        }`}
      >
        <BrandBlock expanded={expanded} />
        <NavMenu expanded={expanded} />
        <FooterBlock expanded={expanded} />
      </div>
    </aside>
  );
}

// ===== 移动端：抽屉内完整侧边栏 =====

/** 完整展开的侧边栏（移动端抽屉内使用，不受自动折叠影响） */
export function AppSidebar() {
  return (
    <div className="flex flex-col h-full w-full bg-sidebar">
      <BrandBlock expanded />
      <NavMenu expanded />
      <FooterBlock expanded />
    </div>
  );
}

