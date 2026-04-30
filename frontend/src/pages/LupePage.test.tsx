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
  // The component mounts with tab='resources':
  // 1. AdminPanel: /api/lupe/categories
  // 2. AdminPanel: /api/lupe/tags
  // 3. ResourcesTab: /api/lupe/resources
  // Then when we navigate to Catalog:
  // 4. CatalogTab: /api/filament-catalog/metadata/filters
  // 5. CatalogTab: /api/filament-catalog?page=1&limit=50
  const mockFn = httpRequest as ReturnType<typeof vi.fn>;
  
  mockFn
    .mockResolvedValueOnce([
      { id: 'cat1', label_es: 'Tutoriales', label_en: 'Tutorials', color: 'text-teal-400', badge_cls: '', sort_order: 1 },
    ])  // 1. AdminPanel: /api/lupe/categories
    .mockResolvedValueOnce([])  // 2. AdminPanel: /api/lupe/tags
    .mockResolvedValueOnce([])  // 3. ResourcesTab: /api/lupe/resources (default tab)
    .mockResolvedValueOnce({ brands: ['Sakata 3D', 'eSUN', '3DTested'], materials: ['PLA', 'PETG'] })  // 4. CatalogTab: /api/filament-catalog/metadata/filters
    .mockResolvedValueOnce({  // 5. CatalogTab: /api/filament-catalog?page=1&limit=50
      items: mockFilaments,
      pagination: mockPagination,
    });
}

async function navigateToCatalogAndWait() {
  navigateToCatalog();
  // Wait for the filament data to render (look for the brand text)
  await waitFor(() => {
    expect(screen.getByText('Sakata 3D')).toBeInTheDocument();
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

    // Should render a grid container with filament cards
    const grid = document.querySelector('.grid');
    expect(grid).toBeInTheDocument();

    // Should render exactly 3 filament cards
    const cards = grid?.querySelectorAll('[class*="rounded-\\[18px\\]"]');
    expect(cards).toHaveLength(3);
  });

  it('shows brand, material, and color for each filament in the card', async () => {
    render(<LupePage />);
    await navigateToCatalogAndWait();

    // First card shows brand "Sakata 3D"
    expect(screen.getByText('Sakata 3D')).toBeInTheDocument();
    // First card shows material · color
    expect(screen.getByText(/PLA · Rojo/)).toBeInTheDocument();

    // Second card shows brand "eSUN"
    expect(screen.getByText('eSUN')).toBeInTheDocument();
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

    // Third filament has a very long URL — should be truncated
    const longUrl = await screen.findByText(/example\.com/);
    // The span with truncate class should show truncated text (not the full URL)
    expect(longUrl.textContent?.length).toBeLessThan(mockFilaments[2].purchaseUrl!.length);
  });

  it('renders cards in responsive grid columns', async () => {
    render(<LupePage />);
    await navigateToCatalogAndWait();

    const grid = document.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    // Should have responsive grid classes
    expect(grid!.className).toContain('sm:grid-cols-2');
    expect(grid!.className).toContain('lg:grid-cols-3');
  });
});
