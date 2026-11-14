import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/features/amateur-ranking/useAmateurRanking', () => ({ useAmateurSummary: () => ({ data: null, isSuccess: true }), useAmateurHistory: () => ({ data: [], isSuccess: true }), useAmateurEvents: () => ({ data: [], isSuccess: true }), useAmateurCareer: () => ({ data: [], isSuccess: true }) }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const f = vi.hoisted(() => ({ linked: true, connected: false, settled: true, stat: vi.fn() }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => ({ linked: f.linked, connected: f.connected, settled: f.settled, connection: { id: 'c', provider: 'england_golf' }, trend: null, anyError: false }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: { id: 'c' } }), useHandicapTrend: () => ({ data: null }), useHandicapHistory: () => ({ data: [] }) }));
vi.mock('@/hooks/useHandicapTrend12mo', () => ({ useHandicapTrend12mo: () => ({ delta: null, direction: 'flat' }) }));
vi.mock('@/lib/whs/usePercentile', () => ({ useHandicapPercentile: () => ({ data: null }) }));
vi.mock('@/lib/whs/useDeclineHandicapChip', () => ({ useDeclineHandicapChip: () => vi.fn() }));
vi.mock('@/components/profile/rounds/useProfileRounds', () => ({ useProfileRounds: () => ({ isSuccess: true, isLoading: false, data: [] }), isFullEighteen: () => false, useOwnHandicapVisibility: () => ({ data: 'public' }) }));
vi.mock('@/hooks/gam/useProfileAchievementFigures', () => ({ useProfileAchievementFigures: () => ({ isFetched: true, data: { badges: 0 } }) }));
vi.mock('@/components/profile/hooks/useProfileClubs', () => ({ useProfileClubs: () => ({ homeClub: null }) }));
vi.mock('@/hooks/useUserTopTenCourses', () => ({ useUserTopTenCourses: () => ({ topTen: [] }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/utils/median/openExternalUrl', () => ({ openExternalUrl: vi.fn() }));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: () => null }));
import { ProfileHero } from '@/components/profile/hero/ProfileHero';
import { TheirFormSection } from '@/components/friend-sheet/parts/TheirFormSection';
import { CATEGORIES } from '@/lib/notifications/notificationCategories';
import { withoutRetiredActivity } from '@/features/activity-v2/retiredActivityKinds';
import type { ActivityFeedRowV2 } from '@/features/activity-v2/hooks/useActivityFeedV2';

beforeEach(() => { f.linked = false; f.connected = false; f.settled = true; f.stat.mockClear(); cleanup(); });
function heroStats(isSelf: boolean, pro = false) {
  const r = render(<MemoryRouter><ProfileHero userId="member" displayName="Member" isSelf={isSelf} indexValue={null} roundsCount={4} ratedCount={2} onStatTap={f.stat} proMember={pro ? { user_id: 'member', pro_kind: 'tour_pro' } as any : null} /></MemoryRouter>);
  r.container.querySelectorAll('button').forEach(b => fireEvent.click(b));
  return f.stat.mock.calls.map(c => c[0]);
}
describe('REMOVE_BADGES_1', () => {
  it('hero: no badges counter on own profile', () => { expect(heroStats(true)).not.toContain('badges'); });
  it('hero: no badges counter on another member', () => { expect(heroStats(false)).not.toContain('badges'); });
  it('hero: no badges counter on a pro', () => { expect(heroStats(false, true)).not.toContain('badges'); });
  it('friend sheet: no badges text or Award icon; streak item still renders', () => {
    const { container } = render(<TheirFormSection handicap={{ handicap_index: 10, trend_delta: 0, badges_earned: 4, active_streaks: 2, last_round: null }} />);
    expect(container.textContent).not.toMatch(/badge/i);
    expect(container.querySelector('svg.lucide-award')).toBeNull();
    expect(container.querySelector('svg.lucide-flame')).not.toBeNull();
    expect(container.textContent).toContain('2 streaks');
  });
  const row = (id: string, notif_type: string, is_read = false) => ({ notif_id: id, notif_type, is_read, created_at: '2026-11-04T10:00:00Z' }) as unknown as ActivityFeedRowV2;
  it('activity: badge_earned rows are dropped and do not count as unread', () => {
    const rows = withoutRetiredActivity([row('b', 'badge_earned'), row('s', 'streak_at_risk'), row('c', 'crown_taken', true)]);
    expect(rows.map(r => r.notif_id)).toEqual(['s', 'c']);
    expect(rows.filter(r => !r.is_read)).toHaveLength(1);
  });
  it('preferences: no badge setting', () => {
    expect(CATEGORIES.flatMap(c => c.types)).not.toContain('badge_earned');
    expect(CATEGORIES.map(c => `${c.label} ${c.sub}`).join(' ')).not.toMatch(/badge/i);
  });
});
