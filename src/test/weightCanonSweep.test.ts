import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

/** Weight canon series: add later briefs' completed scopes here, never fork the sweep. */
const CLEAN_SCOPES = [
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
const shorthandOutsideCanon = (value: string) => /(?:^|\s)(\d+(?:\.\d+)?)\s+(?:(?:\d|\.)+(?:px|pt|em|rem|%)|(?:xx?-small|small|medium|large|xx?-large))\b/.exec(value)?.[1];

function walk(path: string): string[] {
  if (!statSync(path).isDirectory()) return /\.(tsx?|css)$/.test(path) && !/\.test\./.test(path) ? [path] : [];
  return readdirSync(path).flatMap((name) => name === '__tests__' ? [] : walk(join(path, name)));
}

function violations(file: string): string[] {
  const text = readFileSync(file, 'utf8');
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
  const visit = (node: ts.Node) => {
    if (ts.isPropertyAssignment(node) && ['fontWeight', 'font-weight'].includes(node.name.getText(source).replace(/['"]/g, '')) && hasHeavyWeight(node.initializer)) add(node.getStart(source), 'fontWeight literal/conditional/variable');
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) && !ts.isImportDeclaration(node.parent)) {
      const value = ts.isTemplateExpression(node) ? node.getText(source) : node.text;
      if (/\bfont-(?:thin|extralight|light|extrabold|black)\b/.test(value) || [...value.matchAll(/\bfont-\[([\d.]+)\]/g)].some((match) => numericWeightOutsideCanon(match[1]))) add(node.getStart(source), 'Tailwind weight outside canon');
      for (const declaration of value.matchAll(/\b(font-weight|font)\s*:\s*([^;\n]+)/g)) {
        const weight = declaration[1] === 'font-weight' ? declaration[2].trim() : shorthandOutsideCanon(declaration[2]);
        if (weight && numericWeightOutsideCanon(weight)) add(node.getStart(source), 'CSS/canvas font shorthand');
      }
      const canvasWeight = shorthandOutsideCanon(value);
      if (canvasWeight && numericWeightOutsideCanon(canvasWeight)) add(node.getStart(source), 'canvas font shorthand');
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