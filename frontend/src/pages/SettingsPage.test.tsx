import { describe, expect, it, vi } from 'vitest';
import React from 'react';

// Stable references to avoid infinite re-render loops
const STABLE_PREFS = Object.freeze({ dateFormat: 'dd-mm-yyyy', lengthUnit: 'mm', weightUnit: 'g' });
const HOOK_RESULT = Object.freeze({
  preferences: STABLE_PREFS,
  loadingPrefs: false,
  updatePreferences: vi.fn(),
  savingPrefs: false,
});

vi.mock('@/hooks/use-preferences', () => ({
  usePreferences: () => HOOK_RESULT,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'es', changeLanguage: vi.fn() },
  }),
}));

vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com' },
    logout: vi.fn(),
  }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'dark',
    setTheme: vi.fn(),
  }),
}));

vi.mock('@/context/currency-context', () => ({
  useCurrency: () => ({ currency: 'USD', setCurrency: vi.fn() }),
  CURRENCIES: [{ code: 'USD', symbol: '$', name: 'US Dollar' }],
}));

vi.mock('react-circle-flags', () => ({
  CircleFlag: (p: { countryCode: string }) =>
    React.createElement('span', { 'data-testid': `flag-${p.countryCode}` }, p.countryCode),
}));

import { render, screen } from '@testing-library/react';
import { SettingsPage } from './SettingsPage';

test('renders without infinite loop', () => {
  let resolve!: (v: unknown) => void;
  vi.stubGlobal('fetch', vi.fn(() => new Promise((r) => { resolve = r; })));

  render(<SettingsPage />);
  expect(screen.getByText('Mi cuenta')).toBeInTheDocument();
  
  resolve(new Response(JSON.stringify({
    id: '1', name: 'Test', email: 't@t.com', photo: null,
    hasPassword: true, isGoogleAccount: false,
    stats: { projects: 0, pieces: 0, spools: 0 },
  }), { status: 200 }));
}, 5000);
