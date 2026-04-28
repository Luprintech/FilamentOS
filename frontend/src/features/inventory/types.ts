// ── Filament Inventory Types ───────────────────────────────────────────────────

export type SpoolStatus = 'active' | 'finished';
export type InventorySource = 'local' | 'spoolman';
export type SpoolmanState = 'unconfigured' | 'connected' | 'degraded';

export interface Spool {
  id: string;
  brand: string;
  material: string;
  color: string;
  colorHex: string;
  totalGrams: number;
  remainingG: number;
  price: number;
  notes: string;
  shopUrl: string | null;
  spoolmanId: number | null;
  inventorySource: InventorySource;
  linkedAt: string | null;
  lastSyncedAt: string | null;
  status: SpoolStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SpoolmanStatus {
  configured: boolean;
  endpoint: string | null;
  state: SpoolmanState;
  error: string | null;
}

export interface SpoolmanSyncResult {
  created: number;
  updated: number;
  skipped: number;
}

export interface SpoolmanRemoteSpool {
  spoolmanId: number;
  brand: string;
  name: string | null;
  material: string;
  color: string | null;
  colorHex: string | null;
  totalGrams: number;
  remainingG: number;
  weightGrams: number | null;
  diameter: number | null;
  printTempMin: number | null;
  printTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  price: number | null;
  notes: string;
}

export interface SpoolInput {
  brand: string;
  material: string;
  color: string;
  colorHex: string;
  totalGrams: number;
  remainingG: number;
  price: number;
  notes: string;
  shopUrl?: string;
}

// ── Value helpers ──────────────────────────────────────────────────────────────

export const LOW_STOCK_THRESHOLD_G = 200;

export function isLowStock(spool: Spool): boolean {
  return spool.status === 'active' && spool.remainingG < LOW_STOCK_THRESHOLD_G;
}

export function getRemainingPercent(spool: Spool): number {
  if (spool.totalGrams === 0) return 0;
  return Math.min(100, Math.round((spool.remainingG / spool.totalGrams) * 100));
}

export function getTotalInventoryValue(spools: Spool[]): number {
  return spools.reduce((sum, s) => {
    if (s.totalGrams === 0) return sum;
    const costPerG = s.price / s.totalGrams;
    return sum + costPerG * s.remainingG;
  }, 0);
}

export function getAverageCostPerKg(spools: Spool[]): number {
  const active = spools.filter((s) => s.price > 0 && s.totalGrams > 0);
  if (active.length === 0) return 0;
  const avg = active.reduce((sum, s) => sum + (s.price / s.totalGrams) * 1000, 0) / active.length;
  return avg;
}
