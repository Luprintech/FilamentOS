import { describe, expect, it, vi } from 'vitest';

// Mock everything BEFORE importing the component
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

vi.mock('@/hooks/use-preferences', () => ({
  usePreferences: () => ({
    preferences: { dateFormat: 'dd-mm-yyyy', lengthUnit: 'mm', weightUnit: 'g' },
    loadingPrefs: false,
    updatePreferences: vi.fn(),
    savingPrefs: false,
  }),
}));

import { render } from '@testing-library/react';
import React from 'react';
import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  it('renders without hanging', () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '1', name: 'Test', email: 'test@test.com', photo: null,
        hasPassword: true, isGoogleAccount: false,
        stats: { projects: 0, pieces: 0, spools: 0 },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<SettingsPage />);
    // The combobox should exist
    const combobox = document.querySelector('[role="combobox"]');
    expect(combobox).not.toBeNull();
  }, 5000);
});
