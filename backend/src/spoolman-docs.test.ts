import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(process.cwd(), '..');

const documentedFiles = [
  'README.md',
  'docs/DEPLOY_VPS.md',
  'backend/.env.example',
  'docker-compose.yml',
] as const;

const requiredEnvVars = ['SPOOLMAN_BASE_URL', 'SPOOLMAN_TIMEOUT_MS'] as const;

describe('Spoolman deployment documentation', () => {
  it.each(documentedFiles)('documenta las variables de entorno en %s', (relativePath) => {
    const fileContents = readFileSync(path.join(projectRoot, relativePath), 'utf8');

    for (const envVar of requiredEnvVars) {
      expect(fileContents).toContain(envVar);
    }
  });
});
