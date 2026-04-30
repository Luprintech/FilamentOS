// Script para importar filamentos españoles desde spanish-filaments.json a la BD
// Se ejecuta UNA VEZ después de haber ejecutado extract-spanish-filaments.js

const fs = require('fs');
const path = require('path');

async function importFilaments() {
  const jsonPath = path.resolve(__dirname, 'spanish-filaments.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Error: No se encontró spanish-filaments.json');
    console.error('   Ejecuta primero: node extract-spanish-filaments.js');
    process.exit(1);
  }

  console.log('📂 Leyendo spanish-filaments.json...\n');
  
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const filaments = JSON.parse(rawData);

  if (!Array.isArray(filaments) || filaments.length === 0) {
    console.error('❌ Error: El archivo JSON está vacío o no es válido');
    process.exit(1);
  }

  console.log(`✅ ${filaments.length} filamentos cargados del JSON\n`);
  console.log('📤 Importando a la base de datos...\n');

  // Mapear a formato del endpoint
  const payload = {
    filaments: filaments.map(f => ({
      brand: f.brand,
      material: f.material,
      color: f.color,
      colorHex: f.colorHex || '#cccccc',
      finish: f.finish || null,
      purchaseUrl: f.productUrl || null,
      imageUrl: f.imageUrl || null,
      metadata: {
        diameter: f.diameter,
        originalTitle: f.title,
        source: f.source,
      },
    })),
  };

  try {
    const response = await fetch('http://localhost:3001/api/filament-catalog/bulk-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Nota: Necesitas estar autenticado como admin
        // Si usas cookies de sesión, añade credentials: 'include'
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Importación completada!\n');
    console.log(`📊 Resultado:`);
    console.log(`   Importados: ${result.imported} filamentos`);
    console.log(`\n🎉 Los filamentos españoles ya están en tu base de datos!`);
    console.log(`   Ve a /lupe → Catálogo para gestionarlos.`);
    
  } catch (error) {
    console.error('\n❌ Error en la importación:', error.message);
    console.error('\n💡 Asegúrate de:');
    console.error('   1. El backend está corriendo (npm run dev)');
    console.error('   2. Estás autenticado como admin en /lupe');
    console.error('   3. El endpoint está en http://localhost:3001');
    process.exit(1);
  }
}

importFilaments().catch(console.error);
