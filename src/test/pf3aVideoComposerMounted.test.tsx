import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { StageState } from '@/features/post-v2/hooks/useStageComposer';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: { id: 'me' } }) }));
const actor = { type: 'personal', id: 'me', name: 'Me' };
vi.mock('@/features/post-v2/hooks/useComposerActor', () => ({ useComposerActor: () => ({ activeActor: actor, selectActor: vi.fn(), applyDraftActor: vi.fn() }) }));
vi.mock('@/features/post-v2/hooks/usePostSubmit', () => ({ usePostSubmit: () => ({ submit: vi.fn(), submitting: false }) }));
vi.mock('@/features/post-v2/hooks/useDrafts', () => ({ useDrafts: () => ({ drafts: [], save: vi.fn(), remove: vi.fn() }) }));
vi.mock('@/hooks/useEditablePost', () => ({ useEditablePost: () => ({ data: null, isFetched: false }) }));
vi.mock('@/hooks/gam/useCourseHoleAnalysis', () => ({ useCourseHoleAnalysis: () => ({ data: null }) }));
vi.mock('@/features/courses/hooks/useCourseTeeSets', () => ({ useCourseTeeSets: () => ({ data: [] }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes', () => ({ useRoundHoleShapes: () => new Map() }));
vi.mock('@/features/post-v2/lib/golfPostReads', () => ({ fetchRecentCourses: async () => [], fetchPlayedWithSuggestions: async () => [], firstCaptureDay: async () => null, findRoundCourse: async () => null, searchMembers: async () => [] }));
vi.mock('@/features/post-v2/lib/composerGolfReads', () => ({ readComposerRounds: async () => [], readClaimedCourse: async () => null, readNearbyCourse: async () => null, readGolfCourse: async () => null, roundIsRecent: () => false }));
vi.mock('@/features/post-v2/lib/postUploadController', () => ({ startPostUpload: vi.fn() }));
vi.mock('@/hooks/useMedianStatusBar', () => ({ setStatusBarStyleColor: vi.fn() }));
vi.mock('@/lib/routeChrome', () => ({ applyRouteChrome: vi.fn() }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/features/post-v2/lib/videoPoster', () => ({ extractPoster: async () => '/frame.jpg', getCachedPoster: () => '/frame.jpg' }));
vi.mock('@/features/post-v2/components/MediaStageV2', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/FramePills', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/CourseTagSheet', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/ActorSheet', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/ScheduleSheetV2', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/DraftsSheetV2', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/ScheduledPostsSheetV2', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/CoverFrameSheet', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/AdjustSheet', () => ({ default: () => null }));
vi.mock('@/features/post-v2/components/golf/PostPreview', () => ({ PostPreview: () => null, buildDraftFeedPost: () => ({}) }));

// Retain the real state hook and media add/remove controls. Only seed its
// initial video so jsdom need not decode a video file to discover duration.
vi.mock('@/features/post-v2/hooks/useStageComposer', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/post-v2/hooks/useStageComposer')>();
  const { useEffect } = await import('react');
  return { ...actual, useStageComposer: () => {
    const composer = actual.useStageComposer();
    useEffect(() => { composer.hydrate({ media: [{ id: 'video', type: 'video', previewUrl: '/video.mp4', frame: 'original', duration: 1080 }], caption: 'Original description' } satisfies Partial<StageState>); }, [composer.hydrate]);
    return composer;
  } };
});

import StageComposer from '@/features/post-v2/StageComposer';
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('PF3A mounted composer media transitions', () => {
  it('switches long-video header and publish button to post mode and restores title and details after photo removal', async () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:added-photo') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(<MemoryRouter><QueryClientProvider client={client}><StageComposer onClose={() => {}} /></QueryClientProvider></MemoryRouter>);
    await screen.findByText('New video', { exact: true });
    const primary = () => view.container.querySelector('[data-testid="share-sub"]')?.previousElementSibling;
    expect(primary()).toHaveTextContent('PUBLISH VIDEO');
    fireEvent.change(screen.getByRole('textbox', { name: 'Video title' }), { target: { value: 'Retained film title' } });
    fireEvent.click(screen.getByRole('button', { name: /^Description/ }));
    fireEvent.click(screen.getByRole('button', { name: '+ Add gear' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Gear' }), { target: { value: 'Retained driver' } });
    fireEvent.click(screen.getByRole('button', { name: 'ADD GEAR' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to composer' }));

    const picker = view.container.querySelector('input[type="file"][hidden]');
    expect(picker).not.toBeNull();
    if (!picker) throw new Error('Composer file picker missing');
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await act(async () => { fireEvent.change(picker, { target: { files: [new File(['photo'], 'added.jpg', { type: 'image/jpeg' })] } }); });
    await screen.findByText('New post', { exact: true });
    expect(screen.queryByRole('textbox', { name: 'Video title' })).toBeNull();
    expect(screen.queryByText('PUBLISH VIDEO', { exact: true })).toBeNull();
    expect(primary()).toBeEnabled();
    // Translation mocks intentionally return ''; assert the mode and real
    // button, not invented translations or modified production defaults.
    fireEvent.click(screen.getByRole('button', { name: 'Photo 2' }));
    const mediaSheet = screen.getByRole('dialog', { name: '' });
    const removeButtons = within(mediaSheet).getAllByRole('button', { name: 'Remove' });
    const removePhoto = removeButtons[1];
    expect(removePhoto).toBeDefined();
    if (!removePhoto) throw new Error('Added photo removal missing');
    fireEvent.click(removePhoto);
    await waitFor(() => expect(screen.getByText('New video', { exact: true })).toBeInTheDocument());
    expect(primary()).toHaveTextContent('PUBLISH VIDEO');
    expect(screen.getByRole('textbox', { name: 'Video title' })).toHaveValue('Retained film title');
    expect(screen.getByRole('button', { name: /^Description/ })).toHaveTextContent('Original description');
    fireEvent.click(screen.getByRole('button', { name: /^Description/ }));
    const details = screen.getByRole('dialog', { name: 'Video Details' });
    expect(within(details).getByText('Retained driver', { exact: true })).toBeInTheDocument();
    expect(within(details).getByRole('button', { name: 'Gear in this video · 1' })).toHaveAttribute('data-filled', 'true');
    client.clear();
  });
});