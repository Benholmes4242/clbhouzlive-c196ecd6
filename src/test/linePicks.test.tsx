import { describe, expect, it, vi, beforeEach } from 'vitest';
import { cleanup, fireEvent, render, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }) }));

const h = vi.hoisted(() => ({
  picks: [] as unknown[],
  result: [] as unknown[],
  callers: [] as unknown[],
  guest: false,
  rpc: vi.fn(),
  eqCalls: [] as Array<[string, unknown]>,
}));

vi.mock('@/integrations/supabase/client', () => {
  const chain = (): Record<string, unknown> => {
    const c: Record<string, unknown> = {};
    for (const m of ['select', 'order', 'limit', 'in', 'lte', 'gte']) c[m] = () => c;
    c.eq = (k: string, v: unknown) => { h.eqCalls.push([k, v]); return c; };
    c.then = (res: (v: unknown) => void) => res({ data: [], error: null });
    return c;
  };
  return { supabase: { rpc: h.rpc, from: () => chain() } };
});
vi.mock('@/features/guest/useGuestActionGate', () => ({ useGuestActionGate: () => (h.guestGate = vi.fn(() => h.guest)) }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

declare module 'vitest' { interface TestContext { _?: never } }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(h as any).guestGate = undefined;

import { LinePicksCard } from '@/features/tourhub/players-v2/picks/LinePicksCard';
import { callersList, orderByFinal, resolvePickState, memberShare, settledLine } from '@/features/tourhub/players-v2/picks/linePicksRules';
import { usePlayersRanking } from '@/features/tourhub/players-v2/data/usePlayersRanking';
import type { PageData } from '@/features/tourhub/players-v2/pageModel';
import type { PlayerView } from '@/features/tourhub/players-v2/playersModel';

const NOW = new Date('2026-11-10T12:00:00Z');
const CLOSE = '2026-11-19T12:00:00Z';

function player(rank: number): PlayerView {
  return { key: `k${rank}`, playerId: `id${rank}`, rank, name: `Player ${rank}`, rawName: `Player ${rank}`, points: 1000 - rank, wins: null, top10s: null, events: null,
    country: null, tourCode: 'pga', photoUrl: null, followed: false, moved: null, world: null, form: [], source: {} as PlayerView['source'] };
}

function pageData(raceOver: Partial<{ status: string; picks_close_at: string | null }> = {}): PageData {
  return {
    tour: 'pga', isPga: true, title: 'FedEx Cup', players: Array.from({ length: 120 }, (_, i) => player(i + 1)),
    race: { title: 'FedEx Cup', status: 'live', phase_label: null, phase_start: '2026-09-14', closes_on: '2026-11-22', season_year: 2026, tour_code: 'pga', updated_at: '', picks_close_at: CLOSE, ...raceOver } as PageData['race'],
    stakes: [], events: [{ id: 'e', name: 'RSM Classic', startDate: '2026-11-19', endDate: '2026-11-22', finished: false }],
    scorecard: undefined, form: [], live: {}, updatedAt: null,
  };
}

const stake = (settled_at: string | null = null) => ({ after_position: 100, explainer: null, featured: true, foot: null, kicker: null, line_label: 'The 100 line', pill_label: null, side: null, sort: 1, picks: true, picks_title: 'WHO KEEPS THEIR CARD?', settled_at });

const pick = (rank: number, pickers: number, mine = false, extra: Record<string, unknown> = {}) => ({ player_key: `k${rank}`, player_name: `Player ${rank}`, pickers, total_pickers: 312, mine, position_at_pick: rank, result: null, final_position: null, ...extra });

function mount(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  cleanup();
  h.guest = false;
  h.eqCalls = [];
  h.picks = [pick(98, 221), pick(99, 200), pick(100, 162), pick(101, 147), pick(102, 118), pick(103, 90)];
  h.result = [{ total_pickers: 312, all_correct: 41, viewer_picks: 0, viewer_correct: 0, settled: false }];
  h.callers = [];
  h.rpc.mockReset();
  h.rpc.mockImplementation(async (fn: string) => {
    if (fn === 'get_line_picks') return { data: h.picks, error: null };
    if (fn === 'get_line_pick_result') return { data: h.result, error: null };
    if (fn === 'get_line_pick_callers') return { data: h.callers, error: null };
    if (fn === 'set_line_pick') return { data: 1, error: null };
    return { data: null, error: null };
  });
});

const rpcCalls = (fn: string) => h.rpc.mock.calls.filter((c) => c[0] === fn);

describe('state resolution', () => {
  const race = (status: string, picks_close_at: string | null) => ({ status, picks_close_at });
  it('open while live and before the close', () => expect(resolvePickState(race('live', CLOSE), { picks: true, settled_at: null }, NOW)).toBe('open'));
  it('closed at or after the close with no settlement', () => expect(resolvePickState(race('live', CLOSE), { picks: true, settled_at: null }, new Date(CLOSE))).toBe('closed'));
  it('settled once settled_at is set', () => expect(resolvePickState(race('final', CLOSE), { picks: true, settled_at: '2026-11-23T06:00:00Z' }, NOW)).toBe('settled'));
  it('hidden with no picks_close_at', () => expect(resolvePickState(race('live', null), { picks: true, settled_at: null }, NOW)).toBe('hidden'));
  it('hidden when the race is final and unsettled', () => expect(resolvePickState(race('final', CLOSE), { picks: true, settled_at: null }, new Date('2026-12-01'))).toBe('hidden'));
});

describe('Open state', () => {
  it('six rows L−2…L+3 with THE LINE after L', async () => {
    const { container } = mount(<LinePicksCard stake={stake()} data={pageData()} now={NOW} />);
    const rows = container.querySelector('[data-pick-rows]')!;
    expect([...rows.querySelectorAll('[data-pick-row]')].map((r) => r.getAttribute('data-pick-row'))).toEqual(['98', '99', '100', '101', '102', '103']);
    const kids = [...rows.querySelectorAll('[data-pick-row], [data-drawn-line]')];
    expect(kids[3].hasAttribute('data-drawn-line')).toBe(true);
    expect(container.querySelector('[data-picks-state]')!.getAttribute('data-picks-state')).toBe('open');
  });

  it('shares are rounded from pickers / total', async () => {
    const { container } = mount(<LinePicksCard stake={stake()} data={pageData()} now={NOW} />);
    await waitFor(() => expect(container.querySelector('[data-pick-row="98"] [data-share]')!.getAttribute('data-share')).toBe('71'));
    expect(container.querySelector('[data-pick-row="103"] [data-share]')!.getAttribute('data-share')).toBe(String(Math.round((90 / 312) * 100)));
    expect(memberShare(0, 0)).toBe(0);
  });

  it('toggling calls set_line_pick with the key/position and flips the button', async () => {
    const { container } = mount(<LinePicksCard stake={stake()} data={pageData()} now={NOW} />);
    await waitFor(() => expect(rpcCalls('get_line_picks').length).toBe(1));
    const btn = () => container.querySelector('[data-pick-row="101"] [data-pick-button]')!;
    expect(btn().getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(btn());
    await waitFor(() => expect(rpcCalls('set_line_pick').length).toBe(1));
    expect(rpcCalls('set_line_pick')[0][1]).toMatchObject({ p_tour: 'pga', p_year: 2026, p_after: 100, p_player_key: 'k101', p_player_id: 'id101', p_position: 101, p_on: true });
    await waitFor(() => expect(btn().getAttribute('aria-pressed')).toBe('true'));
  });

  it('a fourth pick is blocked', async () => {
    h.picks = [pick(98, 1, true), pick(99, 1, true), pick(100, 1, true), pick(101, 1), pick(102, 1), pick(103, 1)];
    const { container } = mount(<LinePicksCard stake={stake()} data={pageData()} now={NOW} />);
    await waitFor(() => expect(container.querySelector('[data-pick-row="98"] [data-pick-button]')!.getAttribute('aria-pressed')).toBe('true'));
    const free = container.querySelector('[data-pick-row="102"] [data-pick-button]') as HTMLElement;
    expect(free.style.opacity).toBe('0.4');
    fireEvent.click(free);
    await new Promise((r) => setTimeout(r, 20));
    expect(rpcCalls('set_line_pick')).toHaveLength(0);
  });

  it('guests get the gate and no RPC', async () => {
    h.guest = true;
    const { container } = mount(<LinePicksCard stake={stake()} data={pageData()} now={NOW} />);
    await waitFor(() => expect(rpcCalls('get_line_picks').length).toBe(1));
    fireEvent.click(container.querySelector('[data-pick-row="100"] [data-pick-button]')!);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((h as any).guestGate).toHaveBeenCalledWith('pick');
    await new Promise((r) => setTimeout(r, 20));
    expect(rpcCalls('set_line_pick')).toHaveLength(0);
  });

  it('out-of-window picks are appended in standings order', async () => {
    h.picks = [...h.picks, pick(110, 3, true), pick(95, 4, true)];
    const { container } = mount(<LinePicksCard stake={stake()} data={pageData()} now={NOW} />);
    await waitFor(() => expect(container.querySelectorAll('[data-pick-row]').length).toBe(8));
    expect([...container.querySelectorAll('[data-pick-row]')].map((r) => r.getAttribute('data-pick-row'))).toEqual(['98', '99', '100', '101', '102', '103', '95', '110']);
  });
});

describe('Closed state', () => {
  const closedAt = new Date('2026-11-20T12:00:00Z');
  it('no buttons; Your pick chips only on the viewer picks; copy names the event and end date', async () => {
    h.picks = [pick(98, 1), pick(99, 1), pick(100, 1, true), pick(101, 1, true), pick(102, 1), pick(103, 1, true)];
    const { container } = mount(<LinePicksCard stake={stake()} data={pageData()} now={closedAt} />);
    await waitFor(() => expect(container.querySelectorAll('[data-your-pick]').length).toBe(3));
    expect(container.querySelectorAll('[data-pick-button]')).toHaveLength(0);
    expect([...container.querySelectorAll('[data-pick-row]')].filter((r) => r.querySelector('[data-your-pick]')).map((r) => r.getAttribute('data-pick-row'))).toEqual(['100', '101', '103']);
    expect(container.querySelector('[data-picks-line]')!.textContent).toBe('The RSM Classic is under way. Settled when it finishes on Sunday 22 Nov.');
    expect(container.querySelector('[data-card-foot]')!.textContent).toBe('312 members picked. You picked 3.');
  });
});

describe('Settled state', () => {
  const callers = (n: number, viewerRank?: number) => [
    ...Array.from({ length: n }, (_, i) => ({ user_id: `u${i}`, username: `user${i}`, display_name: `User ${i}`, profile_photo_url: '', rank: i + 1, correct: 3, picks: 3, last_picked_at: '2026-11-03T10:00:00Z', is_viewer: false })),
    ...(viewerRank ? [{ user_id: 'me', username: 'me', display_name: 'Me', profile_photo_url: '', rank: viewerRank, correct: 2, picks: 3, last_picked_at: '2026-11-02T10:00:00Z', is_viewer: true }] : []),
  ];

  it('verdicts ordered by final position, KEPT kicker, viewer caller row after the top five', async () => {
    h.picks = [pick(100, 1, true, { final_position: 104, result: 'missed' }), pick(101, 1, true, { final_position: 97, result: 'kept' }), pick(103, 1, true, { final_position: 99, result: 'kept' })];
    h.result = [{ total_pickers: 312, all_correct: 41, viewer_picks: 3, viewer_correct: 2, settled: true }];
    h.callers = callers(5, 58);
    const { container } = mount(<LinePicksCard stake={stake('2026-11-23T06:00:00Z')} data={pageData({ status: 'final' })} now={NOW} />);
    await waitFor(() => expect(container.querySelectorAll('[data-caller-row]').length).toBe(6));
    expect(container.querySelector('[data-picks-kicker]')!.textContent).toBe('WHO KEPT THEIR CARD?');
    expect([...container.querySelectorAll('[data-verdict-row]')].map((r) => [r.getAttribute('data-verdict-row'), r.getAttribute('data-verdict')])).toEqual([['k101', 'kept'], ['k103', 'kept'], ['k100', 'missed']]);
    const rows = [...container.querySelectorAll('[data-caller-row]')];
    expect(rows[5].hasAttribute('data-caller-viewer')).toBe(true);
    expect(rows[5].getAttribute('data-caller-row')).toBe('58');
  });

  it('summary sentence for a picker, a non-picker and signed-out', () => {
    const text = (r: Parameters<typeof settledLine>[0]) => settledLine(r).map((x) => x.text).join('');
    expect(text({ viewer_picks: 3, viewer_correct: 2, all_correct: 41, total_pickers: 312 })).toBe('You called 2 of 3. 41 of 312 members called all three.');
    expect(text({ viewer_picks: 0, viewer_correct: 0, all_correct: 41, total_pickers: 312 })).toBe('41 of 312 members called all three.');
    expect(text({ viewer_picks: undefined as unknown as number, viewer_correct: 0, all_correct: 41, total_pickers: 312 })).toBe('41 of 312 members called all three.');
  });

  it('helpers: final order puts no-final last; callers keep a top-five viewer in place', () => {
    expect(orderByFinal([{ final_position: null }, { final_position: 3 }, { final_position: 1 }]).map((r) => r.final_position)).toEqual([1, 3, null]);
    const list = callersList([{ rank: 1, is_viewer: false }, { rank: 2, is_viewer: true }, { rank: 3, is_viewer: false }]);
    expect(list.map((r) => r.rank)).toEqual([1, 2, 3]);
  });
});

describe('usePlayersRanking season', () => {
  it('reads the race season, not currentSeasonYear(), and does not walk back', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => usePlayersRanking('euro', 2026), { wrapper });
    await waitFor(() => expect(result.current.isFetched).toBe(true));
    const years = h.eqCalls.filter(([k]) => k === 'season_year').map(([, v]) => v);
    expect(years).toEqual([2026]);
  });

  it('waits while the race is pending', () => {
    const qc = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    renderHook(() => usePlayersRanking('euro', undefined), { wrapper });
    expect(h.eqCalls).toHaveLength(0);
  });
});
