import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import type { Product } from '../../lib/types';
import Spinner from '../../components/Spinner';
import { GraduationCap, Plus, Trash2, CreditCard as Edit3, Save, ExternalLink, X, Eye, EyeOff } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    actionUrl: '',
    actionLabel: 'Узнать подробнее',
    imageUrl: '',
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('sort_order');
    if (data) setProducts(data);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      title: '', description: '', price: '', actionUrl: '',
      actionLabel: 'Узнать подробнее', imageUrl: '', sortOrder: 0, isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.price.trim()) return;
    setSaving(true);

    const { error } = await supabase.from('products').insert({
      title: form.title.trim(),
      description: form.description.trim(),
      price: form.price.trim(),
      action_url: form.actionUrl.trim(),
      action_label: form.actionLabel.trim() || 'Узнать подробнее',
      image_url: form.imageUrl.trim() || null,
      sort_order: form.sortOrder,
      is_active: form.isActive,
    });

    if (error) {
      addToast('error', 'Ошибка при добавлении продукта');
      setSaving(false);
      return;
    }

    addToast('success', 'Продукт добавлен');
    resetForm();
    setSaving(false);
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      title: product.title,
      description: product.description,
      price: product.price,
      actionUrl: product.action_url,
      actionLabel: product.action_label,
      imageUrl: product.image_url || '',
      sortOrder: product.sort_order,
      isActive: product.is_active,
    });
    setShowForm(true);
  };

  const handleUpdate = async () => {
    if (!editingId || !form.title.trim() || !form.price.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from('products')
      .update({
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price.trim(),
        action_url: form.actionUrl.trim(),
        action_label: form.actionLabel.trim() || 'Узнать подробнее',
        image_url: form.imageUrl.trim() || null,
        sort_order: form.sortOrder,
        is_active: form.isActive,
      })
      .eq('id', editingId);

    if (error) {
      addToast('error', 'Ошибка при обновлении продукта');
      setSaving(false);
      return;
    }

    addToast('success', 'Продукт обновлен');
    resetForm();
    setSaving(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      addToast('error', 'Ошибка при удалении продукта');
      return;
    }
    addToast('info', 'Продукт удален');
    fetchProducts();
  };

  const handleToggleActive = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);

    if (error) {
      addToast('error', 'Ошибка при изменении видимости');
      return;
    }

    addToast('success', product.is_active ? 'Продукт скрыт' : 'Продукт опубликован');
    fetchProducts();
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
          <GraduationCap className="w-6 h-6 text-amber-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Курсы и продукты</h1>
            <p className="text-sm text-slate-500">{products.length} продуктов</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (showForm && editingId) {
              resetForm();
            } else {
              setShowForm(!showForm);
              setEditingId(null);
              setForm({
                title: '', description: '', price: '', actionUrl: '',
                actionLabel: 'Узнать подробнее', imageUrl: '', sortOrder: 0, isActive: true,
              });
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm && !editingId ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm && !editingId ? 'Отмена' : 'Добавить'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            {editingId ? 'Редактировать продукт' : 'Новый продукт'}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Название</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Интенсив по арабскому языку"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Цена</label>
              <input
                type="text"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="5 000 ₽ или Бесплатно"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Описание</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Описание курса или продукта"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-y"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ссылка кнопки (Telegram и т.д.)</label>
              <input
                type="url"
                value={form.actionUrl}
                onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                placeholder="https://t.me/your_channel"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Текст кнопки</label>
              <input
                type="text"
                value={form.actionLabel}
                onChange={(e) => setForm({ ...form, actionLabel: e.target.value })}
                placeholder="Записаться / Узнать подробнее"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">URL обложки</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://images.pexels.com/..."
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
            <div className="flex items-center gap-2 sm:col-span-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
              <span className="text-sm text-slate-600">Опубликован на главной</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={saving || !form.title.trim() || !form.price.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Сохранить изменения' : 'Добавить продукт'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-start gap-3">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6 text-amber-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800 truncate">{product.title}</p>
                  {!product.is_active && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Скрыт</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-emerald-700">{product.price}</p>
                {product.description && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{product.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleActive(product)}
                  className={`p-2 rounded-lg transition-colors ${
                    product.is_active
                      ? 'text-emerald-500 hover:bg-emerald-50'
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                  title={product.is_active ? 'Скрыть' : 'Опубликовать'}
                >
                  {product.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                {product.action_url && (
                  <a
                    href={product.action_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
                    title="Открыть ссылку"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => handleEdit(product)}
                  className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}