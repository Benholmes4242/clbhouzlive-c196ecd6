/** Also this week spacing brief: signed-off mock build-also-this-week-spacing-signed-off.html.
 * Sizes and gaps only; asserts the CSS and the board avatar default. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const css = readFileSync(resolve(__dirname, '../features/tourhub/overview/sections/alsoWeek.css'), 'utf8');
const tsx = readFileSync(resolve(__dirname, '../features/tourhub/overview/sections/AlsoWeekEvent.tsx'), 'utf8');
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
  it('board grid is 24px minmax(0,1fr) 40px 40px 40px with 4px column gap', () => {
    expect(block('also-bh,.also-br')).toContain('grid-template-columns:24px minmax(0,1fr) 40px 40px 40px');
    expect(block('also-bh,.also-br')).toContain('column-gap:4px');
  });
  it('board header is 24px min-height, no bottom padding, 10px/700 mute', () => {
    const bh = block('also-bh');
    expect(bh).toContain('min-height:24px');
    expect(bh).toContain('padding-bottom:0');
    expect(bh).toContain('font-size:10px');
    expect(bh).toContain('font-weight:700');
    expect(bh).toContain('letter-spacing:.08em');
    expect(bh).toContain('color:var(--tour-board-mute)');
  });
  it('board rows are 33px and your row bleeds 20px', () => {
    // Marks brief: rows are two lines with 9px top/bottom padding (was min-height 33px / padding 0 20px).
    expect(block('also-br')).toContain('padding:9px 0');
    const mine = block('also-br[data-mine=true]');
    expect(mine).toContain('margin:0 -20px');
    expect(mine).toContain('padding:9px 20px');
  });
  it('position is 11px/800 with .04em tracking, leader in ink', () => {
    const pos = block('also-pos');
    expect(pos).toContain('font-size:11px');
    expect(pos).toContain('font-weight:800');
    expect(pos).toContain('letter-spacing:.04em');
    expect(block('also-pos[data-leader=true]')).toContain('color:var(--tour-board-ink)');
  });
  it('who gap is 8px and row faces are 22px', () => {
    // Marks brief: Also this week rows carry no faces (was gap:8px and size=22).
    expect(tsx).not.toContain('SquircleAvatar');
  });
  it('name 13.5px/600, today 13px/700, thru 13px/600 mute, tot 15px/700', () => {
    expect(block('also-name')).toContain('font-size:13.5px');
    expect(block('also-name')).toContain('font-weight:600');
    expect(block('also-today')).toContain('font-size:13px');
    expect(block('also-today')).toContain('font-weight:700');
    expect(block('also-thru')).toContain('font-size:13px');
    expect(block('also-thru')).toContain('font-weight:600');
    expect(block('also-tot')).toContain('font-size:15px');
    expect(block('also-tot')).toContain('font-weight:700');
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
