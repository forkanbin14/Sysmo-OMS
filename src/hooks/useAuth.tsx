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
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, position?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, position?: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Could not create account' };

    // Wait a moment for the auth user to be available, then create employee + profile
    await new Promise((r) => setTimeout(r, 500));

    const { error: empErr } = await supabase.from('employees').insert({
      auth_id: data.user.id,
      name,
      email,
      position: position ?? 'Team Member',
      role: 'member',
      status: 'active',
      hire_date: new Date().toISOString().slice(0, 10),
      salary: 0,
    });
    if (empErr) return { error: empErr.message };

    // Fetch the employee row we just created
    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('auth_id', data.user.id)
      .maybeSingle();

    if (emp) {
      await supabase.from('profiles').insert({
        auth_id: data.user.id,
        employee_id: emp.id,
        role: 'member',
        bio: '',
        skills: [],
      });
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setEmployee(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, employee, profile, loading, isAdmin: employee?.role === 'admin', signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
