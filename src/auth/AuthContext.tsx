import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthSession, User } from '@/api/types';
import { api } from '@/api/client';
import { clearSession, getSession, setSession } from '@/api/session';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (session: AuthSession) => void;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() => getSession());
  const queryClient = useQueryClient();

  const signIn = useCallback((next: AuthSession) => {
    setSession(next);
    setSessionState(next);
  }, []);

  const updateUser = useCallback((user: User) => {
    setSessionState((current) => {
      if (!current) return current;
      const next = { ...current, user };
      setSession(next);
      return next;
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      clearSession();
      setSessionState(null);
      queryClient.clear();
    }
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      signIn,
      signOut,
      updateUser,
    }),
    [session, signIn, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function RequireAuth({
  children,
  skipProfileCheck = false,
}: {
  children: ReactNode;
  skipProfileCheck?: boolean;
}) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!skipProfileCheck && user?.profileCompleted === false) {
    return <Navigate to="/setup" replace />;
  }
  return <>{children}</>;
}
