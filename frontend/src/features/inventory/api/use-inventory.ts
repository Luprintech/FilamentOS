import { useState, useCallback, useEffect } from 'react';
import {
  apiGetSpools, apiCreateSpool, apiUpdateSpool, apiDeleteSpool,
  apiDeductSpool, apiFinishSpool, apiGetCustomOptions, apiGetSpoolmanStatus,
  apiSyncSpoolman, apiGetRemoteSpool, apiLinkSpoolman, InventoryApiError,
} from './inventory-api';
import type { Spool, SpoolInput, SpoolmanRemoteSpool, SpoolmanStatus, SpoolmanSyncResult } from '../types';

export interface UseInventoryOptions {
  authLoading: boolean;
  userId: string | null;
}

export function useInventory({ authLoading, userId }: UseInventoryOptions) {
  const [spools, setSpools] = useState<Spool[]>([]);
  const [customBrands, setCustomBrands] = useState<string[]>([]);
  const [customMaterials, setCustomMaterials] = useState<string[]>([]);
  const [spoolmanStatus, setSpoolmanStatus] = useState<SpoolmanStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<InventoryApiError | Error | null>(null);

  // ── Refresh custom options (non-critical, silently fails) ────────────────────

  const refreshCustomOptions = useCallback(async () => {
    if (!userId) return;
    try {
      const { brands, materials } = await apiGetCustomOptions();
      setCustomBrands(brands);
      setCustomMaterials(materials);
    } catch {
      // Custom options are non-critical — ignore errors
    }
  }, [userId]);

  // ── Load spools ─────────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [data, status] = await Promise.all([apiGetSpools(), apiGetSpoolmanStatus()]);
      setSpools(data);
      setSpoolmanStatus(status);
      setError(null);
    } catch (e) {
      setError(e as InventoryApiError | Error);
    }
  }, [userId]);

  useEffect(() => {
    if (authLoading) { setLoading(true); return; }
    if (!userId) {
      setSpools([]);
      setCustomBrands([]);
      setCustomMaterials([]);
      setSpoolmanStatus(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    Promise.all([apiGetSpools(), apiGetCustomOptions(), apiGetSpoolmanStatus()])
      .then(([spoolsData, customData, statusData]) => {
        if (!cancelled) {
          setSpools(spoolsData);
          setCustomBrands(customData.brands);
          setCustomMaterials(customData.materials);
          setSpoolmanStatus(statusData);
          setError(null);
        }
      })
      .catch((e: InventoryApiError | Error) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [authLoading, userId]);

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const createSpool = useCallback(async (input: SpoolInput): Promise<Spool> => {
    if (!userId) throw new Error('Not authenticated');
    const spool = await apiCreateSpool(input);
    setSpools((prev) => [spool, ...prev]);
    // Refresh custom options — new brand/material may have been saved
    void refreshCustomOptions();
    return spool;
  }, [userId, refreshCustomOptions]);

  const updateSpool = useCallback(async (id: string, input: SpoolInput): Promise<Spool> => {
    if (!userId) throw new Error('Not authenticated');
    const updated = await apiUpdateSpool(id, input);
    setSpools((prev) => prev.map((s) => (s.id === id ? updated : s)));
    // Refresh custom options — new brand/material may have been saved
    void refreshCustomOptions();
    return updated;
  }, [userId, refreshCustomOptions]);

  const deleteSpool = useCallback(async (id: string): Promise<void> => {
    if (!userId) throw new Error('Not authenticated');
    await apiDeleteSpool(id);
    setSpools((prev) => prev.filter((s) => s.id !== id));
  }, [userId]);

  const deductSpool = useCallback(async (id: string, grams: number): Promise<void> => {
    if (!userId) throw new Error('Not authenticated');
    const { remainingG, status } = await apiDeductSpool(id, grams);
    setSpools((prev) =>
      prev.map((s) => s.id === id ? { ...s, remainingG, status: status as 'active' | 'finished' } : s),
    );
  }, [userId]);

  const finishSpool = useCallback(async (id: string): Promise<void> => {
    if (!userId) throw new Error('Not authenticated');
    await apiFinishSpool(id);
    setSpools((prev) =>
      prev.map((s) => s.id === id ? { ...s, status: 'finished', remainingG: 0 } : s),
    );
  }, [userId]);

  const syncSpoolman = useCallback(async (): Promise<SpoolmanSyncResult> => {
    if (!userId) throw new Error('Not authenticated');
    const result = await apiSyncSpoolman();
    await refresh();
    return result;
  }, [userId, refresh]);

  const getRemoteSpool = useCallback(async (spoolmanId: number): Promise<SpoolmanRemoteSpool> => {
    if (!userId) throw new Error('Not authenticated');
    return apiGetRemoteSpool(spoolmanId);
  }, [userId]);

  const linkSpoolman = useCallback(async (id: string, spoolmanId: number): Promise<Spool> => {
    if (!userId) throw new Error('Not authenticated');
    const linked = await apiLinkSpoolman(id, spoolmanId);
    setSpools((prev) => prev.map((s) => (s.id === id ? linked : s)));
    return linked;
  }, [userId]);

  return {
    spools,
    customBrands,
    customMaterials,
    spoolmanStatus,
    loading,
    error,
    refresh,
    createSpool,
    updateSpool,
    deleteSpool,
    deductSpool,
    finishSpool,
    syncSpoolman,
    getRemoteSpool,
    linkSpoolman,
  };
}
