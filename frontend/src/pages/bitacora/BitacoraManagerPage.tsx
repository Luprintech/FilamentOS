import { useOutletContext, useNavigate } from 'react-router-dom';
import { ProjectManager } from '@/components/filament-challenge/project-manager';
import { TrackerPrintSummary } from '@/components/filament-challenge/tracker-print-summary';
import { apiGetPieces } from '@/components/filament-challenge/tracker-api';
import { mockTrackerPieces } from '@/data/mockData';
import { buildTrackerPdfData } from '@/features/tracker/lib/build-tracker-pdf-data';
import type { BitacoraContext } from './BitacoraLayout';

export function BitacoraManagerPage() {
  const navigate = useNavigate();
  const {
    projects, activeProject, selectProject,
    createProject, updateProject, deleteProject,
    pieces, isGuest,
  } = useOutletContext<BitacoraContext>();

  async function handleCreate(input: Parameters<typeof createProject>[0]) {
    if (isGuest) return;
    const id = await createProject(input);
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
          onCreate={handleCreate}
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
    </>
  );
}
