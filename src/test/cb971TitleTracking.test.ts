import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
describe('CB97.1 title tracking', () => {
  it('tee sheet title letter spacing equals the other section titles', () => {
    const css = readFileSync(resolve(__dirname, '../features/business/clubAnalytics/teeSheet.css'), 'utf8');
    const src = readFileSync(resolve(__dirname, '../features/business/clubAnalytics/sections.tsx'), 'utf8');
    const tee = /\.tee-sheet-title\s*\{[^}]*letter-spacing:\s*([^;]+);/.exec(css)?.[1].trim();
    const others = [...src.matchAll(/fontSize: 17, fontWeight: 700, letterSpacing: '([^']+)'/g)].map(m => m[1]);
    expect(others.length).toBeGreaterThanOrEqual(2);
    for (const o of others) expect(tee).toBe(o);
  });
});
