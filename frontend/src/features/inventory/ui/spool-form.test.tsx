import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import type { Spool, SpoolmanRemoteSpool } from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'inventory.editSpool': 'Editar bobina',
        'inventory.addSpool': 'Añadir bobina',
        'inventory.brand': 'Marca',
        'inventory.selectBrand': 'Elegí una marca',
        'inventory.material': 'Material',
        'inventory.selectMaterial': 'Elegí un material',
        'inventory.color': 'Color',
        'inventory.colorHex': 'Color HEX',
        'inventory.totalGrams': 'Total',
        'inventory.remaining': 'Restante',
        'inventory.price': 'Precio',
        'inventory.notes': 'Notas',
        'inventory.notesPlaceholder': 'Notas',
        'inventory.shopUrl': 'Link de compra',
        'inventory.shopUrlPlaceholder': 'https://tienda.example/bobina',
        'inventory.brandOther': 'Otra marca',
        'inventory.materialOther': 'Otro material',
        'inventory.myBrands': 'Mis marcas',
        'inventory.myMaterials': 'Mis materiales',
        'inventory.spoolman.linkSectionTitle': 'Vincular con Spoolman',
        'inventory.spoolman.linkSectionHint': 'Buscá una bobina remota para asociarla.',
        'inventory.spoolman.linkSpoolId': 'ID de Spoolman',
        'inventory.spoolman.fetchRemote': 'Buscar bobina remota',
        'inventory.spoolman.loadingRemote': 'Buscando...',
        'inventory.spoolman.invalidId': 'Ingresá un ID válido.',
        'inventory.spoolman.remotePreview': 'Bobina remota encontrada',
        'inventory.spoolman.noRemoteName': 'Sin nombre remoto',
        'inventory.spoolman.confirmLink': 'Vincular bobina',
        'inventory.spoolman.linking': 'Vinculando...',
        'inventory.spoolman.linkError': 'No se pudo vincular la bobina.',
        cancel: 'Cancelar',
        save_changes: 'Guardar cambios',
        cf_saving: 'Guardando...',
      };

      return translations[key] ?? key;
    },
  }),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ children, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props}>{children}</input>,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props}>{children}</label>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

import { SpoolForm } from './spool-form';

function createSpool(overrides: Partial<Spool> = {}): Spool {
  return {
    id: overrides.id ?? 'spool-1',
    brand: overrides.brand ?? 'Local spool',
    material: overrides.material ?? 'PLA',
    color: overrides.color ?? 'Negro',
    colorHex: overrides.colorHex ?? '#111111',
    totalGrams: overrides.totalGrams ?? 1000,
    remainingG: overrides.remainingG ?? 700,
    price: overrides.price ?? 24,
    notes: overrides.notes ?? '',
    shopUrl: overrides.shopUrl ?? null,
    spoolmanId: overrides.spoolmanId ?? null,
    inventorySource: overrides.inventorySource ?? 'local',
    linkedAt: overrides.linkedAt ?? null,
    lastSyncedAt: overrides.lastSyncedAt ?? null,
    status: overrides.status ?? 'active',
    createdAt: overrides.createdAt ?? '2026-04-28T00:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-04-28T00:00:00Z',
  };
}

function renderForm(overrides: Partial<ComponentProps<typeof SpoolForm>> = {}) {
  return render(
    <SpoolForm
      open
      onClose={overrides.onClose ?? vi.fn()}
      onSubmit={overrides.onSubmit ?? vi.fn().mockResolvedValue(undefined)}
      editingSpool={overrides.editingSpool ?? createSpool()}
      customBrands={[]}
      customMaterials={[]}
      spoolmanConfigured={overrides.spoolmanConfigured ?? true}
      getRemoteSpool={overrides.getRemoteSpool}
      onLinkSpoolman={overrides.onLinkSpoolman}
      prefill={overrides.prefill}
    />,
  );
}

describe('SpoolForm Spoolman linking', () => {
  it('valida el ID antes de consultar Spoolman', async () => {
    const getRemoteSpool = vi.fn();
    renderForm({ getRemoteSpool, onLinkSpoolman: vi.fn() });

    fireEvent.change(screen.getByLabelText('ID de Spoolman'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar bobina remota' }));

    await waitFor(() => expect(screen.getByText('Ingresá un ID válido.')).toBeInTheDocument());
    expect(getRemoteSpool).not.toHaveBeenCalled();
  });

  it('permite previsualizar y vincular una bobina remota', async () => {
    const onClose = vi.fn();
    const remoteSpool: SpoolmanRemoteSpool = {
      spoolmanId: 77,
      brand: 'Polymaker',
      name: 'PolyLite PLA Pro',
      material: 'PLA',
      color: 'Orange',
      colorHex: '#ff8800',
      totalGrams: 1000,
      remainingG: 640,
      weightGrams: 1000,
      diameter: null,
      printTempMin: null,
      printTempMax: null,
      bedTempMin: null,
      bedTempMax: null,
      price: 31,
      notes: 'Remote notes',
    };
    const getRemoteSpool = vi.fn().mockResolvedValue(remoteSpool);
    const onLinkSpoolman = vi.fn().mockResolvedValue(createSpool({ inventorySource: 'spoolman', spoolmanId: 77 }));

    renderForm({ onClose, getRemoteSpool, onLinkSpoolman });

    fireEvent.change(screen.getByLabelText('ID de Spoolman'), { target: { value: '77' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar bobina remota' }));

    await waitFor(() => expect(getRemoteSpool).toHaveBeenCalledWith(77));
    expect(screen.getByText('Bobina remota encontrada')).toBeInTheDocument();
    expect(screen.getByText('Polymaker · PLA')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Vincular bobina' }));

    await waitFor(() => expect(onLinkSpoolman).toHaveBeenCalledWith('spool-1', 77));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('mantiene el formulario abierto cuando falla la vinculación', async () => {
    const onClose = vi.fn();
    const getRemoteSpool = vi.fn().mockResolvedValue({
      spoolmanId: 77,
      brand: 'Polymaker',
      name: 'PolyLite PLA Pro',
      material: 'PLA',
      color: 'Orange',
      colorHex: '#ff8800',
      totalGrams: 1000,
      remainingG: 640,
      weightGrams: 1000,
      diameter: null,
      printTempMin: null,
      printTempMax: null,
      bedTempMin: null,
      bedTempMax: null,
      price: 31,
      notes: 'Remote notes',
    } satisfies SpoolmanRemoteSpool);
    const onLinkSpoolman = vi.fn().mockRejectedValue(new Error('No se pudo vincular la bobina.'));

    renderForm({ onClose, getRemoteSpool, onLinkSpoolman });

    fireEvent.change(screen.getByLabelText('ID de Spoolman'), { target: { value: '77' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar bobina remota' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Vincular bobina' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Vincular bobina' }));

    await waitFor(() => expect(screen.getByText('No se pudo vincular la bobina.')).toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('oculta la sección de vínculo cuando la bobina ya proviene de Spoolman', () => {
    renderForm({
      editingSpool: createSpool({ inventorySource: 'spoolman', spoolmanId: 55 }),
      getRemoteSpool: vi.fn(),
      onLinkSpoolman: vi.fn(),
    });

    expect(screen.queryByText('Vincular con Spoolman')).not.toBeInTheDocument();
  });
});
