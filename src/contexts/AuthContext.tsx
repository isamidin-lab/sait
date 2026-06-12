import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AdminInfo {
  id: string;
  email: string;
  display_name: string;
  role: 'owner' | 'administrator' | 'moderator';
  auth_user_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  adminInfo: AdminInfo | null;
  isAdmin: boolean;
  isOwner: boolean;
  isAdministrator: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function resolveAdmin(email: string): Promise<AdminInfo | null> {
  if (!supabaseConfigured) return null;
  const { data } = await supabase
    .from('allowed_admin_emails')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    display_name: data.display_name,
    role: data.role,
    auth_user_id: data.auth_user_id ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSession = async (s: Session | null) => {
    setSession(s);
    setUser(s?.user ?? null);
    if (s?.user?.email) {
      const info = await resolveAdmin(s.user.email);
      if (!info) {
        if (supabaseConfigured) await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setAdminInfo(null);
      } else {
        setAdminInfo(info);
      }
    } else {
      setAdminInfo(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      handleSession(s);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      (async () => { await handleSession(s); })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabaseConfigured) return { error: 'Authentication is not configured.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    if (supabaseConfigured) await supabase.auth.signOut();
    setAdminInfo(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        adminInfo,
        isAdmin: !!adminInfo,
        isOwner: adminInfo?.role === 'owner',
        isAdministrator: adminInfo?.role === 'owner' || adminInfo?.role === 'administrator',
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
