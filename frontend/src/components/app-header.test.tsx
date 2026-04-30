import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppHeader } from './app-header';
import React from 'react';

// ── Test wrapper ──────────────────────────────────────────────────────────────

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

// ── Context/component mocks ───────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        logo_alt: 'Filamentos',
        app_title: 'Filamentos',
        welcome: 'Bienvenido',
        sign_in: 'Iniciar sesión',
        theme_dark: 'Modo oscuro',
        theme_light: 'Modo claro',
        install_title: 'Instalar app',
      };
      return translations[key] ?? key;
    },
    i18n: {
      resolvedLanguage: 'es',
      changeLanguage: vi.fn(),
    },
  }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    setTheme: vi.fn(),
  }),
}));

vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: null,
    isGuest: false,
    goToLogin: vi.fn(),
    logout: vi.fn(),
    exitGuest: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-pwa-install', () => ({
  usePwaInstall: () => ({
    canInstall: false,
    install: vi.fn(),
  }),
}));

vi.mock('@/context/currency-context', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useCurrency: () => ({
      currency: 'EUR',
      currencyInfo: { code: 'EUR', symbol: '€', name: 'Euro' },
      setCurrency: vi.fn(),
    }),
  };
});

describe('AppHeader mobile menu animation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should NOT render the mobile drawer in the DOM when closed', () => {
    render(<AppHeader />, { wrapper: TestWrapper });

    // The hamburger button should exist with "open" label
    expect(screen.getByRole('button', { name: /abrir menu/i })).toBeInTheDocument();

    // The "Cerrar menu" button (close X) should NOT be present — it's only in the hamburger when open
    expect(screen.queryByRole('button', { name: /cerrar menu/i })).not.toBeInTheDocument();

    // The mobile drawer wrapper has a specific structure: mt-4 border-t pt-4 md:hidden
    // We can verify no mobile-unique content exists: the mobile "Iniciar sesión" is
    // a full-width rounded-full button, vs desktop which is hidden sm:inline-flex
    const signInButtons = screen.getAllByText('Iniciar sesión');
    // Desktop has one hidden-sm button; mobile has one when open
    // With menu closed: only 1 sign-in button (desktop with hidden sm:inline-flex)
    expect(signInButtons).toHaveLength(1);
  });

  it('should render the mobile drawer in the DOM when hamburger is clicked', () => {
    render(<AppHeader />, { wrapper: TestWrapper });

    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }));

    // The button should now show "Cerrar menu"
    expect(screen.getByRole('button', { name: /cerrar menu/i })).toBeInTheDocument();

    // Now there are 2 "Iniciar sesión" buttons: desktop (hidden sm) + mobile (full-width)
    const signInButtons = screen.getAllByText('Iniciar sesión');
    expect(signInButtons).toHaveLength(2);

    // The mobile one has class "w-full rounded-full font-bold"
    const mobileSignIn = signInButtons.find(
      (btn) => btn.className.includes('w-full') && btn.className.includes('rounded-full')
    );
    expect(mobileSignIn).toBeInTheDocument();
  });

  it('should remove the mobile drawer from the DOM when toggled closed (exit animation)', async () => {
    render(<AppHeader />, { wrapper: TestWrapper });

    // Open
    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }));
    expect(screen.getAllByText('Iniciar sesión')).toHaveLength(2);

    // Close
    fireEvent.click(screen.getByRole('button', { name: /cerrar menu/i }));

    // After AnimatePresence exit animation, mobile drawer is removed from DOM
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /cerrar menu/i })).not.toBeInTheDocument();
    });

    // Back to only 1 sign-in button (desktop)
    await waitFor(() => {
      expect(screen.getAllByText('Iniciar sesión')).toHaveLength(1);
    });
  });
});
