import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseLegacyCard } from '@/components/profile/courses/CourseLegacyCard';

const names = { a: 'Alpha', b: 'Bravo', c: 'Charlie', d: 'Delta' };
const pts = [
  { id: 'a', lat: 51.5, lng: -0.1 }, { id: 'b', lat: 52.0, lng: -1.0 },
  { id: 'c', lat: 53.0, lng: -2.0 }, { id: 'd', lat: 36.5, lng: -121.9 },
];
const base = {
  isOwnProfile: true, coursesPlayed: 53, countriesPlayed: 9, top100Played: 12,
  points: pts, names, ratings: [{ course_id: 'a', rating: 8.4 }, { course_id: 'b', rating: 9.2 }],
  displayName: 'Ben Test', year: 2026,
};

describe('course legacy card', () => {
  it("renders nothing on another member's profile", () => {
    const { container } = render(<CourseLegacyCard {...base} isOwnProfile={false} />);
    expect(container.innerHTML).toBe('');
  });
  it('a null courses-played figure renders no card', () => {
    const { container } = render(<CourseLegacyCard {...base} coursesPlayed={null} />);
    expect(container.innerHTML).toBe('');
  });
  it('a null country count omits that clause and never prints 0 countries', () => {
    render(<CourseLegacyCard {...base} countriesPlayed={null} />);
    const line = screen.getByTestId('legacy-line').textContent ?? '';
    expect(line).toBe('courses · 12 of the Top 100');
    expect(line).not.toMatch(/countr/);
  });
  it('fewer than 3 plotted courses omits the Furthest row', () => {
    render(<CourseLegacyCard {...base} points={pts.slice(0, 2)} />);
    expect(screen.queryByTestId('legacy-furthest')).toBeNull();
  });
  it('names the plotted course furthest from the centre', () => {
    render(<CourseLegacyCard {...base} />);
    expect(screen.getByTestId('legacy-furthest').textContent).toContain('Delta');
    expect(screen.getByTestId('legacy-best').textContent).toContain('Bravo 9.2');
  });
  it('the brand name renders lowercase', () => {
    render(<CourseLegacyCard {...base} />);
    expect(screen.getByTestId('legacy-brand').textContent).toBe('clbhouz');
  });
});
