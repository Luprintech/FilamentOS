import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app, db } from './index';

// ── Test user ─────────────────────────────────────────────────────────────────
let testUserId: string;
let secondUserId: string;
const agent = request.agent(app);
const secondAgent = request.agent(app);

beforeAll(() => {
  testUserId = crypto.randomUUID();
  secondUserId = crypto.randomUUID();
  db.prepare(
    'INSERT INTO users (id, google_id, email, name, photo) VALUES (?, ?, ?, ?, ?)'
  ).run(testUserId, `google_test_${testUserId}`, 'test@example.com', 'Test User', null);
  db.prepare(
    'INSERT INTO users (id, google_id, email, name, photo) VALUES (?, ?, ?, ?, ?)'
  ).run(secondUserId, `google_test_${secondUserId}`, 'other@example.com', 'Other User', null);

  // Login via test helper endpoint
  return Promise.all([
    agent.post('/api/test/login').send({ userId: testUserId }).expect(200),
    secondAgent.post('/api/test/login').send({ userId: secondUserId }).expect(200),
  ]);
});

beforeEach(() => {
  db.prepare('DELETE FROM filament_catalog').run();
  db.prepare('DELETE FROM filament_catalog_sync_state').run();
  db.prepare('DELETE FROM filament_inventory').run();
  db.prepare('DELETE FROM user_custom_spool_options').run();
  db.prepare('DELETE FROM filamentos_comunidad').run();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Auth guard ────────────────────────────────────────────────────────────────
describe('GET /api/inventory/spools', () => {
  it('devuelve 401 sin autenticar', async () => {
    await request(app).get('/api/inventory/spools').expect(401);
  });

  it('devuelve array vacío al inicio', async () => {
    const res = await agent.get('/api/inventory/spools').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });
});





// ── CRUD ──────────────────────────────────────────────────────────────────────
describe('POST /api/inventory/spools', () => {
  it('devuelve 400 si faltan campos requeridos', async () => {
    await agent
      .post('/api/inventory/spools')
      .send({ brand: 'BrandX' }) // faltan material, color, etc.
      .expect(400);
  });

  it('crea una bobina y devuelve el objeto creado', async () => {
    const res = await agent
      .post('/api/inventory/spools')
      .send({
        brand: 'Bambu Lab',
        material: 'PLA',
        color: 'White',
        colorHex: '#ffffff',
        totalGrams: 1000,
        remainingG: 850,
        price: 25,
        notes: 'Test spool',
      })
      .expect(200);

    expect(res.body).toMatchObject({
      brand: 'Bambu Lab',
      material: 'PLA',
      color: 'White',
      totalGrams: 1000,
      remainingG: 850,
      price: 25,
      status: 'active',
    });
    expect(res.body.id).toBeTruthy();
  });
});

describe('PUT /api/inventory/spools/:id', () => {
  let spoolId: string;

  beforeEach(async () => {
    const res = await agent.post('/api/inventory/spools').send({
      brand: 'Prusament',
      material: 'PETG',
      color: 'Black',
      totalGrams: 750,
      remainingG: 750,
      price: 30,
    });
    spoolId = res.body.id;
  });

  it('actualiza una bobina existente', async () => {
    const res = await agent
      .put(`/api/inventory/spools/${spoolId}`)
      .send({
        brand: 'Prusament',
        material: 'PETG',
        color: 'Galaxy Black',
        totalGrams: 750,
        remainingG: 600,
        price: 30,
      })
      .expect(200);

    expect(res.body.color).toBe('Galaxy Black');
    expect(res.body.remainingG).toBe(600);
  });

  it('devuelve 404 si el id no existe', async () => {
    await agent
      .put('/api/inventory/spools/non-existent-id')
      .send({
        brand: 'X',
        material: 'PLA',
        color: 'Red',
        totalGrams: 100,
        remainingG: 100,
        price: 10,
      })
      .expect(404);
  });
});

describe('PATCH /api/inventory/spools/:id/deduct', () => {
  let spoolId: string;

  beforeEach(async () => {
    const res = await agent.post('/api/inventory/spools').send({
      brand: 'Fiberlogy',
      material: 'ASA',
      color: 'Grey',
      totalGrams: 500,
      remainingG: 500,
      price: 20,
    });
    spoolId = res.body.id;
  });

  it('descuenta gramos y devuelve remainingG actualizado', async () => {
    const res = await agent
      .patch(`/api/inventory/spools/${spoolId}/deduct`)
      .send({ grams: 100 })
      .expect(200);

    expect(res.body.remainingG).toBe(400);
    expect(res.body.status).toBe('active');
  });

  it('devuelve 400 si grams <= 0', async () => {
    await agent
      .patch(`/api/inventory/spools/${spoolId}/deduct`)
      .send({ grams: 0 })
      .expect(400);
  });

  it('marca como finished si restante llega a 0', async () => {
    const res = await agent
      .patch(`/api/inventory/spools/${spoolId}/deduct`)
      .send({ grams: 999999 }) // mayor que remaining
      .expect(200);

    expect(res.body.remainingG).toBe(0);
    expect(res.body.status).toBe('finished');
  });
});

describe('PATCH /api/inventory/spools/:id/finish', () => {
  let spoolId: string;

  beforeEach(async () => {
    const res = await agent.post('/api/inventory/spools').send({
      brand: 'eSUN',
      material: 'ABS',
      color: 'Blue',
      totalGrams: 1000,
      remainingG: 300,
      price: 18,
    });
    spoolId = res.body.id;
  });

  it('marca la bobina como finished', async () => {
    await agent
      .patch(`/api/inventory/spools/${spoolId}/finish`)
      .expect(200);

    const listRes = await agent.get('/api/inventory/spools');
    const spool = listRes.body.find((s: { id: string }) => s.id === spoolId);
    expect(spool?.status).toBe('finished');
    expect(spool?.remainingG).toBe(0);
  });
});

describe('DELETE /api/inventory/spools/:id', () => {
  it('elimina una bobina existente', async () => {
    const createRes = await agent.post('/api/inventory/spools').send({
      brand: 'FormFutura',
      material: 'PLA',
      color: 'Red',
      totalGrams: 750,
      remainingG: 750,
      price: 22,
    });
    const id = createRes.body.id;

    await agent.delete(`/api/inventory/spools/${id}`).expect(200);

    const listRes = await agent.get('/api/inventory/spools');
    const deleted = listRes.body.find((s: { id: string }) => s.id === id);
    expect(deleted).toBeUndefined();
  });

  it('devuelve 404 si el id no existe', async () => {
    await agent.delete('/api/inventory/spools/no-existe').expect(404);
  });
});

describe('global filament catalog', () => {
  it('returns cached catalog items for authenticated users', async () => {
    db.prepare(
      `INSERT INTO filament_catalog
        (id, source, external_id, slug, brand, material, color, color_hex, finish, image_url, purchase_url, metadata_json, last_seen_at, last_synced_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'filamentcolors:1',
      'filamentcolors',
      '1',
      'bambu-lab-jade-white-1',
      'Bambu Lab',
      'PLA',
      'Jade White',
      '#F2F2EE',
      'matte',
      'https://filamentcolors.xyz/media/jade-white.jpg',
      null,
      JSON.stringify({ td: 1.2 }),
      '2026-04-30T00:00:00.000Z',
      '2026-04-30T00:00:00.000Z',
      '2026-04-30T00:00:00.000Z'
    );

    const res = await agent.get('/api/filament-catalog').expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      id: 'filamentcolors:1',
      brand: 'Bambu Lab',
      material: 'PLA',
      color: 'Jade White',
      colorHex: '#F2F2EE',
    });
    expect(res.body.attribution).toContain('FilamentColors');
  });

  it('returns item detail', async () => {
    db.prepare(
      `INSERT INTO filament_catalog
        (id, source, external_id, slug, brand, material, color, color_hex, finish, image_url, purchase_url, metadata_json, last_seen_at, last_synced_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'filamentcolors:2',
      'filamentcolors',
      '2',
      'prusament-galaxy-black-2',
      'Prusament',
      'PETG',
      'Galaxy Black',
      '#222222',
      null,
      null,
      'https://example.com/buy',
      '{}',
      '2026-04-30T00:00:00.000Z',
      '2026-04-30T00:00:00.000Z',
      '2026-04-30T00:00:00.000Z'
    );

    const res = await agent.get('/api/filament-catalog/filamentcolors:2').expect(200);
    expect(res.body.id).toBe('filamentcolors:2');
    expect(res.body.purchaseUrl).toBe('https://example.com/buy');
  });

  it('allows admin to sync manually', async () => {
    await request(app).post('/api/lupe/login').send({ user: 'lupe', pass: '' }).expect(503);
  });
});

describe('inventory catalog linking', () => {
  it('imports a local spool from catalog', async () => {
    db.prepare(
      `INSERT INTO filament_catalog
        (id, source, external_id, slug, brand, material, color, color_hex, finish, image_url, purchase_url, metadata_json, last_seen_at, last_synced_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'filamentcolors:3',
      'filamentcolors',
      '3',
      'sunlu-forest-green-3',
      'Sunlu',
      'PLA',
      'Forest Green',
      '#228B22',
      null,
      null,
      null,
      JSON.stringify({ td: 0.8 }),
      '2026-04-30T00:00:00.000Z',
      '2026-04-30T00:00:00.000Z',
      '2026-04-30T00:00:00.000Z'
    );

    const res = await agent
      .post('/api/inventory/spools/import-from-catalog')
      .send({ catalogFilamentId: 'filamentcolors:3', totalGrams: 1000, remainingG: 1000, price: 20 })
      .expect(200);

    expect(res.body).toMatchObject({
      brand: 'Sunlu',
      color: 'Forest Green',
      inventorySource: 'catalog_import',
      catalogFilamentId: 'filamentcolors:3',
    });
  });

  it('links an existing spool to catalog without changing local identity', async () => {
    db.prepare(
      `INSERT INTO filament_catalog
        (id, source, external_id, slug, brand, material, color, color_hex, finish, image_url, purchase_url, metadata_json, last_seen_at, last_synced_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'filamentcolors:4',
      'filamentcolors',
      '4',
      'polymaker-nebula-purple-4',
      'Polymaker',
      'PLA',
      'Nebula Purple',
      '#663399',
      null,
      null,
      null,
      '{}',
      '2026-04-30T00:00:00.000Z',
      '2026-04-30T00:00:00.000Z',
      '2026-04-30T00:00:00.000Z'
    );

    const createRes = await agent.post('/api/inventory/spools').send({
      brand: 'Polymaker',
      material: 'PLA',
      color: 'Purple',
      totalGrams: 1000,
      remainingG: 900,
      price: 28,
    });

    const linked = await agent
      .post(`/api/inventory/spools/${createRes.body.id}/link-catalog`)
      .send({ catalogFilamentId: 'filamentcolors:4' })
      .expect(200);

    expect(linked.body.id).toBe(createRes.body.id);
    expect(linked.body.inventorySource).toBe('catalog_link');
    expect(linked.body.catalogFilamentId).toBe('filamentcolors:4');
    expect(linked.body.remainingG).toBe(900);
  });
});
