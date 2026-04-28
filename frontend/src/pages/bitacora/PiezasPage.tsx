import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChallengePieceList } from '@/components/filament-challenge/challenge-piece-list';
import type { PieceSortMode, PieceViewMode } from '@/components/filament-challenge/challenge-piece-list';
import type { EditingState } from '@/components/filament-challenge/filament-types';
import type { BitacoraContext } from './BitacoraLayout';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'pending' | 'printed' | 'post_processed' | 'delivered' | 'failed';

const STATUS_CHIPS: StatusFilter[] = ['all', 'pending', 'printed', 'post_processed', 'delivered', 'failed'];

export function PiezasPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const {
    projects, activeProject, selectProject,
    pieces, deletePiece, reorderPieces,
  } = useOutletContext<BitacoraContext>();

  const [editingState, setEditingState] = useState<EditingState>({ mode: 'create' });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<PieceSortMode>('date-desc');
  const [viewMode, setViewMode] = useState<PieceViewMode>('grid');

  // Sync active project when navigating directly to this URL
  useEffect(() => {
    if (!projectId) return;
    if (activeProject?.id !== projectId) selectProject(projectId);
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const project = activeProject?.id === projectId
    ? activeProject
    : projects.find((p) => p.id === projectId) ?? null;

  if (!project) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--challenge-blue))]" />
      </div>
    );
  }

  const visiblePieces = statusFilter === 'all'
    ? pieces
    : pieces.filter((p) => p.status === statusFilter);

  // Count per status for chip badges
  const countByStatus = pieces.reduce<Record<StatusFilter, number>>(
    (acc, p) => { acc[p.status] += 1; return acc; },
    { all: pieces.length, pending: 0, printed: 0, post_processed: 0, delivered: 0, failed: 0 },
  );

  async function handleDelete(id: string) {
    await deletePiece(id);
    if (editingState.mode === 'edit' && editingState.id === id) {
      setEditingState({ mode: 'create' });
    }
  }

  function chipLabel(value: StatusFilter): string {
    if (value === 'all') return t('tracker.filter.all');
    const key = value === 'post_processed' ? 'postProcessed' : value;
    return t(`tracker.status.${key}` as const);
  }

  return (
    <div className="w-full animate-fade-in space-y-5">

      {/* ── Top bar: breadcrumb + CTA ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate('/bitacora')}
            className="hover:text-foreground transition-colors font-bold"
          >
            {t('pm_title')}
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate(`/bitacora/${project.id}`)}
            className="hover:text-foreground transition-colors"
          >
            {project.title}
          </button>
          <span>/</span>
          <span className="font-semibold text-foreground">{t('pieces_title')}</span>
        </div>

        <Button
          size="sm"
          className="rounded-full font-extrabold"
          onClick={() => navigate(`/bitacora/${project.id}/nueva-pieza`)}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {t('hero_add_piece')}
        </Button>
      </div>

      {/* ── Status chips ── */}
      <div className="flex flex-wrap gap-2">
        {STATUS_CHIPS.map((value) => {
          const count = countByStatus[value];
          const isActive = statusFilter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.72rem] font-bold transition-colors',
                isActive
                  ? 'border-[hsl(var(--challenge-blue))]/40 bg-[hsl(var(--challenge-blue))]/15 text-[hsl(var(--challenge-blue))]'
                  : 'border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-white/[0.14] hover:text-foreground',
              )}
            >
              {chipLabel(value)}
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[0.62rem] font-extrabold',
                isActive
                  ? 'bg-[hsl(var(--challenge-blue))]/20 text-[hsl(var(--challenge-blue))]'
                  : 'bg-white/[0.06] text-muted-foreground',
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Piece list (owns search + sort dropdown + view toggle + pagination) ── */}
      <ChallengePieceList
        project={project}
        pieces={visiblePieces}
        editingState={editingState}
        onEdit={(id) => navigate(`/bitacora/${project.id}/nueva-pieza`, { state: { editingId: id } })}
        onDelete={handleDelete}
        onReorder={reorderPieces}
        sortMode={sortMode}
        onSortChange={setSortMode}
        viewMode={viewMode}
        onViewChange={setViewMode}
      />
    </div>
  );
}
