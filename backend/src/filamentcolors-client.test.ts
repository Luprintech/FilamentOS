import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fetchFilamentColorsSwatchesPage,
  fetchFilamentColorsVersionInfo,
  mapFilamentColorsSwatchToCatalogRecord,
} from './filamentcolors-client';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('filamentcolors client', () => {
  it('maps version info from official endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ db_version: 1, db_last_modified: 1776301316 }),
    }));

    const result = await fetchFilamentColorsVersionInfo();

    expect(result).toEqual({ dbVersion: 1, dbLastModified: '1776301316' });
  });

  it('requests swatch pages with pagination params', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 1, next: null, results: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchFilamentColorsSwatchesPage(2, 50);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://filamentcolors.xyz/api/swatch/?page=2&page_size=50',
      expect.objectContaining({ headers: expect.any(Object), signal: expect.any(AbortSignal) })
    );
  });

  it('normalizes official swatch payload into catalog record', () => {
    const result = mapFilamentColorsSwatchToCatalogRecord({
      id: 3057,
      slug: 'creality-black-pla-3057',
      manufacturer: { name: 'Creality' },
      color_name: 'Black',
      filament_type: { name: 'PLA', parent_type: { name: 'PLA' } },
      card_img: 'https://filamentcolors.xyz/media/thumb.jpg',
      amazon_purchase_link: 'https://amzn.to/example',
      mfr_purchase_link: null,
      hex_color: '313130',
      td: 0.2,
    });

    expect(result).toMatchObject({
      id: 'filamentcolors:3057',
      source: 'filamentcolors',
      externalId: '3057',
      slug: 'creality-black-pla-3057',
      brand: 'Creality',
      material: 'PLA',
      color: 'Black',
      colorHex: '#313130',
      imageUrl: 'https://filamentcolors.xyz/media/thumb.jpg',
      purchaseUrl: 'https://amzn.to/example',
    });

    expect(JSON.parse(result.metadataJson)).toEqual({ td: 0.2, materialName: 'PLA' });
  });
});
