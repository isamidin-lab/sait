import { useState } from 'react';
import { BookOpen, Heart } from 'lucide-react';
import SupportModal from './SupportModal';

export default function Footer() {
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <>
      <footer className="bg-slate-900 border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              <span className="text-slate-400 font-medium">Зейнуль Абидин</span>
            </div>
            <button
              onClick={() => setSupportOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-sm font-medium transition-all duration-200"
            >
              <Heart className="w-4 h-4" />
              Поддержать проект
            </button>
            <p className="text-slate-500 text-sm">
              Вопросы и ответы. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </>
  );
}
