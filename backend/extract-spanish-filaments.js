// Script one-time para extraer filamentos de marcas españolas desde impresoras3d.com
// NO es un scraper continuo - solo se ejecuta una vez y guarda en JSON
// Luego importas ese JSON manualmente a la BD

const fs = require('fs');
const path = require('path');

const TIMEOUT_MS = 10000;

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractProductsFromHTML(html, brand) {
  const products = [];
  
  // Buscar bloques de productos en WooCommerce
  // Patrón común: <li class="product ...">
  const productRegex = /<li[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  const matches = [...html.matchAll(productRegex)];

  for (const match of matches) {
    const productHtml = match[1];
    
    // Extraer nombre del producto
    const titleMatch = productHtml.match(/<h2[^>]*class="[^"]*woocommerce-loop-product__title[^"]*"[^>]*>(.*?)<\/h2>/i) ||
                      productHtml.match(/<a[^>]*class="[^"]*product-title[^"]*"[^>]*>(.*?)<\/a>/i);
    
    if (!titleMatch) continue;
    
    const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
    
    // Filtrar solo productos de la marca especificada
    if (!title.toLowerCase().includes(brand.toLowerCase())) continue;
    
    // Extraer URL del producto
    const urlMatch = productHtml.match(/href="([^"]*producto[^"]*)"/i);
    const productUrl = urlMatch ? urlMatch[1] : null;
    
    // Extraer imagen
    const imgMatch = productHtml.match(/<img[^>]*src="([^"]*)"/i);
    const imageUrl = imgMatch ? imgMatch[1] : null;
    
    // Intentar parsear: "MARCA MATERIAL COLOR DIÁMETRO"
    // Ejemplo: "Sakata 3D PLA 850 Rojo 1.75mm"
    const parts = title.split(/\s+/);
    
    let material = 'PLA'; // default
    let color = '';
    let diameter = '1.75mm';
    
    // Detectar material
    if (title.match(/\bPLA\b/i)) material = 'PLA';
    else if (title.match(/\bPETG\b/i)) material = 'PETG';
    else if (title.match(/\bABS\b/i)) material = 'ABS';
    else if (title.match(/\bASA\b/i)) material = 'ASA';
    else if (title.match(/\bTPU\b/i)) material = 'TPU';
    else if (title.match(/\bNylon\b/i)) material = 'Nylon';
    
    // Detectar diámetro
    if (title.match(/2\.85\s*mm/i) || title.match(/285/)) diameter = '2.85mm';
    if (title.match(/3\.0*\s*mm/i) || title.match(/300/)) diameter = '3.00mm';
    
    // El color es lo que queda después de quitar marca, material, diámetro
    const cleanTitle = title
      .replace(new RegExp(brand, 'gi'), '')
      .replace(/\b(PLA|PETG|ABS|ASA|TPU|Nylon)\b/gi, '')
      .replace(/\b(1\.75|2\.85|3\.0*)\s*mm\b/gi, '')
      .replace(/\b\d{3,4}\s*g\b/gi, '') // quitar peso
      .trim();
    
    color = cleanTitle || 'Sin especificar';
    
    products.push({
      brand,
      material,
      color,
      colorHex: '#cccccc', // Por defecto gris - puedes ajustar manualmente después
      diameter,
      title,
      productUrl,
      imageUrl,
    });
  }
  
  return products;
}

async function extractSakata3D() {
  console.log('🔍 Extrayendo filamentos de Sakata 3D...\n');
  
  const urls = [
    'https://www.impresoras3d.com/marca-de-filamento/sakata-3d/',
    'https://www.impresoras3d.com/marca-de-filamento/sakata-3d/page/2/',
    'https://www.impresoras3d.com/marca-de-filamento/sakata-3d/page/3/',
  ];
  
  const allProducts = [];
  
  for (const url of urls) {
    try {
      console.log(`  Descargando: ${url}`);
      const html = await fetchWithTimeout(url);
      const products = extractProductsFromHTML(html, 'Sakata');
      console.log(`    → ${products.length} productos encontrados`);
      allProducts.push(...products);
      
      // Pausa para no sobrecargar el servidor
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`    ⚠️  Error: ${error.message}`);
    }
  }
  
  return allProducts;
}

async function extract3DTested() {
  console.log('\n🔍 Extrayendo filamentos de 3DTested...\n');
  
  const urls = [
    'https://www.impresoras3d.com/marca-de-filamento/3dtested/',
  ];
  
  const allProducts = [];
  
  for (const url of urls) {
    try {
      console.log(`  Descargando: ${url}`);
      const html = await fetchWithTimeout(url);
      const products = extractProductsFromHTML(html, '3DTested');
      console.log(`    → ${products.length} productos encontrados`);
      allProducts.push(...products);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`    ⚠️  Error: ${error.message}`);
    }
  }
  
  return allProducts;
}

async function main() {
  console.log('🚀 Iniciando extracción de filamentos españoles...\n');
  console.log('📦 Este script NO hace scraping continuo.');
  console.log('📦 Solo extrae la información UNA VEZ y la guarda en JSON.\n');
  
  const sakata = await extractSakata3D();
  const tested = await extract3DTested();
  
  const allFilaments = [
    ...sakata.map(f => ({ ...f, source: 'sakata3d' })),
    ...tested.map(f => ({ ...f, source: '3dtested' })),
  ];
  
  // Guardar en JSON
  const outputPath = path.resolve(__dirname, 'spanish-filaments.json');
  fs.writeFileSync(outputPath, JSON.stringify(allFilaments, null, 2), 'utf-8');
  
  console.log(`\n✅ Extracción completada!`);
  console.log(`\n📊 Resumen:`);
  console.log(`   Sakata 3D: ${sakata.length} filamentos`);
  console.log(`   3DTested: ${tested.length} filamentos`);
  console.log(`   Total: ${allFilaments.length} filamentos`);
  console.log(`\n💾 Guardado en: ${outputPath}`);
  console.log(`\n📝 Próximos pasos:`);
  console.log(`   1. Revisa el JSON y ajusta colores hex si es necesario`);
  console.log(`   2. Importa a la BD usando: node import-spanish-filaments.js`);
}

main().catch(console.error);
