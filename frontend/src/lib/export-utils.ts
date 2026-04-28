// ── CSV separator ─────────────────────────────────────────────────────────────
// Excel uses the list separator from the OS locale. For es/pt/de/fr (decimal comma)
// Excel expects ";" as CSV separator. For en/others it expects ",".
// We detect it from the browser locale.
export function getCsvSeparator(): ',' | ';' {
  const lang = (navigator.language || 'en').toLowerCase();
  const commaLocales = ['es', 'pt', 'de', 'fr', 'it', 'nl', 'pl', 'ru', 'tr'];
  return commaLocales.some((l) => lang.startsWith(l)) ? ';' : ',';
}

export function escapeCsvValue(value: unknown, sep: string): string {
  const s = String(value ?? '');
  // Quote if contains separator, quote char, or newline
  if (s.includes(sep) || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv(rows: unknown[][], sep = getCsvSeparator()): string {
  // BOM so Excel opens UTF-8 correctly on all platforms
  const bom = '\uFEFF';
  const body = rows.map((row) => row.map((v) => escapeCsvValue(v, sep)).join(sep)).join('\n');
  return bom + body;
}

export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function slugifyFilename(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'export';
}
