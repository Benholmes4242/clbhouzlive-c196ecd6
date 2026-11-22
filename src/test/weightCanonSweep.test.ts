import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

/** Weight canon series: add later briefs' completed scopes here, never fork the sweep. */
export const CLEAN_SCOPES = [
  'src/features/tourhub',
  'src/components/profile',
  'src/features/edit-profile',
  'src/features/profile-sheet-v2',
  'src/components/settings',
  'src/pages/messaging-v2',
  'src/pages/FindPeoplePage.tsx',
  'src/pages/BusinessInvitePage.tsx',
];

// The same selector in its short-screen rule is the same single sanctioned exception.
const ALLOWLIST = [{ file: 'src/pages/auth/components/auth-hero.css', selector: '.auth-hero-brand h1' }];
const ALLOWED_WEIGHTS = new Set([400, 500, 600, 700]);
const numericWeightOutsideCanon = (value: string) => /^\d+(?:\.\d+)?$/.test(value.trim()) && !ALLOWED_WEIGHTS.has(Number(value));
const shorthandOutsideCanon = (value: string) => {
  const match = /(?:^|\s)(\d+(?:\.\d+)?)\s+(?:\d+(?:\.\d+)?|\.\d+|__dynamic__)(?:px|pt|em|rem|%|vh|vw|vmin|vmax|ch|ex)(?:\s*\/\s*(?:\d+(?:\.\d+)?|\.\d+)(?:px|pt|em|rem|%)?)?\s+(.+)/.exec(value.trim());
  if (!match || /^(?:rgba|rgb|hsl|hsla|var|calc|color-mix)\s*\(/i.test(match[2].trim())) return undefined;
  return match[1];
};

function walk(path: string): string[] {
  if (!statSync(path).isDirectory()) return /\.(tsx?|css)$/.test(path) && !/\.test\./.test(path) ? [path] : [];
  return readdirSync(path).flatMap((name) => name === '__tests__' ? [] : walk(join(path, name)));
}

function violations(file: string): string[] {
  return scan(file, readFileSync(file, 'utf8'));
}

/** Only actual font-value contexts enter the shorthand path; layout strings never do. */
export function scan(file: string, text: string): string[] {
  const hits: string[] = [];
  const add = (pos: number, form: string) => hits.push(`${file}:${text.slice(0, pos).split('\n').length} (${form})`);

  if (file.endsWith('.css')) {
    const css = text.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
    for (const block of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = block[1].trim();
      if (ALLOWLIST.some((entry) => entry.file === file && entry.selector === selector)) continue;
      for (const decl of block[2].matchAll(/\b(font-weight|font)\s*:\s*([^;{}]+)/g)) {
        const weight = decl[1] === 'font-weight' ? decl[2].trim().replace(/\s*!important$/, '') : shorthandOutsideCanon(decl[2]);
        if ((weight && numericWeightOutsideCanon(weight)) || /\bbolder\b/.test(decl[2])) add(block.index ?? 0, `CSS ${decl[1]}`);
      }
    }
    return hits;
  }

  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const variables = new Map<string, ts.Expression>();
  const collect = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) variables.set(node.name.text, node.initializer);
    ts.forEachChild(node, collect);
  };
  collect(source);
  const hasHeavyWeight = (expr: ts.Expression, seen = new Set<string>()): boolean => {
    if (ts.isNumericLiteral(expr) || ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return numericWeightOutsideCanon(expr.text) || expr.text === 'bolder';
    if (ts.isIdentifier(expr)) {
      const value = variables.get(expr.text);
      if (!value || seen.has(expr.text)) return false;
      return hasHeavyWeight(value, new Set([...seen, expr.text]));
    }
    if (ts.isConditionalExpression(expr)) return hasHeavyWeight(expr.whenTrue, seen) || hasHeavyWeight(expr.whenFalse, seen);
    if (ts.isParenthesizedExpression(expr) || ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr)) return hasHeavyWeight(expr.expression, seen);
    if (ts.isBinaryExpression(expr)) return hasHeavyWeight(expr.left, seen) || hasHeavyWeight(expr.right, seen);
    return false;
  };
  const hasHeavyFont = (expr: ts.Expression, seen = new Set<string>()): boolean => {
    if (ts.isIdentifier(expr)) {
      const value = variables.get(expr.text);
      return !!value && !seen.has(expr.text) && hasHeavyFont(value, new Set([...seen, expr.text]));
    }
    if (ts.isParenthesizedExpression(expr) || ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr)) return hasHeavyFont(expr.expression, seen);
    if (ts.isConditionalExpression(expr)) return hasHeavyFont(expr.whenTrue, seen) || hasHeavyFont(expr.whenFalse, seen);
    const value = ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)
      ? expr.text
      : ts.isTemplateExpression(expr)
        ? expr.head.text + expr.templateSpans.map((span) => `__dynamic__${span.literal.text}`).join('')
        : undefined;
    const weight = value === undefined ? undefined : shorthandOutsideCanon(value);
    return weight !== undefined && numericWeightOutsideCanon(weight);
  };
  const visit = (node: ts.Node) => {
    if (ts.isPropertyAssignment(node) && ['fontWeight', 'font-weight'].includes(node.name.getText(source).replace(/['"]/g, '')) && hasHeavyWeight(node.initializer)) add(node.getStart(source), 'fontWeight literal/conditional/variable');
    if (ts.isPropertyAssignment(node) && node.name.getText(source).replace(/['"]/g, '') === 'font' && hasHeavyFont(node.initializer)) add(node.getStart(source), 'font property shorthand');
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(node.left) && node.left.name.text === 'font' && hasHeavyFont(node.right)) add(node.getStart(source), 'canvas font shorthand');
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) && !ts.isImportDeclaration(node.parent)) {
      const value = ts.isTemplateExpression(node) ? node.getText(source) : node.text;
      if (/\bfont-(?:thin|extralight|light|extrabold|black)\b/.test(value) || [...value.matchAll(/\bfont-\[([\d.]+)\]/g)].some((match) => numericWeightOutsideCanon(match[1]))) add(node.getStart(source), 'Tailwind weight outside canon');
      for (const declaration of value.matchAll(/\b(font-weight|font)\s*:\s*([^;\n]+)/g)) {
        const weight = declaration[1] === 'font-weight' ? declaration[2].trim() : shorthandOutsideCanon(declaration[2]);
        if (weight && numericWeightOutsideCanon(weight)) add(node.getStart(source), 'CSS/canvas font shorthand');
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return hits;
}

describe('Weight canon in completed app-wide scopes', () => {
  it('every clean scope uses only 400, 500, 600 and 700 in all five forms', () => {
    expect(CLEAN_SCOPES.flatMap(walk).flatMap(violations)).toEqual([]);
  });
});

describe('Weight matcher font contexts', () => {
  it.each([
    ["const shadow = '0 0 24px rgba(251,188,46,.35)'"],
    ["const style = { margin: '0 0 8px' }"],
    ["const style = { padding: '0 0 0 8px' }"],
    ["const style = { boxShadow: '0 2px rgba(0,0,0,.4)' }"],
    ["const style = { transition: '200ms ease 0s' }"],
    ['const style = { fontWeight: 700 }'],
    ["ctx.font = '700 32px -apple-system, sans-serif'"],
  ])('accepts non-weight strings or canonical values: %s', (text) => {
    expect(scan('fixture.tsx', text)).toEqual([]);
  });

  it.each([
    ['fixture.tsx', 'const style = { fontWeight: 800 }'],
    ['fixture.tsx', 'const style = { fontWeight: 200 }'],
    ['fixture.tsx', 'const style = { fontWeight: isHero ? 900 : 700 }'],
    ['fixture.tsx', "const style = { fontWeight: '750' }"],
    ['fixture.tsx', "ctx.font = '800 32px -apple-system'"],
    ['fixture.tsx', "const style = { font: '750 14px Inter' }"],
    ['fixture.tsx', 'const F = `900 ${s}px ${FAMILY}`; ctx.font = F;'],
    ['fixture.tsx', '<div className="font-black" />'],
    ['fixture.tsx', '<div className="font-light" />'],
    ['fixture.tsx', '<div className="font-[800]" />'],
    ['fixture.css', '.x{font:800 12px/1 sans-serif}'],
    ['fixture.css', '.x{font-weight:300}'],
    ['fixture.tsx', "const F = '750 14px sans-serif'; const style = { font: F }"],
    ['fixture.tsx', 'const F = `900 ${s}px ${FAMILY}`; const style = { font: F }'],
  ])('rejects out-of-canon font values: %s %s', (file, text) => {
    expect(scan(file, text)).toHaveLength(1);
  });

  it.each(['rgba', 'rgb', 'hsl', 'hsla', 'var', 'calc', 'color-mix'])('does not treat %s as a font family', (fn) => {
    expect(scan('fixture.tsx', `ctx.font = '800 12px ${fn}(0)'`)).toEqual([]);
  });
});