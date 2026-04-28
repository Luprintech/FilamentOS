import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BarChart2, List } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { apiGetProjects } from '@/components/filament-challenge/tracker-api';
import { StatsFilterBar } from './stats-filter-bar';
import { StatsMetricCards } from './stats-metric-cards';
import { StatsCharts } from './stats-charts';
import { StatsInsights } from './stats-insights';
import { StatsExportButtons } from './stats-export-buttons';
import { StatsPiecesPanel } from './stats-pieces-panel';
import { useStatsQuery, useStatsPiecesQuery } from '../api/use-stats';
import type { StatsFilters } from '../types';
import { GuestBanner } from '@/components/guest-banner';
import { mockStatsResponse } from '@/data/mockData';

function getDefaultFilters(): StatsFilters {
  const now = new Date();
  return {
    from:        `${now.getFullYear()}-01-01`,
    to:          now.toISOString().slice(0, 10),
    projectId:   'all',
    status:      'all',
    granularity: 'month',
    preset:      'thisYear',
    source:      'all',
  };
}

/** Number of calendar days between two ISO date strings */
function calcPeriodDays(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T23:59:59`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 30;
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

/** Human-readable period label for the pieces panel header */
function buildPeriodLabel(from: string, to: string): string {
  if (from === to) return from;
  return `${from} → ${to}`;
}

export function StatsDashboard() {
  const { t } = useTranslation();
  const { user, isGuest } = useAuth();
  const [filters, setFilters] = useState<StatsFilters>(getDefaultFilters);
  const [piecePanelOpen, setPiecePanelOpen] = useState(false);

  const periodDays = useMemo(
    () => calcPeriodDays(filters.from, filters.to),
    [filters.from, filters.to],
  );

  const projectsQuery = useQuery({
    queryKey: ['tracker-projects-for-stats'],
    queryFn: apiGetProjects,
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(user),
  });

  // Single source of truth — all child components receive data from here
  const statsQuery = useStatsQuery(filters);

  // Piece detail query — lazy, only when panel is open
  const piecesQuery = useStatsPiecesQuery(filters, piecePanelOpen);

  // ── Guest mode ───────────────────────────────────────────────────────────
  if (isGuest) {
    return (
      <div className="space-y-6">
        <GuestBanner message="👀 Estadísticas de ejemplo. Inicia sesión para ver tus datos reales." />
        <PageHeader onOpenPieces={() => setPiecePanelOpen(true)} />
        <StatsMetricCards summary={mockStatsResponse.summary} periodDays={30} />
        <StatsCharts
          timeSeries={mockStatsResponse.timeSeries}
          byProject={mockStatsResponse.byProject}
          summary={mockStatsResponse.summary}
        />
      </div>
    );
  }

  // ── Sin sesión ───────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
        <BarChart2 className="h-12 w-12 opacity-30" />
        <p className="text-sm">{t('stats_login_required')}</p>
      </div>
    );
  }

  // ── Datos reales ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader onOpenPieces={() => setPiecePanelOpen(true)} />

      <StatsFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        projects={projectsQuery.data ?? []}
      />

      {statsQuery.isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {statsQuery.isError && !statsQuery.isLoading && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {t('stats_error_load')}: {statsQuery.error?.message}
        </div>
      )}

      {statsQuery.isSuccess && statsQuery.data.summary.totalPieces === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/60 bg-card/50 py-20">
          <BarChart2 className="h-10 w-10 opacity-20" />
          <p className="text-sm font-semibold text-muted-foreground">{t('stats_empty')}</p>
          <p className="text-xs text-muted-foreground/60">{t('stats_empty_hint')}</p>
        </div>
      )}

      {statsQuery.isSuccess && statsQuery.data.summary.totalPieces > 0 && (
        <>
          <StatsMetricCards
            summary={statsQuery.data.summary}
            periodDays={periodDays}
          />

          <StatsInsights
            data={statsQuery.data}
            periodDays={periodDays}
          />

          <StatsCharts
            timeSeries={statsQuery.data.timeSeries}
            byProject={statsQuery.data.byProject}
            summary={statsQuery.data.summary}
            onOpenPieces={() => setPiecePanelOpen(true)}
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{t('stats_export_label')}</p>
            <StatsExportButtons
              data={statsQuery.data}
              filters={filters}
            />
          </div>
        </>
      )}

      {/* Pieces drill-down panel */}
      {piecePanelOpen && (
        <StatsPiecesPanel
          pieces={piecesQuery.data?.pieces ?? []}
          isLoading={piecesQuery.isLoading}
          isError={piecesQuery.isError}
          periodLabel={buildPeriodLabel(filters.from, filters.to)}
          onClose={() => setPiecePanelOpen(false)}
        />
      )}
    </div>
  );
}

interface PageHeaderProps {
  onOpenPieces: () => void;
}

function PageHeader({ onOpenPieces }: PageHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <BarChart2 className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">{t('stats_title')}</h2>
          <p className="text-sm text-muted-foreground">{t('stats_subtitle')}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenPieces}
        className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <List className="h-3.5 w-3.5" />
        {t('stats_view_pieces')}
      </button>
    </div>
  );
}
