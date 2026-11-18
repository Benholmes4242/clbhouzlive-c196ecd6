/** REVIEW_EDITOR_SAFETY — published words and photos are never lost by accident. */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
const f = vi.hoisted(() => ({ invoke: vi.fn(), from: vi.fn(), track: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ SUPABASE_URL: 'https://app.test', supabase: { functions: { invoke: f.invoke }, rpc: vi.fn(), from: f.from, auth: { getSession: vi.fn() } } }));
vi.mock('@/lib/courseMedia/composerHolePhotos', () => ({ writeComposerHolePhoto: vi.fn() }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: f.track } }));
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn() } }));
import { useReviewMediaPipeline } from '@/features/review-v2/hooks/useReviewMediaPipeline';
import { EditLossSheet, editLoss } from '@/features/review-v2/components/EditLossSheet';
import { RemoveReviewSheetV2, removeReviewCopy } from '@/features/review-v2/components/RemoveReviewSheetV2';

const existingMedia = [
  { id: 'row-1', media_url: 'https://m/1.jpg', media_type: 'image', poster_url: null, stream_id: null },
  { id: 'row-2', media_url: 'https://m/2.jpg', media_type: 'image', poster_url: null, stream_id: null },
  { id: 'row-3', media_url: 'https://m/3.m3u8', media_type: 'video', poster_url: null, stream_id: 's3' },
] as never[];
const pipeline = () => renderHook(() => useReviewMediaPipeline({ userId: 'me', existingMedia }));
const cleanups = () => f.invoke.mock.calls.filter(c => c[0] === 'cleanup-review-media');

beforeEach(() => { vi.clearAllMocks(); f.invoke.mockResolvedValue({ data: {}, error: null }); });
afterEach(() => cleanup());

describe('provisional removal of published media', () => {
  it('(a) removing an existing photo then abandoning calls no cleanup and deletes no row', async () => {
    const view = pipeline();
    await act(async () => { await view.result.current.removeItem('existing-row-1'); });
    expect(view.result.current.items.map(i => i.dbRowId)).toEqual(['row-2', 'row-3']);
    view.result.current.abandon(); view.unmount();
    expect(cleanups()).toHaveLength(0);
    expect(f.from).not.toHaveBeenCalled();
  });
  it('(b) removing then saving calls cleanup once with exactly those rows', async () => {
    const view = pipeline();
    await act(async () => { await view.result.current.removeItem('existing-row-1'); await view.result.current.removeItem('existing-row-3'); });
    expect(cleanups()).toHaveLength(0);
    act(() => view.result.current.commitRemovals({ courseId: 'c', mode: 'edit' }));
    expect(cleanups()).toHaveLength(1);
    expect(cleanups()[0][1].body.mediaItems.map((m: { id: string }) => m.id)).toEqual(['row-1', 'row-3']);
    expect(f.track).toHaveBeenCalledWith('review_media_removed', { course_id: 'c', mode: 'edit', count: 2 });
    act(() => view.result.current.commitRemovals({ courseId: 'c', mode: 'edit' }));
    expect(cleanups()).toHaveLength(1);
  });
  it('(c) a failed save keeps the photos', async () => {
    const view = pipeline();
    await act(async () => { await view.result.current.removeItem('existing-row-2'); });
    act(() => view.result.current.discardRemovals());
    expect(view.result.current.items.map(i => i.dbRowId).sort()).toEqual(['row-1', 'row-2', 'row-3']);
    expect(view.result.current.pendingRemovals()).toHaveLength(0);
    expect(cleanups()).toHaveLength(0);
  });
});

describe('confirm before a save that loses content', () => {
  it('(d) clearing published text or removing a published photo raises the sheet; Keep submits nothing, Remove and save submits', () => {
    expect(editLoss('Lovely links', '  ', [])).toEqual({ textRemoved: true, photos: 0, videos: 0 });
    expect(editLoss('', '', [{ type: 'image' }])).toEqual({ textRemoved: false, photos: 1, videos: 0 });
    const submit = vi.fn(); const keep = vi.fn();
    render(<EditLossSheet loss={{ textRemoved: true, photos: 3, videos: 1 }} onKeep={keep} onConfirm={submit} />);
    expect(screen.getByText('Remove from your review?')).not.toBeNull();
    expect(document.querySelector('[data-edit-loss-list]')?.textContent).toBe('Your written review, 3 photos and 1 video will be removed.');
    fireEvent.click(screen.getByRole('button', { name: 'Keep them' }));
    expect(keep).toHaveBeenCalledTimes(1); expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Remove and save' }));
    expect(submit).toHaveBeenCalledTimes(1);
  });
  it('(e) no sheet when only scores change', () => {
    expect(editLoss('Lovely links', 'Lovely links', [])).toBeNull();
    expect(editLoss('', '', [])).toBeNull();
    const view = render(<EditLossSheet loss={null} onKeep={vi.fn()} onConfirm={vi.fn()} />);
    expect(view.container.querySelector('[data-edit-loss-sheet]')).toBeNull();
  });
});

describe('removing a review states what it takes', () => {
  it('(f) the remove-review confirm names the media count', () => {
    expect(removeReviewCopy({ photos: 3 })).toBe("This deletes your review, its 3 photos and its post. This can't be undone.");
    render(<RemoveReviewSheetV2 open onCancel={vi.fn()} onConfirm={vi.fn()} hasText photos={1} videos={2} />);
    expect(screen.getByText("This deletes your review, its written review, its 1 photo, its 2 videos and its post. This can't be undone.")).not.toBeNull();
  });
});
