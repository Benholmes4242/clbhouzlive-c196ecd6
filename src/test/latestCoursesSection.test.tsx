import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const f = vi.hoisted(() => ({
  rows: [] as import('@/components/courses/browse/LatestCoursesSection').LatestCourseMedia[],
  loading: false,
  error: false,
  rpc: vi.fn(),
  gallery: { data: undefined as unknown, isError: false },
  open: vi.fn(),
  viewer: vi.fn(),
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/hooks/gam/_useGamRpc', () => ({ useGamRpc: (...args: unknown[]) => { f.rpc(...args); return { data: f.rows, isLoading: f.loading, isError: f.error }; } }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia', () => ({ useGalleryCourseMedia: () => f.gallery }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: (...args: unknown[]) => f.open(...args) }));
vi.mock('@/components/shared/media/MediaPreviewViewer', () => ({
  MediaPreviewViewer: (props: unknown) => { f.viewer(props); return null; },
}));

import { LatestCoursesSection, type LatestCourseMedia, type LatestCourseMediaTile } from '@/components/courses/browse/LatestCoursesSection';

const tile = (id: string, over: Partial<LatestCourseMediaTile> = {}): LatestCourseMediaTile => ({
  post_id: `post-${id}`, media_id: `media-${id}`, media_type: 'image', media_url: `/${id}.jpg`,
  poster_url: null, stream_id: null, duration_seconds: null, created_at: '2026-10-20T12:00:00Z', ...over,
});
const course = (id: string, over: Partial<LatestCourseMedia> = {}): LatestCourseMedia => ({
  course_id: `course-${id}`, course_name: `Course ${id}`, media_count: 14, contributor_count: 3,
  latest_member_name: 'Mark Eldridge', tiles: [tile(`${id}-1`), tile(`${id}-2`), tile(`${id}-3`)], ...over,
});

const shot = (id: string, over: Record<string, unknown> = {}) => ({
  id, type: 'image', imageUrl: `/${id}.jpg`, ...over,
});
const post = (id: string, mediaItems: unknown[], over: Record<string, unknown> = {}) => ({
  id, displayName: 'Thomas Holmes', createdAt: '2026-03-11T12:00:00Z', mediaItems, ...over,
});

const lastViewer = () => f.viewer.mock.calls[f.viewer.mock.calls.length - 1][0] as {
  items: Array<{ id: string; type: string; previewUrl: string; thumbnailUrl?: string; hlsUrl?: string; caption?: { kicker: string; title: string; credit?: string } }>;
  initialIndex: number;
  edgeBounce?: boolean;
};

beforeEach(() => {
  vi.clearAllMocks();
  f.rows = [course('alpha'), course('beta'), course('gamma')];
  f.loading = false;
  f.error = false;
  f.gallery = { data: undefined, isError: false };
});
afterEach(cleanup);

function mount() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<MemoryRouter><QueryClientProvider client={cache}><LatestCoursesSection /></QueryClientProvider></MemoryRouter>);
}

describe('BRIEF_COURSES_LATEST_FROM_COURSES Latest from the courses', () => {
  it.each([0, 1, 2])('fewer than three rows renders nothing (%i)', count => {
    f.rows = f.rows.slice(0, count);
    mount();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('loading draws the shell without interactive cards', () => {
    f.loading = true;
    const view = mount();
    expect(view.container.querySelector('section[aria-hidden]')).not.toBeNull();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('an RPC error hides even cached rows', () => {
    f.error = true;
    mount();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('renders the head and the big figure with its label, name and credit', () => {
    mount();
    expect(screen.getByText("Through members' eyes")).toBeInTheDocument();
    expect(screen.getByText('Latest from the courses')).toBeInTheDocument();
    expect(screen.getAllByText('14')).toHaveLength(3);
    expect(screen.getAllByText('Member shots')).toHaveLength(3);
    expect(screen.getByText('Course alpha')).toBeInTheDocument();
    expect(screen.getAllByText('Mark Eldridge and 2 others')).toHaveLength(3);
    expect(f.rpc).toHaveBeenCalledWith('get_latest_course_media', { p_limit: 15 }, { staleTime: 60_000 });
  });

  it('credit grammar: one other, no others, and an empty name omits the line', () => {
    f.rows = [
      course('alpha', { contributor_count: 2 }),
      course('beta', { contributor_count: 1 }),
      course('gamma', { latest_member_name: null }),
    ];
    mount();
    expect(screen.getByText('Mark Eldridge and 1 other')).toBeInTheDocument();
    expect(screen.getByText('Mark Eldridge')).toBeInTheDocument();
    const gamma = screen.getByLabelText('Open Course gamma shot 1 of 14');
    expect(gamma.textContent).not.toContain('Mark Eldridge');
  });

  it('singular label at exactly one member shot', () => {
    f.rows = [course('alpha', { media_count: 1 }), course('beta'), course('gamma')];
    mount();
    expect(screen.getByText('Member shot')).toBeInTheDocument();
  });

  it('the +N overlay sits on tile 3 only, and only when media_count exceeds 3', () => {
    f.rows = [
      course('alpha', { media_count: 14 }),
      course('beta', { media_count: 3 }),
      course('gamma'),
    ];
    mount();
    const alphaThree = screen.getByLabelText('Open Course alpha shot 3 of 14');
    expect(alphaThree.textContent).toContain('+11');
    const alphaTwo = screen.getByLabelText('Open Course alpha shot 2 of 14');
    expect(alphaTwo.textContent).not.toContain('+11');
    const betaThree = screen.getByLabelText('Open Course beta shot 3 of 3');
    expect(betaThree.textContent).not.toContain('+');
  });

  it('video tiles show the glass disc; image tiles do not', () => {
    f.rows = [
      course('alpha', { tiles: [tile('a-1'), tile('a-2', { media_type: 'video', poster_url: '/a-2-poster.jpg' }), tile('a-3', { media_type: 'video', poster_url: '/a-3-poster.jpg' })] }),
      course('beta'),
      course('gamma'),
    ];
    mount();
    const videoTile = screen.getByLabelText('Open Course alpha shot 2 of 14');
    expect(videoTile.querySelector('.glass-chip')).not.toBeNull();
    expect(videoTile.querySelector('img')).toHaveAttribute('src', '/a-2-poster.jpg');
    const imageTile = screen.getByLabelText('Open Course beta shot 2 of 14');
    expect(imageTile.querySelector('.glass-chip')).toBeNull();
  });

  it('a one-tile card leaves the two missing cells as plain empty panels', () => {
    f.rows = [
      course('alpha', { tiles: [tile('a-1')] }),
      course('beta'),
      course('gamma'),
    ];
    mount();
    const big = screen.getByLabelText('Open Course alpha shot 1 of 14');
    const card = big.parentElement as HTMLElement;
    expect(card.children).toHaveLength(3);
    const empties = Array.from(card.children).filter(child => child.tagName === 'DIV');
    expect(empties).toHaveLength(2);
    for (const cell of empties) expect(cell.children).toHaveLength(0);
  });

  it('BRIEF_LATEST_COURSES_FLAT_VIEWER: two posts flatten to five items in post-then-media order and the tapped shot sets initialIndex', async () => {
    f.gallery = {
      data: [
        post('post-alpha-1', [shot('m1'), shot('m2'), shot('m3')]),
        post('post-alpha-2', [shot('m4'), shot('m5')]),
      ],
      isError: false,
    };
    mount();
    // tile 2 of card alpha carries media_id media-alpha-2 → match it to m5
    f.rows[0] = course('alpha', { tiles: [tile('alpha-1', { post_id: 'post-alpha-1', media_id: 'm1' }), tile('alpha-2', { post_id: 'post-alpha-2', media_id: 'm5' }), tile('alpha-3', { post_id: 'post-alpha-1', media_id: 'm2' })] });
    cleanup();
    mount();
    fireEvent.click(screen.getByLabelText('Open Course alpha shot 2 of 14'));
    await waitFor(() => expect(f.viewer).toHaveBeenCalledTimes(1));
    const props = lastViewer();
    expect(props.items.map(i => i.id)).toEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
    expect(props.initialIndex).toBe(4);
    expect(props.edgeBounce).toBe(true);
    expect(f.open).not.toHaveBeenCalled();
  });

  it('start-index fallbacks: url match, then first item of the post id, then 0', async () => {
    f.gallery = {
      data: [
        post('post-x', [shot('mx', { imageUrl: '/x.jpg' })]),
        post('post-alpha-2', [shot('my', { imageUrl: '/alpha-2.jpg' })]),
      ],
      isError: false,
    };
    mount();
    // url match: media_id unknown but the media_url matches an item's imageUrl
    fireEvent.click(screen.getByLabelText('Open Course alpha shot 2 of 14'));
    await waitFor(() => expect(f.viewer).toHaveBeenCalledTimes(1));
    expect(lastViewer().initialIndex).toBe(1);
    // post id match: neither media id nor url match, but the post id does
    f.rows = [course('delta', { tiles: [tile('d-1', { post_id: 'post-alpha-2', media_id: 'gone', media_url: '/gone.jpg' })] }), course('beta'), course('gamma')];
    cleanup();
    mount();
    fireEvent.click(screen.getByLabelText('Open Course delta shot 1 of 14'));
    await waitFor(() => expect(f.viewer).toHaveBeenCalledTimes(2));
    expect(lastViewer().initialIndex).toBe(1);
    // nothing matches: index 0
    f.rows = [course('epsilon', { tiles: [tile('e-1', { post_id: 'gone', media_id: 'gone', media_url: '/gone.jpg' })] }), course('beta'), course('gamma')];
    cleanup();
    mount();
    fireEvent.click(screen.getByLabelText('Open Course epsilon shot 1 of 14'));
    await waitFor(() => expect(f.viewer).toHaveBeenCalledTimes(3));
    expect(lastViewer().initialIndex).toBe(0);
  });

  it('a processing video is skipped and the later indexes shift up', async () => {
    f.gallery = {
      data: [
        post('post-alpha-1', [
          shot('m1'),
          shot('v1', { type: 'video', isProcessing: true, thumbnailUrl: '/v1.jpg' }),
          shot('v2', { type: 'video', thumbnailUrl: '/v2.jpg' }),
          shot('m2'),
        ]),
      ],
      isError: false,
    };
    f.rows = [course('alpha', { tiles: [tile('alpha-1', { post_id: 'post-alpha-1', media_id: 'm2' })] }), course('beta'), course('gamma')];
    mount();
    fireEvent.click(screen.getByLabelText('Open Course alpha shot 1 of 14'));
    await waitFor(() => expect(f.viewer).toHaveBeenCalledTimes(1));
    const props = lastViewer();
    expect(props.items.map(i => i.id)).toEqual(['m1', 'v2', 'm2']);
    expect(props.initialIndex).toBe(2);
  });

  it('captions: members-eyes kicker, the card course name, and the adding member with the added month', async () => {
    f.gallery = {
      data: [
        post('post-alpha-1', [shot('m1')]),
        post('post-alpha-2', [shot('m2')], { displayName: 'St Andrews Links', createdAt: '2026-09-02T08:00:00Z' }),
      ],
      isError: false,
    };
    mount();
    fireEvent.click(screen.getByLabelText('Open Course alpha shot 1 of 14'));
    await waitFor(() => expect(f.viewer).toHaveBeenCalledTimes(1));
    const [first, second] = lastViewer().items;
    expect(first.caption).toEqual({ kicker: "Through members' eyes", title: 'Course alpha', credit: 'Thomas Holmes · Mar 2026' });
    expect(second.caption).toEqual({ kicker: "Through members' eyes", title: 'Course alpha', credit: 'St Andrews Links · Sep 2026' });
  });

  it('video viewer items carry the hls url and poster; an mp4-only video plays through previewUrl', async () => {
    f.gallery = {
      data: [
        post('post-alpha-1', [
          shot('v1', { type: 'video', hlsUrl: 'https://stream/v1.m3u8', thumbnailUrl: '/v1-poster.jpg' }),
          shot('v2', { type: 'video', mp4Url: '/v2.mp4', thumbnailUrl: '/v2-poster.jpg' }),
        ]),
      ],
      isError: false,
    };
    mount();
    fireEvent.click(screen.getByLabelText('Open Course alpha shot 1 of 14'));
    await waitFor(() => expect(f.viewer).toHaveBeenCalledTimes(1));
    const [hls, mp4] = lastViewer().items;
    expect(hls).toMatchObject({ id: 'v1', type: 'video', hlsUrl: 'https://stream/v1.m3u8', previewUrl: '/v1-poster.jpg', thumbnailUrl: '/v1-poster.jpg' });
    expect(mp4).toMatchObject({ id: 'v2', type: 'video', previewUrl: '/v2.mp4', thumbnailUrl: '/v2-poster.jpg' });
    expect(mp4.hlsUrl).toBeUndefined();
  });

  it('while the open is pending the card dims and further taps are ignored', async () => {
    f.gallery = { data: undefined, isError: false };
    mount();
    const tileOne = screen.getByLabelText('Open Course alpha shot 1 of 14');
    fireEvent.click(tileOne);
    await waitFor(() => expect((tileOne.parentElement as HTMLElement).style.opacity).toBe('0.7'));
    fireEvent.click(screen.getByLabelText('Open Course beta shot 1 of 14'));
    fireEvent.click(tileOne);
    expect(f.viewer).not.toHaveBeenCalled();
  });

  it('an empty or errored gallery clears the pending state and opens nothing', async () => {
    f.gallery = { data: [], isError: false };
    mount();
    const tileOne = screen.getByLabelText('Open Course alpha shot 1 of 14');
    fireEvent.click(tileOne);
    await waitFor(() => expect((tileOne.parentElement as HTMLElement).style.opacity).toBe('1'));
    expect(f.viewer).not.toHaveBeenCalled();
    expect(f.open).not.toHaveBeenCalled();
  });

  it('this section never calls openWithOrigin', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/courses/browse/LatestCoursesSection.tsx'), 'utf8');
    expect(source).not.toContain('openWithOrigin');
  });

  it('CoursesBrowsePage gates latestCourses after byRegion and renders the section between By region and The regulars', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/courses/CoursesBrowsePage.tsx'), 'utf8');
    expect(source).toMatch(/'byRegion', 'latestCourses', 'mostPlayed'/);
    const byRegion = source.indexOf('<ByRegionSection />');
    const latest = source.indexOf('<LatestCoursesSection />');
    const regulars = source.indexOf('<MostPlayedSection />');
    expect(byRegion).toBeGreaterThan(-1);
    expect(byRegion).toBeLessThan(latest);
    expect(latest).toBeLessThan(regulars);
  });
});
