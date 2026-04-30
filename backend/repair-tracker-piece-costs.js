const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../data.db');
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

function round4(n) {
  return Number((n || 0).toFixed(4));
}

const projects = db.prepare(`
  SELECT id, user_id, title, price_per_kg
  FROM tracker_projects
  ORDER BY created_at ASC
`).all();

const getPieces = db.prepare(`
  SELECT id, total_grams, total_cost, name
  FROM tracker_pieces
  WHERE project_id = ? AND user_id = ?
  ORDER BY order_index ASC, created_at ASC
`);

const getFilaments = db.prepare(`
  SELECT spool_id, grams
  FROM tracker_piece_filaments
  WHERE piece_id = ?
`);

const getMaterials = db.prepare(`
  SELECT cost
  FROM tracker_piece_materials
  WHERE piece_id = ?
`);

const getSpool = db.prepare(`
  SELECT price, total_grams
  FROM filament_inventory
  WHERE id = ?
`);

const updatePiece = db.prepare(`
  UPDATE tracker_pieces
  SET total_cost = ?
  WHERE id = ?
`);

let scanned = 0;
let updated = 0;
let unchanged = 0;

const tx = db.transaction(() => {
  for (const project of projects) {
    const pieces = getPieces.all(project.id, project.user_id);

    for (const piece of pieces) {
      scanned++;

      const filaments = getFilaments.all(piece.id);
      const materials = getMaterials.all(piece.id);
      const materialCost = materials.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);

      let filamentCost = 0;

      if (filaments.length > 0) {
        for (const filament of filaments) {
          const grams = Number(filament.grams) || 0;
          if (grams <= 0) continue;

          let pricePerGram = 0;

          if (filament.spool_id) {
            const spool = getSpool.get(filament.spool_id);
            if (spool && Number(spool.total_grams) > 0) {
              pricePerGram = Number(spool.price || 0) / Number(spool.total_grams);
            }
          }

          if (pricePerGram <= 0 && Number(project.price_per_kg) > 0) {
            pricePerGram = Number(project.price_per_kg) / 1000;
          }

          filamentCost += grams * pricePerGram;
        }
      } else {
        if (Number(piece.total_grams) > 0 && Number(project.price_per_kg) > 0) {
          filamentCost = Number(piece.total_grams) * (Number(project.price_per_kg) / 1000);
        }
      }

      const recalculated = round4(filamentCost + materialCost);
      const persisted = round4(Number(piece.total_cost) || 0);

      if (persisted !== recalculated) {
        updatePiece.run(recalculated, piece.id);
        updated++;
        console.log(`↻ ${project.title} :: ${piece.name} | ${persisted} -> ${recalculated}`);
      } else {
        unchanged++;
      }
    }
  }
});

try {
  tx();
  console.log('─────────────────────────────────────────────');
  console.log(`DB: ${DB_PATH}`);
  console.log(`Piezas escaneadas: ${scanned}`);
  console.log(`Piezas actualizadas: ${updated}`);
  console.log(`Piezas sin cambios: ${unchanged}`);
  console.log('✅ Reparación de costes completada');
  console.log('─────────────────────────────────────────────');
} finally {
  db.close();
}
