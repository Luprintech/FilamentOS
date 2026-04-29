import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import type { Spool } from '../types';

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
      prefill={overrides.prefill}
    />,
  );
}

describe('SpoolForm', () => {
  it('no muestra controles visibles de Spoolman durante la edición', () => {
    renderForm({
      editingSpool: createSpool({ inventorySource: 'spoolman', spoolmanId: 55 }),
    });

    expect(screen.queryByText(/Spoolman/i)).not.toBeInTheDocument();
  });

  it('mantiene el formulario base operativo para guardar cambios locales', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit });

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it('renderiza el formulario con la bobina a editar', () => {
    renderForm();
    expect(screen.getByDisplayValue('Local spool')).toBeInTheDocument();
  });
});
