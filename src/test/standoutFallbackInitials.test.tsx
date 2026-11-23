import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { StandoutPhotoHeader } from '@/components/courses/browse/StandoutRoundsSection';
import { initialsForCourse } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import type { CoursesStandoutRound } from '@/components/courses/browse/useCoursesStandoutRounds';

const NAME = 'Farleigh Golf Club - Blue, Yellow & Red';
const row = {
  course_id: 'c-farleigh', course_name: NAME, course_image: null, course_region: 'Surrey', course_sub_country: 'England',
  play_date: '2026-11-04', feat_kind: null, holes_in_one: 0, albatrosses: 0, eagles: 0, birdies: 0, longest_birdie_run: 0,
} as unknown as CoursesStandoutRound;

describe('StandoutPhotoHeader without a course photo', () => {
  it('renders no course initials and still renders the course name', () => {
    const { container } = render(<StandoutPhotoHeader row={row} />);
    const initials = initialsForCourse(NAME);
    expect(initials.length).toBeGreaterThan(0);
    const photo = container.querySelector('[data-standout-photo]') as HTMLElement;
    const leaves = Array.from(photo.querySelectorAll('span, div')).filter((el) => el.children.length === 0);
    expect(leaves.some((el) => el.textContent === initials)).toBe(false);
    expect(photo.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-standout-course]')?.textContent).toBe(NAME);
  });
});
