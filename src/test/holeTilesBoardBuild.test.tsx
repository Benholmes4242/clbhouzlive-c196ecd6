import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HoleTiles, HOLE_TILE_TONES } from '@/features/tourhub/leaderboard/BoardRound';
import { BoardTable, type BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
import { PlayerAvatar } from '@/features/tourhub/components/PlayerAvatar';
import { PlayerInitialAvatar } from '@/features/tourhub/_shared/PlayerInitialAvatar';
import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
import { FeaturedRoundCard } from '@/features/explore-magazine/FeaturedRoundCard';
import type { StreamItem } from '@/features/explore-magazine/streamItem';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }) }));
afterEach(cleanup);

const holes = (diff: (number | null)[]) => diff.map((d) => (d == null ? null : { strokes: 4 + d, par: 4 }));
const entry = (id: string, position = 1): BoardEntry => ({ id, position, score: -4, thru: 3, round_1: -2, round_2: -2, player: { id, full_name: `Player ${id}` } });
const cut = { kind: 'none' as const, cutline: null, extraCount: 0 };

describe('shared numbered hole tiles', () => {
  it('eighteen holes render eighteen numbered tiles with one nine gap', () => {
    const v = render(<HoleTiles holes={holes(Array(18).fill(0))} />);
    const tiles = v.container.querySelectorAll('[data-hole-tile]');
    expect(tiles).toHaveLength(18);
    expect(tiles[0].textContent).toBe('4');
    expect(v.container.querySelectorAll('.tour-hole-tiles-gap')).toHaveLength(1);
  });
  it('nine holes render nine tiles with no gap', () => {
    const v = render(<HoleTiles holes={holes(Array(9).fill(0))} />);
    expect(v.container.querySelectorAll('[data-hole-tile]')).toHaveLength(9);
    expect(v.container.querySelectorAll('.tour-hole-tiles-gap')).toHaveLength(0);
  });
  it('an unplayed hole is an empty tile with no number', () => {
    const v = render(<HoleTiles holes={holes([0, null, 0])} />);
    const tiles = v.container.querySelectorAll('[data-hole-tile]');
    expect(tiles[1].getAttribute('data-grade')).toBe('empty');
    expect(tiles[1].textContent).toBe('');
  });
  it('grades carry the signed-off tile colours', () => {
    const v = render(<HoleTiles holes={holes([-2, -1, 0, 1, 2])} />);
    const bg = (i: number) => (v.container.querySelectorAll('[data-hole-tile]')[i] as HTMLElement).style.background;
    expect(bg(0)).toBe('rgb(255, 210, 0)');
    expect(bg(1)).toBe('rgb(226, 75, 63)');
    expect(bg(2)).toBe('rgba(255, 255, 255, 0.08)');
    expect(bg(3)).toBe('rgba(166, 194, 240, 0.85)');
    expect(bg(4)).toBe('rgb(122, 166, 236)');
    expect(HOLE_TILE_TONES.eagle.fg).toBe('#0A0A0C');
  });
});

describe('leaderboard board rows', () => {
  const board = (entries: BoardEntry[], extra: Partial<Parameters<typeof BoardTable>[0]> = {}) =>
    render(<MemoryRouter><BoardTable entries={entries} cutState={cut} currentRound={2} {...extra} /></MemoryRouter>);
  it('name starts 8px after the mark/position cluster and POS is left aligned', () => {
    const v = board([entry('a')]);
    // B2: the cluster carries padding-right 8px (.tour-board-cluster), so the
    // name starts 8px after each row's own mark/position pair — no shared column.
    const cluster = v.container.querySelector('.tour-board-cluster');
    expect(cluster).not.toBeNull();
    expect(cluster?.nextElementSibling?.classList.contains('tour-board-player')).toBe(true);
    const head = v.container.querySelector<HTMLElement>('[data-board-head] span');
    expect(head?.style.textAlign).toBe('left');
  });
  it('settled rows keep full opacity and no tie bracket renders', () => {
    const v = board([{ ...entry('a'), thru: 18 }, entry('b', 2)]);
    const rows = v.container.querySelectorAll<HTMLElement>('[data-board-row]');
    expect(rows[0].style.opacity).toBe('1');
    expect(v.container.querySelector('[data-tie-bracket]')).toBeNull();
  });
  it('the five-item key renders under the board', () => {
    const v = board([entry('a')]);
    const key = v.container.querySelector('[data-board-key]');
    expect(key).not.toBeNull();
    expect(key?.querySelectorAll('[data-board-key-item]')).toHaveLength(5);
  });
});

describe('no rings on tour player avatars', () => {
  it('PlayerAvatar draws no ring by default', () => {
    const v = render(<PlayerAvatar playerId="p1" playerName="Rory McIlroy" size={40} />);
    expect(v.container.querySelector('[data-avatar-ring-gradient]')).toBeNull();
    const el = v.container.querySelector<HTMLElement>('[data-avatar-fallback]')?.parentElement;
    expect(el?.style.border === '' || el?.style.border === 'none').toBe(true);
  });
  it('the amber pick ring still passes through as a gradient', () => {
    const v = render(<PlayerAvatar playerId="p1" playerName="Rory McIlroy" size={40} ringGradient="linear-gradient(135deg,#F7931E,#FFD200)" />);
    expect(v.container.querySelector('[data-avatar-ring-gradient]')).not.toBeNull();
  });
  it('PlayerInitialAvatar defaults to no ring', () => {
    const v = render(<PlayerInitialAvatar name="Rory McIlroy" size={40} />);
    expect(v.container.querySelector('[data-avatar-ring-gradient]')).toBeNull();
  });
});

describe('competition mark on round cards', () => {
  const item = { id: 'round:c', kind: 'round', ring: null, lane: 'news', score: 0, consequence: null, subject: { course_id: null, course_name: 'Sample', region: null, sub_country: null, image_url: null, pending: false }, who: { user_id: 'p', display_name: 'Pat', photo_url: null, is_viewer: false }, facts: { score_id: 'c', course_handicap: 18, gross: 90, net: 72, course_par: 72 }, payload: {}, seen: false } as StreamItem;
  it('ExploreCard shows COMP only on explicit true', () => {
    const on = render(<ExploreCard item={item} size="std" isCompetition />);
    expect(on.container.querySelector('[data-round-author-name]')?.parentElement?.textContent).toContain('COMP');
    cleanup();
    const off = render(<ExploreCard item={item} size="std" />);
    expect(off.container.querySelector('[data-round-author-name]')?.parentElement?.textContent).not.toContain('COMP');
  });
  it('FeaturedRoundCard shows COMP only on explicit true', () => {
    const round = { whs_score_id: 's1', user_id: 'u', display_name: 'Pat', photo_url: null, course_name: 'Sample', play_date: '2026-11-01', gross: 70, to_par: -2, vs_hcp: null, tier: 3, joint_count: 0, image_url: null } as never;
    const on = render(<MemoryRouter><FeaturedRoundCard round={round} onOpen={() => {}} isCompetition /></MemoryRouter>);
    expect(on.container.textContent).toMatch(/comp/i);
    cleanup();
    const off = render(<MemoryRouter><FeaturedRoundCard round={round} onOpen={() => {}} /></MemoryRouter>);
    expect(off.container.textContent).not.toMatch(/comp/i);
  });
});
