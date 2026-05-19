import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Category, Article } from '../lib/types';
import ArticleCard from '../components/ArticleCard';
import Spinner from '../components/Spinner';
import { FileText, Filter, Headphones, ChevronDown } from 'lucide-react';

const PAGE_SIZE = 9;

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*, categories(*)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    if (data) setArticles(data as Article[]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    if (data) setCategories(data.filter((c) => c.slug !== 'general'));
  };

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (selectedCategory !== 'all') {
      result = result.filter((a) => a.category_id === selectedCategory);
    }
    return result;
  }, [articles, selectedCategory]);

  const paginatedArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;
  const audioArticles = articles.filter((a) => a.audio_url);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setVisibleCount(PAGE_SIZE);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="w-8 h-8 text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Статьи / Аудио
          </h1>
          <p className="text-emerald-200/80 text-lg max-w-xl mx-auto">
            Полезные статьи и аудиолекции на исламские темы
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {audioArticles.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Headphones className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-700">Аудиолекции</h2>
            </div>
            <div className="space-y-3">
              {audioArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {article.image_url ? (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-16 h-16 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <Headphones className="w-6 h-6 text-emerald-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/article/${article.id}`}
                        className="font-semibold text-slate-800 hover:text-emerald-700 transition-colors"
                      >
                        {article.title}
                      </Link>
                      {article.categories && (
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">
                          {article.categories.name}
                        </p>
                      )}
                      <div className="mt-2">
                        <audio controls className="w-full h-10" preload="metadata">
                          <source src={article.audio_url!} type="audio/mpeg" />
                          Ваш браузер не поддерживает аудиоплеер.
                        </audio>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-700">Все статьи</h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
              }`}
            >
              Все
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {filteredArticles.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Загрузить еще ({filteredArticles.length - visibleCount} осталось)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">Статей пока нет</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
