import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import en from '../../public/locales/en/courses.json';
import { legendCategoryLabel } from '@/lib/gam/visuals';
import { pickProBenchmark } from '@/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/proBenchmark';
import { insightFor } from '@/components/explore-tab-new/friendRoundParts';
import { headlineFor } from '@/features/explore-magazine/exploreCopy';
import { AchievementCalloutPanel } from '@/features/explore-magazine/AchievementCallout';
import { PeopleShelf } from '@/features/explore-magazine/PeopleShelf';

vi.mock('@/hooks/gam/useFeatRarity', () => ({ useFeatLinesFor: () => null }));
vi.mock('@/features/explore-magazine/useClubGolfers', () => ({ useClubGolfers: () => ({ isFetched: true, golfers: [{ userId: 'woman', name: 'Ann', username: 'ann', photoUrl: null, roundsHere: 3, isNew: false, recordCategories: ['lowest_gross_women_all_time'] }] }) }));
vi.mock('@/features/social-suggestions/useSuggestedGolfers', () => ({ useSuggestedGolfers: () => ({ data: [], isFetched: true }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => ({ mutate: vi.fn(), isPending: false }) }));
vi.mock('@/features/pro-verification/InlineProMemberName', () => ({ InlineProMemberName: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

const t = (_key: string, fallback = '', vars: Record<string, unknown> = {}) =>
  fallback.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => String(vars[key] ?? ''));

async function mount(node: React.ReactNode, translated: boolean) {
  const i18n = createInstance();
  await i18n.init({ lng: 'en', fallbackLng: 'en', defaultNS: 'courses', resources: { en: { courses: translated ? en : {} } }, interpolation: { escapeValue: false } });
  return render(<I18nextProvider i18n={i18n}><MemoryRouter>{node}</MemoryRouter></I18nextProvider>);
}

describe('RC3 member-best wording', () => {
  it.each(['lowest_gross_women_90d', 'lowest_gross_women_all_time'] as const)('women’s category %s', category => {
    expect(legendCategoryLabel[category]).toBe("Women's best on clbhouz");
  });
  it.each([false, true])('women’s shelf reason, locale loaded: %s', async translated => {
    const { container } = await mount(<PeopleShelf viewerId="viewer" clubId="club" clubName="Club" enabled pos={1} />, translated);
    expect(container.textContent).toContain("Women's best on clbhouz here");
  });
  it.each([false, true])('gross achievement, locale loaded: %s', async translated => {
    const { container } = await mount(<AchievementCalloutPanel callout={{ kind: 'record', margin: null }} locale="en" />, translated);
    expect(container.textContent).toContain('New best on clbhouz');
  });
  it.each([false, true])('net achievement, locale loaded: %s', async translated => {
    const { container } = await mount(<AchievementCalloutPanel callout={{ kind: 'net_record' }} locale="en" />, translated);
    expect(container.textContent).toContain('New net best on clbhouz');
  });
  it('friends insight uses the member-best noun', () => {
    expect(insightFor({ is_course_record: true } as never, (_key, opts) => String(opts?.defaultValue ?? ''))?.text).toBe('A new best on clbhouz here');
  });
  it('benchmark retains its measured gap and pro prediction', () => {
    const result = pickProBenchmark({ pros: [{ slug: 'ann', full_name: 'Ann Golfer', initials: 'AG', tour_code: 'pga', scoring_avg: 70, birdies_per_round: 4, eagles_per_round: 0.1, tour_cr_baseline: 72 }], courseId: 'course', course: { cr: 72, slope: 113, par: 72, yards: 7200 }, viewerRounds: 1, eligibleBases: ['lowest_gross'], recordGross: 73, visitN: 0, courseName: 'Club' });
    expect(result?.chaseLine).toBe("The best on clbhouz is 3 shy of Ann's predicted 70");
  });
  it.each([
    ['amateur.stream.kicker.courseRecord', 'Best on clbhouz'],
    ['amateur.stream.list.eventRecord', 'New best on clbhouz'],
    ['courseDetail.featured.courseRecord', 'Best on clbhouz'],
    ['courseDetail.featured.courseRecordJoint', 'Joint best on clbhouz'],
    ['discover.golfThisWeek.moment.label.courseRecord', 'Best on clbhouz'],
  ])('English value %s', (key, expected) => {
    const value = key.split('.').reduce<unknown>((node, part) => node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined, en);
    expect(value).toBe(expected);
  });
  it.each([
    [false, null, null, 'Ann took the best on clbhouz with a 68.'],
    [false, -4, null, 'Ann took the best on clbhouz with a 68, four under par.'],
    [false, -4, 71, 'Ann took the best on clbhouz with a 68, four under par. Your best here is 71.'],
    [true, null, null, 'You took the best on clbhouz with a 68.'],
    [true, -4, null, 'You took the best on clbhouz with a 68, four under par.'],
  ] as const)('record-taken headline own=%s par=%s best=%s', (own, par, best, expected) => {
    expect(headlineFor({ kind: 'round', subject: {}, who: { display_name: 'Ann', is_viewer: own }, facts: { gross: 68, to_par: par, is_course_record: true } } as never, t, 'en', { viewerBest: best })).toBe(expected);
  });
  it('record-lost headline retains the viewer best without a date', () => {
    expect(headlineFor({ kind: 'round', subject: {}, who: { display_name: 'Ann' }, facts: { gross: 68 }, consequence: { kind: 'record_lost' } } as never, t, 'en', { viewerBest: 71 })).toBe('Ann took the clbhouz best here from you with a 68. Your best here is 71.');
  });
});