import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// LeadersGroup builds t(`board.columns.${key}`) for these five keys.
const KEYS = ['pos', 'player', 'thru', 'today', 'tot'];
const ROOT = join(process.cwd(), 'public/locales');
const columns = (loc: string) =>
  JSON.parse(readFileSync(join(ROOT, loc, 'tourhub.json'), 'utf8')).board?.columns ?? {};

describe('tourhub board.columns keys built by LeadersGroup', () => {
  it('en has non-empty strings for all five dynamic keys', () => {
    const c = columns('en');
    for (const k of KEYS) {
      expect(typeof c[k], k).toBe('string');
      expect(c[k].length, k).toBeGreaterThan(0);
    }
  });

  it('every other locale has the same five keys', () => {
    const locs = readdirSync(ROOT).filter((l) => l !== 'en' && existsSync(join(ROOT, l, 'tourhub.json')));
    expect(locs.length).toBeGreaterThan(0);
    for (const l of locs) {
      const c = columns(l);
      for (const k of KEYS) {
        expect(typeof c[k], `${l}.${k}`).toBe('string');
        expect(c[k].length, `${l}.${k}`).toBeGreaterThan(0);
      }
    }
  });
});
