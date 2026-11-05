import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';

const state = vi.hoisted(() => ({ connected: true, rounds: 2, owns: false, elsewhere: vi.fn() }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' } }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ user: { id: 'me' }, profile: { id: 'me', display_name: 'Me', eg_handicap_index: 5 } }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { id: 'me', type: 'personal' } }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: state.connected ? { id: 'whs' } : null, isFetched: true }), useRecentDifferentials: () => ({ data: [2, 3, 4, 5, 6, 7, 8, 9] }) }));
vi.mock('@/hooks/gam/useCourseMeta', () => ({ useCourseMeta: () => ({ data: { your_rounds: state.rounds, course_cr: 72, course_slope: 113, course_par: 72 } }) }));
vi.mock('@/hooks/gam/useCourseLegends', () => ({ useCourseLegends: () => ({ data: [
  { category: 'lowest_gross_all_time', rank: 1, user_id: state.owns ? 'me' : 'other', user_display_name: 'Leader', value: 65, attained_at: '2026-06-01', is_self: state.owns },
  { category: 'lowest_gross_all_time', rank: 2, user_id: state.owns ? 'other' : 'me', user_display_name: 'Second', value: 71, attained_at: '2026-06-02', is_self: !state.owns },
], isFetched: true, isLoading: false, isError: false, refetch: vi.fn() }) }));
vi.mock('@/hooks/useCourseNetBoard', () => ({ useCourseNetBoard: () => ({ data: { available: true, rows: [] } }) }));
vi.mock('@/hooks/gam/useBoardMemberUsernames', () => ({ useBoardMemberUsernames: () => ({ data: {} }) }));
vi.mock('@/hooks/gam/useProBenchmarks', () => ({ useProBenchmarks: () => ({ data: [] }) }));
vi.mock('@/lib/whs/courseNameMatcher', () => ({ lookupCourseMetaV2: async () => null }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/components/profile/handicap/whs/sections/course-legends/flat/ChampionsElsewhere', () => ({ ChampionsElsewhere: () => { state.elsewhere(); return <div data-elsewhere />; }, showElsewhere: (connected: boolean, user: string, actor: string) => connected && user === actor }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: null }) }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: () => ({ data: { avg_over_par: 8, rounds_tracked: 40 } }) }));
vi.mock('@/hooks/useCourseTop100Standing', () => ({ useCourseTop100Standing: () => ({ data: null }) }));
vi.mock('@/components/courses/course-detail/useCourseRecordSummary', () => ({ useCourseRecordSummary: () => ({ courseRecordHolders: [] }) }));
vi.mock('@/components/courses/course-detail/about/useHeroReferenceLine', () => ({ useHeroReferenceLine: () => null }));
vi.mock('@/components/courses/course-detail/CourseAboutTab', () => ({ default: () => null }));
vi.mock('@/components/courses/course-detail/CourseReviewsTab', () => ({ default: () => null }));
vi.mock('@/components/courses/course-detail/CourseYouTab', () => ({ default: () => <div data-you-content /> }));
vi.mock('@/components/course-media-tab/CourseMediaTabNew', () => ({ default: () => null }));
vi.mock('@/components/feed/CourseStatsSheet', () => ({ default: () => null }));
vi.mock('@/components/courses/course-detail/you/YourRoundsSheet', () => ({ default: () => null }));
vi.mock('@/components/courses/course-detail/you/YourHolesSheet', () => ({ default: () => null }));

import GolfClubView from '@/components/golf-club/GolfClubView';
import { CourseLegendsDrilldown } from '@/components/profile/handicap/whs/sections/course-legends/CourseLegendsDrilldown';
import { analyticsEvents } from '@/utils/analyticsEvents';

const i18n = createInstance();
await i18n.init({ lng: 'en', fallbackLng: 'en', resources: {}, interpolation: { escapeValue: false } });
const selection = { courseId: 'course', courseName: 'Hayling', courseRegion: null, courseCountry: null, courseType: null };
function Location() { return <output data-location>{useLocation().search}</output>; }
function mount(page = false, modal = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['course-detail', 'course'], { id: 'course', name: 'Hayling', country: 'England' });
  return render(<I18nextProvider i18n={i18n}><QueryClientProvider client={client}><MemoryRouter initialEntries={['/courses/course?tab=legends&keep=yes']}>
    {page ? <GolfClubView courseId="course" isInModal={modal} /> : <CourseLegendsDrilldown selection={selection} hideHeader onOpenYouTab={vi.fn()} />}
    <Location />
  </MemoryRouter></QueryClientProvider></I18nextProvider>);
}
beforeEach(() => { state.connected = true; state.rounds = 2; state.owns = false; vi.clearAllMocks(); });
afterEach(cleanup);

describe('CH1 Champions tidy', () => {
  it('posted has no What it takes and offers the You link', () => {
    const { container } = mount();
    expect(container.querySelector('.champions-posted')).not.toBeNull();
    expect(container.querySelector('[data-section="what-it-takes"]')).toBeNull();
    expect(container.querySelector('[data-section="champions-you-link"] button')).not.toBeNull();
  });
  it('selected owned board retains Defence', () => {
    state.owns = true;
    const { container } = mount();
    expect(container.querySelector('[data-section="your-defence"]')).not.toBeNull();
    expect(container.querySelector('[data-section="champions-you-link"]')).not.toBeNull();
  });
  it.each(['projected', 'field'] as const)('%s keeps What it takes without the You link', kind => {
    state.rounds = 0;
    state.connected = kind !== 'field';
    const { container } = mount();
    const subtree = container.querySelector(kind === 'projected' ? '.champions-projected' : '.champions-empty');
    expect(subtree).not.toBeNull();
    expect(subtree?.querySelectorAll('section').length).toBeGreaterThan(2);
    // Structure identifies the retained record-comparison panel, not translated words.
    expect(subtree?.querySelector('.champions-field-panel')).not.toBeNull();
    expect(container.querySelector('[data-section="champions-you-link"]')).toBeNull();
  });
  it('course page suppresses Elsewhere but the drilldown default retains it', () => {
    const view = mount(true);
    expect(view.container.querySelector('[data-elsewhere]')).toBeNull();
    expect(state.elsewhere).not.toHaveBeenCalled();
    view.unmount();
    const defaultView = mount();
    expect(defaultView.container.querySelector('[data-elsewhere]')).not.toBeNull();
    expect(state.elsewhere).toHaveBeenCalledTimes(1);
  });
  it.each([false, true])('link uses existing tab handler, analytics and actual scroll owner, modal=%s', async modal => {
    const root = document.createElement('div'); root.id = 'root';
    root.style.overflowY = 'auto';
    Object.defineProperty(root, 'scrollHeight', { value: 2500 });
    Object.defineProperty(root, 'clientHeight', { value: 800 });
    root.scrollTop = 700; root.scrollTo = vi.fn(); document.body.appendChild(root);
    const view = mount(true, modal); root.appendChild(view.container);
    fireEvent.click(screen.getByRole('button', { name: 'What you could take here You tab ›' }));
    await act(async () => { await new Promise(resolve => requestAnimationFrame(resolve)); });
    expect(view.container.querySelector('[data-you-content]')).not.toBeNull();
    expect(analyticsEvents.track).toHaveBeenCalledWith('champions_you_link_tapped', { course_id: 'course' });
    expect(analyticsEvents.track).toHaveBeenCalledWith('course_tab_viewed', { course_id: 'course', tab: 'you' });
    expect(view.container.querySelector('[data-location]')?.textContent).toBe(modal ? '?tab=legends&keep=yes' : '?tab=you&keep=yes');
    expect(root.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
    view.unmount(); root.remove();
  });
});