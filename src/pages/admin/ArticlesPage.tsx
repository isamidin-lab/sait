import { useState, useEffect } from 'react';
import {
  collection, query, getDocs, doc, addDoc, updateDoc, deleteDoc,
  orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../../contexts/ToastContext';
import Spinner from '../../components/Spinner';
import {
  FileText, Plus, Trash2, Save, X, CreditCard as Edit3,
  Eye, EyeOff, Image, Video, BookOpen, Headphones, Bold, Italic, Heading2, List,
} from 'lucide-react';

const CATEGORIES = [
  'Акыда',
  'Фикх',
  'Коран и тафсир',
  'История ислама',
  'Нравственность и воспитание',
  'Другое',
];

interface FireArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  file_url: string | null;
  status: 'draft' | 'published';
  views: number;
  likes: number;
  created_at: { seconds: number } | null;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<FireArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const [form, setForm] = useState({
    title: '',
    category: CATEGORIES[0],
    content: '',
    imageUrl: '',
    videoUrl: '',
    audioUrl: '',
    fileUrl: '',
    status: 'published' as 'draft' | 'published',
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const q = query(collection(db, 'articles'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      setArticles(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FireArticle)));
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', category: CATEGORIES[0], content: '', imageUrl: '', videoUrl: '', audioUrl: '', fileUrl: '', status: 'published' });
    setEditingId(null);
    setShowForm(false);
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('article-content') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.content.substring(start, end);
    const newContent = form.content.substring(0, start) + prefix + selected + suffix + form.content.substring(end);
    setForm({ ...form, content: newContent });
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = start + prefix.length + selected.length;
    }, 0);
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.category) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'articles'), {
        title: form.title.trim(),
        category: form.category,
        content: form.content.trim(),
        image_url: form.imageUrl.trim() || null,
        video_url: form.videoUrl.trim() || null,
        audio_url: form.audioUrl.trim() || null,
        file_url: form.fileUrl.trim() || null,
        status: form.status,
        views: 0,
        likes: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      addToast('success', 'Статья опубликована');
      resetForm();
      fetchArticles();
    } catch {
      addToast('error', 'Ошибка при добавлении статьи');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (article: FireArticle) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      category: article.category,
      content: article.content,
      imageUrl: article.image_url || '',
      videoUrl: article.video_url || '',
      audioUrl: article.audio_url || '',
      fileUrl: article.file_url || '',
      status: article.status,
    });
    setShowForm(true);
  };

  const handleUpdate = async () => {
    if (!editingId || !form.title.trim() || !form.category) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'articles', editingId), {
        title: form.title.trim(),
        category: form.category,
        content: form.content.trim(),
        image_url: form.imageUrl.trim() || null,
        video_url: form.videoUrl.trim() || null,
        audio_url: form.audioUrl.trim() || null,
        file_url: form.fileUrl.trim() || null,
        status: form.status,
        updated_at: serverTimestamp(),
      });
      addToast('success', 'Статья обновлена');
      resetForm();
      fetchArticles();
    } catch {
      addToast('error', 'Ошибка при обновлении статьи');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'articles', id));
      addToast('info', 'Статья удалена');
      fetchArticles();
    } catch {
      addToast('error', 'Ошибка при удалении статьи');
    }
  };

  const handleToggleStatus = async (article: FireArticle) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      await updateDoc(doc(db, 'articles', article.id), { status: newStatus, updated_at: serverTimestamp() });
      addToast('success', newStatus === 'published' ? 'Статья опубликована' : 'Статья скрыта');
      fetchArticles();
    } catch {
      addToast('error', 'Ошибка при изменении статуса');
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-emerald-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Статьи</h1>
            <p className="text-sm text-slate-500">{articles.length} статей</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (showForm && editingId) { resetForm(); }
            else { setShowForm(!showForm); setEditingId(null); setForm({ title: '', category: CATEGORIES[0], content: '', imageUrl: '', videoUrl: '', audioUrl: '', fileUrl: '', status: 'published' }); }
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm && !editingId ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm && !editingId ? 'Отмена' : 'Добавить статью'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            {editingId ? 'Редактировать статью' : 'Новая статья'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Заголовок</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Заголовок статьи"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Категория</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Текст статьи (поддержка Markdown)</label>
              <div className="flex items-center gap-1 mb-1.5 p-1 bg-slate-50 rounded-lg border border-slate-200">
                <button type="button" onClick={() => insertMarkdown('## ', '')} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors" title="Заголовок">
                  <Heading2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => insertMarkdown('**', '**')} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors" title="Жирный">
                  <Bold className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => insertMarkdown('*', '*')} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors" title="Курсив">
                  <Italic className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => insertMarkdown('- ', '')} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors" title="Список">
                  <List className="w-4 h-4" />
                </button>
              </div>
              <textarea
                id="article-content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={10}
                placeholder={"## Заголовок\n\nТекст абзаца...\n\n**Жирный текст**\n*Курсив*\n- Элемент списка"}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-y font-mono"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-slate-600 mb-1">
                  <Image className="w-3 h-3" />
                  Изображение (URL)
                </label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-slate-600 mb-1">
                  <Video className="w-3 h-3" />
                  Ссылка на видео (YouTube)
                </label>
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-slate-600 mb-1">
                  <Headphones className="w-3 h-3" />
                  Аудио (URL MP3)
                </label>
                <input
                  type="url"
                  value={form.audioUrl}
                  onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-slate-600 mb-1">
                  <BookOpen className="w-3 h-3" />
                  Документ (URL PDF)
                </label>
                <input
                  type="url"
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.status === 'published'}
                  onChange={(e) => setForm({ ...form, status: e.target.checked ? 'published' : 'draft' })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
              <span className="text-sm text-slate-600">Опубликовать сразу</span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                disabled={saving || !form.title.trim() || !form.category}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {editingId ? 'Сохранить изменения' : 'Опубликовать'}
              </button>
              <button onClick={resetForm} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {articles.map((article) => (
          <div key={article.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-start gap-3">
              {article.image_url ? (
                <img src={article.image_url} alt={article.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 truncate">{article.title}</p>
                  {article.status === 'draft' && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Черновик</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-xs text-emerald-600 font-medium">{article.category}</span>
                  <span className="text-xs text-slate-400">{formatDate(article.created_at)}</span>
                  <span className="text-xs text-slate-400">{article.views} просм.</span>
                  <span className="text-xs text-slate-400">{article.likes} лайков</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {article.video_url && (
                    <span className="inline-flex items-center gap-1 text-xs text-sky-500"><Video className="w-3 h-3" />Видео</span>
                  )}
                  {article.audio_url && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-500"><Headphones className="w-3 h-3" />Аудио</span>
                  )}
                  {article.file_url && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-500"><BookOpen className="w-3 h-3" />Документ</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleStatus(article)}
                  className={`p-2 rounded-lg transition-colors ${article.status === 'published' ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}
                  title={article.status === 'published' ? 'Скрыть' : 'Опубликовать'}
                >
                  {article.status === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleEdit(article)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Редактировать">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(article.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Удалить">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {articles.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Нет статей</p>
          </div>
        )}
      </div>
    </div>
  );
}
