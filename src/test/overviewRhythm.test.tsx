import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import en from '../../public/locales/en/tourhub.json';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';
import type { ComingUpRow } from '@/features/tourhub/overview/data/useComingUp';
import type { TourStory } from '@/features/tourhub/news/useTourStories';

const state = vi.hoisted(() => ({ slides: [] as HeroSlide[], rows: [] as ComingUpRow[], stories: [] as TourStory[], tour: 'all', viewed: 'hero', read: vi.fn(), query: vi.fn(), from: vi.fn() }));
vi.mock('@/features/tourhub/hooks/useHeroCarouselData', () => ({ useHeroCarouselData: () => ({ data: state.slides }) }));
vi.mock('@/features/tourhub/context/TourSelectionContext', () => ({ useTourSelection: () => ({ selectedTourSlug: state.tour, viewingTournamentId: state.viewed, setAppliedTourSlug: () => {} }) }));
vi.mock('@/features/tourhub/overview/data/useComingUp', async orig => ({ ...(await orig<typeof import('@/features/tourhub/overview/data/useComingUp')>()), useComingUp: (...args: unknown[]) => { state.read(...args); return { data: state.rows }; } }));
vi.mock('@/features/tourhub/hooks/useBatchCourseImages', () => ({ useBatchCourseImages: () => ({ data: new Map() }) }));
vi.mock('@/features/tourhub/hooks/useTournamentLastYearTop4', () => ({ useTournamentLastYearTop4: () => ({ data: null }) }));
vi.mock('@/features/tourhub/overview/data/useComingUpOwnRounds', () => ({ useComingUpOwnRounds: () => undefined }));
vi.mock('@/features/tourhub/news/useTourStories', () => ({ useTourStories: () => ({ stories: state.stories }) }));
vi.mock('@/features/tourhub/overview/sections/useOverviewNewsData', () => ({ useOverviewNewsData: () => new Map() }));
vi.mock('@/features/tourhub/components/overview-v3/OverviewHero', () => ({ OverviewHero: () => <div data-order="hero" /> }));
vi.mock('@/features/tourhub/overview/sections/AlsoThisWeek', () => ({ AlsoThisWeek: () => <div data-order="week" /> }));
vi.mock('@/features/tourhub/overview/sections/WorldRankings', () => ({ WorldRankings: () => <div data-order="rankings" /> }));
vi.mock('@/features/tourhub/overview/sections/OverviewNews', async orig => ({ ...(await orig<typeof import('@/features/tourhub/overview/sections/OverviewNews')>()), OverviewNews: ({ excludeIds }: { excludeIds: string[] }) => <div data-order="news" data-excluded={excludeIds.join(',')} /> }));
vi.mock('@/hooks/useNetworkStatus', () => ({ useNetworkStatus: () => ({ isOnline: true }) }));
vi.mock('@/components/common/ScrollToTopGlass', () => ({ default: () => null }));
vi.mock('@/components/chrome/StickySafeAreaScrim', () => ({ StickySafeAreaScrim: () => null, useStickySafeAreaState: () => ({ sentinelRef: () => {}, stuck: false }) }));
vi.mock('@tanstack/react-query', async orig => ({ ...(await orig<Record<string, unknown>>()), useQuery: state.query }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: state.from } }));

import { selectOverviewEventsAbove } from '@/features/tourhub/overview/sections/overviewEventSelection';
import { selectComingUpRail } from '@/features/tourhub/overview/sections/ComingUp';
import { ComingUpSlot } from '@/features/tourhub/components/overview-v3/ComingUpSlot';
import { OverviewPhotoSlot } from '@/features/tourhub/components/overview-v3/OverviewPhotoSlot';
import { selectOverviewSlotStory } from '@/features/tourhub/overview/sections/StoryBand';
import { selectOverviewNews } from '@/features/tourhub/overview/sections/OverviewNews';
import { OverviewPageV3 } from '@/features/tourhub/components/tabs/OverviewPageV3';

const now = new Date('2026-11-04T12:00:00Z');
const i18n = i18next.createInstance();
void i18n.init({ lng: 'en', fallbackLng: 'en', initAsync: false, resources: { en: { tourhub: en } } });
const event = (id: string, start = '2026-11-12', purse: number | null = 6_000_000, tour: ComingUpRow['tour_slug'] = 'pga'): ComingUpRow => ({ id, name: id, start_date: start, end_date: start, venue: null, purse, tour_slug: tour, days_away: 8, field_size: null, defending_champion: null, isMajor: false, isPlayoff: false });
const slide = (id: string, type: HeroSlide['type'], startDate = '2026-11-05T12:00:00Z'): HeroSlide => ({ type, tournament: { id, startDate, endDate: '2026-11-03T12:00:00Z' } as HeroSlide['tournament'] });
const story = (id: string, tour = 'pga', published = '2026-11-03T12:00:00Z'): TourStory => ({ id, slug: id, headline: id, standfirst: 'Deck', kicker: 'Kicker', body_blocks: [], image_url: `/${id}.jpg`, image_credit: null, tour_slug: tour, tournament_id: null, published_at: published });
const mount = (node: React.ReactNode) => render(<I18nextProvider i18n={i18n}><MemoryRouter>{node}</MemoryRouter></I18nextProvider>);
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(now); state.tour = 'all'; state.viewed = 'hero'; state.slides = []; state.rows = []; state.stories = []; vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Overview rhythm event selection', () => {
  it('excludes every hero slide type and every displayed Also this week id', () => {
    const slides = [slide('hero', 'upcoming'), slide('live', 'live'), slide('final', 'completed'), slide('later', 'upcoming', '2026-11-19T12:00:00Z')];
    const above = selectOverviewEventsAbove(slides, 'hero', now);
    expect(above.alsoWeek.map(s => s.tournament.id)).toEqual(['live', 'final']);
    expect(above.usedIds).toEqual(['hero', 'live', 'final', 'later']);
    expect(selectComingUpRail([...above.usedIds.map(id => event(id)), event('next')], above.usedIds).map(e => e.id)).toEqual(['next']);
  });
  it('orders dates before purse size', () => {
    expect(selectComingUpRail([event('rich', '2026-11-19', 10_000_000), event('soon', '2026-11-12', 1)]).map(e => e.id)).toEqual(['soon', 'rich']);
  });
  it('puts the biggest same-day purse first and missing purse last', () => {
    expect(selectComingUpRail([event('missing', undefined, null), event('austin'), event('finale', undefined, 10_000_000, 'euro'), event('champ', undefined, 3_000_000, 'champ')]).map(e => e.id)).toEqual(['finale', 'austin', 'champ', 'missing']);
  });
  it('uses canonical tour order for equal purses', () => {
    expect(selectComingUpRail([event('champ', undefined, 3, 'champ'), event('euro', undefined, 3, 'euro'), event('pga', undefined, 3, 'pga')]).map(e => e.id)).toEqual(['pga', 'euro', 'champ']);
  });
  it('fills the next panel and four rows after all above-page exclusions', () => {
    state.slides = [slide('hero', 'upcoming'), slide('week', 'live'), slide('final', 'completed')];
    state.rows = [...state.slides.map(s => event(s.tournament.id)), ...Array.from({ length: 9 }, (_, i) => event(`next${i}`))];
    const { container } = mount(<ComingUpSlot />);
    expect(state.read).toHaveBeenCalledWith(null, 12);
    expect(container.querySelector('[data-coming-next]')).toHaveAttribute('data-coming-next', 'next0');
    expect([...container.querySelectorAll('[data-coming-up-item]')].map(e => e.getAttribute('data-coming-up-item'))).toEqual(['next1', 'next2', 'next3', 'next4']);
  });
  it('passes the selected tour lens unchanged to the twelve-event read', () => {
    state.tour = 'lpga'; mount(<ComingUpSlot />); expect(state.read).toHaveBeenCalledWith('lpga', 12);
  });
  it('next kicker includes a tag when comingTag supplies one', () => {
    state.rows = [{ ...event('finale'), name: 'DP World Tour Championship' }];
    const { container } = mount(<ComingUpSlot />);
    expect(container.querySelector('[data-coming-next] [data-coming-tag]')).toHaveAttribute('data-coming-tag', 'finale');
  });
  it('next kicker omits the chip when comingTag is absent', () => {
    state.rows = [event('ordinary')]; const { container } = mount(<ComingUpSlot />); expect(container.querySelector('[data-coming-tag]')).toBeNull();
  });
  it('catalogue sorts same-day purse ties before its twelve-event cap', async () => {
    const raw = Array.from({ length: 13 }, (_, i) => ({ ...event(`event${i}`, undefined, i), season: { tour_name: 'PGA Tour' } }));
    const chain = { select: () => chain, in: () => chain, gte: () => chain, order: () => chain, limit: vi.fn().mockResolvedValue({ data: raw, error: null }) };
    state.from.mockReturnValue(chain);
    const actual = await vi.importActual<typeof import('@/features/tourhub/overview/data/useComingUp')>('@/features/tourhub/overview/data/useComingUp');
    actual.useComingUp('pga', 12);
    const rows = await state.query.mock.calls[0][0].queryFn();
    expect(rows).toHaveLength(12); expect(rows[0].id).toBe('event12'); expect(rows.some((r: ComingUpRow) => r.id === 'event0')).toBe(false);
  });
});

describe('Overview rhythm story slot', () => {
  it('prefers the freshest different-tour story even over a newer same-tour story', () => {
    expect(selectOverviewSlotStory([story('same'), story('older', 'lpga', '2026-11-01T12:00:00Z'), story('different', 'lpga', '2026-11-02T12:00:00Z')], [], 'pga', now)?.id).toBe('different');
  });
  it('falls back to the freshest any-tour story', () => {
    expect(selectOverviewSlotStory([story('older', 'pga', '2026-11-01T12:00:00Z'), story('fresh')], [], 'pga', now)?.id).toBe('fresh');
  });
  it('excludes the first band story', () => {
    expect(selectOverviewSlotStory([story('band', 'lpga'), story('remaining')], ['band'], 'pga', now)?.id).toBe('remaining');
  });
  it('excludes stories older than seven days', () => {
    expect(selectOverviewSlotStory([story('stale', 'lpga', '2026-10-28T11:59:59Z')], [], 'pga', now)).toBeNull();
  });
  it('includes a story exactly seven days old', () => {
    expect(selectOverviewSlotStory([story('boundary', 'lpga', '2026-10-28T12:00:00Z')], [], 'pga', now)?.id).toBe('boundary');
  });
  it('withholds future and undated stories', () => {
    expect(selectOverviewSlotStory([{ ...story('undated'), published_at: null }, story('future', 'lpga', '2026-11-05T12:00:00Z')], [], 'pga', now)).toBeNull();
  });
  it('withholds unphotographed stories', () => {
    expect(selectOverviewSlotStory([{ ...story('bare'), image_url: null }], [], 'pga', now)).toBeNull();
  });
  it('empty content leaves no slot element between its siblings', () => {
    const { container } = mount(<div><span data-sibling="before" /><OverviewPhotoSlot content={null} /><span data-sibling="after" /></div>);
    expect(container.querySelector('[data-sibling="before"]')?.nextElementSibling).toBe(container.querySelector('[data-sibling="after"]'));
  });
  it('failed photo removes the shared band without an empty flex item', () => {
    const { container } = mount(<OverviewPhotoSlot content={{ kind: 'story', story: story('photo') }} />);
    const image = container.querySelector('img'); if (!image) throw Error('Missing photo'); fireEvent.error(image);
    expect(container.children).toHaveLength(0);
  });
  it('News excludes both bands while keeping six-story composition', () => {
    const selection = selectOverviewNews([story('band'), story('slot'), ...Array.from({ length: 7 }, (_, i) => story(`news${i}`))], ['band', 'slot']);
    expect(selection.hero?.id).toBe('news0'); expect(selection.features.map(s => s.id)).toEqual(['news1', 'news2']); expect(selection.rows.map(s => s.id)).toEqual(['news3', 'news4', 'news5']);
  });
  it('page order is hero band week coming-up slot rankings News', () => {
    state.stories = [{ ...story('band'), tournament_id: 'hero' }, story('slot', 'lpga')]; state.rows = [event('next')];
    const { container } = mount(<OverviewPageV3 />);
    expect([...container.querySelectorAll('[data-order], [data-overview-story-band], .coming-up')].map(e => e.getAttribute('data-order') ?? e.getAttribute('data-overview-story-band') ?? 'coming-up')).toEqual(['hero', 'band', 'week', 'coming-up', 'slot', 'rankings', 'news']);
    expect(container.querySelector('[data-order="news"]')).toHaveAttribute('data-excluded', 'band,slot');
  });
  it('slot uses the News tour lens while first band selection stays unchanged', () => {
    state.tour = 'lpga'; state.stories = [{ ...story('band'), tournament_id: 'hero' }, story('unrelated', 'euro'), story('lpga', 'lpga')];
    const { container } = mount(<OverviewPageV3 />);
    expect(container.querySelector('[data-overview-photo-slot]')).toHaveAttribute('data-overview-photo-slot', 'lpga');
    expect(container.querySelector('[data-overview-story-band]')).toHaveAttribute('data-overview-story-band', 'band');
  });
  it('page has no slot when no fresh unused story remains', () => {
    state.stories = [{ ...story('band'), tournament_id: 'hero' }];
    const { container } = mount(<OverviewPageV3 />);
    expect(container.querySelector('[data-overview-photo-slot]')).toBeNull();
    expect(container.querySelector('[data-order="week"]')?.nextElementSibling).toBe(container.querySelector('[data-order="rankings"]'));
  });
});