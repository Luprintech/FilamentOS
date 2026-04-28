import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { apiGetStats, apiGetStatsPieces } from './stats-api';
import type { StatsFilters } from '../types';

/** Debounce a value by `delay` ms. Useful to prevent API spam on typing. */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * React Query hook for aggregated stats.
 *
 * Debounces only the date inputs (300 ms) to avoid API spam on keystroke.
 * projectId, status and granularity are NOT debounced — they come from
 * dropdowns and must trigger an immediate refetch.
 *
 * Critical: ALL filter values must appear in the queryKey so React Query
 * knows to invalidate the cache whenever any filter changes.
 */
export function useStatsQuery(filters: StatsFilters) {
  const debouncedFrom = useDebouncedValue(filters.from, 300);
  const debouncedTo   = useDebouncedValue(filters.to,   300);

  // Include every filter in the key — a missing key means stale data
  const queryKey = [
    'stats',
    debouncedFrom,
    debouncedTo,
    filters.projectId,
    filters.status,
    filters.granularity,
    filters.source,
  ] as const;

  return useQuery({
    queryKey,
    queryFn: () =>
      apiGetStats({
        from:        debouncedFrom,
        to:          debouncedTo,
        projectId:   filters.projectId,
        status:      filters.status,
        granularity: filters.granularity,
        source:      filters.source,
      }),
    staleTime: 0,
    enabled: Boolean(debouncedFrom) && Boolean(debouncedTo),
  });
}

/**
 * React Query hook for the piece detail drill-down panel.
 * Only fetches when `enabled` is true (panel is open).
 */
export function useStatsPiecesQuery(
  filters: StatsFilters,
  enabled: boolean,
) {
  const debouncedFrom = useDebouncedValue(filters.from, 300);
  const debouncedTo   = useDebouncedValue(filters.to,   300);

  const queryKey = [
    'stats-pieces',
    debouncedFrom,
    debouncedTo,
    filters.projectId,
    filters.status,
    filters.source,
  ] as const;

  return useQuery({
    queryKey,
    queryFn: () =>
      apiGetStatsPieces({
        from:      debouncedFrom,
        to:        debouncedTo,
        projectId: filters.projectId,
        status:    filters.status,
        source:    filters.source,
      }),
    staleTime: 0,
    enabled: enabled && Boolean(debouncedFrom) && Boolean(debouncedTo),
  });
}

/** Stable ref to track previous filters for logging / debugging if needed */
export function useStatsFiltersRef(filters: StatsFilters) {
  const ref = useRef(filters);
  useEffect(() => { ref.current = filters; }, [filters]);
  return ref;
}
