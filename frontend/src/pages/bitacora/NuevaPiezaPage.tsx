import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChallengeForm } from '@/components/filament-challenge/challenge-form';
import type { EditingState } from '@/components/filament-challenge/filament-types';
import type { BitacoraContext } from './BitacoraLayout';
import { useTranslation } from 'react-i18next';

export function NuevaPiezaPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const {
    projects, activeProject, selectProject,
    pieces, addPiece, updatePiece, activeSpools,
  } = useOutletContext<BitacoraContext>();

  const location = useLocation();
  const incomingEditId = (location.state as { editingId?: string } | null)?.editingId;
  const [editingState, setEditingState] = useState<EditingState>(
    incomingEditId ? { mode: 'edit', id: incomingEditId } : { mode: 'create' },
  );

  // Sync active project when navigating directly to this URL
  useEffect(() => {
    if (!projectId) return;
    if (activeProject?.id !== projectId) selectProject(projectId);
  }, [projectId]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Always start at the top
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

  async function handleSave(input: Parameters<typeof addPiece>[0]) {
    await addPiece(input);
    // After save, go back to the project detail so the user sees updated metrics
    navigate(`/bitacora/${project!.id}`, { replace: true });
  }

  async function handleUpdate(id: string, input: Parameters<typeof updatePiece>[1]) {
    await updatePiece(id, input);
    setEditingState({ mode: 'create' });
    navigate(`/bitacora/${project!.id}`, { replace: true });
  }

  return (
    <div className="w-full animate-fade-in space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 rounded-full font-bold px-3"
          onClick={() => navigate(`/bitacora/${project.id}`)}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {project.title}
        </Button>
        <span>/</span>
        <span className="font-semibold text-foreground">
          {editingState.mode === 'edit' ? t('pieces_edit') : t('hero_add_piece')}
        </span>
      </div>

      {/* Form */}
      <ChallengeForm
        project={project}
        editingState={editingState}
        pieces={pieces}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onCancelEdit={() => {
          setEditingState({ mode: 'create' });
          navigate(`/bitacora/${project.id}`);
        }}
        activeSpools={activeSpools}
      />
    </div>
  );
}
