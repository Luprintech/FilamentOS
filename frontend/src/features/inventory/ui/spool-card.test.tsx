import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Spool } from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'inventory.finished': 'Terminada',
        'inventory.lowStock': 'Stock bajo',
        'inventory.remaining': 'Restante',
        'inventory.totalGrams': 'Total',
        'inventory.price': 'Precio',
        'inventory.buyLink': 'Comprar',
      };
      return translations[key] ?? key;
    },
  }),
}));

import { SpoolCard } from './spool-card';

function createSpool(overrides: Partial<Spool> = {}): Spool {
  return {
    id: overrides.id ?? 'spool-1',
    brand: overrides.brand ?? 'Bambu Lab',
    material: overrides.material ?? 'PLA',
    color: overrides.color ?? 'Blanco',
    colorHex: overrides.colorHex ?? '#ffffff',
    totalGrams: overrides.totalGrams ?? 1000,
    remainingG: overrides.remainingG ?? 900,
    price: overrides.price ?? 20,
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

describe('SpoolCard', () => {
  it('no muestra badges de procedencia del inventario', () => {
    render(
      <SpoolCard
        spool={createSpool({ inventorySource: 'local', spoolmanId: null })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDeduct={vi.fn()}
        onFinish={vi.fn()}
      />,
    );

    expect(screen.queryByText('Local')).not.toBeInTheDocument();
    expect(screen.queryByText('Spoolman')).not.toBeInTheDocument();
  });

  it('expone el enlace de compra cuando la bobina tiene shopUrl', () => {
    render(
      <SpoolCard
        spool={createSpool({ shopUrl: 'https://store.example/spools/1' })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDeduct={vi.fn()}
        onFinish={vi.fn()}
      />,
    );

    const link = screen.getByRole('link', { name: 'Comprar' });
    expect(link).toHaveAttribute('href', 'https://store.example/spools/1');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('muestra acciones activas y ejecuta callbacks para bobinas locales', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onDeduct = vi.fn();
    const onFinish = vi.fn();

    render(
      <SpoolCard
        spool={createSpool({ remainingG: 120, notes: 'Secar antes de imprimir' })}
        onEdit={onEdit}
        onDelete={onDelete}
        onDeduct={onDeduct}
        onFinish={onFinish}
      />,
    );

    expect(screen.getByText('Stock bajo')).toBeInTheDocument();
    expect(screen.getByText('Secar antes de imprimir')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /inventory.deduct/i }));
    fireEvent.click(screen.getByRole('button', { name: /inventory.markFinished/i }));
    fireEvent.click(screen.getAllByRole('button')[2]);
    fireEvent.click(screen.getAllByRole('button')[3]);

    expect(onDeduct).toHaveBeenCalledWith(expect.objectContaining({ id: 'spool-1' }));
    expect(onFinish).toHaveBeenCalledWith('spool-1');
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'spool-1' }));
    expect(onDelete).toHaveBeenCalledWith('spool-1');
  });

  it('en guest mode bloquea acciones reales y deriva al login', () => {
    const onGuestAction = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onDeduct = vi.fn();
    const onFinish = vi.fn();

    render(
      <SpoolCard
        spool={createSpool()}
        onEdit={onEdit}
        onDelete={onDelete}
        onDeduct={onDeduct}
        onFinish={onFinish}
        guestMode
        onGuestAction={onGuestAction}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /inventory.deduct/i }));
    fireEvent.click(screen.getByRole('button', { name: /inventory.markFinished/i }));

    expect(onGuestAction).toHaveBeenCalledTimes(2);
    expect(onEdit).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    expect(onDeduct).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('para bobinas terminadas muestra badges finales y solo acciones de editar/eliminar', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <SpoolCard
        spool={createSpool({ status: 'finished', inventorySource: 'spoolman', remainingG: 0 })}
        onEdit={onEdit}
        onDelete={onDelete}
        onDeduct={vi.fn()}
        onFinish={vi.fn()}
      />,
    );

    expect(screen.getByText('Terminada')).toBeInTheDocument();
    expect(screen.queryByText(/inventory.deduct/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/inventory.markFinished/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getAllByRole('button')[1]);

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'spool-1' }));
    expect(onDelete).toHaveBeenCalledWith('spool-1');
  });
});
