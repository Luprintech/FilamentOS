import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

// Uploads dir: __dirname = backend/dist/src or backend/src depending on compiled/ts-node
const UPLOADS_DIR = path.resolve(__dirname, '../uploads/logos');

// ── Security helpers ──────────────────────────────────────────────────────────

/**
 * Escapa caracteres HTML especiales para prevenir XSS/injection en templates HTML.
 * Debe aplicarse a TODOS los campos de usuario antes de interpolarlos en HTML.
 */
function escHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Valida que un color CSS sea seguro (hex, rgb, hsl o nombre de color básico).
 * Rechaza cualquier valor que contenga caracteres peligrosos.
 */
function sanitizeColor(color: unknown, fallback: string): string {
  if (!color || typeof color !== 'string') return fallback;
  const c = color.trim();
  // Permitir: #hex, rgb(...), rgba(...), hsl(...), nombres de color simples
  if (/^#[0-9A-Fa-f]{3,8}$/.test(c)) return c;
  if (/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)$/.test(c)) return c;
  if (/^hsla?\(\s*[\d.]+\s*,\s*[\d.%]+\s*,\s*[\d.%]+(?:\s*,\s*[\d.]+)?\s*\)$/.test(c)) return c;
  if (/^[a-zA-Z]{2,30}$/.test(c)) return c;
  // Rechazar todo lo demás (expresiones CSS, urls, injection)
  return fallback;
}

/**
 * Valida que una URL de logo sea segura (solo http/https o data:image/).
 * Rechaza paths del sistema de archivos y protocolos peligrosos.
 */
function sanitizeLogoUrl(logoPath: unknown): string | null {
  if (!logoPath || typeof logoPath !== 'string') return null;
  const p = logoPath.trim();
  // Permitir data URIs de imágenes (ya embebidos en base64)
  if (/^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+={0,2}$/.test(p)) return p;
  // Permitir rutas relativas de uploads (con o sin / inicial)
  if (/^(\/)?uploads\/logos\/[a-zA-Z0-9_\-]+\.(png|jpg|jpeg|svg)$/i.test(p)) {
    return p.startsWith('/') ? p : '/' + p;
  }
  // URLs externas http/https: permitir
  if (/^https?:\/\//i.test(p)) return p;
  // Rechazar todo lo demás
  return null;
}

/**
 * Convierte un logo de ruta local (/uploads/logos/...) a una data URI base64.
 * Esto garantiza que el logo se vea en iframes srcDoc y en Puppeteer
 * sin depender de una URL HTTP que puede fallar por CORS o rutas relativas.
 */
function resolveLogoToDataUri(logoPath: string | null): string | null {
  if (!logoPath) return null;
  // Si ya es data URI, usarlo directamente
  if (logoPath.startsWith('data:')) return logoPath;
  // Si es URL externa http/https, usarla tal cual (Puppeteer puede fetchearlo)
  if (/^https?:\/\//i.test(logoPath)) return logoPath;
  // Si es ruta de uploads local, convertir a base64
  const match = logoPath.match(/^\/?uploads\/logos\/([a-zA-Z0-9_\-]+\.(?:png|jpg|jpeg|svg))$/i);
  if (match) {
    const filename = match[1];
    const filePath = path.join(UPLOADS_DIR, filename);
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase().slice(1);
        const mime = ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : ext === 'svg'
            ? 'image/svg+xml'
            : 'image/png';
        return `data:${mime};base64,${data.toString('base64')}`;
      }
    } catch {
      // Si falla la lectura, ignorar y devolver null
    }
  }
  return null;
}

function sanitizeExternalUrl(url: unknown): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

// SVG icons para redes sociales — embebidos inline para funcionar sin conexión
const SOCIAL_ICONS: Record<string, string> = {
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  tiktok: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  x: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  pinterest: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>`,
  etsy: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.81 9.815H8.023l-.254 1.328h1.792s.293-.025.293.24c0 .132-.038.226-.038.226l-.254 1.27s-.062.226-.292.226H7.505l-.518 2.766h2.483l.48-2.49h1.217l-.48 2.49h2.786L15.5 9.815h-2.786l-.48 2.49h-1.217l.48-2.49zm9.89-7.326c0-.27-.213-.489-.47-.489H4.77c-.257 0-.47.219-.47.489v19.022c0 .27.213.489.47.489h14.46c.257 0 .47-.219.47-.489V2.489z"/></svg>`,
  web: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`,
  telegram: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,
};

export interface SocialLink {
  network: string; // key de SOCIAL_ICONS
  url: string;
}

function renderSocialLinks(customization: PdfCustomization): string {
  const links: SocialLink[] = [];

  // Nuevo campo dinámico
  if (Array.isArray(customization.socialLinks)) {
    for (const entry of customization.socialLinks) {
      const safeUrl = sanitizeExternalUrl(entry.url);
      if (safeUrl) links.push({ network: entry.network, url: safeUrl });
    }
  }

  // Backward compat con campos legacy
  if (links.length === 0) {
    const legacyMap: [string, string | null | undefined][] = [
      ['web', customization.websiteUrl],
      ['instagram', customization.instagramUrl],
      ['tiktok', customization.tiktokUrl],
      ['facebook', customization.facebookUrl],
      ['x', customization.xUrl],
    ];
    for (const [network, url] of legacyMap) {
      const safeUrl = sanitizeExternalUrl(url);
      if (safeUrl) links.push({ network, url: safeUrl });
    }
  }

  if (links.length === 0) return '';

  const items = links.map(({ network, url }) => {
    const icon = SOCIAL_ICONS[network] ?? SOCIAL_ICONS.web;
    const safeUrl = escHtml(url);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="social-link" title="${escHtml(network)}">${icon}</a>`;
  }).join('');

  return `
  <div class="social-links">
    ${items}
  </div>`;
}

export interface PdfCustomization {
  logoPath?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  companyName?: string | null;
  footerText?: string | null;
  // Nuevo: array dinámico de redes sociales
  socialLinks?: SocialLink[] | null;
  // Legacy (backward compat)
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  facebookUrl?: string | null;
  xUrl?: string | null;
  showMachineCosts: boolean;
  showBreakdown: boolean;
  showOtherCosts: boolean;
  showLaborCosts: boolean;
  showElectricity: boolean;
  templateName: string;
}

export interface ProjectData {
  jobName?: string;
  printingTimeHours: number;
  printingTimeMinutes: number;
  filamentWeight: number;
  spoolWeight: number;
  spoolPrice: number;
  powerConsumptionWatts: number;
  energyCostKwh: number;
  prepTime: number;
  prepCostPerHour: number;
  postProcessingTimeInMinutes: number;
  postProcessingCostPerHour: number;
  includeMachineCosts: boolean;
  printerCost: number;
  investmentReturnYears: number;
  repairCost: number;
  otherCosts: Array<{ description: string; cost: number }>;
  profitPercentage: number;
  vatPercentage: number;
  currency: string;
  // Calculated results
  filamentCost: number;
  electricityCost: number;
  laborCost: number;
  machineCost: number;
  otherCostsTotal: number;
  subTotal: number;
  profitAmount: number;
  priceBeforeVat: number;
  vatAmount: number;
  finalPrice: number;
}

/**
 * Genera el HTML del PDF con la customización aplicada
 */
export function generatePdfHtml(
  projectData: ProjectData,
  customization: PdfCustomization,
  baseUrl: string
): string {
  const {
    logoPath: rawLogoPath,
    primaryColor: rawPrimary,
    secondaryColor: rawSecondary,
    accentColor: rawAccent,
    companyName: rawCompanyName,
    footerText: rawFooterText,
    showMachineCosts,
    showBreakdown,
    showOtherCosts,
    showLaborCosts,
    showElectricity,
  } = customization;

  // Sanitize and resolve logo to base64 data URI for reliable rendering
  const logoSanitized = sanitizeLogoUrl(rawLogoPath);
  const logoDataUri = resolveLogoToDataUri(logoSanitized);
  const primaryColor = sanitizeColor(rawPrimary, '#29aae1');
  const secondaryColor = sanitizeColor(rawSecondary, '#333333');
  const accentColor = sanitizeColor(rawAccent, '#f0f4f8');
  const companyName = escHtml(rawCompanyName);
  const footerText = escHtml(rawFooterText);

  const {
    jobName: rawJobName,
    printingTimeHours,
    printingTimeMinutes,
    filamentWeight,
    spoolWeight,
    spoolPrice,
    powerConsumptionWatts,
    energyCostKwh,
    prepTime,
    prepCostPerHour,
    postProcessingTimeInMinutes,
    postProcessingCostPerHour,
    includeMachineCosts,
    printerCost,
    investmentReturnYears,
    repairCost,
    otherCosts,
    profitPercentage,
    vatPercentage,
    currency: rawCurrency,
    filamentCost,
    electricityCost,
    laborCost,
    machineCost,
    otherCostsTotal,
    subTotal,
    profitAmount,
    priceBeforeVat,
    vatAmount,
    finalPrice,
  } = projectData;

  const jobName = escHtml(rawJobName);
  // Only allow known currency codes to avoid injection via currency symbol
  const allowedCurrencies: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', JPY: '¥' };
  const currencySymbol = allowedCurrencies[rawCurrency] ?? escHtml(rawCurrency);
  const totalTime = `${Number(printingTimeHours)}h ${Number(printingTimeMinutes)}m`;

  // Safe base URL (only allow http/https)
  const safeBaseUrl = /^https?:\/\//i.test(baseUrl) ? baseUrl : '';

  // Helper para formatear números con moneda (números son seguros ya)
  const formatCurrency = (amount: number) => `${Number(amount).toFixed(2)} ${currencySymbol}`;
  const socialLinksHtml = renderSocialLinks(customization);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <base href="${safeBaseUrl}/" />
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presupuesto - ${jobName || 'Sin nombre'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    :root {
      --primary: ${primaryColor};
      --secondary: ${secondaryColor};
      --accent: ${accentColor};
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: var(--secondary);
      background: white;
      padding: 20mm;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid var(--primary);
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .logo {
      max-height: 80px;
      max-width: 200px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: var(--primary);
    }
    
    .company-name-sub {
      font-size: 13px;
      font-weight: 600;
      color: var(--secondary);
      text-align: center;
      margin-top: 4px;
    }

    .project-info {
      background: var(--accent);
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
    }

    .project-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--primary);
      margin-bottom: 5px;
    }
    
    .project-meta {
      font-size: 11px;
      color: #666;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    th {
      background: var(--primary);
      color: white;
      text-align: left;
      padding: 10px;
      font-weight: 600;
      font-size: 13px;
    }
    
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    tr:hover {
      background: #f9f9f9;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary);
      margin: 25px 0 15px;
      border-left: 4px solid var(--primary);
      padding-left: 10px;
    }
    
    .totals {
      margin-top: 30px;
      border-top: 2px solid var(--primary);
      padding-top: 15px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 13px;
    }
    
    .total-row.final {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary);
      border-top: 2px solid var(--primary);
      padding-top: 15px;
      margin-top: 10px;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      font-size: 10px;
      color: #666;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 8px;
      background: var(--accent);
      color: var(--secondary);
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }

    .social-links {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid #e0e0e0;
    }

    .social-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      color: var(--primary);
      text-decoration: none;
      border: 1px solid var(--primary);
      border-radius: 50%;
    }

    .social-link svg {
      width: 14px;
      height: 14px;
      color: var(--primary);
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
      ${logoDataUri ? `<img src="${logoDataUri}" alt="Logo" class="logo" />` : ''}
      ${companyName ? `<div style="font-size: ${logoDataUri ? '13px' : '24px'}; font-weight: ${logoDataUri ? '600' : '700'}; color: ${logoDataUri ? 'var(--secondary)' : 'var(--primary)'}; margin-top: ${logoDataUri ? '4px' : '0'}">${companyName}</div>` : ''}
    </div>
    <div style="text-align: right;">
      <div style="font-size: 20px; font-weight: 700; color: var(--primary);">PRESUPUESTO</div>
      <div style="font-size: 11px; color: #666;">${new Date().toLocaleDateString('es-ES')}</div>
    </div>
  </div>

  <!-- Project Info -->
  <div class="project-info">
    <div class="project-title">${jobName || 'Proyecto sin nombre'}</div>
    <div class="project-meta">
      Tiempo de impresión: <strong>${escHtml(totalTime)}</strong> | 
      Peso filamento: <strong>${Number(filamentWeight).toFixed(2)}g</strong>
    </div>
  </div>

  ${showBreakdown ? `
  <!-- Cost Breakdown -->
  <div class="section-title">Desglose de Costes</div>
  <table>
    <thead>
      <tr>
        <th>Concepto</th>
        <th>Detalle</th>
        <th style="text-align: right;">Coste</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Filamento</strong></td>
        <td>${Number(filamentWeight).toFixed(2)}g de bobina de ${Number(spoolWeight).toFixed(0)}g (${formatCurrency(spoolPrice)})</td>
        <td style="text-align: right;">${formatCurrency(filamentCost)}</td>
      </tr>
      ${showElectricity ? `
      <tr>
        <td><strong>Electricidad</strong></td>
        <td>${escHtml(totalTime)} × ${Number(powerConsumptionWatts)}W × ${formatCurrency(energyCostKwh)}/kWh</td>
        <td style="text-align: right;">${formatCurrency(electricityCost)}</td>
      </tr>
      ` : ''}
      ${showLaborCosts ? `
      <tr>
        <td><strong>Mano de Obra</strong></td>
        <td>
          Preparación: ${Number(prepTime)}min (${formatCurrency(prepCostPerHour)}/h)<br>
          Post-procesado: ${Number(postProcessingTimeInMinutes)}min (${formatCurrency(postProcessingCostPerHour)}/h)
        </td>
        <td style="text-align: right;">${formatCurrency(laborCost)}</td>
      </tr>
      ` : ''}
      ${showMachineCosts && includeMachineCosts ? `
      <tr>
        <td><strong>Amortización Máquina</strong></td>
        <td>
          Coste impresora: ${formatCurrency(printerCost)}<br>
          Retorno inversión: ${Number(investmentReturnYears)} años<br>
          Reparaciones: ${formatCurrency(repairCost)}
        </td>
        <td style="text-align: right;">${formatCurrency(machineCost)}</td>
      </tr>
      ` : ''}
      ${showOtherCosts && otherCosts.length > 0 ? otherCosts.map(item => `
      <tr>
        <td><strong>Otros</strong></td>
        <td>${escHtml(item.description)}</td>
        <td style="text-align: right;">${formatCurrency(Number(item.cost))}</td>
      </tr>
      `).join('') : ''}
    </tbody>
  </table>
  ` : ''}

  <!-- Totals -->
  <div class="totals">
    <div class="total-row">
      <span>Subtotal (costes directos)</span>
      <strong>${formatCurrency(subTotal)}</strong>
    </div>
    <div class="total-row">
      <span>Margen de beneficio (${Number(profitPercentage)}%)</span>
      <strong>${formatCurrency(profitAmount)}</strong>
    </div>
    <div class="total-row">
      <span>Precio antes de IVA</span>
      <strong>${formatCurrency(priceBeforeVat)}</strong>
    </div>
    <div class="total-row">
      <span>IVA (${Number(vatPercentage)}%)</span>
      <strong>${formatCurrency(vatAmount)}</strong>
    </div>
    <div class="total-row final">
      <span>TOTAL</span>
      <span>${formatCurrency(finalPrice)}</span>
    </div>
  </div>

  <!-- Footer -->
  ${footerText ? `
  <div class="footer">
    ${footerText}
  </div>
  ` : ''}
  ${socialLinksHtml}
  
  <div class="footer" style="margin-top: 10px;">
    Presupuesto generado con <strong>FilamentOS</strong> — ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Datos del proyecto del tracker
 */
export interface TrackerPdfData {
  projectTitle: string;
  projectDescription: string;
  projectGoal: number;
  projectCurrency: string;
  projectPricePerKg: number;
  coverImage: string | null;
  totalPieces: number;
  totalSecs: number;
  totalGrams: number;
  totalCost: number;
  pieces: Array<{
    label: string;
    name: string;
    totalSecs: number;
    totalGrams: number;
    totalCost: number;
    imageUrl: string | null;
    notes: string;
    status: 'pending' | 'printed' | 'post_processed' | 'delivered' | 'failed';
    printedAt: string | null;
    incident: string;
    materials: Array<{
      name: string;
      quantity: number;
      cost: number;
    }>;
  }>;
}

/**
 * Genera el HTML del PDF del tracker con la customización aplicada
 */
export function generateTrackerPdfHtml(
  trackerData: TrackerPdfData,
  customization: PdfCustomization,
  baseUrl: string
): string {
  const {
    logoPath: rawLogoPath,
    primaryColor: rawPrimary,
    secondaryColor: rawSecondary,
    accentColor: rawAccent,
    companyName: rawCompanyName,
    footerText: rawFooterText,
  } = customization;

  // Sanitize and resolve logo to base64 data URI for reliable rendering
  const logoSanitized = sanitizeLogoUrl(rawLogoPath);
  const logoDataUri = resolveLogoToDataUri(logoSanitized);
  const primaryColor = sanitizeColor(rawPrimary, '#29aae1');
  const secondaryColor = sanitizeColor(rawSecondary, '#333333');
  const accentColor = sanitizeColor(rawAccent, '#f0f4f8');
  const companyName = escHtml(rawCompanyName);
  const footerText = escHtml(rawFooterText);

  const {
    projectTitle: rawProjectTitle,
    projectDescription: rawProjectDescription,
    projectGoal,
    projectCurrency: rawProjectCurrency,
    totalPieces,
    totalSecs,
    totalGrams,
    totalCost,
    pieces,
  } = trackerData;

  const projectTitle = escHtml(rawProjectTitle);
  const projectDescription = escHtml(rawProjectDescription);
  const allowedCurrencies: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', JPY: '¥' };
  const currencySymbol = allowedCurrencies[rawProjectCurrency] ?? escHtml(rawProjectCurrency);

  // Safe base URL
  const safeBaseUrl = /^https?:\/\//i.test(baseUrl) ? baseUrl : '';

  // Helper para formatear tiempo
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  // Helper para formatear números con moneda
  const formatCurrency = (amount: number) => `${amount.toFixed(2)} ${currencySymbol}`;
  const socialLinksHtml = renderSocialLinks(customization);
  const statusLabelMap: Record<string, string> = {
    pending: 'Pendiente',
    printed: 'Impresa',
    post_processed: 'Postprocesada',
    delivered: 'Entregada',
    failed: 'Fallida',
  };

  const progressPct = projectGoal > 0 ? Math.min(100, Math.round((totalPieces / projectGoal) * 100)) : 0;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <base href="${safeBaseUrl}/" />
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bitacora de impresion - ${projectTitle}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    :root {
      --primary: ${primaryColor};
      --secondary: ${secondaryColor};
      --accent: ${accentColor};
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: var(--secondary);
      background: white;
      padding: 20mm;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid var(--primary);
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .logo {
      max-height: 80px;
      max-width: 200px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: var(--primary);
    }
    
    .company-name-sub {
      font-size: 13px;
      font-weight: 600;
      color: var(--secondary);
      text-align: center;
      margin-top: 4px;
    }

    .project-info {
      background: var(--accent);
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
    }

    .project-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 5px;
    }
    
    .project-meta {
      font-size: 11px;
      color: #666;
      margin-top: 5px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 25px;
    }
    
    .stat-card {
      background: var(--accent);
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-label {
      font-size: 10px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-value {
      font-size: 16px;
      font-weight: 700;
      color: var(--primary);
      margin-top: 5px;
    }
    
    .progress-bar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 25px;
    }
    
    .progress-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 4px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    th {
      background: var(--primary);
      color: white;
      text-align: left;
      padding: 10px;
      font-weight: 600;
      font-size: 11px;
    }
    
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 11px;
    }
    
    tr:hover {
      background: #f9f9f9;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary);
      margin: 25px 0 15px;
      border-left: 4px solid var(--primary);
      padding-left: 10px;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      font-size: 10px;
      color: #666;
    }
    
    .piece-image {
      max-width: 60px;
      max-height: 60px;
      object-fit: cover;
      border-radius: 4px;
    }

    .piece-card {
      border: 1px solid #e6e6e6;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }

    .piece-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 12px;
    }

    .piece-main {
      flex: 1;
    }

    .piece-kpis {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 12px;
    }

    .piece-kpi {
      background: var(--accent);
      border-radius: 8px;
      padding: 10px;
    }

    .piece-kpi-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #666;
      font-weight: 600;
      letter-spacing: 0.4px;
    }

    .piece-kpi-value {
      font-size: 13px;
      font-weight: 700;
      color: var(--secondary);
      margin-top: 4px;
    }

    .piece-notes {
      margin-top: 12px;
      padding: 10px 12px;
      background: #fafafa;
      border-left: 3px solid var(--primary);
      border-radius: 8px;
    }

    .piece-meta-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }

    .piece-badge {
      display: inline-flex;
      align-items: center;
      border: 1px solid #ddd;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 10px;
      font-weight: 700;
      background: #fff;
      color: #555;
    }

    .subsection-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .muted {
      color: #666;
      font-size: 11px;
    }

    .social-links {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid #e0e0e0;
    }

    .social-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      color: var(--primary);
      text-decoration: none;
      border: 1px solid var(--primary);
      border-radius: 50%;
    }

    .social-link svg {
      width: 14px;
      height: 14px;
      color: var(--primary);
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
      ${logoDataUri ? `<img src="${logoDataUri}" alt="Logo" class="logo" />` : ''}
      ${companyName ? `<div style="font-size: ${logoDataUri ? '13px' : '24px'}; font-weight: ${logoDataUri ? '600' : '700'}; color: ${logoDataUri ? 'var(--secondary)' : 'var(--primary)'}; margin-top: ${logoDataUri ? '4px' : '0'}">${companyName}</div>` : ''}
    </div>
    <div style="text-align: right;">
      <div style="font-size: 20px; font-weight: 700; color: var(--primary);">BITACORA DE IMPRESION</div>
      <div style="font-size: 11px; color: #666;">${new Date().toLocaleDateString('es-ES')}</div>
    </div>
  </div>

  <!-- Project Info -->
  <div class="project-info">
    <div class="project-title">${projectTitle}</div>
    ${projectDescription ? `<div class="project-meta">${projectDescription}</div>` : ''}
    <div class="project-meta">Meta: <strong>${Number(totalPieces)} / ${Number(projectGoal)} piezas</strong> (${Number(progressPct)}%)</div>
  </div>

  <!-- Progress Bar -->
  <div class="progress-bar">
    <div class="progress-fill" style="width: ${Number(progressPct)}%"></div>
  </div>

  <!-- Stats -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Piezas</div>
      <div class="stat-value">${Number(totalPieces)} / ${Number(projectGoal)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Tiempo Total</div>
      <div class="stat-value">${formatTime(totalSecs)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Filamento</div>
      <div class="stat-value">${Number(totalGrams).toFixed(1)}g</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Coste Total</div>
      <div class="stat-value">${formatCurrency(totalCost)}</div>
    </div>
  </div>

  <!-- Pieces List -->
  <div class="section-title">Bitacora de piezas</div>
  ${pieces.map((piece, index) => {
    const notes = escHtml(piece.notes || '');
    const incident = escHtml(piece.incident || '');
    const materials = Array.isArray(piece.materials) ? piece.materials : [];
    const statusLabel = statusLabelMap[piece.status] ?? 'Impresa';
    return `
    <div class="piece-card">
      <div class="piece-top">
        <div class="piece-main">
          <div style="font-size: 11px; color: #666; margin-bottom: 4px;">Pieza #${index + 1} · ${escHtml(piece.label)}</div>
          <div style="font-size: 18px; font-weight: 700; color: var(--primary);">${escHtml(piece.name)}</div>
        </div>
        ${piece.imageUrl ? `<img src="${escHtml(piece.imageUrl)}" alt="${escHtml(piece.name)}" class="piece-image" />` : ''}
      </div>

      <div class="piece-kpis">
        <div class="piece-kpi">
          <div class="piece-kpi-label">Tiempo</div>
          <div class="piece-kpi-value">${formatTime(Number(piece.totalSecs))}</div>
        </div>
        <div class="piece-kpi">
          <div class="piece-kpi-label">Filamento</div>
          <div class="piece-kpi-value">${Number(piece.totalGrams).toFixed(1)}g</div>
        </div>
        <div class="piece-kpi">
          <div class="piece-kpi-label">Coste total</div>
          <div class="piece-kpi-value">${formatCurrency(piece.totalCost)}</div>
        </div>
      </div>

      <div class="piece-meta-badges">
        <span class="piece-badge">Estado: ${escHtml(statusLabel)}</span>
        ${piece.printedAt ? `<span class="piece-badge">Fecha: ${escHtml(piece.printedAt)}</span>` : ''}
      </div>

      ${materials.length > 0 ? `
      <div>
        <div class="subsection-title">Materiales extra</div>
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Cantidad</th>
              <th>Coste</th>
            </tr>
          </thead>
          <tbody>
            ${materials.map((item) => `
            <tr>
              <td>${escHtml(item.name)}</td>
              <td>${Number(item.quantity).toFixed(2)}</td>
              <td>${formatCurrency(Number(item.cost))}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : `<div class="muted">Sin materiales extra registrados.</div>`}

      ${notes ? `
      <div class="piece-notes">
        <div class="subsection-title">Notas</div>
        <div>${notes.replace(/\n/g, '<br />')}</div>
      </div>
      ` : ''}

      ${incident ? `
      <div class="piece-notes">
        <div class="subsection-title">Incidencias / resultado</div>
        <div>${incident.replace(/\n/g, '<br />')}</div>
      </div>
      ` : ''}
    </div>`;
  }).join('')}

  <!-- Footer -->
  ${footerText ? `
  <div class="footer">
    ${footerText}
  </div>
  ` : ''}
  ${socialLinksHtml}
  
  <div class="footer" style="margin-top: 10px;">
    Bitacora generada con <strong>FilamentOS</strong> - ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Genera un PDF usando Puppeteer
 */
export async function generatePdf(
  projectData: ProjectData,
  customization: PdfCustomization,
  baseUrl: string
): Promise<Buffer> {
  const html = generatePdfHtml(projectData, customization, baseUrl);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

/**
 * Genera un PDF del tracker usando Puppeteer
 */
export async function generateTrackerPdf(
  trackerData: TrackerPdfData,
  customization: PdfCustomization,
  baseUrl: string
): Promise<Buffer> {
  const html = generateTrackerPdfHtml(trackerData, customization, baseUrl);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm',
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
