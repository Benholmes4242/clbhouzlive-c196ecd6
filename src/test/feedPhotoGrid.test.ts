import { describe, expect, it } from 'vitest';
import { feedPhotoGridLayout } from '@/components/feed/feedPhotoGrid';
const images = (count: number, width = 800, height = 1000) => Array.from({ length: count }, () => ({ type: 'image', width, height }));
describe('feed photo grid eligibility', () => {
  it('three images keep carousel rendering', () => expect(feedPhotoGridLayout(images(3))).toBeNull());
  it('four images show indexes zero through three without more', () => expect(feedPhotoGridLayout(images(4))).toMatchObject({ shown: [0,1,2,3], more: 0 }));
  it('twelve images have eight more', () => expect(feedPhotoGridLayout(images(12))?.more).toBe(8));
  it.each([0,1,2,3,4])('a video at index %i excludes the whole five-item post', index => { const items = images(5); items[index].type = 'video'; expect(feedPhotoGridLayout(items)).toBeNull(); });
  it('upright lead chooses upright', () => expect(feedPhotoGridLayout(images(4))?.shape).toBe('upright'));
  it('wide lead chooses wide', () => expect(feedPhotoGridLayout(images(4,1600,900))?.shape).toBe('wide'));
  it('square lead chooses wide at the minimum lead ratio', () => expect(feedPhotoGridLayout(images(4,1000,1000))).toMatchObject({ shape: 'wide', leadRatio: 4/3 }));
  it('three-to-one lead is capped at 1.91', () => expect(feedPhotoGridLayout(images(4,3000,1000))?.leadRatio).toBe(1.91));
  it('one-point-one lead is raised to four-thirds', () => expect(feedPhotoGridLayout(images(4,1100,1000))?.leadRatio).toBe(4/3));
  it('missing lead dimensions choose upright', () => expect(feedPhotoGridLayout([{ type:'image' }, ...images(3)])?.shape).toBe('upright'));
});