import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import type { Article, Category } from '../../lib/types';
import Spinner from '../../components/Spinner';
import { FileText, Plus, Trash2, Save, X, CreditCard as Edit3, Eye, EyeOff, Image, Video, BookOpen, Headphones, Upload, Bold, Italic, Heading2, List } from 'lucide-react';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const { user } = useAuth();
  const { addToast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    categoryId: '',
    content: '',
    imageUrl: '',
    videoUrl: '',
    audioUrl: '',
    fileUrl: '',
    status: 'published' as 'draft' | 'published',
  });

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*, categories(*)')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    if (data) setArticles(data as Article[]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    if (data) setCategories(data.filter((c) => c.slug !== 'general'));
  };

  const resetForm = () => {
    setForm({ title: '', categoryId: '', content: '', imageUrl: '', videoUrl: '', audioUrl: '', fileUrl: '', status: 'published' });
    setEditingId(null);
    setShowForm(false);
  };

  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      addToast('error', `Ошибка загрузки файла: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('image');
    const url = await uploadFile(file, 'articles', 'images');
    if (url) {
      setForm((prev) => ({ ...prev, imageUrl: url }));
      addToast('success', 'Изображение загружено');
    }
    setUploading(null);
    e.target.value = '';
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('audio');
    const url = await uploadFile(file, 'articles', 'audio');
    if (url) {
      setForm((prev) => ({ ...prev, audioUrl: url }));
      addToast('success', 'Аудиофайл загружен');
    }
    setUploading(null);
    e.target.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('file');
    const url = await uploadFile(file, 'articles', 'documents');
    if (url) {
      setForm((prev) => ({ ...prev, fileUrl: url }));
      addToast('success', 'Документ загружен');
    }
    setUploading(null);
    e.target.value = '';
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('article-content') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.content.substring(start, end);
    const before = form.content.substring(0, start);
    const after = form.content.substring(end);
    const newContent = before + prefix + selected + suffix + after;
    setForm({ ...form, content: newContent });
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = start + prefix.length + selected.length;
    }, 0);
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.categoryId) return;
    setSaving(true);

    const { error } = await supabase.from('articles').insert({
      title: form.title.trim(),
      category_id: form.categoryId,
      content: form.content.trim(),
      image_url: form.imageUrl.trim() || null,
      video_url: form.videoUrl.trim() || null,
      audio_url: form.audioUrl.trim() || null,
      file_url: form.fileUrl.trim() || null,
      status: form.status,
      admin_id: user?.id,
    });

    if (error) {
      addToast('error', 'Ошибка при добавлении статьи');
      setSaving(false);
      return;
    }

    addToast('success', 'Статья опубликована');
    resetForm();
    setSaving(false);
    fetchArticles();
  };

  const handleEdit = (article: Article) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      categoryId: article.category_id,
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
    if (!editingId || !form.title.trim() || !form.categoryId) return;
    setSaving(true);

    const { error } = await supabase
      .from('articles')
      .update({
        title: form.title.trim(),
        category_id: form.categoryId,
        content: form.content.trim(),
        image_url: form.imageUrl.trim() || null,
        video_url: form.videoUrl.trim() || null,
        audio_url: form.audioUrl.trim() || null,
        file_url: form.fileUrl.trim() || null,
        status: form.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingId);

    if (error) {
      addToast('error', 'Ошибка при обновлении статьи');
      setSaving(false);
      return;
    }

    addToast('success', 'Статья обновлена');
    resetForm();
    setSaving(false);
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) {
      addToast('error', 'Ошибка при удалении статьи');
      return;
    }
    addToast('info', 'Статья удалена');
    fetchArticles();
  };

  const handleToggleStatus = async (article: Article) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('articles')
      .update({ status: newStatus })
      .eq('id', article.id);

    if (error) {
      addToast('error', 'Ошибка при изменении статуса');
      return;
    }
    addToast('success', newStatus === 'published' ? 'Статья опубликована' : 'Статья скрыта');
    fetchArticles();
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
            if (showForm && editingId) {
              resetForm();
            } else {
              setShowForm(!showForm);
              setEditingId(null);
              setForm({ title: '', categoryId: '', content: '', imageUrl: '', videoUrl: '', audioUrl: '', fileUrl: '', status: 'published' });
            }
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
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
              >
                <option value="">Выберите категорию</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Текст статьи (поддержка Markdown)</label>
              <div className="flex items-center gap-1 mb-1.5 p-1 bg-slate-50 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => insertMarkdown('## ', '')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
                  title="Заголовок"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('**', '**')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
                  title="Жирный"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('*', '*')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
                  title="Курсив"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('- ', '')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
                  title="Список"
                >
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
                  Изображение
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://... или загрузите файл"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading === 'image'}
                    className="shrink-0 flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploading === 'image' ? <Spinner className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                    Файл
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
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
                  Аудио (MP3)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.audioUrl}
                    onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                    placeholder="https://... или загрузите файл"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    disabled={uploading === 'audio'}
                    className="shrink-0 flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploading === 'audio' ? <Spinner className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                    Файл
                  </button>
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-slate-600 mb-1">
                  <BookOpen className="w-3 h-3" />
                  Документ (PDF)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.fileUrl}
                    onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                    placeholder="https://... или загрузите файл"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading === 'file'}
                    className="shrink-0 flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploading === 'file' ? <Spinner className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                    Файл
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
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
                disabled={saving || !form.title.trim() || !form.categoryId}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {editingId ? 'Сохранить изменения' : 'Опубликовать'}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
              >
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
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
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
                  <span className="text-xs text-emerald-600 font-medium">{article.categories?.name}</span>
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
                  className={`p-2 rounded-lg transition-colors ${
                    article.status === 'published'
                      ? 'text-emerald-500 hover:bg-emerald-50'
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                  title={article.status === 'published' ? 'Скрыть' : 'Опубликовать'}
                >
                  {article.status === 'published' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleEdit(article)}
                  className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(article.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Удалить"
                >
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
