import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, ChevronDown, TrendingUp, FolderOpen, Loader2, Check } from 'lucide-react';
import { buildCsv, downloadTextFile, getCsvSeparator } from '@/lib/export-utils';
import type { StatsResponse } from '../types';
import type { StatsFilters } from '../types';

interface StatsExportButtonsProps {
  data: StatsResponse;
  filters: StatsFilters;
}

type ExportState = 'idle' | 'loading' | 'done';

// ── Filename builder ──────────────────────────────────────────────────────────

function buildFilename(prefix: string, filters: StatsFilters): string {
  const from = filters.from.replace(/-/g, '');
  const to   = filters.to.replace(/-/g, '');
  return `filamentos_${prefix}_${from}-${to}.csv`;
}

// ── CSV builders ──────────────────────────────────────────────────────────────

function buildTrendCsv(data: StatsResponse, filters: StatsFilters, t: (k: string) => string): string {
  const sep = getCsvSeparator();

  // Metadata header block — shows active filters inside the file
  const meta: unknown[][] = [
    [t('stats_export_meta_generated'), new Date().toLocaleString()],
    [t('stats_export_meta_period'),    `${filters.from} → ${filters.to}`],
    [t('stats_export_meta_project'),   filters.projectId === 'all' ? t('stats_filter_all_projects') : filters.projectId],
    [t('stats_export_meta_status'),    filters.status === 'all' ? t('tracker.filter.all') : filters.status],
    [t('stats_export_meta_grouping'),  t(`stats_granularity_${filters.granularity}`)],
    [],  // blank separator row
  ];

  const headers = [
    t('stats_export_col_period'),
    t('stats_export_col_pieces'),
    t('stats_export_col_grams_g'),
    t('stats_export_col_grams_kg'),
    t('stats_export_col_cost'),
    t('stats_export_col_hours'),
  ];

  const rows = data.timeSeries.map((p) => [
    p.period,
    p.pieces,
    p.grams.toFixed(2),
    (p.grams / 1000).toFixed(3),
    p.cost.toFixed(2),
    (p.secs / 3600).toFixed(2),
  ]);

  return buildCsv([...meta, headers, ...rows], sep);
}

function buildProjectCsv(data: StatsResponse, filters: StatsFilters, t: (k: string) => string): string {
  const sep = getCsvSeparator();

  const meta: unknown[][] = [
    [t('stats_export_meta_generated'), new Date().toLocaleString()],
    [t('stats_export_meta_period'),    `${filters.from} → ${filters.to}`],
    [t('stats_export_meta_status'),    filters.status === 'all' ? t('tracker.filter.all') : filters.status],
    [],
  ];

  const headers = [
    t('stats_export_col_project'),
    t('stats_export_col_pieces'),
    t('stats_export_col_grams_g'),
    t('stats_export_col_grams_kg'),
    t('stats_export_col_cost'),
    t('stats_export_col_avg_cost'),
    t('stats_export_col_hours'),
  ];

  const rows = data.byProject.map((p) => {
    const avgCost = p.pieces > 0 ? p.cost / p.pieces : 0;
    return [
      p.title,
      p.pieces,
      p.grams.toFixed(2),
      (p.grams / 1000).toFixed(3),
      p.cost.toFixed(2),
      avgCost.toFixed(2),
      (p.secs / 3600).toFixed(2),
    ];
  });

  return buildCsv([...meta, headers, ...rows], sep);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StatsExportButtons({ data, filters }: StatsExportButtonsProps) {
  const { t } = useTranslation();
  const [open, setOpen]           = useState(false);
  const [trendState, setTrend]    = useState<ExportState>('idle');
  const [projectState, setProject]= useState<ExportState>('idle');
  const menuRef                   = useRef<HTMLDivElement>(null);

  function closeMenu() { setOpen(false); }

  async function withFeedback(setter: (s: ExportState) => void, fn: () => void) {
    setter('loading');
    closeMenu();
    await new Promise((r) => setTimeout(r, 300)); // let UI update
    fn();
    setter('done');
    setTimeout(() => setter('idle'), 2000);
  }

  function exportTrend() {
    withFeedback(setTrend, () => {
      const csv = buildTrendCsv(data, filters, t);
      downloadTextFile(csv, buildFilename('evolucion', filters), 'text/csv;charset=utf-8;');
    });
  }

  function exportProjects() {
    withFeedback(setProject, () => {
      const csv = buildProjectCsv(data, filters, t);
      downloadTextFile(csv, buildFilename('proyectos', filters), 'text/csv;charset=utf-8;');
    });
  }

  const menuItems = [
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: t('stats_export_trend'),
      sub: t('stats_export_trend_sub'),
      state: trendState,
      onClick: exportTrend,
    },
    {
      icon: <FolderOpen className="h-4 w-4" />,
      label: t('stats_export_projects'),
      sub: t('stats_export_projects_sub'),
      state: projectState,
      onClick: exportProjects,
    },
  ];

  const anyLoading = trendState === 'loading' || projectState === 'loading';

  return (
    <div className="relative" ref={menuRef}>
      {/* Main button */}
      <button
        type="button"
        disabled={anyLoading}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {anyLoading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Download className="h-3.5 w-3.5" />
        }
        {t('stats_export_main')}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {open && (
        <>
          {/* Click-outside overlay */}
          <div className="fixed inset-0 z-40" onClick={closeMenu} />

          <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-[16px] border border-border/60 bg-card/95 shadow-2xl backdrop-blur-md">
            <p className="border-b border-border/40 px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
              {t('stats_export_choose')}
            </p>
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                disabled={item.state !== 'idle'}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed"
              >
                <span className={`mt-0.5 shrink-0 ${item.state === 'done' ? 'text-emerald-500' : 'text-primary'}`}>
                  {item.state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" />
                   : item.state === 'done'  ? <Check className="h-4 w-4" />
                   : item.icon}
                </span>
                <span>
                  <p className="text-xs font-bold text-foreground">{item.label}</p>
                  <p className="text-[0.68rem] text-muted-foreground">{item.sub}</p>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
