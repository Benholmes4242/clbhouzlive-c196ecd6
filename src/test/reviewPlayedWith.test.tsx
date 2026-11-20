/** Review tags reuse the post UI, write only after publication, and notify only
 * through the server's tag/mention triggers. Real composer/providers retained. */
import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';
import type { ActivityFeedRowV2 } from '@/features/activity-v2/hooks/useActivityFeedV2';
import type { WithCandidate } from '@/features/post-v2/lib/golfPostRules';

const h = vi.hoisted(() => ({
  actor: 'personal', tables: vi.fn(), insert: vi.fn(), deleted: vi.fn(), rpc: vi.fn(), mentions: vi.fn(), toast: vi.fn(), track: vi.fn(),
  suggestions: vi.fn(), candidates: vi.fn(), search: vi.fn(), withError: null as { code: string; message: string; details: string; hint: string } | null,
  deleteError: null as { code: string; message: string; details: string; hint: string } | null,
  reviewRows: [] as { review_id: string; user_id: string }[], postRows: [] as { post_id: string; user_id: string }[], newMedia: false,
  background: vi.fn(),
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/lib/routeChrome', () => ({ claimOverlayChrome: vi.fn(), releaseOverlayChrome: vi.fn(), applyRouteChrome: vi.fn() }));
vi.mock('@/lib/toast', () => ({ toast: { error: h.toast, success: vi.fn() } }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track, ratings: { modalOpened: vi.fn(), sliderChanged: vi.fn(), submitted: vi.fn() } } }));
vi.mock('@/utils/invalidateCourseRatingCaches', () => ({ invalidateCourseRatingCaches: vi.fn() }));
vi.mock('@/components/AccessControl', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'author' }, loading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { type: h.actor, id: 'author' } }) }));
vi.mock('@/features/post-v2/lib/golfPostReads', () => ({ fetchPlayedWithSuggestions: h.suggestions, readWithCandidates: h.candidates, searchMembers: h.search }));
vi.mock('@/lib/mentions/syncMentions', () => ({ syncMentionsForContent: h.mentions }));
vi.mock('@/features/review-v2/hooks/useReviewMediaPipeline', () => ({ useReviewMediaPipeline: () => ({ items: [], count: 0, pickerError: null,
  pendingMediaCount: () => h.newMedia ? 1 : 0, writeUploadedHolePhotos: vi.fn(), attachToReview: async () => ({ failed: 0, held: 0 }),
  pendingRemovals: () => [], commitRemovals: vi.fn(), discardRemovals: vi.fn(), uploadKey: 'upload-key', startBackgroundPublish: h.background,
}) }));
vi.mock('@/features/review-v2/hooks/useReviewHoleTags', () => ({ useReviewHoleTags: () => ({ holes: [], assignments: {}, capture: () => null }) }));
vi.mock('@/features/review-v2/hooks/useReviewHeaderFacts', () => ({ useReviewHeaderFacts: () => ({ avg: null, count: 0 }) }));
vi.mock('@/features/review-v2/hooks/useMyRatedScores', () => ({ useMyRatedScores: () => ({ data: [] }), calibrationRank: () => null }));
vi.mock('@/hooks/top100/useTop100Config', () => ({ useTop100Config: () => ({ subscoreMinRatings: 10 }) }));
vi.mock('@/features/review-v2/components/ReviewComposerHeader', () => ({ ReviewComposerHeader: React.forwardRef<HTMLElement>((_props, ref) => <header ref={ref} />) }));
vi.mock('@/features/review-v2/components/VoiceDictateButton', () => ({ VoiceDictateButton: () => null }));
vi.mock('@/components/mentions/MentionsComposerInput', () => ({ MentionsComposerInput: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => <textarea aria-label="Review text" value={value} onChange={e => onChange(e.target.value)} />, searchMentionMembers: vi.fn() }));
vi.mock('@/features/review-v2/components/MediaTray', () => ({ MediaTray: () => <div data-review-tray /> }));
vi.mock('@/features/review-v2/components/OverallScrubber', () => ({ OverallScrubber: ({ onChange }: { onChange: (v: number) => void }) => <button data-score-overall onClick={() => onChange(8)} /> }));
vi.mock('@/features/review-v2/components/CategoryGrid', () => ({ CategoryGrid: ({ onChange }: { onChange: (k: string, v: number) => void }) => <div>{['design', 'condition', 'clubhouse', 'facilities'].map(key => <button key={key} data-score-category={key} onClick={() => onChange(key, 8)} />)}</div> }));
vi.mock('@/features/review-v2/components/SubmitBar', () => ({ SubmitBar: ({ onPress }: { onPress: () => void }) => <button data-review-primary onClick={onPress} /> }));
vi.mock('@/features/review-v2/components/ReviewReceipt', async original => ({ ...await original<typeof import('@/features/review-v2/components/ReviewReceipt')>(), ReviewReceipt: () => <div data-review-saved /> }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useManageableBusinessIds', () => ({ useManageableBusinessIds: () => new Set(), useTeamBusinessIds: () => new Set() }));
vi.mock('@/lib/impressions/useImpressionObserver', () => ({ useImpressionObserver: () => {} }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/components/feed/FeedCommentPreview', () => ({ FeedCommentPreview: () => null }));
vi.mock('@/components/feed/FeedFollowPill', () => ({ FeedFollowPill: () => null }));
vi.mock('@/components/feed/MediaCarousel', () => ({ MediaCarousel: () => <div /> }));
vi.mock('@/components/feed/InlineVideo', () => ({ InlineVideo: () => <div /> }));
vi.mock('@/components/posts/PostOwnerMenu', () => ({ PostOwnerMenu: () => null }));
vi.mock('@/components/feed/FeedActorPicker', () => ({ FeedActorPicker: () => null }));
vi.mock('@/hooks/useFollowState', () => ({ useFollowState: () => ({ isFollowing: false }) }));
vi.mock('@/hooks/useCoursePersonalStatus', () => ({ useCoursePersonalStatus: () => ({ status: null, isLoading: false }) }));
vi.mock('@/hooks/feed/useCourseStatsDetail', () => ({ useCourseStatsDetail: () => ({ data: null, isLoading: false }) }));
vi.mock('@/video/useVideoProgressWriter', () => ({ useVideoProgressWriter: () => {} }));
vi.mock('@/components/fullscreen-feed/FullscreenVideoScrubber', () => ({ FullscreenVideoScrubber: () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc,
  auth: { getUser: async () => ({ data: { user: { id: 'author' } } }), getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }) },
  functions: { invoke: async () => ({ data: {}, error: null }) },
  from: (table: string) => {
    h.tables(table);
    let action = 'read';
    const filters: [string, unknown][] = [];
    const query = {
      select: () => query, order: () => query, or: () => query,
      eq: (key: string, value: unknown) => { filters.push([key, value]); return query; },
      in: (key: string, value: unknown) => { filters.push([key, value]); return query; },
      insert: (rows: unknown) => { action = 'insert'; h.insert(table, rows); return query; },
      delete: () => { action = 'delete'; return query; },
      then: (resolve: (v: unknown) => unknown) => {
        if (action === 'delete') h.deleted(table, filters);
        const data = action === 'delete' ? [{ review_id: 'review-1' }] : table === 'review_with' ? h.reviewRows : table === 'post_with' ? h.postRows : table === 'user_profiles' ? ['a', 'b', 'viewer'].map(id => ({ id, display_name: id === 'a' ? 'Thomas Holmes' : 'Danny Holmes', first_name: null, username: id, profile_photo_url: null })) : [];
        return Promise.resolve({ data, error: table === 'review_with' ? action === 'insert' ? h.withError : action === 'delete' ? h.deleteError : null : null }).then(resolve);
      },
    };
    return query;
  },
} }));

import ReviewComposerV2 from '@/features/review-v2/ReviewComposerV2';
import { FeedCard, type FeedCardProps } from '@/components/feed/FeedCard';
import { ImmersiveFullscreenChrome } from '@/components/fullscreen-feed/ImmersiveFullscreenChrome';
import { readReviewWith, writeReviewWith, syncReviewWith } from '@/features/review-v2/lib/reviewWith';
import { useReviewPlayedWith } from '@/features/review-v2/hooks/useReviewPlayedWith';
import { saveReviewSocial } from '@/features/review-v2/lib/saveReviewSocial';
import { fetchPostGolfTags } from '@/hooks/feed/usePostGolfTags';
import { getActivityLink } from '@/features/activity-v2/utils/activityLinks';

const people = [{ userId: 'a', name: 'Thomas Holmes', username: 'a', avatarUrl: null }, { userId: 'b', name: 'Danny Holmes', username: 'b', avatarUrl: null }];
const candidate: WithCandidate = { id: 'b', name: 'Danny Holmes', username: 'b', avatarUrl: null, sameRound: false, lastInteraction: '' };
const failure = { code: '23503', message: 'Foreign key refused', details: 'Member key missing', hint: 'Check identity' };
const markup = '@[Thomas](u:11111111-1111-1111-1111-111111111111)';
const required = (root: ParentNode, selector: string): HTMLElement => { const node = root.querySelector<HTMLElement>(selector); if (!node) throw new Error(`Missing ${selector}`); return node; };
const providers = (node: React.ReactNode, client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })) => <QueryClientProvider client={client}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>;
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); h.actor = 'personal'; h.reviewRows = []; h.postRows = []; h.withError = null; h.deleteError = null; h.newMedia = false;
  h.suggestions.mockResolvedValue([candidate]); h.candidates.mockResolvedValue([]); h.search.mockResolvedValue([candidate]); h.mentions.mockResolvedValue({ added: 0, removed: 0, kept: 0 });
  h.rpc.mockResolvedValue({ data: { rating_id: 'review-new' }, error: null });
});
afterEach(cleanup);
function wizard(edit = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(['rv2-course', 'course'], { id: 'course', name: 'Sundridge Park' });
  client.setQueryData(['rv2-existing', 'course', 'author'], edit ? { id: 'review-1', rating: 8, design_score: 8, condition_score: 8, clubhouse_score: 8, facilities_score: 8, review: '', share_to_feed: true } : null);
  client.setQueryData(['rv2-existing-media', 'review-1'], []); client.setQueryData(['rv2-me', 'author'], { display_name: 'Ben' }); client.setQueryData(['rv2-rating-count', 'course'], 0);
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/courses/course/rate']}><Routes><Route path="/courses/:courseId/rate" element={<ReviewComposerV2 />} /></Routes></MemoryRouter></QueryClientProvider>);
}
async function pick(view: ReturnType<typeof wizard>) {
  fireEvent.focus(screen.getByRole('textbox', { name: 'Who did you play with?' }));
  await waitFor(() => expect(view.container.querySelector('.pf4-with-result')).not.toBeNull());
  fireEvent.click(required(view.container, '.pf4-with-result'));
}
function pressSave(view: ReturnType<typeof wizard>) {
  fireEvent.click(required(view.container, '[data-review-primary]'));
  fireEvent.click(required(view.container, '[data-score-overall]'));
  for (const node of view.container.querySelectorAll('[data-score-category]')) fireEvent.click(node);
  fireEvent.click(required(view.container, '[data-review-primary]'));
}
const post = (media = true, video = false): FeedPost => ({ id: 'post-1', userId: 'author', actorId: 'author', actorType: 'personal', displayName: 'Ben Holmes', username: 'ben', avatarUrl: '', isVerified: false, creatorRelation: 'none', caption: 'A good round', createdAt: '2026-11-20T10:00:00Z', likeCount: 0, commentCount: 0, shareCount: 0, isReview: true, review: { reviewId: 'review-1', courseId: 'course', courseName: 'Sundridge Park', rating: 8, reviewText: 'A good round', breakdown: { design: 8, conditions: 8, clubhouse: 8, facilities: 8 } }, isLikedByMe: false, isFollowedByMe: false, mediaItems: media ? [{ id: 'photo', type: video ? 'video' : 'image', imageUrl: '/photo.jpg', thumbnailUrl: '/photo.jpg', hlsUrl: video ? '/video.m3u8' : undefined, width: 800, height: 1000 }] : [] } as FeedPost);
function card(p = post(), extra: Partial<FeedCardProps> = {}) {
  return render(providers(<FeedCard post={p} liked={false} likeCount={0} commentCount={0} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onProfile={vi.fn()} onOpenMedia={vi.fn()} layout="mediaFirst" playedWith={people} {...extra} />));
}

describe('review Played with', () => {
  it('(a) personal wizard puts unchanged selection after text and before the tray', () => {
    const view = wizard(); const words = required(view.container, '[data-step1-words]'); const selection = required(view.container, '[data-testid="played-with"]');
    expect(words.nextElementSibling).toBe(selection); expect(selection.nextElementSibling).toHaveAttribute('data-step1-photos');
  });
  it('(a) business wizard has no Played with selection or suggestions read', () => {
    h.actor = 'business'; const view = wizard(); expect(view.container.querySelector('[data-testid="played-with"]')).toBeNull(); expect(h.suggestions).not.toHaveBeenCalled();
  });
  it('(b) create waits for the returned review id before writing selected ids', async () => {
    let finish: ((v: unknown) => void) | undefined; h.rpc.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const view = wizard(); await pick(view); pressSave(view); await waitFor(() => expect(h.rpc).toHaveBeenCalledWith('submit_course_review_v2', expect.any(Object)));
    expect(h.insert).not.toHaveBeenCalled(); if (!finish) throw new Error('Submit not pending');
    await act(async () => finish?.({ data: { rating_id: 'review-new' }, error: null }));
    await waitFor(() => expect(h.insert).toHaveBeenCalledWith('review_with', [{ review_id: 'review-new', user_id: 'b' }]));
    expect(view.container.querySelector('[data-review-saved]')).not.toBeNull();
  });
  it('(b) edit preloads tags then syncs removal and addition after save', async () => {
    h.reviewRows = [{ review_id: 'review-1', user_id: 'a' }]; h.rpc.mockResolvedValue({ data: { rating_id: 'review-1' }, error: null });
    const view = wizard(true); await screen.findByRole('button', { name: 'Remove Thomas Holmes' }); fireEvent.click(screen.getByRole('button', { name: 'Remove Thomas Holmes' }));
    await pick(view); pressSave(view);
    await waitFor(() => expect(h.deleted).toHaveBeenCalledWith('review_with', [['review_id', 'review-1'], ['user_id', ['a']]]));
    expect(h.insert).toHaveBeenCalledWith('review_with', [{ review_id: 'review-1', user_id: 'b' }]);
    expect(view.container.querySelector('[data-review-saved]')).not.toBeNull();
  });
  it('(c) review tag error reports review_create for eight seconds and still shows saved review', async () => {
    h.withError = failure; const view = wizard(); await pick(view); pressSave(view);
    await waitFor(() => expect(view.container.querySelector('[data-review-saved]')).not.toBeNull());
    expect(h.toast).toHaveBeenCalledWith("Couldn't save who you played with. Foreign key refused (23503)", { duration: 8000 });
    expect(h.track).toHaveBeenCalledWith('post_with_write_failed', { ...failure, count: 1, mode: 'review_create' });
  });
  it.each([false, true])('(d) syncs review mention markup on successful save, edit=%s', async edit => {
    const view = wizard(edit); fireEvent.change(screen.getByRole('textbox', { name: 'Review text' }), { target: { value: markup } }); pressSave(view);
    await waitFor(() => expect(h.mentions).toHaveBeenCalledWith({ sourceType: 'review', sourceId: 'review-new', content: markup, mentionerId: 'author' }));
  });
  it('(e) review photo chip and upward panel clear the measured glass strip', () => {
    const view = card(); const chip = required(view.container, '[data-testid="played-with-chip"]'); expect(chip.style.bottom).toBe('calc(var(--review-glass-h, -12px) + 18px)');
    fireEvent.click(chip); const panel = required(view.container, '[data-testid="played-with-panel"]'); expect(panel.style.bottom).toBe(chip.style.bottom);
    expect(panel.querySelectorAll('[data-played-with-row]')).toHaveLength(2); expect(view.container.querySelector('[data-review-score-strip]')).not.toBeNull();
  });
  it('(e) review video chip clears the mute tap area by eight pixels', () => {
    const view = card(post(true, true)); expect(required(view.container, '[data-testid="played-with-chip"]').style.bottom).toBe('calc(var(--review-glass-h, -12px) + 18px + 44px + 8px)');
  });
  it('(f) review without media opens the sheet from both faces and byline', async () => {
    const view = card(post(false)); expect(view.container.querySelector('[data-testid="played-with-chip"]')).toBeNull();
    fireEvent.click(required(view.container, '[data-testid="played-with-name-faces"]')); await waitFor(() => expect(document.querySelector('[data-testid="played-with-sheet"]')).not.toBeNull());
    cleanup(); const next = card(post(false)); fireEvent.click(required(next.container, '[data-played-with-open]')); await waitFor(() => expect(document.querySelector('[data-testid="played-with-sheet"]')).not.toBeNull());
  });
  it('(g) real review fullscreen chrome shows the chip under its author and opens the panel', () => {
    const view = render(providers(<ImmersiveFullscreenChrome posts={[post()]} activeIndex={0} onClose={vi.fn()} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onMore={vi.fn()}
      getLikeState={() => ({ isLiked: false, count: 0 })} getCommentCount={() => 0} getFollowState={() => false} onFollow={vi.fn()} onViewProfile={vi.fn()} onReviewTap={vi.fn()} isOwnPost={false} playedWith={people} />));
    expect(required(view.container, '[data-fullscreen-author]').nextElementSibling).toHaveAttribute('data-fullscreen-played-with');
    fireEvent.click(required(view.container, '[data-testid="played-with-chip"]')); expect(view.container.querySelector('[data-testid="played-with-panel"]')).not.toBeNull();
  });
  it('(h) one host batch reads distinct review ids once alongside post tags and joins usernames', async () => {
    h.reviewRows = [{ review_id: 'review-1', user_id: 'a' }]; const result = await fetchPostGolfTags([post(false), { ...post(false), id: 'post-2' }]);
    expect(h.tables.mock.calls.filter(([table]) => table === 'review_with')).toHaveLength(1); expect(h.tables.mock.calls.filter(([table]) => table === 'post_with')).toHaveLength(1);
    expect(result.withByReview.get('review-1')).toEqual([{ reviewId: 'review-1', userId: 'a', name: 'Thomas Holmes', username: 'a', avatarUrl: null }]);
  });
  it('(i) tagged viewer gets Remove me on the review and deletes their review tag', async () => {
    const view = card(post(), { currentUserId: 'a' }); const trigger = screen.getByRole('button', { name: 'Post options' }); fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Remove me' }));
    await waitFor(() => expect(h.deleted).toHaveBeenCalledWith('review_with', [['review_id', 'review-1'], ['user_id', 'a']]));
    expect(view.container.querySelector('[data-review-post-card]')).not.toBeNull();
  });
  it.each(['tag', 'mention'])('(j) %s review notification prefers feed post then exact course review', type => {
    const row: ActivityFeedRowV2 = { notif_id: 'notification', notif_type: type, entity_type: 'review', entity_id: 'review-1',
      created_at: '2026-11-20T10:00:00Z', is_read: false, message: null, title: null, actor_user_id: 'author', actor_username: null,
      actor_display_name: null, actor_avatar_url: null, actor_kind: 'personal', actor_route_id: 'author', liker_avatar_urls: null,
      target_course_name: null, target_course_image: null, target_poster_url: null, target_review_rating: null,
      data: { source_type: 'review', course_id: 'course', review_id: 'review-1', post_id: 'post-1' } };
    expect(getActivityLink(row)).toBe('/post/post-1'); expect(getActivityLink({ ...row, data: { ...row.data as object, post_id: null } })).toBe('/courses/course?tab=reviews&review=review-1');
  });
  it('review writer excludes self', async () => {
    expect(await writeReviewWith('review-1', 'author', ['author', 'a', 'a'])).toEqual({ saved: ['a'], error: null }); expect(h.insert).toHaveBeenCalledWith('review_with', [{ review_id: 'review-1', user_id: 'a' }]);
  });
  it('review writer caps at eight tagged members', async () => {
    const result = await writeReviewWith('review-1', 'author', Array.from({ length: 10 }, (_, i) => `u${i}`)); expect(result.saved).toEqual(['u0', 'u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7']);
  });
  it('sync returns the first removal error and does not insert', async () => {
    h.deleteError = failure; expect(await syncReviewWith('review-1', 'author', ['a'], ['b'])).toEqual(failure); expect(h.insert).not.toHaveBeenCalled();
  });
  it('mention failure only warns and leaves saved review successful', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {}); const error = new Error('Mention service unavailable'); h.mentions.mockRejectedValueOnce(error);
    await expect(saveReviewSocial({ reviewId: 'review-1', userId: 'author', content: markup, previous: [], next: [], edit: false, personal: true })).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith('[review-v2] mention sync failed:', error); expect(h.toast).not.toHaveBeenCalled(); warn.mockRestore();
  });
  it('staged wizard waits for the published review id and preserves mention markup', async () => {
    h.newMedia = true; h.rpc.mockResolvedValue({ data: 'pending-1', error: null }); const view = wizard(); await pick(view);
    fireEvent.change(screen.getByRole('textbox', { name: 'Review text' }), { target: { value: markup } }); pressSave(view);
    await waitFor(() => expect(h.background).toHaveBeenCalled()); expect(h.insert).not.toHaveBeenCalled(); expect(h.mentions).not.toHaveBeenCalled();
    const opts = h.background.mock.calls[0]?.[1] as { onPublished: (id: string) => Promise<void> }; await act(async () => opts.onPublished('review-published'));
    expect(h.insert).toHaveBeenCalledWith('review_with', [{ review_id: 'review-published', user_id: 'b' }]); expect(h.mentions).toHaveBeenCalledWith({ sourceType: 'review', sourceId: 'review-published', content: markup, mentionerId: 'author' });
  });
  it('suggestions pass a known course/play day unchanged and otherwise null', async () => {
    const initial = { userId: 'author', reviewId: null, personal: true, content: '', round: null as { courseId: string; day: string } | null };
    const hook = renderHook(props => useReviewPlayedWith(props), { initialProps: initial }); await waitFor(() => expect(h.suggestions).toHaveBeenCalledWith('author', null));
    hook.rerender({ ...initial, round: { courseId: 'course', day: '2026-11-19' } }); await waitFor(() => expect(h.suggestions).toHaveBeenLastCalledWith('author', { courseId: 'course', day: '2026-11-19' }));
  });
  it('review with no tags renders no new display', () => {
    const view = card(post(), { playedWith: [] }); expect(view.container.querySelector('[data-testid="played-with-chip"]')).toBeNull(); expect(view.container.querySelector('[data-testid="played-with-name-faces"]')).toBeNull();
  });
  it('empty review id list causes no read', async () => { expect(await readReviewWith([])).toEqual([]); expect(h.tables).not.toHaveBeenCalled(); });
});