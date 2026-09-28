import { Sparkles } from 'lucide-react';
import { useToolbox } from './ToolboxProvider';

/** 全局悬浮唤出按钮：常驻右下角，点击唤出/收起 Jev 工具箱 */
export function FloatingLauncher() {
  const { open, toggle } = useToolbox();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={open ? '收起工具箱' : '唤出工具箱'}
      aria-expanded={open}
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full border-2 border-foreground bg-card shadow-lg flex items-center justify-center transition-transform duration-200 hover:-translate-y-1 hover:rotate-6 active:translate-y-0 active:rotate-0"
    >
      <Sparkles className="h-6 w-6" />
      <span className="sr-only">唤出工具箱</span>
    </button>
  );
}
