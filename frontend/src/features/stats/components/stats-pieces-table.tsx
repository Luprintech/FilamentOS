import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, BarChart2, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PaginationBar } from '@/components/ui/pagination-bar';
import type { StatsPieceDetail } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
function formatKg(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${grams.toFixed(1)} g`;
}
function formatCost(value: number): string {
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}
function calcEfficiency(cost: number, secs: number): number {
  return secs > 0 ? cost / (secs / 3600) : 0;
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:        'bg-slate-400/15 text-slate-400 border-slate-400/30',
  printed:        'bg-blue-500/15 text-blue-400 border-blue-500/30',
  post_processed: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  delivered:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  failed:         'bg-red-500/15 text-red-400 border-red-500/30',
};

const STATUS_ACCENT: Record<string, string> = {
  pending:        'border-t-slate-400/60',
  printed:        'border-t-blue-500/60',
  post_processed: 'border-t-violet-500/60',
  delivered:      'border-t-emerald-500/60',
  failed:         'border-t-red-500/60',
};

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const key = status === 'post_processed' ? 'tracker.status.postProcessed' : `tracker.status.${status}`;
  const style = STATUS_STYLES[status] ?? 'bg-muted/40 text-muted-foreground border-border/50';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.62rem] font-bold ${style}`}>
      {t(key as any)}
    </span>
  );
}

// ── Mini barra ────────────────────────────────────────────────────────────────

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted/40">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

// ── Tarjeta de resumen (top) ──────────────────────────────────────────────────

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[18px] border border-border/60 bg-card/80 p-4 backdrop-blur-sm">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="text-xl font-black tracking-tight text-foreground">{value}</p>
      {sub && <p className="text-[0.7rem] text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── Métrica chip ──────────────────────────────────────────────────────────────

function MetricBox({
  label, value, pct, barColor,
}: { label: string; value: string; pct: number; barColor: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-border/40 bg-muted/20 px-3 py-2">
      <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
      <MiniBar pct={pct} color={barColor} />
    </div>
  );
}

// ── Pieza card ────────────────────────────────────────────────────────────────

function PieceCard({
  piece, totalGrams, totalCost, totalSecs, avgEfficiency,
}: {
  piece: StatsPieceDetail;
  totalGrams: number;
  totalCost: number;
  totalSecs: number;
  avgEfficiency: number;
}) {
  const { t } = useTranslation();

  const gramsPct  = totalGrams > 0 ? (piece.totalGrams / totalGrams) * 100 : 0;
  const costPct   = totalCost  > 0 ? (piece.totalCost  / totalCost)  * 100 : 0;
  const secsPct   = totalSecs  > 0 ? (piece.totalSecs  / totalSecs)  * 100 : 0;
  const efficiency = calcEfficiency(piece.totalCost, piece.totalSecs);

  const effRatio  = avgEfficiency > 0 ? efficiency / avgEfficiency : 1;
  const effClass  =
    effRatio <= 0.8  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
    effRatio <= 1.25 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                       'bg-red-500/15 text-red-400 border-red-500/30';

  const accentBorder = STATUS_ACCENT[piece.status] ?? 'border-t-border/60';

  return (
    <div className={`flex flex-col gap-3 rounded-[18px] border border-border/60 bg-card/80 overflow-hidden border-t-2 ${accentBorder} transition-shadow hover:shadow-md`}>

      {/* Image */}
      {piece.imageUrl && (
        <div className="relative h-36 w-full overflow-hidden bg-muted/40">
          <img
            src={piece.imageUrl}
            alt={piece.name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground leading-tight">{piece.name}</p>
          {piece.label && piece.label !== piece.name && (
            <p className="truncate text-[0.68rem] text-muted-foreground/70">{piece.label}</p>
          )}
          <div className="mt-1">
            {piece.source === 'tracker' ? (
              <p className="truncate text-[0.72rem] text-muted-foreground">{piece.projectTitle}</p>
            ) : (
              <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[0.60rem] font-semibold text-violet-400">
                Calculadora
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={piece.status} t={t} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-1.5 px-4">
        <MetricBox
          label={t('stats_pieces_table_filament')}
          value={formatKg(piece.totalGrams)}
          pct={gramsPct}
          barColor="bg-emerald-500/70"
        />
        <MetricBox
          label={t('stats_pieces_table_cost')}
          value={`${formatCost(piece.totalCost)} €`}
          pct={costPct}
          barColor="bg-violet-500/70"
        />
        <MetricBox
          label={t('stats_pieces_table_time')}
          value={formatTime(piece.totalSecs)}
          pct={secsPct}
          barColor="bg-blue-500/70"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-4">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.62rem] font-bold ${effClass}`}>
          ⚡ {formatCost(efficiency)} €/h
        </span>
        <span className="text-[0.68rem] text-muted-foreground">{formatDate(piece.date)}</span>
      </div>
    </div>
  );
}

// ── Fila compacta (vista lista) ───────────────────────────────────────────────

function PieceRow({
  piece, totalGrams, totalCost, totalSecs, avgEfficiency,
}: {
  piece: StatsPieceDetail;
  totalGrams: number;
  totalCost: number;
  totalSecs: number;
  avgEfficiency: number;
}) {
  const { t } = useTranslation();

  const efficiency = calcEfficiency(piece.totalCost, piece.totalSecs);
  const effRatio   = avgEfficiency > 0 ? efficiency / avgEfficiency : 1;
  const effClass   =
    effRatio <= 0.8  ? 'text-emerald-400' :
    effRatio <= 1.25 ? 'text-amber-400' :
                       'text-red-400';

  const gramsPct = totalGrams > 0 ? (piece.totalGrams / totalGrams) * 100 : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
      {/* Name + project */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground leading-tight">{piece.name}</p>
        {piece.source === 'tracker' ? (
          <p className="truncate text-[0.68rem] text-muted-foreground">{piece.projectTitle}</p>
        ) : (
          <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[0.58rem] font-semibold text-violet-400">
            Calculadora
          </span>
        )}
      </div>

      {/* Status */}
      <div className="hidden sm:block w-24 shrink-0">
        <StatusBadge status={piece.status} t={t} />
      </div>

      {/* Filament bar */}
      <div className="hidden md:flex w-20 shrink-0 flex-col gap-0.5">
        <p className="text-xs font-bold text-foreground text-right">{formatKg(piece.totalGrams)}</p>
        <MiniBar pct={gramsPct} color="bg-emerald-500/70" />
      </div>

      {/* Cost */}
      <div className="w-20 shrink-0 text-right">
        <p className="text-xs font-bold text-foreground">{formatCost(piece.totalCost)} €</p>
        <p className={`text-[0.62rem] font-semibold ${effClass}`}>{formatCost(efficiency)} €/h</p>
      </div>

      {/* Time */}
      <div className="hidden sm:block w-16 shrink-0 text-right">
        <p className="text-xs text-muted-foreground">{formatTime(piece.totalSecs)}</p>
      </div>

      {/* Date */}
      <div className="hidden lg:block w-24 shrink-0 text-right">
        <p className="text-[0.68rem] text-muted-foreground">{formatDate(piece.date)}</p>
      </div>
    </div>
  );
}

// ── Tipos para ordenación ─────────────────────────────────────────────────────

type SortKey = 'name' | 'date' | 'totalGrams' | 'totalCost' | 'totalSecs' | 'efficiency';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 24; // múltiplo de 3 para grid de 3 cols

// ── Componente principal ──────────────────────────────────────────────────────

interface StatsPiecesTableProps {
  pieces: StatsPieceDetail[];
  isLoading: boolean;
  isError: boolean;
}

export function StatsPiecesTable({ pieces, isLoading, isError }: StatsPiecesTableProps) {
  const { t } = useTranslation();

  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page,    setPage]    = useState(1);
  const [sortOpen, setSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ── Totales ──────────────────────────────────────────────────────────────

  const totalGrams = useMemo(() => pieces.reduce((s, p) => s + p.totalGrams, 0), [pieces]);
  const totalCost  = useMemo(() => pieces.reduce((s, p) => s + p.totalCost,  0), [pieces]);
  const totalSecs  = useMemo(() => pieces.reduce((s, p) => s + p.totalSecs,  0), [pieces]);
  const avgEfficiency  = totalSecs > 0 ? totalCost / (totalSecs / 3600) : 0;
  const avgCost        = pieces.length > 0 ? totalCost  / pieces.length : 0;
  const avgGrams       = pieces.length > 0 ? totalGrams / pieces.length : 0;

  const uniqueProjects = useMemo(() => {
    const trackerProjects = new Set(
      pieces.filter((p) => p.source === 'tracker').map((p) => p.projectId),
    ).size;
    const hasCalc = pieces.some((p) => p.source === 'calculator');
    return trackerProjects + (hasCalc ? 1 : 0);
  }, [pieces]);

  // ── Filtrado y ordenación ────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return pieces;
    return pieces.filter(
      (p) => p.name.toLowerCase().includes(q) || p.projectTitle.toLowerCase().includes(q),
    );
  }, [pieces, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      switch (sortKey) {
        case 'name':       va = a.name;  vb = b.name; break;
        case 'date':       va = a.date;  vb = b.date; break;
        case 'totalGrams': va = a.totalGrams; vb = b.totalGrams; break;
        case 'totalCost':  va = a.totalCost;  vb = b.totalCost;  break;
        case 'totalSecs':  va = a.totalSecs;  vb = b.totalSecs;  break;
        case 'efficiency':
          va = calcEfficiency(a.totalCost, a.totalSecs);
          vb = calcEfficiency(b.totalCost, b.totalSecs);
          break;
        default: va = a.date; vb = b.date;
      }
      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      }
      return sortDir === 'asc' ? (va - (vb as number)) : ((vb as number) - va);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
    setSortOpen(false);
  }

  // ── Estados carga / error ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        {t('stats_error_load')}
      </div>
    );
  }

  if (!pieces.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/60 bg-card/50 py-20">
        <BarChart2 className="h-10 w-10 opacity-20" />
        <p className="text-sm font-semibold text-muted-foreground">{t('stats_empty')}</p>
      </div>
    );
  }

  const sortLabels: Record<SortKey, string> = {
    name:       t('stats_pieces_table_name'),
    date:       t('stats_pieces_table_date'),
    totalGrams: t('stats_pieces_table_filament'),
    totalCost:  t('stats_pieces_table_cost'),
    totalSecs:  t('stats_pieces_table_time'),
    efficiency: t('stats_pieces_table_efficiency'),
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <SummaryCard
          label={t('stats_metric_pieces')}
          value={pieces.length.toLocaleString()}
          sub={t('stats_metric_projects', { count: uniqueProjects })}
        />
        <SummaryCard
          label={t('stats_metric_filament')}
          value={formatKg(totalGrams)}
          sub={`~${formatKg(avgGrams)} / ${t('stats_kpi_piece')}`}
        />
        <SummaryCard
          label={t('stats_metric_cost')}
          value={`${formatCost(totalCost)} €`}
          sub={`~${formatCost(avgCost)} € / ${t('stats_kpi_piece')}`}
        />
        <SummaryCard
          label={t('stats_metric_time')}
          value={formatTime(totalSecs)}
          sub={`~${formatTime(totalSecs / Math.max(1, pieces.length))} / ${t('stats_kpi_piece')}`}
        />
        <SummaryCard
          label={t('stats_kpi_efficiency')}
          value={`${formatCost(avgEfficiency)} €/h`}
          sub={t('stats_kpi_efficiency_sub')}
        />
      </div>

      {/* Barra de búsqueda y ordenación */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder={t('stats_pieces_search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-8 max-w-xs text-xs"
        />

        <p className="text-xs text-muted-foreground">
          {filtered.length !== pieces.length
            ? t('stats_pieces_results', { count: filtered.length, total: pieces.length })
            : t('stats_pieces_showing', { count: pieces.length })}
        </p>

        {/* View toggle + Sort dropdown */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-border/60">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 text-xs transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-card/80 text-muted-foreground hover:text-foreground'}`}
              title="Vista grid"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 text-xs transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card/80 text-muted-foreground hover:text-foreground'}`}
              title="Vista lista"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-[0.72rem] font-bold text-foreground transition-colors hover:bg-muted/60"
          >
            {sortLabels[sortKey]}
            <span className="text-[0.6rem] text-muted-foreground">{sortDir === 'asc' ? '↑' : '↓'}</span>
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-[14px] border border-border/60 bg-card/95 shadow-xl backdrop-blur-md">
                {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSort(key)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-muted/50 ${sortKey === key ? 'font-bold text-primary' : 'text-foreground'}`}
                  >
                    {sortLabels[key]}
                    {sortKey === key && <span className="text-[0.6rem]">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Grid / Lista de cards */}
      {viewMode === 'grid' ? (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {paginated.map((piece) => (
          <PieceCard
            key={piece.id}
            piece={piece}
            totalGrams={totalGrams}
            totalCost={totalCost}
            totalSecs={totalSecs}
            avgEfficiency={avgEfficiency}
          />
        ))}
      </div>
      ) : (
      <div className="flex flex-col divide-y divide-border/40 rounded-[18px] border border-border/60 bg-card/80 overflow-hidden">
        {paginated.map((piece) => (
          <PieceRow
            key={piece.id}
            piece={piece}
            totalGrams={totalGrams}
            totalCost={totalCost}
            totalSecs={totalSecs}
            avgEfficiency={avgEfficiency}
          />
        ))}
      </div>
      )}

      {/* Paginación */}
      <PaginationBar
        page={page}
        totalPages={totalPages}
        totalItems={sorted.length}
        itemLabel={t('pieces_count_suffix') ?? 'piezas'}
        onChange={setPage}
      />
    </div>
  );
}
