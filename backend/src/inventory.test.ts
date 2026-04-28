import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app, db } from './index';

// ── Test user ─────────────────────────────────────────────────────────────────
let testUserId: string;
let secondUserId: string;
const agent = request.agent(app);
const secondAgent = request.agent(app);

function createMockResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

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
  db.prepare('DELETE FROM filament_inventory').run();
  db.prepare('DELETE FROM user_custom_spool_options').run();
  db.prepare('DELETE FROM filamentos_comunidad').run();
  delete process.env.SPOOLMAN_BASE_URL;
  delete process.env.SPOOLMAN_TIMEOUT_MS;
  vi.restoreAllMocks();
});

afterEach(() => {
  delete process.env.SPOOLMAN_BASE_URL;
  delete process.env.SPOOLMAN_TIMEOUT_MS;
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

  it('mantiene inventario mixto local y vinculado a Spoolman en la misma lista', async () => {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO filament_inventory
        (id, user_id, brand, material, color, color_hex, total_grams, remaining_g, price, notes, status, spoolman_id, inventory_source, linked_at, last_synced_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'local-spool',
      testUserId,
      'Local Brand',
      'PLA',
      'White',
      '#ffffff',
      1000,
      800,
      20,
      '',
      'active',
      null,
      'local',
      null,
      null,
      now,
      now,
    );
    db.prepare(
      `INSERT INTO filament_inventory
        (id, user_id, brand, material, color, color_hex, total_grams, remaining_g, price, notes, status, spoolman_id, inventory_source, linked_at, last_synced_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'remote-spool',
      testUserId,
      'Remote Vendor',
      'PETG',
      'Black',
      '#000000',
      1200,
      900,
      30,
      'Synced',
      'active',
      77,
      'spoolman',
      now,
      now,
      now,
      now,
    );

    const res = await agent.get('/api/inventory/spools').expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'local-spool', inventorySource: 'local', spoolmanId: null }),
        expect.objectContaining({ id: 'remote-spool', inventorySource: 'spoolman', spoolmanId: 77 }),
      ])
    );
  });
});

describe('GET /api/inventory/spoolman/status', () => {
  it('reporta estado unconfigured cuando no hay base URL', async () => {
    const res = await agent.get('/api/inventory/spoolman/status').expect(200);

    expect(res.body).toEqual({
      configured: false,
      endpoint: null,
      state: 'unconfigured',
      error: null,
    });
  });

  it('normaliza /api/v1 y reporta connected cuando health responde', async () => {
    process.env.SPOOLMAN_BASE_URL = 'https://spoolman.local';
    const fetchMock = vi.fn().mockResolvedValue(createMockResponse({ status: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await agent.get('/api/inventory/spoolman/status').expect(200);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://spoolman.local/api/v1/health',
      expect.objectContaining({ method: 'GET' })
    );
    expect(res.body).toEqual({
      configured: true,
      endpoint: 'https://spoolman.local/api/v1',
      state: 'connected',
      error: null,
    });
  });

  it('reporta degraded si la instancia configurada no responde', async () => {
    process.env.SPOOLMAN_BASE_URL = 'https://offline-spoolman.local/api/v1';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED')));

    const res = await agent.get('/api/inventory/spoolman/status').expect(200);

    expect(res.body.configured).toBe(true);
    expect(res.body.endpoint).toBe('https://offline-spoolman.local/api/v1');
    expect(res.body.state).toBe('degraded');
    expect(res.body.error).toContain('ECONNREFUSED');
  });
});

describe('POST /api/inventory/spoolman/sync', () => {
  it('importa bobinas remotas y las mapea al inventario del usuario autenticado', async () => {
    process.env.SPOOLMAN_BASE_URL = 'https://spoolman.local';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(createMockResponse([
        {
          id: 101,
          filament: { name: 'PLA', material: 'PLA', vendor: { name: 'Bambu Lab' }, color_hex: 'ffffff' },
          initial_weight: 1000,
          remaining_weight: 650,
          price: 24.5,
          comment: 'Rack A',
        },
      ]))
    );

    const res = await agent.post('/api/inventory/spoolman/sync').expect(200);

    expect(res.body).toEqual({ created: 1, updated: 0, skipped: 0 });

    const listRes = await agent.get('/api/inventory/spools').expect(200);
    expect(listRes.body).toEqual([
      expect.objectContaining({
        brand: 'Bambu Lab',
        material: 'PLA',
        colorHex: '#ffffff',
        totalGrams: 1000,
        remainingG: 650,
        price: 24.5,
        notes: 'Rack A',
        spoolmanId: 101,
        inventorySource: 'spoolman',
      }),
    ]);
  });

  it('hace upsert sin duplicar cuando la misma bobina remota reaparece', async () => {
    process.env.SPOOLMAN_BASE_URL = 'https://spoolman.local';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse([
        {
          id: 202,
          filament: { name: 'PETG', material: 'PETG', vendor: { name: 'Prusament' }, color_hex: '101010' },
          initial_weight: 1000,
          remaining_weight: 800,
          cost: 29,
          comment: 'First sync',
        },
      ]))
      .mockResolvedValueOnce(createMockResponse([
        {
          id: 202,
          filament: { name: 'PETG', material: 'PETG', vendor: { name: 'Prusament' }, color_hex: 'ff00aa' },
          initial_weight: 1000,
          remaining_weight: 500,
          cost: 31,
          comment: 'Updated sync',
        },
      ]));
    vi.stubGlobal('fetch', fetchMock);

    await agent.post('/api/inventory/spoolman/sync').expect(200);
    const secondSync = await agent.post('/api/inventory/spoolman/sync').expect(200);

    expect(secondSync.body).toEqual({ created: 0, updated: 1, skipped: 0 });

    const rows = db
      .prepare('SELECT spoolman_id, remaining_g, price, notes, color_hex FROM filament_inventory WHERE user_id = ?')
      .all(testUserId) as Array<{ spoolman_id: number; remaining_g: number; price: number; notes: string; color_hex: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      spoolman_id: 202,
      remaining_g: 500,
      price: 31,
      notes: 'Updated sync',
      color_hex: '#ff00aa',
    });
  });

  it('mantiene aislamiento por usuario cuando dos usuarios sincronizan la misma bobina remota', async () => {
    process.env.SPOOLMAN_BASE_URL = 'https://spoolman.local';
    const payload = [
      {
        id: 303,
        filament: { name: 'ABS', material: 'ABS', vendor: { name: 'eSUN' }, color_hex: '123456' },
        initial_weight: 750,
        remaining_weight: 700,
        price: 18,
        comment: 'Shared remote spool',
      },
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse(payload)));

    await agent.post('/api/inventory/spoolman/sync').expect(200);
    await secondAgent.post('/api/inventory/spoolman/sync').expect(200);

    const rows = db
      .prepare('SELECT user_id, spoolman_id FROM filament_inventory WHERE spoolman_id = ?')
      .all(303) as Array<{ user_id: string; spoolman_id: number }>;
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        { user_id: secondUserId, spoolman_id: 303 },
        { user_id: testUserId, spoolman_id: 303 },
      ])
    );
  });
});

describe('Spoolman linking routes', () => {
  it('expone una bobina remota puntual para flujo de link manual', async () => {
    process.env.SPOOLMAN_BASE_URL = 'https://spoolman.local';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createMockResponse({
          id: 404,
          filament: { name: 'ASA', material: 'ASA', vendor: { name: 'Fiberlogy' }, color_hex: '0f0f0f' },
          initial_weight: 1000,
          remaining_weight: 920,
          price: 35,
          comment: 'Remote detail',
        })
      )
    );

    const res = await agent.get('/api/inventory/spoolman/spools/404').expect(200);

    expect(res.body).toEqual({
      remoteSpool: expect.objectContaining({
        spoolmanId: 404,
        brand: 'Fiberlogy',
        material: 'ASA',
        colorHex: '#0f0f0f',
        remainingG: 920,
      }),
    });
  });

  it('permite vincular una bobina local existente con spoolmanId', async () => {
    const createRes = await agent.post('/api/inventory/spools').send({
      brand: 'Local Brand',
      material: 'PLA',
      color: 'Orange',
      totalGrams: 1000,
      remainingG: 900,
      price: 20,
    });

    const res = await agent
      .post(`/api/inventory/spools/${createRes.body.id}/link-spoolman`)
      .send({ spoolmanId: 505 })
      .expect(200);

    expect(res.body.spool).toEqual(
      expect.objectContaining({
        id: createRes.body.id,
        spoolmanId: 505,
        inventorySource: 'spoolman',
      })
    );
  });

  it('rechaza duplicate link con 409 y preserva la fila original', async () => {
    const first = await agent.post('/api/inventory/spools').send({
      brand: 'First',
      material: 'PLA',
      color: 'White',
      totalGrams: 1000,
      remainingG: 900,
      price: 20,
    });
    const second = await agent.post('/api/inventory/spools').send({
      brand: 'Second',
      material: 'PETG',
      color: 'Black',
      totalGrams: 1000,
      remainingG: 900,
      price: 20,
    });

    await agent
      .post(`/api/inventory/spools/${first.body.id}/link-spoolman`)
      .send({ spoolmanId: 606 })
      .expect(200);

    await agent
      .post(`/api/inventory/spools/${second.body.id}/link-spoolman`)
      .send({ spoolmanId: 606 })
      .expect(409);

    const rows = db
      .prepare('SELECT id, spoolman_id FROM filament_inventory WHERE user_id = ? ORDER BY id ASC')
      .all(testUserId) as Array<{ id: string; spoolman_id: number | null }>;
    expect(rows).toHaveLength(2);
    expect(rows.filter((row) => row.spoolman_id === 606)).toEqual([{ id: first.body.id, spoolman_id: 606 }]);
  });
});

describe('POST /api/lookup-filament', () => {
  it('resuelve QR de Spoolman a una bobina local ya vinculada', async () => {
    process.env.SPOOLMAN_BASE_URL = 'https://spoolman.local';
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO filament_inventory
        (id, user_id, brand, material, color, color_hex, total_grams, remaining_g, price, notes, status, spoolman_id, inventory_source, linked_at, last_synced_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'linked-local',
      testUserId,
      'Bambu Lab',
      'PLA',
      'Green',
      '#00ff00',
      1000,
      700,
      25,
      '',
      'active',
      707,
      'spoolman',
      now,
      now,
      now,
      now,
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createMockResponse({
          id: 707,
          filament: { name: 'PLA', material: 'PLA', vendor: { name: 'Bambu Lab' }, color_hex: '00ff00' },
          initial_weight: 1000,
          remaining_weight: 700,
          comment: 'Linked remote',
        })
      )
    );

    const res = await agent
      .post('/api/lookup-filament')
      .send({ code: 'https://spoolman.local/spool/707' })
      .expect(200);

    expect(res.body).toEqual({
      found: true,
      source: 'spoolman',
      linked: true,
      data: expect.objectContaining({ spoolmanId: 707 }),
      spool: expect.objectContaining({ id: 'linked-local', spoolmanId: 707 }),
    });
  });

  it('resuelve QR de Spoolman a resultado remoto linkeable cuando no existe fila local', async () => {
    process.env.SPOOLMAN_BASE_URL = 'https://spoolman.local';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createMockResponse({
          id: 808,
          filament: { name: 'PETG', material: 'PETG', vendor: { name: 'Polymaker' }, color_hex: 'abcdef' },
          initial_weight: 1000,
          remaining_weight: 840,
          comment: 'Link me',
        })
      )
    );

    const res = await agent
      .post('/api/lookup-filament')
      .send({ code: 'https://spoolman.local/spool/808' })
      .expect(200);

    expect(res.body).toEqual({
      found: true,
      source: 'spoolman',
      linked: false,
      data: expect.objectContaining({
        spoolmanId: 808,
        brand: 'Polymaker',
        remainingG: 840,
      }),
    });
    expect(res.body.spool).toBeUndefined();
  });

  it('mantiene códigos comerciales sin asociación como not linked, sin adivinar Spoolman', async () => {
    process.env.SPOOLMAN_BASE_URL = 'https://spoolman.local';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = await agent
      .post('/api/lookup-filament')
      .send({ code: '8712345678901' })
      .expect(200);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.body).toEqual({
      found: false,
      source: 'manual',
      linked: false,
      data: {
        brand: null,
        name: null,
        color: null,
        colorHex: null,
        material: null,
        diameter: null,
        weightGrams: null,
        printTempMin: null,
        printTempMax: null,
        bedTempMin: null,
        bedTempMax: null,
        price: null,
      },
    });
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
