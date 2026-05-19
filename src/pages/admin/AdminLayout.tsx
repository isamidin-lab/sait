import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Archive,
  Tags,
  Users,
  Shield,
  GraduationCap,
  Wallet,
  ExternalLink,
  FileText,
  BookOpen,
} from 'lucide-react';

// minRole: 'moderator' = all admins, 'administrator' = admins+owners, 'owner' = owner only
const allTabs = [
  { path: '/admin',          label: 'Новые вопросы',              icon: MessageSquare, minRole: 'moderator' },
  { path: '/admin/archive',  label: 'Архив ответов',              icon: Archive,       minRole: 'moderator' },
  { path: '/admin/articles', label: 'Статьи',                     icon: FileText,      minRole: 'moderator' },
  { path: '/admin/quran',    label: 'Куран (Тафсир)',              icon: BookOpen,      minRole: 'administrator' },
  { path: '/admin/categories', label: 'Категории',                icon: Tags,          minRole: 'administrator' },
  { path: '/admin/resources', label: 'Курсы и реклама',           icon: GraduationCap, minRole: 'administrator' },
  { path: '/admin/wallets',  label: 'Настройки донатов',          icon: Wallet,        minRole: 'administrator' },
  { path: '/admin/admins',   label: 'Доступ и команда',           icon: Users,         minRole: 'owner' },
] as const;

export default function AdminLayout() {
  const { isAdmin, isOwner, isAdministrator, loading, adminInfo } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = allTabs.filter((tab) => {
    if (tab.minRole === 'owner') return isOwner;
    if (tab.minRole === 'administrator') return isAdministrator;
    return true; // 'moderator' — all admins
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Shield className="w-8 h-8 text-emerald-600 animate-pulse" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-700/50 transform transition-transform duration-200 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700/50">
          <Shield className="w-6 h-6 text-emerald-400" />
          <span className="text-white font-bold">Админ-панель</span>
        </div>

        <div className="px-3 py-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(tab.path)
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="px-3 pb-4">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 border border-amber-500/20"
          >
            <ExternalLink className="w-5 h-5" />
            На главный сайт
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {adminInfo?.display_name?.[0] || 'A'}
            </div>
            <div>
              <p className="text-sm text-white font-medium">{adminInfo?.display_name}</p>
              <p className="text-xs text-slate-400">
                {adminInfo?.role === 'owner' ? 'Владелец' : adminInfo?.role === 'administrator' ? 'Администратор' : 'Модератор'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-slate-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-slate-800">Админ-панель</span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
