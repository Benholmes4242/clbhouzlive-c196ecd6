import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const css = readFileSync(resolve(__dirname, '../components/courses/top100/top100Compare.css'), 'utf8');
const rule = (sel: string) => {
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
  const m = css.match(new RegExp(`(?:^|[}\\s])${esc}\\s*\\{([^}]*)\\}`));
  return m ? m[1] : null;
};

describe('top100Compare.css', () => {
  it('detail panel why line is 12px; argument row why line is 11.5px', () => {
    expect(rule('.t100b-why')).toMatch(/font-size:\s*11\.5px/);
    expect(rule('.t100b-detail .t100b-why')).toMatch(/font-size:\s*12px/);
  });
  it('sheet detail panel background differs from var(--t100b-panel)', () => {
    const r = rule('.t100b-sheet .t100b-detail');
    expect(r).not.toBeNull();
    const bg = r!.match(/background:\s*([^;]+)/)?.[1].trim();
    expect(bg).toBeTruthy();
    expect(bg).not.toBe('var(--t100b-panel)');
  });
});
