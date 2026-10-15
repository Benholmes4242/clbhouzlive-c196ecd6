import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BreakdownsPrompt from '@/components/profile/courses/BreakdownsPrompt';
import { playDateStandalone } from '@/components/explore-tab-new/courseled/discoverWhen';

const course = (i: number): any => ({
  id: `c${i}`, name: `Course Number ${i}`, country: null, sub_country: null, thumbnail_image: null,
  is_top100: false, global_rank: null, last_played_at: '2025-06-1' + (i % 10) + 'T10:00:00Z', rating_value: 0,
  rating_id: null, design_score: null, condition_score: null, clubhouse_score: null, facilities_score: null,
  review: null, review_date: null,
});

const mount = (n: number) => {
  const courses = Array.from({ length: n }, (_, i) => course(i));
  const r = render(<MemoryRouter><BreakdownsPrompt missingCount={n} courses={courses} onTap={() => {}} /></MemoryRouter>);
  return { ...r, courses };
};

describe('still to rate', () => {
  it('every tile shows its course name and the date played', () => {
    const { courses } = mount(3);
    const tiles = screen.getAllByTestId('still-to-rate-tile');
    tiles.forEach((tile, i) => {
      expect(tile.textContent).toContain(courses[i].name);
      const date = playDateStandalone(courses[i].last_played_at);
      expect(date).not.toBe('');
      expect(tile.textContent).toContain(date);
    });
  });

  it('a member with 11 unrated courses gets 11 tiles, not 3', () => {
    mount(11);
    expect(screen.getAllByTestId('still-to-rate-tile')).toHaveLength(11);
    expect(screen.getByRole('button', { name: /^Rate them/ })).toBeTruthy();
  });

  it('more than 12 gets 12 tiles and the action reads Rate all n', () => {
    mount(15);
    expect(screen.getAllByTestId('still-to-rate-tile')).toHaveLength(12);
    expect(screen.getByRole('button', { name: /^Rate all 15/ })).toBeTruthy();
  });

  it('renders no dashed remainder placeholder', () => {
    const { container } = mount(15);
    expect(screen.queryByText(/^\+\d+$/)).toBeNull();
    const dashed = Array.from(container.querySelectorAll<HTMLElement>('*')).filter((el) => el.style.border.includes('dashed'));
    expect(dashed).toHaveLength(0);
  });
});
