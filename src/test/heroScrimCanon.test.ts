import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HERO_CANON_SCRIM } from '@/features/tourhub/_shared/heroGradient';
import { CHARCOAL } from '@/features/tourhub/_shared/tokens';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';

describe('hero scrim canon', () => {
  it('ends opaque on the canvas', () => {
    expect(CHARCOAL).toBe(PAGE_CANVAS);
    expect(HERO_CANON_SCRIM.endsWith(`${CHARCOAL} 100%)`)).toBe(true);
  });
  it.each(['src/components/golf-club/GolfClubView.tsx', 'src/components/courses/CoursesPageHero.tsx'])(
    '%s has no hand-rolled 0.78 scrim', (f) => {
      expect(readFileSync(resolve(process.cwd(), f), 'utf8')).not.toContain('rgba(0,0,0,0.78)');
    });
});
