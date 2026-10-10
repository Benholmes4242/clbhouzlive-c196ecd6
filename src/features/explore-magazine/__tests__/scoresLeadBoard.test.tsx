import { describe, it, expect, vi } from 'vitest';
import { render as rtlRender, screen, within, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', async () => {
  /* Resolves against the real English catalogue: call sites carry no fallbacks. */
  const en = (await import('../../../../public/locales/en/courses.json')).default as Record<string, unknown>;
  const look = (k: string) => k.split('.').reduce<unknown>((o, p) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[p] : undefined), en);
  const t = (k: string, o?: unknown) => {
    const opts = (typeof o === 'object' && o) ? (o as Record<string, unknown>) : {};
    let v = typeof opts.count === 'number' ? look(`${k}_${opts.count === 1 ? 'one' : 'other'}`) ?? look(k) : look(k);
    if (typeof v !== 'string') v = typeof o === 'string' ? o : k;
    return (v as string).replace(/\{\{(\w+)\}\}/g, (_m, n) => String(opts[n] ?? ''));
  };
  return { useTranslation: () => ({ t }), initReactI18next: { type: '3rdParty', init: () => {} }, Trans: ({ children }: { children?: React.ReactNode }) => children ?? null };
});

const rpcRows: { current: unknown[] } = { current: [] };
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(async (name: string) => ({ data: name === 'get_board_page' ? rpcRows.current : [], error: null })),
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
  },
}));
vi.mock('@/features/explore-magazine/useFeatsWindow', () => ({ useFeatsWindow: () => ({ data: [], isSuccess: true }) }));
vi.mock('@/hooks/gam/useTop100ListProgress', () => ({ useTop100ListProgress: () => ({ data: [] }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import { ScoresLeaderboardsPage } from '@/features/explore-magazine/ScoresLeaderboardsPage';
import { BoardSeeAllSheet } from '@/components/explore-tab-new/courseled/BoardSeeAllSheet';
import { DEFAULT_FILTERS, type BoardKey } from '@/components/explore-tab-new/courseled/boardFilters';
import { A } from '@/components/explore-tab-new/courseled/tokens';
import type { BoardRow } from '@/components/explore-tab-new/courseled/hooks/useBoardPage';
import { fireEvent } from '@testing-library/react';
import { FiltersPill } from '@/features/explore-magazine/ScoresFilterHead';
import { OFFERED_RANKING_BOARD_KEYS, boardValueIsFigure } from '@/components/explore-tab-new/courseled/boardFilters';
import { makeBoardState } from '@/test/factories/boardState';

function render(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return rtlRender(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function row(pos: number, over: Partial<BoardRow> = {}): BoardRow {
  return {
    pos, is_tie: false, user_id: `u${pos}`, display_name: `Member ${pos}`, profile_photo_url: null,
    whs_score_id: `s${pos}`, play_date: '2026-09-20', course_id: 'c', course_name: 'Course',
    gross_score: 70 + pos, course_par: 72, net_score: null, stableford_points: null, delta_index: null,
    birdies: null, holes_in_one: null, albatrosses: null, eagles: null, clean_card: null, beat_par: null,
    sub_80: null, hcp_at_time: null, sort_value: null, total_count: 5, pool_rounds: 5, pool_courses: 1, pool_members: 5,
    ...over,
  };
}

function page(board: BoardKey, rows: BoardRow[], userId = 'viewer') {
  const state = makeBoardState({
    board, total: rows.length,
    page: { data: { rows, total: rows.length, pool: { rounds: 0, courses: 0, members: 0 } }, isSuccess: true, isPending: false } as never,
  });
  return render(
    <ScoresLeaderboardsPage userId={userId} state={state} onOpenFilters={vi.fn()}
      onRowPress={vi.fn()} onMemberTap={vi.fn()} onOpenCourse={vi.fn()} />,
  );
}

const rowsOf = () => screen.getAllByRole('button').filter((b) => /Member \d|Viewer/.test(b.textContent ?? ''));

function withYou(you: number | null, board: BoardKey = 'stableford') {
  const rows = [row(1), row(2)];
  const state = makeBoardState({
    board, total: 2,
    facets: { settled: you != null, countFor: (axis: string, key: string) => (axis === 'scope' && key === 'you' ? you : null), openList: () => [] },
    page: { data: { rows, total: 2, pool: { rounds: 23, courses: 3, members: 19 } }, isSuccess: true, isPending: false } as never,
  });
  return render(<ScoresLeaderboardsPage userId="viewer" state={state} onOpenFilters={vi.fn()}
    onRowPress={vi.fn()} onMemberTap={vi.fn()} onOpenCourse={vi.fn()} />);
}

describe('Standing and basis (Phase 2)', () => {
  it('renders the basis line beneath the controls', () => {
    withYou(null);
    expect(document.querySelector('[data-scores-basis]')).toBeTruthy();
  });
  it('keeps the you slab shape, empty, before the you-count resolves', () => {
    withYou(null);
    const slab = document.querySelector('[data-scores-standing]');
    expect(slab?.getAttribute('data-scores-standing')).toBe('pending');
    expect(slab?.textContent).toBe('');
  });
  it('a qualifying member beyond the fetch is told they are deeper and given see-all', () => {
    withYou(3);
    expect(document.querySelector('[data-scores-standing]')?.getAttribute('data-scores-standing')).toBe('deeper');
    expect(screen.getByText('See all members')).toBeTruthy();
  });
  it('a member with no qualifying round is told the floor', () => {
    withYou(0);
    expect(document.querySelector('[data-scores-standing]')?.getAttribute('data-scores-standing')).toBe('none');
  });
});

describe('Board rail (Phase 1, absorbs the retired BoardPicker tests)', () => {
  it('offers exactly the six ranking boards in order, no feats, no retired gross', () => {
    expect(OFFERED_RANKING_BOARD_KEYS).toEqual(['recent', 'topar', 'net', 'stableford', 'improved', 'birdies']);
    render(<ScoresLeaderboardsPage userId="v" state={makeBoardState()} onOpenFilters={vi.fn()}
      onRowPress={vi.fn()} onMemberTap={vi.fn()} onOpenCourse={vi.fn()} />);
    expect([...document.querySelectorAll('[data-board-chip]')].map((c) => c.getAttribute('data-board-chip'))).toEqual(OFFERED_RANKING_BOARD_KEYS);
  });
  it('tapping a chip changes the board through changeBoard', () => {
    const state = makeBoardState();
    render(<ScoresLeaderboardsPage userId="v" state={state} onOpenFilters={vi.fn()}
      onRowPress={vi.fn()} onMemberTap={vi.fn()} onOpenCourse={vi.fn()} />);
    fireEvent.click(document.querySelector('[data-board-chip="net"]')!);
    expect(state.changeBoard).toHaveBeenCalledWith('net');
  });
  it('the Filters pill still calls its own open handler', () => {
    const onOpen = vi.fn();
    render(<FiltersPill count={0} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
  it('numeric boards get the large leader value; recent gets row size', () => {
    expect(boardValueIsFigure('topar')).toBe(true);
    expect(boardValueIsFigure('net')).toBe(true);
    expect(boardValueIsFigure('recent')).toBe(false);
  });

  it('renders six named chips with no figures and nothing greyed when there is no counts object', () => {
    const state = makeBoardState({ facets: undefined as never });
    render(<ScoresLeaderboardsPage userId="v" state={state} onOpenFilters={vi.fn()}
      onRowPress={vi.fn()} onMemberTap={vi.fn()} onOpenCourse={vi.fn()} />);
    const chips = document.querySelectorAll('[data-board-chip]');
    expect(chips.length).toBe(6);
    chips.forEach((c) => expect((c as HTMLButtonElement).disabled).toBe(false));
    expect(document.querySelector('[data-scores-board-rail]')?.textContent).not.toMatch(/\d/);
  });
});

describe('Scores lead board (Phase 0)', () => {
  it('a ranked board renders positions, no podium and no column header', () => {
    page('gross', [row(1), row(2), row(3)]);
    const rows = rowsOf();
    expect(rows.some((r) => r.hasAttribute('data-board-podium'))).toBe(false);
    expect(rows.map((r) => r.textContent?.match(/^(\d+)/)?.[1])).toEqual(['1', '2', '3']);
    expect(screen.queryByText('POS')).toBeNull();
  });

  it('recent leads with net to par and gross to par behind; no net means gross alone', () => {
    page('recent', [row(1, { net_score: 70, gross_score: 80 }), row(2, { net_score: null, gross_score: 75 })]);
    const [a, b] = rowsOf();
    expect(a.querySelector('[data-board-main]')?.textContent).toBe('\u22122');
    expect(a.querySelector('[data-board-secondary]')?.textContent).toBe('+8');
    expect(b.querySelector('[data-board-main]')?.textContent).toBe('+3');
    expect(b.querySelector('[data-board-secondary]')).toBeNull();
  });

  it('the viewing member row carries the amber self tint', () => {
    page('topar', [row(1), row(2, { user_id: 'viewer', display_name: 'Viewer' })]);
    expect(rowsOf()[1].style.background).toBe('rgba(247, 147, 30, 0.07)');
  });

  it("the 'recent' board renders no positions and no podium", () => {
    page('recent', [row(1), row(2), row(3)]);
    const rows = rowsOf();
    expect(rows.some((r) => r.hasAttribute('data-board-podium'))).toBe(false);
    expect(rows.every((r) => !/^\d/.test(r.textContent ?? ''))).toBe(true);
    expect(screen.queryByText('POS')).toBeNull();
  });

  it("on 'topar' the page and the see-all sheet lead with the same figure", async () => {
    const r = row(1, { gross_score: 69, course_par: 72 });
    const { unmount } = page('topar', [r]);
    const pageCells = Array.from(rowsOf()[0].querySelectorAll('.tabular-nums')).map((n) => n.textContent);
    unmount();
    rpcRows.current = [r];
    render(<BoardSeeAllSheet open onClose={vi.fn()} userId="viewer" board="topar" filters={DEFAULT_FILTERS} appliedParts={[]} />);
    await waitFor(() => expect(screen.getAllByText('Member 1').length).toBeGreaterThan(0));
    const sheetRow = screen.getAllByRole('button').find((b) => b.textContent?.includes('Member 1'))!;
    const sheetCells = Array.from(sheetRow.querySelectorAll('.tabular-nums')).map((n) => n.textContent);
    expect(pageCells).toEqual(sheetCells);
    expect(pageCells.at(-2)).toBe('\u22123');
    expect(pageCells.at(-1)).toBe('69');
  });

  it('the viewing member keeps the score colour law; amber on position and name only', () => {
    page('topar', [row(1), row(2, { user_id: 'viewer', display_name: 'Viewer', gross_score: 70 })]);
    const self = rowsOf()[1];
    const cells = self.querySelectorAll<HTMLElement>('.tabular-nums');
    const pos = cells[0];
    const value = self.querySelector<HTMLElement>('[data-board-main]')!;
    expect(value.textContent).toBe('\u22122');
    expect(value.style.color).toBe(toCss(A.RED));
    expect(pos.style.color).toBe(toCss(A.AMBER));
    expect(within(self).getByText('Viewer').style.color).toBe(toCss(A.AMBER));
    expect(value.style.color).not.toBe(toCss(A.AMBER));
  });
});

function toCss(c: string) {
  const el = document.createElement('span');
  el.style.color = c;
  return el.style.color;
}

describe('Phase 14 — slab index clause', () => {
  function slab(board: BoardKey, viewerIndex: number | null, hcp: number | null) {
    const rows = [row(1), row(2, { user_id: 'viewer', display_name: 'Viewer', hcp_at_time: hcp })];
    const state = makeBoardState({
      board, total: 2, viewerIndex,
      page: { data: { rows, total: 2, pool: { rounds: 2, courses: 1, members: 2 } }, isSuccess: true, isPending: false } as never,
    });
    const r = render(<ScoresLeaderboardsPage userId="viewer" state={state} onOpenFilters={vi.fn()}
      onRowPress={vi.fn()} onMemberTap={vi.fn()} onOpenCourse={vi.fn()} />);
    return r.container.querySelector('[data-scores-standing="on"]')?.textContent ?? '';
  }
  it('a cut reads with a true minus', () => expect(slab('recent', 12.1, 12.5)).toContain('Your index has moved \u22120.4 since.'));
  it('a rise reads with a plus', () => expect(slab('recent', 12.8, 12.5)).toContain('Your index has moved +0.3 since.'));
  it('zero movement omits the clause', () => expect(slab('recent', 12.5, 12.5)).not.toContain('Your index'));
  it('a null index omits the clause', () => expect(slab('recent', null, 12.5)).not.toContain('Your index'));
  it('a ranked board never carries it', () => expect(slab('stableford', 12.1, 12.5)).not.toContain('Your index'));
});
