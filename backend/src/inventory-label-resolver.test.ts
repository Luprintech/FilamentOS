import { describe, expect, it } from 'vitest';

import { resolveInventoryLabel } from './inventory-label-resolver.js';

describe('resolveInventoryLabel', () => {
  it('clasifica un QR de Spoolman del host configurado aunque la base venga con /api/v1', () => {
    expect(resolveInventoryLabel('https://spoolman.local/spool/42', 'https://spoolman.local/api/v1')).toEqual({
      provider: 'spoolman',
      spoolmanId: 42,
    });
  });

  it('ignora hosts ajenos y códigos comerciales para preservar el seam del proveedor', () => {
    expect(resolveInventoryLabel('https://otro-spoolman.local/spool/42', 'https://spoolman.local')).toBeNull();
    expect(resolveInventoryLabel('8712345678901', 'https://spoolman.local')).toBeNull();
  });
});
