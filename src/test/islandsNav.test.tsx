/**
 * BRIEF_ISLANDS_NAV — top islands, bottom nav and the index glance.
 *
 * Covers:
 *   - lastIndexMove detail: improving / drifting / none, with sizes;
 *   - the island index cell's move text (▾0.2 / ▴0.3 / none);
 *   - the glance: opens on tap, data appears, closes on Escape and on route
 *     change, focus returns to the index cell;
 *   - "{n} rounds ago" matching the rounds drawn;
 *   - "vs par" formatting (+1, E, −2);
 *   - the scrolled flag at the 24px threshold;
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

// --- Shared mutable fixtures -------------------------------------------------
const mockHcp = {
  connected: true,
  settled: true,
  connection: { id: 'c1' } as any,
  trend: { current: 12.4 } as any,
  anyError: false,
};
let mockHistory: { observed_at: string; handicap_index: number }[] = [];
let mockScores: any[] = [];
let mockLastRound: any = null;

vi.mock('@/hooks/useSupabaseSession', () => ({
  useSupabaseSession: () => ({ user: { id: 'u1' }, loading: false }),
}));
vi.mock('@/context/ActiveActorContext', () => ({
  useActiveActor: () => ({
    activeActor: { type: 'personal', id: 'u1', name: 'Ben Carter', avatarUrl: null },
    isLoading: false,
  }),
}));
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({ data: { hide_handicap_chip: false }, isFetched: true, isError: false }),
}));
vi.mock('@/lib/whs/useHandicapChipState', () => ({
  useHandicapChipState: () => mockHcp,
}));
vi.mock('@/lib/whs/hooks', () => ({
  useHandicapHistory: () => ({ data: mockHistory }),
  useAllScores: () => ({ data: mockScores }),
  useLastRound: () => ({ data: mockLastRound }),
}));
vi.mock('@/features/search-v2/SearchOverlayV2', () => ({ SearchOverlayV2: () => null }));
vi.mock('@/components/header/PostingAsMenu', () => ({ PostingAsMenu: () => null }));

import { HcpCell, lastIndexMove } from '@/features/chrome-v2/ChromeIsland';
import { glanceMoveText, formatVsPar } from '@/features/chrome-v2/IndexGlance';

const DAY = 86_400_000;
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY).toISOString();

function renderCell() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <HcpCell tone="dark" dividerColor="rgba(255,255,255,0.14)" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mockHistory = [];
  mockScores = [];
  mockLastRound = null;
});

afterEach(cleanup);

// ---------------------------------------------------------------------------
// lastIndexMove (pure)
// ---------------------------------------------------------------------------
describe('lastIndexMove', () => {
  it('reports an improving move with its size', () => {
    const move = lastIndexMove([
      { observed_at: iso(10), handicap_index: 12.6 },
      { observed_at: iso(2), handicap_index: 12.4 },
    ]);
    expect(move.direction).toBe('improving');
    expect(move.size).toBeCloseTo(0.2);
    expect(move.movedAt).not.toBeNull();
  });

  it('reports a drifting move with its size', () => {
    const move = lastIndexMove([
      { observed_at: iso(10), handicap_index: 12.4 },
      { observed_at: iso(2), handicap_index: 12.7 },
    ]);
    expect(move.direction).toBe('drifting');
    expect(move.size).toBeCloseTo(0.3);
  });

  it('reports none when the last move is older than 30 days', () => {
    const move = lastIndexMove([
      { observed_at: iso(60), handicap_index: 12.6 },
      { observed_at: iso(40), handicap_index: 12.4 },
    ]);
    expect(move.direction).toBe('none');
    expect(move.size).toBeNull();
  });

  it('reports none when the change is inside the 0.05 epsilon', () => {
    const move = lastIndexMove([
      { observed_at: iso(10), handicap_index: 12.4 },
      { observed_at: iso(2), handicap_index: 12.43 },
    ]);
    expect(move.direction).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// Island index cell move text
// ---------------------------------------------------------------------------
describe('island index cell', () => {
  it('shows the improving move as ▾0.2', () => {
    mockHistory = [
      { observed_at: iso(10), handicap_index: 12.6 },
      { observed_at: iso(2), handicap_index: 12.4 },
    ];
    renderCell();
    const cell = screen.getByRole('button', { name: 'Handicap index 12.4' });
    expect(cell.textContent).toContain('▾0.2');
    expect(cell.textContent).toContain('INDEX');
  });

  it('shows the drifting move as ▴0.3', () => {
    mockHistory = [
      { observed_at: iso(10), handicap_index: 12.1 },
      { observed_at: iso(2), handicap_index: 12.4 },
    ];
    renderCell();
    expect(screen.getByRole('button', { name: 'Handicap index 12.4' }).textContent).toContain('▴0.3');
  });

  it('shows only the number when there is no move', () => {
    mockHistory = [{ observed_at: iso(2), handicap_index: 12.4 }];
    renderCell();
    const cell = screen.getByRole('button', { name: 'Handicap index 12.4' });
    expect(cell.textContent).not.toContain('▾');
    expect(cell.textContent).not.toContain('▴');
  });
});

// ---------------------------------------------------------------------------
// The index glance
// ---------------------------------------------------------------------------
describe('IndexGlance', () => {
  const openGlance = () => {
    renderCell();
    const cell = screen.getByRole('button', { name: 'Handicap index 12.4' });
    fireEvent.click(cell);
    return cell;
  };

  it('opens on tap with dialog semantics and focuses the card', () => {
    openGlance();
    const dialog = screen.getByRole('dialog', { name: 'Your handicap index' });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.activeElement).toBe(dialog);
  });

  it('shows the move, sparkline and stats once data settles', () => {
    mockHistory = [
      { observed_at: iso(300), handicap_index: 12.2 },
      { observed_at: iso(10), handicap_index: 12.6 },
      { observed_at: iso(2), handicap_index: 12.4 },
    ];
    mockScores = [
      { id: 's3', play_date: iso(1), handicap_index_at_time: 12.4 },
      { id: 's2', play_date: iso(5), handicap_index_at_time: 12.6 },
      { id: 's1', play_date: iso(9), handicap_index_at_time: 12.2 },
      { id: 's0', play_date: iso(20), handicap_index_at_time: null },
    ];
    mockLastRound = { adjusted_gross: 73, course_par: 72 };
    openGlance();
    const dialog = screen.getByRole('dialog', { name: 'Your handicap index' });
    expect(dialog.textContent).toContain('▾ 0.2 this month');
    // 3 rounds carry an index; the current index is appended as "Now".
    expect(dialog.textContent).toContain('3 rounds ago');
    expect(dialog.textContent).toContain('Now');
    expect(dialog.textContent).toContain('12.2'); // Low index
    expect(dialog.textContent).toContain('73'); // Last round
    expect(dialog.textContent).toContain('+1'); // vs par
  });

  it('hides the sparkline when fewer than 2 points exist', () => {
    mockScores = [];
    openGlance();
    expect(screen.queryByTestId('index-glance-sparkline')).toBeNull();
  });

  it('closes on Escape and returns focus to the index cell', () => {
    const cell = openGlance();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Your handicap index' })).toBeNull();
    expect(document.activeElement).toBe(cell);
  });

  it('closes on a tap on the backdrop', () => {
    openGlance();
    fireEvent.click(screen.getByTestId('index-glance-backdrop'));
    expect(screen.queryByRole('dialog', { name: 'Your handicap index' })).toBeNull();
  });

  it('closes on route change', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const Jump: React.FC = () => {
      const navigate = useNavigate();
      return <button type="button" onClick={() => navigate('/courses')}>jump</button>;
    };
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/']}>
          <HcpCell tone="dark" dividerColor="rgba(255,255,255,0.14)" />
          <Jump />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Handicap index 12.4' }));
    expect(screen.getByRole('dialog', { name: 'Your handicap index' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('jump'));
    expect(screen.queryByRole('dialog', { name: 'Your handicap index' })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Glance helpers
// ---------------------------------------------------------------------------
describe('glanceMoveText', () => {
  it('writes "this month" for a move in the current calendar month', () => {
    const now = new Date(2026, 9, 28);
    const text = glanceMoveText(
      { direction: 'improving', size: 0.2, movedAt: new Date(2026, 9, 3).getTime() },
      now,
    );
    expect(text).toBe('▾ 0.2 this month');
  });

  it('writes the date for a move outside the current month', () => {
    const now = new Date(2026, 9, 28);
    const text = glanceMoveText(
      { direction: 'drifting', size: 0.3, movedAt: new Date(2026, 8, 12).getTime() },
      now,
    );
    expect(text).toBe('▴ 0.3 on 12 Sept');
  });

  it('is null when there is no move', () => {
    expect(glanceMoveText({ direction: 'none', size: null, movedAt: null })).toBeNull();
  });
});

describe('formatVsPar', () => {
  it('formats over, level and under par', () => {
    expect(formatVsPar(73, 72)).toBe('+1');
    expect(formatVsPar(72, 72)).toBe('E');
    expect(formatVsPar(70, 72)).toBe('−2');
  });

  it('is null when either side is missing', () => {
    expect(formatVsPar(null, 72)).toBeNull();
    expect(formatVsPar(73, null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// The scrolled flag (24px threshold)
// ---------------------------------------------------------------------------
describe('useChromeScrolled', () => {
  it('flips at the 24px threshold and resets with resetToExpanded', async () => {
    const { registerNavScroller, resetToExpanded, useChromeScrolled } = await import('@/hooks/useScrollDirection');

    const Probe: React.FC = () => {
      const scrolled = useChromeScrolled();
      return <div data-testid="scrolled">{String(scrolled)}</div>;
    };
    render(<Probe />);

    const scroller = document.createElement('div');
    document.body.appendChild(scroller);
    const unregister = registerNavScroller(scroller);

    const scrollTo = async (top: number) => {
      scroller.scrollTop = top;
      fireEvent.scroll(scroller);
      await act(async () => {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      });
    };

    await scrollTo(24);
    expect(screen.getByTestId('scrolled').textContent).toBe('false');
    await scrollTo(25);
    expect(screen.getByTestId('scrolled').textContent).toBe('true');

    act(() => resetToExpanded());
    expect(screen.getByTestId('scrolled').textContent).toBe('false');

    unregister();
    scroller.remove();
  });
});

// ---------------------------------------------------------------------------
