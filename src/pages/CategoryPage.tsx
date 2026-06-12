import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, supabaseConfigured } from '../lib/supabase';
import ArticleCard from '../components/ArticleCard';
import QuestionCard from '../components/QuestionCard';
import Spinner from '../components/Spinner';
import { ArrowLeft, Tag, FileText, MessageCircle } from 'lucide-react';

interface Article {
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
  created_at: string | null;
}

interface Question {
  id: string;
  question_text: string;
  author_name: string;
  category: string;
  status: string;
  answer_text?: string | null;
  answer_updated_at?: string | null;
  created_at?: string | null;
  likes?: number;
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryName = slug
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : '';

  useEffect(() => {
    if (slug) fetchData();
  }, [slug]);

  const fetchData = async () => {
    if (!supabaseConfigured) { setLoading(false); return; }
    setLoading(true);
    try {
      const [articlesRes, questionsRes] = await Promise.all([
        supabase
          .from('articles')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false }),
        supabase
          .from('questions')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false }),
      ]);

      const allArticles = (articlesRes.data ?? []) as Article[];
      const allQuestions = (questionsRes.data ?? []) as Question[];

      const normalizedSlug = slug!.toLowerCase().replace(/-/g, ' ');
      setArticles(allArticles.filter((a) => a.category?.toLowerCase() === normalizedSlug));
      setQuestions(allQuestions.filter((q) => q.category?.toLowerCase() === normalizedSlug));
    } catch (err) {
      console.error('Error fetching category data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="w-8 h-8 text-emerald-600" />
      </div>
    );
  }

  const hasContent = articles.length > 0 || questions.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Tag className="w-5 h-5 text-emerald-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{categoryName}</h1>
          </div>
        </div>

        {!hasContent ? (
          <div className="text-center py-16">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">В этой категории пока нет материалов</p>
          </div>
        ) : (
          <>
            {articles.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-slate-700">Статьи</h2>
                  <span className="text-sm text-slate-400">({articles.length})</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}

            {questions.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="w-5 h-5 text-amber-600" />
                  <h2 className="text-lg font-semibold text-slate-700">Вопросы и ответы</h2>
                  <span className="text-sm text-slate-400">({questions.length})</span>
                </div>
                <div className="grid gap-4">
                  {questions.map((q) => (
                    <QuestionCard key={q.id} question={q} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
