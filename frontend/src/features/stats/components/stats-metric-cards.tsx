import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Weight, Euro, Clock, TrendingUp, Target, Timer, CheckCircle2 } from 'lucide-react';
import type { StatsSummary } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(totalSecs: number): string {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h >= 100) return `${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatKg(grams: number): string {
  const kg = grams / 1000;
  return kg >= 1 ? `${kg.toFixed(2)} kg` : `${grams.toFixed(1)} g`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ── KPI card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
  trend?: { value: string; positive: boolean };
}

function KpiCard({ icon, iconBg, label, value, sub, trend }: KpiCardProps) {
  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden rounded-[18px] border border-border/60 bg-card/80 p-5 backdrop-blur-sm transition-shadow hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)]">
      {/* Subtle background glow on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--primary)/0.06), transparent)' }} />

      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-black tracking-tight text-foreground">{value}</p>
        {sub && <p className="mt-0.5 text-[0.72rem] text-muted-foreground">{sub}</p>}
      </div>
      {trend && (
        <div className={`inline-flex items-center gap-1 text-[0.72rem] font-bold ${trend.positive ? 'text-emerald-500' : 'text-red-400'}`}>
          <TrendingUp className={`h-3 w-3 ${!trend.positive && 'rotate-180'}`} />
          {trend.value}
        </div>
      )}
    </div>
  );
}

// ── Status breakdown row ───────────────────────────────────────────────────────

const STATUS_CONFIG = [
  { key: 'pending',       color: 'bg-slate-400',   labelKey: 'tracker.status.pending' },
  { key: 'printed',       color: 'bg-blue-500',    labelKey: 'tracker.status.printed' },
  { key: 'postProcessed', color: 'bg-violet-500',  labelKey: 'tracker.status.postProcessed' },
  { key: 'delivered',     color: 'bg-emerald-500', labelKey: 'tracker.status.delivered' },
  { key: 'failed',        color: 'bg-red-500',     labelKey: 'tracker.status.failed' },
] as const;

// ── Main export ────────────────────────────────────────────────────────────────

interface StatsMetricCardsProps {
  summary: StatsSummary;
  /** Total days in the selected period — used to compute pieces/day */
  periodDays?: number;
}

export function StatsMetricCards({ summary, periodDays = 30 }: StatsMetricCardsProps) {
  const { t } = useTranslation();

  const byStatus = summary.byStatus ?? { pending: 0, printed: 0, postProcessed: 0, delivered: 0, failed: 0 };

  // Derived KPIs
  const piecesPerDay     = periodDays > 0 ? summary.totalPieces / periodDays : 0;
  const avgTimePerPiece  = summary.totalPieces > 0 ? summary.totalSecs / summary.totalPieces : 0;
  const avgGramsPerPiece = summary.totalPieces > 0 ? summary.totalGrams / summary.totalPieces : 0;
  const successPieces    = byStatus.printed + byStatus.postProcessed + byStatus.delivered;
  const successRate      = summary.totalPieces > 0 ? (successPieces / summary.totalPieces) * 100 : 0;
  const total = summary.totalPieces;

  return (
    <div className="space-y-4">
      {/* Primary KPIs — 2 cols mobile, 4 desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={<Layers className="h-4 w-4 text-white" />}
          iconBg="bg-blue-500"
          label={t('stats_metric_pieces')}
          value={summary.totalPieces.toLocaleString()}
          sub={t('stats_metric_projects', { count: summary.projectCount })}
        />
        <KpiCard
          icon={<Euro className="h-4 w-4 text-white" />}
          iconBg="bg-violet-500"
          label={t('stats_metric_cost')}
          value={formatCurrency(summary.totalCost)}
          sub={t('stats_metric_avg_cost', { value: formatCurrency(summary.avgCostPerPiece) })}
        />
        <KpiCard
          icon={<Weight className="h-4 w-4 text-white" />}
          iconBg="bg-emerald-500"
          label={t('stats_metric_filament')}
          value={formatKg(summary.totalGrams)}
          sub={`~${formatKg(avgGramsPerPiece)} / ${t('stats_kpi_piece')}`}
        />
        <KpiCard
          icon={<Clock className="h-4 w-4 text-white" />}
          iconBg="bg-orange-500"
          label={t('stats_metric_time')}
          value={formatTime(summary.totalSecs)}
          sub={`~${formatTime(avgTimePerPiece)} / ${t('stats_kpi_piece')}`}
        />
      </div>

      {/* Secondary KPIs — derived */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={<TrendingUp className="h-4 w-4 text-white" />}
          iconBg="bg-sky-500"
          label={t('stats_kpi_per_day')}
          value={piecesPerDay.toFixed(2)}
          sub={t('stats_kpi_per_day_sub')}
        />
        <KpiCard
          icon={<Timer className="h-4 w-4 text-white" />}
          iconBg="bg-amber-500"
          label={t('stats_kpi_avg_time')}
          value={formatTime(avgTimePerPiece)}
          sub={t('stats_kpi_per_piece')}
        />
        <KpiCard
          icon={<Target className="h-4 w-4 text-white" />}
          iconBg="bg-pink-500"
          label={t('stats_kpi_avg_cost')}
          value={formatCurrency(summary.avgCostPerPiece)}
          sub={t('stats_kpi_per_piece')}
        />
        <KpiCard
          icon={<CheckCircle2 className="h-4 w-4 text-white" />}
          iconBg={successRate >= 80 ? 'bg-emerald-500' : successRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}
          label={t('stats_kpi_success_rate')}
          value={`${successRate.toFixed(1)}%`}
          sub={`${successPieces} / ${total} ${t('stats_kpi_pieces_ok')}`}
        />
      </div>

      {/* Status breakdown with stacked bar */}
      {total > 0 && (
        <div className="rounded-[18px] border border-border/60 bg-card/80 p-4 backdrop-blur-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('stats_metric_status_breakdown')}
          </p>

          {/* Stacked bar */}
          <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-muted/40">
            {STATUS_CONFIG.map(({ key, color }) => {
              const val = byStatus[key as keyof typeof byStatus];
              const pct = total > 0 ? (val / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={key}
                  className={`${color} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                  title={`${t(`tracker.status.${key === 'postProcessed' ? 'postProcessed' : key}` as const)}: ${val}`}
                />
              );
            })}
          </div>

          {/* Legend chips */}
          <div className="flex flex-wrap gap-2">
            {STATUS_CONFIG.map(({ key, color, labelKey }) => {
              const val = byStatus[key as keyof typeof byStatus];
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
              return (
                <div key={key} className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background/40 px-3 py-1.5">
                  <div className={`h-2 w-2 rounded-full ${color}`} />
                  <span className="text-[0.7rem] font-semibold text-muted-foreground">{t(labelKey as any)}</span>
                  <span className="text-[0.7rem] font-black text-foreground">{val}</span>
                  <span className="text-[0.65rem] text-muted-foreground/60">({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
