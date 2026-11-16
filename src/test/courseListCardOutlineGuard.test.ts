/** RULING_COURSE_LIST_FOCUS: course list sheets set no outline (the app-wide button ring wins); figures stay tabular. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/components/courses/courseListCard.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selectors: m[1].split(',').map((x) => x.trim()), body: m[2] }));

describe('course list card stylesheet guard', () => {
  it.each(['src/components/courses/courseListCard.css', 'src/components/courses/courseListView.css'])('no selector in %s sets outline', (file) => {
    const src = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const outlined = [...src.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => /(^|;|\s)outline(-[a-z]+)?\s*:/.test(m[2])).map((m) => m[1].trim());
    expect(outlined).toEqual([]);
  });
  it.each(['.course-list-position', '.course-list-figure', '.course-list-gross'])('%s sits in a tabular-nums rule', (sel) => {
    expect(rules.some((r) => r.selectors.includes(sel) && /font-variant-numeric:\s*tabular-nums/.test(r.body))).toBe(true);
  });
  it('ends with a newline', () => { expect(readFileSync('src/components/courses/courseListCard.css', 'utf8').endsWith('\n')).toBe(true); });
});
