import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseMediaNoHoleList, CourseMediaNotLive } from '@/components/course-media-tab/CourseMediaEmptyStates';
import { privateHolePhotos, photoDayLabel } from '@/lib/courseMedia/emptyStates';
import { memberReasonSentence } from '@/lib/courseMedia/memberReasonSentence';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';

const row = (id: string, status: string, user_id = 'me', course_id = 'here') => ({ id, status, user_id, course_id, hole_no: 12, media_url: '/photo.jpg', reject_reason: null, reviewed_at: null }) as HolePhoto;
describe('MEDIA_EMPTY_1_R owner population and date rules', () => {
  it('waiting and rejected count together; approved rows do not', () => {
    expect(privateHolePhotos([row('p', 'pending'), row('r', 'rejected'), row('a', 'approved')], 'me', 'here').map(r => r.id)).toEqual(['r']);
  });
  it('other members never enter the private population', () => {
    expect(privateHolePhotos([row('p', 'pending', 'other'), row('r', 'rejected', 'other')], 'me', 'here')).toEqual([]);
  });
  it('another course never enters the private population', () => {
    expect(privateHolePhotos([row('p', 'pending', 'me', 'elsewhere')], 'me', 'here')).toEqual([]);
  });
  it('unmapped reviewer text maps to neutral fixed reason', () => {
    expect(memberReasonSentence('internal reviewer note')).toBe(memberReasonSentence('other'));
    expect(memberReasonSentence(null)).toBe(memberReasonSentence('other'));
    expect(memberReasonSentence('internal reviewer note')).not.toContain('internal reviewer note');
  });
  it('only the mock supplied exact reason maps to its fixed sentence', () => {
    expect(memberReasonSentence('The picture is of people, not the hole.')).toBe(memberReasonSentence('other'));
    expect(memberReasonSentence('The picture is of people, not the hole.')).not.toBe('The picture is of people, not the hole.');
    expect(memberReasonSentence('not_a_golf_hole')).not.toBe(memberReasonSentence('other'));
  });
  it('missing capture date stays absent; malformed dates stay absent', () => {
    expect(photoDayLabel(null)).toBeNull(); expect(photoDayLabel('2026-02-30')).toBeNull();
    expect(photoDayLabel('2026-08-02T23:55:00Z')).toBe('2 August');
  });
  it('private display shows exactly the filtered rows and no other-member image', () => {
    const other = { ...row('other', 'pending', 'other'), media_url: '/other.jpg' };
    const { container } = render(<CourseMediaNotLive rows={[row('p', 'pending'), row('r', 'rejected'), other, row('a', 'approved')]} memberId="me" courseId="here" />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(container.querySelector('img[src="/other.jpg"]')).toBeNull();
  });
  it('private display is absent for another viewer', () => {
    const { container } = render(<CourseMediaNotLive rows={[row('r', 'rejected')]} memberId="other" courseId="here" />);
    expect(container.childElementCount).toBe(0);
  });
  it('State A has no hole choices, Tag action, or file chooser', () => {
    const { container } = render(<CourseMediaNoHoleList courseName="Hankley Common" photoCount={14}><img src="/photo.jpg" alt="Course" /></CourseMediaNoHoleList>);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelector('input[type=file]')).toBeNull();
    expect(container.querySelector('[data-state]')).toBeNull();
  });
  it('MEDIA_COPY_1 literal anchors: neutral default and not_a_golf_hole sentence', () => {
    expect(memberReasonSentence('some other code')).toBe('The photo was not a fit for this hole.');
    expect(memberReasonSentence('not_a_golf_hole')).toBe('The photo did not show a golf hole.');
  });
});