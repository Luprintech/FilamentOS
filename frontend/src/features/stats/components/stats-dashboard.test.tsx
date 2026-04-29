import type React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { StatsDashboard } from './stats-dashboard';
import type { StatsFilters } from '../types';

const mockUseAuth = vi.fn();
const mockUseQuery = vi.fn();
const mockUseStatsQuery = vi.fn();
const mockUseStatsPiecesQuery = vi.fn();

vi.mock('@/context/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

vi.mock('../api/use-stats', () => ({
  useStatsQuery: (...args: unknown[]) => mockUseStatsQuery(...args),
  useStatsPiecesQuery: (...args: unknown[]) => mockUseStatsPiecesQuery(...args),
}));

vi.mock('@/components/filament-challenge/tracker-api', () => ({
  apiGetProjects: vi.fn(),
}));

vi.mock('./stats-filter-bar', () => ({
  StatsFilterBar: ({ filters, onFiltersChange }: { filters: StatsFilters; onFiltersChange: (filters: StatsFilters) => void }) => (
    <div>
      <div>stats-filter-bar</div>
      <button
        type="button"
        onClick={() => onFiltersChange({
          ...filters,
          from: '2026-04-10',
          to: '2026-04-12',
          status: 'failed',
          preset: 'custom',
        })}
      >
        apply-custom-filters
      </button>
    </div>
  ),
}));

vi.mock('./stats-metric-cards', () => ({
  StatsMetricCards: () => <div>stats-metric-cards</div>,
}));

vi.mock('./stats-insights', () => ({
  StatsInsights: () => <div>stats-insights</div>,
}));

vi.mock('./stats-export-buttons', () => ({
  StatsExportButtons: () => <div>stats-export-buttons</div>,
}));

vi.mock('./stats-charts', () => ({
  StatsCharts: ({ onOpenPieces }: { onOpenPieces?: () => void }) => (
    <div>
      <div>stats-charts</div>
      {onOpenPieces ? <button onClick={onOpenPieces}>{i18n.t('stats_view_pieces_cta')}</button> : null}
    </div>
  ),
}));

vi.mock('./stats-pieces-table', () => ({
  StatsPiecesTable: ({
    pieces,
    isLoading,
    isError,
  }: {
    pieces: Array<{ id: string }>;
    isLoading: boolean;
    isError: boolean;
  }) => (
    <div>
      <div>stats-pieces-table</div>
      <div>{pieces.map((piece) => piece.id).join(',') || 'no-pieces'}</div>
      <div>{isLoading ? 'pieces-loading' : isError ? 'pieces-error' : 'pieces-ready'}</div>
    </div>
  ),
}));

function renderWithI18n(ui: React.ReactElement) {
  return render(
    <I18nextProvider i18n={i18n}>
      {ui}
    </I18nextProvider>,
  );
}

beforeEach(() => {
  mockUseQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
  mockUseStatsQuery.mockReturnValue({
    isLoading: false,
    isError: false,
    isSuccess: true,
    data: {
      summary: { totalPieces: 2, totalGrams: 1500, totalCost: 21.9, totalSecs: 9060, avgCostPerPiece: 10.95, projectCount: 2, byStatus: { pending: 0, printed: 1, postProcessed: 0, delivered: 0, failed: 1 } },
      timeSeries: [],
      byProject: [],
    },
  });
  mockUseStatsPiecesQuery.mockReturnValue({ data: { pieces: [] }, isLoading: false, isError: false });
});

describe('StatsDashboard', () => {
  it('opens detail view from header and chart CTAs while preserving the active filters', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' }, isGuest: false });
    mockUseStatsPiecesQuery.mockReturnValue({
      data: { pieces: [{ id: 'piece-filtered' }] },
      isLoading: false,
      isError: false,
    });

    renderWithI18n(<StatsDashboard />);

    expect(screen.queryByText('stats-pieces-table')).not.toBeInTheDocument();
    expect(mockUseStatsPiecesQuery).toHaveBeenLastCalledWith(expect.objectContaining({
      status: 'all',
      preset: 'thisYear',
    }), false);

    fireEvent.click(screen.getByRole('button', { name: 'apply-custom-filters' }));
    expect(mockUseStatsPiecesQuery).toHaveBeenLastCalledWith(expect.objectContaining({
      from: '2026-04-10',
      to: '2026-04-12',
      status: 'failed',
    }), false);

    fireEvent.click(screen.getByRole('button', { name: i18n.t('stats_view_detail') }));
    expect(screen.getByText('stats-pieces-table')).toBeInTheDocument();
    expect(screen.getByText('piece-filtered')).toBeInTheDocument();
    expect(mockUseStatsPiecesQuery).toHaveBeenLastCalledWith(expect.objectContaining({
      from: '2026-04-10',
      to: '2026-04-12',
      status: 'failed',
    }), true);

    fireEvent.click(screen.getByRole('button', { name: i18n.t('stats_view_overview') }));
    expect(screen.queryByText('stats-pieces-table')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.t('stats_view_pieces_cta') }));
    expect(screen.getByText('stats-pieces-table')).toBeInTheDocument();
    expect(mockUseStatsPiecesQuery).toHaveBeenLastCalledWith(expect.objectContaining({
      from: '2026-04-10',
      to: '2026-04-12',
      status: 'failed',
    }), true);
  });

  it('hides non-functional guest detail triggers', () => {
    mockUseAuth.mockReturnValue({ user: null, isGuest: true });

    renderWithI18n(<StatsDashboard />);

    expect(screen.queryByRole('button', { name: i18n.t('stats_view_detail') })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: i18n.t('stats_view_pieces_cta') })).not.toBeInTheDocument();
  });

  it('shows the login-required state when there is no guest session and no authenticated user', () => {
    mockUseAuth.mockReturnValue({ user: null, isGuest: false });

    renderWithI18n(<StatsDashboard />);

    expect(screen.getByText(i18n.t('stats_login_required'))).toBeInTheDocument();
    expect(screen.queryByText('panel-open')).not.toBeInTheDocument();
  });
});
