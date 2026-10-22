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
    sub_80: null, is_competition: null, hcp_at_time: null, sort_value: null, total_count: 5, pool_rounds: 5, pool_courses: 1, pool_members: 5,
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
    facets: { settled: true, resolved: true, countFor: (axis: string, key: string) => (axis === 'scope' && key === 'you' ? you : null), openList: () => [] },
    page: { data: { rows, total: 2, pool: { rounds: 23, courses: 3, members: 19 } }, isSuccess: true, isPending: false } as never,
  });
  return render(<ScoresLeaderboardsPage userId="viewer" state={state} onOpenFilters={vi.fn()}
    onRowPress={vi.fn()} onMemberTap={vi.fn()} onOpenCourse={vi.fn()} />);
}

describe('Board rail (Phase 1, absorbs the retired BoardPicker tests)', () => {
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

});

/* EX1b — the lead board left the page; these guard the same behaviour where it
   still ships: BoardSeeAllSheet, the sheet Leaderboards' See all opens. */
async function sheet(board: BoardKey, rows: BoardRow[]) {
  rpcRows.current = rows;
  render(<BoardSeeAllSheet open onClose={vi.fn()} userId="viewer" board={board} filters={DEFAULT_FILTERS} appliedParts={[]} />);
  await waitFor(() => expect(rowsOf().length).toBe(rows.length));
  return rowsOf();
}

describe('See-all sheet rows (retargeted from the page lead board, EX1b)', () => {
  it('A3.2 / EX1c — the sheet on recent leads with the net score, then gross', async () => {
    const rows = await sheet('recent', [
      row(1, { net_score: 70, gross_score: 82 }),
      row(2, { net_score: 66, gross_score: 75 }),
    ]);
    const figs = rows.map((r) => [
      r.querySelector('[data-board-main]')?.textContent,
      r.querySelector('[data-board-secondary]')?.textContent,
    ]);
    expect(figs).toEqual([
      ['70', '82'],
      ['66', '75'],
    ]);
  });

  it('EX1c — a null net on recent renders the em dash with the gross still shown', async () => {
    const rows = await sheet('recent', [row(1, { net_score: null, gross_score: 88 })]);
    expect(rows.length).toBe(1);
    expect(rows[0].querySelector('[data-board-main]')?.textContent).toBe('\u2014');
    expect(rows[0].querySelector('[data-board-secondary]')?.textContent).toBe('88');
  });

  it('the viewing member row in the sheet carries the amber self tint', async () => {
    const rows = await sheet('topar', [row(1), row(2, { user_id: 'viewer', display_name: 'Viewer' })]);
    expect(rows[1].style.background).toBe('rgba(247, 147, 30, 0.07)');
  });

  /* CB31 — retargeted to CB27: the raw gross leads, its to-par sits small beside it. */
  it("the sheet on 'topar' leads with the gross score, its to-par beside it (sheet only)", async () => {
    const rows = await sheet('topar', [row(1, { gross_score: 69, course_par: 72 })]);
    const main = rows[0].querySelector('[data-board-main]');
    expect(main?.textContent).toBe('69');
    expect(main?.nextElementSibling?.textContent).toBe('\u22123');
  });

  it('in the sheet the viewing member keeps the score colour law; amber on position and name only', async () => {
    const rows = await sheet('topar', [row(1), row(2, { user_id: 'viewer', display_name: 'Viewer', gross_score: 70 })]);
    const self = rows[1];
    const cells = self.querySelectorAll<HTMLElement>('.tabular-nums');
    const pos = cells[0];
    const value = self.querySelector<HTMLElement>('[data-board-main]')!;
    // CB32: CB9 law — the big figure is never red; the to-par beside it carries it.
    expect(value.textContent).toBe('70');
    expect(value.parentElement!.style.color).toBe(toCss(A.INK));
    const toPar = value.nextElementSibling as HTMLElement;
    expect(toPar.textContent).toBe('\u22122');
    expect(toPar.style.color).toBe(toCss(A.RED));
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

