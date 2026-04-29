import type React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { StatsPiecesPanel } from './stats-pieces-panel';
import type { StatsPieceDetail } from '../types';

const pieces: StatsPieceDetail[] = [
  {
    id: 'piece-1',
    name: 'Soporte XL',
    label: 'Urgente',
    projectTitle: 'Proyecto Faro',
    projectId: 'project-1',
    status: 'printed',
    totalGrams: 1250,
    totalCost: 18.5,
    totalSecs: 7260,
    date: '2026-04-10T12:00:00.000Z',
    source: 'tracker',
  },
  {
    id: 'piece-2',
    name: 'Clip lateral',
    label: '',
    projectTitle: 'Proyecto Delta',
    projectId: 'project-2',
    status: 'failed',
    totalGrams: 320,
    totalCost: 3.4,
    totalSecs: 1800,
    date: '2026-04-12T12:00:00.000Z',
    source: 'tracker',
  },
];

const contractPiece: StatsPieceDetail = {
  id: 'piece-3',
  name: 'Marco técnico',
  label: 'Serie B',
  projectTitle: 'Proyecto Nodo',
  projectId: 'project-3',
  status: 'post_processed',
  totalGrams: 980,
  totalCost: 12.75,
  totalSecs: 5400,
  date: '2026-04-14T12:00:00.000Z',
  source: 'calculator',
};

function renderWithI18n(ui: React.ReactElement) {
  return render(
    <I18nextProvider i18n={i18n}>
      {ui}
    </I18nextProvider>,
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCost(value: number) {
  return `${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} €`;
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

describe('StatsPiecesPanel', () => {
  it('renders as a controlled sheet dialog and supports close button dismissal', async () => {
    const onOpenChange = vi.fn();

    renderWithI18n(
      <StatsPiecesPanel
        open
        onOpenChange={onOpenChange}
        pieces={pieces}
        isLoading={false}
        isError={false}
        periodLabel="2026-04-01 → 2026-04-30"
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(i18n.t('stats_pieces_panel_title'))).toBeInTheDocument();
    expect(screen.getByText('2026-04-01 → 2026-04-30')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders explicit loading, error, and empty states without stale cards during loading', () => {
    const { rerender } = renderWithI18n(
      <StatsPiecesPanel
        open
        onOpenChange={vi.fn()}
        pieces={pieces}
        isLoading
        isError={false}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('Soporte XL')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <StatsPiecesPanel
          open
          onOpenChange={vi.fn()}
          pieces={[]}
          isLoading={false}
          isError
        />
      </I18nextProvider>,
    );

    expect(screen.getByText(i18n.t('stats_error_load'))).toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <StatsPiecesPanel
          open
          onOpenChange={vi.fn()}
          pieces={[]}
          isLoading={false}
          isError={false}
        />
      </I18nextProvider>,
    );

    expect(screen.getAllByText(i18n.t('stats_pieces_empty')).length).toBeGreaterThan(0);
  });

  it('renders each piece as its own card and preserves all detail fields', () => {
    renderWithI18n(
      <StatsPiecesPanel
        open
        onOpenChange={vi.fn()}
        pieces={pieces}
        isLoading={false}
        isError={false}
      />,
    );

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);

    const firstCard = within(cards[0]);
    expect(firstCard.getByText('Soporte XL')).toBeInTheDocument();
    expect(firstCard.getByText(i18n.t('tracker.status.printed'))).toBeInTheDocument();
    expect(firstCard.getAllByText('Proyecto Faro')).toHaveLength(2);
    expect(firstCard.getByText('Urgente')).toBeInTheDocument();
    expect(firstCard.getByText(formatDate(pieces[0].date))).toBeInTheDocument();
    expect(firstCard.getByText('1.25 kg')).toBeInTheDocument();
    expect(firstCard.getByText(formatCost(pieces[0].totalCost))).toBeInTheDocument();
    expect(firstCard.getByText('2h 1m')).toBeInTheDocument();

    const secondCard = within(cards[1]);
    expect(secondCard.getByText('Clip lateral')).toBeInTheDocument();
    expect(secondCard.getByText(i18n.t('tracker.status.failed'))).toBeInTheDocument();
    expect(secondCard.getAllByText('Proyecto Delta')).toHaveLength(2);
    expect(secondCard.queryByText('Urgente')).not.toBeInTheDocument();
    expect(secondCard.getByText(formatDate(pieces[1].date))).toBeInTheDocument();
    expect(secondCard.getByText('320.0 g')).toBeInTheDocument();
    expect(secondCard.getByText(formatCost(pieces[1].totalCost))).toBeInTheDocument();
    expect(secondCard.getByText('30m')).toBeInTheDocument();
  });

  it('summarizes the rendered pieces and supports overlay dismissal', async () => {
    const onOpenChange = vi.fn();

    renderWithI18n(
      <StatsPiecesPanel
        open
        onOpenChange={onOpenChange}
        pieces={pieces}
        isLoading={false}
        isError={false}
      />,
    );

    expect(screen.getByText((content, node) => {
      return node?.textContent === `2 ${i18n.t('stats_kpi_pieces_ok')}`;
    })).toBeInTheDocument();
    expect(screen.getByText('1.57 kg')).toBeInTheDocument();
    expect(screen.getByText(formatCost(21.9))).toBeInTheDocument();
    expect(screen.getByText('2h 31m')).toBeInTheDocument();

    const overlay = document.body.querySelector('[data-state="open"][aria-hidden="true"]');
    expect(overlay).not.toBeNull();

    fireEvent.pointerDown(overlay as HTMLElement, { button: 0 });
    fireEvent.mouseDown(overlay as HTMLElement, { button: 0 });
    fireEvent.mouseUp(overlay as HTMLElement, { button: 0 });
    fireEvent.click(overlay as HTMLElement, { button: 0 });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps narrow viewport piece content readable without losing required fields', () => {
    setViewportWidth(375);

    renderWithI18n(
      <StatsPiecesPanel
        open
        onOpenChange={vi.fn()}
        pieces={pieces}
        isLoading={false}
        isError={false}
      />,
    );

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);

    const firstCard = within(cards[0]);
    expect(firstCard.getByText('Soporte XL')).toBeInTheDocument();
    expect(firstCard.getByText(i18n.t('tracker.status.printed'))).toBeInTheDocument();
    expect(firstCard.getByText('Urgente')).toBeInTheDocument();
    expect(firstCard.getByText('1.25 kg')).toBeInTheDocument();
    expect(firstCard.getByText(formatCost(pieces[0].totalCost))).toBeInTheDocument();
    expect(firstCard.getByText('2h 1m')).toBeInTheDocument();
  });

  it('keeps the sheet readable for multiple cards on wide viewports', () => {
    setViewportWidth(1440);

    renderWithI18n(
      <StatsPiecesPanel
        open
        onOpenChange={vi.fn()}
        pieces={[pieces[0], pieces[1], contractPiece]}
        isLoading={false}
        isError={false}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    const cards = within(dialog).getAllByRole('article');
    expect(cards).toHaveLength(3);
    expect(within(dialog).getByText('3 ' + i18n.t('stats_kpi_pieces_ok'))).toBeInTheDocument();
    expect(within(cards[2]).getAllByText('Proyecto Nodo')).toHaveLength(2);
  });

  it('renders the redesigned cards from the existing StatsPieceDetail payload contract', () => {
    renderWithI18n(
      <StatsPiecesPanel
        open
        onOpenChange={vi.fn()}
        pieces={[contractPiece]}
        isLoading={false}
        isError={false}
      />,
    );

    const card = within(screen.getByRole('article'));
    expect(card.getByText('Marco técnico')).toBeInTheDocument();
    expect(card.getByText(i18n.t('tracker.status.postProcessed'))).toBeInTheDocument();
    expect(card.getAllByText('Proyecto Nodo')).toHaveLength(2);
    expect(card.getByText('Serie B')).toBeInTheDocument();
    expect(card.getByText(formatDate(contractPiece.date))).toBeInTheDocument();
    expect(card.getByText('980.0 g')).toBeInTheDocument();
    expect(card.getByText(formatCost(contractPiece.totalCost))).toBeInTheDocument();
    expect(card.getByText('1h 30m')).toBeInTheDocument();
  });
});
