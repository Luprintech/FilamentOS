import { createContext, useContext, useEffect, useState } from 'react';

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
    fetch('/api/lupe/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setIsAdmin(!!d.isAdmin))
      .catch(() => setIsAdmin(false))
      .finally(() => setLoading(false));
  }, []);

  async function login(user: string, pass: string) {
    const r = await fetch('/api/lupe/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user, pass }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.error || 'Credenciales incorrectas');
    }
    setIsAdmin(true);
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
