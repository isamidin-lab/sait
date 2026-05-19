import { useState } from 'react';
import { Calendar, User, Tag, Heart, ChevronDown, ChevronUp, MessageSquare, CheckCircle } from 'lucide-react';

interface FireQuestion {
  id: string;
  question_text: string;
  author_name: string;
  category: string;
  status: string;
  answer_text?: string | null;
  answer_updated_at?: { seconds: number } | null;
  created_at?: { seconds: number } | null;
  likes?: number;
  views?: number;
}

interface Props {
  question: FireQuestion;
}

export default function QuestionCard({ question }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasAnswer = !!question.answer_text;

  const formatDate = (ts?: { seconds: number } | null) => {
    if (!ts) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm transition-all duration-200 overflow-hidden ${
        expanded ? 'border-emerald-200 shadow-md' : 'border-slate-200 hover:shadow-md hover:border-slate-300'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 sm:p-6 focus:outline-none"
      >
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Tag className="w-3 h-3" />
            {question.category || 'Без категории'}
          </span>
          {question.created_at && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(question.created_at)}
            </span>
          )}
          {hasAnswer && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 ml-auto">
              <CheckCircle className="w-3 h-3" />
              Есть ответ
            </span>
          )}
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-slate-800 leading-snug mb-3 text-left">
          {question.question_text}
        </h3>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <User className="w-3.5 h-3.5" />
            <span>{question.author_name}</span>
          </div>
          <div className="flex items-center gap-3">
            {(question.likes ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Heart className="w-3.5 h-3.5" />
                {question.likes}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs font-medium text-slate-400 ml-1">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-600">{expanded ? 'Скрыть' : 'Читать ответ'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />}
            </span>
          </div>
        </div>
      </button>

      <div className={`transition-all duration-300 ease-in-out ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
          <div className="border-t border-slate-100 pt-4">
            {hasAnswer ? (
              <div className="rounded-xl overflow-hidden border border-amber-200/80">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">Ответ администрации</span>
                  {question.answer_updated_at && (
                    <span className="text-xs text-amber-100 ml-auto opacity-90">
                      {formatDate(question.answer_updated_at)}
                    </span>
                  )}
                </div>
                <div className="bg-amber-50/40 px-4 py-4">
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {question.answer_text}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-medium">Ответ ещё не опубликован</p>
                <p className="text-xs text-slate-400 mt-1">Администрация ответит в ближайшее время</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
