import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UserPreferences {
  dateFormat: 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'yyyy-mm-dd';
  lengthUnit: 'mm' | 'cm' | 'in';
  weightUnit: 'g' | 'kg' | 'oz' | 'lb';
}

const DEFAULTS: UserPreferences = {
  dateFormat: 'dd-mm-yyyy',
  lengthUnit: 'mm',
  weightUnit: 'g',
};

// ── Hook ───────────────────────────────────────────────────────────────────────

export function usePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch preferences on mount
  useEffect(() => {
    if (!user) {
      setPreferences(DEFAULTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch('/api/user/preferences', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch preferences');
        return r.json();
      })
      .then((data: UserPreferences) => setPreferences(data))
      .catch(() => setPreferences(DEFAULTS))
      .finally(() => setLoading(false));
  }, [user]);

  // Update a single preference
  const updatePreference = useCallback(
    async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      if (!user) return;

      // Optimistic update
      setPreferences((prev) => ({ ...prev, [key]: value }));
      setSaving(true);

      try {
        const r = await fetch('/api/user/preferences', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: value }),
        });

        if (!r.ok) {
          const data = await r.json();
          throw new Error(data.error ?? 'Error al guardar preferencia');
        }
      } catch (e: unknown) {
        // Rollback on error
        console.error('Failed to update preference:', e);
        // Re-fetch to get the correct state
        const r = await fetch('/api/user/preferences', { credentials: 'include' });
        if (r.ok) {
          const data = await r.json();
          setPreferences(data);
        }
      } finally {
        setSaving(false);
      }
    },
    [user]
  );

  // Update multiple preferences at once
  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferences>) => {
      if (!user) return;

      // Optimistic update
      setPreferences((prev) => ({ ...prev, ...updates }));
      setSaving(true);

      try {
        const r = await fetch('/api/user/preferences', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!r.ok) {
          const data = await r.json();
          throw new Error(data.error ?? 'Error al guardar preferencias');
        }
      } catch (e: unknown) {
        // Rollback on error
        console.error('Failed to update preferences:', e);
        // Re-fetch to get the correct state
        const r = await fetch('/api/user/preferences', { credentials: 'include' });
        if (r.ok) {
          const data = await r.json();
          setPreferences(data);
        }
      } finally {
        setSaving(false);
      }
    },
    [user]
  );

  return {
    preferences,
    loading,
    saving,
    updatePreference,
    updatePreferences,
  };
}
