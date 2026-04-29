import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  GridDensityControl,
  GRID_DENSITY_OPTIONS,
  getGridActionMode,
  getGridColumnsVars,
  type GridActionMode,
  type GridDensity,
} from '@/components/grid-density-control';
import { ArrowUp, ArrowDown, ExternalLink, GripVertical, List, LayoutGrid, Search, X as XIcon, Pencil, Trash2, EyeOff, Eye } from 'lucide-react';
import { PaginationBar } from '@/components/ui/pagination-bar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { secsToString, formatCost } from './filament-storage';
import type { FilamentPiece, FilamentProject, EditingState } from './filament-types';
import { useTranslation } from 'react-i18next';
import { formatDisplayDate } from '@/lib/date-formatter';

export type PieceSortMode = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'cost-desc' | 'cost-asc';
export type PieceViewMode = 'list' | 'grid';

const GRID_DENSITY_STORAGE_KEY = 'filamentos_piece_grid_density';

function loadGridDensity(): GridDensity {
  if (typeof window === 'undefined') return 'compact';
  const saved = window.localStorage.getItem(GRID_DENSITY_STORAGE_KEY);
  return GRID_DENSITY_OPTIONS.includes(saved as GridDensity) ? (saved as GridDensity) : 'compact';
}

function saveGridDensity(value: GridDensity) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GRID_DENSITY_STORAGE_KEY, value);
}

function getPieceDateValue(piece: FilamentPiece): number | null {
  if (!piece.printedAt) return null;
  const value = new Date(piece.printedAt).getTime();
  return Number.isNaN(value) ? null : value;
}

export function sortPieces(pieces: FilamentPiece[], sortMode: PieceSortMode): FilamentPiece[] {
  return [...pieces].sort((a, b) => {
    switch (sortMode) {
      case 'name-asc':  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      case 'name-desc': return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
      case 'cost-desc': return b.totalCost - a.totalCost;
      case 'cost-asc':  return a.totalCost - b.totalCost;
      default: {
        const aDate = getPieceDateValue(a);
        const bDate = getPieceDateValue(b);
        if (aDate === null && bDate === null) return a.orderIndex - b.orderIndex;
        if (aDate === null) return 1;
        if (bDate === null) return -1;
        return sortMode === 'date-desc' ? bDate - aDate : aDate - bDate;
      }
    }
  });
}

interface ChallengePieceListProps {
  project: FilamentProject;
  pieces: FilamentPiece[];
  editingState: EditingState;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void> | void;
  onToggleDisabled?: (id: string) => Promise<void> | void;
  onReorder: (orderedIds: string[]) => Promise<void> | void;
  sortMode: PieceSortMode;
  onSortChange: (mode: PieceSortMode) => void;
  viewMode: PieceViewMode;
  onViewChange: (mode: PieceViewMode) => void;
}

const SORT_OPTIONS: [PieceSortMode, string][] = [
  ['date-desc',  'tracker.sort.newest'],
  ['date-asc',   'tracker.sort.oldest'],
  ['name-asc',   'tracker.sort.nameAsc'],
  ['name-desc',  'tracker.sort.nameDesc'],
  ['cost-desc',  'tracker.sort.costDesc'],
  ['cost-asc',   'tracker.sort.costAsc'],
];

// ── Helper components ─────────────────────────────────────────────────────────

function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center text-muted-foreground/25 ${className ?? ''}`}>
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

interface ActionBtnProps {
  icon: React.ReactNode;
  label: string;
  shortLabel?: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  actionMode: GridActionMode;
}

function ActionBtn({
  icon,
  label,
  shortLabel,
  onClick,
  disabled,
  destructive = false,
  actionMode,
}: ActionBtnProps) {
  const compact = actionMode === 'compact';
  const medium = actionMode === 'medium';
  const content = compact ? icon : (
    <>
      {icon}
      <span>{medium ? (shortLabel ?? label) : label}</span>
    </>
  );

  const button = (
    <Button
      size="sm"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-full font-bold',
        compact ? 'h-8 w-8 p-0' : 'h-8 px-3 text-[0.7rem]',
        destructive && 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive',
      )}
    >
      <span className={cn('flex items-center gap-1.5', compact && 'justify-center')}>{content}</span>
    </Button>
  );

  if (!compact) return button;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent><p>{label}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ChallengePieceList({
  project, pieces, editingState, onEdit, onDelete, onToggleDisabled, onReorder,
  sortMode, onSortChange, viewMode, onViewChange,
}: ChallengePieceListProps) {
  const { t } = useTranslation();
  const [deleteTarget, setDeleteTarget] = useState<FilamentPiece | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [gridDensity, setGridDensity] = useState<GridDensity>(loadGridDensity);

  const PAGE_SIZE_GRID = 6;
  const PAGE_SIZE_LIST = 9;
  const pageSize = viewMode === 'grid' ? PAGE_SIZE_GRID : PAGE_SIZE_LIST;

  const sorted = sortPieces(pieces, sortMode);
  const trimmed = search.trim().toLowerCase();
  const filtered = trimmed
    ? sorted.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed) ||
          p.label.toLowerCase().includes(trimmed),
      )
    : sorted;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  function movePiece(id: string, direction: 'up' | 'down') {
    const currentIndex = sorted.findIndex((piece) => piece.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const next = [...sorted];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, moved);
    onReorder(next.map((piece) => piece.id));
  }

  function reorderByIds(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const currentIndex = sorted.findIndex((piece) => piece.id === sourceId);
    const targetIndex = sorted.findIndex((piece) => piece.id === targetId);
    if (currentIndex === -1 || targetIndex === -1) return;
    const next = [...sorted];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, moved);
    onReorder(next.map((piece) => piece.id));
  }

  function handleDragStart(id: string) { setDraggedId(id); setDragOverId(id); }
  function handleDragEnd() { setDraggedId(null); setDragOverId(null); }
  function handleTouchStart(id: string) { setDraggedId(id); setDragOverId(id); }

  function handleTouchMove(event: React.TouchEvent<HTMLButtonElement>) {
    const touch = event.touches[0];
    if (!touch) return;
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = element?.closest<HTMLElement>('[data-piece-id]');
    const targetId = card?.dataset.pieceId;
    if (targetId) setDragOverId(targetId);
  }

  function handleTouchEnd() {
    if (draggedId && dragOverId) reorderByIds(draggedId, dragOverId);
    handleDragEnd();
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    onDelete(deleteTarget.id);
    setDeleteTarget(null);
  }

  // Reset to page 1 whenever the visible set changes
  React.useEffect(() => { setPage(1); }, [search, sortMode, viewMode]);

  const isGrid = viewMode === 'grid';
  const actionMode = getGridActionMode(gridDensity);

  React.useEffect(() => {
    saveGridDensity(gridDensity);
  }, [gridDensity]);

  function dragProps(pieceId: string) {
    return {
      'data-piece-id': pieceId,
      onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragOverId(pieceId); },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        if (draggedId) reorderByIds(draggedId, pieceId);
        handleDragEnd();
      },
    };
  }

  function dragRing(pieceId: string) {
    return dragOverId === pieceId && draggedId && draggedId !== pieceId
      ? 'ring-2 ring-[hsl(var(--challenge-blue))]/50'
      : '';
  }

  function editingClass(pieceId: string) {
    return editingState.mode === 'edit' && editingState.id === pieceId
      ? 'border-yellow-400/30 bg-yellow-400/5'
      : 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]';
  }

  function GripBtn({ pieceId, name, className }: { pieceId: string; name: string; className?: string }) {
    return (
      <button
        type="button"
        draggable
        onDragStart={() => handleDragStart(pieceId)}
        onDragEnd={handleDragEnd}
        onTouchStart={() => handleTouchStart(pieceId)}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`cursor-grab touch-none rounded-full border border-white/[0.08] bg-white/[0.04] p-1.5 text-muted-foreground active:cursor-grabbing ${className ?? ''}`}
        aria-label={t('pieces_reorder_aria', { name })}
        title={t('pieces_drag_hint')}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
    );
  }

  function StatusBadge({ status }: { status: FilamentPiece['status'] }) {
    const key = `tracker.status.${status === 'post_processed' ? 'postProcessed' : status}` as const;
    return (
      <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[0.65rem] font-bold text-foreground">
        {t(key)}
      </span>
    );
  }

  function FileLinkBtn({ href }: { href: string }) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('tracker.fileLink.open')}
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              <ExternalLink className="h-2.5 w-2.5" />
              {t('tracker.fileLink.open')}
            </a>
          </TooltipTrigger>
          <TooltipContent><p>{href}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex flex-col gap-3">

      {/* ── Header block ──────────────────────────────────────────────────── */}
      <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">

        {/* Row 1: title + goal badge */}
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-extrabold text-foreground">{t('pieces_title')}</h3>
          <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-1 text-xs font-extrabold text-[hsl(var(--challenge-blue))] whitespace-nowrap">
            {pieces.length} / {project.goal}
          </span>
        </div>

        {/* Row 2: search + sort dropdown + view toggle + density */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('tracker.search.placeholder')}
              className="w-full rounded-[14px] border border-border/70 bg-white/[0.04] py-2 pl-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label={t('tracker.search.clear')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <Select
            value={sortMode}
            onValueChange={(value) => { onSortChange(value as PieceSortMode); setPage(1); }}
          >
            <SelectTrigger className="h-8 w-[11rem] rounded-xl border-white/[0.08] bg-white/[0.03] px-2.5 text-[0.72rem] font-bold focus:ring-[hsl(var(--challenge-blue))]/40 dark:bg-slate-950/80 dark:text-slate-100 dark:ring-offset-slate-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/[0.10] bg-slate-950 text-slate-100 dark:border-white/[0.10] dark:bg-slate-950 dark:text-slate-100">
              {SORT_OPTIONS.map(([value, labelKey]) => (
                <SelectItem key={value} value={value} className="text-[0.72rem] font-bold focus:bg-white/10 focus:text-slate-100">
                  {t(labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-black/[0.20] p-1">
            <button
              type="button"
              onClick={() => onViewChange('list')}
              aria-label={t('tracker.view.list')}
              title={t('tracker.view.list')}
              className={`rounded-full p-1.5 transition-colors ${!isGrid ? 'bg-white/[0.14] text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewChange('grid')}
              aria-label={t('tracker.view.grid')}
              title={t('tracker.view.grid')}
              className={`rounded-full p-1.5 transition-colors ${isGrid ? 'bg-white/[0.14] text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          {isGrid && (
            <GridDensityControl
              density={gridDensity}
              onChange={setGridDensity}
              className="ml-auto hidden min-w-[280px] xl:block"
            />
          )}
        </div>

        {/* Row 3: counter */}
        <p className="text-[0.72rem] text-muted-foreground">
          {trimmed
            ? `${filtered.length} / ${pieces.length} ${t('pieces_title').toLowerCase()}`
            : pieces.length > 0
              ? `${pieces.length} ${t('pieces_count_suffix') ?? 'piezas registradas'}`
              : t('pieces_empty_label')}
          {totalPages > 1 && ` · ${t('pieces_pagination_label')} ${safePage} ${t('pieces_pagination_of_suffix')} ${totalPages}`}
        </p>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-10 text-center text-sm leading-relaxed text-muted-foreground">
          {trimmed ? (
            t('tracker.search.empty', { query: search.trim() })
          ) : (
            t('pieces_empty_state').split('\n').map((line, i) => (
              <React.Fragment key={line}>
                {line}
                {i === 0 && <br />}
              </React.Fragment>
            ))
          )}
        </div>

      ) : isGrid ? (
        /* ── Grid view ──────────────────────────────────────────────────── */
        <div
          className="grid grid-cols-1 gap-4 transition-all duration-300 md:grid-cols-2 xl:[grid-template-columns:repeat(auto-fill,minmax(var(--grid-min-width),1fr))]"
          style={getGridColumnsVars(gridDensity)}
        >
          {paginated.map((piece) => (
            <article
              key={piece.id}
              {...dragProps(piece.id)}
              className={`group flex h-full min-h-[360px] flex-col overflow-hidden rounded-[18px] border transition-all ${editingClass(piece.id)} ${dragRing(piece.id)} ${piece.disabled ? 'opacity-50' : ''}`}
            >
              {/* Image */}
              <div className="relative h-40 w-full shrink-0 overflow-hidden border-b border-white/[0.05] bg-white/[0.03]">
                {piece.imageUrl ? (
                  <img src={piece.imageUrl} alt={piece.name} className="h-full w-full object-cover" />
                ) : (
                  <ImagePlaceholder className="h-full w-full" />
                )}
                {/* Grip (appears on hover) */}
                <button
                  type="button"
                  draggable
                  onDragStart={() => handleDragStart(piece.id)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={() => handleTouchStart(piece.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="absolute right-2 top-2 cursor-grab touch-none rounded-full border border-white/[0.10] bg-black/50 p-1.5 text-white/70 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
                  aria-label={t('pieces_reorder_aria', { name: piece.name })}
                  title={t('pieces_drag_hint')}
                >
                  <GripVertical className="h-3 w-3" />
                </button>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col gap-2.5 p-3">
                {/* Name + label */}
                <div>
                  <p className="truncate text-sm font-extrabold leading-tight text-foreground">{piece.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-[10px] bg-[hsl(var(--challenge-pink))]/15 px-2 py-0.5 text-[0.65rem] font-extrabold text-[hsl(var(--challenge-pink))]">
                      {piece.label}
                    </span>
                  </div>
                </div>

                {/* Stats mini grid */}
                <div className="grid grid-cols-3 gap-1">
                  <div className="rounded-[10px] border border-white/[0.05] bg-black/15 p-1.5 text-center">
                    <p className="text-[0.58rem] font-bold uppercase tracking-wide text-muted-foreground">{t('pieces_time')}</p>
                    <p className="text-[0.68rem] font-extrabold text-foreground">{secsToString(piece.totalSecs)}</p>
                  </div>
                  <div className="rounded-[10px] border border-white/[0.05] bg-black/15 p-1.5 text-center">
                    <p className="text-[0.58rem] font-bold uppercase tracking-wide text-muted-foreground">{t('pieces_grams')}</p>
                    <p className="text-[0.68rem] font-extrabold text-foreground">{piece.totalGrams.toFixed(1)}g</p>
                  </div>
                  <div className="rounded-[10px] border border-yellow-400/10 bg-yellow-400/5 p-1.5 text-center">
                    <p className="text-[0.58rem] font-bold uppercase tracking-wide text-muted-foreground">{t('pieces_cost')}</p>
                    <p className="text-[0.68rem] font-extrabold text-yellow-400">{formatCost(piece.totalCost, project.currency)}</p>
                  </div>
                </div>

                {/* Status + file link */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={piece.status} />
                  {piece.file_link && <FileLinkBtn href={piece.file_link} />}
                </div>

                {/* Plate count */}
                <p className="text-[0.65rem] font-semibold text-muted-foreground">
                  🗂️ {t('tracker.plateCount.display', { count: piece.plate_count ?? 1 })}
                </p>

                {/* Actions — sin subir/bajar en grid */}
                <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  <ActionBtn
                    icon={<Pencil className="h-3 w-3" />}
                    label={t('pieces_edit')}
                    shortLabel={t('pieces_edit')}
                    onClick={() => onEdit(piece.id)}
                    actionMode={actionMode}
                  />
                  {onToggleDisabled && (
                    <ActionBtn
                      icon={piece.disabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      label={piece.disabled ? 'Activar pieza' : 'Desactivar pieza'}
                      shortLabel={piece.disabled ? 'Activar' : 'Desactivar'}
                      onClick={() => onToggleDisabled(piece.id)}
                      actionMode={actionMode}
                    />
                  )}
                  <ActionBtn
                    icon={<Trash2 className="h-3 w-3" />}
                    label={t('pieces_delete')}
                    shortLabel={t('delete')}
                    onClick={() => setDeleteTarget(piece)}
                    destructive
                    actionMode={actionMode}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>

      ) : (
        /* ── List view ──────────────────────────────────────────────────── */
        <div className="flex flex-col gap-2">
          {paginated.map((piece) => (
            <article
              key={piece.id}
              {...dragProps(piece.id)}
              className={`rounded-[16px] border p-3 transition-all ${editingClass(piece.id)} ${dragRing(piece.id)} ${piece.disabled ? 'opacity-50' : ''}`}
            >
              {/* Row: thumb + info */}
              <div className="flex items-center gap-3">
                {/* Thumbnail */}
                {piece.imageUrl ? (
                  <img
                    src={piece.imageUrl}
                    alt={piece.name}
                    className="h-14 w-14 shrink-0 rounded-[10px] border border-white/[0.08] object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[10px] border border-white/[0.06] bg-white/[0.03]">
                    <ImagePlaceholder className="h-full w-full" />
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-foreground">{piece.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDisplayDate(piece.printedAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="rounded-[10px] bg-[hsl(var(--challenge-pink))]/15 px-2 py-0.5 text-[0.65rem] font-extrabold text-[hsl(var(--challenge-pink))] whitespace-nowrap">
                        {piece.label}
                      </span>
                      <GripBtn pieceId={piece.id} name={piece.name} />
                    </div>
                  </div>

                  {/* Inline stats + status */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[0.65rem] font-bold text-foreground">
                      {secsToString(piece.totalSecs)}
                    </span>
                    <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[0.65rem] font-bold text-foreground">
                      {piece.totalGrams.toFixed(1)}g
                    </span>
                    <span className="rounded-full border border-yellow-400/15 bg-yellow-400/5 px-2 py-0.5 text-[0.65rem] font-bold text-yellow-400">
                      {formatCost(piece.totalCost, project.currency)}
                    </span>
                    <StatusBadge status={piece.status} />
                    {piece.file_link && <FileLinkBtn href={piece.file_link} />}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Button
                  size="sm" variant="outline"
                  className="h-7 rounded-full px-2.5 text-xs font-bold"
                  onClick={() => movePiece(piece.id, 'up')}
                  disabled={sorted[0]?.id === piece.id}
                >
                  <ArrowUp className="mr-1 h-3 w-3" /> {t('pieces_move_up')}
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="h-7 rounded-full px-2.5 text-xs font-bold"
                  onClick={() => movePiece(piece.id, 'down')}
                  disabled={sorted[sorted.length - 1]?.id === piece.id}
                >
                  <ArrowDown className="mr-1 h-3 w-3" /> {t('pieces_move_down')}
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="h-7 rounded-full px-2.5 text-xs font-bold"
                  onClick={() => onEdit(piece.id)}
                >
                  {t('pieces_edit')}
                </Button>
                {onToggleDisabled && (
                  <Button
                    size="sm" variant="outline"
                    className="h-7 rounded-full px-2.5 text-xs font-bold"
                    onClick={() => onToggleDisabled(piece.id)}
                  >
                    {piece.disabled
                      ? <><Eye className="mr-1 h-3 w-3" />Activar</>
                      : <><EyeOff className="mr-1 h-3 w-3" />Desactivar</>
                    }
                  </Button>
                )}
                <Button
                  size="sm" variant="outline"
                  className="h-7 rounded-full border-destructive/30 bg-destructive/10 px-2.5 text-xs font-bold text-destructive hover:bg-destructive/20 hover:text-destructive"
                  onClick={() => setDeleteTarget(piece)}
                >
                  {t('pieces_delete')}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      <PaginationBar
        page={safePage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemLabel={t('pieces_count_suffix') ?? 'piezas'}
        onChange={setPage}
      />

      {/* ── Delete dialog ──────────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pieces_delete_title')}</DialogTitle>
            <DialogDescription>
              {t('pieces_delete_confirm', { name: deleteTarget?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-full">{t('cancel')}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={() => {
                if (deleteTarget) {
                  onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
