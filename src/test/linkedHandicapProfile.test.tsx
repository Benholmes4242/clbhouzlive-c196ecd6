import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
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
import ProfileRoundsTab from '@/components/profile/rounds/ProfileRoundsTab';
function Path() { const l = useLocation(); return <output data-testid="path">{l.pathname}</output>; }
function hero(own = true) { return render(<MemoryRouter><ProfileHero userId="member" displayName="Member" isSelf={own} indexValue={null} roundsCount={0} ratedCount={0} onStatTap={f.stat} /><Path /></MemoryRouter>); }
beforeEach(() => { f.linked = true; f.connected = false; f.settled = true; f.stat.mockClear(); });
describe('linked owner profile', () => {
  it('replaces the example and connect panel with the provider management notice', () => { const r = hero(); expect(r.container.querySelector('[data-linked-handicap-notice]')).not.toBeNull(); expect(r.container.querySelector('[data-example-pill]')).toBeNull(); expect(r.container.querySelector('[data-example-chart]')).toBeNull(); expect(screen.queryByTestId('hero-connect-panel')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'England Golf ›' })); expect(screen.getByTestId('path')).toHaveTextContent('/manage/handicap'); });
  it('preserves all three counter actions below the notice', () => { const r = hero(); const notice = r.container.querySelector('[data-linked-handicap-notice]'); expect(notice?.nextElementSibling?.querySelectorAll('button')).toHaveLength(3); notice?.nextElementSibling?.querySelectorAll('button').forEach(b => fireEvent.click(b)); expect(f.stat.mock.calls.map(c => c[0])).toEqual(['rounds', 'rated', 'badges']); });
  it('never adds an owner connection notice on a visitor profile', () => { const r = hero(false); expect(r.container.querySelector('[data-linked-handicap-notice]')).toBeNull(); expect(screen.queryByTestId('hero-connect-panel')).toBeNull(); });
  it('unlinked owner retains the existing example', () => { f.linked = false; hero(); expect(screen.getByTestId('hero-connect-panel')).toBeInTheDocument(); });
});
describe('empty owner rounds invitation', () => {
  it('linked owner gets management rather than another connect prompt', () => { const r = render(<MemoryRouter><ProfileRoundsTab userId="member" isOwnProfile /><Path /></MemoryRouter>); expect(r.container.querySelector('[data-linked-handicap-notice]')).not.toBeNull(); expect(screen.getAllByRole('button')).toHaveLength(1); fireEvent.click(screen.getByRole('button')); expect(screen.getByTestId('path')).toHaveTextContent('/manage/handicap'); });
  it('unsettled empty state never flashes an invitation', () => { f.settled = false; const r = render(<MemoryRouter><ProfileRoundsTab userId="member" isOwnProfile /></MemoryRouter>); expect(r.container.childElementCount).toBe(0); });
});