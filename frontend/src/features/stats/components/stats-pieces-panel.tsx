/**
 * StatsPiecesPanel — slide-in drawer that shows the piece detail list
 * for the currently active filter period.
 */
import { Loader2, Package, BarChart2, CalendarDays, FolderKanban, Tag, Weight, Euro, Clock3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pieces: StatsPieceDetail[];
  isLoading: boolean;
  isError: boolean;
  /** e.g. "2024-03" or "2024-01-15" — shown in the panel header */
  periodLabel?: string;
}

export function StatsPiecesPanel({
  open,
  onOpenChange,
  pieces,
  isLoading,
  isError,
  periodLabel,
}: StatsPiecesPanelProps) {
  const { t } = useTranslation();
  const totalGrams = pieces.reduce((sum, piece) => sum + piece.totalGrams, 0);
  const totalCost = pieces.reduce((sum, piece) => sum + piece.totalCost, 0);
  const totalSecs = pieces.reduce((sum, piece) => sum + piece.totalSecs, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        onOverlayClick={() => onOpenChange(false)}
        className="flex w-full flex-col gap-0 overflow-hidden border-l border-border/60 bg-card/95 p-0 shadow-2xl backdrop-blur-md sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border/60 px-6 py-5 pr-14 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <Package className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-base font-black tracking-tight">
                {t('stats_pieces_panel_title')}
              </SheetTitle>
              <SheetDescription className="mt-1 text-xs">
                {periodLabel ?? t('stats_pieces_empty')}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {isLoading && (
            <div className="flex items-center justify-center py-20" aria-live="polite">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {isError && !isLoading && (
            <div className="rounded-[18px] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {t('stats_error_load')}
            </div>
          )}

          {!isLoading && !isError && pieces.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-border/60 bg-muted/20 px-4 py-20 text-center">
              <BarChart2 className="h-8 w-8 opacity-20" />
              <p className="text-sm text-muted-foreground">{t('stats_pieces_empty')}</p>
            </div>
          )}

          {!isLoading && !isError && pieces.length > 0 && (
            <div className="space-y-4">
              <section className="rounded-[20px] border border-border/60 bg-card/80 p-4 backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-black text-foreground">{pieces.length} {t('stats_kpi_pieces_ok')}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{formatKg(totalGrams)}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{formatCost(totalCost)} €</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{formatTime(totalSecs)}</span>
                </div>
              </section>

              <div className="space-y-3">
                {pieces.map((piece) => (
                  <article
                    key={piece.id}
                    className="rounded-[20px] border border-border/60 bg-card/80 p-4 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-base font-black leading-tight text-foreground">{piece.name}</p>
                        <p className="text-sm font-medium text-muted-foreground">{piece.projectTitle}</p>
                      </div>
                      <StatusBadge status={piece.status} t={t} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-[0.72rem] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2.5 py-1">
                        <FolderKanban className="h-3.5 w-3.5" />
                        {piece.projectTitle}
                      </span>
                      {piece.label && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2.5 py-1">
                          <Tag className="h-3.5 w-3.5" />
                          {piece.label}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2.5 py-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(piece.date)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-[18px] border border-border/60 bg-background/60 p-3">
                        <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          <Weight className="h-3.5 w-3.5" />
                          {t('stats_metric_filament')}
                        </div>
                        <p className="mt-2 text-sm font-black text-foreground">{formatKg(piece.totalGrams)}</p>
                      </div>
                      <div className="rounded-[18px] border border-border/60 bg-background/60 p-3">
                        <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          <Euro className="h-3.5 w-3.5" />
                          {t('stats_metric_cost')}
                        </div>
                        <p className="mt-2 text-sm font-black text-foreground">{formatCost(piece.totalCost)} €</p>
                      </div>
                      <div className="rounded-[18px] border border-border/60 bg-background/60 p-3">
                        <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          {t('stats_metric_time')}
                        </div>
                        <p className="mt-2 text-sm font-black text-foreground">{formatTime(piece.totalSecs)}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
