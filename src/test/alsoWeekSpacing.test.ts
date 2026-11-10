/** Also this week spacing brief: signed-off mock build-also-this-week-spacing-signed-off.html.
 * Sizes and gaps only; asserts the CSS and the board avatar default. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const css = readFileSync(resolve(__dirname, '../features/tourhub/overview/sections/alsoWeek.css'), 'utf8');
const tsx = readFileSync(resolve(__dirname, '../features/tourhub/overview/sections/AlsoWeekEvent.tsx'), 'utf8');
const hero = readFileSync(resolve(__dirname, '../features/tourhub/tournament-v2/sections/HeroBoardRows.tsx'), 'utf8');
const block = (cls: string) => {
  const m = new RegExp(`(?:^|\\})\\s*\\.${cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css);
  if (!m) throw new Error(`no .${cls} block`);
  return m[1];
};

describe('Also this week signed-off spacing', () => {
  it('event card padding is 14px 20px 12px', () => {
    expect(block('also-week .also-event')).toContain('padding:14px 20px 12px');
  });
  it('situation line gap is 8px and board gap is 10px', () => {
    expect(block('also-sit')).toContain('margin-top:8px');
    expect(block('also-board')).toContain('margin-top:10px');
  });
  it('chase strip is unchanged', () => {
    expect(block('also-chase')).toContain('margin-top:12px');
    expect(block('also-track')).toContain('height:34px');
  });
  it('board grid is the shared hero grammar: 24px POS, 32px rounds, 40px TOT, 4px gap', () => {
    // Board brief: the weekly board IS the hero board (was 24px minmax(0,1fr) 40px 40px 40px TODAY/THRU/TOT).
    expect(hero).toContain('HERO_POS_W = 24');
    expect(hero).toContain('HERO_ROUND_W = 32');
    expect(hero).toContain('HERO_TOT_W = 40');
    expect(hero).toContain('HERO_GAP = 4');
  });
  it('board header is 10px/700 with .08em tracking, rows 6px under the label line', () => {
    // Board headers without POS/PLAYER: the 24px min-height floor went with
    // the old two-title header; the first row now starts 6px under the line.
    expect(hero).toContain('fontSize: 10');
    expect(hero).toContain('fontWeight: 700');
    expect(hero).toContain("letterSpacing: '0.08em'");
    expect(hero).toContain('px 6px');
  });
  it('board rows are 31px minimum with 4px vertical padding and bleed 20px', () => {
    // Board brief: single-line hero rows (was two-line 9px rows with always-on marks).
    expect(hero).toContain('minHeight: 31');
    expect(hero).toContain('2 * HERO_PAD_X');
    expect(hero).toContain("background: mine ? 'var(--tour-board-mine)'");
  });
  it('position is 12.5px/700 in ink', () => {
    // Board brief: hero POS grammar (was 11px/800 mute with .04em tracking).
    expect(hero).toContain('fontSize: 12.5, fontWeight: 700');
  });
  it('who gap is 8px and row faces are 22px', () => {
    // Marks brief: Also this week rows carry no faces (was gap:8px and size=22).
    expect(tsx).not.toContain('SquircleAvatar');
  });
  it('name 13px/600, round cells 12px/600, tot 15px/700', () => {
    // Board brief: hero cell grammar (was name 13.5/600, today 13/700, thru 13/600 mute).
    expect(hero).toContain('fontSize: 13, fontWeight: 600');
    expect(hero).toContain('fontSize: tee ? 11 : 12');
    expect(hero).toContain('fontSize: 15, fontWeight: 700');
  });
  it('the win line score is 700 weight and the board reads no holes up front', () => {
    expect(block('also-win-score')).toContain('font-weight:700');
    expect(tsx).not.toContain('useBoardHoles');
    expect(tsx).not.toContain('HoleMarks');
  });
  it('tie bracket sits 19px from the edge, 39px on your row', () => {
    // Marks brief: the tie bracket is removed (was left:19px / 39px).
    expect(() => block('also-br .tour-tie')).toThrow();
  });
  it('finished and upcoming gaps are 10px', () => {
    expect(block('also-win')).toContain('margin-top:10px');
    expect(block('also-facts')).toContain('margin-top:10px');
    expect(block('also-yours')).toContain('margin-top:10px');
  });
  it('faces keep the 34% squircle owned by SquircleAvatar, no pixel-radius overrides', () => {
    // Marks brief: every Also this week face is removed (was .also-avatar squircle rules).
    expect(() => block('also-avatar,.also-avatar>div')).toThrow();
    expect(tsx).not.toContain('also-stack');
  });
});
