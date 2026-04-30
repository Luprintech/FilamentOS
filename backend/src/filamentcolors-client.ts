const FILAMENT_COLORS_BASE_URL = 'https://filamentcolors.xyz';
const FILAMENT_COLORS_TIMEOUT_MS = 5000;

export interface FilamentColorsVersionInfo {
  dbVersion: number;
  dbLastModified: string;
}

export interface FilamentCatalogRecord {
  id: string;
  source: 'filamentcolors';
  externalId: string;
  slug: string;
  brand: string;
  material: string;
  color: string;
  colorHex: string | null;
  finish: string | null;
  imageUrl: string | null;
  purchaseUrl: string | null;
  metadataJson: string;
}

interface FilamentColorsSwatchResponse {
  count: number;
  next: string | null;
  results: FilamentColorsSwatch[];
}

interface FilamentColorsSwatch {
  id: number;
  slug: string;
  manufacturer: { name: string };
  color_name: string;
  filament_type: { name: string; parent_type?: { name?: string } | null };
  card_img?: string | null;
  amazon_purchase_link?: string | null;
  mfr_purchase_link?: string | null;
  hex_color?: string | null;
  td?: number | null;
}

function withTimeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

function normalizeHexColor(hexColor: string | null | undefined): string | null {
  if (!hexColor) return null;
  const trimmed = hexColor.replace(/^#/, '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(trimmed)) return null;
  return `#${trimmed.toUpperCase()}`;
}

function inferFinish(slug: string, colorName: string): string | null {
  const raw = `${slug} ${colorName}`.toLowerCase();
  if (raw.includes('matte')) return 'matte';
  if (raw.includes('silk')) return 'silk';
  if (raw.includes('marble')) return 'marble';
  if (raw.includes('translucent')) return 'translucent';
  return null;
}

function pickPurchaseUrl(swatch: FilamentColorsSwatch): string | null {
  return swatch.mfr_purchase_link ?? swatch.amazon_purchase_link ?? null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'FilamentOS/1.0 (+https://github.com/Luprintech/filamentOS)',
    },
    signal: withTimeoutSignal(FILAMENT_COLORS_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`FilamentColors request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchFilamentColorsVersionInfo(): Promise<FilamentColorsVersionInfo> {
  const payload = await fetchJson<{ db_version: number; db_last_modified: number | string }>(
    `${FILAMENT_COLORS_BASE_URL}/api/version/`
  );

  return {
    dbVersion: payload.db_version,
    dbLastModified: String(payload.db_last_modified),
  };
}

export async function fetchFilamentColorsSwatchesPage(page = 1, pageSize = 100): Promise<FilamentColorsSwatchResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  return fetchJson<FilamentColorsSwatchResponse>(`${FILAMENT_COLORS_BASE_URL}/api/swatch/?${params.toString()}`);
}

export function mapFilamentColorsSwatchToCatalogRecord(swatch: FilamentColorsSwatch): FilamentCatalogRecord {
  return {
    id: `filamentcolors:${swatch.id}`,
    source: 'filamentcolors',
    externalId: String(swatch.id),
    slug: swatch.slug,
    brand: swatch.manufacturer.name,
    material: swatch.filament_type.parent_type?.name || swatch.filament_type.name,
    color: swatch.color_name,
    colorHex: normalizeHexColor(swatch.hex_color),
    finish: inferFinish(swatch.slug, swatch.color_name),
    imageUrl: swatch.card_img ?? null,
    purchaseUrl: pickPurchaseUrl(swatch),
    metadataJson: JSON.stringify({
      td: swatch.td ?? null,
      materialName: swatch.filament_type.name,
    }),
  };
}
