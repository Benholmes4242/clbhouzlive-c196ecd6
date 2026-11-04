import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: null }), useHandicapTrend: () => ({ data: null }), useHandicapHistory: () => ({ data: [] }) }));
vi.mock('@/hooks/useHandicapTrend12mo', () => ({ useHandicapTrend12mo: () => ({ delta: null, direction: 'flat' }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => ({ settled: true, linked: true, connected: true, trend: { current: 4.2 } }) }));
vi.mock('@/lib/whs/usePercentile', () => ({ useHandicapPercentile: () => ({ data: null }) }));
vi.mock('@/components/profile/rounds/useProfileRounds', () => ({ useProfileRounds: () => ({ isSuccess: true, data: [] }), isFullEighteen: () => true }));
vi.mock('@/hooks/gam/useProfileAchievementFigures', () => ({ useProfileAchievementFigures: () => ({ isFetched: true, data: null }) }));
vi.mock('@/components/profile/hooks/useProfileClubs', () => ({ useProfileClubs: () => ({ homeClub: null }) }));
vi.mock('@/hooks/useUserTopTenCourses', () => ({ useUserTopTenCourses: () => ({ topTen: [] }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/utils/median/openExternalUrl', () => ({ openExternalUrl: vi.fn() }));
import { ProfileHero } from '@/components/profile/hero/ProfileHero';
import type { ProMember } from '@/features/pro-verification/proMembersCache';
afterEach(cleanup);
const base: ProMember = { user_id: 'pro', pro_kind: 'tour_pro', pro_tour: 'DP World Tour', pro_tour_code: 'euro', pro_club: null, pro_player_id: 'p' };
describe('Brief 2 professional hero figures', () => {
  it.each(['tour_pro', 'teaching_pro'] as const)('%s replaces index and connect content with the professional descriptor', kind => {
    const { container } = render(<MemoryRouter><ProfileHero userId="pro" displayName="Member" isSelf proMember={{ ...base, pro_kind: kind, pro_club: 'Club' }} indexValue={4.2} roundsCount={null} ratedCount={null} onStatTap={() => {}} /></MemoryRouter>);
    expect(container.querySelector('.pro-hero-descriptor')).not.toBeNull();
    expect(container.querySelector('.pro-label')?.getAttribute('data-size')).toBe('large');
    expect(container.querySelectorAll('[data-example-index], [data-testid="hero-connect-panel"]')).toHaveLength(0);
    expect(container.textContent).not.toContain('4.2');
  });
});