import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BarChart2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { apiGetProjects } from '@/components/filament-challenge/tracker-api';
import { StatsFilterBar } from './stats-filter-bar';
import { StatsMetricCards } from './stats-metric-cards';
import { StatsCharts } from './stats-charts';
import { StatsInsights } from './stats-insights';
import { StatsExportButtons } from './stats-export-buttons';
import { StatsPiecesTable } from './stats-pieces-table';
import { useStatsQuery, useStatsPiecesQuery } from '../api/use-stats';
import type { StatsFilters } from '../types';
import { GuestBanner } from '@/components/guest-banner';
import { mockStatsResponse } from '@/data/mockData';

type ActiveView = 'overview' | 'pieces';

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

function calcPeriodDays(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T23:59:59`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 30;
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

export function StatsDashboard() {
  const { t } = useTranslation();
  const { user, isGuest } = useAuth();
  const [filters, setFilters]       = useState<StatsFilters>(getDefaultFilters);
  const [activeView, setActiveView] = useState<ActiveView>('overview');

  const periodDays = useMemo(
    () => calcPeriodDays(filters.from, filters.to),
    [filters.from, filters.to],
  );

  const projectsQuery = useQuery({
    queryKey: ['tracker-projects-for-stats'],
    queryFn:  apiGetProjects,
    staleTime: 5 * 60 * 1000,
    enabled:   Boolean(user),
  });

  const statsQuery  = useStatsQuery(filters);
  const piecesQuery = useStatsPiecesQuery(filters, activeView === 'pieces');

  if (isGuest) {
    return (
      <div className="space-y-6">
        <GuestBanner message="Estadisticas de ejemplo. Inicia sesion para ver tus datos reales." />
        <PageHeader activeView="overview" onViewChange={() => {}} showDetailToggle={false} />
        <StatsMetricCards summary={mockStatsResponse.summary} periodDays={30} />
        <StatsCharts
          timeSeries={mockStatsResponse.timeSeries}
          byProject={mockStatsResponse.byProject}
          summary={mockStatsResponse.summary}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
        <BarChart2 className="h-12 w-12 opacity-30" />
        <p className="text-sm">{t('stats_login_required')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader activeView={activeView} onViewChange={setActiveView} />

      <StatsFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        projects={projectsQuery.data ?? []}
      />

      {activeView === 'overview' && (
        <>
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
                onOpenPieces={() => setActiveView('pieces')}
              />
              <div className="flex justify-end">
                <StatsExportButtons data={statsQuery.data} filters={filters} />
              </div>
            </>
          )}
        </>
      )}

      {activeView === 'pieces' && (
        <StatsPiecesTable
          pieces={piecesQuery.data?.pieces ?? []}
          isLoading={piecesQuery.isLoading}
          isError={piecesQuery.isError}
        />
      )}
    </div>
  );
}

interface PageHeaderProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  showDetailToggle?: boolean;
}

function PageHeader({ activeView, onViewChange, showDetailToggle = true }: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <BarChart2 className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold">{t('stats_title')}</h2>
          <p className="text-sm text-muted-foreground">{t('stats_subtitle')}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card/80 p-1 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => onViewChange('overview')}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
            activeView === 'overview'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('stats_view_overview')}
        </button>
        {showDetailToggle ? (
          <button
            type="button"
            onClick={() => onViewChange('pieces')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              activeView === 'pieces'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('stats_view_detail')}
        </button>
        ) : null}
      </div>
    </div>
  );
}
