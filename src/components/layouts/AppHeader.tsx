import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, PenLine } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebar } from './AppSidebar';

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64" onClick={() => setOpen(false)}>
              <AppSidebar />
            </SheetContent>
          </Sheet>
          <Link to="/" className="md:hidden font-hand font-semibold text-base truncate">
            终末地寻光笔记
          </Link>
        </div>
        <Button size="sm" onClick={() => navigate('/notes/new')} className="gap-1.5">
          <PenLine className="h-4 w-4" />
          写笔记
        </Button>
      </div>
    </header>
  );
}
