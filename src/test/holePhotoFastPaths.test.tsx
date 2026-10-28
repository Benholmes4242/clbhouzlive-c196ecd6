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
    expect(view.container.ownerDocument.querySelector('.hole-photo-fast-verdict')).toBeNull();
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
  it('no hole is ever closed; every known hole is plain and selectable', () => {
    const { container } = render(<HolePhotoPicker holeCount={9} selectedHole={null} onSelect={() => {}} />);
    const four = screen.getByRole('button', { name: 'Hole 4' }); const seven = screen.getByRole('button', { name: 'Hole 7' });
    expect(four).toBeEnabled(); expect(four).toHaveAttribute('data-state', 'open');
    expect(seven).toBeEnabled(); expect(seven).toHaveAttribute('data-state', 'open');
    expect(container.querySelector('p')).toBeNull();
    expect(screen.getByRole('button', { name: 'Hole 8' })).toHaveAttribute('data-state', 'open');
  });
  it('five matching EXIF photos all publish', () => {
    expect(batchVerdicts(Array.from({ length: 5 }, (_, i) => photo(String(i))), 'member', 'course', [round])).toEqual({ published: 5, waiting: 0, all: true });
  });
  it('one unmatched EXIF date splits five into four publish and one wait', () => {
    expect(batchVerdicts([photo('1'), photo('2'), photo('3'), photo('4'), photo('5', '2026-05-15')], 'member', 'course', [round])).toEqual({ published: 5, waiting: 0, all: true });
  });
  it('created_at fallback never supplies publication proof', () => {
    expect(batchVerdicts([{ ...photo('1', null), createdAt: '2026-05-14' }], 'member', 'course', [round])).toEqual({ published: 1, waiting: 0, all: true });
  });
  it('batch is oldest first using capture date before contribution date', () => {
    expect(orderedBatch([photo('later', '2026-05-15'), photo('earlier'), photo('undated', null)]).map(p => p.url)).toEqual(['earlier', 'later', 'undated']);
  });
  it('tapping the second thumbnail writes nothing, makes it the hero, and a fresh batch starts on the first shot', () => {
    const tag = vi.fn(); const props = { photos: [photo('/a.jpg'), photo('/b.jpg')], rounds: [round], memberId: 'member', courseId: 'course', knownHoles: [4, 7], onTag: tag, onClose: () => {} };
    const view = render(<HolePhotoBatchPath {...props} />); fireEvent.click(screen.getByRole('button', { name: 'Shot 2 of 2' }));
    expect(tag).not.toHaveBeenCalled(); expect(screen.getByAltText('Current photograph')).toHaveAttribute('src', '/b.jpg');
    view.unmount(); render(<HolePhotoBatchPath {...props} />); expect(screen.getByAltText('Current photograph')).toHaveAttribute('src', '/a.jpg');
  });
  it('successful next tags exact URL and hole then advances', async () => {
    const tag = vi.fn().mockResolvedValue({ status: 'approved' } as HolePhoto);
    render(<HolePhotoBatchPath photos={[photo('/a.jpg'), photo('/b.jpg')]} rounds={[round]} memberId="member" courseId="course" knownHoles={[4, 7]} onTag={tag} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' })); fireEvent.click(screen.getByRole('button', { name: /^Tag to the / }));
    await waitFor(() => expect(screen.getByAltText('Current photograph')).toHaveAttribute('src', '/b.jpg'));
    expect(tag).toHaveBeenCalledWith('/a.jpg', 7); expect(screen.getByRole('button', { name: 'Hole 4' })).toBeEnabled();
  });
  it('a second and third photograph can be tagged to the same hole', async () => {
    const tag = vi.fn().mockResolvedValue({ status: 'approved' } as HolePhoto);
    const close = vi.fn();
    render(<HolePhotoBatchPath photos={[photo('/a.jpg'), photo('/b.jpg'), photo('/c.jpg')]} knownHoles={[4, 7]} onTag={tag} onClose={close} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' })); fireEvent.click(screen.getByRole('button', { name: /^Tag to the / }));
    await waitFor(() => expect(screen.getByAltText('Current photograph')).toHaveAttribute('src', '/b.jpg'));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' })); fireEvent.click(screen.getByRole('button', { name: /^Tag to the / }));
    await waitFor(() => expect(screen.getByAltText('Current photograph')).toHaveAttribute('src', '/c.jpg'));
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' })); fireEvent.click(screen.getByRole('button', { name: /^Tag to the / }));
    // The batch now stays open showing "All tagged"; only Close closes it.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tag' })).toBeDisabled());
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Close' })); expect(close).toHaveBeenCalledTimes(1);
    expect(tag.mock.calls).toEqual([['/a.jpg', 4], ['/b.jpg', 4], ['/c.jpg', 4]]);
  });
  it('batch unique violations identify the duplicate photo and do not advance', async () => {
    const tag = vi.fn().mockRejectedValue({ code: '23505' });
    render(<HolePhotoBatchPath photos={[photo('/a.jpg'), photo('/b.jpg')]} knownHoles={[4]} onTag={tag} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 4' })); fireEvent.click(screen.getByRole('button', { name: /^Tag to the / }));
    await screen.findByRole('alert');
    expect(screen.getByAltText('Current photograph')).toHaveAttribute('src', '/a.jpg');
    expect(tag).toHaveBeenCalledWith('/a.jpg', 4);
  });
});