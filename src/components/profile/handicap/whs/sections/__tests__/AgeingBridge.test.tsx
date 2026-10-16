import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import common from '../../../../../../../public/locales/en/common.json';
import type { WhsConnection, WhsScoreWithIndex } from '@/lib/whs/types';
import HandicapDashboard from '../../HandicapDashboard';

const source = vi.hoisted(() => ({ scores: undefined as WhsScoreWithIndex[] | undefined }));
vi.mock('@/lib/whs/hooks', () => ({
  useAllScores: () => ({ data: source.scores }),
  useHandicapTrend: () => ({ data: { current: 11.6 } }),
  useCounters: () => ({ data: [] }),
}));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/lib/whs/syncHealth', () => ({ getSyncHealth: () => ({ kind: 'healthy' }) }));
vi.mock('../IndexSection', () => ({ default: ({ belowHeadline }: { belowHeadline: React.ReactNode }) => <>{belowHeadline}</> }));
vi.mock('../RoundsThatCountSection', () => ({ default: () => null }));
vi.mock('../HolesSection', () => ({ default: () => null }));
vi.mock('../FloorSection', () => ({ default: () => null }));
vi.mock('../PersonalBestsSection', () => ({ default: () => null, TrophyRoomRow: () => null }));
vi.mock('../HandicapFooter', () => ({ default: () => null }));
vi.mock('../../../gam/launch/LaunchSheetMount', () => ({ LaunchSheetMount: () => null }));

const i18n = createInstance();
beforeAll(async () => {
  await i18n.init({ lng: 'en', resources: { en: { common } }, interpolation: { escapeValue: false } });
});
afterEach(cleanup);

// Both cases lock the next score. Only the first has a counter within the
// ageing horizon: oldest two non-counters, then the 2.0 counter at round three.
const twenty = (ageing: boolean): WhsScoreWithIndex[] => Array.from({ length: 20 }, (_, i) => ({
  id: `r${i}`,
  play_date: new Date(Date.UTC(2026, 0, 30 - i)).toISOString().slice(0, 10),
  adjusted_gross: 80,
  handicap_differential: ageing && i === 17 ? 2 : 10 + i,
  is_counter: i < 7 || (ageing ? i === 17 : i === 7),
  course: { name: 'Test Links', country_name: null },
  course_id: 'test-course',
  course_thumbnail_image: null,
  course_rating: 70,
  slope_rating: 113,
  stableford_points: null,
  marker_name: null,
  is_nine_hole: false,
  total_holes: 18,
  course_par: 72,
  handicap_index_at_time: null,
}));

const connection: WhsConnection = {
  id: 'test-connection', passport_id: 1, membership_number: 'test',
  last_synced_at: null, last_sync_status: null, last_sync_error: null,
  consecutive_failures: 0, initial_sync_complete: true,
  created_at: '2026-01-01', provider: 'england_golf',
};
const mount = () => render(
  <I18nextProvider i18n={i18n}><HandicapDashboard connection={connection} userId="test-member" /></I18nextProvider>,
);

describe('BRIEF_HANDICAP_TAB_REBUILD_2B shared rendering gate', () => {
  it('renders the lock bridge when the real ageing-out section is present', () => {
    source.scores = twenty(true);
    const { container } = mount();
    expect(container.querySelector('[data-hcp-ageing]')).not.toBeNull();
    expect(container.querySelector('[data-hcp-lock]')).not.toBeNull();
    expect(screen.getByText(common.handicap.lock.ageingBridge, { exact: false })).toBeInTheDocument();
  });
  it('omits the bridge when the lock remains but the ageing-out section is absent', () => {
    source.scores = twenty(false);
    const { container } = mount();
    expect(container.querySelector('[data-hcp-ageing]')).toBeNull();
    expect(container.querySelector('[data-hcp-lock]')).not.toBeNull();
    expect(screen.queryByText(common.handicap.lock.ageingBridge, { exact: false })).not.toBeInTheDocument();
  });
});