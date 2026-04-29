// ── Stats Types ───────────────────────────────────────────────────────────────

export type Granularity = 'day' | 'week' | 'month';

export type DatePreset = 'today' | 'last7' | 'last30' | 'thisYear' | 'all';

export interface StatsFilters {
  from: string;       // ISO date string YYYY-MM-DD
  to: string;         // ISO date string YYYY-MM-DD
  projectId: string;  // 'all' or a project UUID
  status: string;     // 'all' or lifecycle status
  granularity: Granularity;
  preset: DatePreset | 'custom';
  source: 'all' | 'tracker' | 'calculator';
}

export interface StatsSummary {
  totalPieces: number;
  totalGrams: number;
  totalCost: number;
  totalSecs: number;
  avgCostPerPiece: number;
  projectCount: number;
  byStatus: {
    pending: number;
    printed: number;
    postProcessed: number;
    delivered: number;
    failed: number;
  };
}

export interface StatsTimePoint {
  period: string;  // 'YYYY-MM-DD' | 'YYYY-WNN' | 'YYYY-MM'
  pieces: number;
  grams: number;
  cost: number;
  secs: number;
}

export interface StatsProjectRow {
  projectId: string;
  title: string;
  source: string;
  pieces: number;
  grams: number;
  cost: number;
  secs: number;
}

export interface StatsResponse {
  summary: StatsSummary;
  timeSeries: StatsTimePoint[];
  byProject: StatsProjectRow[];
}

/** Row shape used when building a CSV export */
export interface StatsExportRow {
  period: string;
  pieces: number;
  grams: number;
  kg: number;
  cost: number;
  hours: number;
}

/** Individual piece detail returned by /api/stats/pieces */
export interface StatsPieceDetail {
  id: string;
  name: string;
  label: string;
  projectTitle: string;
  projectId: string;
  status: string;
  totalGrams: number;
  totalCost: number;
  totalSecs: number;
  date: string;
  source: string;
  imageUrl?: string | null;
}

export interface StatsPiecesResponse {
  pieces: StatsPieceDetail[];
}

