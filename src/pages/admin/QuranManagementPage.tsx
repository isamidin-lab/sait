import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import type { QuranTafsir, QuranAyahTafsir, QuranAyahMedia } from '../../lib/types';
import Spinner from '../../components/Spinner';
import {
  BookOpen,
  Search,
  Upload,
  Save,
  Trash2,
  Headphones,
  MessageSquare,
  X,
  BookMarked,
  FileText,
  Video,
  Plus,
} from 'lucide-react';

interface Surah {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
}

type AdminTab = 'surah' | 'ayah';

export default function QuranManagementPage() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [tafsirMap, setTafsirMap] = useState<Record<number, QuranTafsir>>({});
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSurah, setEditingSurah] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [surahForm, setSurahForm] = useState({ audioUrl: '', notes: '' });
  const audioInputRef = useRef<HTMLInputElement>(null);
  const ayahAudioInputRef = useRef<HTMLInputElement>(null);

  // Ayah-level tafsir state
  const [activeTab, setActiveTab] = useState<AdminTab>('surah');
  const [ayahSurahNumber, setAyahSurahNumber] = useState('');
  const [ayahNumber, setAyahNumber] = useState('');
  const [ayahTafsirList, setAyahTafsirList] = useState<QuranAyahTafsir[]>([]);
  const [ayahMediaList, setAyahMediaList] = useState<QuranAyahMedia[]>([]);
  const [loadingAyah, setLoadingAyah] = useState(false);
  const [ayahTafsirForm, setAyahTafsirForm] = useState({ scholarName: '', commentary: '', audioUrl: '' });
  const [ayahMediaForm, setAyahMediaForm] = useState({ mediaType: 'article' as 'article' | 'audio' | 'video', title: '', url: '' });
  const [savingAyah, setSavingAyah] = useState(false);
  const [uploadingAyah, setUploadingAyah] = useState(false);
  const [editingTafsirId, setEditingTafsirId] = useState<string | null>(null);
  const [showTafsirForm, setShowTafsirForm] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);

  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    fetchSurahs();
    fetchSurahTafsir();
  }, []);

  const fetchSurahs = async () => {
    try {
      const res = await fetch('https://api.alquran.cloud/v1/surah');
      const data = await res.json();
      if (data.status === 'OK') setSurahs(data.data);
    } catch {
      addToast('error', 'Не удалось загрузить список сур');
    }
    setLoadingSurahs(false);
  };

  const fetchSurahTafsir = async () => {
    const { data } = await supabase.from('quran_tafsir').select('*');
    if (data) {
      const map: Record<number, QuranTafsir> = {};
      data.forEach((t: QuranTafsir) => { map[t.surah_number] = t; });
      setTafsirMap(map);
    }
  };

  // ─── SURAH TAFSIR ────────────────────────────────────────────
  const openSurahEditor = (surahNumber: number) => {
    const existing = tafsirMap[surahNumber];
    setSurahForm({ audioUrl: existing?.audio_url || '', notes: existing?.notes || '' });
    setEditingSurah(surahNumber);
  };

  const closeSurahEditor = () => {
    setEditingSurah(null);
    setSurahForm({ audioUrl: '', notes: '' });
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `tafsir/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('articles').upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) { addToast('error', `Ошибка загрузки: ${error.message}`); setUploading(false); e.target.value = ''; return; }
    const { data: urlData } = supabase.storage.from('articles').getPublicUrl(fileName);
    setSurahForm((prev) => ({ ...prev, audioUrl: urlData.publicUrl }));
    addToast('success', 'Аудио загружено');
    setUploading(false);
    e.target.value = '';
  };

  const handleSaveSurah = async () => {
    if (!editingSurah) return;
    setSaving(true);
    const surahName = surahs.find((s) => s.number === editingSurah)?.name || '';
    const existing = tafsirMap[editingSurah];
    const payload = {
      surah_number: editingSurah,
      surah_name: surahName,
      audio_url: surahForm.audioUrl.trim() || null,
      notes: surahForm.notes.trim() || null,
      admin_id: user?.id,
      updated_at: new Date().toISOString(),
    };
    let error;
    if (existing) {
      ({ error } = await supabase.from('quran_tafsir').update(payload).eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('quran_tafsir').insert(payload));
    }
    if (error) { addToast('error', 'Ошибка при сохранении'); setSaving(false); return; }
    addToast('success', 'Тафсир суры сохранён');
    await fetchSurahTafsir();
    closeSurahEditor();
    setSaving(false);
  };

  const handleDeleteSurah = async (surahNumber: number) => {
    const existing = tafsirMap[surahNumber];
    if (!existing) return;
    const { error } = await supabase.from('quran_tafsir').delete().eq('id', existing.id);
    if (error) { addToast('error', 'Ошибка при удалении'); return; }
    addToast('info', 'Тафсир суры удалён');
    await fetchSurahTafsir();
    if (editingSurah === surahNumber) closeSurahEditor();
  };

  // ─── AYAH TAFSIR ─────────────────────────────────────────────
  const fetchAyahData = async () => {
    const sn = parseInt(ayahSurahNumber);
    const an = parseInt(ayahNumber);
    if (!sn || !an) return;
    setLoadingAyah(true);
    const [tafsirRes, mediaRes] = await Promise.all([
      supabase.from('quran_ayah_tafsir').select('*').eq('surah_number', sn).eq('ayah_number', an).order('created_at'),
      supabase.from('quran_ayah_media').select('*').eq('surah_number', sn).eq('ayah_number', an).order('created_at'),
    ]);
    if (tafsirRes.data) setAyahTafsirList(tafsirRes.data);
    if (mediaRes.data) setAyahMediaList(mediaRes.data);
    setLoadingAyah(false);
  };

  const handleAyahAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAyah(true);
    const ext = file.name.split('.').pop();
    const fileName = `tafsir/ayah-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('articles').upload(fileName, file, { upsert: false });
    if (error) { addToast('error', 'Ошибка загрузки'); setUploadingAyah(false); e.target.value = ''; return; }
    const { data: urlData } = supabase.storage.from('articles').getPublicUrl(fileName);
    setAyahTafsirForm((prev) => ({ ...prev, audioUrl: urlData.publicUrl }));
    addToast('success', 'Аудио загружено');
    setUploadingAyah(false);
    e.target.value = '';
  };

  const handleSaveAyahTafsir = async () => {
    const sn = parseInt(ayahSurahNumber);
    const an = parseInt(ayahNumber);
    if (!sn || !an || !ayahTafsirForm.scholarName.trim() || !ayahTafsirForm.commentary.trim()) return;
    setSavingAyah(true);
    const payload = {
      surah_number: sn,
      ayah_number: an,
      scholar_name: ayahTafsirForm.scholarName.trim(),
      commentary: ayahTafsirForm.commentary.trim(),
      audio_url: ayahTafsirForm.audioUrl.trim() || null,
      admin_id: user?.id,
      updated_at: new Date().toISOString(),
    };
    let error;
    if (editingTafsirId) {
      ({ error } = await supabase.from('quran_ayah_tafsir').update(payload).eq('id', editingTafsirId));
    } else {
      ({ error } = await supabase.from('quran_ayah_tafsir').insert(payload));
    }
    if (error) { addToast('error', 'Ошибка при сохранении'); setSavingAyah(false); return; }
    addToast('success', 'Тафсир аята сохранён');
    setAyahTafsirForm({ scholarName: '', commentary: '', audioUrl: '' });
    setEditingTafsirId(null);
    setShowTafsirForm(false);
    await fetchAyahData();
    setSavingAyah(false);
  };

  const handleDeleteAyahTafsir = async (id: string) => {
    const { error } = await supabase.from('quran_ayah_tafsir').delete().eq('id', id);
    if (error) { addToast('error', 'Ошибка при удалении'); return; }
    addToast('info', 'Тафсир аята удалён');
    await fetchAyahData();
  };

  const handleSaveAyahMedia = async () => {
    const sn = parseInt(ayahSurahNumber);
    const an = parseInt(ayahNumber);
    if (!sn || !an || !ayahMediaForm.title.trim() || !ayahMediaForm.url.trim()) return;
    setSavingAyah(true);
    const { error } = await supabase.from('quran_ayah_media').insert({
      surah_number: sn,
      ayah_number: an,
      media_type: ayahMediaForm.mediaType,
      title: ayahMediaForm.title.trim(),
      url: ayahMediaForm.url.trim(),
      admin_id: user?.id,
    });
    if (error) { addToast('error', 'Ошибка при сохранении'); setSavingAyah(false); return; }
    addToast('success', 'Медиа-ссылка добавлена');
    setAyahMediaForm({ mediaType: 'article', title: '', url: '' });
    setShowMediaForm(false);
    await fetchAyahData();
    setSavingAyah(false);
  };

  const handleDeleteAyahMedia = async (id: string) => {
    const { error } = await supabase.from('quran_ayah_media').delete().eq('id', id);
    if (error) { addToast('error', 'Ошибка при удалении'); return; }
    addToast('info', 'Медиа-ссылка удалена');
    await fetchAyahData();
  };

  const filteredSurahs = surahs.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.englishName.toLowerCase().includes(q) ||
      s.name.includes(searchQuery) ||
      s.number.toString() === searchQuery
    );
  });

  const tafsirCount = Object.keys(tafsirMap).length;

  if (loadingSurahs) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="w-8 h-8 text-emerald-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-emerald-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-800">Управление Кораном</h1>
          <p className="text-sm text-slate-500">{tafsirCount} из 114 сур имеют тафсир уровня суры</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab('surah')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'surah' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Тафсир по суре
        </button>
        <button
          onClick={() => setActiveTab('ayah')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'ayah' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Тафсир по аяту
        </button>
      </div>

      {/* ── SURAH TAB ── */}
      {activeTab === 'surah' && (
        <>
          {/* Surah editor */}
          {editingSurah !== null && (
            <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">
                  Тафсир суры {editingSurah} — {surahs.find((s) => s.number === editingSurah)?.englishName}
                  <span className="ml-2 font-arabic text-emerald-600">{surahs.find((s) => s.number === editingSurah)?.name}</span>
                </h3>
                <button onClick={closeSurahEditor} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1">
                    <Headphones className="w-3.5 h-3.5" />Аудио тафсир (MP3)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={surahForm.audioUrl}
                      onChange={(e) => setSurahForm((p) => ({ ...p, audioUrl: e.target.value }))}
                      placeholder="https://... или загрузите файл"
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      disabled={uploading}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {uploading ? <Spinner className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                      Загрузить
                    </button>
                    <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                  </div>
                  {surahForm.audioUrl && <audio controls src={surahForm.audioUrl} className="w-full h-10 mt-2" preload="metadata" />}
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1">
                    <MessageSquare className="w-3.5 h-3.5" />Текстовые примечания
                  </label>
                  <textarea
                    value={surahForm.notes}
                    onChange={(e) => setSurahForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={3}
                    placeholder="Краткий комментарий к суре…"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-y"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveSurah}
                    disabled={saving || (!surahForm.audioUrl.trim() && !surahForm.notes.trim())}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {saving ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}Сохранить
                  </button>
                  {tafsirMap[editingSurah] && (
                    <button onClick={() => handleDeleteSurah(editingSurah)} className="flex items-center gap-1.5 px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />Удалить тафсир
                    </button>
                  )}
                  <button onClick={closeSurahEditor} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">Отмена</button>
                </div>
              </div>
            </div>
          )}

          {/* Surah search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск суры по номеру или названию…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            {filteredSurahs.map((surah) => {
              const tafsir = tafsirMap[surah.number];
              const isEditing = editingSurah === surah.number;
              return (
                <div
                  key={surah.number}
                  className={`bg-white rounded-xl border shadow-sm p-3.5 transition-all ${
                    isEditing ? 'border-emerald-300 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0">
                      {surah.number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-800 text-sm">{surah.englishName}</span>
                        <span className="font-arabic text-emerald-600 text-sm">{surah.name}</span>
                        {tafsir?.audio_url && (
                          <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                            <Headphones className="w-3 h-3" />Аудио
                          </span>
                        )}
                        {tafsir?.notes && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            <MessageSquare className="w-3 h-3" />Заметка
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{surah.numberOfAyahs} аятов</p>
                    </div>
                    <button
                      onClick={() => isEditing ? closeSurahEditor() : openSurahEditor(surah.number)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isEditing ? 'bg-slate-100 text-slate-600' : tafsir ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {isEditing ? 'Закрыть' : tafsir ? 'Изменить' : 'Добавить'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSurahs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Ничего не найдено</p>
            </div>
          )}
        </>
      )}

      {/* ── AYAH TAB ── */}
      {activeTab === 'ayah' && (
        <div className="space-y-4">
          {/* Lookup form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Выбрать аят</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Номер суры (1–114)</label>
                <input
                  type="number"
                  min={1}
                  max={114}
                  value={ayahSurahNumber}
                  onChange={(e) => setAyahSurahNumber(e.target.value)}
                  placeholder="1"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Номер аята</label>
                <input
                  type="number"
                  min={1}
                  value={ayahNumber}
                  onChange={(e) => setAyahNumber(e.target.value)}
                  placeholder="1"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchAyahData}
                  disabled={!ayahSurahNumber || !ayahNumber || loadingAyah}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {loadingAyah ? <Spinner className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                  Загрузить
                </button>
              </div>
            </div>
          </div>

          {/* Ayah content */}
          {(ayahTafsirList.length > 0 || ayahMediaList.length > 0 || showTafsirForm || showMediaForm) && (
            <div className="text-sm font-medium text-slate-600 px-1">
              Аят {ayahSurahNumber}:{ayahNumber}
            </div>
          )}

          {/* Existing tafsirs */}
          {ayahTafsirList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-slate-700">Комментарии учёных</span>
              </div>
              {ayahTafsirList.map((t) => (
                <div key={t.id} className="bg-white rounded-xl border border-amber-200/60 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold text-amber-800">{t.scholar_name}</span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setAyahTafsirForm({ scholarName: t.scholar_name, commentary: t.commentary, audioUrl: t.audio_url || '' });
                          setEditingTafsirId(t.id);
                          setShowTafsirForm(true);
                        }}
                        className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteAyahTafsir(t.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">{t.commentary}</p>
                  {t.audio_url && <audio controls src={t.audio_url} className="w-full h-8 mt-2" preload="metadata" />}
                </div>
              ))}
            </div>
          )}

          {/* Add tafsir button/form */}
          {!showTafsirForm ? (
            <button
              onClick={() => { setEditingTafsirId(null); setAyahTafsirForm({ scholarName: '', commentary: '', audioUrl: '' }); setShowTafsirForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium rounded-xl border border-amber-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить комментарий учёного
            </button>
          ) : (
            <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">
                  {editingTafsirId ? 'Редактировать комментарий' : 'Новый комментарий учёного'}
                </span>
                <button onClick={() => { setShowTafsirForm(false); setEditingTafsirId(null); setAyahTafsirForm({ scholarName: '', commentary: '', audioUrl: '' }); }}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={ayahTafsirForm.scholarName}
                  onChange={(e) => setAyahTafsirForm((p) => ({ ...p, scholarName: e.target.value }))}
                  placeholder="Имя учёного (напр. Ибн Касир, Саади)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <textarea
                  value={ayahTafsirForm.commentary}
                  onChange={(e) => setAyahTafsirForm((p) => ({ ...p, commentary: e.target.value }))}
                  rows={4}
                  placeholder="Текст тафсира аята…"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-y"
                />
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Аудио (необязательно)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={ayahTafsirForm.audioUrl}
                      onChange={(e) => setAyahTafsirForm((p) => ({ ...p, audioUrl: e.target.value }))}
                      placeholder="https://…"
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => ayahAudioInputRef.current?.click()}
                      disabled={uploadingAyah}
                      className="shrink-0 flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                    >
                      {uploadingAyah ? <Spinner className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                    </button>
                    <input ref={ayahAudioInputRef} type="file" accept="audio/*" onChange={handleAyahAudioUpload} className="hidden" />
                  </div>
                </div>
                <button
                  onClick={handleSaveAyahTafsir}
                  disabled={savingAyah || !ayahTafsirForm.scholarName.trim() || !ayahTafsirForm.commentary.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {savingAyah ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}Сохранить
                </button>
              </div>
            </div>
          )}

          {/* Existing media */}
          {ayahMediaList.length > 0 && (
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <span className="text-sm font-semibold text-slate-700">Медиа-ссылки</span>
              </div>
              {ayahMediaList.map((m) => (
                <div key={m.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                    m.media_type === 'article' ? 'bg-sky-50 text-sky-700' : m.media_type === 'audio' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {m.media_type === 'article' && <FileText className="w-3 h-3" />}
                    {m.media_type === 'audio' && <Headphones className="w-3 h-3" />}
                    {m.media_type === 'video' && <Video className="w-3 h-3" />}
                    {m.media_type}
                  </span>
                  <span className="flex-1 text-sm text-slate-700 truncate">{m.title}</span>
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline truncate max-w-[120px]">{m.url}</a>
                  <button onClick={() => handleDeleteAyahMedia(m.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add media form */}
          {!showMediaForm ? (
            <button
              onClick={() => setShowMediaForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-sm font-medium rounded-xl border border-sky-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить медиа-ссылку к аяту
            </button>
          ) : (
            <div className="bg-white rounded-xl border border-sky-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">Медиа-ссылка к аяту</span>
                <button onClick={() => setShowMediaForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Тип контента</label>
                  <div className="flex gap-2">
                    {(['article', 'audio', 'video'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setAyahMediaForm((p) => ({ ...p, mediaType: type }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          ayahMediaForm.mediaType === type ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {type === 'article' && <FileText className="w-3.5 h-3.5" />}
                        {type === 'audio' && <Headphones className="w-3.5 h-3.5" />}
                        {type === 'video' && <Video className="w-3.5 h-3.5" />}
                        {type === 'article' ? 'Статья' : type === 'audio' ? 'Аудио' : 'Видео'}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={ayahMediaForm.title}
                  onChange={(e) => setAyahMediaForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Название (напр. «Лекция о терпении»)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <input
                  type="url"
                  value={ayahMediaForm.url}
                  onChange={(e) => setAyahMediaForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="https://…"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <button
                  onClick={handleSaveAyahMedia}
                  disabled={savingAyah || !ayahMediaForm.title.trim() || !ayahMediaForm.url.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {savingAyah ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}Сохранить
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
