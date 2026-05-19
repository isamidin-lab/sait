import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { supabase } from '../lib/supabase';
import { db } from '../lib/firebase';
import QuestionCard from '../components/QuestionCard';
import ArticleCard from '../components/ArticleCard';
import Spinner from '../components/Spinner';
import { Search, MessageCircle, BookOpen, Filter, GraduationCap, ExternalLink, FileText, ChevronDown, BookOpenCheck } from 'lucide-react';
import type { Product } from '../lib/types';

const ARTICLES_PAGE_SIZE = 6;
const QUESTIONS_PAGE_SIZE = 5;

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

export default function HomePage() {
  const [questions, setQuestions] = useState<FireQuestion[]>([]);
  const [articles, setArticles] = useState<FireArticle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibleArticles, setVisibleArticles] = useState(ARTICLES_PAGE_SIZE);
  const [visibleQuestions, setVisibleQuestions] = useState(QUESTIONS_PAGE_SIZE);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchQuestions(), fetchArticles(), fetchProducts()]);
    setLoading(false);
  };

  const fetchQuestions = async () => {
    try {
      const q = query(
        collection(db, 'questions'),
        where('status', '==', 'published'),
        orderBy('created_at', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FireQuestion));
      setQuestions(data);
      const cats = Array.from(new Set(data.map((q) => q.category).filter(Boolean)));
      setCategories((prev) => Array.from(new Set([...prev, ...cats])));
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const fetchArticles = async () => {
    try {
      const q = query(
        collection(db, 'articles'),
        where('status', '==', 'published'),
        orderBy('created_at', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FireArticle));
      setArticles(data);
      const cats = Array.from(new Set(data.map((a) => a.category).filter(Boolean)));
      setCategories((prev) => Array.from(new Set([...prev, ...cats])));
    } catch (err) {
      console.error('Error fetching articles:', err);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (data) setProducts(data);
  };

  const filteredQuestions = useMemo(() => {
    let result = questions;
    if (selectedCategory !== 'all') {
      result = result.filter((q) => q.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.question_text.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.answer_text?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [questions, selectedCategory, searchQuery]);

  const filteredArticles = useMemo(() => {
    let result = articles;
    if (selectedCategory !== 'all') {
      result = result.filter((a) => a.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [articles, selectedCategory, searchQuery]);

  const paginatedArticles = filteredArticles.slice(0, visibleArticles);
  const paginatedQuestions = filteredQuestions.slice(0, visibleQuestions);
  const hasMoreArticles = visibleArticles < filteredArticles.length;
  const hasMoreQuestions = visibleQuestions < filteredQuestions.length;
  const hasContent = filteredQuestions.length > 0 || filteredArticles.length > 0;

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setVisibleArticles(ARTICLES_PAGE_SIZE);
    setVisibleQuestions(QUESTIONS_PAGE_SIZE);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
              Зейнуль Абидин
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Задавайте вопросы и получайте ответы от администрации.
              Мы ценим ваше любопытство и стремимся помочь.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск по вопросам, ответам и статьям..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleArticles(ARTICLES_PAGE_SIZE);
                  setVisibleQuestions(QUESTIONS_PAGE_SIZE);
                }}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-base"
              />
            </div>
          </div>

          <div className="mt-8 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/ask"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors duration-200 shadow-lg shadow-amber-500/25"
            >
              <MessageCircle className="w-5 h-5" />
              Задать вопрос
            </Link>
            <Link
              to="/quran"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl transition-colors duration-200"
            >
              <BookOpenCheck className="w-5 h-5" />
              Читать Куран
            </Link>
          </div>
        </div>
      </section>

      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-slate-800">Наши курсы и продукты</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                {product.image_url ? (
                  <div className="h-44 overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-emerald-100 to-amber-50 flex items-center justify-center">
                    <GraduationCap className="w-12 h-12 text-emerald-300" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-base font-semibold text-slate-800 mb-1.5 leading-snug">{product.title}</h3>
                  {product.description && (
                    <p className="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-3">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="text-lg font-bold text-emerald-700">{product.price}</span>
                    <a
                      href={product.action_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {product.action_label}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-700">Категории</h2>
          </div>
          <div className="flex flex-wrap gap-2">
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
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      )}

      {filteredArticles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-700">Статьи</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          {hasMoreArticles && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setVisibleArticles((prev) => prev + ARTICLES_PAGE_SIZE)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <ChevronDown className="w-4 h-4" />
                Загрузить ещё ({filteredArticles.length - visibleArticles} осталось)
              </button>
            </div>
          )}
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {filteredQuestions.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-slate-700">Вопросы и ответы</h2>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="w-8 h-8 text-emerald-600" />
          </div>
        ) : !hasContent ? (
          <div className="text-center py-16">
            <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">
              {searchQuery || selectedCategory !== 'all'
                ? 'По вашему запросу ничего не найдено'
                : 'Пока нет опубликованных материалов'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {paginatedQuestions.map((q) => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
            {hasMoreQuestions && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setVisibleQuestions((prev) => prev + QUESTIONS_PAGE_SIZE)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <ChevronDown className="w-4 h-4" />
                  Загрузить ещё ({filteredQuestions.length - visibleQuestions} осталось)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
