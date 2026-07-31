import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Employee } from '@/types/database';

interface CurrentUserContextValue {
  user: Employee | null;
  setUserId: (id: string, employees: Employee[]) => void;
  setFromEmployees: (employees: Employee[]) => void;
  isAdmin: boolean;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);
const STORAGE_KEY = 'atlas-current-user-id';

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  const applyStoredId = useCallback((employees: Employee[]) => {
    if (employees.length === 0) return;
    const storedId = localStorage.getItem(STORAGE_KEY);
    const found = storedId ? employees.find((e) => e.id === storedId) : null;
    setUser(found ?? employees[0]);
  }, []);

  const setFromEmployees = useCallback((employees: Employee[]) => {
    setAllEmployees(employees);
    applyStoredId(employees);
  }, [applyStoredId]);

  const setUserId = useCallback((id: string, employees?: Employee[]) => {
    const pool = employees ?? allEmployees;
    const found = pool.find((e) => e.id === id);
    if (found) {
      setUser(found);
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, [allEmployees]);

  return (
    <CurrentUserContext.Provider value={{
      user,
      setUserId,
      setFromEmployees,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error('useCurrentUser must be used within CurrentUserProvider');
  return ctx;
}
