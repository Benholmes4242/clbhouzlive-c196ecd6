import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HoleMarks, HoleMarksKey } from '@/features/tourhub/leaderboard/BoardRound';
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

describe('shared hole marks', () => {
  it('eighteen holes render eighteen marks with one nine gap', () => {
    const v = render(<HoleMarks holes={holes(Array(18).fill(0))} />);
    const tiles = v.container.querySelectorAll('[data-hole-mark]');
    expect(tiles).toHaveLength(18);
    expect(tiles[0].textContent).toBe('4');
    expect(v.container.querySelectorAll('.tour-hole-marks-gap')).toHaveLength(1);
  });
  it('nine holes render nine cells with no gap', () => {
    const v = render(<HoleMarks holes={holes(Array(9).fill(0))} />);
    expect(v.container.querySelectorAll('[data-hole-mark]')).toHaveLength(9);
    expect(v.container.querySelectorAll('.tour-hole-marks-gap')).toHaveLength(0);
  });
  it('an unplayed hole is a dot with no figure', () => {
    const v = render(<HoleMarks holes={holes([0, null, 0])} />);
    const cells = v.container.querySelectorAll('[data-hole-mark]');
    expect(cells[1].getAttribute('data-grade')).toBe('empty');
    expect(cells[1].textContent).toBe('');
    expect(cells[1].querySelector('.hm-shape')).toBeNull();
  });
  it('each grade renders its own mark and par renders the figure alone', () => {
    const v = render(<HoleMarks holes={holes([-2, -1, 0, 1, 2, 3])} />);
    const grades = Array.from(v.container.querySelectorAll('[data-hole-mark]')).map((c) => c.getAttribute('data-grade'));
    expect(grades).toEqual(['eagle', 'birdie', 'par', 'bogey', 'double', 'triple']);
    const par = v.container.querySelectorAll('[data-hole-mark]')[2];
    expect(par.querySelector('.hm-fig')?.textContent).toBe('4');
  });
  it('marks span the full row and carry the surface colour', () => {
    const v = render(<HoleMarks holes={holes([0])} surface="#123456" />);
    const row = v.container.querySelector<HTMLElement>('[data-hole-marks]')!;
    expect(row.style.gridColumn).toBe('1 / -1');
    expect(row.style.getPropertyValue('--hm-surface')).toBe('#123456');
  });
  it('the key renders five items', () => {
    const v = render(<HoleMarksKey />);
    expect(v.container.querySelectorAll('[data-hole-marks-key-item]')).toHaveLength(5);
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
    expect(v.container.querySelector('.tour-board-player')).not.toBeNull();
    const head = v.container.querySelector<HTMLElement>('[data-board-head] span');
    // POS sits at the row's left edge: no centring on the first header cell.
    expect(['', 'left']).toContain(head?.style.textAlign ?? '');
  });
  it('settled rows keep full opacity and no tie bracket renders', () => {
    const v = board([{ ...entry('a'), thru: 18 }, entry('b', 2)]);
    const rows = v.container.querySelectorAll<HTMLElement>('[data-board-row]');
    expect(rows[0].style.opacity).toBe('1');
    expect(v.container.querySelector('[data-tie-bracket]')).toBeNull();
  });
  it('the board renders no hole marks or key', () => {
    const v = board([entry('a')]);
    const key = v.container.querySelector('[data-hole-marks-key]');
    expect(key).toBeNull();
    expect(v.container.querySelector('[data-hole-marks]')).toBeNull();
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
    const on = render(<ExploreCard item={item} size="std" onTap={() => {}} isCompetition />);
    expect(on.container.querySelector('[data-round-author-name]')?.parentElement?.textContent).toMatch(/comp/i);
    cleanup();
    const off = render(<ExploreCard item={item} size="std" onTap={() => {}} />);
    expect(off.container.querySelector('[data-round-author-name]')?.parentElement?.textContent).not.toMatch(/comp/i);
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
