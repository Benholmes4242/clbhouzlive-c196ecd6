import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { ProfileRound } from '@/components/profile/rounds/useProfileRounds';

const state = vi.hoisted(() => ({ rounds: [] as ProfileRound[] }));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, _fallback: string, options?: { n: number }) =>
      options ? `${key}:${options.n}` : key,
  }),
}));
vi.mock('@/components/profile/rounds/useProfileRounds', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/components/profile/rounds/useProfileRounds')>(),
  useProfileRounds: () => ({ data: state.rounds }),
}));
vi.mock('./useClubsCourses', () => ({
  useClubsCourses: () => ({ data: {
    home: [{ id: 'home-course', name: 'Home course' }],
    secondary: [{ id: 'secondary-course', name: 'Secondary course' }],
  } }),
}));
vi.mock('@/features/explore-magazine/useClubGolfers', () => ({
  useClubGolfers: () => ({ data: [{ userId: 'other-member', name: 'Other member', photoUrl: null }] }),
}));
vi.mock('@/components/profile/hooks/useProfileClubs', () => ({
  useProfileClubs: () => ({ homeClub: null }),
}));
vi.mock('@/components/explore-tab-new/courseled/CourseImageFallback', () => ({
  CourseImageFallback: () => null,
}));
vi.mock('@/features/explore-magazine/useClubWeekRounds', () => ({ courseLabel: () => null }));
vi.mock('@/features/profile-sheet-v2/sheetState', () => ({ fmtSigned: (n: number) => String(n) }));

import ClubsCard from './ClubsCard';

const round = (courseId: string, totalHoles = 18): ProfileRound => ({
  whs_score_id: courseId, course_id: courseId, play_date: '2026-10-14',
  course_name: null, course_par: null, gross_score: 80, hcp_at_time: null,
  nett_score: null, delta_index: null, eagles: null, albatrosses: null,
  holes_in_one: null, clean_card: null, is_nine_hole: totalHoles === 9,
  total_holes: totalHoles, handicap_differential: null,
  handicap_index_at_time: null, whs_joined: true,
});

function showClubs() {
  render(<ClubsCard homeClub={{ id: 'home', name: 'Home club' }}
    secondaryClubs={[{ id: 'secondary', name: 'Secondary club' }]}
    isOwner={false} profileId="owner" viewerId="viewer" />);
}

describe('club round-history visibility', () => {
  beforeEach(() => { cleanup(); state.rounds = []; });

  it('treats zero returned rounds as unknown rather than known empty', () => {
    showClubs();
    expect(screen.queryByText('clubs.noRoundsHere')).toBeNull();
    expect(screen.queryByText('clubs.roundsHere')).toBeNull();
    expect(screen.queryByText(/^clubs.roundsCount:/)).toBeNull();
  });

  it('recognizes readable history elsewhere without inventing club counts', () => {
    state.rounds = [round('away-course')];
    showClubs();
    expect(screen.getAllByText('clubs.noRoundsHere')).toHaveLength(1);
    expect(screen.queryByText('clubs.roundsHere')).toBeNull();
    expect(screen.queryByText(/^clubs.roundsCount:/)).toBeNull();
    expect(screen.getByText('Home club')).toBeTruthy();
    expect(screen.getByText('clubs.peopleB')).toBeTruthy();
  });

  it('uses raw readable history even when no round qualifies as eighteen holes', () => {
    state.rounds = [round('home-course', 9)];
    showClubs();
    expect(screen.getByText('clubs.noRoundsHere')).toBeTruthy();
    expect(screen.queryByText('clubs.roundsHere')).toBeNull();
  });

  it('preserves home figures when a qualifying home round exists', () => {
    state.rounds = [round('home-course')];
    showClubs();
    expect(screen.queryByText('clubs.noRoundsHere')).toBeNull();
    expect(screen.getByText('clubs.roundsHere')).toBeTruthy();
    expect(screen.queryByText(/^clubs.roundsCount:/)).toBeNull();
  });

  it('prints a secondary count only for qualifying rounds at that club', () => {
    state.rounds = [round('secondary-course'), round('secondary-course', 9)];
    showClubs();
    expect(screen.getByText('clubs.roundsCount:1')).toBeTruthy();
    expect(screen.getAllByText('clubs.noRoundsHere')).toHaveLength(1);
  });
});