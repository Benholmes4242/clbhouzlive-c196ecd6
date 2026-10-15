import { describe, it, expect } from 'vitest';
import { splitClubCourse } from './CoursesPlayedSection';
describe('splitClubCourse', () => {
  it('splits shared club names so the course stays visible', () => {
    const r = splitClubCourse(['Sundridge Park Golf Club - East Course', 'Sundridge Park Golf Club - West Course', 'Alpha Links']);
    expect(r[0]).toEqual({ club: 'Sundridge Park Golf Club', course: '(East)' });
    expect(r[1]).toEqual({ club: 'Sundridge Park Golf Club', course: '(West)' });
    expect(r[2]).toBeNull();
  });
});
