import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

// FIX_OVERFLOW_1 explicitly requests source assertions: jsdom cannot measure
// min-content sizing. The three wizard-owned exceptions are explicitly ruled.
function objects(path: string) {
  const source = ts.createSourceFile(path, readFileSync(resolve(process.cwd(), path), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: Array<{ text: string; properties: Map<string, string> }> = [];
  function visit(node: ts.Node) {
    if (ts.isObjectLiteralExpression(node)) {
      const properties = new Map<string, string>();
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property)) properties.set(property.name.getText(source), property.initializer.getText(source));
      }
      found.push({ text: node.getText(source), properties });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return found;
}
const course = 'src/components/courses/course-detail/CourseAboutTab.tsx';
const map = 'src/components/map/LocationMapCard.tsx';
const business = 'src/components/courses/course-detail/ClaimedCourseProfileLink.tsx';
const tour = 'src/features/tourhub/components/TourIsland.tsx';
const chrome = 'src/features/chrome-v2/ChromeIsland.tsx';
function wrapping(properties: Map<string, string>) {
  expect(properties.get('lineHeight')).toBe('1.3');
  expect(properties.get('overflowWrap')).toBe("'anywhere'");
  for (const key of ['overflow', 'textOverflow', 'whiteSpace']) expect(properties.has(key)).toBe(false);
}

describe('FIX_OVERFLOW_1 scoped source contracts', () => {
  it('all non-test inline grids declare columns except the three wizard-owned files', () => {
    // FIX_OVERFLOW_1 continuation: these files are owned by the review wizard
    // and its shared header, and are the ONLY approved exceptions.
    const exceptions = new Set([
      'src/features/review-v2/components/MediaTray.tsx',
      'src/features/review-v2/components/VoiceDictateButton.tsx',
      'src/features/composer-flow/components/ComposerStepHeader.tsx',
    ]);
    const columns = ['gridTemplateColumns', 'gridTemplate', 'gridTemplateAreas', 'gridAutoFlow', 'gridAutoColumns'];
    const violations: string[] = [];
    let scanned = 0;
    function scan(directory: string) {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = `${directory}/${entry.name}`;
        if (entry.isDirectory()) {
          if (!['test', 'tests', '__tests__'].includes(entry.name)) scan(path);
        } else if (path.endsWith('.tsx') && !/\.(test|spec)\.tsx$/.test(path) && !exceptions.has(path)) {
          scanned++;
          for (const object of objects(path)) {
            if (object.properties.get('display') === "'grid'" && !columns.some(key => object.properties.has(key))) violations.push(`${path}: ${object.text}`);
          }
        }
      }
    }
    scan('src');
    expect(scanned).toBeGreaterThan(1000);
    expect(violations).toEqual([]);
  });
  it('About stack and claimed-profile wrapper use shrinkable single columns', () => {
    const grids = objects(course).filter(object => object.properties.get('display') === "'grid'");
    expect(grids).toHaveLength(2);
    for (const grid of grids) expect(grid.properties.get('gridTemplateColumns')).toBe("'minmax(0, 1fr)'");
    expect(grids[0].properties.get('gap')).toBe('0');
    expect(grids[1].properties.get('gap')).toBe('12');
    expect(grids[1].properties.get('padding')).toBe("'0 20px'");
  });
  it('map footer location wraps without clipping', () => {
    const footer = objects(map).find(object => object.properties.get('fontSize') === '13');
    expect(footer).toBeDefined();
    if (footer) wrapping(footer.properties);
  });
  it('Directions remains non-shrinking', () => {
    const action = objects(map).find(object => object.properties.get('minHeight') === '44');
    expect(action?.properties.get('flexShrink')).toBe('0');
  });
  it('claiming business name wraps and can shrink', () => {
    const name = objects(business).find(object => object.properties.get('fontSize') === '13');
    expect(name).toBeDefined();
    if (name) { wrapping(name.properties); expect(name.properties.get('minWidth')).toBe('0'); }
  });
  it('Visit profile remains non-shrinking and on one line', () => {
    const action = objects(business).find(object => object.properties.get('fontSize') === '12');
    expect(action?.properties.get('flexShrink')).toBe('0');
    expect(action?.properties.get('whiteSpace')).toBe("'nowrap'");
  });
  it('Tour island shell, control and text column can shrink', () => {
    const styles = objects(tour);
    const shell = styles.find(object => object.properties.get('height') === '46');
    const control = styles.find(object => object.properties.get('fontFamily') === "'inherit'");
    const column = styles.find(object => object.properties.get('flexDirection') === "'column'");
    for (const style of [shell, control, column]) expect(style?.properties.get('minWidth')).toBe('0');
    expect(shell?.properties.get('overflow')).toBe("'hidden'");
    expect(control?.properties.get('overflow')).toBe("'hidden'");
  });
  it('Tour caption gives way before the untruncated tour label', () => {
    const styles = objects(tour);
    const caption = styles.find(object => object.properties.get('fontSize') === '8.5');
    expect(caption?.properties.get('overflow')).toBe("'hidden'");
    expect(caption?.properties.get('textOverflow')).toBe("'ellipsis'");
    expect(caption?.properties.get('whiteSpace')).toBe("'nowrap'");
    const label = styles.find(object => object.properties.get('fontSize') === '15');
    expect(label?.properties.get('whiteSpace')).toBe("'nowrap'");
    expect(label?.properties.has('textOverflow')).toBe(false);
    expect(label?.properties.has('overflow')).toBe(false);
  });
  it('Tour-only capsule rules shrink left and preserve member and guest right', () => {
    const source = readFileSync(resolve(process.cwd(), chrome), 'utf8');
    expect(source.match(/location\.pathname === '\/tourhub' \? \{ flexShrink: 0 \}/g)).toHaveLength(2);
    expect(source).toContain("location.pathname === '/tourhub' ? { minWidth: 0, overflow: 'hidden' }");
    expect(source).toContain('left: 12,');
    expect(source).toContain('right: 12,');
    expect(source).toContain('gap: 8,');
  });
});