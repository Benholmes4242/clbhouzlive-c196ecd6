import { describe, it, expect, vi } from 'vitest';
import { render as rtlRender, screen, within, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_k: string, d?: unknown) =>
      typeof d === 'string' ? d : ((d as { defaultValue?: string; defaultValue_other?: string })?.defaultValue ?? (d as { defaultValue_other?: string })?.defaultValue_other ?? _k),
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
  Trans: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

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
    <ScoresLeaderboardsPage userId={userId} state={state} onOpenBoard={vi.fn()} onOpenFilters={vi.fn()}
      onRowPress={vi.fn()} onMemberTap={vi.fn()} onOpenCourse={vi.fn()} />,
  );
}

const rowsOf = () => screen.getAllByRole('button').filter((b) => /Member \d|Viewer/.test(b.textContent ?? ''));

describe('Board rail (Phase 1)', () => {
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
  it('a ranked board renders positions and a podium on first', () => {
    page('gross', [row(1), row(2), row(3)]);
    const rows = rowsOf();
    expect(rows[0].hasAttribute('data-board-podium')).toBe(true);
    expect(rows[1].hasAttribute('data-board-podium')).toBe(false);
    expect(rows.map((r) => r.textContent?.match(/^(\d+)/)?.[1])).toEqual(['1', '2', '3']);
    expect(screen.getByText('POS')).toBeTruthy();
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
    expect(pageCells.at(-1)).toBe('\u22123');
    expect(pageCells.at(-2)).toBe('69');
  });

  it('the viewing member keeps the score colour law; amber on position and name only', () => {
    page('topar', [row(1), row(2, { user_id: 'viewer', display_name: 'Viewer', gross_score: 70 })]);
    const self = rowsOf()[1];
    const cells = self.querySelectorAll<HTMLElement>('.tabular-nums');
    const pos = cells[0];
    const value = cells[cells.length - 1];
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
