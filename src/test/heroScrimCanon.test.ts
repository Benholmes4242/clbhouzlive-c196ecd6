import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HERO_CANON_WASH, heroCanonBackground } from '@/features/tourhub/_shared/heroGradient';

describe('hero wash canon', () => {
  it('is one uniform value with no vertical variation', () => {
    const stops = HERO_CANON_WASH.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}/g) ?? [];
    expect(stops.length).toBeGreaterThan(0);
    expect(new Set(stops.map((s) => s.replace(/\s/g, ''))).size).toBe(1);
    expect(HERO_CANON_WASH).not.toMatch(/\d+%/);
    expect(HERO_CANON_WASH).not.toMatch(/deg/);
  });
  it('applies the wash in both branches', () => {
    expect(heroCanonBackground('x.jpg').startsWith(HERO_CANON_WASH)).toBe(true);
    expect(heroCanonBackground(null).startsWith(HERO_CANON_WASH)).toBe(true);
  });
  it.each(['src/components/golf-club/GolfClubView.tsx', 'src/components/courses/CoursesPageHero.tsx'])(
    '%s has no hand-rolled 0.78 scrim', (f) => {
      expect(readFileSync(resolve(process.cwd(), f), 'utf8')).not.toContain('rgba(0,0,0,0.78)');
    });
});
