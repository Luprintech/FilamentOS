/**
 * StatsPiecesPanel — slide-in drawer that shows the piece detail list
 * for the currently active filter period.
 */
import { X, Loader2, Package, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { StatsPieceDetail } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:        'bg-slate-400/15 text-slate-400 border-slate-400/30',
  printed:        'bg-blue-500/15 text-blue-400 border-blue-500/30',
  post_processed: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  delivered:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  failed:         'bg-red-500/15 text-red-400 border-red-500/30',
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

// ── Main ──────────────────────────────────────────────────────────────────────

interface StatsPiecesPanelProps {
  pieces: StatsPieceDetail[];
  isLoading: boolean;
  isError: boolean;
  /** e.g. "2024-03" or "2024-01-15" — shown in the panel header */
  periodLabel?: string;
  onClose: () => void;
}

export function StatsPiecesPanel({
  pieces,
  isLoading,
  isError,
  periodLabel,
  onClose,
}: StatsPiecesPanelProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-border/60 bg-card/95 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Package className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">
                {t('stats_pieces_panel_title')}
              </p>
              {periodLabel && (
                <p className="text-[0.7rem] text-muted-foreground">{periodLabel}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {isError && !isLoading && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {t('stats_error_load')}
            </div>
          )}

          {!isLoading && !isError && pieces.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <BarChart2 className="h-8 w-8 opacity-20" />
              <p className="text-sm text-muted-foreground">{t('stats_pieces_empty')}</p>
            </div>
          )}

          {!isLoading && !isError && pieces.length > 0 && (
            <div className="space-y-2">
              {/* Summary bar */}
              <div className="mb-3 flex flex-wrap gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-xs">
                <span className="font-bold text-foreground">{pieces.length} {t('stats_kpi_pieces_ok')}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {formatKg(pieces.reduce((s, p) => s + p.totalGrams, 0))}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {formatCost(pieces.reduce((s, p) => s + p.totalCost, 0))} €
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {formatTime(pieces.reduce((s, p) => s + p.totalSecs, 0))}
                </span>
              </div>

              {pieces.map((piece) => (
                <div
                  key={piece.id}
                  className="flex flex-col gap-1.5 rounded-[14px] border border-border/40 bg-background/40 p-3 transition-colors hover:bg-muted/20"
                >
                  {/* Row 1: name + status */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-foreground leading-snug">{piece.name}</p>
                    <StatusBadge status={piece.status} t={t} />
                  </div>
                  {/* Row 2: project + date */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[0.7rem] text-muted-foreground">
                    <span className="font-medium text-foreground/70">{piece.projectTitle}</span>
                    {piece.label && (
                      <>
                        <span>·</span>
                        <span>{piece.label}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{formatDate(piece.date)}</span>
                  </div>
                  {/* Row 3: metrics */}
                  <div className="flex flex-wrap gap-3 text-[0.7rem]">
                    <span className="text-muted-foreground">
                      <span className="font-bold text-foreground">{formatKg(piece.totalGrams)}</span>
                    </span>
                    <span className="text-muted-foreground">
                      <span className="font-bold text-foreground">{formatCost(piece.totalCost)} €</span>
                    </span>
                    <span className="text-muted-foreground">
                      <span className="font-bold text-foreground">{formatTime(piece.totalSecs)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
