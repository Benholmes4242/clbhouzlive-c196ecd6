import { describe, it, expect } from 'vitest';
import { mostPlayedList } from '@/components/courses/Top100CoursesHubPanel';

describe('Top 100 default list', () => {
  it('19 GB&I against 8 World selects gb-i', () => {
    expect(mostPlayedList([{ listSlug: 'global', played: 8 }, { listSlug: 'gb-i', played: 19 }])).toBe('gb-i');
  });
  it('a tie of 12 and 12 selects global', () => {
    expect(mostPlayedList([{ listSlug: 'usa', played: 12 }, { listSlug: 'gb-i', played: 12 }])).toBe('global');
  });
  it('all zeros selects global', () => {
    expect(mostPlayedList([{ listSlug: 'usa', played: 0 }, { listSlug: 'gb-i', played: 0 }])).toBe('global');
  });
  it('an empty list array selects global', () => {
    expect(mostPlayedList([])).toBe('global');
  });
  it('an unknown slug holding the highest count is ignored', () => {
    expect(mostPlayedList([{ listSlug: 'mars', played: 40 }, { listSlug: 'usa', played: 3 }, { listSlug: 'gb-i', played: 3 }])).toBe('global');
  });
});
