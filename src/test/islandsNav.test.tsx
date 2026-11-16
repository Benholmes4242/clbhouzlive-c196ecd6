/**
 * BRIEF_ISLANDS_NAV — top islands, bottom nav and the index glance.
 *
 * Covers:
 *   - lastIndexMove detail: improving / drifting / none, with sizes;
 *   - the island index cell's move text (▾0.2 / ▴0.3 / none);
 *   - the glance: opens on tap, data appears, closes on Escape and on route
 *     change, focus returns to the index cell;
 *   - BRIEF_ONE_INDEX_CHART: the shared 90-day chart, its net headline, the
 *     five last-round dots and no rule above the stats;
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
  linked: true,
  connected: true,
  settled: true,
  connection: { id: 'c1' } as any,
  trend: { current: 12.4 } as any,
  anyError: false,
};
let mockHistory: { observed_at: string; handicap_index: number }[] = [];
let mockScores: any[] = [];
let mockLastRound: any = null;
const mockPro = { verified: false, verifiedKnown: true, pending: false, declined: false, kind: null, tour: null, tourCode: null, club: null, body: null, reviewReason: null, request: null, isLoading: false, unknown: false };

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
let mockRounds: any[] = [];
vi.mock('@/components/profile/rounds/useProfileRounds', async (orig) => ({
  ...(await orig<typeof import('@/components/profile/rounds/useProfileRounds')>()),
  useProfileRounds: () => ({ isSuccess: true, data: mockRounds }),
}));
vi.mock('@/features/search-v2/SearchOverlayV2', () => ({ SearchOverlayV2: () => null }));
vi.mock('@/components/header/PostingAsMenu', () => ({ PostingAsMenu: () => null }));
vi.mock('@/features/pro-verification/useMyProStatus', () => ({ useMyProStatus: () => mockPro }));

import { HcpCell, lastIndexMove } from '@/features/chrome-v2/ChromeIsland';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { glanceMoveText, glanceNinetyDayText, formatVsPar } from '@/features/chrome-v2/IndexGlance';

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

afterEach(() => { cleanup(); vi.useRealTimers(); });

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

  it('shows the 90-day headline, the shared chart, five dots and stats without a rule', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
    mockHistory = [
      { observed_at: iso(300), handicap_index: 12.2 },
      { observed_at: iso(10), handicap_index: 12.6 },
      { observed_at: iso(2), handicap_index: 12.4 },
    ];
    mockRounds = [1, 2, 3, 4, 5, 6].map((d) => ({
      whs_score_id: `r${d}`, play_date: iso(d * 3).slice(0, 10), whs_joined: true, is_nine_hole: false, total_holes: 18,
      handicap_differential: 12, handicap_index_at_time: 12.4, is_counter: d === 2,
    }));
    mockLastRound = { adjusted_gross: 73, course_par: 72 };
    openGlance();
    const dialog = screen.getByRole('dialog', { name: 'Your handicap index' });
    expect(dialog.textContent).toContain('▲ 0.2 · 90 days');
    expect(dialog.textContent).not.toContain('rounds ago');
    expect(dialog.querySelector('[data-testid="index-glance-chart"] [data-index-window-chart="90"]')).not.toBeNull();
    expect(dialog.textContent).toContain('90 days ago');
    const dots = dialog.querySelectorAll('[data-form-round-dot]');
    expect(dots).toHaveLength(5);
    expect([...dots].filter((d) => d.getAttribute('data-counts') === 'true').map((d) => d.getAttribute('data-form-round-dot'))).toEqual(['r2']);
    const stats = dialog.querySelector<HTMLElement>('[data-glance-stats]');
    expect(stats?.style.borderTop).toBe('');
    expect(stats?.style.marginTop).toBe('16px');
    expect(dialog.textContent).toContain('12.2'); // Low index
    expect(dialog.textContent).toContain('73'); // Last round
    expect(dialog.textContent).toContain('+1'); // vs par
    mockRounds = [];
  });

  it('short history names the real span, never 90 days', () => {
    mockHistory = [{ observed_at: iso(20), handicap_index: 12.9 }, { observed_at: iso(3), handicap_index: 12.4 }];
    openGlance();
    const dialog = screen.getByRole('dialog', { name: 'Your handicap index' });
    expect(dialog.textContent).toContain('▼ 0.5 · 20 days');
    expect(dialog.textContent).toContain('20 days ago');
    expect(dialog.textContent).not.toContain('90 days');
  });

  it('hides the chart when there is no index history', () => {
    mockHistory = [];
    openGlance();
    expect(screen.queryByTestId('index-glance-chart')).toBeNull();
  });

  it.each([
    [13.4, '▼ 1.0 · 90 days', INDEX_DELTA.dark.improved],
    [11.4, '▲ 1.0 · 90 days', INDEX_DELTA.dark.drifted],
    [12.43, 'Level · 90 days', 'rgba(248,250,252,0.62)'],
  ])('reads the 90-day net from a start of %s', (start, text, color) => {
    mockHistory = [{ observed_at: iso(120), handicap_index: start }, { observed_at: iso(3), handicap_index: 12.4 }];
    openGlance();
    const dialog = screen.getByRole('dialog', { name: 'Your handicap index' });
    expect(dialog.textContent).toContain(text);
    const norm = document.createElement('i'); norm.style.color = color;
    expect(dialog.querySelector<HTMLElement>('[data-glance-move]')?.style.color).toBe(norm.style.color);
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
  it('the 90-day headline treats a 0.1 move as a move and zero as level', () => {
    expect(glanceNinetyDayText(-0.1).text).toBe('▼ 0.1 · 90 days');
    expect(glanceNinetyDayText(0.1).text).toBe('▲ 0.1 · 90 days');
    expect(glanceNinetyDayText(0)).toEqual({ text: 'Level · 90 days', color: 'rgba(248,250,252,0.62)' });
  });
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
