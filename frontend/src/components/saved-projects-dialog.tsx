import React, { useState, useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, FolderUp, ImageIcon, Loader2 } from 'lucide-react';
import type { FormData } from '@/lib/schema';
import { getProjects, deleteProject, type SavedProject } from '@/lib/projects';

interface SavedProjectsDialogProps {
  form: UseFormReturn<FormData>;
  children: React.ReactNode;
}

export function SavedProjectsDialog({ form, children }: SavedProjectsDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    getProjects().then(({ data, error }) => {
      if (error) {
        toast({ variant: 'destructive', title: 'Error al cargar', description: error });
      } else {
        setProjects(data ?? []);
      }
      setIsLoading(false);
    });
  }, [isOpen, toast]);

  const handleLoadProject = (project: SavedProject) => {
    form.reset(project);
    toast({ title: 'Proyecto cargado', description: `Se ha cargado "${project.jobName}".` });
    setIsOpen(false);
  };

  const handleDeleteProject = async (projectToDelete: SavedProject) => {
    if (!window.confirm(`¿Eliminar "${projectToDelete.jobName}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await deleteProject(projectToDelete.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error al eliminar', description: error });
    } else {
      setProjects(projects.filter((p) => p.id !== projectToDelete.id));
      toast({ title: 'Proyecto eliminado', description: `"${projectToDelete.jobName}" ha sido eliminado.` });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Proyectos Guardados</DialogTitle>
          <DialogDescription>
            Selecciona un proyecto guardado para cargarlo en la calculadora.
          </DialogDescription>
        </DialogHeader>
        <div className="h-72 w-full overflow-y-auto rounded-md border">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : projects.length > 0 ? (
              <ul className="space-y-2">
                {projects.map((project) => (
                  <li key={project.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {project.projectImage ? (
                        <img
                          src={project.projectImage}
                          alt={`Imagen de ${project.jobName}`}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-muted-foreground flex-shrink-0">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                      <span className="font-medium truncate">{project.jobName}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleLoadProject(project)} title="Cargar proyecto">
                        <FolderUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        title="Eliminar proyecto"
                        onClick={() => handleDeleteProject(project)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-center text-muted-foreground py-10">No tienes proyectos guardados.</p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
