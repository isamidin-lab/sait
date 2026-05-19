import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Spinner from '../../components/Spinner';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Crown,
  X,
  Save,
  Eye,
  EyeOff,
  UserCog,
  ChevronDown,
} from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  display_name: string;
  role: 'owner' | 'administrator' | 'moderator';
  auth_user_id: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Владелец',
  administrator: 'Администратор',
  moderator: 'Модератор',
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-700',
  administrator: 'bg-sky-100 text-sky-700',
  moderator: 'bg-slate-100 text-slate-600',
};

export default function AdminsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user, isOwner, session } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'moderator' as 'administrator' | 'moderator',
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('allowed_admin_emails')
      .select('*')
      .order('created_at');
    if (error) console.error(error);
    if (data) setMembers(data as TeamMember[]);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ fullName: '', email: '', password: '', role: 'moderator' });
    setShowForm(false);
    setShowPassword(false);
  };

  const callEdgeFunction = async (method: string, body: object) => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const token = currentSession?.access_token || session?.access_token;
    if (!token) throw new Error('No session token');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const res = await fetch(`${supabaseUrl}/functions/v1/manage-admin-user`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Edge function error');
    return data;
  };

  const handleCreate = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) return;
    if (form.password.length < 6) {
      addToast('error', 'Пароль должен быть не менее 6 символов');
      return;
    }
    setSaving(true);
    try {
      await callEdgeFunction('POST', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        display_name: form.fullName.trim(),
        role: form.role,
      });
      addToast('success', `Аккаунт ${form.email.trim()} создан`);
      resetForm();
      fetchMembers();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка при создании';
      if (msg.includes('already been registered') || msg.includes('duplicate')) {
        addToast('error', 'Пользователь с таким email уже существует');
      } else {
        addToast('error', msg);
      }
    }
    setSaving(false);
  };

  const handleUpdateRole = async (member: TeamMember, newRole: 'administrator' | 'moderator') => {
    try {
      await callEdgeFunction('PATCH', { id: member.id, role: newRole });
      addToast('success', `Роль обновлена на ${ROLE_LABELS[newRole]}`);
      setEditingRoleId(null);
      fetchMembers();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Ошибка при обновлении роли');
    }
  };

  const handleDelete = async (member: TeamMember) => {
    if (member.role === 'owner') { addToast('error', 'Нельзя удалить владельца'); return; }
    if (member.email === user?.email) { addToast('error', 'Нельзя удалить самого себя'); return; }
    setDeletingId(member.id);
    try {
      await callEdgeFunction('DELETE', { id: member.id, auth_user_id: member.auth_user_id });
      addToast('info', `${member.display_name} удалён из команды`);
      fetchMembers();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Ошибка при удалении');
    }
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="w-8 h-8 text-emerald-600" />
      </div>
    );
  }

  const owners = members.filter((m) => m.role === 'owner');
  const staff = members.filter((m) => m.role !== 'owner');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-emerald-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Доступ и команда</h1>
            <p className="text-sm text-slate-500">{members.length} участников</p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {showForm ? 'Закрыть' : 'Добавить участника'}
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-5">
        <p className="text-sm text-sky-800 leading-relaxed">
          <span className="font-semibold">Роли:</span>{' '}
          <span className="font-medium text-amber-700">Владелец</span> — полный доступ, управление командой.{' '}
          <span className="font-medium text-sky-700">Администратор</span> — все разделы, кроме управления командой.{' '}
          <span className="font-medium text-slate-600">Модератор</span> — только Вопросы-Ответы и Статьи.
        </p>
      </div>

      {/* Create form */}
      {showForm && isOwner && (
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-5 mb-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            Создать новый аккаунт
          </h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Полное имя *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Имя Фамилия"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Пароль * (мин. 6 символов)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Введите пароль"
                  className="w-full px-3 py-2 pr-9 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Роль *</label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'administrator' | 'moderator' })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 appearance-none pr-8"
                >
                  <option value="administrator">Администратор</option>
                  <option value="moderator">Модератор</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 leading-relaxed">
            Аккаунт будет немедленно создан в системе. Пользователь сможет войти по указанному email и паролю.
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={saving || !form.fullName.trim() || !form.email.trim() || !form.password.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              Создать аккаунт
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

      {/* Owners section */}
      {owners.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2">Владельцы</p>
          <div className="space-y-2">
            {owners.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-amber-200/60 shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{m.display_name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                        Владелец
                      </span>
                      {m.email === user?.email && (
                        <span className="text-xs text-emerald-600 font-medium">(вы)</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" />
                      {m.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff section */}
      {staff.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2">Сотрудники</p>
          <div className="space-y-2">
            {staff.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      m.role === 'administrator' ? 'bg-sky-100' : 'bg-slate-100'
                    }`}>
                      {m.role === 'administrator' ? (
                        <UserCog className="w-5 h-5 text-sky-600" />
                      ) : (
                        <Shield className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-800">{m.display_name}</p>
                        {editingRoleId === m.id ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              defaultValue={m.role}
                              onChange={(e) => handleUpdateRole(m, e.target.value as 'administrator' | 'moderator')}
                              className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            >
                              <option value="administrator">Администратор</option>
                              <option value="moderator">Модератор</option>
                            </select>
                            <button
                              onClick={() => setEditingRoleId(null)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => isOwner && setEditingRoleId(m.id)}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${ROLE_COLORS[m.role]} ${isOwner ? 'hover:opacity-80 cursor-pointer' : ''}`}
                            title={isOwner ? 'Нажмите чтобы изменить роль' : undefined}
                          >
                            {ROLE_LABELS[m.role]}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{m.email}</span>
                        {m.email === user?.email && (
                          <span className="ml-1 text-emerald-600 font-medium shrink-0">(вы)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {isOwner && m.email !== user?.email && (
                    <button
                      onClick={() => handleDelete(m)}
                      disabled={deletingId === m.id}
                      className="shrink-0 p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
                      title="Удалить"
                    >
                      {deletingId === m.id ? (
                        <Spinner className="w-4 h-4" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {staff.length === 0 && !showForm && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Сотрудников пока нет</p>
          {isOwner && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Добавить первого участника
            </button>
          )}
        </div>
      )}
    </div>
  );
}
