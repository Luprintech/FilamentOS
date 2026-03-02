import type { FormData } from './schema';

export interface SavedProject extends FormData {
  id: string;
  created_at: string;
}

export async function getProjects(): Promise<{ data: SavedProject[] | null; error: string | null }> {
  try {
    const res = await fetch('/api/projects');
    if (!res.ok) return { data: null, error: 'Error al cargar los proyectos.' };
    return { data: await res.json(), error: null };
  } catch {
    return { data: null, error: 'No se pudo conectar con el servidor.' };
  }
}

export async function saveProject(
  _userId: string,
  formData: Omit<FormData, 'id'>
): Promise<{ id: string | null; error: string | null }> {
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) return { id: null, error: 'Error al guardar el proyecto.' };
    const data = await res.json() as { id: string };
    return { id: data.id, error: null };
  } catch {
    return { id: null, error: 'No se pudo conectar con el servidor.' };
  }
}

export async function deleteProject(id: string): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) return { error: 'Error al eliminar el proyecto.' };
    return { error: null };
  } catch {
    return { error: 'No se pudo conectar con el servidor.' };
  }
}
