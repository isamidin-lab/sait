import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Question, Answer, Category } from '../../lib/types';
import Spinner from '../../components/Spinner';
import {
  Archive,
  Tag,
  CreditCard as Edit3,
  Save,
  X,
  Trash2,
  User,
  Calendar,
  MessageSquare,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface QuestionWithAnswer extends Question {
  answers: Answer[];
}

export default function ArchivePage() {
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchQuestions();
    fetchCategories();
  }, []);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('*, categories(*), answers(*)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    if (data) setQuestions(data as unknown as QuestionWithAnswer[]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    if (data) setCategories(data);
  };

  const openEdit = (q: QuestionWithAnswer) => {
    const answer = q.answers?.[0];
    setEditingId(q.id);
    setEditText(answer?.answer_text ?? '');
    setEditCategory(q.category_id);
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditCategory('');
  };

  const handleSave = async (q: QuestionWithAnswer) => {
    if (!editText.trim()) {
      addToast('error', 'Текст ответа не может быть пустым');
      return;
    }
    setSaving(true);

    const answer = q.answers?.[0];

    if (answer) {
      // Update existing answer
      const { error } = await supabase
        .from('answers')
        .update({
          answer_text: editText.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', answer.id);

      if (error) {
        addToast('error', `Ошибка при сохранении ответа: ${error.message}`);
        setSaving(false);
        return;
      }
    } else {
      // No answer yet — create one (edge case: published without answer)
      const { error } = await supabase.from('answers').insert({
        question_id: q.id,
        admin_id: user!.id,
        answer_text: editText.trim(),
        published_at: new Date().toISOString(),
      });

      if (error) {
        addToast('error', `Ошибка при создании ответа: ${error.message}`);
        setSaving(false);
        return;
      }
    }

    // Update category if changed
    if (editCategory && editCategory !== q.category_id) {
      const { error } = await supabase
        .from('questions')
        .update({ category_id: editCategory })
        .eq('id', q.id);

      if (error) {
        addToast('error', 'Ошибка при изменении категории');
        setSaving(false);
        return;
      }
    }

    addToast('success', 'Ответ обновлён');
    setSaving(false);
    closeEdit();
    fetchQuestions();
  };

  const handleUnpublish = async (q: QuestionWithAnswer) => {
    if (q.answers?.[0]) {
      await supabase.from('answers').delete().eq('question_id', q.id);
    }
    const { error } = await supabase
      .from('questions')
      .update({ status: 'pending' })
      .eq('id', q.id);

    if (error) { addToast('error', 'Ошибка при снятии с публикации'); return; }
    addToast('info', 'Вопрос возвращён в новые');
    fetchQuestions();
  };

  const handleDelete = async (q: QuestionWithAnswer) => {
    await supabase.from('answers').delete().eq('question_id', q.id);
    const { error } = await supabase.from('questions').delete().eq('id', q.id);
    if (error) { addToast('error', 'Ошибка при удалении'); return; }
    addToast('info', 'Вопрос удалён');
    fetchQuestions();
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="w-8 h-8 text-emerald-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Archive className="w-6 h-6 text-emerald-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-800">Архив ответов</h1>
          <p className="text-sm text-slate-500">{questions.length} опубликованных ответов</p>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Нет опубликованных ответов</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => {
            const answer = q.answers?.[0];
            const isEditing = editingId === q.id;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                  isEditing ? 'border-sky-300 ring-2 ring-sky-500/20' : 'border-slate-200'
                }`}
              >
                <div className="p-5">
                  {/* Meta */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Tag className="w-3 h-3" />
                      {q.categories?.name}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(q.created_at)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 ml-auto">
                      <CheckCircle className="w-3 h-3" />
                      Опубликовано
                    </span>
                  </div>

                  {/* Question */}
                  <p className="text-slate-800 font-semibold text-base mb-1 leading-snug">
                    {q.question_text}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mb-4">
                    <User className="w-3 h-3" />
                    {q.author_name}
                    {q.author_email && <span className="ml-1">&mdash; {q.author_email}</span>}
                  </p>

                  {/* Answer display (always visible when not editing) */}
                  {!isEditing && (
                    <>
                      {answer ? (
                        <div className="rounded-xl overflow-hidden border border-amber-200/70 mb-4">
                          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-white" />
                            <span className="text-xs font-semibold text-white">Ответ администрации</span>
                            {answer.published_at && (
                              <span className="text-xs text-amber-100 ml-auto opacity-90">
                                {formatDate(answer.published_at)}
                              </span>
                            )}
                          </div>
                          <div className="bg-amber-50/40 px-4 py-3">
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {answer.answer_text}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 mb-4 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <p className="text-sm text-slate-400">Ответ ещё не добавлен</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => openEdit(q)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleUnpublish(q)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Снять с публикации
                        </button>
                        <button
                          onClick={() => handleDelete(q)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Удалить
                        </button>
                      </div>
                    </>
                  )}

                  {/* Edit form — shown inline when editing */}
                  {isEditing && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Категория</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Текст ответа
                          {answer?.updated_at && (
                            <span className="ml-2 font-normal text-slate-400">
                              (последнее обновление: {formatDate(answer.updated_at)})
                            </span>
                          )}
                        </label>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={7}
                          placeholder="Введите ответ..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all resize-y text-sm leading-relaxed"
                          autoFocus
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSave(q)}
                          disabled={saving || !editText.trim()}
                          className="flex items-center gap-1.5 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          {saving ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                          Сохранить изменения
                        </button>
                        <button
                          onClick={closeEdit}
                          disabled={saving}
                          className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
