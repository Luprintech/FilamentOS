import { describe, expect, it, vi } from 'vitest';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        cookies_title: 'Política de Cookies',
        cookies_updated: 'Última actualización: 2025',
        cookies_intro: 'Esta es la política de cookies.',
        cookies_what_title: '¿Qué son las cookies?',
        cookies_what_text: 'Las cookies son pequeños archivos.',
        cookies_table_title: 'Cookies que utilizamos',
        privacy_table_header_name: 'Nombre',
        privacy_table_header_type: 'Tipo',
        privacy_table_header_duration: 'Duración',
        privacy_table_header_purpose: 'Finalidad',
        cookies_table_name: 'connect.sid',
        cookies_table_name2: 'cookieConsent',
        privacy_table_row1_type: 'Técnica',
        privacy_table_row1_duration: 'Sesión',
        privacy_table_row1_purpose: 'Mantener la sesión',
        privacy_table_row2_type: 'Técnica',
        privacy_table_row2_duration: '1 año',
        privacy_table_row2_purpose: 'Recordar consentimiento',
        cookies_management_title: 'Gestión de cookies',
        cookies_management_text: 'Puedes gestionar las cookies',
        cookies_links_chrome: 'Chrome',
        cookies_links_firefox: 'Firefox',
        cookies_links_safari: 'Safari',
        cookies_links_edge: 'Edge',
        cookies_legal_title: 'Base legal',
        cookies_legal_text: 'Base legal del uso de cookies.',
        cookies_more_info: 'Más información en',
        privacy_title: 'Política de Privacidad',
      };
      return map[key] ?? key;
    },
    i18n: { resolvedLanguage: 'es' },
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: React.PropsWithChildren<{ to: string }>) =>
    React.createElement('a', { href: to, ...props }, children),
}));

import { render } from '@testing-library/react';
import { CookiesPage } from './CookiesPage';

function renderPage() {
  return render(<CookiesPage />).container;
}

describe('T5 — CookiesPage cookie table responsive', () => {
  it('renders the table hidden on mobile (hidden sm:block wrapper)', () => {
    const container = renderPage();

    const tableWrappers = container.querySelectorAll('div.hidden');
    const hasTable = Array.from(tableWrappers).some(
      (el) => el.querySelector('table') !== null
    );
    expect(hasTable).toBe(true);
  });

  it('renders table header cells with correct translations', () => {
    const container = renderPage();

    const allTables = container.querySelectorAll('table');
    expect(allTables.length).toBeGreaterThan(0);

    const headers = allTables[0].querySelectorAll('thead th');
    expect(headers).toHaveLength(4);
    expect(headers[0]).toHaveTextContent('Nombre');
    expect(headers[1]).toHaveTextContent('Tipo');
    expect(headers[2]).toHaveTextContent('Duración');
    expect(headers[3]).toHaveTextContent('Finalidad');
  });

  it('renders two cookie data rows in the table', () => {
    const container = renderPage();

    const allTables = container.querySelectorAll('table');
    const rows = allTables[0].querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
  });

  it('renders mobile cards below the table (block sm:hidden)', () => {
    const container = renderPage();

    const hiddenDiv = container.querySelector('div.hidden');
    const allCards = container.querySelectorAll('.rounded-xl');
    const outsideCards = Array.from(allCards).filter(
      (card) => !hiddenDiv || !hiddenDiv.contains(card)
    );
    expect(outsideCards.length).toBe(2);
  });

  it('renders each mobile card with field:value pairs using translated headers', () => {
    const container = renderPage();

    const hiddenDiv = container.querySelector('div.hidden');
    const allCards = container.querySelectorAll('.rounded-xl');
    const outsideCards = Array.from(allCards).filter(
      (card) => !hiddenDiv || !hiddenDiv.contains(card)
    );

    // First card: connect.sid
    const firstCard = outsideCards[0];
    expect(firstCard.textContent).toContain('Nombre');
    expect(firstCard.textContent).toContain('connect.sid');
    expect(firstCard.textContent).toContain('Tipo');
    expect(firstCard.textContent).toContain('Técnica');
    expect(firstCard.textContent).toContain('Duración');
    expect(firstCard.textContent).toContain('Sesión');
    expect(firstCard.textContent).toContain('Finalidad');
    expect(firstCard.textContent).toContain('Mantener la sesión');

    // Second card: cookieConsent
    const secondCard = outsideCards[1];
    expect(secondCard.textContent).toContain('Nombre');
    expect(secondCard.textContent).toContain('cookieConsent');
    expect(secondCard.textContent).toContain('Tipo');
    expect(secondCard.textContent).toContain('Técnica');
    expect(secondCard.textContent).toContain('Duración');
    expect(secondCard.textContent).toContain('1 año');
    expect(secondCard.textContent).toContain('Finalidad');
    expect(secondCard.textContent).toContain('Recordar consentimiento');
  });
});
