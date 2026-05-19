import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import type { Question } from '../../lib/types';
import Spinner from '../../components/Spinner';
import { Clock, Tag, User, Send, Trash2, X } from 'lucide-react';

export default function PendingQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('*, categories(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    if (data) setQuestions(data as unknown as Question[]);
    setLoading(false);
  };

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;
    setSubmitting(true);

    // Get fresh session to guarantee JWT is active and admin_id is current
    const { data: { session } } = await supabase.auth.getSession();
    const adminId = session?.user?.id;

    if (!adminId) {
      addToast('error', 'Сессия истекла. Пожалуйста, войдите снова.');
      setSubmitting(false);
      return;
    }

    const { data: existing } = await supabase
      .from('answers')
      .select('id')
      .eq('question_id', questionId)
      .maybeSingle();

    let answerError;
    if (existing) {
      ({ error: answerError } = await supabase
        .from('answers')
        .update({
          answer_text: answerText.trim(),
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id));
    } else {
      ({ error: answerError } = await supabase.from('answers').insert({
        question_id: questionId,
        admin_id: adminId,
        answer_text: answerText.trim(),
        published_at: new Date().toISOString(),
      }));
    }

    if (answerError) {
      addToast('error', `Ошибка при отправке ответа: ${answerError.message}`);
      setSubmitting(false);
      return;
    }

    const { error: statusError } = await supabase
      .from('questions')
      .update({ status: 'published' })
      .eq('id', questionId);

    if (statusError) {
      addToast('error', `Ошибка при обновлении статуса: ${statusError.message}`);
      setSubmitting(false);
      return;
    }

    addToast('success', 'Ответ опубликован');
    setAnsweringId(null);
    setAnswerText('');
    setSubmitting(false);
    fetchQuestions();
  };

  const handleReject = async (questionId: string) => {
    const { error } = await supabase
      .from('questions')
      .update({ status: 'rejected' })
      .eq('id', questionId);

    if (error) {
      addToast('error', 'Ошибка при отклонении вопроса');
      return;
    }

    addToast('info', 'Вопрос отклонен');
    fetchQuestions();
  };

  const handleDelete = async (questionId: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', questionId);
    if (error) {
      addToast('error', 'Ошибка при удалении вопроса');
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
      hour: '2-digit',
      minute: '2-digit',
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
        <Clock className="w-6 h-6 text-amber-500" />
        <div>
          <h1 className="text-xl font-bold text-slate-800">Новые вопросы</h1>
          <p className="text-sm text-slate-500">{questions.length} вопросов на рассмотрении</p>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Нет новых вопросов</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <Tag className="w-3 h-3" />
                    {q.categories?.name || 'Без категории'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(q.created_at)}
                  </span>
                </div>

                <p className="text-slate-800 font-medium mb-2">{q.question_text}</p>

                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {q.author_name}
                  </span>
                  {q.author_email && (
                    <span className="text-xs text-slate-400">{q.author_email}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => {
                      setAnsweringId(answeringId === q.id ? null : q.id);
                      setAnswerText('');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Ответить
                  </button>
                  <button
                    onClick={() => handleReject(q.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Отклонить
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </button>
                </div>
              </div>

              {answeringId === q.id && (
                <div className="border-t border-slate-100 bg-slate-50 p-5">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Напишите ответ:
                  </label>
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    rows={6}
                    placeholder="Введите подробный ответ на вопрос..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-y"
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleAnswer(q.id)}
                      disabled={submitting || !answerText.trim()}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      {submitting ? <Spinner className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                      Опубликовать ответ
                    </button>
                    <button
                      onClick={() => { setAnsweringId(null); setAnswerText(''); }}
                      className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
