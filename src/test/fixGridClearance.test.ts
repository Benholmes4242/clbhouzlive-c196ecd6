import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { resolveChrome } from '@/features/chrome-v2/registry';

const read = (file: string) => readFileSync(file, 'utf8');
const backRule = () => read('src/features/chrome-v2/island-back.css').match(/\.island-back\.island-back\s*\{([^}]+)\}/)?.[1] ?? '';
const oldClearance = 'var(' + '--island-clearance)';
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.(ts|tsx)$/.test(file) && !/\.(test|spec)\./.test(file) ? [file] : [];
  });
}
function moduleFile(spec: string, from: string): string | undefined {
  const base = spec.startsWith('@/') ? path.join('src', spec.slice(2)) : spec.startsWith('.') ? path.join(path.dirname(from), spec) : '';
  if (!base) return;
  return [base, `${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')].find(file => files.has(file));
}
const files = new Set(sourceFiles('src'));
const imports = new Map([...files].map(file => [file, ts.preProcessFile(read(file)).importedFiles.flatMap(item => {
  const target = moduleFile(item.fileName, file); return target ? [target] : [];
})]));
function reaches(file: string, target: string, seen = new Set<string>()): boolean {
  if (file === target) return true;
  if (seen.has(file)) return false;
  seen.add(file);
  return (imports.get(file) ?? []).some(next => reaches(next, target, seen));
}
// Read actual lazy imports and Route elements, rather than assuming filenames
// imply routes. Shared-shell consumers are traced through their page imports.
function routePages(): { route: string; file: string }[] {
  const app = read('src/App.tsx');
  const lazy = new Map<string, string>();
  for (const match of app.matchAll(/const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(["']([^"']+)["']\)/g)) {
    const file = moduleFile(match[2], 'src/App.tsx'); if (file) lazy.set(match[1], file);
  }
  const tree = ts.createSourceFile('src/App.tsx', app, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const rows: { route: string; file: string }[] = [];
  function visit(node: ts.Node) {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText(tree) === 'Route') {
      const attrs = node.attributes.properties;
      const route = attrs.find(attr => ts.isJsxAttribute(attr) && attr.name.getText(tree) === 'path');
      const element = attrs.find(attr => ts.isJsxAttribute(attr) && attr.name.getText(tree) === 'element');
      if (route && ts.isJsxAttribute(route) && route.initializer && ts.isStringLiteral(route.initializer) && element) {
        for (const [name, file] of lazy) if (new RegExp(`<${name}\\b`).test(element.getText(tree))) rows.push({ route: route.initializer.text, file });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree); return rows;
}

describe('FIX_GRID_1 source guards', () => {
  it('back squircle explicitly opts into pointer events', () => {
    expect(backRule()).toMatch(/pointer-events\s*:\s*auto\s*;/);
  });
  it('a pass-through island row cannot strand the back capsule', () => {
    const rowPassesThrough = /data-chrome="island"[\s\S]*?pointerEvents:\s*'none'/.test(read('src/features/chrome-v2/ChromeIsland.tsx'));
    expect(rowPassesThrough).toBe(true);
    expect(rowPassesThrough && !/pointer-events\s*:\s*auto\s*;/.test(backRule())).toBe(false);
  });
  it.each(['src/pages/WatchGridPage.tsx', 'src/pages/RoundsPage.tsx', 'src/pages/FindPeoplePage.tsx', 'src/components/manage/ManagePageShell.tsx', 'src/features/tourhub/player-v2/PlayerPage.tsx'])('%s consumes measured clearance instead of the old reservation', file => {
    const source = read(file);
    expect(source).toMatch(/import\s*\{\s*CHROME_CLEARANCE\s*\}\s*from\s*['"]@\/lib\/chromeClearance['"]/);
    expect(source).not.toContain(oldClearance);
    expect(source).toMatch(/paddingTop:\s*(?:headerB\s*\?\s*)?CHROME_CLEARANCE/);
  });
  it('Activity alone opts into the shell branch with measured root padding', () => {
    const callers = [...files].filter(file => /<ManagePageShell\b[^>]*\bheaderB\b/s.test(read(file)));
    expect(callers).toEqual(['src/features/activity-v2/ActivityPageV2.tsx']);
    expect(read('src/components/manage/ManagePageShell.tsx')).toContain('paddingTop: headerB ? CHROME_CLEARANCE : undefined');
    expect(read('src/components/manage/ManagePageShell.tsx')).toContain("marginTop: headerB ? undefined : 'calc(-1 * var(--sat, env(safe-area-inset-top, 0px)))'");
    expect(read('src/components/manage/ManagePageShell.tsx')).toContain('{!headerB && <FixedPageHeader');
  });
  it('no bleeding page or shared shell consumes old clearance', () => {
    const consumers = [...files].filter(file => read(file).includes(oldClearance));
    const pages = routePages();
    expect(pages.some(page => page.route === '/notificationmessages')).toBe(true);
    const unmapped = consumers.filter(file => !pages.some(page => reaches(page.file, file)));
    expect(unmapped, `Unmapped clearance consumers: ${unmapped.join(', ')}`).toEqual([]);
    const violations = consumers.flatMap(file => pages.filter(page => reaches(page.file, file) && resolveChrome(page.route.replace(/:[^/]+/g, 'fixture'), new URLSearchParams()).bleed).map(page => `${file}: ${page.route}`));
    expect(violations, `All old-clearance consumers: ${consumers.join(', ')}; bleeding consumers: ${violations.join(', ')}`).toEqual([]);
  });
});