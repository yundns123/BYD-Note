import { ToolboxProvider } from '@/components/toolbox/ToolboxProvider';
import { DesktopSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <ToolboxProvider>
      <div className="flex min-h-screen w-full">
        <DesktopSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <AppHeader />
          {/* 底部预留悬浮唤出按钮空间 */}
          <main className="flex-1 min-w-0 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-10">
            {children}
          </main>
        </div>
      </div>
    </ToolboxProvider>
  );
}
