import { httpRequest, jsonRequest, HttpClientError } from '@/shared/api/http-client';
import type { Spool, SpoolInput, SpoolmanRemoteSpool, SpoolmanStatus, SpoolmanSyncResult } from '../types';

// ── Error ──────────────────────────────────────────────────────────────────────

export class InventoryApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'InventoryApiError';
    this.status = status;
  }
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  try {
    return await httpRequest<T>({ url, init });
  } catch (error) {
    if (error instanceof HttpClientError) {
      throw new InventoryApiError(error.message, error.status);
    }
    throw error;
  }
}

// ── Spools ─────────────────────────────────────────────────────────────────────

export async function apiGetSpools(): Promise<Spool[]> {
  return apiFetch<Spool[]>('/api/inventory/spools');
}

export async function apiCreateSpool(input: SpoolInput): Promise<Spool> {
  return apiFetch<Spool>('/api/inventory/spools', jsonRequest('POST', input));
}

export async function apiUpdateSpool(id: string, input: SpoolInput): Promise<Spool> {
  return apiFetch<Spool>(`/api/inventory/spools/${id}`, jsonRequest('PUT', input));
}

export async function apiDeleteSpool(id: string): Promise<void> {
  await apiFetch<unknown>(`/api/inventory/spools/${id}`, { method: 'DELETE' });
}

export async function apiDeductSpool(
  id: string,
  grams: number,
): Promise<{ remainingG: number; status: string }> {
  return apiFetch<{ remainingG: number; status: string }>(
    `/api/inventory/spools/${id}/deduct`,
    jsonRequest('PATCH', { grams }),
  );
}

export async function apiFinishSpool(id: string): Promise<void> {
  await apiFetch<unknown>(`/api/inventory/spools/${id}/finish`, { method: 'PATCH' });
}

// ── Custom options ─────────────────────────────────────────────────────────────

export async function apiGetCustomOptions(): Promise<{ brands: string[]; materials: string[] }> {
  return apiFetch<{ brands: string[]; materials: string[] }>('/api/inventory/custom-options');
}

export async function apiGetSpoolmanStatus(): Promise<SpoolmanStatus> {
  return apiFetch<SpoolmanStatus>('/api/inventory/spoolman/status');
}

export async function apiSyncSpoolman(): Promise<SpoolmanSyncResult> {
  return apiFetch<SpoolmanSyncResult>('/api/inventory/spoolman/sync', { method: 'POST' });
}

export async function apiGetRemoteSpool(spoolmanId: number): Promise<SpoolmanRemoteSpool> {
  const response = await apiFetch<{ remoteSpool: SpoolmanRemoteSpool }>(`/api/inventory/spoolman/spools/${spoolmanId}`);
  return response.remoteSpool;
}

export async function apiLinkSpoolman(id: string, spoolmanId: number): Promise<Spool> {
  const response = await apiFetch<{ spool: Spool }>(
    `/api/inventory/spools/${id}/link-spoolman`,
    jsonRequest('POST', { spoolmanId }),
  );
  return response.spool;
}
