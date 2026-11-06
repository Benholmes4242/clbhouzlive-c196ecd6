import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

const h = vi.hoisted(() => ({ load: vi.fn(), map: vi.fn() }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { type: 'personal', id: 'me' } }) }));
vi.mock('@/hooks/usePostViewTracker', () => ({ recordPostViewOnce: vi.fn() }));
vi.mock('@/lib/publishedPostViewer', () => ({ loadPublishedPost: h.load, mapPublishedPost: h.map }));
vi.mock('@/stores/fullScreenSurfaceStore', () => ({ useFullScreenSurface: () => {} }));
vi.mock('@/features/post-v2/StageComposer', () => ({ default: ({ onViewPost, onClose, onPosted }: { onViewPost?: (id: string, to: string) => void; onClose: () => void; onPosted?: () => void }) => <>
  <button aria-label="view-personal" onClick={() => onViewPost?.('new-post', '/profile')} />
  <button aria-label="view-business" onClick={() => onViewPost?.('new-post', '/business/biz')} />
  <button aria-label="done" onClick={() => { onPosted?.(); onClose(); }} />
</> }));
import PostDeepLinkPage from '@/pages/PostDeepLinkPage';
import PostV2Page from '@/features/post-v2/PostV2Page';
import { GlobalPostComposer } from '@/components/post-composer/GlobalPostComposer';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

function Destination() {
  const location = useLocation(), navigate = useNavigate();
  return <><output data-testid="destination">{location.pathname}</output><output data-testid="state">{JSON.stringify(location.state)}</output><button aria-label="back" onClick={() => navigate(-1)} /></>;
}
const row = { id: 'new-post', user_id: 'me', created_at: '2026-11-06', post_media: [{ media_url: '/photo.jpg' }] };
const mapped = { id: 'new-post', mediaItems: [{ id: 'photo', type: 'image', imageUrl: '/photo.jpg' }] };
beforeEach(() => {
  h.load.mockReset().mockResolvedValue({ data: row, error: null }); h.map.mockReset().mockResolvedValue(mapped);
  usePostStudioStore.getState().closePostStudio();
  useFullscreenFeedStore.setState({ isOpen: false, courseGallery: null, syntheticPosts: false });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); usePostStudioStore.getState().closePostStudio(); useFullscreenFeedStore.setState({ isOpen: false }); });

describe('VIEW_POST_1 mounted composer hosts', () => {
  it('global View post unmounts the studio without the old returnPath navigation', () => {
    usePostStudioStore.getState().openPostStudio({ returnPath: '/clubhouse' });
    render(<MemoryRouter initialEntries={['/origin']}><GlobalPostComposer /><Routes><Route path="*" element={<Destination />} /></Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'view-personal' }));
    expect(usePostStudioStore.getState().isOpen).toBe(false);
    expect(screen.getByTestId('destination')).toHaveTextContent('/post/new-post');
    expect(JSON.parse(screen.getByTestId('state').textContent ?? '{}')).toEqual({ closeTo: '/profile' });
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(screen.getByTestId('destination')).toHaveTextContent('/origin');
  });
  it('global Done retains returnPath navigation', () => {
    usePostStudioStore.getState().openPostStudio({ returnPath: '/clubhouse' });
    render(<MemoryRouter initialEntries={['/origin']}><GlobalPostComposer /><Destination /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'done' }));
    expect(screen.getByTestId('destination')).toHaveTextContent('/clubhouse');
    expect(usePostStudioStore.getState().isOpen).toBe(false);
  });
  it('post-v2 replaces the finished composer history entry and carries business closeTo', () => {
    render(<MemoryRouter initialEntries={['/origin', '/post-v2']}><Routes><Route path="/post-v2" element={<PostV2Page />} /><Route path="*" element={<Destination />} /></Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'view-business' }));
    expect(screen.getByTestId('destination')).toHaveTextContent('/post/new-post');
    expect(JSON.parse(screen.getByTestId('state').textContent ?? '{}')).toEqual({ closeTo: '/business/biz' });
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(screen.getByTestId('destination')).toHaveTextContent('/origin');
  });
});

function mountLink(closeTo?: string, openComments = false) {
  const open = vi.spyOn(useFullscreenFeedStore.getState(), 'open').mockImplementation(() => { useFullscreenFeedStore.setState({ isOpen: true }); });
  render(<MemoryRouter initialEntries={['/activity', { pathname: '/post/new-post', state: { ...(closeTo ? { closeTo } : {}), openComments } }]}><Routes><Route path="/post/:postId" element={<PostDeepLinkPage />} /><Route path="*" element={<Destination />} /></Routes></MemoryRouter>);
  return open;
}

describe('VIEW_POST_1 post deep-link close and processing fallback', () => {
  it.each(['/profile', '/business/biz'])('closing returns to %s with replace and keeps author history out of the viewer', async closeTo => {
    const open = mountLink(closeTo);
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    await act(async () => { open.mock.calls[0]?.[2]?.onClose?.({ reason: 'dismissed' } as never); });
    expect(screen.getByTestId('destination')).toHaveTextContent(closeTo);
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(screen.getByTestId('destination')).toHaveTextContent('/activity');
  });
  it('without closeTo a shared or notification link goes back unchanged', async () => {
    const len = vi.spyOn(window.history, 'length', 'get').mockReturnValue(2);
    const open = mountLink(undefined, true);
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    expect(open.mock.calls[0]?.[2]?.openCommentsInitially).toBe(true);
    await act(async () => { open.mock.calls[0]?.[2]?.onClose?.({ reason: 'dismissed' } as never); });
    expect(screen.getByTestId('destination')).toHaveTextContent('/activity');
    len.mockRestore();
  });
  it('without closeTo and no browser history a shared link lands on Clubhouse', async () => {
    const len = vi.spyOn(window.history, 'length', 'get').mockReturnValue(1);
    const open = mountLink();
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    await act(async () => { open.mock.calls[0]?.[2]?.onClose?.({ reason: 'dismissed' } as never); });
    expect(screen.getByTestId('destination')).toHaveTextContent('/');
    len.mockRestore();
  });
  it('a navigating close never overrides the viewer destination even with closeTo', async () => {
    const open = mountLink('/profile');
    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    await act(async () => { open.mock.calls[0]?.[2]?.onClose?.({ reason: 'navigating' } as never); });
    expect(screen.queryByTestId('destination')).not.toBeInTheDocument();
  });
  it('a refused open with closeTo goes straight to the profile', async () => {
    const open = mountLink('/profile'); open.mockImplementation(() => {});
    await screen.findByTestId('destination');
    expect(screen.getByTestId('destination')).toHaveTextContent('/profile');
  });
  it('all-processing media with closeTo bypasses open and goes to the author', async () => {
    h.map.mockResolvedValue({ ...mapped, mediaItems: [{ ...mapped.mediaItems[0], isProcessing: true }] });
    const open = mountLink('/business/biz');
    await screen.findByTestId('destination');
    expect(screen.getByTestId('destination')).toHaveTextContent('/business/biz');
    expect(open).not.toHaveBeenCalled();
  });
  it('a still-unpublished upload with closeTo goes to the author rather than unavailable', async () => {
    h.load.mockResolvedValue({ data: null, error: null });
    const open = mountLink('/profile');
    await screen.findByTestId('destination');
    expect(screen.getByTestId('destination')).toHaveTextContent('/profile');
    expect(open).not.toHaveBeenCalled();
  });
  it('a missing shared link without closeTo retains the unavailable state', async () => {
    h.load.mockResolvedValue({ data: null, error: null });
    const open = mountLink();
    await screen.findByRole('button', { name: 'Go to clbhouz' });
    expect(open).not.toHaveBeenCalled();
    expect(screen.queryByTestId('destination')).not.toBeInTheDocument();
  });
  it('without closeTo a refused open retains the unavailable state', async () => {
    const open = mountLink(); open.mockImplementation(() => {});
    await screen.findByRole('button', { name: 'Go to clbhouz' });
    expect(open).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('destination')).not.toBeInTheDocument();
  });
});