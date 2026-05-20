import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BookOpen, Heart, Send } from 'lucide-react';
import SupportModal from './SupportModal';

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z" />
    </svg>
  );
}

const SOCIAL_CONFIG = [
  { key: 'telegram',  name: 'Telegram',  icon: TelegramIcon,  hoverClass: 'hover:bg-sky-500/20 hover:text-sky-400 hover:border-sky-500/40' },
  { key: 'instagram', name: 'Instagram', icon: InstagramIcon, hoverClass: 'hover:bg-pink-500/20 hover:text-pink-400 hover:border-pink-500/40' },
  { key: 'youtube',   name: 'YouTube',   icon: YouTubeIcon,   hoverClass: 'hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40' },
  { key: 'tiktok',    name: 'TikTok',    icon: TikTokIcon,    hoverClass: 'hover:bg-slate-400/20 hover:text-slate-200 hover:border-slate-400/40' },
];

export default function Footer() {
  const [supportOpen, setSupportOpen] = useState(false);
  const [socials, setSocials] = useState<Record<string, string>>({});

  useEffect(() => {
    getDoc(doc(db, 'settings', 'socials')).then((snap) => {
      if (snap.exists()) setSocials(snap.data() as Record<string, string>);
    });
  }, []);

  const activeLinks = SOCIAL_CONFIG.filter(({ key }) => socials[key]);

  return (
    <>
      <footer className="bg-slate-900 border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Social links row */}
          {activeLinks.length > 0 && (
            <div className="py-8 border-b border-slate-800">
              <div className="flex flex-col items-center gap-4">
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
                  Мы в социальных сетях
                </p>
                <div className="flex items-center gap-3">
                  {activeLinks.map(({ key, name, icon: Icon, hoverClass }) => (
                    <a
                      key={key}
                      href={socials[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={name}
                      className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-700/60 text-slate-400 bg-slate-800/50 transition-all duration-200 ${hoverClass}`}
                    >
                      <Icon />
                      <span className="text-sm font-medium hidden sm:block">{name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom row */}
          <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              <span className="text-slate-300 font-semibold tracking-tight">Зейнуль Абидин</span>
            </div>

            <button
              onClick={() => setSupportOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-sm font-medium transition-all duration-200 group"
            >
              <Heart className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              Поддержать проект
            </button>

            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
              <Send className="w-3.5 h-3.5 text-emerald-600/60" />
              <span>Вопросы и ответы. Все права защищены.</span>
            </div>
          </div>

        </div>
      </footer>
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </>
  );
}
