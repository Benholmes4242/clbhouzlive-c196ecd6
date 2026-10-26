import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { CourseFirstPhotoPicker, CourseMediaNoPhotographs, CourseMediaNothing } from '@/components/course-media-tab/CourseMediaEmptyStates';
import { coursePhotoState, MEDIA_EMPTY_SNAPSHOT } from '@/lib/courseMedia/emptyStates';

const hole = (hole_no: number) => ({ hole_no, par: 4 }) as CourseHole;
describe('MEDIA_EMPTY_1 B/C rules', () => {
  it('photographs with unavailable analysis select A', () => { expect(coursePhotoState(true, false)).toBe('A'); });
  it('no photographs with available analysis select B', () => { expect(coursePhotoState(false, true)).toBe('B'); });
  it('neither photographs nor available analysis select C', () => { expect(coursePhotoState(false, false)).toBe('C'); });
  it('photographs and available analysis preserve the signed-off walk', () => { expect(coursePhotoState(true, true)).toBe('walk'); });
  it('no-photo catalogue snapshot is the approved dated constant', () => { expect(MEDIA_EMPTY_SNAPSHOT).toEqual({ withoutPhotos: 22800, asOf: '2026-10-18' }); });
  it('B renders only actual sparse analysis holes and every tile is open', () => {
    render(<CourseMediaNoPhotographs holes={[hole(7), hole(2)]} onHole={() => {}} onAddFirst={() => {}} />);
    const tiles = screen.getAllByRole('button').filter(button => button.hasAttribute('data-state'));
    expect(tiles.map(button => button.getAttribute('aria-label'))).toEqual(['Hole 2', 'Hole 7']);
    for (const tile of tiles) { expect(tile).toBeEnabled(); expect(tile).toHaveAttribute('data-state', 'open'); }
  });
  it('a B tile tap passes its known hole', () => {
    const choose = vi.fn(); render(<CourseMediaNoPhotographs holes={[hole(7)]} onHole={choose} onAddFirst={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' })); expect(choose).toHaveBeenCalledWith(7);
  });
  it('the untapped B action passes no prechosen hole', () => {
    const choose = vi.fn(); render(<CourseMediaNoPhotographs holes={[hole(7)]} onHole={() => {}} onAddFirst={choose} />);
    fireEvent.click(screen.getAllByRole('button').at(-1) as HTMLElement); expect(choose).toHaveBeenCalledWith();
  });
  it('B first-photo picker starts with every actual hole open and none selected', () => {
    render(<CourseFirstPhotoPicker knownHoles={[1, 7, 9]} pending={false} result={null} error={null} onSubmit={() => {}} onClose={() => {}} />);
    const tiles = screen.getAllByRole('button').filter(button => button.hasAttribute('data-state'));
    expect(tiles).toHaveLength(3);
    for (const tile of tiles) { expect(tile).toHaveAttribute('data-state', 'open'); expect(tile).toHaveAttribute('aria-pressed', 'false'); expect(tile).toBeEnabled(); }
  });
  it('tapping the selected hole again deselects it and disables the library action; a different tap moves the selection', () => {
    render(<CourseFirstPhotoPicker knownHoles={[2, 7]} pending={false} result={null} error={null} onSubmit={() => {}} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
    expect(screen.getByRole('button', { name: 'Hole 7' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
    expect(screen.getByRole('button', { name: 'Hole 7' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Choose from your library' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Hole 2' }));
    expect(screen.getByRole('button', { name: 'Hole 2' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Hole 7' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Choose from your library' })).toBeEnabled();
  });
  it('B first-photo picker submits the original File with the chosen hole', () => {
    const submit = vi.fn(); render(<CourseFirstPhotoPicker knownHoles={[2, 7]} pending={false} result={null} error={null} onSubmit={submit} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hole 7' }));
    const input = document.querySelector('input[type=file]'); if (!input) throw new Error('File chooser missing');
    const file = new File(['photo'], 'first.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } }); expect(submit).toHaveBeenCalledWith(file, 7);
  });
  it('C offers exactly one review action and no hole choices or file chooser', () => {
    const review = vi.fn(); const view = render(<CourseMediaNothing courseName="Dooks" onReview={review} />);
    expect(screen.getAllByRole('button')).toHaveLength(1); expect(screen.queryByRole('group', { name: 'Hole' })).toBeNull();
    expect(view.container.querySelector('input[type=file]')).toBeNull();
    fireEvent.click(screen.getByRole('button')); expect(review).toHaveBeenCalledOnce();
  });
});