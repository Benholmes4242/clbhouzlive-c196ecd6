import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LatestHolesSection, type LatestHoleMedia } from '@/components/courses/browse/LatestHolesSection';
import { LatestCoursesSection, LATEST_COURSE_W, type LatestCourseMedia } from '@/components/courses/browse/LatestCoursesSection';
import { AdminHoleTagging } from '@/components/course-media-tab/AdminHoleTagging';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

const f = vi.hoisted(() => ({ rpc: vi.fn(), open: vi.fn(), ready: vi.fn(), single: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc, from: () => ({ select: () => ({ eq: () => ({ single: f.single }) }) }) } }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: f.open }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'admin' } }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useGalleryCourseMedia', () => ({ useGalleryCourseMedia: () => ({ data: undefined, isError: false }) }));
vi.mock('@/components/courses/browse/PageLoadGate', () => ({ useSectionReady: f.ready }));

type Row = LatestHoleMedia | LatestCourseMedia;
const kinds = [
  { kind: 'holes', name: 'get_latest_hole_media', size: 20, width: 220, skeleton: '.latest-hole-skeleton-card', Section: LatestHolesSection },
  { kind: 'courses', name: 'get_latest_course_media', size: 10, width: LATEST_COURSE_W, skeleton: '.latest-course-skeleton-card', Section: LatestCoursesSection },
] as const;
type Kind = typeof kinds[number];
const hole = (i: number): LatestHoleMedia => ({ id: `h-${i}`, course_id: `c-${i}`, course_name: `Course ${i}`, hole_no: 4, media_type: 'image', media_url: `/h-${i}.jpg`, poster_url: null, stream_id: null, duration_seconds: null, exif_captured_at: null, added_at: '2026-10-26T12:00:00Z', created_at: `2026-10-25T12:00:${String(i % 60).padStart(2, '0')}Z`, member_id: 'member', member_name: 'Member', member_avatar_url: null, par: 4, yards: 400 });
const course = (i: number): LatestCourseMedia => ({ course_id: `c-${i}`, course_name: `Course ${i}`, latest_at: `2026-10-24T12:00:${String(i % 60).padStart(2, '0')}Z`, media_count: 3, contributor_count: 1, latest_member_name: 'Member', tiles: Array.from({ length: 3 }, (_, n) => ({ post_id: `p-${i}`, media_id: `m-${i}-${n}`, media_type: 'image', media_url: `/m-${i}-${n}.jpg`, poster_url: null, stream_id: null, duration_seconds: null, created_at: '2026-10-20T00:00:00Z' })) });
const page = (spec: Kind, start = 0, count: number = spec.size): Row[] => Array.from({ length: count }, (_, i) => spec.kind === 'holes' ? hole(start + i) : course(start + i));
const cursor = (row: Row) => 'id' in row ? { p_before_at: row.created_at, p_before_id: row.id } : { p_before_at: row.latest_at, p_before_id: row.course_id };
type Observer = { callback: IntersectionObserverCallback; options?: IntersectionObserverInit; target?: Element; active: boolean };
// Shared setup installs a writable, non-configurable class. Extend it rather than
// asking stubGlobal to redefine its descriptor; restore the original class per test.
const SharedObserver = globalThis.IntersectionObserver;
class FakeObserver extends SharedObserver {
  entry: Observer;
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    super(callback, options);
    this.entry = { callback, options, active: true };
    observers.push(this.entry);
  }
  observe(target: Element) { this.entry.target = target; }
  disconnect() { this.entry.active = false; }
}
let observers: Observer[];
let clients: QueryClient[];
let pages: Row[][];
function nextVisible() {
  const observer = [...observers].reverse().find(item => item.active);
  if (!observer?.target) throw new Error('Expected an active rail sentinel observer');
  act(() => observer.callback([{ target: observer.target, isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
}
function mount(spec: Kind, admin = false) {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(cache);
  const Section = spec.Section;
  return { cache, ...render(<MemoryRouter><QueryClientProvider client={cache}><Section />{admin && <AdminHoleTagging courseId="course" knownHoles={[4]} />}</QueryClientProvider></MemoryRouter>) };
}
const requests = (spec: Kind) => f.rpc.mock.calls.filter(([name]) => name === spec.name);
const cards = (view: ReturnType<typeof mount>, spec: Kind) => view.container.querySelectorAll(spec.kind === 'holes' ? '.latest-hole-card' : '[aria-label^="Open Course"][aria-label*="shot 1"]');
beforeEach(() => {
  vi.clearAllMocks(); observers = []; clients = []; pages = [];
  useFullscreenFeedStore.setState({ isOpen: false });
  globalThis.IntersectionObserver = FakeObserver;
  f.rpc.mockImplementation(async (name: string, args?: Record<string, unknown>) => {
    if (name.startsWith('get_latest_')) return { data: pages[args?.p_before_id ? 1 : 0] ?? [], error: null };
    if (name === 'is_admin') return { data: true, error: null };
    if (name === 'admin_get_untagged_course_media') return { data: [{ media_id: 'untagged', media_url: '/untagged.jpg', created_at: '2026-10-01T00:00:00Z', owner_name: 'Member', owner_id: 'member', source: 'post', media_type: 'image' }], error: null };
    return { data: 'tag', error: null };
  });
  f.single.mockResolvedValue({ data: { id: 'tag', user_id: 'member', hole_no: 4, status: 'approved' }, error: null });
});
afterEach(() => { cleanup(); clients.forEach(client => client.clear()); useFullscreenFeedStore.setState({ isOpen: false }); globalThis.IntersectionObserver = SharedObserver; vi.unstubAllGlobals(); });

describe.each(kinds)('$kind unlimited rail', spec => {
  it('requests the first page with its page size and no cursor', async () => {
    pages = [page(spec)]; const view = mount(spec);
    await waitFor(() => expect(cards(view, spec)).toHaveLength(spec.size));
    expect(requests(spec)).toEqual([[spec.name, { p_limit: spec.size }]]);
    expect(view.cache.getQueryCache().find({ queryKey: ['gam_rpc', spec.name, 'infinite', 'admin', false] })?.options).toMatchObject({ staleTime: 60000 });
  });
  it('the rail sentinel requests the last raw row cursor and ignores repeated callbacks', async () => {
    pages = [page(spec), page(spec, 50, 3)]; const view = mount(spec);
    await waitFor(() => expect(cards(view, spec)).toHaveLength(spec.size));
    const observer = [...observers].reverse().find(item => item.active);
    expect(observer?.options?.root).toBe(view.container.querySelector('.scrollbar-hide'));
    expect(observer?.options?.rootMargin).toBe(`0px ${spec.width * 2}px 0px 0px`);
    nextVisible(); nextVisible();
    await waitFor(() => expect(cards(view, spec)).toHaveLength(spec.size + 3));
    expect(requests(spec)).toEqual([[spec.name, { p_limit: spec.size }], [spec.name, { p_limit: spec.size, ...cursor(pages[0][spec.size - 1]) }]]);
  });
  it('stops after a short second page', async () => {
    pages = [page(spec), page(spec, 50, 1)]; const view = mount(spec);
    await waitFor(() => expect(cards(view, spec)).toHaveLength(spec.size)); nextVisible();
    await waitFor(() => expect(cards(view, spec)).toHaveLength(spec.size + 1));
    expect(observers.filter(item => item.active)).toHaveLength(0);
    expect(view.container.querySelector(spec.skeleton)).toBeNull();
    expect(requests(spec)).toHaveLength(2);
  });
  it('dedupes moved items across pages without changing loaded order', async () => {
    pages = [page(spec), [page(spec, 2, 1)[0], ...page(spec, 50, 2)]]; const view = mount(spec);
    await waitFor(() => expect(cards(view, spec)).toHaveLength(spec.size)); nextVisible();
    await waitFor(() => expect(cards(view, spec)).toHaveLength(spec.size + 2));
    const labels = Array.from(cards(view, spec)).map(card => card.getAttribute('aria-label'));
    expect(labels.filter(label => label === 'Hole 4, Course 2' || label === 'Open Course 2 shot 1 of 3')).toHaveLength(1);
    expect(labels.slice(-2)).toEqual(spec.kind === 'holes' ? ['Hole 4, Course 50', 'Hole 4, Course 51'] : ['Open Course 50 shot 1 of 3', 'Open Course 51 shot 1 of 3']);
  });
  it('shows exactly one end skeleton only while the next page is in flight', async () => {
    pages = [page(spec)]; const view = mount(spec);
    await waitFor(() => expect(cards(view, spec)).toHaveLength(spec.size));
    let resolvePage: ((value: { data: Row[]; error: null }) => void) | undefined;
    f.rpc.mockImplementationOnce(() => new Promise(resolve => { resolvePage = resolve; }));
    nextVisible();
    await waitFor(() => expect(view.container.querySelectorAll(spec.skeleton)).toHaveLength(1));
    expect(cards(view, spec)).toHaveLength(spec.size);
    await act(async () => resolvePage?.({ data: page(spec, 50, 1), error: null }));
    await waitFor(() => expect(cards(view, spec)).toHaveLength(spec.size + 1));
    expect(view.container.querySelectorAll(spec.skeleton)).toHaveLength(0);
  });
  it('first-page minimum prevents observation and further requests', async () => {
    pages = [page(spec, 0, 2)]; const view = mount(spec);
    await waitFor(() => expect(view.cache.getQueryState(['gam_rpc', spec.name, 'infinite', 'admin', false])?.status).toBe('success'));
    expect(cards(view, spec)).toHaveLength(0);
    expect(observers).toHaveLength(0);
    expect(requests(spec)).toHaveLength(1);
  });
});

describe('loaded holes run and refresh', () => {
  const spec = kinds[0];
  it('opens every loaded row in order and selects the tapped second-page shot', async () => {
    pages = [page(spec), page(spec, 50, 3)]; const view = mount(spec);
    await waitFor(() => expect(cards(view, spec)).toHaveLength(20)); nextVisible();
    await waitFor(() => expect(cards(view, spec)).toHaveLength(23));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4, Course 51' }));
    expect(f.open).toHaveBeenCalledWith(expect.objectContaining({ mediaId: 'h-51', options: { readOnly: true, syntheticPosts: true } }));
    expect(f.open.mock.calls[0][0].posts[0].mediaItems.map((item: { id: string }) => item.id)).toEqual([...Array.from({ length: 20 }, (_, i) => `h-${i}`), 'h-50', 'h-51', 'h-52']);
    expect(requests(spec)).toHaveLength(2);
  });
  it('does not page or refetch while fullscreen is open and resumes after closing', async () => {
    pages = [page(spec), page(spec, 50, 3)]; const view = mount(spec);
    await waitFor(() => expect(cards(view, spec)).toHaveLength(20));
    const previous = [...observers].reverse().find(item => item.active);
    act(() => useFullscreenFeedStore.setState({ isOpen: true }));
    if (!previous?.target) throw new Error('Missing sentinel');
    act(() => previous.callback([{ target: previous.target, isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    await act(async () => { await view.cache.invalidateQueries({ predicate: q => q.queryKey.includes(spec.name) }); });
    expect(requests(spec)).toHaveLength(1);
    act(() => useFullscreenFeedStore.setState({ isOpen: false }));
    await waitFor(() => expect(requests(spec)).toHaveLength(2));
    await waitFor(() => expect(observers.some(item => item.active)).toBe(true)); nextVisible();
    await waitFor(() => expect(cards(view, spec)).toHaveLength(23));
  });
  it('admin hole-tag predicate invalidation refetches the active infinite holes rail', async () => {
    pages = [page(spec, 0, 3)]; const view = mount(spec, true);
    await waitFor(() => expect(cards(view, spec)).toHaveLength(3));
    fireEvent.click(await screen.findByRole('button', { name: 'Tag them' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' }));
    pages = [page(spec, 50, 3)];
    fireEvent.click(screen.getByRole('button', { name: /^Tag to the / }));
    await screen.findByRole('button', { name: 'Hole 4, Course 50', hidden: true });
    expect(requests(spec)).toHaveLength(2);
    expect(f.rpc).toHaveBeenCalledWith('admin_tag_hole_media', { p_course_id: 'course', p_media_id: 'untagged', p_hole_no: 4 });
    expect(view.cache.getQueryData(['gam_rpc', spec.name, 'infinite', 'admin', false])).toMatchObject({ pages });
  });
});