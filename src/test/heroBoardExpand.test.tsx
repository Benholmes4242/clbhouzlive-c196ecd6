import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MiniBoard } from '@/features/tourhub/tournament-v2/sections/MiniBoard';
import { heroDefaultRound, heroNineTotal, heroStartedRounds } from '@/features/tourhub/tournament-v2/sections/heroRoundRules';
import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import type { BoardHole } from '@/features/tourhub/leaderboard/useBoardHoles';
const f = vi.hoisted(() => ({ read: vi.fn(), empty: false, partial: false }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/tourhub/tournament-v2/data/useTeeTimesAll', () => ({ useTeeTimesAll: () => ({ data: [] }) }));
vi.mock('@/features/tourhub/leaderboard/ScorecardSheet', () => ({ ScorecardSheet: ({ open, target }: { open: boolean; target: { playerId: string } | null }) => open ? <div role="dialog" data-player-id={target?.playerId} /> : null }));
vi.mock('@/features/tourhub/leaderboard/useBoardHoles', () => ({ useBoardHoles: (...args: unknown[]) => {
  f.read(...args);
  const round = args[1] as number;
  return { isSuccess: true, byPlayer: new Map(['p0', 'p1'].map(id => [id, f.empty ? [] : Array.from({ length: f.partial ? 9 : 18 }, (_, i) => ({ player_id: id, round_number: round, hole_number: i + 1, strokes: round === 1 ? 4 : 3, par: 4, starting_hole: 1 }))])) };
} }));
const entry = (i = 0): BoardEntry => ({ id: `r${i}`, position: i + 1, score: -18, round_1: 0, round_2: -18, thru: 18, player: { id: `p${i}`, full_name: `Player ${i}` } });
const mount = (entries = [entry(), entry(1)], props: Partial<React.ComponentProps<typeof MiniBoard>> = {}) => render(<MiniBoard tournamentId="event" entries={entries} theme="heroBoard" currentRound={2} totalRounds={4} limit={10} phase="completed" {...props} />);
const row = (container: HTMLElement, index = 0) => { const el = container.querySelector<HTMLElement>(`[data-hero-board-row="r${index}"]`); if (!el) throw new Error('Missing row'); return el; };
afterEach(() => { cleanup(); f.read.mockClear(); f.empty = false; f.partial = false; });
describe('signed-off hero expansion', () => {
  it('shows ten rows and uses the full 70-player field for the shared action', () => {
    const handler = vi.fn(); const v = mount(Array.from({ length: 70 }, (_, i) => entry(i)), { onFullBoard: handler });
    expect(v.container.querySelectorAll('[data-hero-board-row]')).toHaveLength(10);
    const button = v.container.querySelector('[data-hero-full-leaderboard]'); expect(button).toHaveAttribute('data-field-size', '70');
    if (!button) throw new Error('Missing action'); fireEvent.click(button); expect(handler).toHaveBeenCalledTimes(1);
  });
  it('never invokes the holes hook with all rows closed', () => { mount(); expect(f.read).not.toHaveBeenCalled(); });
  it('toggles the panel and allows only one open row', () => {
    const v = mount(); fireEvent.click(row(v.container)); expect(row(v.container)).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(row(v.container, 1)); expect(row(v.container)).toHaveAttribute('aria-expanded', 'false'); expect(row(v.container, 1)).toHaveAttribute('aria-expanded', 'true');
    expect(v.container.querySelectorAll('[data-hero-round-panel]')).toHaveLength(1);
    fireEvent.click(row(v.container, 1)); expect(v.container.querySelector('[data-hero-round-panel]')).toBeNull();
  });
  it.each(['Enter', ' '])('%s toggles the focused row', key => { const v = mount(); fireEvent.keyDown(row(v.container), { key }); expect(row(v.container)).toHaveAttribute('aria-expanded', 'true'); fireEvent.keyDown(row(v.container), { key }); expect(row(v.container)).toHaveAttribute('aria-expanded', 'false'); });
  it('defaults to the current started round', () => { expect(heroDefaultRound(heroStartedRounds(entry(), 2), 2)).toBe(2); });
  it('defaults to the latest scored round before the current tee', () => { expect(heroDefaultRound(heroStartedRounds({ ...entry(), round_2: null, thru: null }, 2), 2)).toBe(1); });
  it('recognises a started current round with explicit today-round identity', () => { expect(heroStartedRounds({ ...entry(), round_2: null, today_round: 2, thru: 3 }, 2)).toEqual([1, 2]); });
  it('switches the selected card and disables unstarted rounds', () => {
    const v = mount(); fireEvent.click(row(v.container)); const chips = v.container.querySelectorAll('[data-round-chip]');
    expect(chips).toHaveLength(4); expect(chips[2]).toBeDisabled(); expect(chips[3]).toBeDisabled(); fireEvent.click(chips[0]);
    expect(v.container.querySelector('[data-hero-round-panel]')).toHaveAttribute('data-selected-round', '1'); expect(chips[0]).toHaveAttribute('aria-pressed', 'true');
    expect(f.read).toHaveBeenLastCalledWith('event', 1, 0, true);
  });
  it('marks the selected round cell in the row above', () => { const v = mount(); fireEvent.click(row(v.container)); expect(row(v.container).querySelector('[data-hero-round="2"]')).toHaveAttribute('data-hero-selected-score', 'true'); });
  it('shows OUT and IN only for complete nines', () => { f.partial = true; const v = mount(); fireEvent.click(row(v.container)); expect(v.container.querySelector('[data-hero-out]')?.textContent).toBe('27'); expect(v.container.querySelector('[data-hero-in]')?.textContent).toBe(''); });
  it('adds concrete complete-nine totals without treating empty holes as zero', () => { const holes = Array.from({ length: 18 }, (_, i) => ({ hole_number: i + 1, strokes: 4 })) as BoardHole[]; expect(heroNineTotal(holes, 0)).toBe(36); expect(heroNineTotal(holes, 9)).toBe(36); expect(heroNineTotal([...holes.slice(0, 8), null], 0)).toBeNull(); });
  it('opens the same player scorecard from the panel footer', () => { const v = mount(); fireEvent.click(row(v.container, 1)); const door = v.container.querySelector('[data-hero-full-scorecard]'); if (!door) throw new Error('Missing door'); fireEvent.click(door); expect(screen.getByRole('dialog')).toHaveAttribute('data-player-id', 'p1'); });
  it('keeps direct scorecard taps for a player with no started rounds', () => { const v = mount([{ ...entry(), round_1: null, round_2: null, thru: null }]); fireEvent.click(row(v.container)); expect(screen.getByRole('dialog')).toHaveAttribute('data-player-id', 'p0'); expect(f.read).not.toHaveBeenCalled(); });
  it('keeps an empty selected card enabled and renders eighteen dots', () => { f.empty = true; const v = mount(); fireEvent.click(row(v.container)); expect(v.container.querySelector('[data-round-chip="2"]')).toBeEnabled(); expect(v.container.querySelectorAll('[data-grade="empty"]')).toHaveLength(18); });
  it('keeps the empty round selected with a missing-card note instead of nine totals', () => {
    f.empty = true; const v = mount(); fireEvent.click(row(v.container));
    const chip = v.container.querySelector('[data-round-chip="2"]');
    expect(chip).toBeEnabled(); expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(v.container.querySelector('[data-hero-missing-card]')).not.toBeNull();
    expect(v.container.querySelector('[data-hero-out], [data-hero-in]')).toBeNull();
    expect(f.read.mock.calls.every(args => args[1] === 2)).toBe(true);
  });
});