import type { StatsFilters, StatsResponse, StatsPiecesResponse } from '../types';

const API_BASE = '';

/**
 * Fetch aggregated stats from the backend.
 * Matches GET /api/stats?from=&to=&projectId=&status=&granularity=
 */
export async function apiGetStats(filters: Omit<StatsFilters, 'preset'>): Promise<StatsResponse> {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    projectId: filters.projectId,
    status: filters.status,
    granularity: filters.granularity,
    source: filters.source,
  });

  const res = await fetch(`${API_BASE}/api/stats?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<StatsResponse>;
}

/**
 * Fetch individual piece detail list for the drill-down panel.
 * Matches GET /api/stats/pieces?from=&to=&projectId=&status=
 */
export async function apiGetStatsPieces(
  filters: Pick<StatsFilters, 'from' | 'to' | 'projectId' | 'status' | 'source'>,
  options?: { signal?: AbortSignal },
): Promise<StatsPiecesResponse> {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    projectId: filters.projectId,
    status: filters.status,
    source: filters.source,
  });

  const res = await fetch(`${API_BASE}/api/stats/pieces?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
    signal: options?.signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<StatsPiecesResponse>;
}
