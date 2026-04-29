import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BitacoraManagerPage } from './BitacoraManagerPage';

const mockNavigate = vi.fn();
const mockUseOutletContext = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useOutletContext: () => mockUseOutletContext(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        pm_empty_title: 'Todavía no tenés proyectos',
        pm_empty_subtitle: 'Creá tu primer proyecto',
        pm_empty_btn: 'Crear proyecto',
        pm_dialog_title: 'Nuevo proyecto',
        pm_dialog_subtitle: 'Completá los datos del proyecto',
        pm_name: 'Nombre',
        pm_name_placeholder: 'Nombre del proyecto',
        pm_name_required: 'El nombre es obligatorio',
        pm_desc: 'Descripción',
        pm_desc_placeholder: 'Descripción del proyecto',
        pm_goal: 'Meta',
        pm_goal_hint: 'Cantidad objetivo',
        pm_cover: 'Portada',
        pm_cover_change: 'Cambiar portada',
        pm_cover_upload: 'Subir portada',
        pm_cover_hint: 'Podés subir una imagen',
        pm_create_btn: 'Crear proyecto',
        pm_cancel: 'Cancelar',
        pm_badge: 'Bitácora',
        pm_title: 'Proyectos',
        pm_subtitle: 'Gestioná tus proyectos',
        'tracker.upload.dragPrompt': 'Arrastrá imagen',
        'tracker.upload.dropPrompt': 'Soltá imagen',
        'tracker.upload.processing': 'Procesando',
      };

      return translations[key] ?? key;
    },
  }),
}));

vi.mock('@/context/currency-context', () => ({
  useCurrency: () => ({ currency: 'USD' }),
}));

vi.mock('@/components/ui/image-upload', () => ({
  ImageUpload: ({ label }: { label: string }) => <div>{label}</div>,
}));

vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/utils')>('@/lib/utils');
  return {
    ...actual,
    compressImage: vi.fn(),
  };
});

vi.mock('@/components/filament-challenge/tracker-print-summary', () => ({
  TrackerPrintSummary: () => null,
}));

vi.mock('@/components/filament-challenge/tracker-api', () => ({
  apiGetPieces: vi.fn(),
}));

vi.mock('@/data/mockData', () => ({
  mockTrackerPieces: [],
}));

vi.mock('@/features/tracker/lib/build-tracker-pdf-data', () => ({
  buildTrackerPdfData: vi.fn(),
}));

describe('BitacoraManagerPage', () => {
  let createProjectMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNavigate.mockReset();
    createProjectMock = vi.fn().mockResolvedValue('project-123');
    mockUseOutletContext.mockReturnValue({
      projects: [],
      activeProject: null,
      selectProject: vi.fn(),
      createProject: createProjectMock,
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      pieces: [],
      isGuest: false,
    });
  });

  it('crea el proyecto desde el modal del manager y navega al detalle', async () => {
    render(<BitacoraManagerPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Crear proyecto' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('max-h-[calc(100vh-2rem)]');
    expect(dialog.className).toContain('overflow-y-auto');

    const titleInput = screen.getByLabelText('Nombre *');

    fireEvent.change(titleInput, { target: { value: '  Proyecto urgente  ' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: '  Primera corrida  ' } });
    fireEvent.change(screen.getByLabelText('Meta'), { target: { value: '15' } });

    fireEvent.submit(titleInput.closest('form')!);

    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledWith({
        title: 'Proyecto urgente',
        description: 'Primera corrida',
        coverImage: null,
        goal: 15,
        pricePerKg: 0,
        currency: 'USD',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/bitacora/project-123');
    });
  });
});
