import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

/**
 * BRIEF_BAND_TILES_LADDER — the top-three chip becomes ONE ladder.
 *
 * The component owns its own data hooks, so the hooks are stubbed and the REAL
 * chip markup is exercised. That is the point: §5's nesting risk (a runner-up
 * tap bubbling into the chip's own role="button" handler) can only be TESTED,
 * not reasoned about.
 */

const rows: CircleRoundRow[] = [];

vi.mock('@/components/explore-tab-new/courseled/hooks/useGolfThisWeek', async () => {
  const actual = await vi.importActual<
    typeof import('@/components/explore-tab-new/courseled/hooks/useGolfThisWeek')
  >('@/components/explore-tab-new/courseled/hooks/useGolfThisWeek');
  return {
    ...actual,
    useGolfThisWeek: () => ({ data: rows, isPending: false }),
    usePlayedCourseIds: () => ({ ids: [] as string[] }),
    useWeekScopeCourses: () => ({ ready: true, courseIds: null }),
    useWeekCounts: () => ({ rounds: rows.length, courses: 1 }),
  };
});
vi.mock('@/components/explore-tab-new/courseled/hooks/useCourseCardMeta', () => ({
  useCourseCardMeta: () => ({ data: new Map() }),
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes', () => ({
  useRoundHoleShapes: () => null,
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useFollowingIdSet', () => ({
  useFollowingIdSet: () => ({ data: new Set<string>() }),
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useWeekRegionCounts', () => ({
  useWeekRegionCounts: () => ({
    matches: () => true,
    groups: [],
    list: [],
    total: rows.length,
  }),
}));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutate: () => {} }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ actor: null }) }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ setQueriesData: () => {} }) }));

// eslint-disable-next-line import/first
import { GolfThisWeek } from '@/components/explore-tab-new/courseled/GolfThisWeek';

function row(over: Partial<CircleRoundRow> & { round_id: string }): CircleRoundRow {
  return {
    round_id: over.round_id,
    score_id: over.round_id,
    user_id: 'u1',
    display_name: 'Player One',
    profile_photo_url: null,
    is_self: false,
    play_date: '2026-08-20',
    course_id: 'c1',
    course_name: 'Royal Test',
    course_par: 72,
    gross: 80,
    stableford_points: null,
    birdies: null,
    delta_index: null,
    ...over,
  } as unknown as CircleRoundRow;
}

function chipFor(container: HTMLElement, label: RegExp) {
  /* The chip's radius is no longer a literal 14 — it derives from CARD_RADIUS
     (MICRO_BRIEF_DISCOVER_RADIUS_8), so the helper identifies a chip by the fact
     that it CARRIES a radius and an eyebrow, not by a hard-coded value. */
  const chips = [...container.querySelectorAll('div[role="button"]')].filter(
    (el) => !!(el as HTMLElement).style.borderRadius,
  ) as HTMLElement[];
  const hit = chips.find((c) => label.test(c.textContent ?? ''));
  if (!hit) throw new Error(`no chip matching ${label}`);
  return hit;
}

/** The podium has one leader hero and up to two compact chaser rows. */
function podiumRows(chip: HTMLElement) {
  return [...chip.querySelectorAll('[data-podium-row]')] as HTMLElement[];
}

describe('BRIEF_BAND_TILES_PODIUM', () => {
  beforeEach(() => {
    rows.length = 0;
  });

  it('renders one unnumbered leader and two ranked chasers', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 74 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', gross: 76 }),
      row({ round_id: 'c', user_id: 'c', display_name: 'Charlie', gross: 78 }),
      row({ round_id: 'd', user_id: 'd', display_name: 'Delta', gross: 79 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const chip = chipFor(container, /BEST THIS WEEK/i);
    const podium = podiumRows(chip);
    expect(podium).toHaveLength(3);
    expect(podium[0].dataset.podiumRow).toBe('leader');
    expect(podium[0].textContent).toMatch(/^74\+2Alpha$/);
    expect(podium[1].dataset.podiumRow).toBe('chaser');
    expect(podium[1].textContent).toMatch(/^2B?Bravo76\+2$/);
    expect(podium[2].textContent).toMatch(/^3C?Charlie78\+4$/);
    expect(chip.textContent).not.toMatch(/Delta/);
  });

  it('uses the podium leader and chaser grid geometries', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 74 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', gross: 76 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const podium = podiumRows(chipFor(container, /BEST THIS WEEK/i));
    expect(podium[0].style.gridTemplateColumns).toBe('40px minmax(0, 1fr)');
    expect(podium[1].style.gridTemplateColumns).toBe('12px 16px minmax(0, 1fr) auto auto');
  });

  it('states Stableford in the eyebrow and expresses the leader margin in points', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', stableford_points: 41 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', stableford_points: 38 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const chip = chipFor(container, /stableford/i);
    expect(chip.textContent).toMatch(/Best Stableford points/i);
    expect(chip.textContent).toMatch(/3 points clear/i);
    for (const r of podiumRows(chip)) expect(r.textContent).not.toMatch(/points/i);
  });

  it('keeps each gross paired with its to-par comparison in the podium', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 70 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', gross: 72 }),
      row({ round_id: 'c', user_id: 'c', display_name: 'Charlie', gross: 76 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const podium = podiumRows(chipFor(container, /BEST THIS WEEK/i));
    expect(podium[0].textContent).toMatch(/^70[−-]2Alpha$/);
    expect(podium[1].textContent).toMatch(/^2B?Bravo72\+2$/);
    expect(podium[2].textContent).toMatch(/^3C?Charlie76\+6$/);
  });

  it('gives the leader a 34px figure and keeps chaser figures compact', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 74 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', gross: 76 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const podium = podiumRows(chipFor(container, /BEST THIS WEEK/i));
    const leaderFigure = [...podium[0].querySelectorAll('span')].find((el) => el.textContent === '74') as HTMLElement;
    const chaserFigure = [...podium[1].querySelectorAll('span')].find((el) => el.textContent === '76') as HTMLElement;
    expect([leaderFigure.style.fontSize, leaderFigure.style.fontWeight]).toEqual(['34px', '700']);
    expect([chaserFigure.style.fontSize, chaserFigure.style.fontWeight]).toEqual(['11px', '700']);
  });

  it('applies the floor to every place and shows NOTHING for a missing one (§4)', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', stableford_points: 41 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', stableford_points: 35 }),
      row({ round_id: 'c', user_id: 'c', display_name: 'Charlie', birdies: 5 }),
      row({ round_id: 'd', user_id: 'd', display_name: 'Delta', birdies: 2 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const stab = chipFor(container, /stableford/i);
    expect(podiumRows(stab)).toHaveLength(1);
    expect(stab.textContent).not.toMatch(/Bravo|\u2014/);
    expect(podiumRows(chipFor(container, /Most birdies/i))).toHaveLength(1);
  });

  it('never shows a member twice in one tile, and keeps their best (§4)', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 74 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', gross: 75 }),
      row({ round_id: 'c', user_id: 'b', display_name: 'Bravo', gross: 76 }),
      row({ round_id: 'd', user_id: 'c', display_name: 'Charlie', gross: 90 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const chip = chipFor(container, /BEST THIS WEEK/i);
    expect((chip.textContent!.match(/Bravo/g) ?? [])).toHaveLength(1);
    expect(podiumRows(chip)[1].textContent).toMatch(/Bravo/);
  });

  it('lets one member hold first place in several tiles (§4)', () => {
    rows.push(
      row({
        round_id: 'a',
        user_id: 'a',
        display_name: 'Alpha',
        gross: 68,
        stableford_points: 42,
        birdies: 6,
      }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', gross: 80 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    for (const label of [/BEST THIS WEEK/i, /stableford/i, /Most birdies/i]) {
      expect(chipFor(container, label).textContent).toMatch(/Alpha/);
    }
  });

  it('opens EXACTLY ONE scorecard per tap, on every row (c, d, §3)', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 74 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', gross: 76 }),
      row({ round_id: 'c', user_id: 'c', display_name: 'Charlie', gross: 78 }),
    );
    const onCardPress = vi.fn();
    const { container } = render(
      <GolfThisWeek userId="me" onCardPress={onCardPress} onSeeAll={() => {}} />,
    );
    const podium = podiumRows(chipFor(container, /BEST THIS WEEK/i));
    const expected = ['a', 'b', 'c'];
    podium.forEach((rowEl, i) => {
      onCardPress.mockClear();
      fireEvent.click(rowEl);
      expect(onCardPress).toHaveBeenCalledTimes(1);
      expect(onCardPress.mock.calls[0][0].round_id).toBe(expected[i]);

      onCardPress.mockClear();
      fireEvent.keyDown(rowEl, { key: 'Enter' });
      expect(onCardPress).toHaveBeenCalledTimes(1);
      expect(onCardPress.mock.calls[0][0].round_id).toBe(expected[i]);
    });
    expect(podium[0].dataset.podiumRow).toBe('leader');
    expect(podium.slice(1).every((rowEl) => rowEl.dataset.podiumRow === 'chaser')).toBe(true);
  });

  it('keeps the widened chip and distinct leader/chaser type roles', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 74 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Notascratchgolfer', gross: 76 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const chip = chipFor(container, /BEST THIS WEEK/i);
    expect(chip.style.minWidth).toBe('230px');
    expect(chip.style.flex).toBe('1 0 230px');
    const podium = podiumRows(chip);
    const leaderName = [...podium[0].querySelectorAll('span')].find((el) => el.textContent === 'Alpha') as HTMLElement;
    const chaserName = [...podium[1].querySelectorAll('span')].find((el) => el.textContent === 'Notascratchgolfer') as HTMLElement;
    expect(leaderName.style.fontSize).toBe('12px');
    expect(chaserName.style.fontSize).toBe('11px');
    expect(chaserName.style.textOverflow).toBe('ellipsis');
  });
});
