import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/* HERO BANDS NO DIVIDERS: no top/bottom rule on any hero stat band and no line between its cells. */
const SOURCES: Array<[string, string]> = [
  ['src/styles/hybrid-hero.css', 'upcoming-facts'],
  ['src/features/tourhub/tournament-v2/tournamentPage.css', 'tv-figures'],
  ['src/features/tourhub/leaderboard/leaderboard.css', 'tour-board-figures'],
];
const rulesFor = (css: string, cls: string) => {
  const out: string[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g; let m: RegExpExecArray | null;
  while ((m = re.exec(css))) if (m[1].split(',').some(sel => new RegExp(`\\.${cls}(?![\\w-])\\s*(>\\s*div[^,]*)?$`).test(sel.trim()))) out.push(m[2]);
  return out;
};

describe('Hero stat bands without dividers', () => {
  it.each(SOURCES)('%s: .%s sets no border on the container or its cells', (path, cls) => {
    const rules = rulesFor(readFileSync(path, 'utf8'), cls);
    expect(rules.length).toBeGreaterThan(0);
    for (const body of rules) expect(body).not.toMatch(/border(-(top|bottom|left|right))?\s*:/);
  });
});
