import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';

/**
 * BRIEF_BAND_TILES_TOP_THREE — the leader chips become a top three.
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
  const chips = [...container.querySelectorAll('div[role="button"]')].filter(
    (el) => (el as HTMLElement).style.borderRadius === '14px',
  ) as HTMLElement[];
  const hit = chips.find((c) => label.test(c.textContent ?? ''));
  if (!hit) throw new Error(`no chip matching ${label}`);
  return hit;
}

function runnerRows(chip: HTMLElement) {
  return [...chip.querySelectorAll('div[role="button"]')] as HTMLElement[];
}

describe('BRIEF_BAND_TILES_TOP_THREE', () => {
  beforeEach(() => {
    rows.length = 0;
  });

  it('shows the winner in the hero and up to two runner-up rows (a, §1)', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 74 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', gross: 76 }),
      row({ round_id: 'c', user_id: 'c', display_name: 'Charlie', gross: 78 }),
      row({ round_id: 'd', user_id: 'd', display_name: 'Delta', gross: 79 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const chip = chipFor(container, /BEST THIS WEEK/i);
    expect(chip.textContent).toMatch(/Alpha/);
    const runners = runnerRows(chip);
    expect(runners).toHaveLength(2);
    expect(runners[0].textContent).toMatch(/^2B?Bravo76$/);
    expect(runners[1].textContent).toMatch(/^3C?Charlie78$/);
    expect(chip.textContent).not.toMatch(/Delta/);
  });

  it('never shows a member twice in one tile, and keeps their best (b, §2)', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 74 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', gross: 75 }),
      row({ round_id: 'c', user_id: 'b', display_name: 'Bravo', gross: 76 }),
      row({ round_id: 'd', user_id: 'c', display_name: 'Charlie', gross: 90 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const chip = chipFor(container, /BEST THIS WEEK/i);
    expect((chip.textContent!.match(/Bravo/g) ?? [])).toHaveLength(1);
    const runners = runnerRows(chip);
    expect(runners[0].textContent).toMatch(/Bravo75/);
    expect(runners[1].textContent).toMatch(/Charlie/);
  });

  it('holds the winner the tile ships today (d) and applies the floor to every place (f, §3)', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', stableford_points: 41 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', stableford_points: 35 }),
      row({ round_id: 'c', user_id: 'c', display_name: 'Charlie', birdies: 5 }),
      row({ round_id: 'd', user_id: 'd', display_name: 'Delta', birdies: 2 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const stab = chipFor(container, /stableford/i);
    expect(stab.textContent).toMatch(/41/);
    expect(stab.textContent).toMatch(/Alpha/);
    /* Below the floor is ABSENT — no row, no dash, no placeholder. */
    expect(runnerRows(stab)).toHaveLength(0);
    expect(stab.textContent).not.toMatch(/Bravo|—|-{1}/);

    const birdies = chipFor(container, /Most birdies/i);
    expect(runnerRows(birdies)).toHaveLength(0);
    expect(birdies.textContent).not.toMatch(/Delta/);
  });

  it('lets one member hold first place in several tiles (c)', () => {
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

  it('opens ONLY that member on a runner-up tap — the chip does not also fire (g, §5)', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 74 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', gross: 76 }),
    );
    const onCardPress = vi.fn();
    const { container } = render(
      <GolfThisWeek userId="me" onCardPress={onCardPress} onSeeAll={() => {}} />,
    );
    const chip = chipFor(container, /BEST THIS WEEK/i);
    const runner = runnerRows(chip)[0];

    fireEvent.click(runner);
    expect(onCardPress).toHaveBeenCalledTimes(1);
    expect(onCardPress.mock.calls[0][0].round_id).toBe('b');

    onCardPress.mockClear();
    fireEvent.keyDown(runner, { key: 'Enter' });
    expect(onCardPress).toHaveBeenCalledTimes(1);
    expect(onCardPress.mock.calls[0][0].round_id).toBe('b');

    /* The hero still opens the leader. */
    onCardPress.mockClear();
    fireEvent.click(chip);
    expect(onCardPress).toHaveBeenCalledTimes(1);
    expect(onCardPress.mock.calls[0][0].round_id).toBe('a');
  });

  it('declares the widened chip (§4) and no fourth type size in a runner row', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 74 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Notascratchgolfer', gross: 76 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const chip = chipFor(container, /BEST THIS WEEK/i);
    expect(chip.style.minWidth).toBe('230px');
    expect(chip.style.flex).toBe('1 0 230px');
    /* Only the spans THIS row declares — the avatar's own initial glyph is the
       avatar component's business, not the band's type scale. */
    const sizes = [...runnerRows(chip)[0].children]
      .filter((c) => c.tagName === 'SPAN')
      .map((c) => (c as HTMLElement).style.fontSize);
    expect(sizes).toEqual(['8px', '12px', '12px']);
  });
});
