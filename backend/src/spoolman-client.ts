export interface SpoolmanStatus {
  configured: boolean;
  endpoint: string | null;
  state: 'unconfigured' | 'connected' | 'degraded';
  error: string | null;
}

export interface SpoolmanApiVendor {
  name?: string | null;
}

export interface SpoolmanApiFilament {
  name?: string | null;
  material?: string | null;
  color_hex?: string | null;
  vendor?: SpoolmanApiVendor | null;
}

export interface SpoolmanApiSpool {
  id: number;
  filament?: SpoolmanApiFilament | null;
  vendor?: SpoolmanApiVendor | null;
  material?: string | null;
  color_hex?: string | null;
  initial_weight?: number | null;
  remaining_weight?: number | null;
  price?: number | null;
  cost?: number | null;
  comment?: string | null;
}

class SpoolmanClientError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'SpoolmanClientError';
  }
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function normalizeSpoolmanBaseUrl(rawValue?: string | null): string | null {
  const value = rawValue?.trim();
  if (!value) return null;

  const trimmed = trimTrailingSlash(value);
  if (/\/api\/v1$/i.test(trimmed)) return trimmed;
  if (/\/api$/i.test(trimmed)) return `${trimmed}/v1`;
  return `${trimmed}/api/v1`;
}

function normalizeColorHex(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const withoutHash = raw.startsWith('#') ? raw.slice(1) : raw;
  if (!/^[0-9a-fA-F]{6,8}$/.test(withoutHash)) return null;
  return `#${withoutHash.slice(0, 6).toLowerCase()}`;
}

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new SpoolmanClientError(`Spoolman request failed with status ${response.status}`, response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof SpoolmanClientError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new SpoolmanClientError(`Spoolman request timed out after ${timeoutMs}ms`);
    }
    throw new SpoolmanClientError(error instanceof Error ? error.message : 'Unknown Spoolman error');
  } finally {
    clearTimeout(timeout);
  }
}

export function mapRemoteColorHex(spool: SpoolmanApiSpool): string {
  return normalizeColorHex(spool.filament?.color_hex ?? spool.color_hex) ?? '#cccccc';
}

export function getRemoteBrand(spool: SpoolmanApiSpool): string {
  return spool.filament?.vendor?.name?.trim() || spool.vendor?.name?.trim() || 'Spoolman';
}

export function getRemoteMaterial(spool: SpoolmanApiSpool): string {
  return spool.filament?.material?.trim() || spool.material?.trim() || spool.filament?.name?.trim() || 'Unknown';
}

export function getRemoteNotes(spool: SpoolmanApiSpool): string {
  return spool.comment?.trim() || '';
}

export function createSpoolmanClient(env: NodeJS.ProcessEnv = process.env) {
  const endpoint = normalizeSpoolmanBaseUrl(env.SPOOLMAN_BASE_URL);
  const timeoutMs = Number(env.SPOOLMAN_TIMEOUT_MS || '5000');
  const resolvedTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 5000;

  return {
    endpoint,
    configured: endpoint !== null,
    async getStatus(): Promise<SpoolmanStatus> {
      if (!endpoint) {
        return {
          configured: false,
          endpoint: null,
          state: 'unconfigured',
          error: null,
        };
      }

      try {
        await fetchJson<Record<string, unknown>>(`${endpoint}/health`, resolvedTimeoutMs);
        return {
          configured: true,
          endpoint,
          state: 'connected',
          error: null,
        };
      } catch (error) {
        return {
          configured: true,
          endpoint,
          state: 'degraded',
          error: error instanceof Error ? error.message : 'Unknown Spoolman error',
        };
      }
    },
    async listSpools(): Promise<SpoolmanApiSpool[]> {
      if (!endpoint) {
        throw new SpoolmanClientError('Spoolman is not configured');
      }
      return fetchJson<SpoolmanApiSpool[]>(`${endpoint}/spool`, resolvedTimeoutMs);
    },
    async getSpoolById(spoolmanId: number): Promise<SpoolmanApiSpool> {
      if (!endpoint) {
        throw new SpoolmanClientError('Spoolman is not configured');
      }
      return fetchJson<SpoolmanApiSpool>(`${endpoint}/spool/${spoolmanId}`, resolvedTimeoutMs);
    },
  };
}

export { SpoolmanClientError };
