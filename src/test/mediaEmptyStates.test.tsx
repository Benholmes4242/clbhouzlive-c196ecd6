import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CourseMediaNoShots } from '@/components/course-media-tab/CourseMediaEmptyStates';
import { coursePhotoState, MEDIA_CATALOGUE_TOTAL, MEDIA_EMPTY_SNAPSHOT } from '@/lib/courseMedia/emptyStates';

describe('MEDIA_EMPTY_1 B/C rules', () => {
  it('photographs with unavailable analysis select A', () => { expect(coursePhotoState(true, false)).toBe('A'); });
  it('no photographs with available analysis select B', () => { expect(coursePhotoState(false, true)).toBe('B'); });
  it('neither photographs nor available analysis select C', () => { expect(coursePhotoState(false, false)).toBe('C'); });
  it('photographs and available analysis preserve the signed-off walk', () => { expect(coursePhotoState(true, true)).toBe('walk'); });
  it('no-photo catalogue snapshot is the approved dated constant', () => { expect(MEDIA_EMPTY_SNAPSHOT).toEqual({ withoutPhotos: 22800, asOf: '2026-10-18' }); });
  it('no-shots card with a hole list offers holes and places', () => {
    const view = render(<CourseMediaNoShots courseName="Hollow Down" hasHoles onAdd={() => {}} />);
    expect(view.container.querySelector('[data-no-shots-body]')?.textContent).toBe('Nobody has added a photo or video of Hollow Down yet. Add yours and tag it to a hole, the clubhouse, the food or anything else.');
  });
  it('no-shots card without a hole list offers places only', () => {
    const view = render(<CourseMediaNoShots courseName="Old Head" hasHoles={false} onAdd={() => {}} />);
    expect(view.container.querySelector('[data-no-shots-body]')?.textContent).toBe('Nobody has added a photo or video of Old Head yet. Add yours and tag it to the clubhouse, the views or anything else. Holes open up once rounds are logged here.');
  });
  it('no-shots footer reads the snapshot constants', () => {
    const view = render(<CourseMediaNoShots courseName="Dooks" hasHoles onAdd={() => {}} />);
    const foot = view.container.querySelector('[data-no-shots-foot]')?.textContent ?? '';
    expect(foot.startsWith(`${MEDIA_EMPTY_SNAPSHOT.withoutPhotos.toLocaleString('en-GB')} of the ${MEDIA_CATALOGUE_TOTAL.toLocaleString('en-GB')} courses`)).toBe(true);
  });
  it('no-shots card has one action that opens the add flow', () => {
    const add = vi.fn(); render(<CourseMediaNoShots courseName="Dooks" hasHoles={false} onAdd={add} />);
    expect(screen.getAllByRole('button')).toHaveLength(1); fireEvent.click(screen.getByRole('button')); expect(add).toHaveBeenCalledOnce();
  });
});