import { describe, expect, it, vi } from 'vitest';
import React from 'react';

// ── Auth mock ──
const mockLogout = vi.fn();
vi.mock('@/context/lupe-auth-context', () => ({
  LupeAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLupeAuth: () => ({
    isAdmin: true,
    loading: false,
    login: vi.fn(),
    logout: mockLogout,
  }),
}));

vi.mock('@/shared/api/http-client', () => ({
  httpRequest: vi.fn(),
  HttpClientError: class extends Error {
    status: number;
    constructor(msg: string, status: number) { super(msg); this.status = status; }
  },
}));

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { httpRequest } from '@/shared/api/http-client';
import { LupePage } from './LupePage';

const mockFilaments = [
  {
    id: '1',
    source: 'manual',
    brand: 'Sakata 3D',
    material: 'PLA',
    color: 'Rojo',
    colorHex: '#ff0000',
    imageUrl: null,
    customImage: null,
    purchaseUrl: 'https://amazon.es/sakata-pla-rojo',
    finish: null,
  },
  {
    id: '2',
    source: 'sync',
    brand: 'eSUN',
    material: 'PETG',
    color: 'Azul',
    colorHex: null,
    imageUrl: 'https://example.com/esun-blue.jpg',
    customImage: 'https://example.com/custom-blue.jpg',
    purchaseUrl: null,
    finish: 'matte',
  },
  {
    id: '3',
    source: 'manual',
    brand: '3DTested',
    material: 'PLA',
    color: 'Verde',
    colorHex: '#00ff00',
    imageUrl: null,
    customImage: null,
    purchaseUrl: 'https://example.com/very-long-url-that-should-be-truncated-in-the-card-display-for-testing-purposes',
    finish: null,
  },
];

const mockPagination = { page: 1, limit: 50, total: 3, totalPages: 1 };

// Helper to navigate to Catalog tab (desktop nav button — first one)
function navigateToCatalog() {
  const catalogTabs = screen.getAllByRole('button', { name: /catálogo/i });
  // Click the desktop nav button (hidden sm:flex one), falls back to first available
  const desktopTab = catalogTabs.find((btn) => btn.closest('nav') !== null) ?? catalogTabs[0];
  fireEvent.click(desktopTab);
}

function mockApiCalls() {
  const mockFn = httpRequest as ReturnType<typeof vi.fn>;
  
  // Use a smart mock that returns based on URL
  mockFn.mockImplementation((opts: { url: string }) => {
    const url = opts.url;
    if (url === '/api/lupe/categories') {
      return Promise.resolve([
        { id: 'cat1', label_es: 'Tutoriales', label_en: 'Tutorials', color: 'text-teal-400', badge_cls: '', sort_order: 1 },
      ]);
    }
    if (url === '/api/lupe/tags') {
      return Promise.resolve([]);
    }
    if (url === '/api/lupe/resources') {
      return Promise.resolve([]);
    }
    if (url.startsWith('/api/filament-catalog/metadata/filters')) {
      return Promise.resolve({ brands: ['Sakata 3D', 'eSUN', '3DTested'], materials: ['PLA', 'PETG'] });
    }
    if (url.startsWith('/api/filament-catalog')) {
      return Promise.resolve({
        items: mockFilaments,
        pagination: mockPagination,
      });
    }
    return Promise.resolve({});
  });
}

async function navigateToCatalogAndWait() {
  navigateToCatalog();
  // Wait for the filament grid to render (not the filter options)
  await waitFor(() => {
    const grid = document.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.children.length).toBe(3);
  });
}

describe('T6 — CatalogTab: flex cards instead of HTML table', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiCalls('catalog');
  });

  it('renders a card grid instead of an HTML table for filament catalog', async () => {
    render(<LupePage />);
    await navigateToCatalogAndWait();

    // No <table> element should be present
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    // The filament cards grid (with gap-2, not gap-4 which is the filters grid)
    const grids = document.querySelectorAll<HTMLElement>('.grid');
    const filamentGrid = Array.from(grids).find((g) => g.className.includes('gap-2'));
    expect(filamentGrid).toBeInTheDocument();

    // Should render exactly 3 filament cards (count brand <p> elements)
    const brandElements = document.querySelectorAll('p.text-sm.font-extrabold');
    expect(brandElements).toHaveLength(3);
  });

  it('shows brand, material, and color for each filament in the card', async () => {
    render(<LupePage />);
    await navigateToCatalogAndWait();

    // Use getAllByText since brand appears in both filter options and cards
    const sakataTexts = screen.getAllByText('Sakata 3D');
    expect(sakataTexts.length).toBeGreaterThanOrEqual(1);

    // First card shows material · color
    expect(screen.getByText(/PLA · Rojo/)).toBeInTheDocument();

    // Second card shows brand "eSUN"
    const esunTexts = screen.getAllByText('eSUN');
    expect(esunTexts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/PETG · Azul/)).toBeInTheDocument();
  });

  it('shows purchase URL as a link when available', async () => {
    render(<LupePage />);
    await navigateToCatalogAndWait();

    // First filament has amazon link
    const links = screen.getAllByRole('link');
    const purchaseLink = links.find((l) => l.getAttribute('href') === 'https://amazon.es/sakata-pla-rojo');
    expect(purchaseLink).toBeInTheDocument();
    expect(purchaseLink).toHaveAttribute('target', '_blank');
    expect(purchaseLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows fallback text when purchase URL is missing', async () => {
    render(<LupePage />);
    await navigateToCatalogAndWait();

    // Second filament has no purchaseUrl
    expect(screen.getByText('Sin enlace')).toBeInTheDocument();
  });

  it('shows edit button on all cards and delete button only for manual source', async () => {
    render(<LupePage />);
    await navigateToCatalogAndWait();

    // All 3 cards should have an edit button (Pencil icon buttons)
    const editButtons = screen.getAllByTitle('Editar enlace');
    expect(editButtons).toHaveLength(3);

    // 2 manual filaments (Sakata, 3DTested) should have delete buttons
    const deleteButtons = screen.getAllByTitle('Eliminar');
    expect(deleteButtons).toHaveLength(2);
  });

  it('uses SpoolIcon fallback when customImage is absent', async () => {
    render(<LupePage />);
    await navigateToCatalogAndWait();

    // Only the 2nd filament has customImage — verify it renders as an <img>
    const images = document.querySelectorAll<HTMLImageElement>('img');
    const customImages = Array.from(images).filter((img) => img.getAttribute('src') === mockFilaments[1].customImage);
    expect(customImages).toHaveLength(1); // only the 2nd filament has customImage
  });

  it('truncates long purchase URLs', async () => {
    render(<LupePage />);
    await navigateToCatalogAndWait();

    // Third filament has a very long URL — the display strips protocol, should be truncated
    const longUrl = await screen.findByText(/truncated-in-the-card/);
    // The span with truncate class should show truncated text (not the full URL)
    expect(longUrl.textContent?.length).toBeLessThan(mockFilaments[2].purchaseUrl!.length);
  });

  it('renders cards in responsive grid columns', async () => {
    render(<LupePage />);
    await navigateToCatalogAndWait();

    // Find the filament grid (gap-2, not the filter grid with gap-2)
    const grids = document.querySelectorAll<HTMLElement>('.grid');
    const filamentGrid = Array.from(grids).find((g) => g.className.includes('gap-2') && g.className.includes('lg:grid-cols-3'));
    expect(filamentGrid).toBeInTheDocument();
    // Should have responsive grid classes
    expect(filamentGrid!.className).toContain('sm:grid-cols-2');
    expect(filamentGrid!.className).toContain('lg:grid-cols-3');
  });
});
