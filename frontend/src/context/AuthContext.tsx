import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, tokens } from '../lib/api';
import type { User } from '../lib/types';

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (body: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  }) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;
  reload: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!tokens.access) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await authApi.me());
    } catch {
      tokens.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    // api.ts dispatches this when the refresh token is no longer valid.
    const onLogout = () => setUser(null);
    window.addEventListener('naseej:logout', onLogout);
    return () => window.removeEventListener('naseej:logout', onLogout);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await authApi.login({ identifier, password });
    tokens.save(res.accessToken, res.refreshToken);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback<AuthValue['register']>(async (body) => {
    const res = await authApi.register(body);
    tokens.save(res.accessToken, res.refreshToken);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    tokens.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser, reload }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
