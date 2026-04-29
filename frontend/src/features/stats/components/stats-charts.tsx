import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Clock, Weight, Euro, ArrowUpDown } from 'lucide-react';
import type { StatsTimePoint, StatsProjectRow, StatsSummary } from '../types';

// ── Palette ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:       '#94a3b8',
  printed:       '#3b82f6',
  postProcessed: '#8b5cf6',
  delivered:     '#10b981',
  failed:        '#ef4444',
};

const PROJECT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPeriodLabel(period: string): string {
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-');
    return new Date(Number(year), Number(month) - 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    return new Date(period + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return period;
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatKg(g: number): string {
  return g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${g.toFixed(1)} g`;
}

function formatCost(v: number): string {
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[12px] border border-border/60 bg-card/95 p-3 text-xs shadow-2xl backdrop-blur-md">
      {label && <p className="mb-1.5 font-bold text-foreground">{label}</p>}
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-bold text-foreground">
            {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[18px] border border-border/60 bg-card/80 p-5 backdrop-blur-sm ${className}`}>
      <h3 className="mb-4 text-sm font-bold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  const { t } = useTranslation();
  return (
    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
      {t('stats_empty')}
    </div>
  );
}

// ── 1. Area chart: trend over time ────────────────────────────────────────────

function TrendChart({ data }: { data: StatsTimePoint[] }) {
  const { t } = useTranslation();

  const formatted = data.map((p) => ({
    ...p,
    periodLabel: formatPeriodLabel(p.period),
    kg: parseFloat((p.grams / 1000).toFixed(3)),
    hours: parseFloat((p.secs / 3600).toFixed(2)),
  }));

  if (!formatted.length) return <EmptyChart />;

  // Single data point — area chart can't draw a line, use dual-axis bar instead
  if (formatted.length === 1) {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={formatted} margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="periodLabel" tick={{ fontSize: 10 }} />
          <YAxis yAxisId="left"  tick={{ fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left"  dataKey="pieces" name={t('stats_chart_pieces')} fill="#3b82f6" radius={[6,6,0,0]} />
          <Bar yAxisId="right" dataKey="kg"     name={t('stats_chart_kg')}     fill="#10b981" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gPieces" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gKg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="periodLabel" tick={{ fontSize: 10 }} />
        <YAxis yAxisId="left"  tick={{ fontSize: 10 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area yAxisId="left"  type="monotone" dataKey="pieces" name={t('stats_chart_pieces')} stroke="#3b82f6" fill="url(#gPieces)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        <Area yAxisId="right" type="monotone" dataKey="kg"     name={t('stats_chart_kg')}     stroke="#10b981" fill="url(#gKg)"     strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── 2. Cumulative line chart ──────────────────────────────────────────────────

function CumulativeChart({ data }: { data: StatsTimePoint[] }) {
  const { t } = useTranslation();

  const cumulative = useMemo(() => {
    let cp = 0, cc = 0;
    return data.map((p) => {
      cp += p.pieces;
      cc += p.cost;
      return { periodLabel: formatPeriodLabel(p.period), pieces: cp, cost: parseFloat(cc.toFixed(2)) };
    });
  }, [data]);

  if (!cumulative.length) return <EmptyChart />;

  if (cumulative.length === 1) {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={cumulative} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="periodLabel" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="pieces" name={t('stats_chart_cumulative_pieces')} fill="#8b5cf6" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={cumulative} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gCumPieces" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="periodLabel" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="pieces" name={t('stats_chart_cumulative_pieces')} stroke="#8b5cf6" fill="url(#gCumPieces)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── 3. Donut — status distribution ───────────────────────────────────────────

function StatusDonut({ summary }: { summary: StatsSummary }) {
  const { t } = useTranslation();
  const byStatus = summary.byStatus ?? { pending: 0, printed: 0, postProcessed: 0, delivered: 0, failed: 0 };

  const data = [
    { name: t('tracker.status.pending'),        value: byStatus.pending,       color: STATUS_COLORS.pending },
    { name: t('tracker.status.printed'),        value: byStatus.printed,       color: STATUS_COLORS.printed },
    { name: t('tracker.status.postProcessed'), value: byStatus.postProcessed, color: STATUS_COLORS.postProcessed },
    { name: t('tracker.status.delivered'),      value: byStatus.delivered,     color: STATUS_COLORS.delivered },
    { name: t('tracker.status.failed'),         value: byStatus.failed,        color: STATUS_COLORS.failed },
  ].filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (!total) return <EmptyChart />;

  return (
    <div className="flex flex-col items-center gap-4">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-[0.7rem]">
            <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="font-bold text-foreground">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 4. Project ranking ────────────────────────────────────────────────────────

type RankMetric = 'cost' | 'secs' | 'pieces';

function ProjectRanking({ byProject }: { byProject: StatsProjectRow[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [metric, setMetric] = useState<RankMetric>('cost');

  const sorted = useMemo(
    () => [...byProject].sort((a, b) => b[metric] - a[metric]).slice(0, 8),
    [byProject, metric],
  );

  const maxVal = sorted[0]?.[metric] ?? 1;

  const metricButtons: Array<{ key: RankMetric; label: string; icon: React.ReactNode }> = [
    { key: 'cost',   label: t('stats_rank_cost'),   icon: <Euro   className="h-3 w-3" /> },
    { key: 'secs',   label: t('stats_rank_time'),   icon: <Clock  className="h-3 w-3" /> },
    { key: 'pieces', label: t('stats_rank_pieces'), icon: <Weight className="h-3 w-3" /> },
  ];

  function formatVal(row: StatsProjectRow): string {
    if (metric === 'cost')   return formatCost(row.cost) + ' €';
    if (metric === 'secs')   return formatTime(row.secs);
    return `${row.pieces} pzs`;
  }

  if (!sorted.length) return <EmptyChart />;

  return (
    <div className="space-y-4">
      {/* Metric toggle */}
      <div className="flex gap-1.5">
        {metricButtons.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMetric(key)}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-[0.72rem] font-bold transition-colors ${
              metric === key
                ? 'border-primary/40 bg-primary/15 text-primary'
                : 'border-border/50 bg-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {icon}{label}
          </button>
        ))}
        <div className="ml-auto text-[0.65rem] text-muted-foreground/60 flex items-center gap-1">
          <ArrowUpDown className="h-3 w-3" />
          {t('stats_rank_click_hint')}
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {sorted.map((row, i) => {
          const pct = maxVal > 0 ? (row[metric] / maxVal) * 100 : 0;
          return (
              <button
                key={row.projectId}
                type="button"
                onClick={() => {
                  if (row.source !== 'calculator') {
                    navigate(`/bitacora/${row.projectId}`);
                  }
                }}
                className={`group w-full text-left ${row.source === 'calculator' ? 'cursor-default' : ''}`}
              >
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 text-[0.65rem] font-black text-muted-foreground/50 w-4 text-right">
                    {i + 1}
                  </span>
                  <span className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {row.title}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-black text-foreground">
                  {formatVal(row)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: `${PROJECT_COLORS[i % PROJECT_COLORS.length]}`,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

interface StatsChartsProps {
  timeSeries: StatsTimePoint[];
  byProject: StatsProjectRow[];
  summary: StatsSummary;
  onOpenPieces?: () => void;
}

export function StatsCharts({ timeSeries, byProject, summary, onOpenPieces }: StatsChartsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Row 1: trend + cumulative */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title={t('stats_chart_trend_title')}>
          <TrendChart data={timeSeries} />
        </ChartCard>
        <ChartCard title={t('stats_chart_cumulative_title')}>
          <CumulativeChart data={timeSeries} />
        </ChartCard>
      </div>

      {/* Row 2: donut + ranking */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title={t('stats_chart_status_title')}>
          <StatusDonut summary={summary} />
        </ChartCard>
        <ChartCard title={t('stats_chart_by_project_title')}>
          <ProjectRanking byProject={byProject} />
        </ChartCard>
      </div>

      {/* Drill-down CTA */}
      {onOpenPieces && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onOpenPieces}
            className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
          >
            {t('stats_view_pieces_cta')}
          </button>
        </div>
      )}
    </div>
  );
}

