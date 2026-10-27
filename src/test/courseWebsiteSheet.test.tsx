/**
 * BEFORE_YOU_GO — CourseWebsiteSheet. The react-i18next mock is the canonical
 * one (initReactI18next at module load, t returns defaultValue) extended to
 * fill {{placeholders}} from the options object, so interpolated copy can be
 * asserted. Assertions are on structure and the English default copy, never on
 * locale files.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  stats: { data: null as any },
  analysis: { data: null as any },
  reviewRows: { data: null as any },
  claimStatus: { data: null as any },
  circlePlayers: { data: null as any },
  handicap: { index: null as number | null, ready: true },
  personalStatus: {
    status: null as any,
    hasTrackedRounds: false,
    setWantToPlay: vi.fn(),
  },
  bandAverage: { data: null as any },
  user: { user: { id: 'viewer-1' } as any },
  openExternalUrl: vi.fn(),
  openMapsUrl: vi.fn(),
  trackBusinessAction: vi.fn(),
  track: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (_k: string, o?: { defaultValue?: string } & Record<string, unknown>) =>
      (o?.defaultValue ?? '').replace(/\{\{(\w+)\}\}/g, (_m, key) => String(o?.[key] ?? '')),
  }),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => mocks.user }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: () => mocks.stats }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => mocks.analysis }));
vi.mock('@/hooks/useCourseReviewSample', () => ({ useCourseReviewSample: () => mocks.reviewRows }));
vi.mock('@/hooks/useCourseClaim', () => ({ useCourseClaimStatus: () => mocks.claimStatus }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useBoardCoursePlayers', () => ({
  useBoardCoursePlayers: () => mocks.circlePlayers,
}));
vi.mock('@/components/explore-tab-new/courseled/hooks/useGolfThisWeek', () => ({
  useViewerHandicapIndex: () => mocks.handicap,
}));
vi.mock('@/hooks/useCoursePersonalStatus', () => ({ useCoursePersonalStatus: () => mocks.personalStatus }));
vi.mock('@/hooks/useCourseBandAverage', () => ({ useCourseBandAverage: () => mocks.bandAverage }));
vi.mock('@/utils/median/openExternalUrl', () => ({ openExternalUrl: mocks.openExternalUrl }));
vi.mock('@/utils/median/openMapsUrl', () => ({ openMapsUrl: mocks.openMapsUrl }));
vi.mock('@/lib/businessAnalyticsTracking', () => ({ trackBusinessAction: mocks.trackBusinessAction }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: mocks.track } }));
vi.mock('@/lib/toast', () => ({
  toast: Object.assign(vi.fn(), { success: mocks.toastSuccess, error: mocks.toastError }),
}));

import CourseWebsiteSheet from '@/components/courses/course-detail/CourseWebsiteSheet';

const COURSE = {
  id: 'course-1',
  name: 'Royal Example Golf Club',
  website_url: 'https://www.royalexample.co.uk/visit',
  thumbnail_image: 'https://img.example/course.jpg',
  latitude: 51.1,
  longitude: -0.5,
  club_id: 'club-1',
};

const COORDS = { lat: 51.1, lng: -0.5 };

const HOLES = Array.from({ length: 18 }, (_, i) => ({
  hole_no: i + 1,
  par: i % 3 === 0 ? 5 : i % 3 === 1 ? 4 : 3,
  yards: 400,
  stroke_index: i + 1,
  rounds: 40,
  avg_to_par: i === 6 ? 0.85 : 0.2,
  avg_gross: 5,
  dist: { ace: 0, albatross: 0, eagle: 0, birdie: 1, par: 20, bogey: 10, double: 2 },
}));
const TOTAL_PAR = HOLES.reduce((s, h) => s + h.par, 0);

const FULL_STATS = {
  course_id: 'course-1',
  rounds_tracked: 128,
  avg_over_par: 4.24,
  harder_than_pct: 61,
  your_rounds: 3,
  your_best: 81,
  your_best_at: null,
  circle_played: 4,
  top100_rank: null,
  top100_list: null,
  hardest_hole_no: 7,
  hardest_hole_par: 4,
  hardest_hole_plays: 4.85,
};

const CLAIMED = {
  state: 'claimed',
  business: {
    id: 'biz-1',
    name: 'Royal Example',
    slug: 'royal-example',
    is_verified: true,
    logo_url: null,
    booking_url: 'royalexample.co.uk/tee-times',
    phone: '+44 1234 567890',
  },
};

const REVIEW_ROWS = Array.from({ length: 6 }, (_, i) => ({
  id: `r${i}`,
  user_id: `u${i}`,
  rating: 8,
  design_score: 8,
  condition_score: 8,
  clubhouse_score: 8,
  facilities_score: 8,
}));

const circlePlayers = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    user_id: `p${i}`,
    display_name: `Player ${i + 1}`,
    profile_photo_url: null,
    rounds: 2,
    best_gross: 80,
    best_to_par: 8,
    last_played: null,
  }));

function setup(overrides: Partial<Parameters<typeof CourseWebsiteSheet>[0]> = {}) {
  const onClose = vi.fn();
  const onTabChange = vi.fn();
  render(
    <CourseWebsiteSheet
      open
      onClose={onClose}
      course={COURSE}
      coords={COORDS}
      onTabChange={onTabChange}
      {...overrides}
    />,
  );
  return { onClose, onTabChange };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.stats.data = FULL_STATS;
  mocks.analysis.data = { available: true, total_rounds: 128, holes: HOLES };
  mocks.reviewRows.data = REVIEW_ROWS;
  mocks.claimStatus.data = CLAIMED;
  mocks.circlePlayers.data = circlePlayers(4);
  mocks.handicap.index = 14.2;
  mocks.personalStatus.status = { status: 'none' };
  mocks.personalStatus.hasTrackedRounds = false;
  mocks.bandAverage.data = { rounds: 21, golfers: 9, avg_gross: 88.4 };
  mocks.user.user = { id: 'viewer-1' };
});

describe('CourseWebsiteSheet — full state', () => {
  it('renders every piece in the mock order', () => {
    setup();
    const sheet = document.querySelector('[data-course-website-sheet]') as HTMLElement;
    expect(sheet).toBeTruthy();
    const text = sheet.textContent ?? '';
    const order = [
      'OFFICIAL WEBSITE',
      'Royal Example Golf Club',
      'royalexample.co.uk · opens in your browser',
      'Visit website',
      'Tee times',
      'Call',
      'Directions',
      'Copy link',
      'BEFORE YOU GO',
      '128 ROUNDS MEASURED',
      '+4.2',
      'AVG OVER PAR',
      `Par ${TOTAL_PAR}`,
      '7th',
      'HARDEST HOLE',
      '+0.85 a round',
      '8.0',
      'RATED /10',
      '6 reviews',
      'Golfers off your handicap average',
      'Your best here is',
      'Player 1, Player 2 and 2 others you follow have played here',
      'Save to your list',
      'Share course',
    ];
    let at = -1;
    for (const piece of order) {
      const next = text.indexOf(piece, at + 1);
      expect(next, `expected "${piece}" after index ${at}`).toBeGreaterThan(at);
      at = next;
    }
    // Photo band present.
    expect(sheet.querySelector('img[src="https://img.example/course.jpg"]')).toBeTruthy();
    // Tee times present means no Share TILE.
    const tiles = within(sheet)
      .getAllByRole('button')
      .filter((b) => ['Tee times', 'Call', 'Directions', 'Copy link', 'Share'].includes(b.textContent ?? ''));
    expect(tiles.map((b) => b.textContent)).toEqual(['Tee times', 'Call', 'Directions', 'Copy link']);
  });
});

describe('CourseWebsiteSheet — no-data state', () => {
  it('drops the photo band, figures and Share course button; shows the no-rounds line and Share tile', () => {
    mocks.stats.data = { ...FULL_STATS, rounds_tracked: 0, avg_over_par: null, your_rounds: 0, your_best: null, hardest_hole_no: null, hardest_hole_par: null, hardest_hole_plays: null };
    mocks.analysis.data = { available: false, total_rounds: 0, holes: [] };
    mocks.reviewRows.data = [];
    mocks.claimStatus.data = { state: 'unclaimed', business: null };
    mocks.circlePlayers.data = [];
    mocks.bandAverage.data = null;
    setup({ course: { ...COURSE, thumbnail_image: undefined } });
    const sheet = document.querySelector('[data-course-website-sheet]') as HTMLElement;
    expect(sheet.querySelector('img[src="https://img.example/course.jpg"]')).toBeNull();
    expect(within(sheet).queryByText('AVG OVER PAR')).toBeNull();
    expect(within(sheet).queryByText('HARDEST HOLE')).toBeNull();
    expect(within(sheet).queryByText('RATED /10')).toBeNull();
    expect(
      within(sheet).getByText(
        'No rounds measured here yet. Play it with your handicap connected and yours is the first.',
      ),
    ).toBeTruthy();
    // Share is a tile, so there is no Share course button.
    expect(within(sheet).getByRole('button', { name: 'Share' })).toBeTruthy();
    expect(within(sheet).queryByRole('button', { name: 'Share course' })).toBeNull();
  });
});

describe('CourseWebsiteSheet — conditional tiles', () => {
  it('unclaimed course: no Tee times and no Call tile', () => {
    mocks.claimStatus.data = { state: 'unclaimed', business: null };
    setup();
    const sheet = document.querySelector('[data-course-website-sheet]') as HTMLElement;
    expect(within(sheet).queryByRole('button', { name: 'Tee times' })).toBeNull();
    expect(within(sheet).queryByRole('button', { name: 'Call' })).toBeNull();
    expect(within(sheet).getByRole('button', { name: 'Share' })).toBeTruthy();
  });

  it('no coords: no Directions tile', () => {
    setup({ coords: null });
    const sheet = document.querySelector('[data-course-website-sheet]') as HTMLElement;
    expect(within(sheet).queryByRole('button', { name: 'Directions' })).toBeNull();
  });
});

describe('CourseWebsiteSheet — the "you" panel', () => {
  it('hides the band sentence below 5 rounds', () => {
    mocks.bandAverage.data = { rounds: 4, golfers: 9, avg_gross: 88.4 };
    setup();
    expect(screen.queryByText('Golfers off your handicap average')).toBeNull();
  });

  it('hides the band sentence below 3 golfers', () => {
    mocks.bandAverage.data = { rounds: 21, golfers: 2, avg_gross: 88.4 };
    setup();
    expect(screen.queryByText('Golfers off your handicap average')).toBeNull();
  });

  it('hides the band sentence with no index', () => {
    mocks.handicap.index = null;
    setup();
    expect(screen.queryByText('Golfers off your handicap average')).toBeNull();
  });

  it('hides the whole panel when it would only say "You haven\'t played it yet"', () => {
    mocks.stats.data = { ...FULL_STATS, your_rounds: 0, your_best: null };
    mocks.bandAverage.data = null;
    setup();
    expect(screen.queryByText("You haven't played it yet.")).toBeNull();
    expect(screen.queryByText('Your best here is')).toBeNull();
  });
});

describe('CourseWebsiteSheet — people you follow wording', () => {
  it.each([
    [1, 'Player 1 has played here'],
    [2, 'Player 1 and Player 2 have played here'],
    [3, 'Player 1, Player 2 and Player 3 have played here'],
    [5, 'Player 1, Player 2 and 3 others you follow have played here'],
  ])('count %i reads "%s"', (n, expected) => {
    mocks.circlePlayers.data = circlePlayers(n);
    setup();
    expect(screen.getByText(expected)).toBeTruthy();
  });

  it('tapping the row closes the sheet and switches to the You tab', () => {
    const { onClose, onTabChange } = setup();
    fireEvent.click(screen.getByText('Player 1, Player 2 and 2 others you follow have played here'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('you');
  });
});

describe('CourseWebsiteSheet — actions', () => {
  it('Copy link swaps to "Copied" and back', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy());
    expect(writeText).toHaveBeenCalledWith('https://www.royalexample.co.uk/visit');
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Copied to clipboard');
    await vi.advanceTimersByTimeAsync(2100);
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeTruthy();
    vi.useRealTimers();
  });

  it('Visit website opens the URL and closes the sheet', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Visit website' }));
    expect(mocks.openExternalUrl).toHaveBeenCalledWith('https://www.royalexample.co.uk/visit');
    expect(mocks.trackBusinessAction).toHaveBeenCalledWith('biz-1', 'website', 'viewer-1');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('tracks the sheet open with the course id', () => {
    setup();
    expect(mocks.track).toHaveBeenCalledWith('course_website_sheet_open', { course_id: 'course-1' });
  });
});
