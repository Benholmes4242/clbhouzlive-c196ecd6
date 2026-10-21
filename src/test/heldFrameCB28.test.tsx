import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import en from '../../public/locales/en/courses.json';
import { DEFAULT_FILTERS } from '@/components/explore-tab-new/courseled/boardFilters';
import { StandoutRounds } from '@/components/explore-tab-new/courseled/StandoutRounds';
import { JustPlayed } from '@/components/explore-tab-new/courseled/JustPlayed';
import { CompetitionBoards } from '@/components/explore-tab-new/courseled/CompetitionBoards';
import { LeaderboardsSection } from '@/features/explore-magazine/LeaderboardsSection';
import { makeBoardState } from './factories/boardState';

const f = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc } }));
const i18n = createInstance();
await i18n.init({ lng: 'en', fallbackLng: 'en', ns: ['courses'], defaultNS: 'courses', resources: { en: { courses: en } }, interpolation: { escapeValue: false } });

/** One superset row: each RPC's parser reads only its own fields. */
const row = (pos: number) => ({
  pos, is_tie: false, user_id: `u${pos}`, display_name: `Member ${pos}`, profile_photo_url: null, whs_score_id: `s${pos}`,
  play_date: '2026-10-18', comp_date: '2026-10-11', course_id: 'west', course_name: 'West', rounds: 8, members: 8,
  gross_score: 75, course_par: 72, net_score: 69, course_handicap: 6, is_competition: null, prior_n: 12, avg_topar: 6,
  best_topar: 0, last_better: null, delta: -3, stableford_points: 36, delta_index: null, birdies: 2, holes_in_one: null,
  albatrosses: null, eagles: null, clean_card: null, beat_par: null, sub_80: null, hcp_at_time: null, sort_value: 0,
  total_count: 3, pool_rounds: 3, pool_courses: 1, pool_members: 3,
});
const ok = (n: number) => Promise.resolve({ data: Array.from({ length: n }, (_, i) => row(i + 1)), error: null });
const never = () => new Promise(() => {});

type Kind = 'standout' | 'just' | 'comps';
const MARK: Record<Kind, string> = { standout: '[data-standout-section]', just: '[data-just-played-section]', comps: '[data-competitions-section]' };
function mount(kind: Kind) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const el = (scope: 'everyone' | 'circle') => {
    const filters = { ...DEFAULT_FILTERS, scope } as never;
    const body = kind === 'standout' ? <StandoutRounds viewerId="v" filters={filters} enabled onRowPress={() => {}} />
      : kind === 'just' ? <JustPlayed viewerId="v" filters={filters} enabled onRowPress={() => {}} />
      : <CompetitionBoards viewerId="v" scope={scope as never} enabled onRowPress={() => {}} />;
    return <MemoryRouter><QueryClientProvider client={client}><I18nextProvider i18n={i18n}>{body}</I18nextProvider></QueryClientProvider></MemoryRouter>;
  };
  const r = render(el('everyone'));
  return { ...r, toCircle: () => r.rerender(el('circle')) };
}

beforeEach(() => { f.rpc.mockReset(); });

describe.each(['standout', 'just', 'comps'] as const)('CB28 held frame: %s', (kind) => {
  it('a filter change while rows are showing does not unmount the section', async () => {
    f.rpc.mockImplementation(() => ok(3));
    const view = mount(kind);
    await waitFor(() => expect(view.container.querySelector(MARK[kind])).not.toBeNull());
    const node = view.container.querySelector(MARK[kind]);
    f.rpc.mockImplementation(never);
    view.toCircle();
    expect(view.container.querySelector(MARK[kind])).toBe(node);
    expect(view.container.querySelectorAll('[data-held-row]').length).toBeGreaterThan(0);
  });
  it('a first load with no data renders nothing', async () => {
    f.rpc.mockImplementation(() => ok(0));
    const view = mount(kind);
    await waitFor(() => expect(f.rpc).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(view.container.querySelector(MARK[kind])).toBeNull();
  });
});

describe('CB28 held frame: leaderboards', () => {
  const populated = (board: 'net' | 'birdies' = 'net') => makeBoardState({ board, page: {
    data: { rows: [row(1), row(2)], total: 2, pool: { rounds: 2, courses: 1, members: 2 } }, isSuccess: true, isPending: false, isFetching: false,
  } as never });
  const draw = (state: ReturnType<typeof makeBoardState>) => <MemoryRouter><I18nextProvider i18n={i18n}>
    <LeaderboardsSection state={state} viewerId="v" onRowPress={vi.fn()} onSeeAll={vi.fn()} /></I18nextProvider></MemoryRouter>;
  it('a tile change while rows are showing keeps the section and tile strip mounted, selection immediate', () => {
    const view = render(draw(populated()));
    const strip = view.container.querySelector('[data-leaderboard-tiles]');
    const pending = makeBoardState({ board: 'birdies', page: { data: undefined, isSuccess: false, isPending: true, isFetching: true } as never });
    view.rerender(draw(pending));
    expect(view.container.querySelector('[data-leaderboard-tiles]')).toBe(strip);
    expect(view.container.querySelector('[data-leaderboard-board="birdies"]')?.getAttribute('aria-checked')).toBe('true');
    expect(view.container.querySelectorAll('[data-held-row]')).toHaveLength(2);
    expect(view.container.textContent).not.toContain('Member 1');
  });
  it('a first load with no data renders nothing', () => {
    const view = render(draw(makeBoardState({ board: 'net', page: { data: undefined, isSuccess: false, isPending: true, isFetching: true } as never })));
    expect(view.container.querySelector('[data-leaderboards-section]')).toBeNull();
  });
});
