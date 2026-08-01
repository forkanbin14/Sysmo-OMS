import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Employee, Profile } from '@/types/database';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  employee: Employee | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  accountStatus: 'pending' | 'approved' | 'rejected' | null;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, position?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  completeProfile: (data: { name: string; position?: string; phone?: string; bio?: string; skills?: string[]; location?: string }) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ADMIN_EMAIL = 'ahmed.fk.98545@afftech.bd';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEmployeeData = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setEmployee(null);
      setProfile(null);
      return;
    }
    const { data: emp } = await supabase
      .from('employees')
      .select('*')
      .eq('auth_id', authUser.id)
      .maybeSingle();
    setEmployee(emp as Employee | null);

    if (emp) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('employee_id', emp.id)
        .maybeSingle();
      setProfile(prof as Profile | null);
    } else {
      setProfile(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    setSession(s);
    setUser(s?.user ?? null);
    await loadEmployeeData(s?.user ?? null);
    setLoading(false);
  }, [loadEmployeeData]);

  useEffect(() => {
    refreshUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      (async () => {
        setSession(s);
        setUser(s?.user ?? null);
        await loadEmployeeData(s?.user ?? null);
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, [loadEmployeeData, refreshUser]);

  const signIn = useCallback(async (username: string, password: string) => {
    // Convert username to internal email
    const email = `${username.trim().toLowerCase()}@afftech.bd`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  // signUp kept for compatibility but disabled in UI — admin creates accounts
  const signUp = useCallback(async (email: string, password: string, name: string, position?: string) => {
    return { error: 'Account creation is disabled. Please contact the admin.' };
  }, []);

  const completeProfile = useCallback(async (data: { name: string; position?: string; phone?: string; bio?: string; skills?: string[]; location?: string }) => {
    const { error: rpcErr } = await supabase.rpc('user_complete_profile', {
      p_name: data.name,
      p_position: data.position ?? null,
      p_phone: data.phone ?? null,
      p_bio: data.bio ?? null,
      p_skills: data.skills ?? null,
      p_location: data.location ?? null,
    });
    if (rpcErr) return { error: rpcErr.message };
    await loadEmployeeData(user);
    return { error: null };
  }, [user, loadEmployeeData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setEmployee(null);
    setProfile(null);
  }, []);

  const isAdmin = employee?.role === 'admin';
  const accountStatus = employee?.account_status ?? null;

  return (
    <AuthContext.Provider value={{ session, user, employee, profile, loading, isAdmin, accountStatus, signIn, signUp, signOut, refreshUser, completeProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
