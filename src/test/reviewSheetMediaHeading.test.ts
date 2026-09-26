import { describe, it, expect } from 'vitest';
import { reviewMediaHeading } from '@/components/posts/ReviewBottomSheet';

const m = (p: number, v: number) => [
  ...Array.from({ length: p }, () => ({ mediaType: 'image' as const })),
  ...Array.from({ length: v }, () => ({ mediaType: 'video' as const })),
];

describe('reviewMediaHeading', () => {
  it.each([
    [8, 0, '8 PHOTOS'],
    [5, 3, '5 PHOTOS · 3 VIDEOS'],
    [0, 3, '3 VIDEOS'],
    [1, 0, '1 PHOTO'],
    [1, 1, '1 PHOTO · 1 VIDEO'],
    [1, 4, '1 PHOTO · 4 VIDEOS'],
  ])('%i photos, %i videos -> %s', (p, v, want) => {
    expect(reviewMediaHeading(m(p, v))).toBe(want);
  });
});
