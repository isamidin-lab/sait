import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import type { Category } from '../../lib/types';
import Spinner from '../../components/Spinner';
import { Tags, Plus, Trash2, CreditCard as Edit3, Save } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    sortOrder: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    if (data) setCategories(data);
    setLoading(false);
  };

  const generateSlug = (name: string) => {
    const map: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    };
    return name
      .toLowerCase()
      .split('')
      .map((c) => map[c] || c)
      .join('')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    const slug = form.slug.trim() || generateSlug(form.name);
    const { error } = await supabase.from('categories').insert({
      name: form.name.trim(),
      slug,
      description: form.description.trim(),
      sort_order: form.sortOrder,
    });

    if (error) {
      addToast('error', error.code === '23505' ? 'Категория с таким slug уже существует' : 'Ошибка при добавлении категории');
      setSaving(false);
      return;
    }

    addToast('success', 'Категория добавлена');
    setShowForm(false);
    setForm({ name: '', slug: '', description: '', sortOrder: 0 });
    setSaving(false);
    fetchCategories();
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      sortOrder: cat.sort_order,
    });
  };

  const handleUpdate = async () => {
    if (!editingId || !form.name.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from('categories')
      .update({
        name: form.name.trim(),
        slug: form.slug.trim() || generateSlug(form.name),
        description: form.description.trim(),
        sort_order: form.sortOrder,
      })
      .eq('id', editingId);

    if (error) {
      addToast('error', 'Ошибка при обновлении категории');
      setSaving(false);
      return;
    }

    addToast('success', 'Категория обновлена');
    setEditingId(null);
    setForm({ name: '', slug: '', description: '', sortOrder: 0 });
    setSaving(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      addToast('error', 'Невозможно удалить категорию, содержащую вопросы');
      return;
    }
    addToast('info', 'Категория удалена');
    fetchCategories();
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
          <Tags className="w-6 h-6 text-emerald-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Управление категориями</h1>
            <p className="text-sm text-slate-500">{categories.length} категорий</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm({ name: '', slug: '', description: '', sortOrder: 0 });
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Новая категория</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Название</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Название категории"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Slug (URL)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="Автоматически из названия"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Описание</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Краткое описание"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Порядок сортировки</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleAdd}
              disabled={saving || !form.name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              Сохранить
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            {editingId === cat.id ? (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {saving ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    Сохранить
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setForm({ name: '', slug: '', description: '', sortOrder: 0 }); }}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{cat.name}</p>
                  <p className="text-xs text-slate-400">/{cat.slug} — {cat.description || 'Без описания'} — порядок: {cat.sort_order}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
