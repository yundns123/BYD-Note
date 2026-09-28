import HomePage from './pages/HomePage';
import NotesPage from './pages/NotesPage';
import NoteDetailPage from './pages/NoteDetailPage';
import NoteEditPage from './pages/NoteEditPage';
import AdminPage from './pages/AdminPage';
import AnnotatePage from './pages/AnnotatePage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '首页',
    path: '/',
    element: <HomePage />,
  },
  {
    name: '全部笔记',
    path: '/notes',
    element: <NotesPage />,
  },
  {
    name: '新建笔记',
    path: '/notes/new',
    element: <NoteEditPage />,
    visible: false,
  },
  {
    name: '笔记详情',
    path: '/notes/:id',
    element: <NoteDetailPage />,
    visible: false,
  },
  {
    name: '编辑笔记',
    path: '/notes/:id/edit',
    element: <NoteEditPage />,
    visible: false,
  },
  {
    name: '管理面板',
    path: '/admin',
    element: <AdminPage />,
  },
  {
    name: '中英重点标注',
    path: '/tools/annotate',
    element: <AnnotatePage />,
    visible: false,
  },
];

export default routes;
