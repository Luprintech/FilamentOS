const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../data.db');
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

const email = 'luprintech@gmail.com';
const user = db.prepare('SELECT id, email, name FROM users WHERE lower(email) = ?').get(email);

if (!user) {
  console.error(`❌ No existe usuario local con email ${email}`);
  process.exit(1);
}

const userId = user.id;
console.log(`✅ Poblando datos locales para ${user.email} (${user.name || user.id})`);

const uid = () => crypto.randomUUID();
function isoDaysAgo(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}
function parseTime(str) {
  const h = parseInt((str.match(/(\d+)\s*h/i) || [,'0'])[1], 10);
  const m = parseInt((str.match(/(\d+)\s*m/i) || [,'0'])[1], 10);
  return h * 3600 + m * 60;
}

// ── Calculadora ─────────────────────────────────────────────────────────────
const calcExisting = new Set(
  db.prepare('SELECT job_name FROM projects WHERE user_id = ?').all(userId).map(r => r.job_name)
);

const calcProjects = Array.from({ length: 36 }, (_, i) => {
  const materials = ['PLA', 'PETG', 'ASA', 'ABS'];
  const material = materials[i % materials.length];
  const weight = 18 + (i * 7 % 240);
  const h = 1 + (i % 9);
  const m = (i * 13) % 60;
  const spoolPrice = material === 'PLA' ? 22 : material === 'PETG' ? 26 : material === 'ASA' ? 28 : 24;
  return {
    jobName: `Proyecto test ${String(i + 1).padStart(2, '0')} · ${material}`,
    filamentType: material,
    filamentWeight: weight,
    printingTimeHours: h,
    printingTimeMinutes: m,
    spoolPrice,
    spoolWeight: 1000,
    powerConsumptionWatts: 180 + (i % 4) * 20,
    energyCostKwh: 0.19,
    prepTime: 5 + (i % 5) * 5,
    prepCostPerHour: 15 + (i % 4),
    postProcessingTimeInMinutes: 10 + (i % 6) * 10,
    postProcessingCostPerHour: 12 + (i % 3) * 2,
    includeMachineCosts: i % 3 === 0,
    printerCost: i % 3 === 0 ? 950 : 0,
    investmentReturnYears: i % 3 === 0 ? 3 : 0,
    repairCost: i % 3 === 0 ? 60 : 0,
    otherCosts: i % 4 === 0 ? [{ name: 'Imanes', price: 2.5 }] : [],
    profitPercentage: 25 + (i % 5) * 5,
    vatPercentage: 21,
    currency: 'EUR',
  };
});

const insertCalc = db.prepare(
  'INSERT INTO projects (id, user_id, job_name, data, printed_at, total_cost, total_grams, total_secs, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

let calcInserted = 0;
for (let i = 0; i < calcProjects.length; i++) {
  const p = calcProjects[i];
  if (calcExisting.has(p.jobName)) continue;
  const totalSecs = p.printingTimeHours * 3600 + p.printingTimeMinutes * 60;
  const base = (p.filamentWeight / p.spoolWeight) * p.spoolPrice;
  const totalCost = Number((base + (p.otherCosts[0]?.price || 0) + 5 + (i % 7)).toFixed(2));
  const createdAt = isoDaysAgo(90 - i);
  insertCalc.run(
    uid(), userId, p.jobName, JSON.stringify(p), createdAt,
    totalCost, p.filamentWeight, totalSecs,
    i % 5 === 0 ? 'pending' : i % 5 === 1 ? 'printed' : i % 5 === 2 ? 'post_processed' : i % 5 === 3 ? 'delivered' : 'failed',
    createdAt,
  );
  calcInserted++;
}

// ── Bitácora ────────────────────────────────────────────────────────────────
const trackerExisting = new Set(
  db.prepare('SELECT title FROM tracker_projects WHERE user_id = ?').all(userId).map(r => r.title)
);

const trackerSeries = Array.from({ length: 12 }, (_, si) => ({
  title: `Serie local ${String(si + 1).padStart(2, '0')} · pruebas`,
  description: `Serie de prueba ${si + 1} para revisar grid, filtros, costes y estadísticas`,
  goal: 24 + (si % 4) * 12,
  pricePerKg: 22 + (si % 5) * 2,
  currency: 'EUR',
  pieces: Array.from({ length: 18 }, (_, pi) => {
    const grams = 8 + ((si * 7 + pi * 5) % 140);
    const h = Math.floor((20 + pi * 17) / 60);
    const m = (20 + pi * 17) % 60;
    return {
      label: `Pieza ${pi + 1}`,
      name: `Modelo ${si + 1}.${pi + 1}`,
      timeText: `${h}h ${m}m`,
      gramText: grams.toFixed(1),
      totalSecs: h * 3600 + m * 60,
      totalGrams: grams,
    };
  }),
}));

const insertTrackerProject = db.prepare(
  'INSERT INTO tracker_projects (id, user_id, title, description, goal, price_per_kg, currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
const insertTrackerPiece = db.prepare(
  'INSERT INTO tracker_pieces (id, project_id, user_id, order_index, label, name, time_text, gram_text, total_secs, total_grams, total_cost, time_lines, gram_lines, image_url, spool_id, notes, status, printed_at, incident, plate_count, file_link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

let trackerInserted = 0;
let pieceInserted = 0;
for (let si = 0; si < trackerSeries.length; si++) {
  const s = trackerSeries[si];
  if (trackerExisting.has(s.title)) continue;

  const projectId = uid();
  const createdAt = isoDaysAgo(70 - si);
  insertTrackerProject.run(projectId, userId, s.title, s.description, s.goal, s.pricePerKg, s.currency, createdAt, createdAt);
  trackerInserted++;

  for (let pi = 0; pi < s.pieces.length; pi++) {
    const p = s.pieces[pi];
    const totalCost = Number(((p.totalGrams * s.pricePerKg) / 1000).toFixed(4));
    insertTrackerPiece.run(
      uid(), projectId, userId, pi,
      p.label, p.name, p.timeText, p.gramText,
      p.totalSecs, p.totalGrams, totalCost,
      1, 1,
      null, null,
      `Notas de prueba ${si + 1}.${pi + 1}`,
      pi % 5 === 0 ? 'pending' : pi % 5 === 1 ? 'printed' : pi % 5 === 2 ? 'post_processed' : pi % 5 === 3 ? 'delivered' : 'failed',
      isoDaysAgo(60 - si + Math.floor(pi / 3)),
      '',
      1,
      null,
      isoDaysAgo(60 - si + Math.floor(pi / 3))
    );
    pieceInserted++;
  }
}

const totals = {
  calc: db.prepare('SELECT COUNT(*) c FROM projects WHERE user_id = ?').get(userId).c,
  tracker: db.prepare('SELECT COUNT(*) c FROM tracker_projects WHERE user_id = ?').get(userId).c,
  pieces: db.prepare('SELECT COUNT(*) c FROM tracker_pieces WHERE user_id = ?').get(userId).c,
};

console.log(`🧮 Proyectos calculadora insertados: ${calcInserted}`);
console.log(`🎯 Proyectos bitácora insertados: ${trackerInserted}`);
console.log(`🧩 Piezas insertadas: ${pieceInserted}`);
console.log('─────────────────────────────────────────────');
console.log(`Total calculadora: ${totals.calc}`);
console.log(`Total bitácora: ${totals.tracker}`);
console.log(`Total piezas: ${totals.pieces}`);
console.log('─────────────────────────────────────────────');

db.close();
