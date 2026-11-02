import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import courses from '../../public/locales/en/courses.json';

/* ---------------------------------------------------------------- mocks */

const f = vi.hoisted(() => ({
  creators: { data: [] as unknown[], isFetched: true, isError: false },
  creatorsSheet: { data: [] as unknown[], isFetched: true, isError: false },
  lead: { data: null as unknown, isFetched: true, isError: false },
  moments: { data: [] as unknown[], isFetched: true, isError: false, refetch: vi.fn() },
  track: vi.fn(),
  openWithOrigin: vi.fn(),
  registerRailVideo: vi.fn(() => () => {}),
  attachTileHls: vi.fn(() => ({ detach: vi.fn() })),
  follow: { mutateAsync: vi.fn(() => Promise.resolve()) },
}));

/* WatchFeed's own reads, so the feed renders with no network. */
vi.mock('@/features/explore-magazine/watch/useWatchVideos', () => ({
  useWatchVideos: () => ({ data: { pages: [[]] }, isFetched: true, isError: false, hasNextPage: false, isFetchingNextPage: false, refetch: vi.fn(), fetchNextPage: vi.fn() }),
}));
vi.mock('@/features/explore-magazine/watch/useWatchClips', () => ({
  useWatchClips: () => ({ data: { pages: [[]] }, isFetched: true, isError: false, hasNextPage: false, isFetchingNextPage: false, refetch: vi.fn(), fetchNextPage: vi.fn() }),
}));
vi.mock('@/features/explore-magazine/watch/useWatchSignals', () => ({ useWatchProgress: () => ({ data: new Map() }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek', () => ({
  useMomentsOfTheWeek: () => f.moments,
}));
vi.mock('@/hooks/gam/useUserAnalyticsCourses', () => ({ useUserAnalyticsCourses: () => ({ data: [] }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/components/clubhouse/hooks/useClubhouseLikes', () => ({
  useClubhouseLikes: () => ({ handleLike: vi.fn(), getActiveLikeState: () => ({ isLiked: false, count: 0 }) }),
}));
vi.mock('@/components/explore-tab-new/courseled/MomentTile', () => ({ MomentTile: () => <div data-testid="moment-tile" /> }));

/* WS1 reads. */
vi.mock('@/features/explore-magazine/watch/useFeaturedCreators', () => ({
  useFeaturedCreators: (limit: number) => (limit === 50 ? f.creatorsSheet : f.creators),
}));
vi.mock('@/features/explore-magazine/watch/useWatchLead', () => ({ useWatchLead: () => f.lead }));

/* Presentation dependencies. */
vi.mock('@/components/ui/SquircleAvatar', () => ({
  SquircleAvatar: (p: { src?: string | null; fallback?: string; alt?: string }) => (
    <span data-sq-avatar data-src={p.src ?? ''} data-alt={p.alt ?? ''}>{p.src ? 'img' : p.fallback}</span>
  ),
}));
vi.mock('@/components/ui/BottomSheet', () => ({
  BottomSheet: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="bottom-sheet">{children}</div> : null,
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/hooks/useToggleFollow', () => ({ useToggleFollow: () => f.follow }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: f.openWithOrigin }));
vi.mock('@/components/explore-tab-new/courseled/mediaRailAutoplay', () => ({
  registerRailVideo: f.registerRailVideo,
  IN_VIEW_THRESHOLD: 0.6,
  MAX_PLAYING: 1,
}));
vi.mock('@/components/explore-tab-new/courseled/tileHlsPlayer', () => ({ attachTileHls: f.attachTileHls }));
vi.mock('@/components/explore-tab-new/courseled/reviewVideoAutoplay', () => ({ autoplayBlocked: () => false, deliverVerdict: vi.fn() }));
vi.mock('@/hooks/usePrefersReducedMotion', () => ({ usePrefersReducedMotion: () => false }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: f.track } }));

import { WatchFeed } from '@/features/explore-magazine/watch/WatchFeed';
import { resetCreatorsRowSessionForTests } from '@/features/explore-magazine/watch/CreatorsRow';
import { resetWatchLeadSessionForTests } from '@/features/explore-magazine/watch/WatchLead';
import {
  CREATORS_MIN,
  CREATORS_SEE_ALL_MAX,
  creatorSecondLine,
  leadCaption,
  leadKickerKey,
  leadShape,
  showsCreatorsRow,
  showsCreatorsSeeAll,
} from '@/features/explore-magazine/watch/watchTopRules';
import { mapWatchFilter, WATCH_CHIPS } from '@/features/explore-magazine/watch/watchFilters';
import type { FeaturedCreator } from '@/features/explore-magazine/watch/useFeaturedCreators';
import type { WatchLeadRow } from '@/features/explore-magazine/watch/useWatchLead';

/* ------------------------------------------------------------- fixtures */

const i18n = createInstance();
void i18n.init({ lng: 'en', initAsync: false, interpolation: { escapeValue: false }, resources: { en: { courses } } });

/* A controllable IntersectionObserver so view events can be fired by hand. */
const ioCallbacks: IntersectionObserverCallback[] = [];
class ControllableIO {
  constructor(cb: IntersectionObserverCallback) {
    ioCallbacks.push(cb);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = '';
  thresholds = [0];
}
const fireVisible = () => {
  for (const cb of ioCallbacks) cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
};

function LocationEcho() {
  const loc = useLocation();
  return <div data-testid="loc" data-path={loc.pathname} />;
}

function mountFeed(initialFilter?: string) {
  return render(
    <MemoryRouter initialEntries={['/amateur']}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  <WatchFeed userId="me" onDepart={() => {}} initialFilter={initialFilter} />
                  <LocationEcho />
                </>
              }
            />
          </Routes>
        </QueryClientProvider>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const creator = (id: string, over: Partial<FeaturedCreator> = {}): FeaturedCreator => ({
  actor_type: 'personal',
  actor_id: id,
  display_name: `Name ${id}`,
  handle: `h-${id}`,
  avatar_url: null,
  is_verified: false,
  area: null,
  videos_7d: 0,
  latest_video_at: null,
  sort_order: 0,
  ...over,
});

const leadRow = (over: Partial<WatchLeadRow> = {}): WatchLeadRow => ({
  post_id: 'p1',
  reason: 'creator_new',
  actor_type: 'personal',
  actor_id: 'u1',
  display_name: 'Jay Kelly',
  handle: 'jayk',
  avatar_url: null,
  is_verified: true,
  caption: 'Simple shallowing drill, three reps a day',
  media_url: null,
  hls_url: 'https://example.com/lead.m3u8',
  poster_url: 'https://example.com/poster.jpg',
  stream_id: null,
  duration_seconds: 41,
  width: 1080,
  height: 1920,
  like_count: 48,
  comment_count: 3,
  created_at: daysAgo(2),
  course_id: 'c1',
  course_name: "Royal St George's Golf Club",
  ...over,
});

beforeEach(() => {
  f.creators = { data: [], isFetched: true, isError: false };
  f.creatorsSheet = { data: [], isFetched: true, isError: false };
  f.lead = { data: null, isFetched: true, isError: false };
  f.moments = { data: [], isFetched: true, isError: false, refetch: vi.fn() };
  f.track.mockClear();
  f.openWithOrigin.mockClear();
  f.registerRailVideo.mockClear();
  f.attachTileHls.mockClear();
  f.follow.mutateAsync.mockClear();
  ioCallbacks.length = 0;
  Object.defineProperty(window, 'IntersectionObserver', { writable: true, configurable: true, value: ControllableIO });
  resetCreatorsRowSessionForTests();
  resetWatchLeadSessionForTests();
});

afterEach(() => cleanup());

/* ---------------------------------------------------------------- chips */

describe('WS1 chips', () => {
  it('reads For you · Shorts · Long form, in that order, with no Community chip', () => {
    mountFeed();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['For you', 'Shorts', 'Long form']);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('maps the old values: all → For you, quick → Shorts, community → For you', () => {
    expect(mapWatchFilter('all')).toBe('all');
    expect(mapWatchFilter('quick')).toBe('quick');
    expect(mapWatchFilter('long')).toBe('long');
    expect(mapWatchFilter('community')).toBe('all');
    expect(mapWatchFilter(null)).toBe('all');
    expect(WATCH_CHIPS).toEqual(['all', 'quick', 'long']);
  });

  it('a linked community entry lands on For you', () => {
    mountFeed('community');
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['For you', 'Shorts', 'Long form']);
  });

  it('a linked quick entry lands on Shorts', () => {
    mountFeed('quick');
    const tabs = screen.getAllByRole('tab');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });

  it('the community rail is still in For you', () => {
    f.moments = {
      data: [{ key: 'm1', post: { userId: 'u1', displayName: 'Ann' }, courseName: 'Rosapenna' }],
      isFetched: true,
      isError: false,
      refetch: vi.fn(),
    };
    mountFeed();
    expect(screen.getByText('From the community')).toBeTruthy();
  });

  it('the search placeholder reads Search videos and creators', () => {
    mountFeed();
    expect(screen.getByPlaceholderText('Search videos and creators')).toBeTruthy();
  });

  it('a chip tap fires watch_chip_changed with from and to, keeping the existing event', () => {
    mountFeed();
    fireEvent.click(screen.getByRole('tab', { name: 'Shorts' }));
    expect(f.track).toHaveBeenCalledWith('watch_chip_changed', { from: 'all', to: 'quick' });
    expect(f.track).toHaveBeenCalledWith('amateur_watch_filter_changed', { filter: 'quick', searching: false });
  });
});

/* ------------------------------------------------------------- creators */

describe('WS1 Creators row', () => {
  it('hides, heading included, when the read returns fewer than three', () => {
    f.creators = { data: [creator('a'), creator('b')], isFetched: true, isError: false };
    mountFeed();
    expect(screen.queryByText('Creators')).toBeNull();
    expect(screen.queryByText('See all')).toBeNull();
  });

  it('shows the skeleton while loading: the heading place plus five squircles', () => {
    f.creators = { data: [], isFetched: false, isError: false };
    const { container } = mountFeed();
    const skeleton = container.querySelector('[data-watch-creators="skeleton"]');
    expect(skeleton).toBeTruthy();
    expect(skeleton!.querySelectorAll('span').length).toBe(5);
  });

  it('See all appears only when the read returns more than eight', () => {
    f.creators = { data: Array.from({ length: 8 }, (_, i) => creator(`c${i}`)), isFetched: true, isError: false };
    const eight = mountFeed();
    expect(screen.queryByText('See all')).toBeNull();
    eight.unmount();
    f.creators = { data: Array.from({ length: 9 }, (_, i) => creator(`c${i}`)), isFetched: true, isError: false };
    mountFeed();
    expect(screen.getByText('See all')).toBeTruthy();
  });

  it('a creator with a video this week wears the ring and reads "{n} this week"', () => {
    f.creators = {
      data: [creator('a', { videos_7d: 2 }), creator('b'), creator('c')],
      isFetched: true,
      isError: false,
    };
    const { container } = mountFeed();
    expect(screen.getByText('2 this week')).toBeTruthy();
    expect(container.querySelectorAll('[data-creator-ring="true"]').length).toBe(1);
  });

  it('otherwise the second line is the area through shortCourseName, omitted when null', () => {
    f.creators = {
      data: [
        creator('a', { area: 'Royal County Down Golf Club (Championship)' }),
        creator('b'),
        creator('c'),
      ],
      isFetched: true,
      isError: false,
    };
    const { container } = mountFeed();
    expect(screen.getByText('Royal County Down · Championship')).toBeTruthy();
    expect(container.querySelectorAll('[data-creator-line="area"]').length).toBe(1);
  });

  it('a person with no photo gets initials; a business with no logo gets the black name tile', () => {
    f.creators = {
      data: [
        creator('a', { display_name: 'Danny Holmes' }),
        creator('b', { actor_type: 'business', display_name: 'Golf Life', handle: 'golf-life' }),
        creator('c', { avatar_url: 'https://example.com/a.jpg' }),
      ],
      isFetched: true,
      isError: false,
    };
    const { container } = mountFeed();
    const tile = container.querySelector('[data-creator-avatar="business-tile"]');
    expect(tile?.textContent).toBe('Golf Life');
    const avatars = container.querySelectorAll('[data-sq-avatar]');
    expect(avatars[0].textContent).toBe('D');
    expect(avatars[1].textContent).toBe('img');
  });

  it('taps route to the profile for a person and /business/{slug} for a business', () => {
    f.creators = {
      data: [
        creator('a', { handle: 'jayk' }),
        creator('b', { actor_type: 'business', display_name: 'Golf Life', handle: 'golf-life' }),
        creator('c'),
      ],
      isFetched: true,
      isError: false,
    };
    mountFeed();
    fireEvent.click(screen.getByText('Name a'));
    expect(screen.getByTestId('loc').getAttribute('data-path')).toBe('/profile/jayk');
    fireEvent.click(screen.getByText('Golf Life'));
    expect(screen.getByTestId('loc').getAttribute('data-path')).toBe('/business/golf-life');
    expect(f.track).toHaveBeenCalledWith('watch_creator_tapped', { actor_type: 'business', position: 2 });
  });

  it('See all opens the sheet, which lists every creator and follows through useToggleFollow', async () => {
    const nine = Array.from({ length: 9 }, (_, i) => creator(`c${i}`));
    f.creators = { data: nine, isFetched: true, isError: false };
    f.creatorsSheet = { data: [...nine, creator('extra')], isFetched: true, isError: false };
    mountFeed();
    fireEvent.click(screen.getByText('See all'));
    expect(f.track).toHaveBeenCalledWith('watch_creators_see_all');
    const sheet = screen.getByTestId('bottom-sheet');
    expect(within(sheet).getByText('Name extra')).toBeTruthy();
    fireEvent.click(within(sheet).getAllByText('Follow')[0]);
    await vi.waitFor(() => {
      expect(f.follow.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ targetActorType: 'personal', targetActorId: 'c0' }),
      );
    });
  });

  it('watch_creators_viewed fires once per session at 50% visible', () => {
    f.creators = { data: [creator('a'), creator('b'), creator('c')], isFetched: true, isError: false };
    mountFeed();
    fireVisible();
    expect(f.track).toHaveBeenCalledWith('watch_creators_viewed');
    fireVisible();
    expect(f.track.mock.calls.filter(([name]) => name === 'watch_creators_viewed').length).toBe(1);
  });
});

/* ----------------------------------------------------------------- lead */

describe('WS1 lead', () => {
  it('is hidden when the read returns no row', () => {
    const { container } = mountFeed();
    expect(container.querySelector('[data-watch-lead]')).toBeNull();
  });

  it('shows a 440px skeleton while loading and collapses when it resolves to nothing', () => {
    f.lead = { data: null, isFetched: false, isError: false };
    const { container, rerender } = mountFeed();
    const skeleton = container.querySelector('[data-watch-lead="skeleton"]');
    expect(skeleton).toBeTruthy();
    expect((skeleton as HTMLElement).style.height).toBe('440px');
    f.lead = { data: null, isFetched: true, isError: false };
    rerender(
      <MemoryRouter initialEntries={['/amateur']}>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <Routes>
              <Route path="*" element={<WatchFeed userId="me" onDepart={() => {}} />} />
            </Routes>
          </QueryClientProvider>
        </I18nextProvider>
      </MemoryRouter>,
    );
    expect(container.querySelector('[data-watch-lead]')).toBeNull();
  });

  it('is upright when taller than wide or when a dimension is missing, landscape otherwise', () => {
    expect(leadShape(1080, 1920)).toBe('upright');
    expect(leadShape(1920, 1080)).toBe('landscape');
    expect(leadShape(null, 1080)).toBe('upright');
    expect(leadShape(1080, null)).toBe('upright');
    expect(leadShape(null, null)).toBe('upright');
  });

  it('renders the upright shape with kicker, duration, caption and meta over the media', () => {
    f.lead = { data: leadRow(), isFetched: true, isError: false };
    const { container } = mountFeed();
    expect(container.querySelector('[data-watch-lead="upright"]')).toBeTruthy();
    expect(screen.getByText('New this week')).toBeTruthy();
    expect(screen.getByText('0:41')).toBeTruthy();
    expect(screen.getByText('Simple shallowing drill, three reps a day')).toBeTruthy();
    expect(screen.getByText('48 likes · 2d')).toBeTruthy();
    expect(screen.getByText("Royal St George's")).toBeTruthy();
  });

  it('renders the landscape shape with the words underneath and the duration on the media', () => {
    f.lead = { data: leadRow({ width: 1920, height: 1080, duration_seconds: 1490 }), isFetched: true, isError: false };
    const { container } = mountFeed();
    const lead = container.querySelector('[data-watch-lead="landscape"]');
    expect(lead).toBeTruthy();
    expect(screen.getByText('24:50')).toBeTruthy();
    expect(within(lead as HTMLElement).getByText(/Jay Kelly ✓ · 48 likes · 2d/)).toBeTruthy();
  });

  it('the kicker reads Most liked this month when the reason is most_liked', () => {
    f.lead = { data: leadRow({ reason: 'most_liked' }), isFetched: true, isError: false };
    mountFeed();
    expect(screen.getByText('Most liked this month')).toBeTruthy();
  });

  it('an empty caption falls back to the course name, then to no caption line', () => {
    f.lead = { data: leadRow({ caption: null }), isFetched: true, isError: false };
    const { container, unmount } = mountFeed();
    expect(container.querySelector('[data-watch-lead="caption"]')?.textContent).toBe("Royal St George's Golf Club");
    unmount();
    f.lead = { data: leadRow({ caption: null, course_name: null, course_id: null }), isFetched: true, isError: false };
    const again = mountFeed();
    expect(again.container.querySelector('[data-watch-lead="caption"]')).toBeNull();
  });

  it('the media tap opens the post in the existing fullscreen viewer', () => {
    f.lead = { data: leadRow(), isFetched: true, isError: false };
    mountFeed();
    fireEvent.click(screen.getByRole('button', { name: 'Simple shallowing drill, three reps a day' }));
    expect(f.track).toHaveBeenCalledWith('watch_lead_opened', { reason: 'creator_new' });
    expect(f.openWithOrigin).toHaveBeenCalledWith(
      expect.objectContaining({ index: 0, openedFrom: 'amateur-watch', forceStartAtZero: true }),
    );
    const posts = f.openWithOrigin.mock.calls[0][0].posts;
    expect(posts.length).toBe(1);
  });

  it('the who row opens the creator and the course chip opens the course', () => {
    f.lead = { data: leadRow(), isFetched: true, isError: false };
    mountFeed();
    fireEvent.click(screen.getByText('Jay Kelly'));
    expect(screen.getByTestId('loc').getAttribute('data-path')).toBe('/profile/jayk');
    fireEvent.click(screen.getByText("Royal St George's"));
    expect(screen.getByTestId('loc').getAttribute('data-path')).toBe('/courses/c1');
  });

  it('the mute button toggles sound for this card only', () => {
    f.lead = { data: leadRow(), isFetched: true, isError: false };
    mountFeed();
    const mute = screen.getByRole('button', { name: 'Unmute' });
    expect(mute.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(mute);
    expect(screen.getByRole('button', { name: 'Mute' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('plays through the page’s shared one-stream coordinator', () => {
    f.lead = { data: leadRow(), isFetched: true, isError: false };
    mountFeed();
    expect(f.registerRailVideo).toHaveBeenCalledTimes(1);
  });

  it('watch_lead_viewed fires once per session with reason and shape', () => {
    f.lead = { data: leadRow(), isFetched: true, isError: false };
    mountFeed();
    fireVisible();
    expect(f.track).toHaveBeenCalledWith('watch_lead_viewed', { reason: 'creator_new', shape: 'upright' });
    fireVisible();
    expect(f.track.mock.calls.filter(([name]) => name === 'watch_lead_viewed').length).toBe(1);
  });
});

/* ------------------------------------------------------- chip scoping */

describe('WS1 scoping', () => {
  it('neither block renders on the Shorts or Long form chips', () => {
    f.creators = { data: [creator('a'), creator('b'), creator('c')], isFetched: true, isError: false };
    f.lead = { data: leadRow(), isFetched: true, isError: false };
    const { container } = mountFeed();
    expect(container.querySelector('[data-watch-creators="row"]')).toBeTruthy();
    expect(container.querySelector('[data-watch-lead="upright"]')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Shorts' }));
    expect(container.querySelector('[data-watch-creators="row"]')).toBeNull();
    expect(container.querySelector('[data-watch-lead]')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Long form' }));
    expect(container.querySelector('[data-watch-creators="row"]')).toBeNull();
    expect(container.querySelector('[data-watch-lead]')).toBeNull();
  });
});

/* ------------------------------------------------------------ pure rules */

describe('WS1 pure rules', () => {
  it('the row shows at three creators and See all above eight', () => {
    expect(CREATORS_MIN).toBe(3);
    expect(CREATORS_SEE_ALL_MAX).toBe(8);
    expect(showsCreatorsRow(2)).toBe(false);
    expect(showsCreatorsRow(3)).toBe(true);
    expect(showsCreatorsSeeAll(8)).toBe(false);
    expect(showsCreatorsSeeAll(9)).toBe(true);
  });

  it('the second line is "{n} this week", else the area, else nothing', () => {
    expect(creatorSecondLine(2, 'Kent')).toEqual({ kind: 'week', count: 2 });
    expect(creatorSecondLine(0, 'Royal County Down Golf Club (Championship)')).toEqual({
      kind: 'area',
      area: 'Royal County Down · Championship',
    });
    expect(creatorSecondLine(0, null)).toBeNull();
  });

  it('the caption falls back to the course name, then to nothing', () => {
    expect(leadCaption('  A drill  ', 'Course')).toBe('A drill');
    expect(leadCaption(null, 'Course')).toBe('Course');
    expect(leadCaption('', '')).toBeNull();
    expect(leadCaption(null, null)).toBeNull();
  });

  it('the kicker key follows the reason, unknown reading as new', () => {
    expect(leadKickerKey('creator_new')).toBe('new');
    expect(leadKickerKey('most_liked')).toBe('liked');
    expect(leadKickerKey('anything-else')).toBe('new');
  });
});
