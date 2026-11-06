import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => ({ actor: { type: 'personal', id: 'me', name: 'Me' }, submit: vi.fn(), reset: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: { id: 'me' } }) }));
vi.mock('@/features/post-v2/hooks/useComposerActor', () => ({ useComposerActor: () => ({ activeActor: h.actor, selectActor: vi.fn(), applyDraftActor: vi.fn() }) }));
vi.mock('@/features/post-v2/hooks/usePostSubmit', () => ({ usePostSubmit: () => ({ submit: h.submit, submitting: false }) }));
vi.mock('@/features/post-v2/hooks/useStageComposer', () => ({ MAX_MEDIA: 10, useStageComposer: () => ({
  state: { media: [{ id: 'photo', type: 'image', previewUrl: '/photo.jpg', frame: 'original' }], caption: 'New post', courses: [], course: null, activeIndex: 0, scheduledAt: null, dirty: false },
  addFiles: vi.fn(), removeAt: vi.fn(), reorder: vi.fn(), setActiveIndex: vi.fn(), updateActive: vi.fn(), setCaption: vi.fn(), setCourse: vi.fn(), setCourses: vi.fn(), setScheduledAt: vi.fn(), restoreDraft: vi.fn(), hydrate: vi.fn(), reset: h.reset,
}) }));
vi.mock('@/features/post-v2/hooks/useDrafts', () => ({ useDrafts: () => ({ drafts: [], save: vi.fn(), remove: vi.fn() }) }));
vi.mock('@/hooks/useEditablePost', () => ({ useEditablePost: () => ({ data: null, isFetched: false }) }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => ({ data: null }) }));
vi.mock('@/features/post-v2/lib/golfPostReads', () => ({ fetchRecentCourses: async () => [], fetchPlayedWithSuggestions: async () => [], firstCaptureDay: async () => null, findRoundCourse: async () => null, searchMembers: async () => [] }));
vi.mock('@/features/post-v2/lib/postUploadController', () => ({ startPostUpload: vi.fn() }));
vi.mock('@/hooks/useMedianStatusBar', () => ({ setStatusBarStyleColor: vi.fn() }));
vi.mock('@/lib/routeChrome', () => ({ applyRouteChrome: vi.fn() }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
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
vi.mock('@/features/post-v2/components/golf/GolfPostSections', () => ({ GolfShotStrip: () => null, ShotTagSheet: () => null, WhereSection: () => null, PlayedWithSection: () => null, FindSomeoneSheet: () => null, VisibilitySheet: () => null }));
vi.mock('@/features/post-v2/components/golf/PostPreview', () => ({ PostPreview: () => null, buildDraftFeedPost: () => ({}) }));
vi.mock('@/features/post-v2/components/PostSuccessV2', () => ({ default: ({ onViewPost, onDone }: { onViewPost?: () => void; onDone: () => void }) => <><button aria-label="view-result" onClick={onViewPost} /><button aria-label="done-result" onClick={onDone} /></> }));

import StageComposer from '@/features/post-v2/StageComposer';

beforeEach(() => { h.actor = { type: 'personal', id: 'me', name: 'Me' }; h.submit.mockReset().mockResolvedValue({ kind: 'published', postId: 'new-post' }); h.reset.mockClear(); });
afterEach(cleanup);

async function publish() {
  const onViewPost = vi.fn(), onPosted = vi.fn(), onClose = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<MemoryRouter><QueryClientProvider client={client}><StageComposer onViewPost={onViewPost} onPosted={onPosted} onClose={onClose} /></QueryClientProvider></MemoryRouter>);
  const primary = view.container.querySelector('[data-testid="share-sub"]')?.previousElementSibling;
  expect(primary).toBeInstanceOf(HTMLButtonElement);
  await act(async () => { if (primary) fireEvent.click(primary); });
  await waitFor(() => expect(h.submit).toHaveBeenCalledTimes(1));
  await screen.findByRole('button', { name: 'view-result' });
  return { onViewPost, onPosted, onClose, client };
}

describe('VIEW_POST_1 StageComposer success handoff', () => {
  it.each([['personal', 'me', '/profile'], ['business', 'business-one', '/business/business-one']])('passes the %s posting author destination without invoking close or Done', async (type, id, closeTo) => {
    h.actor = { type, id, name: 'Author' };
    const callbacks = await publish();
    fireEvent.click(screen.getByRole('button', { name: 'view-result' }));
    expect(callbacks.onViewPost).toHaveBeenCalledExactlyOnceWith('new-post', closeTo);
    expect(callbacks.onPosted).not.toHaveBeenCalled();
    expect(callbacks.onClose).not.toHaveBeenCalled();
  });
  it('Done preserves the posted and close callbacks', async () => {
    const callbacks = await publish();
    fireEvent.click(screen.getByRole('button', { name: 'done-result' }));
    expect(callbacks.onPosted).toHaveBeenCalledTimes(1);
    expect(callbacks.onClose).toHaveBeenCalledTimes(1);
    expect(callbacks.onViewPost).not.toHaveBeenCalled();
  });
});