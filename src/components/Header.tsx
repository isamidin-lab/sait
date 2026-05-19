import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SupportModal from './SupportModal';
import { BookOpen, Menu, X, LogIn, LogOut, Shield, MessageCircle, Heart, FileText, BookOpenCheck } from 'lucide-react';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const { isAdmin, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/articles') return location.pathname === '/articles' || location.pathname.startsWith('/article/');
    return location.pathname === path;
  };

  const linkClass = (path: string) =>
    `transition-colors duration-200 font-medium ${
      isActive(path)
        ? 'text-amber-600'
        : 'text-slate-300 hover:text-amber-400'
    }`;

  return (
    <>
      <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <BookOpen className="w-7 h-7 text-emerald-500 group-hover:text-emerald-400 transition-colors" />
              <span className="text-xl font-bold text-white tracking-tight">
                Зейнуль Абидин
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className={linkClass('/')}>
                Главная
              </Link>
              <Link to="/articles" className={linkClass('/articles')}>
                Статьи / Аудио
              </Link>
              <Link to="/quran" className={linkClass('/quran')}>
                Куран
              </Link>
              <Link to="/ask" className={linkClass('/ask')}>
                Задать вопрос
              </Link>
              <button
                onClick={() => setSupportOpen(true)}
                className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors font-medium"
              >
                <Heart className="w-4 h-4" />
                Поддержать
              </button>
              {isAdmin ? (
                <>
                  <Link to="/admin" className={linkClass('/admin')}>
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      Админ-панель
                    </span>
                  </Link>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-red-400 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Выйти
                  </button>
                </>
              ) : (
                <Link to="/login" className={linkClass('/login')}>
                  <span className="flex items-center gap-1.5">
                    <LogIn className="w-4 h-4" />
                    Войти
                  </span>
                </Link>
              )}
            </nav>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-slate-300 hover:text-white transition-colors"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-700/50">
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="block py-2 px-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-colors"
              >
                Главная
              </Link>
              <Link
                to="/articles"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Статьи / Аудио
              </Link>
              <Link
                to="/quran"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-colors"
              >
                <BookOpenCheck className="w-4 h-4" />
                Куран
              </Link>
              <Link
                to="/ask"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Задать вопрос
              </Link>
              <button
                onClick={() => { setSupportOpen(true); setMobileOpen(false); }}
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-rose-400 hover:bg-slate-800 transition-colors w-full text-left"
              >
                <Heart className="w-4 h-4" />
                Поддержать проект
              </button>
              {isAdmin ? (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    Админ-панель
                  </Link>
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-red-400 hover:bg-slate-800 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Выйти
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Войти
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </>
  );
}
