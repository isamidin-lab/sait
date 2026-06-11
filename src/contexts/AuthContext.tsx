import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth, db } from '../lib/firebase';

interface AdminInfo {
  id: string;
  email: string;
  display_name: string;
  role: 'owner' | 'administrator' | 'moderator';
  auth_user_id: string | null;
}

interface AuthContextType {
  user: FirebaseUser | null;
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
  try {
    const ref = doc(db, 'admins', email);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      email: data.email ?? email,
      display_name: data.display_name ?? '',
      role: data.role ?? 'moderator',
      auth_user_id: data.auth_user_id ?? null,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser?.email) {
        const info = await resolveAdmin(firebaseUser.email);
        if (!info) {
          await firebaseSignOut(firebaseAuth);
          setUser(null);
          setAdminInfo(null);
        } else {
          setAdminInfo(info);
        }
      } else {
        setAdminInfo(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return { error: message };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(firebaseAuth);
    setAdminInfo(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
