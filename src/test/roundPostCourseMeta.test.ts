import { describe, it, expect } from 'vitest';
import { roundPostItem } from '@/components/feed/roundPostItem';

const post = { id: 'p1', userId: 'u1', courseId: 'c1', courseName: 'Feed Name', courseThumbnailImage: null } as never;
const meta = {
  id: 'c1', name: 'Meta Name', clubId: null, region: 'Kent', rawRegion: 'Kent',
  country: 'Britain & Ireland', subCountry: 'England', imageUrl: 'https://img/c1.jpg',
};

describe('roundPostItem course meta', () => {
  it('a resolved meta row supplies the image and place line', () => {
    const item = roundPostItem(post, null, null, null, { map: new Map([['c1', meta]]), isFetched: true });
    expect(item.subject?.image_url).toBe('https://img/c1.jpg');
    expect(item.subject?.region).toBe('Kent');
    expect(item.subject?.course_name).toBe('Feed Name');
    expect(item.subject?.pending).toBe(false);
  });
  it('meta still in flight is pending, not a settled absence', () => {
    const item = roundPostItem(post, null, null, null, { map: undefined, isFetched: false });
    expect(item.subject?.pending).toBe(true);
    expect(item.subject?.image_url).toBeNull();
  });
  it('fetched with no meta row is settled absent (falls back to initials)', () => {
    const item = roundPostItem(post, null, null, null, { map: new Map(), isFetched: true });
    expect(item.subject?.pending).toBe(false);
    expect(item.subject?.image_url).toBeNull();
  });
});
