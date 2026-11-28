import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Brief 50 ruling 4: get_played_unrated_courses now returns ticked courses
// with last_played null. Every consumer shows no date, never "Invalid date".
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useRateNudgeCourse', () => ({
  useRateNudgeCourse: () => ({ course: { courseId: 't', name: 'Tick Links', region: 'Fife', thumbnail: null, lastPlayed: null, tier: 'played' }, loading: false }),
}));

import RateNudge from '@/components/courses/RateNudge';
import BreakdownsPrompt from '@/components/profile/courses/BreakdownsPrompt';
import BreakdownsPickerSheet from '@/components/profile/courses/BreakdownsPickerSheet';

const ticked = {
  id: 't', name: 'Tick Links', country: null, sub_country: null, thumbnail_image: null, is_top100: false,
  global_rank: null, last_played_at: null, rating_value: 0, rating_id: null, design_score: null,
  condition_score: null, clubhouse_score: null, facilities_score: null, review: null, review_date: null,
} as any;
const DATE = /\d{4}|Invalid|NaN/;

describe('Brief 50 — null last_played from get_played_unrated_courses', () => {
  it('Courses page rate nudge shows the course and no date', () => {
    const { container } = render(<MemoryRouter><RateNudge userId="u1" onEmptyFallback={() => {}} /></MemoryRouter>);
    expect(container.textContent).toContain('Tick Links');
    expect(container.textContent).not.toMatch(DATE);
  });

  it('profile "review these" prompt shows the course and no date', () => {
    const { container } = render(<MemoryRouter><BreakdownsPrompt variant="review" missingCount={1} courses={[ticked]} onTap={() => {}} /></MemoryRouter>);
    expect(container.textContent).toContain('Tick Links');
    expect(container.textContent).not.toMatch(DATE);
  });

  it('profile review picker lists the course with no date', () => {
    render(<BreakdownsPickerSheet isOpen mode="review" onClose={() => {}} missingCourses={[ticked]} onPickCourse={() => {}} />);
    const row = screen.getByRole('button', { name: /Tick Links/ });
    expect(row.textContent).not.toMatch(DATE);
  });
});
