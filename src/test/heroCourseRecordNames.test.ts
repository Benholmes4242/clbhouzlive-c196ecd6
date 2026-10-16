import { describe, expect, it } from 'vitest';
import { heroRecordNames } from '@/components/courses/course-detail/about/HeroCourseRecord';
import type { CourseLegendRow } from '@/lib/gam/types';

const row = (name: string | null, id: string): CourseLegendRow => ({
  category: 'lowest_gross_all_time', rank: 1, user_id: id, user_display_name: name,
  user_photo_url: null, user_home_club: null, value: 65, attained_at: '', is_self: false,
  rank_30d: null, delta: null,
} as CourseLegendRow);

describe('hero course record names (BRIEF_COURSE_HERO_1)', () => {
  it('no record renders nothing', () => expect(heroRecordNames([])).toBeNull());
  it('a holder with no showable name hides the row', () =>
    expect(heroRecordNames([row('Lennon Hill', 'a'), row(null, 'b')])).toBeNull());
  it('two holders are both named in full', () =>
    expect(heroRecordNames([row('Lennon Hill', 'a'), row('Danny Holmes', 'b')])).toBe('Lennon Hill & Danny Holmes'));
  it('four holders read first name and & 3 others', () =>
    expect(heroRecordNames(['Lennon Hill', 'B C', 'D E', 'F G'].map((n, i) => row(n, String(i))))).toBe('Lennon Hill & 3 others'));
});
