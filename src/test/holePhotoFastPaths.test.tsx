import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { advanceBatch, batchVerdicts, closedHoleCount, orderedBatch, startBatch, type BatchPhoto } from '@/lib/courseMedia/holePhotoBatch';
import { HoleKnownPhotoPath, HolePhotoBatchPath } from '@/components/course-media-tab/HolePhotoFastPaths';
import { HolePhotoPicker } from '@/components/course-media-tab/HolePhotoPicker';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';
const round = { id: 'score', userId: 'member', golfCourseId: 'course', playDate: '2026-05-14', grossScore: 82 };
const photo = (url: string, day: string | null = '2026-05-14'): BatchPhoto => ({ url, createdAt: '2026-10-01T12:00:00Z', exif: { captureDay: day, capturedAt: day ? `${day}T12:00:00` : null, latitude: null, longitude: null } });
const pathA = { hole: 3, photos: ['/a.jpg'], pending: false, result: null, error: null, onChoose: () => {}, onLibrary: () => {}, onClose: () => {} };
describe('MEDIA_FAST_1', () => {
  it('known-hole path never renders any hole choice', () => {
    render(<HoleKnownPhotoPath {...pathA} round={round} />);
    expect(screen.queryByRole('group', { name: 'Hole' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Hole 3' })).toBeNull();
  });
  it('known-hole proof row is absent without a round and present with one', () => {
    const view = render(<HoleKnownPhotoPath {...pathA} />);
    expect(view.container.ownerDocument.querySelector('.hole-photo-fast-verdict')).toBeNull();
    view.rerender(<HoleKnownPhotoPath {...pathA} round={round} />);
    expect(view.container.ownerDocument.querySelectorAll('.hole-photo-fast-verdict')).toHaveLength(1);
  });
  it('choosing a photo passes its real URL without another hole question', () => {
    const choose = vi.fn(); render(<HoleKnownPhotoPath {...pathA} onChoose={choose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose photograph' })); expect(choose).toHaveBeenCalledWith('/a.jpg');
  });
  it('library selection passes the original File', () => {
    const library = vi.fn(); render(<HoleKnownPhotoPath {...pathA} onLibrary={library} />);
    const input = document.querySelector('input[type=file]');
    if (!input) throw new Error('File chooser missing');
    const file = new File(['photo'], 'chosen.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } }); expect(library).toHaveBeenCalledWith(file);
  });
  it('last tag sets floor seven and closes six, not seven', () => {
    const state = advanceBatch(advanceBatch(startBatch(), 'a', 4), 'b', 7);
    expect(state.floor).toBe(7); expect(closedHoleCount(state.floor)).toBe(6);
  });
  it('skip leaves floor and tags unchanged', () => {
    const state = advanceBatch(startBatch(), 'a', 7); const skipped = advanceBatch(state, 'b', null);
    expect(skipped.floor).toBe(7); expect(skipped.tags).toEqual({ a: 7 }); expect(skipped.index).toBe(2);
  });
  it('repeated seventh tags remain legitimate while backwards tags refuse', () => {
    const state = advanceBatch(startBatch(), 'a', 7);
    expect(advanceBatch(state, 'b', 7).tags).toEqual({ a: 7, b: 7 });
    expect(() => advanceBatch(state, 'b', 4)).toThrow('This hole is closed.');
  });
  it('closed always beats used, seventh remains green and selectable', () => {
    render(<HolePhotoPicker holeCount={9} floor={7} selectedHole={null} usedHoles={[4, 7]} onSelect={() => {}} />);
    const four = screen.getByRole('button', { name: 'Hole 4' }); const seven = screen.getByRole('button', { name: 'Hole 7' });
    expect(four).toBeDisabled(); expect(four).toHaveAttribute('data-state', 'closed');
    expect(seven).toBeEnabled(); expect(seven).toHaveAttribute('data-state', 'used');
    expect(screen.getByRole('button', { name: 'Hole 8' })).toHaveAttribute('data-state', 'open');
  });
  it('five matching EXIF photos all publish', () => {
    expect(batchVerdicts(Array.from({ length: 5 }, (_, i) => photo(String(i))), 'member', 'course', [round])).toEqual({ published: 5, waiting: 0, all: true });
  });
  it('one unmatched EXIF date splits five into four publish and one wait', () => {
    expect(batchVerdicts([photo('1'), photo('2'), photo('3'), photo('4'), photo('5', '2026-05-15')], 'member', 'course', [round])).toEqual({ published: 4, waiting: 1, all: false });
  });
  it('created_at fallback never supplies publication proof', () => {
    expect(batchVerdicts([{ ...photo('1', null), createdAt: '2026-05-14' }], 'member', 'course', [round])).toEqual({ published: 0, waiting: 1, all: false });
  });
  it('batch is oldest first using capture date before contribution date', () => {
    expect(orderedBatch([photo('later', '2026-05-15'), photo('earlier'), photo('undated', null)]).map(p => p.url)).toEqual(['earlier', 'later', 'undated']);
  });
  it('skipping in the batch invokes no write and source remains available in a later batch', () => {
    const tag = vi.fn(); const props = { photos: [photo('/a.jpg'), photo('/b.jpg')], rounds: [round], memberId: 'member', courseId: 'course', knownHoles: [4, 7], onTag: tag, onClose: () => {} };
    const view = render(<HolePhotoBatchPath {...props} />); fireEvent.click(screen.getByRole('button', { name: 'Skip this one' }));
    expect(tag).not.toHaveBeenCalled(); expect(screen.getByAltText('Current photograph')).toHaveAttribute('src', '/b.jpg');
    view.unmount(); render(<HolePhotoBatchPath {...props} />); expect(screen.getByAltText('Current photograph')).toHaveAttribute('src', '/a.jpg');
  });
  it('successful next tags exact URL and hole then advances', async () => {
    const tag = vi.fn().mockResolvedValue({ status: 'approved' } as HolePhoto);
    render(<HolePhotoBatchPath photos={[photo('/a.jpg'), photo('/b.jpg')]} rounds={[round]} memberId="member" courseId="course" knownHoles={[4, 7]} onTag={tag} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' })); fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    await waitFor(() => expect(screen.getByAltText('Current photograph')).toHaveAttribute('src', '/b.jpg'));
    expect(tag).toHaveBeenCalledWith('/a.jpg', 7); expect(screen.getByRole('button', { name: 'Hole 4' })).toBeDisabled();
  });
});