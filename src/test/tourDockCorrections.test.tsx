import React, { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { LeaderboardTab } from '@/features/tourhub/leaderboard/LeaderboardTab';
import { BoardTable, type BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { ScheduleTab } from '@/features/tourhub/schedule-v2/ScheduleTab';
import { currentWeekKey } from '@/features/tourhub/schedule-v2/timelineUtils';
import { TOUR_CANVAS } from '@/features/tourhub/_shared/tokens';
import { useDockedStuck } from '@/lib/useDockedStuck';

const f = vi.hoisted(() => ({
  entries: [] as BoardEntry[],
  meta: { current_round: 2, status: 'inprogress' as string | null } as Record<string, unknown>,
  live: [{ id: 'event', name: 'Event', status: 'inprogress', currentRound: 2, tourSlug: 'pga' }] as unknown[],
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }), Trans: () => null }));
vi.mock('@/features/tourhub/hooks/useLiveTournaments', () => ({ useLiveTournaments: () => ({ data: f.live, isLoading: false }) }));
vi.mock('@/features/tourhub/hooks/useTourHubData', () => ({ useTourLeaderboard: () => ({ data: f.entries, isLoading: false }), useTourTeeTimesEnriched: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: () => ({ data: f.meta }) }));
vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows', () => ({ useTourPlayerFollows: () => ({ ids: new Set(), toggle: vi.fn() }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: null }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/leaderboard/useBoardHoles', () => ({ useBoardHoles: () => ({ byPlayer: new Map() }) }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: () => null }));


vi.mock('@/lib/chromeClearance', async original => ({ ...(await original<object>()), chromeClearancePx: () => 119 }));
vi.mock('@/features/tourhub/hooks/useTourLensFromPicker', () => ({ useTourLensFromPicker: () => {} }));
vi.mock('@/features/tourhub/hooks/useTourSelection', () => ({ readStoredTour: () => null }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/features/tourhub/schedule-v2/SeasonRow', () => ({ SeasonRow: () => <div>event row</div> }));
vi.mock('@/features/tourhub/schedule-v2/useSeasonTimeline', () => ({ useSeasonTimeline: () => ({ data: timeline, isLoading: false }) }));
vi.mock('@/features/tourhub/schedule-v2/useMergedSchedule', () => ({ useMergedSchedule: () => ({ data: timeline, isLoading: false }) }));
vi.mock('@/features/tourhub/schedule-v2/useScheduleFieldPlayers', () => ({ useScheduleFieldPlayers: () => new Map() }));
vi.mock('@/features/tourhub/overview/data/useComingUpOwnRounds', () => ({ useComingUpOwnRounds: () => new Set() }));
const event = { id: 'test', name: 'Event', state: 'completed', startDate: '2026-11-09', endDate: '2026-11-12', golfCourseId: null };
const timeline = { totalEvents: 2, seasonYear: 2026, anchorEventId: null, weeks: [
  { key: currentWeekKey(), events: [event] },
  { key: '2027-01-18', events: [{ ...event, id: 'other' }] },
] };
let top = 200;
let frames: Map<number, FrameRequestCallback>;
let frameId = 0;
function flush() { act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(cb => cb(0)); }); }
function mount(node: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  top = 200; frames = new Map();
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++frameId, cb); return frameId; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ top, bottom: top + 41, height: 41, width: 390, left: 0, right: 390, x: 0, y: top, toJSON: () => ({}) }));
  f.entries = [{ id: 'row', position: 1, score: -4, thru: 3, round_1: -2, round_2: -2, player: { id: 'player', full_name: 'Player Name' } }];
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Tour dock frost corrections', () => {
  it('useDockedStuck is false below clearance and true at clearance, coalescing scroll reads', () => {
    const el = document.createElement('div');
    const hook = renderHook(() => { const ref = useRef<HTMLElement>(el); return useDockedStuck(ref); });
    expect(hook.result.current).toBe(false);
    top = 119;
    fireEvent.scroll(window); fireEvent.scroll(window);
    expect(frames.size).toBe(1);
    flush();
    expect(hook.result.current).toBe(true);
    top = 121;
    fireEvent(window, new Event('resize')); flush();
    expect(hook.result.current).toBe(false);
    hook.unmount();
    fireEvent.scroll(window);
    expect(frames.size).toBe(0);
  });

  it('Schedule renders one page-level frost, hidden at rest and visible for stuck headers', () => {
    const card = mount(<ScheduleTab />);
    const blur = card.container.querySelector('[data-dock-blur]');
    expect(card.container.querySelectorAll('[data-dock-blur]')).toHaveLength(1);
    expect(blur).toHaveStyle({ opacity: '0' });
    expect(blur?.closest('[data-week-header]')).toBeNull();
    top = 119; fireEvent.scroll(window); flush();
    expect(blur).toHaveStyle({ opacity: '1' });
    expect(card.container.querySelector('[data-week-header] [data-dock-blur]')).toBeNull();
  });

  it('week headers retain their normal backgrounds until stuck, then become transparent', () => {
    const card = mount(<ScheduleTab />);
    const headers = card.container.querySelectorAll('[data-week-header]');
    expect(headers[0]).toHaveStyle({ background: '#0E0E11' });
    expect(headers[1]).toHaveStyle({ background: TOUR_CANVAS });
    top = 119; fireEvent.scroll(window); flush();
    for (const header of headers) expect(header).toHaveStyle({ background: 'transparent' });
    top = 200; fireEvent.scroll(window); flush();
    expect(headers[0]).toHaveStyle({ background: '#0E0E11' });
    expect(headers[1]).toHaveStyle({ background: TOUR_CANVAS });
  });

  it('LeaderboardTab opts its real BoardTable into page frost and reports measured header height', () => {
    const card = mount(<LeaderboardTab />);
    const header = card.container.querySelector('[data-board-sticky-header]');
    expect(header).toHaveAttribute('data-dock-blur-enabled', 'true');
    const blur = card.container.querySelector('[data-dock-blur]');
    expect(card.container.querySelectorAll('[data-dock-blur]')).toHaveLength(1);
    expect(blur).toHaveStyle({ opacity: '0' });
    expect(header?.contains(blur)).toBe(false);
    top = 119; fireEvent.scroll(window); flush();
    expect(header).toHaveStyle({ background: 'transparent' });
    expect(blur).toHaveStyle({ opacity: '1' });
    expect(readFileSync('src/features/tourhub/_shared/DockBlur.tsx', 'utf8')).toContain('rowHeight');
  });

  it('FullBoardSheet does not opt in and default BoardTable paint remains unchanged', () => {
    const sheet = readFileSync('src/features/tourhub/tournament-v2/sections/FullBoardSheet.tsx', 'utf8');
    expect(sheet).not.toContain('dockBlur');
    top = 119;
    const card = mount(<BoardTable entries={f.entries} cutState={{ kind: 'none', cutline: null, extraCount: 0 }} />);
    const header = card.container.querySelector('[data-board-sticky-header]');
    expect(header).toHaveAttribute('data-dock-blur-enabled', 'false');
    expect(header).not.toHaveStyle({ background: 'transparent' });
    expect(card.container.querySelector('[data-dock-blur]')).toBeNull();
  });

  it('HeroImg constrains height with min(250px and CHROME_CLEARANCE without changing anchoring', () => {
    const front = readFileSync('src/features/tourhub/players-v2/front/FrontPage.tsx', 'utf8');
    expect(front).toContain('height: `min(250px, calc(420px - ${CHROME_CLEARANCE} - 52px))`');
    expect(front).toContain('right: -60, bottom: 0');
  });
});
