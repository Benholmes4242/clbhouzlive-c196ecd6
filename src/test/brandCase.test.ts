import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

/** Parse visible text rather than raw source: comments, identifiers and locale
 * keys are not brand copy. Template fragments and JSX attributes are copy too. */
const wrongBrand = /\b(?:Clbhouz|CLBHOUZ)\b(?! LTD\b)/;

function scan(file: string, text: string): string[] {
  const hits: string[] = [];
  const add = (value: string, line: number) => {
    if (wrongBrand.test(value)) hits.push(`${file}:${line}: ${value}`);
  };
  if (file.endsWith('.json')) {
    const values = (value: unknown, path: string) => {
      if (typeof value === 'string') {
        if (wrongBrand.test(value)) hits.push(`${file}: ${path}: ${value}`);
      } else if (Array.isArray(value)) {
        value.forEach((entry, index) => values(entry, `${path}[${index}]`));
      } else if (value && typeof value === 'object') {
        Object.entries(value).forEach(([key, entry]) => values(entry, `${path}.${key}`));
      }
    };
    values(JSON.parse(text), '$');
    return hits;
  }
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      const key = (ts.isPropertyAssignment(node.parent) || ts.isMethodDeclaration(node.parent) || ts.isPropertySignature(node.parent)) && node.parent.name === node;
      const moduleName = ts.isImportDeclaration(node.parent) || ts.isExportDeclaration(node.parent);
      if (!key && !moduleName) add(node.text, source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return hits;
}

function files(path: string): string[] {
  if (!statSync(path).isDirectory()) return /\.(?:json|[cm]?[jt]sx?)$/.test(path) && !/\.test\./.test(path) ? [path] : [];
  return readdirSync(path).sort().flatMap(name => files(join(path, name)));
}

describe('Member-facing brand case', () => {
  it.each([
    ['lowercase literal', 'fixture.tsx', 'const label = "clbhouz";', false],
    ['locale identifier', 'fixture.tsx', 'const notOnClbhouz = true;', false],
    ['variable identifier', 'fixture.tsx', 'const viaClbhouz = true;', false],
    ['component identifier', 'fixture.tsx', 'const node = <ClbhouzLogo />;', false],
    ['legal name', 'fixture.tsx', 'const label = "CLBHOUZ LTD";', false],
    ['capitalized support', 'fixture.tsx', 'const label = "Clbhouz Support";', true],
    ['capitalized JSX', 'fixture.tsx', 'const node = <p>on Clbhouz.</p>;', true],
    ['comments', 'fixture.tsx', '// Clbhouz Support\n/* CLBHOUZ */ const ok = true;', false],
    ['locale key', 'fixture.json', '{"notOnClbhouz":"clbhouz"}', false],
    ['locale value', 'fixture.json', '{"support":"Clbhouz Support"}', true],
    ['template tail', 'fixture.tsx', 'const label = `${name} on CLBHOUZ`;', true],
    ['JSX attribute', 'fixture.tsx', 'const node = <p title="Clbhouz Support" />;', true],
  ])('%s', (_name, file, text, fails) => {
    expect(scan(file, text).length > 0).toBe(fails);
  });

  it.each(['src/locales', 'src/pages', 'src/features', 'src/components'])('keeps all copy lowercase in %s', scope => {
    expect(files(scope).flatMap(file => scan(file, readFileSync(file, 'utf8')))).toEqual([]);
  }, 60_000);
});