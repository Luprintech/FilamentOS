// Script manual para sincronizar el catálogo completo de FilamentColors.xyz
require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');

const FILAMENT_COLORS_BASE_URL = 'https://filamentcolors.xyz';
const FILAMENT_COLORS_TIMEOUT_MS = 10000;

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../data.db');
const db = new Database(dbPath);

function normalizeHexColor(hexColor) {
  if (!hexColor) return null;
  const trimmed = hexColor.replace(/^#/, '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(trimmed)) return null;
  return `#${trimmed.toUpperCase()}`;
}

function inferFinish(slug, colorName) {
  const raw = `${slug} ${colorName}`.toLowerCase();
  if (raw.includes('matte')) return 'matte';
  if (raw.includes('silk')) return 'silk';
  if (raw.includes('marble')) return 'marble';
  if (raw.includes('translucent')) return 'translucent';
  return null;
}

function pickPurchaseUrl(swatch) {
  return swatch.mfr_purchase_link || swatch.amazon_purchase_link || null;
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FILAMENT_COLORS_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'FilamentOS/1.0 (+https://github.com/Luprintech/filamentOS)',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`FilamentColors request failed: ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchVersionInfo() {
  const payload = await fetchJson(`${FILAMENT_COLORS_BASE_URL}/api/version/`);
  return {
    dbVersion: payload.db_version,
    dbLastModified: String(payload.db_last_modified),
  };
}

async function fetchSwatchesPage(page = 1, pageSize = 100) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  return fetchJson(`${FILAMENT_COLORS_BASE_URL}/api/swatch/?${params.toString()}`);
}

function mapSwatchToCatalogRecord(swatch) {
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
    imageUrl: swatch.card_img || null,
    purchaseUrl: pickPurchaseUrl(swatch),
    metadataJson: JSON.stringify({
      td: swatch.td || null,
      materialName: swatch.filament_type.name,
    }),
  };
}

async function syncCatalog() {
  console.log('🚀 Iniciando sincronización completa del catálogo FilamentColors.xyz...\n');

  const now = new Date().toISOString();

  // Marcar inicio de sincronización
  db.prepare(
    `INSERT INTO filament_catalog_sync_state (provider, last_checked_at)
     VALUES ('filamentcolors', ?)
     ON CONFLICT(provider) DO UPDATE SET last_checked_at = excluded.last_checked_at`
  ).run(now);

  const versionInfo = await fetchVersionInfo();
  console.log(`📦 Versión del catálogo FilamentColors: ${versionInfo.dbVersion}`);
  console.log(`📅 Última modificación: ${versionInfo.dbLastModified}\n`);

  const insert = db.prepare(
    `INSERT INTO filament_catalog
      (id, source, external_id, slug, brand, material, color, color_hex, finish, image_url, purchase_url, metadata_json, last_seen_at, last_synced_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       slug = excluded.slug,
       brand = excluded.brand,
       material = excluded.material,
       color = excluded.color,
       color_hex = excluded.color_hex,
       finish = excluded.finish,
       image_url = excluded.image_url,
       purchase_url = excluded.purchase_url,
       metadata_json = excluded.metadata_json,
       last_seen_at = excluded.last_seen_at,
       last_synced_at = excluded.last_synced_at,
       updated_at = excluded.updated_at`
  );

  let totalImported = 0;
  let currentPage = 1;
  let expectedTotal = 0;

  console.log('⏳ Descargando páginas de FilamentColors.xyz...\n');

  while (true) {
    try {
      const pageData = await fetchSwatchesPage(currentPage, 100);
      
      // En la primera página, capturar el total esperado
      if (currentPage === 1) {
        expectedTotal = pageData.count;
        console.log(`📊 Total esperado según API: ${expectedTotal}\n`);
      }

      const records = pageData.results.map(mapSwatchToCatalogRecord);

      // Si no hay resultados, terminar
      if (records.length === 0) {
        console.log('⚠️  Página vacía, finalizando sincronización.');
        break;
      }

      for (const record of records) {
        insert.run(
          record.id,
          record.source,
          record.externalId,
          record.slug,
          record.brand,
          record.material,
          record.color,
          record.colorHex,
          record.finish,
          record.imageUrl,
          record.purchaseUrl,
          record.metadataJson,
          now,
          now,
          now
        );
      }

      totalImported += records.length;
      const progressPercent = expectedTotal > 0 ? ((totalImported / expectedTotal) * 100).toFixed(1) : '?';
      console.log(`📄 Página ${currentPage}: ${records.length} filamentos importados (total: ${totalImported} / ${expectedTotal} = ${progressPercent}%)`);

      // Terminar si ya importamos todo
      if (totalImported >= expectedTotal) {
        console.log('✅ Se alcanzó el total esperado.');
        break;
      }

      // Terminar si la API indica que no hay más páginas (pero seguir si aún falta por el count)
      if (!pageData.next && totalImported >= expectedTotal) {
        console.log('✅ No hay más páginas según la API.');
        break;
      }

      currentPage++;

      // Pequeña pausa para no sobrecargar la API
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`\n❌ Error en página ${currentPage}:`, error.message);
      
      db.prepare(
        `INSERT INTO filament_catalog_sync_state (provider, last_error)
         VALUES ('filamentcolors', ?)
         ON CONFLICT(provider) DO UPDATE SET last_error = excluded.last_error`
      ).run(error.message);

      throw error;
    }
  }

  // Marcar éxito
  db.prepare(
    `INSERT INTO filament_catalog_sync_state (provider, db_version, db_last_modified, last_checked_at, last_success_at, last_error)
     VALUES ('filamentcolors', ?, ?, ?, ?, NULL)
     ON CONFLICT(provider) DO UPDATE SET
       db_version = excluded.db_version,
       db_last_modified = excluded.db_last_modified,
       last_checked_at = excluded.last_checked_at,
       last_success_at = excluded.last_success_at,
       last_error = NULL`
  ).run(versionInfo.dbVersion, versionInfo.dbLastModified, now, now);

  console.log(`\n✅ ¡Sincronización completa! ${totalImported} filamentos importados exitosamente.\n`);
  db.close();
}

syncCatalog().catch((error) => {
  console.error('\n❌ Error fatal en la sincronización:', error);
  db.close();
  process.exit(1);
});
