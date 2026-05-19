import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Heart, Copy, Check, Wallet, CreditCard } from 'lucide-react';

interface WalletData {
  card_number: string;
  usdt_trc20: string;
  ton_wallet: string;
}

interface WalletEntry {
  label: string;
  address: string;
  icon: typeof Wallet;
  color: string;
  iconColor: string;
}

function buildWallets(data: WalletData): WalletEntry[] {
  return [
    {
      label: 'USDT TRC-20',
      address: data.usdt_trc20,
      icon: Wallet,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'TON',
      address: data.ton_wallet,
      icon: Wallet,
      color: 'bg-sky-50 border-sky-200 text-sky-700',
      iconColor: 'text-sky-500',
    },
    {
      label: 'Банковская карта',
      address: data.card_number,
      icon: CreditCard,
      color: 'bg-amber-50 border-amber-200 text-amber-700',
      iconColor: 'text-amber-500',
    },
  ].filter((w) => w.address);
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SupportModal({ open, onClose }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const [walletEntries, setWalletEntries] = useState<WalletEntry[]>([]);

  useEffect(() => {
    if (open) fetchWallets();
  }, [open]);

  const fetchWallets = async () => {
    const { data } = await supabase
      .from('wallet_settings')
      .select('card_number, usdt_trc20, ton_wallet')
      .eq('id', 1)
      .maybeSingle();

    if (data) setWalletEntries(buildWallets(data));
  };

  if (!open) return null;

  const handleCopy = async (address: string, label: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = address;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Поддержка платформы</h2>
                <p className="text-sm text-slate-500">Зейнуль Абидин</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Ваша поддержка помогает нам развивать проект, создавать новые материалы и
            делать знания доступными для всех. Каждый вклад, независимо от размера,
            имеет значение и приближает нас к общей цели.
          </p>

          {walletEntries.length > 0 ? (
            <div className="space-y-3">
              {walletEntries.map((wallet) => {
                const Icon = wallet.icon;
                const isCopied = copied === wallet.label;
                return (
                  <div
                    key={wallet.label}
                    className={`rounded-xl border p-4 ${wallet.color}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${wallet.iconColor}`} />
                      <span className="text-sm font-semibold">{wallet.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs sm:text-sm font-mono bg-white/60 rounded-lg px-3 py-2 break-all select-all">
                        {wallet.address}
                      </code>
                      <button
                        onClick={() => handleCopy(wallet.address, wallet.label)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          isCopied
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Скопировано
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Скопировать
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Реквизиты пока не указаны</p>
          )}

          <p className="text-xs text-slate-400 text-center mt-6">
            Благодарим вас за поддержку и доверие
          </p>
        </div>
      </div>
    </div>
  );
}
