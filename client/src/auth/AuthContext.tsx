import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from '../lib/api';
import type { Permission, Session, User } from '../types';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  user: User | null;
  status: Status;
  login: (email: string, password: string) => Promise<User>;
  register: (displayName: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const applySession = useCallback((session: Session): User => {
    setToken(session.token);
    setUser(session.user);
    setStatus('authenticated');
    return session.user;
  }, []);

  // Al recargar la pagina se revalida el token guardado.
  useEffect(() => {
    if (!getToken()) {
      setStatus('anonymous');
      return;
    }

    let active = true;
    api.auth
      .me()
      .then(({ user: current }) => {
        if (!active) return;
        setUser(current);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!active) return;
        clearToken();
        setUser(null);
        setStatus('anonymous');
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => applySession(await api.auth.login(email, password)),
    [applySession],
  );

  const register = useCallback(
    async (displayName: string, email: string, password: string) =>
      applySession(await api.auth.register(displayName, email, password)),
    [applySession],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const refresh = useCallback(async () => {
    const { user: current } = await api.auth.me();
    setUser(current);
    setStatus('authenticated');
  }, []);

  const can = useCallback(
    (permission: Permission) => user?.permissions.includes(permission) ?? false,
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout, refresh, can }),
    [user, status, login, register, logout, refresh, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
