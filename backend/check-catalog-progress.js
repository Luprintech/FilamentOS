// Script para verificar el progreso de la sincronización del catálogo
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data.db');
const db = new Database(dbPath, { readonly: true });

function checkProgress() {
  const countRow = db.prepare('SELECT COUNT(*) as total FROM filament_catalog').get();
  const total = countRow.total;

  const syncState = db.prepare('SELECT * FROM filament_catalog_sync_state WHERE provider = ?').get('filamentcolors');

  console.log('\n📊 PROGRESO DE SINCRONIZACIÓN DEL CATÁLOGO GLOBAL\n');
  
  // Usar el total reportado por la API si existe, sino asumir el esperado
  const expectedTotal = syncState?.db_version ? total : 3323;
  const actualExpected = total > 3323 ? total : 3323;
  
  console.log(`Total de filamentos en BD: ${total}`);
  if (total < actualExpected) {
    console.log(`Progreso: ${((total / actualExpected) * 100).toFixed(1)}% (esperado: ~${actualExpected})`);
  } else {
    console.log(`Progreso: 100% ✅`);
  }
  console.log('');

  if (syncState) {
    console.log('Estado de sincronización:');
    console.log(`- Última revisión: ${syncState.last_checked_at || 'nunca'}`);
    console.log(`- Último éxito: ${syncState.last_success_at || 'nunca'}`);
    console.log(`- Versión DB: ${syncState.db_version || 'desconocida'}`);
    if (syncState.last_error) {
      console.log(`- ⚠️  Último error: ${syncState.last_error}`);
    }
  } else {
    console.log('⚠️  No hay estado de sincronización todavía.');
  }
  
  if (syncState?.last_success_at && total > 0) {
    console.log('\n✅ ¡Sincronización completa! Todos los filamentos disponibles están importados.\n');
  } else if (total > 0) {
    const remaining = Math.max(0, actualExpected - total);
    console.log(`\n⏳ Sincronización en progreso... ${remaining > 0 ? `Faltan ~${remaining} filamentos.` : 'Completando...'}\n`);
  } else {
    console.log('\n⚠️  El catálogo está vacío. Reinicia el backend o ejecuta manual-sync-catalog.js para iniciar la sincronización.\n');
  }

  db.close();
}

// Ejecutar inmediatamente
checkProgress();

// Ejecutar cada 10 segundos si se pasa el argumento --watch
if (process.argv.includes('--watch')) {
  console.log('Modo monitoreo activo. Actualizando cada 10 segundos... (Ctrl+C para salir)\n');
  setInterval(checkProgress, 10000);
}
