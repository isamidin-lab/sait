import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import Spinner from '../../components/Spinner';
import { Wallet, CreditCard, Save } from 'lucide-react';

interface WalletData {
  card_number: string;
  usdt_trc20: string;
  ton_wallet: string;
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletData>({
    card_number: '',
    usdt_trc20: '',
    ton_wallet: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    const { data } = await supabase
      .from('wallet_settings')
      .select('card_number, usdt_trc20, ton_wallet')
      .eq('id', 1)
      .maybeSingle();

    if (data) setWallets(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from('wallet_settings')
      .update({
        card_number: wallets.card_number.trim(),
        usdt_trc20: wallets.usdt_trc20.trim(),
        ton_wallet: wallets.ton_wallet.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) {
      addToast('error', 'Ошибка при сохранении');
      setSaving(false);
      return;
    }

    addToast('success', 'Реквизиты обновлены');
    setSaving(false);
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
        <Wallet className="w-6 h-6 text-amber-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-800">Настройки кошельков</h1>
          <p className="text-sm text-slate-500">Реквизиты для поддержки проекта</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <p className="text-sm text-amber-800">
          Изменения отобразятся в модальном окне "Поддержать проект" на главной странице мгновенно после сохранения.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
              <CreditCard className="w-4 h-4 text-amber-500" />
              Банковская карта
            </label>
            <input
              type="text"
              value={wallets.card_number}
              onChange={(e) => setWallets({ ...wallets, card_number: e.target.value })}
              placeholder="2200 0000 0000 0000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
              <Wallet className="w-4 h-4 text-emerald-500" />
              USDT TRC-20
            </label>
            <input
              type="text"
              value={wallets.usdt_trc20}
              onChange={(e) => setWallets({ ...wallets, usdt_trc20: e.target.value })}
              placeholder="TJxZ9bhKfVQ8YHb3qN7c2mDp4sL5wR6kXv"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
              <Wallet className="w-4 h-4 text-sky-500" />
              TON кошелек
            </label>
            <input
              type="text"
              value={wallets.ton_wallet}
              onChange={(e) => setWallets({ ...wallets, ton_wallet: e.target.value })}
              placeholder="UQBv0x8f3k2Np7mQ1rS4tW6yX8zA9cD0eF2gH4iJ6kLm"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
            />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            Сохранить реквизиты
          </button>
        </div>
      </div>
    </div>
  );
}
