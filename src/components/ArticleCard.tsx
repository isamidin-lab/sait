import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Tag, Eye, Heart, Headphones, Video, BookOpen, FileText } from 'lucide-react';
import type { Article } from '../lib/types';

function getFingerprint(): string {
  const stored = localStorage.getItem('za_fingerprint');
  if (stored) return stored;
  const fp = crypto.randomUUID();
  localStorage.setItem('za_fingerprint', fp);
  return fp;
}

interface Props {
  article: Article;
}

function ContentBadge({ article }: { article: Article }) {
  if (article.audio_url && article.video_url) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-600 text-white">
        <Headphones className="w-3 h-3" />
        Аудио + Видео
      </span>
    );
  }
  if (article.audio_url) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500 text-white">
        <Headphones className="w-3 h-3" />
        Лекция
      </span>
    );
  }
  if (article.video_url) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-500 text-white">
        <Video className="w-3 h-3" />
        Видео
      </span>
    );
  }
  if (article.file_url) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-500 text-white">
        <BookOpen className="w-3 h-3" />
        Документ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-sky-500 text-white">
      <FileText className="w-3 h-3" />
      Статья
    </span>
  );
}

export default function ArticleCard({ article }: Props) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes);
  const [viewCount] = useState(article.views);
  const fingerprint = getFingerprint();

  useEffect(() => {
    checkIfLiked();
  }, []);

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from('article_likes')
      .select('id')
      .eq('article_id', article.id)
      .eq('user_fingerprint', fingerprint)
      .maybeSingle();
    setLiked(!!data);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { data, error } = await supabase.rpc('toggle_article_like', {
      p_article_id: article.id,
      p_fingerprint: fingerprint,
    });
    if (error) return;
    const isNowLiked = data as boolean;
    setLiked(isNowLiked);
    setLikeCount((prev) => (isNowLiked ? prev + 1 : Math.max(0, prev - 1)));
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <Link
      to={`/article/${article.id}`}
      className="block bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group"
    >
      {/* Thumbnail */}
      {article.image_url ? (
        <div className="h-48 overflow-hidden relative">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            <ContentBadge article={article} />
          </div>
        </div>
      ) : (
        <div className="h-20 bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-between px-4">
          <ContentBadge article={article} />
          {article.audio_url && (
            <div className="flex items-end gap-0.5 h-6">
              {[4, 8, 12, 7, 10, 5, 9].map((h, i) => (
                <div key={i} className="w-1 rounded-full bg-emerald-400/70" style={{ height: `${h}px` }} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Category + date */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          {article.categories && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Tag className="w-3 h-3" />
              {article.categories.name}
            </span>
          )}
          <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
            <Calendar className="w-3 h-3" />
            {formatDate(article.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-slate-800 mb-2 leading-snug group-hover:text-emerald-700 transition-colors">
          {article.title}
        </h3>

        {/* Excerpt */}
        {article.content && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-3">
            {article.content.replace(/[#*[\]()_`>~]/g, '').substring(0, 120)}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Eye className="w-3.5 h-3.5" />
              {viewCount}
            </span>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-xs font-medium transition-all duration-200 ${
                liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 transition-transform duration-200 ${liked ? 'fill-current scale-110' : ''}`} />
              {likeCount}
            </button>
          </div>
          <span className="text-xs text-emerald-600 font-medium group-hover:underline">Читать →</span>
        </div>
      </div>
    </Link>
  );
}
