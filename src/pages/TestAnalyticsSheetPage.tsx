import React from 'react';
import YourCourseAnalyticsSheet from '@/features/profile-sheet-v2/components/YourCourseAnalyticsSheet';
import type { UserAnalyticsCourse } from '@/hooks/gam/useUserAnalyticsCourses';

const mockCourses: UserAnalyticsCourse[] = [
  {
    course_id: '1',
    course_name: 'Sundridge Park Golf Club (East Course)',
    rounds_count: 103,
    last_played: '2026-07-19',
    avg_to_par: 8.5,
    hardest_hole_no: null,
    hardest_hole_avg: null,
    eagles_plus_pct: 2,
    birdies_pct: 18,
    pars_pct: 45,
    bogeys_plus_pct: 35,
    eagles_plus_count: 12,
    birdies_count: 108,
    pars_count: 270,
    bogeys_plus_count: 210,
    eagles_plus_pct_exact: 1.8,
    birdies_pct_exact: 18.2,
    pars_pct_exact: 45.5,
    bogeys_plus_pct_exact: 34.5,
  },
  {
    course_id: '2',
    course_name: 'Royal Cinque Ports Golf Club',
    rounds_count: 70,
    last_played: '2026-07-18',
    avg_to_par: 4.2,
    hardest_hole_no: null,
    hardest_hole_avg: null,
    eagles_plus_pct: 3,
    birdies_pct: 22,
    pars_pct: 48,
    bogeys_plus_pct: 27,
    eagles_plus_count: 8,
    birdies_count: 56,
    pars_count: 122,
    bogeys_plus_count: 69,
    eagles_plus_pct_exact: 3.1,
    birdies_pct_exact: 21.7,
    pars_pct_exact: 48.3,
    bogeys_plus_pct_exact: 26.9,
  },
  {
    course_id: '3',
    course_name: 'A very long golf club name that might truncate on its own line but the meta must not',
    rounds_count: 1247,
    last_played: '2025-10-05',
    avg_to_par: -1.4,
    hardest_hole_no: null,
    hardest_hole_avg: null,
    eagles_plus_pct: 5,
    birdies_pct: 25,
    pars_pct: 50,
    bogeys_plus_pct: 20,
    eagles_plus_count: 200,
    birdies_count: 1000,
    pars_count: 2000,
    bogeys_plus_count: 800,
    eagles_plus_pct_exact: 5.0,
    birdies_pct_exact: 25.0,
    pars_pct_exact: 50.0,
    bogeys_plus_pct_exact: 20.0,
  },
  {
    course_id: '4',
    course_name: 'The Berkshire (Blue Course)',
    rounds_count: 1,
    last_played: '2026-06-06',
    avg_to_par: 2.0,
    hardest_hole_no: null,
    hardest_hole_avg: null,
    eagles_plus_pct: 0,
    birdies_pct: 10,
    pars_pct: 60,
    bogeys_plus_pct: 30,
    eagles_plus_count: 0,
    birdies_count: 2,
    pars_count: 12,
    bogeys_plus_count: 6,
    eagles_plus_pct_exact: 0,
    birdies_pct_exact: 10.0,
    pars_pct_exact: 60.0,
    bogeys_plus_pct_exact: 30.0,
  },
  {
    course_id: '5',
    course_name: 'Course with no last played date',
    rounds_count: 12,
    last_played: null,
    avg_to_par: 6.7,
    hardest_hole_no: null,
    hardest_hole_avg: null,
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
  },
];

// Stub the hook so the sheet renders our mock data without a Supabase call.
jest.mock('@/hooks/gam/useUserAnalyticsCourses', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/gam/useUserAnalyticsCourses'),
  useUserAnalyticsCourses: ({ enabled }: { enabled?: boolean }) => ({
    data: mockCourses,
    isLoading: false,
    isFetching: false,
    error: null,
  }),
}));

export default function TestAnalyticsSheetPage() {
  return (
    <div style={{ paddingTop: 40 }}>
      <YourCourseAnalyticsSheet
        open
        onClose={() => {}}
        onNavigate={() => {}}
        synced
      />
    </div>
  );
}
