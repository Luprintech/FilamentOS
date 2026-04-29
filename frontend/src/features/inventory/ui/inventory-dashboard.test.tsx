import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Spool, SpoolmanStatus } from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'inventory.title': 'Inventario de filamento',
        'inventory.subtitle': 'Gestioná tus bobinas',
        'inventory.addSpool': 'Añadir bobina',
        'inventory.remaining': 'Restante',
        'inventory.totalGrams': 'Total',
        'inventory.price': 'Precio',
        'inventory.source.local': 'Local',
        'inventory.totalValue': 'Valor total',
        'inventory.avgCostKg': 'Coste promedio',
        'inventory.activeSpools': 'Bobinas activas',
        'inventory.lowStockAlert': 'Stock bajo',
        'inventory.lowStockWarning': `Tenés ${params?.count} bobinas con stock bajo.`,
        'inventory.emptyTitle': 'Todavía no tenés bobinas cargadas',
        'inventory.emptySubtitle': 'Agregá tu primera bobina para empezar a controlar stock.',
        'inventory.page': `Página ${params?.current} de ${params?.total}`,
        'inventory.spoolCount': 'bobinas',
        'inventory.deleteConfirm': `¿Eliminar ${params?.name}?`,
        tracker_login_text: 'Iniciá sesión para ver tu inventario',
        scan_btn: 'Escanear',
        delete: 'Eliminar',
        cancel: 'Cancelar',
        save_changes: 'Guardar cambios',
      };

      if (key === 'inventory.showing') {
        return `Mostrando ${params?.start}-${params?.end} de ${params?.total} bobinas`;
      }

      return translations[key] ?? key;
    },
  }),
}));

const mockUseInventory = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../api/use-inventory', () => ({
  useInventory: (...args: unknown[]) => mockUseInventory(...args),
}));

vi.mock('@/context/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('./spool-card', () => ({
  SpoolCard: ({
    spool,
    onEdit,
    onDelete,
  }: {
    spool: Spool;
    onEdit: (spool: Spool) => void;
    onDelete: (id: string) => void;
  }) => (
    <div>
      <span>{spool.brand}</span>
      <button type="button" onClick={() => onEdit(spool)}>
        Editar {spool.brand}
      </button>
      <button type="button" onClick={() => onDelete(spool.id)}>
        Eliminar {spool.brand}
      </button>
    </div>
  ),
}));

vi.mock('./deduct-modal', () => ({
  DeductModal: ({ spool }: { spool: Spool | null }) => <div>{spool ? `DeductModal:${spool.id}` : 'DeductModal:closed'}</div>,
}));

vi.mock('./barcode-scanner-modal', () => ({
  BarcodeScannerModal: ({ open, onFill }: { open: boolean; onFill: (data: { brand: string }) => void }) => (
    <div>
      <span>{open ? 'Scanner:open' : 'Scanner:closed'}</span>
      <button type="button" onClick={() => onFill({ brand: 'Scanned spool' })}>
        Completar escaneo
      </button>
    </div>
  ),
}));

vi.mock('./spool-form', () => ({
  SpoolForm: ({
    open,
    editingSpool,
    prefill,
    onClose,
    onSubmit,
  }: {
    open: boolean;
    editingSpool: Spool | null;
    prefill?: { brand?: string };
    onClose: () => void;
    onSubmit: (input: { brand: string }) => void;
  }) => (
    <div>
      <span>{open ? 'SpoolForm:open' : 'SpoolForm:closed'}</span>
      <span>{editingSpool ? `Editing:${editingSpool.id}` : 'Editing:none'}</span>
      <span>{prefill?.brand ? `Prefill:${prefill.brand}` : 'Prefill:none'}</span>
      <button type="button" onClick={() => onSubmit({ brand: 'Created from test' })}>
        Enviar formulario
      </button>
      <button type="button" onClick={onClose}>
        Cerrar formulario
      </button>
    </div>
  ),
}));

vi.mock('@/components/guest-banner', () => ({
  GuestBanner: ({ message }: { message: string }) => <div>{message}</div>,
}));

vi.mock('@/components/login-required-modal', () => ({
  LoginRequiredModal: ({ open }: { open: boolean }) => <div>{open ? 'LoginRequired:open' : 'LoginRequired:closed'}</div>,
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <div>Loading skeleton</div>,
}));

import { InventoryDashboard } from './inventory-dashboard';

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

describe('InventoryDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isGuest: false });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('oculta cualquier banner visible de Spoolman aunque exista estado remoto', () => {
    const degradedStatus: SpoolmanStatus = {
      configured: true,
      endpoint: 'https://spoolman.local/api/v1',
      state: 'degraded',
      error: 'offline',
    };

    mockUseInventory.mockReturnValue({
      spools: [createSpool()],
      loading: false,
      error: null,
      customBrands: [],
      customMaterials: [],
      spoolmanStatus: degradedStatus,
      createSpool: vi.fn(),
      updateSpool: vi.fn(),
      deleteSpool: vi.fn(),
      deductSpool: vi.fn(),
      finishSpool: vi.fn(),
      syncSpoolman: vi.fn(),
      getRemoteSpool: vi.fn(),
      linkSpoolman: vi.fn(),
    });

    render(<InventoryDashboard userId="user-1" authLoading={false} />);

    expect(screen.queryByText(/Spoolman/i)).not.toBeInTheDocument();
  });

  it('mantiene la edición normal del inventario aunque exista estado de Spoolman', () => {
    const localSpool = createSpool();
    mockUseInventory.mockReturnValue({
      spools: [localSpool],
      loading: false,
      error: null,
      customBrands: [],
      customMaterials: [],
      spoolmanStatus: {
        configured: true,
        endpoint: 'https://spoolman.local/api/v1',
        state: 'connected',
        error: null,
      } satisfies SpoolmanStatus,
      createSpool: vi.fn(),
      updateSpool: vi.fn(),
      deleteSpool: vi.fn(),
      deductSpool: vi.fn(),
      finishSpool: vi.fn(),
      syncSpoolman: vi.fn(),
      getRemoteSpool: vi.fn(),
      linkSpoolman: vi.fn(),
    });

    render(<InventoryDashboard userId="user-1" authLoading={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar Local spool' }));

    expect(screen.getByText('SpoolForm:open')).toBeInTheDocument();
    expect(screen.queryByText(/Spoolman/i)).not.toBeInTheDocument();
  });

  it('muestra el acceso restringido cuando no hay usuario autenticado', () => {
    mockUseInventory.mockReturnValue({
      spools: [],
      loading: false,
      error: null,
      customBrands: [],
      customMaterials: [],
      spoolmanStatus: null,
      createSpool: vi.fn(),
      updateSpool: vi.fn(),
      deleteSpool: vi.fn(),
      deductSpool: vi.fn(),
      finishSpool: vi.fn(),
      syncSpoolman: vi.fn(),
      getRemoteSpool: vi.fn(),
      linkSpoolman: vi.fn(),
    });

    render(<InventoryDashboard userId={null} authLoading={false} />);

    expect(screen.getByText('Iniciá sesión para ver tu inventario')).toBeInTheDocument();
  });

  it('en modo guest abre el modal de login y usa el inventario de ejemplo', () => {
    mockUseAuth.mockReturnValue({ isGuest: true });
    mockUseInventory.mockReturnValue({
      spools: [],
      loading: false,
      error: null,
      customBrands: [],
      customMaterials: [],
      spoolmanStatus: null,
      createSpool: vi.fn(),
      updateSpool: vi.fn(),
      deleteSpool: vi.fn(),
      deductSpool: vi.fn(),
      finishSpool: vi.fn(),
      syncSpoolman: vi.fn(),
      getRemoteSpool: vi.fn(),
      linkSpoolman: vi.fn(),
    });

    render(<InventoryDashboard userId={null} authLoading={false} />);

    expect(screen.getByText(/Inventario de ejemplo\. Inicia sesión para gestionar tus bobinas reales\./)).toBeInTheDocument();
    expect(screen.getByText(/Mostrando 1-4 de \d+ bobinas/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Escanear' }));
    expect(screen.getByText('LoginRequired:open')).toBeInTheDocument();
  });

  it('muestra loading, error y estado vacío, y permite abrir/cerrar el formulario desde el vacío', async () => {
    mockUseInventory.mockReturnValue({
      spools: [],
      loading: true,
      error: new Error('No se pudo cargar'),
      customBrands: [],
      customMaterials: [],
      spoolmanStatus: null,
      createSpool: vi.fn(),
      updateSpool: vi.fn(),
      deleteSpool: vi.fn(),
      deductSpool: vi.fn(),
      finishSpool: vi.fn(),
      syncSpoolman: vi.fn(),
      getRemoteSpool: vi.fn(),
      linkSpoolman: vi.fn(),
    });

    const { rerender } = render(<InventoryDashboard userId="user-1" authLoading={false} />);
    expect(screen.getAllByText('Loading skeleton')).toHaveLength(3);
    expect(screen.getByText('No se pudo cargar')).toBeInTheDocument();

    mockUseInventory.mockReturnValue({
      spools: [],
      loading: false,
      error: null,
      customBrands: [],
      customMaterials: [],
      spoolmanStatus: null,
      createSpool: vi.fn(),
      updateSpool: vi.fn(),
      deleteSpool: vi.fn(),
      deductSpool: vi.fn(),
      finishSpool: vi.fn(),
      syncSpoolman: vi.fn(),
      getRemoteSpool: vi.fn(),
      linkSpoolman: vi.fn(),
    });

    rerender(<InventoryDashboard userId="user-1" authLoading={false} />);

    expect(screen.getByText('Todavía no tenés bobinas cargadas')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Añadir bobina' })[0]);
    expect(screen.getByText('SpoolForm:open')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar formulario' }));
    await waitFor(() => expect(screen.getByText('SpoolForm:closed')).toBeInTheDocument());
  });

  it('pagina el listado, confirma borrado y usa el prefill del escáner', async () => {
    const deleteSpool = vi.fn<() => Promise<void>>().mockResolvedValue();
    const createSpool = vi.fn<() => Promise<void>>().mockResolvedValue();
    const spools = Array.from({ length: 5 }, (_, index) =>
      createSpoolItem({
        id: `spool-${index + 1}`,
        brand: `Bobina ${index + 1}`,
        remainingG: index === 0 ? 80 : 700,
      }),
    );

    mockUseInventory.mockReturnValue({
      spools,
      loading: false,
      error: null,
      customBrands: [],
      customMaterials: [],
      spoolmanStatus: null,
      createSpool,
      updateSpool: vi.fn(),
      deleteSpool,
      deductSpool: vi.fn(),
      finishSpool: vi.fn(),
      syncSpoolman: vi.fn(),
      getRemoteSpool: vi.fn(),
      linkSpoolman: vi.fn(),
    });

    render(<InventoryDashboard userId="user-1" authLoading={false} />);

    expect(screen.getByText('Tenés 1 bobinas con stock bajo.')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1-4 de 5 bobinas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('button', { name: 'Página 2' }));
    expect(screen.getByText('Bobina 5')).toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Bobina 5' }));
    expect(screen.getByText('¿Eliminar Bobina 5 Negro?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(deleteSpool).toHaveBeenCalledWith('spool-5'));

    fireEvent.click(screen.getByRole('button', { name: 'Escanear' }));
    expect(screen.getByText('Scanner:open')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Completar escaneo' }));
    expect(screen.getByText('Prefill:Scanned spool')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar formulario' }));
    await waitFor(() => expect(createSpool).toHaveBeenCalledWith({ brand: 'Created from test' }));
  });
});

function createSpoolItem(overrides: Partial<Spool> = {}): Spool {
  return createSpool(overrides);
}
