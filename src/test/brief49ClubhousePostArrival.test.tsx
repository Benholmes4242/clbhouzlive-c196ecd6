import React, { StrictMode, useMemo, useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import type { VirtuosoHandle } from 'react-virtuoso';
import type { FeedPost } from '@/components/media-system/types/media';
import { useClubhousePostArrival } from '@/components/clubhouse/hooks/useClubhousePostArrival';
import { useFeedPostArrivalScroll } from '@/components/feed/useFeedPostArrivalScroll';

const h = vi.hoisted(() => ({ load: vi.fn(), map: vi.fn(), scroll: vi.fn(), top: vi.fn() }));
vi.mock('@/lib/publishedPostViewer', () => ({ loadPublishedPost: h.load, mapPublishedPost: h.map }));
vi.mock('@/lib/chromeClearance', () => ({ chromeClearancePx: () => 72 }));
const post = (id: string) => ({ id, postType: 'top_ten', mediaItems: [] }) as unknown as FeedPost;
const viewer = { userId: 'viewer', actorId: 'viewer', actorType: 'personal' as const };
function Feed({ posts, fetched = true, userId = 'viewer' }: { posts: FeedPost[]; fetched?: boolean; userId?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const result = useClubhousePostArrival({ posts, isFetched: fetched, ready: true, viewer: { ...viewer, userId } });
  const handle = useRef({ scrollIntoView: h.scroll, scrollTo: h.top } as unknown as VirtuosoHandle);
  const cards = useRef(new Map<number, HTMLElement>());
  const ids = useMemo(() => result.posts.map(p => p.id), [result.posts]);
  useFeedPostArrivalScroll({ arrival: result.arrival, ids, virtuoso: handle, cards, ready: true, onPlaced: result.onPlaced });
  return <><output data-testid="url">{location.pathname}{location.search}{location.hash}</output>
    <button onClick={() => navigate('/notificationmessages')}>Leave</button>
    <button onClick={() => navigate(-1)}>Back</button>
    <ol>{result.posts.map((p, i) => <li key={p.id} data-index={i}><article data-post-id={p.id} ref={el => { if (el) cards.current.set(i, el); else cards.current.delete(i); }}>{p.id}</article></li>)}</ol></>;
}
const mount = (posts: FeedPost[], fetched = true, strict = false) => render(<MemoryRouter initialEntries={['/?post=p1&keep=yes#anchor']}>{strict ? <StrictMode><Feed posts={posts} fetched={fetched} /></StrictMode> : <Feed posts={posts} fetched={fetched} />}</MemoryRouter>);
beforeEach(() => {
  h.load.mockReset(); h.map.mockReset(); h.scroll.mockReset(); h.top.mockReset();
  h.scroll.mockImplementation(options => {
    expect(options.calculateViewLocation({ locationParams: { index: options.index, behavior: options.behavior } })).toMatchObject({ index: options.index, align: 'start', offset: -72 });
    options.done();
  });
});
afterEach(cleanup);

describe('Brief 49 Clubhouse post arrival', () => {
  it('loaded post aligns once smoothly below islands, consumes only post param and does not fetch', async () => {
    mount([post('before'), post('p1'), post('after')]);
    await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('/?keep=yes#anchor'));
    expect(h.scroll).toHaveBeenCalledTimes(1);
    expect(h.scroll).toHaveBeenCalledWith(expect.objectContaining({ index: 1, behavior: 'smooth', align: 'start' }));
    expect(h.load).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('/?keep=yes#anchor'));
    expect(h.scroll).toHaveBeenCalledTimes(1);
  });
  it('missing post uses the permalink read and is first, never duplicated by a later page', async () => {
    h.load.mockResolvedValue({ data: { id: 'p1' }, error: null }); h.map.mockResolvedValue(post('p1'));
    const view = mount([post('normal')]);
    await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('/?keep=yes#anchor'));
    expect(h.load).toHaveBeenCalledWith('p1', 'viewer');
    expect(h.map).toHaveBeenCalledWith({ id: 'p1' }, viewer);
    expect([...view.container.querySelectorAll('article')].map(el => el.dataset.postId)).toEqual(['p1', 'normal']);
    expect(h.top).toHaveBeenCalledTimes(1); expect(h.top).toHaveBeenCalledWith({ top: 0 });
    view.rerender(<MemoryRouter><Feed posts={[post('normal'), post('p1'), post('later')]} /></MemoryRouter>);
    expect([...view.container.querySelectorAll('article')].map(el => el.dataset.postId)).toEqual(['p1', 'normal', 'later']);
    expect(h.top).toHaveBeenCalledTimes(1);
  });
  it.each(['deleted', 'access error', 'rejection'])('%s opens the normal feed and removes the target silently', async kind => {
    if (kind === 'rejection') h.load.mockRejectedValue(new Error('unavailable'));
    else h.load.mockResolvedValue({ data: null, error: kind === 'access error' ? new Error('denied') : null });
    const view = mount([post('normal')]);
    await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('/?keep=yes#anchor'));
    expect([...view.container.querySelectorAll('article')].map(el => el.dataset.postId)).toEqual(['normal']);
    expect(h.map).not.toHaveBeenCalled(); expect(h.scroll).not.toHaveBeenCalled(); expect(h.top).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('waits for the first feed read before deciding a post needs fetching', async () => {
    const view = mount([], false);
    expect(h.load).not.toHaveBeenCalled();
    view.rerender(<MemoryRouter><Feed posts={[post('p1')]} /></MemoryRouter>);
    await waitFor(() => expect(h.scroll).toHaveBeenCalledTimes(1));
    expect(h.load).not.toHaveBeenCalled();
  });
  it('StrictMode arrival still resolves and consumes the target', async () => {
    h.load.mockResolvedValue({ data: { id: 'p1' }, error: null }); h.map.mockResolvedValue(post('p1'));
    mount([post('normal')], true, true);
    await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('/?keep=yes#anchor'));
    expect(h.top).toHaveBeenCalledTimes(1);
  });
  it('a pinned card cannot cross viewer identities', async () => {
    h.load.mockResolvedValue({ data: { id: 'p1' }, error: null }); h.map.mockResolvedValue(post('p1'));
    const view = mount([post('normal')]);
    await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('/?keep=yes#anchor'));
    view.rerender(<MemoryRouter><Feed posts={[post('other-viewer')]} userId="other" /></MemoryRouter>);
    expect([...view.container.querySelectorAll('article')].map(el => el.dataset.postId)).toEqual(['other-viewer']);
  });
});