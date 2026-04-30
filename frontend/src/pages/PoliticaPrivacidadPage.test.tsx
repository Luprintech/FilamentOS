import { describe, expect, it, vi } from 'vitest';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        privacy_title: 'Política de Privacidad',
        privacy_updated: 'Última actualización: 2025',
        privacy_section1_title: '1. Responsable del Tratamiento',
        privacy_section1_owner_label: 'Titular',
        privacy_section1_owner_value: 'LuprinTech',
        privacy_section1_activity_label: 'Actividad',
        privacy_section1_activity_value: 'Software',
        privacy_section1_contact_label: 'Contacto',
        privacy_section2_title: '2. Datos Recogidos',
        privacy_section2_intro: 'Recogemos:',
        privacy_section2_item1: 'Nombre y email',
        privacy_section2_item2: 'Datos de uso',
        privacy_section2_item3: 'Configuración',
        privacy_section3_title: '3. Finalidad',
        privacy_section3_purpose_label: 'Finalidad',
        privacy_section3_purpose_text: 'Gestionar el servicio',
        privacy_section3_legal_label: 'Legitimación',
        privacy_section3_legal_text: 'Consentimiento',
        privacy_section4_title: '4. Conservación',
        privacy_section4_text: 'Conservamos tus datos mientras',
        privacy_section5_title: '5. Destinatarios',
        privacy_section5_text_prefix: 'Compartimos con',
        privacy_section5_text_suffix: 'para autenticación',
        privacy_section6_title: '6. Derechos',
        privacy_section6_intro: 'Tienes derecho a:',
        privacy_section6_item1: 'Acceso',
        privacy_section6_item2: 'Rectificación',
        privacy_section6_item3: 'Supresión',
        privacy_section6_item4: 'Limitación',
        privacy_section6_item5: 'Portabilidad',
        privacy_section6_outro_prefix: 'Puedes ejercer tus derechos',
        privacy_section6_outro_middle: 'o ante la',
        privacy_section6_outro_link_text: 'AEPD',
        privacy_section6_outro_suffix: '.',
        privacy_section7_title: '7. Cookies',
        privacy_section7_intro: 'Utilizamos las siguientes cookies:',
        privacy_table_header_name: 'Nombre',
        privacy_table_header_type: 'Tipo',
        privacy_table_header_duration: 'Duración',
        privacy_table_header_purpose: 'Finalidad',
        privacy_table_row1_type: 'Técnica',
        privacy_table_row1_duration: 'Sesión',
        privacy_table_row1_purpose: 'Mantener la sesión',
        privacy_table_row2_type: 'Técnica',
        privacy_table_row2_duration: '1 año',
        privacy_table_row2_purpose: 'Recordar consentimiento',
        privacy_section7_footer: 'Puedes configurar las cookies',
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

import { render } from '@testing-library/react';
import { PoliticaPrivacidadPage } from './PoliticaPrivacidadPage';

function renderPage() {
  const result = render(<PoliticaPrivacidadPage />);
  return result.container;
}

describe('T5 — PoliticaPrivacidadPage cookie table responsive', () => {
  it('renders the table hidden on mobile (hidden sm:block wrapper)', () => {
    const container = renderPage();

    // The table should be inside a div with both "hidden" and "sm:block" classes
    const tableWrappers = container.querySelectorAll('div.hidden');
    const hasTable = Array.from(tableWrappers).some(
      (el) => el.querySelector('table') !== null
    );
    expect(hasTable).toBe(true);
  });

  it('renders table header cells with correct translations', () => {
    const container = renderPage();

    // Find all tables — pick the one inside hidden div
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

    // Mobile cards are rendered outside hidden div — they have rounded-xl class
    // from the card wrapper. Find all card wrappers that are NOT inside the hidden div.
    const hiddenDiv = container.querySelector('div.hidden');
    const allCards = container.querySelectorAll('.rounded-xl');
    const outsideCards = Array.from(allCards).filter(
      (card) => !hiddenDiv || !hiddenDiv.contains(card)
    );
    expect(outsideCards.length).toBe(2);
  });

  it('renders each mobile card with field:value pairs', () => {
    const container = renderPage();

    const hiddenDiv = container.querySelector('div.hidden');
    const allCards = container.querySelectorAll('.rounded-xl');
    const outsideCards = Array.from(allCards).filter(
      (card) => !hiddenDiv || !hiddenDiv.contains(card)
    );

    // First card: should show connect.sid values
    const firstCard = outsideCards[0];
    expect(firstCard.textContent).toContain('Nombre');
    expect(firstCard.textContent).toContain('connect.sid');
    expect(firstCard.textContent).toContain('Tipo');
    expect(firstCard.textContent).toContain('Técnica');
    expect(firstCard.textContent).toContain('Duración');
    expect(firstCard.textContent).toContain('Sesión');
    expect(firstCard.textContent).toContain('Finalidad');
    expect(firstCard.textContent).toContain('Mantener la sesión');

    // Second card
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
