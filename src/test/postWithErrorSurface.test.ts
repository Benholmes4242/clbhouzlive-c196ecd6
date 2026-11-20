import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
type EditablePost = NonNullable<ReturnType<typeof import('@/hooks/useEditablePost').useEditablePost>['data']>;
const h = vi.hoisted(() => ({ actor: { type: 'personal', id: 'me', name: 'Me' }, reset: vi.fn(), upload: vi.fn(), track: vi.fn(), toast: vi.fn(), insert: vi.fn(), remove: vi.fn(), patch: vi.fn(), rpc: vi.fn(), editable: null as EditablePost | null }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: h.actor }) }));
vi.mock('@/lib/toast', () => ({ toast: { error: h.toast } }));
vi.mock('@/features/post-v2/lib/videoDetailsWrites', () => ({ writeVideoDetails: async () => {} }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc, from: (table: string) => {
  const query = { eq: () => query, in: () => query, maybeSingle: async () => ({ data: null, error: null }), select: async () => ({ data: [{ id: 'post-1' }], error: null }), then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: null, error: null }).then(resolve) };
  return { ...query, insert: h.insert, delete: () => ({ eq: () => ({ in: h.remove, then: query.then }) }), update: (payload: unknown) => { h.patch(table, payload); return query; } };
} } }));
vi.mock('@/features/post-v2/lib/postWith', async original => ({ ...await original<typeof import('@/features/post-v2/lib/postWith')>(), readPostWith: async () => [] }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: { id: 'me' } }) }));
vi.mock('@/features/post-v2/hooks/useComposerActor', () => ({ useComposerActor: () => ({ activeActor: h.actor, selectActor: vi.fn(), applyDraftActor: vi.fn() }) }));
vi.mock('@/features/post-v2/hooks/useStageComposer', () => ({ MAX_MEDIA: 10, useStageComposer: () => ({
  state: { media: [{ id: 'photo', existingId: 'photo', type: 'image', previewUrl: '/photo.jpg', frame: 'original' }], caption: 'New post', courses: [], course: null, activeIndex: 0, scheduledAt: null, dirty: true },
  addFiles: vi.fn(), removeAt: vi.fn(), reorder: vi.fn(), setActiveIndex: vi.fn(), updateActive: vi.fn(), setCaption: vi.fn(), setCourse: vi.fn(), setCourses: vi.fn(), setScheduledAt: vi.fn(), restoreDraft: vi.fn(), hydrate: vi.fn(), reset: h.reset,
}) }));
vi.mock('@/features/post-v2/hooks/useDrafts', () => ({ useDrafts: () => ({ drafts: [], save: vi.fn(), remove: vi.fn() }) }));
vi.mock('@/hooks/useEditablePost', () => ({ useEditablePost: () => ({ data: h.editable, isFetched: true }) }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => ({ data: null }) }));
vi.mock('@/features/post-v2/lib/golfPostReads', () => ({ fetchRecentCourses: async () => [], fetchPlayedWithSuggestions: async () => [], firstCaptureDay: async () => null, findRoundCourse: async () => null, searchMembers: async () => [] }));
vi.mock('@/features/post-v2/lib/postUploadController', () => ({ startPostUpload: h.upload }));
vi.mock('@/hooks/useMedianStatusBar', () => ({ setStatusBarStyleColor: vi.fn() }));
vi.mock('@/lib/routeChrome', () => ({ applyRouteChrome: vi.fn() }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track } }));
vi.mock('@/features/composer-flow/components/ComposerStepHeader', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/MediaStageV2', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/FramePills', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/MediaTray', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/SlideThumb', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/CaptionField', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/CourseTagSheet', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/ActorSheet', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/ScheduleSheetV2', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/DraftsSheetV2', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/ScheduledPostsSheetV2', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/CoverFrameSheet', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/AdjustSheet', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/BottomSheet', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/golf/GolfPostSections', () => ({ GolfShotStrip: () => null, ShotTagSheet: () => null, WhereSection: () => null, PlayedWithSection: ({ onToggle }: { onToggle: (p: unknown) => void }) => React.createElement('button', { 'aria-label': 'add-person', onClick: () => onToggle({ id: 'b', name: 'Danny', avatarUrl: null, sameRound: false, lastInteraction: '' }) }), FindSomeoneSheet: () => null, VisibilitySheet: () => null }));
vi.mock('@/features/post-v2/components/golf/PostPreview', () => ({ PostPreview: () => null, buildDraftFeedPost: () => ({}) }));

import StageComposer from '@/features/post-v2/StageComposer';
import { usePostSubmit, type SubmitResult } from '@/features/post-v2/hooks/usePostSubmit';
import { writePostWith, syncPostWith } from '@/features/post-v2/lib/postWith';
import { reportPostWithError } from '@/features/post-v2/lib/postWithError';
const failure = { code: '23503', message: 'Foreign key refused', details: 'Member key is missing', hint: 'Check member identity' };
const input = { caption: 'A round', media: [], course: null, scheduledAt: null, actorType: 'personal' as const, actorId: 'me', authorName: 'Me', authorAvatarUrl: null, authorUsername: null, playedWith: ['a', 'b', 'c'], playedWithPeople: [{ id: 'a', name: 'Thomas' }, { id: 'b', name: 'Danny' }, { id: 'c', name: 'Mike' }] };
beforeEach(() => {
  vi.clearAllMocks(); h.editable = null;
  h.insert.mockResolvedValue({ error: null }); h.remove.mockResolvedValue({ error: null });
  h.rpc.mockResolvedValue({ data: { post_id: 'post-1' }, error: null });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function expectFailure(mode: 'create' | 'edit', count: number) {
  expect(h.toast).toHaveBeenCalledExactlyOnceWith("Couldn't save who you played with. Foreign key refused (23503)", { duration: 8000 });
  expect(h.track).toHaveBeenCalledWith('post_with_write_failed', { ...failure, count, mode });
}
async function submit(media: import('@/features/post-v2/hooks/useStageComposer').StageMediaItem[] = input.media) {
  const hook = renderHook(() => usePostSubmit());
  let result: SubmitResult | undefined;
  await act(async () => { result = await hook.result.current.submit({ ...input, media }); });
  if (!result) throw new Error('Submit did not resolve');
  expect(hook.result.current.error).toBeNull();
  return result;
}
async function saveEdit() {
  h.editable = { canManage: true, userId: 'me', actorType: 'personal', actorId: 'me', caption: 'A round', media: [], courses: [] } as EditablePost;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(React.createElement(MemoryRouter, null, React.createElement(QueryClientProvider, { client }, React.createElement(StageComposer, { editPostId: 'post-1', onClose: () => {} }))));
  await screen.findByRole('button', { name: 'add-person' });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'add-person' })); });
  const primary = view.container.querySelector('[data-testid="share-sub"]')?.previousElementSibling;
  if (!(primary instanceof HTMLButtonElement)) throw new Error('Save button missing');
  await act(async () => { fireEvent.click(primary); });
  await waitFor(() => expect(h.patch).toHaveBeenCalledWith('posts', expect.any(Object)));
  return { view, client };
}
describe('Played with save errors', () => {
  it('insert error returns saved [] and exact Supabase diagnostic fields', async () => {
    h.insert.mockResolvedValue({ error: { ...failure, extra: 'not returned' } });
    expect(await writePostWith('post-1', 'me', ['a'])).toEqual({ saved: [], error: failure });
    expect(console.warn).toHaveBeenCalledWith('[post-v2] post_with write failed:', { ...failure, extra: 'not returned' });
  });
  it('submit failure still resolves the post, reports diagnostics and omits success names', async () => {
    h.insert.mockResolvedValue({ error: failure });
    const result = await submit();
    expect(result).toMatchObject({ kind: 'published', postId: 'post-1', playedWithNames: [] });
    expectFailure('create', 3);
  });
  it('media submit failure still starts uploading and omits unsaved names', async () => {
    h.insert.mockResolvedValue({ error: failure });
    const result = await submit([{ id: 'image', type: 'image', frame: 'original', previewUrl: '/photo.jpg' }]);
    expect(result).toMatchObject({ kind: 'uploading', postId: 'post-1', playedWithNames: [] });
    expect(h.upload).toHaveBeenCalledOnce(); expectFailure('create', 3);
  });
  it('edit save sync error shows the same toast, tracks edit and reaches success', async () => {
    h.insert.mockResolvedValue({ error: failure });
    const { view, client } = await saveEdit();
    expectFailure('edit', 1);
    expect(view.container.querySelector('[data-testid="share-sub"]')).toBeNull();
    client.clear();
  });
  it('successful submit preserves saved names without a toast or failure event', async () => {
    expect(await submit()).toMatchObject({ postId: 'post-1', playedWithNames: ['Thomas', 'Danny', 'Mike'] });
    expect(h.toast).not.toHaveBeenCalled(); expect(h.track).not.toHaveBeenCalled();
  });
  it('successful edit emits no failure toast or event', async () => {
    const { client } = await saveEdit();
    expect(h.toast).not.toHaveBeenCalled();
    expect(h.track.mock.calls.filter(([name]) => name === 'post_with_write_failed')).toEqual([]);
    client.clear();
  });
  it('sync returns the delete error first without attempting an insert', async () => {
    h.remove.mockResolvedValue({ error: failure });
    expect(await syncPostWith('post-1', 'me', ['a'], ['b'])).toEqual(failure);
    expect(h.insert).not.toHaveBeenCalled();
  });
  it('sync returns the insert error after a successful delete', async () => {
    h.insert.mockResolvedValue({ error: failure });
    expect(await syncPostWith('post-1', 'me', ['a'], ['b'])).toEqual(failure);
    expect(h.remove).toHaveBeenCalledWith('user_id', ['a']);
  });
  it('null code is omitted from toast and all nullable diagnostics stay null', () => {
    const error = { message: 'Refused', code: null, details: null, hint: null };
    reportPostWithError(error, 2, 'create');
    expect(h.toast).toHaveBeenCalledWith("Couldn't save who you played with. Refused", { duration: 8000 });
    expect(h.track).toHaveBeenCalledWith('post_with_write_failed', { ...error, count: 2, mode: 'create' });
  });
});
