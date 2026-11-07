import React from 'react';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CourseMasthead, MASTHEAD_NAME } from '@/components/courses/CourseMasthead';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import type { CourseLegendRow } from '@/lib/gam/types';

const f = vi.hoisted(() => ({ holders: [] as CourseLegendRow[] }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: null }) }));
vi.mock('@/hooks/gam/useCourseMeta', () => ({ useCourseMeta: () => ({ data: null }) }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: () => ({ data: { rounds_tracked: 947 } }) }));
vi.mock('@/components/courses/course-detail/useCourseRecordSummary', () => ({ useCourseRecordSummary: () => ({ courseRecordHolders: f.holders }) }));
vi.mock('@/hooks/useCourseTop100Standing', () => ({ useCourseTop100Standing: () => ({ data: null }) }));
vi.mock('@/components/courses/course-detail/about/useHeroReferenceLine', () => ({ useHeroReferenceLine: () => 'Par 71 · 6,476 yds · 72.8 / 134 · 947 rounds' }));
vi.mock('@/features/chrome-v2/useIslandBackName', () => ({ useIslandBackName: () => {} }));
vi.mock('@/features/guest/guestGateStore', () => ({ setGuestCourseContext: () => {} }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/components/courses/course-detail/CourseAboutTab', () => ({ default: () => null }));
vi.mock('@/components/courses/course-detail/CourseReviewsTab', () => ({ default: () => null }));
vi.mock('@/components/course-media-tab/CourseMediaTabNew', () => ({ default: () => null }));
vi.mock('@/components/courses/course-detail/CourseYouTab', () => ({ default: () => null }));
vi.mock('@/components/profile/handicap/whs/sections/course-legends/CourseLegendsDrilldown', () => ({ CourseLegendsDrilldown: () => null }));
vi.mock('@/components/feed/CourseStatsSheet', () => ({ default: () => null }));
vi.mock('@/components/courses/course-detail/you/YourRoundsSheet', () => ({ default: () => null }));
vi.mock('@/components/courses/course-detail/you/YourHolesSheet', () => ({ default: () => null }));
vi.mock('@/features/chrome-v2/IslandDock', () => ({ IslandDock: () => null }));
vi.mock('@/features/courses/components/CourseDetailShellTabs', () => ({ default: () => null }));
vi.mock('@/components/courses/course-detail/CourseTabs', () => ({ CourseTabs: () => null }));

import GolfClubView from '@/components/golf-club/GolfClubView';
import { HeroCourseRecord } from '@/components/courses/course-detail/about/HeroCourseRecord';
const holder = (name: string, id: string): CourseLegendRow => ({ category: 'lowest_gross_all_time', rank: 1, user_id: id, user_display_name: name, user_photo_url: null, user_home_club: null, value: 65, attained_at: '', is_self: false, rank_30d: null, delta: null } as CourseLegendRow);
const course = { id: 'fixture', name: 'Sundridge Park Golf Club (East Course)', country: 'Britain & Ireland', sub_country: 'England', thumbnail_image: null };
function mountDetail(record: boolean, modal = false) {
  f.holders = record ? [holder('Lennon Hillwithanextremelylongsurname', 'a'), holder('Danny Holmes', 'b')] : [];
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  qc.setQueryData(['course-detail', 'fixture'], course);
  return render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={['/courses/fixture']}><GolfClubView courseId="fixture" isInModal={modal} /></MemoryRouter></QueryClientProvider>);
}
afterEach(cleanup);
describe('Course headers match the Tour material', () => {
  it('opts into26px zero-tracking title and unruled9px children', () => {
    const { container } = render(<CourseMasthead photoBand as="h1" kicker="England" name="Course" place="Britain & Ireland"><span data-child /></CourseMasthead>);
    const title = screen.getByRole('heading');
    expect(title.style.fontSize).toBe('26px'); expect(title.style.letterSpacing).toBe('0'); expect(title.style.lineHeight).toBe('1.1'); expect(title.style.fontWeight).toBe('800');
    expect((title.nextElementSibling as HTMLElement).style.marginTop).toBe('4px');
    expect((screen.getByText('England') as HTMLElement).style.marginBottom).toBe('4px');
    const child = container.querySelector('[data-child]')?.parentElement;
    expect(child?.style.marginTop).toBe('9px'); expect(child?.style.borderTop).toBe(''); expect(child?.style.paddingTop).toBe('');
  });
  it('preserves default masthead name and ruled child spacing', () => {
    const { container } = render(<CourseMasthead as="h1" kicker="England" name="Course" place="Britain & Ireland"><span data-child /></CourseMasthead>);
    const title = screen.getByRole('heading');
    expect(title.style.fontSize).not.toBe('26px'); expect(title.style.letterSpacing).toBe('-0.032em'); expect(title.style.lineHeight).toBe('0.99');
    expect((title.nextElementSibling as HTMLElement).style.marginTop).toBe('6px'); expect((screen.getByText('England') as HTMLElement).style.marginBottom).toBe('8px');
    expect(container.querySelector('[data-child]')?.parentElement?.style.borderTop).toContain('1px solid');
    expect(container.querySelector('[data-child]')?.parentElement?.style.marginTop).toBe('13px');
  });
  it.each([[false,false],[true,false],[false,true],[true,true]])('keeps detail340px and one canonical fade (record%s,modal%s)', (record, modal) => {
    const { container } = mountDetail(record, modal);
    const fade = container.querySelector('[data-photo-band-fade]');
    expect(container.querySelectorAll('[data-photo-band-fade]')).toHaveLength(1);
    expect(fade?.parentElement?.style.height).toBe('340px');
    const title = screen.getByRole('heading');
    expect(title.style.fontSize).toBe('26px');
    const overlay = title.closest('h1')?.parentElement?.parentElement?.parentElement?.parentElement;
    expect(overlay?.style.left).toBe('20px'); expect(overlay?.style.right).toBe('20px'); expect(overlay?.style.bottom).toBe('14px');
    expect(Boolean(screen.queryByText('Course record'))).toBe(record);
  });
  it('keeps gold record,24px hairline avatars and21px gross', () => {
    const { container } = render(<HeroCourseRecord holders={[holder('Lennon Hill', 'a')]} />);
    const label = screen.getByText('Course record'); const score = screen.getByText('65');
    const probe = document.createElement('div'); probe.style.color = MEDAL_GOLD;
    expect(label.style.color).toBe(probe.style.color); expect(score.style.color).toBe(probe.style.color);
    expect(label.style.fontSize).toBe('10px'); expect(label.style.letterSpacing).toBe('0.13em'); expect(score.style.fontSize).toBe('21px');
    expect(container.querySelector('[style*="24px"]')).not.toBeNull();
    expect((screen.getByText('Lennon Hill') as HTMLElement).style.fontSize).toBe('13.5px');
    expect((screen.getByText('Gross') as HTMLElement).style.marginTop).toBe('4px');
  });
  it('both source paths use only shared fade and the review hero opts in on its own canvas', () => {
    for (const path of ['src/components/golf-club/GolfClubView.tsx', 'src/components/courses/CoursesPageHero.tsx']) {
      const source = readFileSync(path,'utf8'); expect(source).not.toContain('HERO_CANON_WASH'); expect(source).not.toContain('SCRIM_HERO_TALL'); expect(source).toContain('<PhotoBandFade />');
    }
    // ALL_HEROES_MATCH §2: the review wizard's photo header joins the shared
    // band, with the fade ending on the wizard's own canvas colour.
    const reviewHero = readFileSync('src/features/review-v2/components/ReviewCourseHero.tsx','utf8');
    expect(reviewHero).toContain('<PhotoBandFade canvas={RV2.canvas} />');
    expect(reviewHero).toContain('photoBand');
  });
  it('captures actual mounted detail states for the320px browser check', () => {
    if (!process.env.COURSE_HERO_BROWSER) return;
    mkdirSync('/tmp/browser/course-heroes', { recursive: true });
    for (const record of [false,true]) { const { container } = mountDetail(record); writeFileSync(`/tmp/browser/course-heroes/detail-${record}.html`, container.innerHTML); cleanup(); }
  });
});