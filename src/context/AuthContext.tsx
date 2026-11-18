import React, { createContext, useContext, useEffect, useState } from 'react';
import type { DealershipSettings, User } from '../types.ts';
import { apiRequest, getAuthToken, setAuthToken } from '../lib/api.ts';

interface AuthContextValue {
  user: User | null;
  settings: DealershipSettings | null;
  loading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSettings: () => Promise<void>;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<DealershipSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('apex_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('apex_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const refreshSettings = async () => {
    try {
      const data = await apiRequest<DealershipSettings>('/api/settings');
      setSettings(data);
    } catch {
      // ignore initial settings failure
    }
  };

  useEffect(() => {
    const init = async () => {
      await refreshSettings();
      const token = getAuthToken();
      if (token) {
        try {
          const res = await apiRequest<{ user: User }>('/api/auth/me');
          setUser(res.user);
        } catch {
          setAuthToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.token);
    setUser(res.user);
    await refreshSettings();
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const can = (permission: string) => {
    if (!user?.permissions) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        loading,
        theme,
        toggleTheme,
        login,
        logout,
        refreshSettings,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
