import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, User, Tag, Eye, Heart, ChevronDown, ChevronUp, MessageSquare, CheckCircle } from 'lucide-react';
import type { QuestionWithAnswer } from '../lib/types';

function getFingerprint(): string {
  const stored = localStorage.getItem('za_fingerprint');
  if (stored) return stored;
  const fp = crypto.randomUUID();
  localStorage.setItem('za_fingerprint', fp);
  return fp;
}

interface Props {
  question: QuestionWithAnswer;
}

export default function QuestionCard({ question }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(question.likes);
  const [viewCount, setViewCount] = useState(question.views);
  const viewedRef = useRef(false);
  const answer = question.answers?.[0];
  const hasAnswer = !!answer;
  const fingerprint = getFingerprint();

  useEffect(() => {
    checkIfLiked();
  }, []);

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from('question_likes')
      .select('id')
      .eq('question_id', question.id)
      .eq('user_fingerprint', fingerprint)
      .maybeSingle();
    setLiked(!!data);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { data, error } = await supabase.rpc('toggle_question_like', {
      p_question_id: question.id,
      p_fingerprint: fingerprint,
    });
    if (error) return;
    const isNowLiked = data as boolean;
    setLiked(isNowLiked);
    setLikeCount((prev) => (isNowLiked ? prev + 1 : Math.max(0, prev - 1)));
  };

  const handleToggle = () => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand && !viewedRef.current) {
      viewedRef.current = true;
      setViewCount((prev) => prev + 1);
      supabase.rpc('increment_question_views', { p_question_id: question.id });
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm transition-all duration-200 overflow-hidden ${
        expanded
          ? 'border-emerald-200 shadow-md'
          : 'border-slate-200 hover:shadow-md hover:border-slate-300'
      }`}
    >
      {/* Question header — clickable to expand */}
      <button
        onClick={handleToggle}
        className="w-full text-left p-5 sm:p-6 focus:outline-none"
      >
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Tag className="w-3 h-3" />
            {question.categories.name}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(question.created_at)}
          </span>
          {hasAnswer && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 ml-auto">
              <CheckCircle className="w-3 h-3" />
              Есть ответ
            </span>
          )}
        </div>

        {/* Question text */}
        <h3 className="text-base sm:text-lg font-semibold text-slate-800 leading-snug mb-3 text-left">
          {question.question_text}
        </h3>

        {/* Footer row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <User className="w-3.5 h-3.5" />
            <span>{question.author_name}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Eye className="w-3.5 h-3.5" />
              {viewCount}
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={handleLike}
              onKeyDown={(e) => e.key === 'Enter' && handleLike(e as unknown as React.MouseEvent)}
              className={`flex items-center gap-1 text-xs font-medium transition-all duration-200 cursor-pointer ${
                liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform duration-200 ${liked ? 'fill-current scale-110' : ''}`}
              />
              {likeCount}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-slate-400 ml-1">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-600">{expanded ? 'Скрыть' : 'Читать ответ'}</span>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-amber-500" />
              )}
            </span>
          </div>
        </div>
      </button>

      {/* Answer panel — animated accordion */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
          <div className="border-t border-slate-100 pt-4">
            {hasAnswer ? (
              <div className="rounded-xl overflow-hidden border border-amber-200/80">
                {/* Answer header stripe */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">Ответ администрации</span>
                  {answer.published_at && (
                    <span className="text-xs text-amber-100 ml-auto opacity-90">
                      {formatDate(answer.published_at)}
                    </span>
                  )}
                </div>
                {/* Answer body */}
                <div className="bg-amber-50/40 px-4 py-4">
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {answer.answer_text}
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
