import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import en from '../../../../public/locales/en/courses.json';
import { FEAT_I18N } from '../rareAir';

/**
 * Static guard: every key RareAirSection reads must exist in English courses.json,
 * and every <Trans> must name the courses namespace (a bare <Trans> reads `common`).
 */
const src = readFileSync(resolve(__dirname, '../RareAirSection.tsx'), 'utf8');
const PLURAL = ['', '_one', '_other'];
const has = (key: string) => {
  const parts = key.split('.');
  const last = parts.pop()!;
  let node: any = en;
  for (const p of parts) node = node?.[p];
  return !!node && PLURAL.some((s) => typeof node[last + s] === 'string');
};

function keysRead(): string[] {
  const out = new Set<string>();
  for (const m of src.matchAll(/'(amateur\.[\w.]+|discover\.[\w.]+)'/g)) out.add(m[1]);
  for (const m of src.matchAll(/"(amateur\.[\w.]+)"/g)) out.add(m[1]);
  for (const m of src.matchAll(/`(amateur\.[\w.]+)\.\$\{FEAT_I18N\[[^\]]+\]\}`/g))
    for (const f of Object.values(FEAT_I18N)) out.add(`${m[1]}.${f}`);
  for (const m of src.matchAll(/`(amateur\.[\w.]+)\.\$\{f\.denominator_unit\}`/g))
    for (const u of ['holes', 'rounds']) out.add(`${m[1]}.${u}`);
  return [...out];
}

describe('rare air keys', () => {
  it('every key the section reads exists in English courses.json', () => {
    const keys = keysRead();
    expect(keys.length).toBeGreaterThan(15);
    expect(keys.filter((k) => !has(k))).toEqual([]);
  });
  it('every <Trans> names the courses namespace', () => {
    const trans = [...src.matchAll(/<Trans\b[^>]*?(?:\/>|>)/gs)].map((m) => m[0]);
    expect(trans.length).toBe(4);
    expect(trans.filter((t) => !t.includes('ns="courses"'))).toEqual([]);
  });
  it('tile names are fixed category plurals, independent of count', () => {
    expect((en as any).amateur.leaderboards.featName).toEqual({
      ace: 'Holes in one', albatross: 'Albatrosses', eagle: 'Eagles', cleanCard: 'Bogey-free rounds',
    });
  });
});
