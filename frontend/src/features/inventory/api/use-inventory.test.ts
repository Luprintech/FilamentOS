import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Spool, SpoolmanRemoteSpool, SpoolmanStatus } from '../types';

// Mock inventory-api
vi.mock('./inventory-api', () => ({
  apiGetSpools: vi.fn(),
  apiCreateSpool: vi.fn(),
  apiUpdateSpool: vi.fn(),
  apiDeleteSpool: vi.fn(),
  apiDeductSpool: vi.fn(),
  apiFinishSpool: vi.fn(),
  apiGetCustomOptions: vi.fn(),
  apiGetSpoolmanStatus: vi.fn(),
  apiSyncSpoolman: vi.fn(),
  apiGetRemoteSpool: vi.fn(),
  apiLinkSpoolman: vi.fn(),
  InventoryApiError: class InventoryApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = 'InventoryApiError';
      this.status = status;
    }
  },
}));

import {
  apiGetSpools,
  apiCreateSpool,
  apiDeleteSpool,
  apiDeductSpool,
  apiFinishSpool,
  apiGetCustomOptions,
  apiGetSpoolmanStatus,
  apiSyncSpoolman,
  apiGetRemoteSpool,
  apiLinkSpoolman,
} from './inventory-api';
import { useInventory } from './use-inventory';

const mockGetSpools = vi.mocked(apiGetSpools);
const mockCreateSpool = vi.mocked(apiCreateSpool);
const mockDeleteSpool = vi.mocked(apiDeleteSpool);
const mockDeductSpool = vi.mocked(apiDeductSpool);
const mockFinishSpool = vi.mocked(apiFinishSpool);
const mockGetCustomOptions = vi.mocked(apiGetCustomOptions);
const mockGetSpoolmanStatus = vi.mocked(apiGetSpoolmanStatus);
const mockSyncSpoolman = vi.mocked(apiSyncSpoolman);
const mockGetRemoteSpool = vi.mocked(apiGetRemoteSpool);
const mockLinkSpoolman = vi.mocked(apiLinkSpoolman);

const spool1: Spool = {
  id: 'spool-1',
  brand: 'Bambu',
  material: 'PLA',
  color: 'Blanco',
  colorHex: '#FFFFFF',
  totalGrams: 1000,
  remainingG: 800,
  price: 20,
  notes: '',
  status: 'active',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  shopUrl: null,
  spoolmanId: null,
  inventorySource: 'local',
  linkedAt: null,
  lastSyncedAt: null,
};

const remoteStatus: SpoolmanStatus = {
  configured: true,
  endpoint: 'https://spoolman.local/api/v1',
  state: 'connected',
  error: null,
};

const remoteSpool: SpoolmanRemoteSpool = {
  spoolmanId: 55,
  brand: 'Polymaker',
  name: 'PolyLite PLA',
  material: 'PLA',
  color: null,
  colorHex: '#112233',
  totalGrams: 1000,
  remainingG: 640,
  weightGrams: 1000,
  diameter: null,
  printTempMin: null,
  printTempMax: null,
  bedTempMin: null,
  bedTempMax: null,
  price: 28,
  notes: 'Remote spool',
};

describe('useInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCustomOptions.mockResolvedValue({ brands: [], materials: [] });
    mockGetSpoolmanStatus.mockResolvedValue({
      configured: false,
      endpoint: null,
      state: 'unconfigured',
      error: null,
    });
  });

  // ── Auth states ───────────────────────────────────────────────────────────

  it('mientras authLoading=true, loading=true y no hace fetch', async () => {
    const { result } = renderHook(() =>
      useInventory({ authLoading: true, userId: null }),
    );
    expect(result.current.loading).toBe(true);
    expect(mockGetSpools).not.toHaveBeenCalled();
  });

  it('cuando userId=null, loading=false y spools=[]', async () => {
    const { result } = renderHook(() =>
      useInventory({ authLoading: false, userId: null }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.spools).toEqual([]);
    expect(mockGetSpools).not.toHaveBeenCalled();
  });

  it('cuando hay userId, carga spools y custom options', async () => {
    mockGetSpools.mockResolvedValue([spool1]);
    mockGetCustomOptions.mockResolvedValue({ brands: ['Bambu'], materials: ['PLA'] });
    mockGetSpoolmanStatus.mockResolvedValue(remoteStatus);

    const { result } = renderHook(() =>
      useInventory({ authLoading: false, userId: 'user-1' }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.spools).toEqual([spool1]);
    expect(result.current.customBrands).toEqual(['Bambu']);
    expect(result.current.customMaterials).toEqual(['PLA']);
    expect(result.current.spoolmanStatus).toEqual(remoteStatus);
  });

  it('syncSpoolman refresca estado y listado después de sincronizar', async () => {
    mockGetSpools
      .mockResolvedValueOnce([spool1])
      .mockResolvedValueOnce([{ ...spool1, inventorySource: 'spoolman', spoolmanId: 55 }]);
    mockGetSpoolmanStatus
      .mockResolvedValueOnce({ configured: true, endpoint: 'https://spoolman.local/api/v1', state: 'degraded', error: 'offline' })
      .mockResolvedValueOnce(remoteStatus);
    mockSyncSpoolman.mockResolvedValue({ created: 1, updated: 0, skipped: 0 });

    const { result } = renderHook(() =>
      useInventory({ authLoading: false, userId: 'user-1' }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.syncSpoolman();
    });

    expect(mockSyncSpoolman).toHaveBeenCalledTimes(1);
    expect(result.current.spoolmanStatus).toEqual(remoteStatus);
    expect(result.current.spools).toContainEqual(expect.objectContaining({ spoolmanId: 55, inventorySource: 'spoolman' }));
  });

  it('linkSpoolman actualiza la bobina local enlazada en estado', async () => {
    mockGetSpools.mockResolvedValue([spool1]);
    mockLinkSpoolman.mockResolvedValue({
      ...spool1,
      spoolmanId: 55,
      inventorySource: 'spoolman',
      linkedAt: '2026-04-28T17:00:00Z',
      lastSyncedAt: null,
    });

    const { result } = renderHook(() =>
      useInventory({ authLoading: false, userId: 'user-1' }),
    );
    await waitFor(() => expect(result.current.spools).toHaveLength(1));

    await act(async () => {
      await result.current.linkSpoolman('spool-1', 55);
    });

    expect(result.current.spools[0]).toEqual(expect.objectContaining({ spoolmanId: 55, inventorySource: 'spoolman' }));
  });

  it('getRemoteSpool devuelve la bobina remota solicitada', async () => {
    mockGetSpools.mockResolvedValue([spool1]);
    mockGetRemoteSpool.mockResolvedValue(remoteSpool);

    const { result } = renderHook(() =>
      useInventory({ authLoading: false, userId: 'user-1' }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.getRemoteSpool(55)).resolves.toEqual(remoteSpool);
  });

  // ── createSpool ───────────────────────────────────────────────────────────

  it('createSpool añade la bobina al estado', async () => {
    mockGetSpools.mockResolvedValue([]);
    mockGetCustomOptions.mockResolvedValue({ brands: [], materials: [] });
    mockCreateSpool.mockResolvedValue(spool1);

    const { result } = renderHook(() =>
      useInventory({ authLoading: false, userId: 'user-1' }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createSpool({
        brand: 'Bambu',
        material: 'PLA',
        color: 'Blanco',
        colorHex: '#FFFFFF',
        totalGrams: 1000,
        remainingG: 1000,
        price: 20,
        notes: '',
      });
    });

    expect(result.current.spools).toContainEqual(spool1);
  });

  it('createSpool lanza error si no hay usuario autenticado', async () => {
    const { result } = renderHook(() =>
      useInventory({ authLoading: false, userId: null }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      result.current.createSpool({
        brand: 'Bambu', material: 'PLA', color: 'Blanco',
        colorHex: '#FFFFFF', totalGrams: 1000, remainingG: 1000, price: 20, notes: '',
      }),
    ).rejects.toThrow('Not authenticated');
  });

  // ── deleteSpool ───────────────────────────────────────────────────────────

  it('deleteSpool elimina la bobina del estado', async () => {
    mockGetSpools.mockResolvedValue([spool1]);
    mockDeleteSpool.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useInventory({ authLoading: false, userId: 'user-1' }),
    );
    await waitFor(() => expect(result.current.spools).toHaveLength(1));

    await act(async () => {
      await result.current.deleteSpool('spool-1');
    });

    expect(result.current.spools).toHaveLength(0);
  });

  // ── deductSpool ───────────────────────────────────────────────────────────

  it('deductSpool actualiza remainingG en el estado', async () => {
    mockGetSpools.mockResolvedValue([spool1]);
    mockDeductSpool.mockResolvedValue({ remainingG: 750, status: 'active' });

    const { result } = renderHook(() =>
      useInventory({ authLoading: false, userId: 'user-1' }),
    );
    await waitFor(() => expect(result.current.spools).toHaveLength(1));

    await act(async () => {
      await result.current.deductSpool('spool-1', 50);
    });

    expect(result.current.spools[0].remainingG).toBe(750);
  });

  // ── finishSpool ───────────────────────────────────────────────────────────

  it('finishSpool marca la bobina como terminada con remainingG=0', async () => {
    mockGetSpools.mockResolvedValue([spool1]);
    mockFinishSpool.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useInventory({ authLoading: false, userId: 'user-1' }),
    );
    await waitFor(() => expect(result.current.spools).toHaveLength(1));

    await act(async () => {
      await result.current.finishSpool('spool-1');
    });

    const finished = result.current.spools.find((s) => s.id === 'spool-1');
    expect(finished?.status).toBe('finished');
    expect(finished?.remainingG).toBe(0);
  });
});
