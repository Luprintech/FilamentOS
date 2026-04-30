import { describe, it, expect } from 'vitest';
import { db } from './index';

describe('tracker_pieces schema', () => {
  it('should have plate_count column with INTEGER type and default 1', () => {
    const columns = db
      .prepare("PRAGMA table_info(tracker_pieces)")
      .all() as Array<{ name: string; type: string; dflt_value: string | null; notnull: number }>;
    
    const plateCountColumn = columns.find(col => col.name === 'plate_count');
    
    expect(plateCountColumn).toBeDefined();
    expect(plateCountColumn?.type).toBe('INTEGER');
    expect(plateCountColumn?.dflt_value).toBe('1');
    expect(plateCountColumn?.notnull).toBe(1);
  });

  it('should have file_link column with TEXT type and nullable', () => {
    const columns = db
      .prepare("PRAGMA table_info(tracker_pieces)")
      .all() as Array<{ name: string; type: string; dflt_value: string | null; notnull: number }>;
    
    const fileLinkColumn = columns.find(col => col.name === 'file_link');
    
    expect(fileLinkColumn).toBeDefined();
    expect(fileLinkColumn?.type).toBe('TEXT');
    expect(fileLinkColumn?.notnull).toBe(0); // 0 = nullable
  });

  it('should verify default value is enforced at schema level', () => {
    const columns = db
      .prepare("PRAGMA table_info(tracker_pieces)")
      .all() as Array<{ name: string; type: string; dflt_value: string | null; notnull: number }>;
    
    const plateCountColumn = columns.find(col => col.name === 'plate_count');
    
    // Verify default is set at database level (not just application)
    expect(plateCountColumn?.dflt_value).toBe('1');
    // This ensures backward compatibility - existing rows get plate_count=1
  });
});

describe('global filament catalog schema', () => {
  it('should have filament_catalog table', () => {
    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='filament_catalog'")
      .get() as { name: string } | undefined;

    expect(table?.name).toBe('filament_catalog');
  });

  it('should have filament_catalog_sync_state table', () => {
    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='filament_catalog_sync_state'")
      .get() as { name: string } | undefined;

    expect(table?.name).toBe('filament_catalog_sync_state');
  });

  it('should expose linking columns on filament_inventory', () => {
    const columns = db
      .prepare("PRAGMA table_info(filament_inventory)")
      .all() as Array<{ name: string; type: string; dflt_value: string | null; notnull: number }>;

    const inventorySource = columns.find((col) => col.name === 'inventory_source');
    const linkedAt = columns.find((col) => col.name === 'linked_at');
    const lastSyncedAt = columns.find((col) => col.name === 'last_synced_at');
    const catalogFilamentId = columns.find((col) => col.name === 'catalog_filament_id');

    expect(inventorySource).toBeDefined();
    expect(inventorySource?.type).toBe('TEXT');
    expect(inventorySource?.dflt_value).toBe("'local'");
    expect(linkedAt?.type).toBe('TEXT');
    expect(linkedAt?.notnull).toBe(0);
    expect(lastSyncedAt?.type).toBe('TEXT');
    expect(lastSyncedAt?.notnull).toBe(0);
    expect(catalogFilamentId?.type).toBe('TEXT');
    expect(catalogFilamentId?.notnull).toBe(0);
  });
});
