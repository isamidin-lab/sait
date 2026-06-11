import { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from '../contexts/ToastContext';
import Spinner from '../components/Spinner';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';

const CATEGORIES = [
  'Акыда',
  'Фикх',
  'Коран и тафсир',
  'История ислама',
  'Нравственность и воспитание',
  'Другое',
];

export default function AskPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { addToast } = useToast();

  const [form, setForm] = useState({
    authorName: '',
    authorEmail: '',
    category: CATEGORIES[0],
    questionText: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (form.authorName.trim().length < 3) {
      newErrors.authorName = 'Имя обязательно (минимум 3 символа)';
    }
    if (form.questionText.trim().length < 10) {
      newErrors.questionText = 'Вопрос должен содержать минимум 10 символов';
    }
    if (form.authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.authorEmail)) {
      newErrors.authorEmail = 'Введите корректный email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'questions'), {
        author_name: form.authorName.trim(),
        author_email: form.authorEmail.trim() || null,
        category: form.category,
        question_text: form.questionText.trim(),
        status: 'pending',
        answer_text: null,
        answer_updated_at: null,
        created_at: serverTimestamp(),
      });
      setSubmitted(true);
      addToast('success', 'Ваш вопрос успешно отправлен и находится на рассмотрении у администрации');
    } catch {
      addToast('error', 'Ошибка при отправке вопроса. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Вопрос отправлен!</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Ваш вопрос успешно отправлен и находится на рассмотрении у администрации.
            После публикации ответа он появится на главной странице.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
            >
              На главную
            </Link>
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({ authorName: '', authorEmail: '', category: CATEGORIES[0], questionText: '' });
                setErrors({});
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Задать ещё вопрос
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Задать вопрос</h1>
              <p className="text-sm text-slate-500">Заполните форму ниже</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Ваше имя <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.authorName}
                  onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                  placeholder="Как вас зовут?"
                  className={`w-full px-4 py-2.5 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${
                    errors.authorName ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {errors.authorName && (
                  <p className="text-red-500 text-xs mt-1">{errors.authorName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email <span className="text-slate-400">(необязательно)</span>
                </label>
                <input
                  type="email"
                  value={form.authorEmail}
                  onChange={(e) => setForm({ ...form, authorEmail: e.target.value })}
                  placeholder="email@example.com"
                  className={`w-full px-4 py-2.5 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all ${
                    errors.authorEmail ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {errors.authorEmail && (
                  <p className="text-red-500 text-xs mt-1">{errors.authorEmail}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Категория</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Ваш вопрос <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.questionText}
                onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                rows={5}
                placeholder="Напишите ваш вопрос здесь (минимум 10 символов)..."
                className={`w-full px-4 py-2.5 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-y ${
                  errors.questionText ? 'border-red-300' : 'border-slate-200'
                }`}
              />
              {errors.questionText && (
                <p className="text-red-500 text-xs mt-1">{errors.questionText}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                {form.questionText.length}/10 символов минимум
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-xl transition-colors duration-200 shadow-lg shadow-emerald-600/25"
            >
              {loading ? (
                <Spinner className="w-5 h-5" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Отправить вопрос
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
