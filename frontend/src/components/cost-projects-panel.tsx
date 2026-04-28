import React, { useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Loader2, ImageIcon, Trash2, FolderUp, Clock3, Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import type { FormData } from '@/lib/schema';
import { useTranslation } from 'react-i18next';
import { useProjects, useDeleteProject } from '@/features/projects/api/use-projects';
import { deleteGuestProject, getGuestProjects, type SavedProject } from '@/features/projects/api/projects-api';
import { LoginRequiredModal } from '@/components/login-required-modal';

interface CostProjectsPanelProps {
  form: UseFormReturn<FormData>;
  refreshKey: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTime(hours: number, minutes: number): string {
  return `${hours}h ${minutes}m`;
}

export function CostProjectsPanel({ form, refreshKey, open, onOpenChange }: CostProjectsPanelProps) {
  const { toast } = useToast();
  const { user, isGuest } = useAuth();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [guestProjects, setGuestProjects] = useState<SavedProject[]>(() => getGuestProjects());
  const iconClass = 'h-4 w-4';

  const { data: projects = [], isLoading, refetch } = useProjects(isGuest);
  const deleteProjectMutation = useDeleteProject();

  React.useEffect(() => {
    if (refreshKey > 0 && !isGuest) refetch();
  }, [refreshKey, refetch, isGuest]);

  React.useEffect(() => {
    if (!isGuest) return;
    const refresh = () => setGuestProjects(getGuestProjects());
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('filamentos:guest-projects-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('filamentos:guest-projects-updated', refresh);
    };
  }, [isGuest, refreshKey]);

  const currentFormId = form.watch('id');
  const displayProjects = isGuest ? guestProjects : projects;

  const sortedProjects = useMemo(
    () => displayProjects.filter((p) =>
      p.jobName.toLowerCase().includes(query.toLowerCase().trim())
    ),
    [displayProjects, query],
  );

  function handleLoadProject(project: SavedProject) {
    form.reset(project);
    onOpenChange(false);
    toast({ title: t('loaded_project'), description: t('loaded_project_msg', { name: project.jobName }) });
  }

  function handleDeleteProject(project: SavedProject) {
    if (!window.confirm(t('delete_confirm', { name: project.jobName }))) return;
    if (isGuest) {
      deleteGuestProject(project.id);
      setGuestProjects(getGuestProjects());
      if (currentFormId === project.id) form.reset();
      toast({ title: 'Proyecto local eliminado' });
      return;
    }
    deleteProjectMutation.mutate(project.id, {
      onSuccess: () => { if (currentFormId === project.id) form.reset(); },
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border/60 px-6 py-5">
            <SheetTitle className="text-xl font-black tracking-tight">
              {t('saved_projects')}
            </SheetTitle>
            <SheetDescription>
              {t('saved_projects_subtitle')}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-hidden px-6 py-4">
            {/* Search */}
            {((user && !isGuest) || (isGuest && displayProjects.length > 0)) && (
              <div className="relative shrink-0">
                <Search className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${iconClass}`} />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('saved_projects_search')}
                  className="pl-9"
                />
              </div>
            )}

            {/* Content */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {!user && !isGuest ? (
                <div className="rounded-[18px] border border-dashed border-border/60 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                  {t('saved_projects_login')}
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : sortedProjects.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-border/60 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                  {isGuest
                    ? 'Aún no tienes proyectos locales. Guarda uno desde la calculadora para verlo aquí.'
                    : t('saved_projects_empty')}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sortedProjects.map((project) => {
                    const isActive = currentFormId === project.id;
                    return (
                      <div
                        key={project.id}
                        className={`rounded-[18px] border p-4 transition-colors ${
                          isActive
                            ? 'border-primary/40 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.18)]'
                            : 'border-border/60 bg-card/70 hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {project.projectImage ? (
                            <img
                              src={project.projectImage}
                              alt={project.jobName}
                              className="h-14 w-14 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-extrabold text-foreground">{project.jobName}</p>
                            <div className="mt-1 flex flex-wrap gap-2 text-[0.72rem] text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className={iconClass} />
                                {formatTime(project.printingTimeHours, project.printingTimeMinutes)}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Package className={iconClass} />
                                {project.filamentWeight}g
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 rounded-full text-xs font-bold"
                            onClick={() => handleLoadProject(project)}
                          >
                            <FolderUp className={`mr-1.5 ${iconClass}`} />
                            {t('load')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full border-destructive/30 bg-destructive/10 text-xs font-bold text-destructive hover:bg-destructive/20"
                            onClick={() => handleDeleteProject(project)}
                          >
                            <Trash2 className={iconClass} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <LoginRequiredModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        message="Inicia sesión para cargar y guardar proyectos de calculadora."
      />
    </>
  );
}
