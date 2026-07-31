import { useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Employee } from '@/types/database';

// Re-export a compatibility hook so existing components work with real auth.
// Returns the authenticated user's employee record. No more user switching.
export function useCurrentUser() {
  const { employee, loading } = useAuth();

  return {
    user: employee,
    isAdmin: employee?.role === 'admin',
    loading,
  };
}

// Re-export types for compatibility
export type { Employee };
