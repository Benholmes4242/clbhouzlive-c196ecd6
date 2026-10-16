/**
 * FIELD_EXCLUDES_VIEWER — READ THIS BEFORE ADDING A "YOU vs THE FIELD" FIGURE.
 *
 * "The field excluding the viewer" has exactly ONE implementation, in
 * src/lib/courseYou/youDerivations.ts: fieldExcludingViewer (course level) and
 * holeEdges (per hole: get_course_hole_field minus par). A new comparison
 * surface must import these, never recompute them. Surfaces already fixed are
 * listed below and must keep importing them.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(__dirname, '..');
const HOME = 'lib/courseYou/youDerivations.ts';
const FIXED_SURFACES: Record<string, string[]> = {
  'components/courses/course-detail/CourseYouTab.tsx': ['fieldExcludingViewer', 'holeEdges'],
  'components/courses/course-detail/you/YourRoundsSheet.tsx': ['fieldExcludingViewer'],
  'components/courses/course-detail/about/AllHolesSheet.tsx': ['holeEdges'],
};

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'test' ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const files = sourceFiles(ROOT).map((path) => ({ rel: relative(ROOT, path).replace(/\\/g, '/'), text: readFileSync(path, 'utf8') }));

describe('field excluding viewer has one implementation and fixed surfaces import it', () => {
  it.each(['fieldExcludingViewer', 'holeEdges'])('%s is defined only in youDerivations', (name) => {
    const definers = files
      .filter((f) => new RegExp(`(function|const|let)\\s+${name}\\b`).test(f.text))
      .map((f) => f.rel);
    expect(definers).toEqual([HOME]);
  });

  it('no file outside youDerivations subtracts par from the excluding field (avg_gross - par)', () => {
    const recomputers = files
      .filter((f) => f.rel !== HOME && /avg_gross\s*-\s*[\w.]*par\b/.test(f.text))
      .map((f) => f.rel);
    expect(recomputers).toEqual([]);
  });

  it.each(Object.entries(FIXED_SURFACES))('%s imports its field derivation from youDerivations', (rel, names) => {
    const text = files.find((f) => f.rel === rel)?.text ?? '';
    const imp = text.match(/import\s*{([^}]*)}\s*from\s*'@\/lib\/courseYou\/youDerivations'/);
    expect(imp).not.toBeNull();
    for (const name of names) expect(imp![1]).toMatch(new RegExp(`\\b${name}\\b`));
  });
});
