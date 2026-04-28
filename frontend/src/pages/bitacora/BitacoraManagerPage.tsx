import { useOutletContext, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { ProjectForm, ProjectManager } from '@/components/filament-challenge/project-manager';
import { TrackerPrintSummary } from '@/components/filament-challenge/tracker-print-summary';
import { apiGetPieces } from '@/components/filament-challenge/tracker-api';
import { mockTrackerPieces } from '@/data/mockData';
import { buildTrackerPdfData } from '@/features/tracker/lib/build-tracker-pdf-data';
import type { BitacoraContext } from './BitacoraLayout';
import { useTranslation } from 'react-i18next';

export function BitacoraManagerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    projects, activeProject, selectProject,
    createProject, updateProject, deleteProject,
    pieces, isGuest,
  } = useOutletContext<BitacoraContext>();

  const [createOpen, setCreateOpen] = useState(false);

  async function handleCreate(input: Parameters<typeof createProject>[0]) {
    if (isGuest) return;
    const id = await createProject(input);
    setCreateOpen(false);
    navigate(`/bitacora/${id}`);
  }

  function handleOpen(id: string) {
    selectProject(id);
    navigate(`/bitacora/${id}`);
  }

  async function handleGeneratePdf(projectId: string) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;

    selectProject(projectId);

    const projectPieces = isGuest
      ? mockTrackerPieces.filter((piece) => piece.projectId === projectId)
      : await apiGetPieces(projectId);

    navigate(`/bitacora/${projectId}/pdf`, {
      state: {
        trackerData: buildTrackerPdfData(project, projectPieces),
      },
    });
  }

  return (
    <>
      <div className="print:hidden">
        <ProjectManager
          projects={projects}
          activeProjectId={activeProject?.id ?? null}
          onCreate={() => isGuest ? undefined : setCreateOpen(true)}
          onUpdate={updateProject}
          onDelete={deleteProject}
          onSelect={selectProject}
          onOpenProject={handleOpen}
          onGeneratePdf={(project) => void handleGeneratePdf(project.id)}
          guestMode={isGuest}
          onGuestAction={() => {}}
        />
      </div>

      {activeProject && (
        <div className="hidden print:block">
          <TrackerPrintSummary project={activeProject} pieces={pieces} />
        </div>
      )}

      {/* Create project modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-full sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('pm_dialog_title')}</DialogTitle>
            <DialogDescription>{t('pm_dialog_subtitle')}</DialogDescription>
          </DialogHeader>
          <ProjectForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitLabel={t('pm_create_btn')}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
