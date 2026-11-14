import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useSearchParams, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const h = vi.hoisted(() => ({ summary: { rank: 318 } as { rank: number | null } | null, history: [] as Array<{ id: number; week: number; rank: number; finish: string | null }>, failed: false, connected: true }));
vi.mock('@/features/amateur-ranking/useAmateurRanking', () => ({ useAmateurSummary: () => ({ data: h.summary, isSuccess: true }), useAmateurHistory: () => ({ data: h.history, isSuccess: !h.failed }), useAmateurEvents: () => ({ data: [], isSuccess: true }), useAmateurCareer: () => ({ data: [], isSuccess: true }) }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: null }), useHandicapTrend: () => ({ data: null }), useHandicapHistory: () => ({ data: [] }) }));
vi.mock('@/hooks/useHandicapTrend12mo', () => ({ useHandicapTrend12mo: () => ({ delta: null, direction: 'flat' }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => ({ settled: true, linked: true, connected: h.connected, trend: { current: 4.2 } }) }));
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

import lewy from './fixtures/lewy-amateur-rank-history.json';
import { HeroConnectExample } from '@/components/profile/hero/HeroConnectExample';
import { createInstance } from 'i18next';
const english = createInstance();
void english.init({ lng: 'en' });
const t = english.getFixedT('en', 'profile');
const pro: ProMember = { user_id: 'pro', pro_kind: 'tour_pro', pro_tour: 'Tour', pro_tour_code: 'pga', pro_club: null, pro_player_id: null };
function Hero({ index = -2.1, professional = false }: { index?: number | null; professional?: boolean }) {
  const [, setSearchParams] = useSearchParams();
  const location = useLocation();
  return <><ProfileHero userId="lewy" displayName="Lewy Hayward" isSelf={false} indexValue={index} roundsCount={null} ratedCount={null} proMember={professional ? pro : null} onStatTap={() => {}} onOpenRanking={() => setSearchParams({ tab: 'ranking' })} /><output data-testid="search">{location.search}</output></>;
}
function mount(props: React.ComponentProps<typeof Hero> = {}) { return render(<MemoryRouter><Hero {...props} /></MemoryRouter>); }
const line = () => screen.queryByRole('button', { name: 'World amateur ranking 318. Open the Ranking tab' });
beforeEach(() => { h.summary = { rank: 318 }; h.history = lewy; h.failed = false; h.connected = true; });
describe('WAGR profile ranking line', () => {
  it('shows the shared rank and Lewy weekly improvement', () => { mount(); expect(line()?.textContent).toContain('#318'); expect(line()?.textContent).toContain('World amateur ranking'); expect(line()?.textContent).toContain('▲ 3 this week'); });
  it('omits the line when the server returns no summary', () => { h.summary = null; mount(); expect(line()).toBeNull(); });
  it('omits the line when rank is null', () => { h.summary = { rank: null }; mount(); expect(screen.queryByRole('button', { name: /World amateur ranking/ })).toBeNull(); });
  it('never shows amateur ranking for a verified pro', () => { mount({ professional: true }); expect(line()).toBeNull(); });
  it('shows weekly decline', () => { h.history = [{ id: 1, week: 202640, rank: 315, finish: null }, { id: 2, week: 202641, rank: 318, finish: null }]; mount(); expect(line()?.textContent).toContain('▼ 3 this week'); });
  it('shows unchanged weekly ranking', () => { h.history = [{ id: 1, week: 202640, rank: 318, finish: null }, { id: 2, week: 202641, rank: 318, finish: null }]; mount(); expect(line()?.textContent).toContain('no change this week'); });
  it('omits movement with just one distinct week', () => { h.history = [{ id: 1, week: 202641, rank: 318, finish: null }, { id: 2, week: 202641, rank: 318, finish: null }]; mount(); expect(line()?.textContent).not.toContain('this week'); });
  it('omits movement on failed history even with stale rows', () => { h.failed = true; mount(); expect(line()?.textContent).not.toContain('this week'); });
  it('opens the Ranking tab on tap', () => { mount(); const button = line(); if (!button) throw new Error('Ranking line missing'); fireEvent.click(button); expect(screen.getByTestId('search').textContent).toBe('?tab=ranking'); });
  it('retains ranking independently when handicap is hidden', () => { h.connected = false; mount(); expect(line()).not.toBeNull(); expect(screen.queryByText('+2.1')).toBeNull(); });
  it('retains ranking independently when no index exists', () => { mount({ index: null }); expect(line()).not.toBeNull(); expect(screen.queryByText('+2.1')).toBeNull(); });
  it('does not add ranking to the example mode', () => { render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><HeroConnectExample t={t} /></QueryClientProvider></MemoryRouter>); expect(line()).toBeNull(); expect(document.querySelectorAll('[data-example-form-tile]')).toHaveLength(5); });
});
