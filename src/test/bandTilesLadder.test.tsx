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
  const chips = [...container.querySelectorAll('div[role="button"]')].filter(
    (el) => (el as HTMLElement).style.borderRadius === '14px',
  ) as HTMLElement[];
  const hit = chips.find((c) => label.test(c.textContent ?? ''));
  if (!hit) throw new Error(`no chip matching ${label}`);
  return hit;
}

/** Every ladder row is its own role="button"; the chip is the outer one. */
function ladderRows(chip: HTMLElement) {
  return [...chip.querySelectorAll('div[role="button"]')] as HTMLElement[];
}

describe('BRIEF_BAND_TILES_LADDER', () => {
  beforeEach(() => {
    rows.length = 0;
  });

  it('is ONE ladder of three ranked rows, each with its own figure (a, b, §1)', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 74 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', gross: 76 }),
      row({ round_id: 'c', user_id: 'c', display_name: 'Charlie', gross: 78 }),
      row({ round_id: 'd', user_id: 'd', display_name: 'Delta', gross: 79 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const chip = chipFor(container, /BEST THIS WEEK/i);
    const ladder = ladderRows(chip);
    expect(ladder).toHaveLength(3);
    /* THE LEADER'S RANK IS PRESENT, NOT IMPLIED (§1). */
    expect(ladder[0].textContent).toMatch(/^174\+2A?Alpha$/);
    expect(ladder[1].textContent).toMatch(/^276\+4B?Bravo$/);
    expect(ladder[2].textContent).toMatch(/^378\+6C?Charlie$/);
    expect(chip.textContent).not.toMatch(/Delta/);
  });

  it('shares ONE MEASURED figure column across every row (a, §1, §3)', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 74 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', gross: 76 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const cols = ladderRows(chipFor(container, /BEST THIS WEEK/i)).map(
      (r) => (r.children[1] as HTMLElement).style.width,
    );
    /* MEASURED, NOT 56 (LADDER_TIGHTEN §3): "77 +6" at 12/8 is 31px, and rows
       2 and 3 no longer pay for a leader's size. */
    expect(cols).toEqual(['31px', '31px']);
  });

  it('prints the unit ONCE on the eyebrow row, and never per row (e, §2)', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', stableford_points: 41 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', stableford_points: 38 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const chip = chipFor(container, /stableford/i);
    expect((chip.textContent!.match(/points/gi) ?? [])).toHaveLength(1);
    for (const r of ladderRows(chip)) expect(r.textContent).not.toMatch(/points/i);
    /* BEST THIS WEEK is the exception: no unit on the eyebrow, a to-par per row. */
    rows.push(row({ round_id: 'c', user_id: 'c', display_name: 'Charlie', gross: 70 }));
  });

  it('colours the to-par red under par and mutes it at level or over (f, §2)', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 70 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', gross: 72 }),
      row({ round_id: 'c', user_id: 'c', display_name: 'Charlie', gross: 76 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const quals = ladderRows(chipFor(container, /BEST THIS WEEK/i)).map((r) => {
      const col = r.children[1] as HTMLElement;
      const q = col.children[1] as HTMLElement;
      return { text: q.textContent, color: q.style.color };
    });
    expect(quals[0].text).toMatch(/2/);
    expect(quals[1].text).toBe('E');
    expect(quals[2].text).toBe('+4');
    expect(quals[0].color).not.toBe(quals[1].color);
    expect(quals[1].color).toBe(quals[2].color);
  });

  it('keeps every figure at 12px and the leader BOLD not BIG (a, §1)', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 74 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Bravo', gross: 76 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const figs = ladderRows(chipFor(container, /BEST THIS WEEK/i)).map((r) => {
      const f = (r.children[1] as HTMLElement).children[0] as HTMLElement;
      return [f.style.fontSize, f.style.fontWeight];
    });
    expect(figs[0]).toEqual(['12px', '800']);
    expect(figs[1]).toEqual(['12px', '700']);
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
    expect(ladderRows(stab)).toHaveLength(1);
    expect(stab.textContent).not.toMatch(/Bravo|\u2014/);
    expect(ladderRows(chipFor(container, /Most birdies/i))).toHaveLength(1);
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
    expect(ladderRows(chip)[1].textContent).toMatch(/Bravo/);
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
    const ladder = ladderRows(chipFor(container, /BEST THIS WEEK/i));
    const expected = ['a', 'b', 'c'];
    ladder.forEach((rowEl, i) => {
      onCardPress.mockClear();
      fireEvent.click(rowEl);
      expect(onCardPress).toHaveBeenCalledTimes(1);
      expect(onCardPress.mock.calls[0][0].round_id).toBe(expected[i]);

      onCardPress.mockClear();
      fireEvent.keyDown(rowEl, { key: 'Enter' });
      expect(onCardPress).toHaveBeenCalledTimes(1);
      expect(onCardPress.mock.calls[0][0].round_id).toBe(expected[i]);
    });
    /* Every row shows a chevron (§3). */
    for (const rowEl of ladder) expect(rowEl.querySelector('svg')).toBeTruthy();
  });

  it('keeps the widened chip and the type scale (§4, §5)', () => {
    rows.push(
      row({ round_id: 'a', user_id: 'a', display_name: 'Alpha', gross: 74 }),
      row({ round_id: 'b', user_id: 'b', display_name: 'Notascratchgolfer', gross: 76 }),
    );
    const { container } = render(<GolfThisWeek userId="me" onCardPress={() => {}} onSeeAll={() => {}} />);
    const chip = chipFor(container, /BEST THIS WEEK/i);
    expect(chip.style.minWidth).toBe('230px');
    expect(chip.style.flex).toBe('1 0 230px');
    /* TWO SIZES EXACTLY — 8 (the to-par, §2) and 12. Nothing is big any more.
       The avatar's own initial glyph is the avatar component's business, not the
       band's scale. */
    const sizes = new Set<string>();
    for (const rowEl of ladderRows(chip)) {
      sizes.add((rowEl.children[0] as HTMLElement).style.fontSize);
      for (const c of (rowEl.children[1] as HTMLElement).children) {
        sizes.add((c as HTMLElement).style.fontSize);
      }
      sizes.add((rowEl.querySelector('span[style*="ellipsis"]') as HTMLElement).style.fontSize);
    }
    expect([...sizes].sort()).toEqual(['12px', '8px']);
  });
});
