import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import type { Question, Category } from '../../lib/types';
import Spinner from '../../components/Spinner';
import { Archive, Tag, CreditCard as Edit3, Save, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

export default function ArchivePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { addToast } = useToast();

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
    if (data) setQuestions(data as unknown as Question[]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    if (data) setCategories(data);
  };

  const handleEditAnswer = (question: Question) => {
    const answer = question.answers?.[0];
    if (!answer) return;
    setEditingAnswer(question.id);
    setEditText(answer.answer_text);
    setEditCategory(question.category_id);
  };

  const handleSaveAnswer = async (questionId: string) => {
    setSaving(true);
    const question = questions.find((q) => q.id === questionId);
    const answer = question?.answers?.[0];
    if (!answer) return;

    const { error: answerError } = await supabase
      .from('answers')
      .update({
        answer_text: editText.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', answer.id);

    if (answerError) {
      addToast('error', 'Ошибка при сохранении ответа');
      setSaving(false);
      return;
    }

    if (editCategory !== question?.category_id) {
      const { error: catError } = await supabase
        .from('questions')
        .update({ category_id: editCategory })
        .eq('id', questionId);

      if (catError) {
        addToast('error', 'Ошибка при изменении категории');
        setSaving(false);
        return;
      }
    }

    addToast('success', 'Ответ обновлен');
    setEditingAnswer(null);
    setSaving(false);
    fetchQuestions();
  };

  const handleUnpublish = async (questionId: string) => {
    const { error: answerDelError } = await supabase
      .from('answers')
      .delete()
      .eq('question_id', questionId);

    if (answerDelError) {
      addToast('error', 'Ошибка при снятии с публикации');
      return;
    }

    const { error } = await supabase
      .from('questions')
      .update({ status: 'pending' })
      .eq('id', questionId);

    if (error) {
      addToast('error', 'Ошибка при обновлении статуса');
      return;
    }

    addToast('info', 'Вопрос возвращен в новые');
    fetchQuestions();
  };

  const handleDelete = async (questionId: string) => {
    await supabase.from('answers').delete().eq('question_id', questionId);
    const { error } = await supabase.from('questions').delete().eq('id', questionId);
    if (error) {
      addToast('error', 'Ошибка при удалении');
      return;
    }
    addToast('info', 'Вопрос удален');
    fetchQuestions();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

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
            const isEditing = editingAnswer === q.id;
            const isExpanded = expanded === q.id;

            return (
              <div key={q.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Tag className="w-3 h-3" />
                      {q.categories?.name}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(q.created_at)}</span>
                  </div>

                  <p className="text-slate-800 font-medium mb-2">{q.question_text}</p>

                  {answer && !isEditing && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : q.id)}
                        className="flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors mb-2"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {isExpanded ? 'Свернуть ответ' : 'Показать ответ'}
                      </button>
                      {isExpanded && (
                        <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {answer.answer_text}
                        </div>
                      )}
                    </div>
                  )}

                  {isEditing && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Категория:</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ответ:</label>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={6}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-y"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveAnswer(q.id)}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {saving ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                          Сохранить
                        </button>
                        <button
                          onClick={() => setEditingAnswer(null)}
                          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => handleEditAnswer(q)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleUnpublish(q.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Снять с публикации
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить
                      </button>
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
