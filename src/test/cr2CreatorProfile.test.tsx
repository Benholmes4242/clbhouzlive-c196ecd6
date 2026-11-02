import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type React from 'react';
import { creatorTab, creatorDuration, useProfileCreator, type CreatorVideo, type RoundVideo } from '@/features/creator/profileCreator';
const h = vi.hoisted(() => ({ rpc: vi.fn(), open: vi.fn(), track: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc } }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: h.open }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track } }));
import { ProfileCoverBand } from '@/components/profile/hero/ProfileCoverBand';
import { ProfileVideosTab } from '@/features/creator/ProfileVideosTab';
import { ProfileRoundVideos, RoundVideoPill } from '@/features/creator/ProfileRoundVideos';
function wrapper({ children }: { children: React.ReactNode }) { return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>; }
const video = (id: string) => ({ post_id: id, actor_id: 'owner', actor_type: 'personal', created_at: '2026-10-30T12:00:00Z', caption: 'Golf', display_name: 'Ellie', handle: 'ellie', avatar_url: '', is_verified: false, poster_url: '', stream_id: 'abc', duration_seconds: 542, media_url: 'stream:abc', hls_url: '', course_id: 'course', course_name: 'Walton Heath Golf Club', height: 1000, width: 600, like_count: 0, region: '' } as CreatorVideo);
const summary = { is_creator: true, videos: 2, shorts: 0, long_form: 2 };
beforeEach(() => { vi.clearAllMocks(); h.rpc.mockResolvedValue({ data: [], error: null }); });
afterEach(cleanup);
it('creator label is present only when enabled and is a sibling of the name', () => {
 const { rerender } = render(<ProfileCoverBand coverUrl={null} avatar={null} displayName="Ellie" subline={null} />, { wrapper });
 expect(document.querySelector('.profile-creator-label')).toBeNull();
 rerender(<ProfileCoverBand coverUrl={null} avatar={null} displayName="Ellie" subline={null} isCreator />);
 expect(document.querySelector('.profile-creator-label')?.previousElementSibling).toBe(screen.getByRole('heading', { name: 'Ellie' }));
});
it('creator defaults to Videos while a non-creator defaults to Posts', () => { expect(creatorTab(null, true, false)).toBe('videos'); expect(creatorTab(null, false, false)).toBe('activity'); });
it('non-creator video links resolve to Posts', () => { expect(creatorTab('videos', false, false)).toBe('activity'); });
it('no implicit Posts content is selected during creator loading', () => { expect(creatorTab(null, false, true)).toBeNull(); expect(creatorTab('courses', false, true)).toBe('courses'); });
it('creator summary never reads when signed out', () => { renderHook(() => useProfileCreator('owner', false), { wrapper }); expect(h.rpc).not.toHaveBeenCalled(); });
it('chips switch the server kind and tiles open the loaded list at the tapped index', async () => {
 h.rpc.mockResolvedValue({ data: [video('a'), video('b')], error: null }); render(<ProfileVideosTab userId="owner" viewerId="viewer" summary={summary} />, { wrapper });
 fireEvent.click(await screen.findByRole('button', { name: 'Play video 2' })); expect(h.open).toHaveBeenCalledWith(expect.objectContaining({ index: 1, posts: expect.arrayContaining([expect.objectContaining({ id: 'b' })]) }));
 fireEvent.click(screen.getByRole('button', { name: 'Shorts 0' })); await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('get_profile_videos', { p_user_id: 'owner', p_kind: 'short', p_limit: 30 }));
});
it('round pill uses m:ss or N videos and isolates the scorecard tap', () => {
 const scorecard = vi.fn(); const rows = [{ ...video('a'), score_id: 'score' }] as RoundVideo[];
 const { rerender } = render(<div onClick={scorecard}><RoundVideoPill rows={rows} self={false} /></div>, { wrapper });
 fireEvent.click(screen.getByRole('button', { name: '9:02' })); expect(scorecard).not.toHaveBeenCalled(); expect(h.open).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
 rerender(<RoundVideoPill rows={[...rows, { ...video('b'), score_id: 'score' }]} self={false} />); expect(screen.getByRole('button', { name: '2 videos' })).toBeInTheDocument(); expect(creatorDuration(3601)).toBe('60:01');
});
it('round video collector does not read without a signed-in viewer', () => {
 render(<ProfileRoundVideos userId="owner" rounds={[]}>{() => null}</ProfileRoundVideos>, { wrapper }); expect(h.rpc).not.toHaveBeenCalled();
});
