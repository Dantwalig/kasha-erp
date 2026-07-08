'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api, setTokens, clearTokens } from './api';

interface CurrentUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) => Promise<void>;
  logout: () => void;
  hasPermission: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadMe() {
    try {
      const me = await api.get('/auth/me');
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const hasToken =
      typeof window !== 'undefined' &&
      localStorage.getItem('kasha_access_token');
    if (hasToken) {
      loadMe();
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const data = await api.post('/auth/login', { email, password }, { skipAuth: true });
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    router.push('/');
  }

  async function register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) {
    const data = await api.post(
      '/auth/register',
      { email, password, firstName, lastName },
      { skipAuth: true },
    );
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    router.push('/');
  }

  function logout() {
    clearTokens();
    setUser(null);
    router.push('/login');
  }

  function hasPermission(code: string) {
    return user?.permissions?.includes(code) ?? false;
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
