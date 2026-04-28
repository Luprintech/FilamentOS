import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { ChallengeHero } from '@/components/filament-challenge/challenge-hero';
import { ChallengePieceList } from '@/components/filament-challenge/challenge-piece-list';
import type { PieceSortMode, PieceViewMode } from '@/components/filament-challenge/challenge-piece-list';
import { ProjectForm } from '@/components/filament-challenge/project-manager';
import { TrackerPrintSummary } from '@/components/filament-challenge/tracker-print-summary';
import type { EditingState } from '@/components/filament-challenge/filament-types';
import type { BitacoraContext } from './BitacoraLayout';
import { useTranslation } from 'react-i18next';
import { buildTrackerPdfData } from '@/features/tracker/lib/build-tracker-pdf-data';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'pending' | 'printed' | 'post_processed' | 'delivered' | 'failed';

const STATUS_CHIPS: StatusFilter[] = ['all', 'pending', 'printed', 'post_processed', 'delivered', 'failed'];

export function ProjectDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const {
    projects, activeProject, selectProject,
    pieces, updateProject, deleteProject, deletePiece, reorderPieces,
  } = useOutletContext<BitacoraContext>();

  const [editingOpen, setEditingOpen] = useState(false);
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const [editingState, setEditingState] = useState<EditingState>({ mode: 'create' });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<PieceSortMode>('date-desc');
  const [viewMode, setViewMode] = useState<PieceViewMode>('grid');

  // Sync active project when navigating directly to this URL
  useEffect(() => {
    if (!projectId) return;
    if (activeProject?.id !== projectId) {
      selectProject(projectId);
    }
  }, [projectId]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Wait for the project to be loaded
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

  const pdfData = buildTrackerPdfData(project, pieces);
  const visiblePieces = statusFilter === 'all'
    ? pieces
    : pieces.filter((piece) => piece.status === statusFilter);
  const countByStatus = pieces.reduce<Record<StatusFilter, number>>(
    (acc, piece) => { acc[piece.status] += 1; return acc; },
    { all: pieces.length, pending: 0, printed: 0, post_processed: 0, delivered: 0, failed: 0 },
  );

  async function handleDelete() {
    await deleteProject(project!.id);
    setDeleteOpen(false);
    navigate('/bitacora');
  }

  async function handleDeletePiece(id: string) {
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

  const hasPieces = pieces.length > 0;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="print:hidden">
        <ChallengeHero
          project={project}
          pieces={pieces}
          onBack={() => navigate('/bitacora')}
          onPrint={() => navigate(`/bitacora/${project.id}/pdf`, { state: { trackerData: pdfData } })}
          onEditProject={() => setEditingOpen(true)}
          onDeleteProject={() => setDeleteOpen(true)}
          onAddPiece={() => navigate(`/bitacora/${project.id}/nueva-pieza`)}
        />

        {/* Pieces block */}
        <section className="space-y-5">
          {hasPieces ? (
            <>
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

              <ChallengePieceList
                project={project}
                pieces={visiblePieces}
                editingState={editingState}
                onEdit={(id) => {
                  setEditingState({ mode: 'edit', id });
                  navigate(`/bitacora/${project.id}/nueva-pieza`, { state: { editingId: id } });
                }}
                onDelete={handleDeletePiece}
                onReorder={reorderPieces}
                sortMode={sortMode}
                onSortChange={setSortMode}
                viewMode={viewMode}
                onViewChange={setViewMode}
              />
            </>
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/[0.12] bg-white/[0.02] px-8 py-12 text-center">
              <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                <div className="rounded-full border border-primary/20 bg-primary/10 p-4 text-primary">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-foreground">{t('pieces_empty_label')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('pieces_empty_state').split('\n')[0]}
                  </p>
                </div>
                <Button
                  size="lg"
                  className="rounded-full font-extrabold"
                  onClick={() => navigate(`/bitacora/${project.id}/nueva-pieza`)}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  {t('hero_add_first_piece')}
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="hidden print:block">
        <TrackerPrintSummary project={project} pieces={pieces} />
      </div>

      {/* Edit project dialog */}
      <Dialog open={editingOpen} onOpenChange={setEditingOpen}>
        <DialogContent className="w-full sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('tracker_edit_project')}</DialogTitle>
            <DialogDescription>{t('tracker_edit_project_hint')}</DialogDescription>
          </DialogHeader>
          <ProjectForm
            defaultValues={{
              title:       project.title,
              description: project.description,
              coverImage:  project.coverImage ?? '',
              goal:        String(project.goal),
              currency:    project.currency,
            }}
            onSubmit={async (input) => {
              await updateProject(project.id, input);
              setEditingOpen(false);
            }}
            onCancel={() => setEditingOpen(false)}
            submitLabel={t('save_changes')}
          />
        </DialogContent>
      </Dialog>

      {/* Delete project dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tracker_delete_project')}</DialogTitle>
            <DialogDescription>
              {t('tracker_delete_project_confirm', { title: project.title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-full">{t('cancel')}</Button>
            </DialogClose>
            <Button variant="destructive" className="rounded-full" onClick={handleDelete}>
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
