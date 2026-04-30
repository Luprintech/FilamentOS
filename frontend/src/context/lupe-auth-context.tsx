import { createContext, useContext, useEffect, useState } from 'react';
import { HttpClientError, httpRequest } from '@/shared/api/http-client';

interface LupeAuthContextValue {
  isAdmin: boolean;
  loading: boolean;
  login: (user: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const LupeAuthContext = createContext<LupeAuthContextValue | null>(null);

export function LupeAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    httpRequest<{ isAdmin?: boolean }>({ url: '/api/lupe/me', init: { credentials: 'include' } })
      .then((d) => setIsAdmin(!!d.isAdmin))
      .catch(() => setIsAdmin(false))
      .finally(() => setLoading(false));
  }, []);

  async function login(user: string, pass: string) {
    try {
      await httpRequest({
        url: '/api/lupe/login',
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ user, pass }),
        },
      });
      setIsAdmin(true);
    } catch (error) {
      setIsAdmin(false);
      if (error instanceof HttpClientError) {
        throw new Error(error.message || 'Credenciales incorrectas');
      }
      throw error;
    }
  }

  async function logout() {
    await fetch('/api/lupe/logout', { method: 'POST', credentials: 'include' });
    setIsAdmin(false);
  }

  return (
    <LupeAuthContext.Provider value={{ isAdmin, loading, login, logout }}>
      {children}
    </LupeAuthContext.Provider>
  );
}

export function useLupeAuth() {
  const ctx = useContext(LupeAuthContext);
  if (!ctx) throw new Error('useLupeAuth must be used inside LupeAuthProvider');
  return ctx;
}
