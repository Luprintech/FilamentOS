import { normalizeSpoolmanBaseUrl } from './spoolman-client.js';

export interface ResolvedInventoryLabel {
  provider: 'spoolman';
  spoolmanId: number;
}

export function resolveInventoryLabel(code: string, spoolmanBaseUrl?: string | null): ResolvedInventoryLabel | null {
  const normalizedBaseUrl = normalizeSpoolmanBaseUrl(spoolmanBaseUrl);
  if (!normalizedBaseUrl) return null;

  try {
    const scannedUrl = new URL(code);
    const configuredUrl = new URL(normalizedBaseUrl);
    if (scannedUrl.host !== configuredUrl.host) return null;

    const match = scannedUrl.pathname.match(/^\/spool\/(\d+)\/?$/i);
    if (!match) return null;

    return {
      provider: 'spoolman',
      spoolmanId: Number(match[1]),
    };
  } catch {
    return null;
  }
}
