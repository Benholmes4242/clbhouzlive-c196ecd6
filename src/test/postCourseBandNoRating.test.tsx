/**
 * FEED: the course band on a normal post no longer shows the clbhouz
 * community rating (spiral logo + figure on line one). Line one is the course
 * name and its door only; line two keeps the contextual figure and its
 * stats-sheet chevron.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PostCourseBand } from '@/components/feed/PostCourseBand';
import type { PostCourseContext } from '@/hooks/feed/usePostCourseContext';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '',
  }),
}));

const ctx: PostCourseContext = {
  course_id: 'c1',
  rounds_tracked: 1,
  your_rounds: 0,
  your_best: null,
  community_rating: 9.3,
} as PostCourseContext;

describe('PostCourseBand community rating removal', () => {
  it('renders no spiral image and no rating figure even when a rating is set', () => {
    const { container } = render(
      <PostCourseBand
        courseName="Sunningdale"
        courseLocation="Berkshire, England"
        ctx={ctx}
        onOpenStats={() => {}}
      />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).not.toContain('9.3');
  });

  it('line two still renders its figure and opens the stats sheet', () => {
    const onOpenStats = vi.fn();
    const { container, getByRole } = render(
      <PostCourseBand
        courseName="Sunningdale"
        courseLocation="Berkshire, England"
        ctx={ctx}
        onOpenStats={onOpenStats}
      />,
    );
    expect(container.textContent).toContain('1');
    fireEvent.click(getByRole('button'));
    expect(onOpenStats).toHaveBeenCalledTimes(1);
  });
});
