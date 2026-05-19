import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Spinner from '../components/Spinner';
import { ArrowLeft, Calendar, Tag, Headphones, Download, Play, BookOpen } from 'lucide-react';

interface FireArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  file_url: string | null;
  views: number;
  likes: number;
  status: string;
  created_at: { seconds: number } | null;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

function renderContent(text: string) {
  return text.split('\n').map((paragraph, i) => {
    const trimmed = paragraph.trim();
    if (!trimmed) return <br key={i} />;
    if (trimmed.startsWith('### ')) {
      return <h3 key={i} className="text-lg font-semibold text-slate-800 mt-6 mb-2">{trimmed.slice(4)}</h3>;
    }
    if (trimmed.startsWith('## ')) {
      return <h2 key={i} className="text-xl font-bold text-slate-800 mt-8 mb-3">{trimmed.slice(3)}</h2>;
    }
    if (trimmed.startsWith('# ')) {
      return <h1 key={i} className="text-2xl font-bold text-slate-900 mt-8 mb-3">{trimmed.slice(2)}</h1>;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return <li key={i} className="ml-4 text-slate-700 leading-relaxed list-disc">{trimmed.slice(2)}</li>;
    }
    const boldText = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>');
    const italicText = boldText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return <p key={i} className="text-slate-700 leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: italicText }} />;
  });
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<FireArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const snap = await getDoc(doc(db, 'articles', id!));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as FireArticle;
        if (data.status === 'published') {
          setArticle(data);
        }
      }
    } catch (err) {
      console.error('Error fetching article:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts: { seconds: number } | null) => {
    if (!ts) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="w-8 h-8 text-emerald-600" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-4">Статья не найдена</p>
          <Link to="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  const youtubeId = article.video_url ? getYouTubeId(article.video_url) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        {article.image_url && (
          <div className="rounded-2xl overflow-hidden mb-8 shadow-lg">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-64 sm:h-80 object-cover"
            />
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {article.category && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Tag className="w-3 h-3" />
                {article.category}
              </span>
            )}
            {article.created_at && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(article.created_at)}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 leading-tight">
            {article.title}
          </h1>

          {article.audio_url && (
            <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Headphones className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800">Аудиоверсия</span>
              </div>
              <audio controls className="w-full" preload="metadata">
                <source src={article.audio_url} type="audio/mpeg" />
                Ваш браузер не поддерживает аудиоплеер.
              </audio>
            </div>
          )}

          {youtubeId && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Play className="w-5 h-5 text-red-500" />
                <span className="text-sm font-semibold text-slate-700">Видео</span>
              </div>
              <div className="aspect-video rounded-xl overflow-hidden shadow-md">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="Video"
                  allowFullScreen
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </div>
          )}

          <div className="prose prose-slate max-w-none">
            {renderContent(article.content)}
          </div>

          {article.file_url && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <a
                href={article.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-amber-500/25"
              >
                <Download className="w-5 h-5" />
                Скачать PDF / Документ
              </a>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться на главную
          </Link>
        </div>
      </article>
    </div>
  );
}
