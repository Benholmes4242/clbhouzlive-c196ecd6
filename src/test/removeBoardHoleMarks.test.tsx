import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeaderboardTab } from '@/features/tourhub/leaderboard/LeaderboardTab';
import { MiniBoard } from '@/features/tourhub/tournament-v2/sections/MiniBoard';
import { AlsoWeekEvent } from '@/features/tourhub/overview/sections/AlsoWeekEvent';
import { RoundTilePlot } from '@/components/feed/roundTilePlot';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';

const f = vi.hoisted(() => ({ holes: vi.fn(), entries: [] as BoardEntry[] }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }), Trans: () => null }));
vi.mock('@/features/tourhub/hooks/useLiveTournaments', () => ({ useLiveTournaments: () => ({ data: [{ id: 'event', name: 'Event', status: 'inprogress', currentRound: 2, tourSlug: 'pga' }], isLoading: false }) }));
vi.mock('@/features/tourhub/hooks/useTourHubData', () => ({ useTourLeaderboard: () => ({ data: f.entries, isLoading: false }), useTourTeeTimesEnriched: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/leaderboard/useTournamentMeta', () => ({ useTournamentMeta: () => ({ data: { current_round: 2, status: 'inprogress' } }) }));
vi.mock('@/features/tourhub/leaderboard/useTourPlayerFollows', () => ({ useTourPlayerFollows: () => ({ ids: new Set(), toggle: vi.fn() }) }));
vi.mock('@/features/tourhub/hooks/useAIPredictions', () => ({ useAIPredictions: () => ({ data: null }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/leaderboard/useBoardHoles', () => ({ useBoardHoles: (...args: unknown[]) => { f.holes(...args); return { byPlayer: new Map() }; } }));
// Observe the real parent-to-sheet target handoff without fetching sheet data.
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: ({ open, target }: { open: boolean; target: { playerId: string } | null }) => open ? <div role="dialog" data-player-id={target?.playerId} /> : null }));

const entry: BoardEntry = { id: 'row-a', position: 1, score: -4, today: -2, today_round: 2, round_1: -2, round_2: -2, thru: 3, player: { id: 'player-a', full_name: 'Player A' } };
const mount = (node: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>);
afterEach(() => { cleanup(); f.holes.mockClear(); f.entries = []; });

describe('boards without hole marks', () => {
  it('leaderboard row tap opens ScorecardSheet for that player without an inline expand', () => {
    f.entries = [entry]; const v = mount(<LeaderboardTab />);
    fireEvent.click(screen.getByRole('button', { name: 'Player A' }));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-player-id', 'player-a');
    expect(v.container.querySelector('.tour-round-expand')).toBeNull();
  });
  it('Enter on a focused leaderboard row opens the same player sheet', () => {
    f.entries = [entry]; mount(<LeaderboardTab />);
    const row = screen.getByRole('button', { name: 'Player A' }); row.focus();
    expect(document.activeElement).toBe(row);
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toHaveAttribute('data-player-id', 'player-a');
  });
  it('Space opens the sheet and a row without player id is not tappable', () => {
    f.entries = [entry, { ...entry, id: 'team', player: null }]; const v = mount(<LeaderboardTab />);
    const inert = v.container.querySelector('[data-board-row="team"]');
    expect(inert).not.toHaveAttribute('role', 'button'); expect(inert).not.toHaveAttribute('tabindex');
    if (!inert) throw new Error('Missing inert row'); fireEvent.click(inert);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Player A' }), { key: ' ' });
    expect(screen.getByRole('dialog')).toHaveAttribute('data-player-id', 'player-a');
  });
  it('leaderboard is single-line with 12px padding, no marks/key and no board hole read', () => {
    f.entries = [entry]; const v = mount(<LeaderboardTab />);
    const row = v.container.querySelector<HTMLElement>('[data-board-row]');
    expect(row?.style.gridTemplateRows).toBe(''); expect(row?.style.rowGap).toBe('');
    expect(row?.style.paddingTop).toBe('12px'); expect(row?.style.paddingBottom).toBe('12px');
    expect(v.container.querySelector('[data-hole-marks], [data-hole-marks-key]')).toBeNull();
    expect(f.holes).not.toHaveBeenCalled();
  });
  it.each(['live', 'completed'] as const)('hero %s stays single-line when closed and opens a lazy round panel', phase => {
    const v = mount(<MiniBoard tournamentId="event" entries={[entry]} theme="heroBoard" currentRound={2} phase={phase} />);
    const row = v.container.querySelector<HTMLElement>('[data-hero-tie]')?.parentElement;
    expect(row?.style.gridTemplateRows).toBe(''); expect(row?.style.rowGap).toBe('');
    expect(row?.style.paddingTop).toBe('4px');
    expect(v.container.querySelector('[data-hole-marks], [data-hole-marks-key], [data-avatar-fallback]')).toBeNull();
    expect(f.holes).not.toHaveBeenCalled();
    if (!row) throw new Error('Missing hero row'); fireEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(v.container.querySelector('[data-hero-round-panel]')).toHaveAttribute('data-player-id', 'player-a');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('pre-tee hero does not fall back to previous-round hole marks or reads', () => {
    const v = mount(<MiniBoard tournamentId="event" entries={[{ ...entry, today: null, round_2: null }]} theme="heroBoard" currentRound={2} />);
    expect(v.container.querySelector('[data-hole-marks], [data-hole-marks-key]')).toBeNull();
    expect(f.holes).not.toHaveBeenCalled();
  });
  it('Also this week rows still render HoleMarks', () => {
    const slide = { type: 'live', tournament: { id: 'event', name: 'Event', currentRound: 2, tourSlug: 'pga', startDate: '2026-11-05', endDate: '2026-11-08' } } as HeroSlide;
    const v = mount(<AlsoWeekEvent slide={slide} entries={[entry]} followed={new Set()} />);
    expect(v.container.querySelector('.also-br [data-hole-marks]')).not.toBeNull();
    expect(v.container.querySelectorAll('[data-hole-mark]')).toHaveLength(18);
  });
  it.each([18, 9])('RoundTilePlot keeps HoleMarks for %s holes', count => {
    const shape: HoleShape = { coursePar: count * 4, series: Array(count + 1).fill(0), played: count, beads: [], birdies: 0, holes: Array.from({ length: count }, (_, i) => ({ holeNo: i + 1, par: 4, strokes: 4, sheetStrokes: 4, strokeIndex: i + 1, strokesAllowed: 0 })) };
    const v = mount(<RoundTilePlot shape={shape} />);
    expect(v.container.querySelector('[data-plot-marks] [data-hole-marks]')).not.toBeNull();
    expect(v.container.querySelectorAll('[data-hole-mark]')).toHaveLength(count);
  });
});
