import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** CANONICAL HEADING BRIEF 2: weights 400–700 only anywhere under src/features/tourhub. */
const ROOT = 'src/features/tourhub';
const FORMS: [string, RegExp][] = [
  ['fontWeight 800/900', /fontWeight\s*:\s*['"]?(800|900)\b/],
  ['fontWeight ternary/variable', /fontWeight\s*:[^,;}\n]*\?[^,;}\n]*\b(800|900)\b/],
  ['font-extrabold / font-black', /\bfont-(extrabold|black)\b/],
  ['Tailwind font-[800]', /font-\[(800|900)\]/],
  ['CSS font-weight above 700', /font-weight\s*:\s*(800|900|bolder)\b/],
  ['CSS / canvas font shorthand', /\bfont\s*:\s*(italic\s+)?(800|900)\b|[`'"](800|900) [0-9.]+px/],
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === '__tests__' ? [] : walk(p);
    return /\.(tsx?|css)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
  });
}

describe('Tour hub declares no font weight above 700', () => {
  it('every file is clear of all five forms', () => {
    const hits: string[] = [];
    for (const file of walk(ROOT)) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (/^\s*(\*|\/\/)/.test(line)) return;
        for (const [form, re] of FORMS) if (re.test(line)) hits.push(`${file}:${i + 1} (${form})`);
      });
    }
    expect(hits).toEqual([]);
  });
});
