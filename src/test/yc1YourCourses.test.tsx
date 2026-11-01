/**
 * YC1 — Your courses sheet: the list.
 *
 * Pure rules (shortCourseName, tiles, sorts, figure label, list date) plus
 * the sheet's header/tiles/sort/legend/collapsed-card rendering against the
 * real English courses resource. The opened card's content is YC2 and is
 * not asserted here.
 */
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import en from '../../public/locales/en/courses.json';
import { shortCourseName } from '@/lib/courses/shortCourseName';
import {
  figureLabel,
  fmtListDate,
  isEarlyData,
  pickTiles,
  qualifiesForTile,
  sortCourses,
} from '@/features/profile-sheet-v2/components/yourCoursesListRules';
import type { UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';
import YourCourseAnalyticsSheet from '@/features/profile-sheet-v2/components/YourCourseAnalyticsSheet';

const state = vi.hoisted(() => ({
  courses: [] as UserAnalyticsCourse[],
  track: vi.fn(),
}));

vi.mock('@/hooks/gam/useUserAnalyticsCourses', () => ({
  useUserAnalyticsCourses: () => ({ data: state.courses, isLoading: false, isFetched: true }),
}));
vi.mock('@/hooks/gam/useCourseSearch', () => ({
  useCourseSearch: () => ({ data: [], isFetching: false }),
}));
vi.mock('@/hooks/gam/useMyRoundsByCourse', () => ({
  useMyRoundsByCourse: () => ({ data: undefined }),
}));
vi.mock('@/utils/analyticsEvents', () => ({
  analyticsEvents: { track: state.track, trackOnHide: vi.fn() },
}));
vi.mock('@/components/ui/BottomSheet', () => ({
  BottomSheet: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
}));

const i18n = i18next.createInstance();
void i18n.init({ lng: 'en', fallbackLng: 'en', initAsync: false, resources: { en: { courses: en } } });

let seq = 0;
function course(over: Partial<UserAnalyticsCourse>): UserAnalyticsCourse {
  seq += 1;
  return {
    course_id: `c${seq}`,
    course_name: `Course ${seq}`,
    rounds_count: 12,
    last_played: '2026-10-29',
    avg_to_par: 5.2,
    hardest_hole_no: null,
    hardest_hole_avg: null,
    eagles_plus_pct: 1,
    birdies_pct: 10,
    pars_pct: 60,
    bogeys_plus_pct: 29,
    eagles_plus_count: 2,
    birdies_count: 20,
    pars_count: 120,
    bogeys_plus_count: 58,
    eagles_plus_pct_exact: 1,
    birdies_pct_exact: 10,
    pars_pct_exact: 60,
    bogeys_plus_pct_exact: 29,
    ...over,
  } as UserAnalyticsCourse;
}

function mount() {
  return render(
    <I18nextProvider i18n={i18n}>
      <YourCourseAnalyticsSheet open onClose={() => {}} onNavigate={() => {}} synced />
    </I18nextProvider>,
  );
}

beforeEach(() => {
  state.courses = [];
  state.track.mockReset();
});
afterEach(() => cleanup());

describe('shortCourseName', () => {
  it.each([
    ['Sundridge Park Golf Club (East Course)', 'Sundridge Park · East'],
    ['Sundridge Park-East Course', 'Sundridge Park · East'],
    ['West Kent Golf Club', 'West Kent'],
    ['Centurion Club Golf Club', 'Centurion Club'],
    ['The London Club (Heritage)', 'The London Club · Heritage'],
    ['Wentworth Club-West Course', 'Wentworth Club · West'],
  ])('%s → %s', (input, expected) => {
    expect(shortCourseName(input)).toBe(expected);
  });

  it('leaves a name with no suffix alone', () => {
    expect(shortCourseName('Royal Norwich')).toBe('Royal Norwich');
  });

  it('never strips the club down to nothing', () => {
    expect(shortCourseName('Golf Club')).toBe('Golf Club');
  });
});

describe('tiles rules', () => {
  it('qualifies at 10+ rounds with a known average only', () => {
    expect(qualifiesForTile(course({ rounds_count: 10 }))).toBe(true);
    expect(qualifiesForTile(course({ rounds_count: 9 }))).toBe(false);
    expect(qualifiesForTile(course({ rounds_count: 40, avg_to_par: null }))).toBe(false);
  });

  it('best is the lowest average, bites the highest', () => {
    const low = course({ course_name: 'Low', avg_to_par: 4.1, rounds_count: 11 });
    const high = course({ course_name: 'High', avg_to_par: 8.3, rounds_count: 12 });
    const mid = course({ course_name: 'Mid', avg_to_par: 6.0, rounds_count: 30 });
    const tiles = pickTiles([mid, high, low]);
    expect(tiles?.best.course_name).toBe('Low');
    expect(tiles?.bites.course_name).toBe('High');
  });

  it('breaks an average tie on more rounds', () => {
    const few = course({ course_name: 'Few', avg_to_par: 5.0, rounds_count: 10 });
    const many = course({ course_name: 'Many', avg_to_par: 5.0, rounds_count: 40 });
    expect(pickTiles([few, many])?.best.course_name).toBe('Many');
  });

  it('hides both tiles when fewer than two courses qualify', () => {
    expect(pickTiles([course({ rounds_count: 20 })])).toBeNull();
    expect(pickTiles([course({ rounds_count: 20 }), course({ rounds_count: 3 })])).toBeNull();
  });
});

describe('sort orders', () => {
  it('recent is last played first, nulls last', () => {
    const a = course({ course_name: 'A', last_played: '2026-10-29' });
    const b = course({ course_name: 'B', last_played: '2026-10-20' });
    const c = course({ course_name: 'C', last_played: null });
    expect(sortCourses([c, b, a], 'recent').map((x) => x.course_name)).toEqual(['A', 'B', 'C']);
  });

  it('most played is rounds descending, then recent', () => {
    const a = course({ course_name: 'A', rounds_count: 5, last_played: '2026-10-29' });
    const b = course({ course_name: 'B', rounds_count: 40, last_played: '2026-10-01' });
    const c = course({ course_name: 'C', rounds_count: 40, last_played: '2026-10-28' });
    expect(sortCourses([a, b, c], 'most-played').map((x) => x.course_name)).toEqual(['C', 'B', 'A']);
  });

  it('best for you puts qualified courses by average first, early-data after, nulls last', () => {
    const qualified = course({ course_name: 'Q', rounds_count: 12, avg_to_par: 6.0 });
    const earlyLow = course({ course_name: 'E', rounds_count: 2, avg_to_par: 1.0 });
    const noAvg = course({ course_name: 'N', rounds_count: 4, avg_to_par: null });
    expect(sortCourses([noAvg, earlyLow, qualified], 'best-for-you').map((x) => x.course_name)).toEqual([
      'Q',
      'E',
      'N',
    ]);
  });
});

describe('figure label and early data', () => {
  it('is "a round" at 10+, "{n} rounds" for 2-9, "one round" for 1', () => {
    expect(figureLabel(1)).toBe('one-round');
    expect(figureLabel(2)).toBe('n-rounds');
    expect(figureLabel(9)).toBe('n-rounds');
    expect(figureLabel(10)).toBe('a-round');
    expect(figureLabel(112)).toBe('a-round');
  });

  it('early data is under 10 rounds', () => {
    expect(isEarlyData(course({ rounds_count: 9 }))).toBe(true);
    expect(isEarlyData(course({ rounds_count: 10 }))).toBe(false);
  });
});

describe('list date', () => {
  const now = new Date('2026-11-01T12:00:00Z');
  it('omits the year inside this year', () => {
    expect(fmtListDate('2026-10-29T12:00:00Z', now)).toBe('29 Oct');
  });
  it('adds the year for another year', () => {
    expect(fmtListDate('2025-09-03T12:00:00Z', now)).toBe('3 Sep 2025');
  });
});

describe('sheet rendering', () => {
  it('header line carries counts and the weighted baseline', () => {
    state.courses = [
      course({ rounds_count: 10, avg_to_par: 4.0 }),
      course({ rounds_count: 20, avg_to_par: 7.0 }),
    ];
    render(
      <I18nextProvider i18n={i18n}>
        <YourCourseAnalyticsSheet open onClose={() => {}} onNavigate={() => {}} synced />
      </I18nextProvider>,
    );
    // (10*4 + 20*7) / 30 = 6.0
    expect(screen.getByText('2 courses · 30 rounds · +6.0 a round on average')).toBeTruthy();
    expect(screen.getByText('Your courses')).toBeTruthy();
    expect(screen.queryByText('Course by course')).toBeNull();
  });

  it('header line drops the average when the baseline is null', () => {
    state.courses = [course({ rounds_count: 5, avg_to_par: 4.0 })];
    mount();
    expect(screen.getByText('1 courses · 5 rounds')).toBeTruthy();
    expect(screen.queryByText(/a round on average/)).toBeNull();
  });

  it('renders both tiles and a tile tap expands that card', () => {
    state.courses = [
      course({ course_name: 'West Kent Golf Club', avg_to_par: 4.1, rounds_count: 11 }),
      course({ course_name: 'Sundridge Park Golf Club (East Course)', avg_to_par: 8.3, rounds_count: 112 }),
    ];
    mount();
    expect(screen.getByText('Where you score best')).toBeTruthy();
    expect(screen.getByText('Where it bites')).toBeTruthy();
    fireEvent.click(screen.getByText('Where you score best'));
    const cardButton = screen
      .getAllByRole('button', { name: /West Kent/ })
      .find((b) => b.hasAttribute('aria-expanded'));
    expect(cardButton?.getAttribute('aria-expanded')).toBe('true');
  });

  it('hides the tiles when fewer than two courses qualify', () => {
    state.courses = [course({ rounds_count: 20 }), course({ rounds_count: 3 })];
    mount();
    expect(screen.queryByText('Where you score best')).toBeNull();
    expect(screen.queryByText('Where it bites')).toBeNull();
  });

  it('sort chips reorder the list and track the choice', () => {
    state.courses = [
      course({ course_name: 'Alpha', rounds_count: 5, last_played: '2026-10-29' }),
      course({ course_name: 'Beta', rounds_count: 40, last_played: '2026-10-01' }),
    ];
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Most played' }));
    expect(state.track).toHaveBeenCalledWith('course_analytics_sort', { sort: 'most-played' });
    const names = screen.getAllByRole('button').map((b) => b.textContent ?? '');
    expect(names.findIndex((x) => x.includes('Beta'))).toBeLessThan(
      names.findIndex((x) => x.includes('Alpha')),
    );
  });

  it('re-choosing the current sort does not re-track', () => {
    state.courses = [course({}), course({})];
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Recent' }));
    expect(state.track).not.toHaveBeenCalledWith('course_analytics_sort', expect.anything());
  });

  it('early data mutes the figure and adds the inline tag', () => {
    state.courses = [course({ course_name: 'West Kent Golf Club', rounds_count: 1, avg_to_par: 4.0 })];
    mount();
    expect(screen.getByText('Early data')).toBeTruthy();
    expect(screen.getByText('one round')).toBeTruthy();
    const figure = screen.getByText('+4.0');
    expect(figure.style.color).toBe('rgba(248, 250, 252, 0.62)');
  });

  it('labels the figure "a round" at 10+ rounds with no tag', () => {
    state.courses = [course({ rounds_count: 12 })];
    mount();
    expect(screen.getByText('a round')).toBeTruthy();
    expect(screen.queryByText('Early data')).toBeNull();
  });

  it('bar widths come from the exact percentages', () => {
    state.courses = [
      course({
        eagles_plus_pct_exact: 7,
        birdies_pct_exact: 8,
        pars_pct_exact: 51,
        bogeys_plus_pct_exact: 34,
      }),
    ];
    const { container } = mount();
    const widths = Array.from(container.querySelectorAll('.yc1-list-bar i')).map(
      (i) => (i as HTMLElement).style.width,
    );
    expect(widths).toEqual(['7%', '8%', '51%', '34%']);
  });

  it('eagles hold a 0.6% floor above zero and hide at zero', () => {
    state.courses = [
      course({ eagles_plus_pct_exact: 0.1, eagles_plus_count: 1 }),
      course({ eagles_plus_pct_exact: 0, eagles_plus_count: 0 }),
    ];
    const { container } = mount();
    const bars = container.querySelectorAll('.yc1-list-bar');
    const withEagle = Array.from(bars[0].querySelectorAll('i')).map(
      (i) => (i as HTMLElement).style.width,
    );
    expect(withEagle[0]).toBe('0.6%');
    // No eagles: the bar has three segments, none of them gold.
    const without = Array.from(bars[1].querySelectorAll('i')) as HTMLElement[];
    expect(without).toHaveLength(3);
    expect(without.some((i) => i.style.background.includes('255, 210') || i.style.background.includes('#FFD200'))).toBe(false);
  });

  it('a course with no hole data keeps tap-to-navigate with a chevron and a dim dash', async () => {
    const nav = vi.fn();
    state.courses = [
      course({
        course_name: 'Mystery',
        avg_to_par: null,
        eagles_plus_pct: null,
        birdies_pct: null,
        pars_pct: null,
        bogeys_plus_pct: null,
        eagles_plus_count: null,
        birdies_count: null,
        pars_count: null,
        bogeys_plus_count: null,
        eagles_plus_pct_exact: null,
        birdies_pct_exact: null,
        pars_pct_exact: null,
        bogeys_plus_pct_exact: null,
      }),
    ];
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <YourCourseAnalyticsSheet open onClose={() => {}} onNavigate={nav} synced />
      </I18nextProvider>,
    );
    expect(container.querySelector('.yc1-list-bar')).toBeNull();
    expect(screen.getByText('–')).toBeTruthy();
    const row = screen.getByRole('button', { name: /Mystery/ });
    expect(row.textContent).toContain('›');
    fireEvent.click(row);
    expect(nav).toHaveBeenCalledWith(expect.stringContaining('/courses/'));
  });
});
