import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../../contexts/ToastContext';
import { Save } from 'lucide-react';

const FIELDS = [
  { key: 'telegram',  label: 'Telegram',  placeholder: 'https://t.me/yourchannel' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourprofile' },
  { key: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@yourprofile' },
] as const;

type Socials = Record<string, string>;

export default function SocialsPage() {
  const { showToast } = useToast();
  const [links, setLinks] = useState<Socials>({ telegram: '', instagram: '', youtube: '', tiktok: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'socials')).then((snap) => {
      if (snap.exists()) setLinks(snap.data() as Socials);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'socials'), links);
      showToast('Ссылки сохранены', 'success');
    } catch {
      showToast('Ошибка при сохранении', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Социальные сети</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <input
              type="url"
              value={links[key] ?? ''}
              onChange={(e) => setLinks((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        ))}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Сохранение...' : 'Сохранить ссылки'}
        </button>
      </div>
    </div>
  );
}
