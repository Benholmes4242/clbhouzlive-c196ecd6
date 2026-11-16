/** FIX_COURSE_CARD_OUTLINE: only the card's focus ring draws an outline; figures stay tabular. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/components/courses/courseListCard.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selectors: m[1].split(',').map((x) => x.trim()), body: m[2] }));

describe('course list card stylesheet guard', () => {
  it('the only selector that sets outline is .course-list-card:focus-visible', () => {
    const outlined = rules.filter((r) => /(^|;|\s)outline\s*:/.test(r.body)).flatMap((r) => r.selectors);
    expect(outlined).toEqual(['.course-list-card:focus-visible']);
  });
  it.each(['.course-list-position', '.course-list-figure', '.course-list-gross'])('%s sits in a tabular-nums rule', (sel) => {
    expect(rules.some((r) => r.selectors.includes(sel) && /font-variant-numeric:\s*tabular-nums/.test(r.body))).toBe(true);
  });
  it('ends with a newline', () => { expect(readFileSync('src/components/courses/courseListCard.css', 'utf8').endsWith('\n')).toBe(true); });
});
