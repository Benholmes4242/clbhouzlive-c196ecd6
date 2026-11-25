/** Brief 18's single colour contract uses the real declaration expressions,
 * including imported/local objects and CSS variables, as computed DOM probes.
 * It deliberately does not mock i18next or change production render boundaries.
 * Browser real-component captures separately verify the rendered consumers. */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';
import { createElement } from 'react';
import { render, cleanup } from '@testing-library/react';
import { TileSection } from '@/features/courses/_shared/scorecard/scorecardParts';
import sites from './fixtures/brief18EyebrowSites.json';

type Value = string | number | Record<string, unknown> | undefined;
const root = process.cwd();
const sources = new Map<string, ts.SourceFile>();
function source(file: string) {
  const path = resolve(root, file);
  let ast = sources.get(path);
  if (!ast) {
    ast = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    sources.set(path, ast);
  }
  return ast;
}
function moduleFile(file: string, specifier: string): string | undefined {
  const base = specifier.startsWith('@/') ? resolve(root, 'src', specifier.slice(2)) : resolve(dirname(resolve(root, file)), specifier);
  return ['.ts', '.tsx', '/index.ts', '/index.tsx', ''].map(suffix => base + suffix).find(path => existsSync(path) && statSync(path).isFile());
}
function imported(file: string, name: string): { file: string; name: string } | undefined {
  for (const statement of source(file).statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const clause = statement.importClause?.namedBindings;
    if (!clause || !ts.isNamedImports(clause)) continue;
    const binding = clause.elements.find(element => element.name.text === name);
    if (!binding) continue;
    const specifier = statement.moduleSpecifier.text;
    const path = moduleFile(file, specifier);
    if (path) return { file: path, name: binding.propertyName?.text ?? name };
  }
}
function named(file: string, name: string, depth: number): Value {
  if (depth > 60) return undefined;
  let expression: ts.Expression | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name && node.initializer) expression = node.initializer;
    ts.forEachChild(node, visit);
  };
  visit(source(file));
  if (expression) return evaluate(file, expression, depth + 1);
  const binding = imported(file, name);
  if (binding) return named(binding.file, binding.name, depth + 1);
  const exports = source(file).statements.filter(ts.isExportDeclaration);
  for (const statement of exports) {
    if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier) || !statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue;
    const exported = statement.exportClause.elements.find(element => element.name.text === name);
    if (!exported) continue;
    const path = moduleFile(file, statement.moduleSpecifier.text);
    if (path) return named(path, exported.propertyName?.text ?? name, depth + 1);
  }
  for (const statement of exports) {
    if (statement.exportClause || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const path = moduleFile(file, statement.moduleSpecifier.text);
    if (!path) continue;
    const value = named(path, name, depth + 1);
    if (value !== undefined) return value;
  }
  return undefined;
}
function evaluate(file: string, node: ts.Expression, depth = 0): Value {
  if (depth > 60) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  // Resolve the changed local fallback, not a runtime coloured tone override.
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) return evaluate(file, node.right, depth + 1);
  if (ts.isAsExpression(node) || ts.isParenthesizedExpression(node) || ts.isSatisfiesExpression(node)) return evaluate(file, node.expression, depth + 1);
  if (ts.isIdentifier(node)) return named(file, node.text, depth + 1);
  if (ts.isPropertyAccessExpression(node)) {
    const object = evaluate(file, node.expression, depth + 1);
    return object && typeof object === 'object' ? object[node.name.text] as Value : undefined;
  }
  if (ts.isObjectLiteralExpression(node)) {
    const result: Record<string, unknown> = {};
    for (const property of node.properties) {
      if (ts.isSpreadAssignment(property)) {
        const spread = evaluate(file, property.expression, depth + 1);
        if (spread && typeof spread === 'object') Object.assign(result, spread);
      } else if (ts.isPropertyAssignment(property)) {
        result[property.name.getText(source(file)).replace(/['"]/g, '')] = evaluate(file, property.initializer, depth + 1);
      } else if (ts.isShorthandPropertyAssignment(property)) {
        result[property.name.text] = named(file, property.name.text, depth + 1);
      }
    }
    return result;
  }
}
const css = readFileSync(resolve(root, 'src/index.css'), 'utf8');
function cssColour(value: string, local: string, depth = 0): string {
  if (depth > 15) return value;
  const variable = /^var\((--[^,)]+)(?:,\s*([^)]*))?\)$/.exec(value.trim());
  if (!variable) return value.trim();
  const pattern = new RegExp(variable[1] + '\\s*:\\s*([^;}]+)', 'g');
  const matches = [...local.matchAll(pattern), ...css.matchAll(pattern)];
  const resolved = matches[0]?.[1] ?? variable[2];
  return resolved ? cssColour(resolved, local, depth + 1) : value;
}

/* Brief 27: sites are identified by content, never by line number.
 *   selector    — CSS rule in the file
 *   key         — innermost JSX element whose own attributes declare `color`
 *                 and whose subtree calls t('<key>')
 *   eyebrow     — JSX element carrying data-eyebrow="<name>"
 *   declaration — style constant `<name>` (or `<Function>.<name>` when the
 *                 file declares that name more than once)
 * Each must resolve to exactly one `color` declaration, so a removed or
 * duplicated eyebrow fails. */
type Site = { file: string; selector?: string; key?: string; eyebrow?: string; declaration?: string };
const label = (site: Site) => `${site.file} [${site.selector ?? site.key ?? site.eyebrow ?? site.declaration}]`;
const isElement = (node: ts.Node): node is ts.JsxElement | ts.JsxSelfClosingElement => ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node);
function attributeColours(ast: ts.SourceFile, node: ts.JsxElement | ts.JsxSelfClosingElement) {
  const found: ts.PropertyAssignment[] = [];
  const visit = (child: ts.Node) => {
    if (ts.isPropertyAssignment(child) && child.name.getText(ast) === 'color') found.push(child);
    if (!isElement(child)) ts.forEachChild(child, visit);
  };
  visit((ts.isJsxElement(node) ? node.openingElement : node).attributes);
  return found;
}
function locate(site: Site): ts.PropertyAssignment[] {
  const ast = source(site.file);
  if (site.declaration) {
    const [scope, name] = site.declaration.includes('.') ? site.declaration.split('.') : [undefined, site.declaration];
    const decls: ts.VariableDeclaration[] = [];
    const visit = (node: ts.Node, inScope: boolean) => {
      let here = inScope;
      if (scope && (ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) && node.name && ts.isIdentifier(node.name) && node.name.text === scope) here = true;
      if (here && ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name && node.initializer) decls.push(node);
      ts.forEachChild(node, child => visit(child, here));
    };
    visit(ast, !scope);
    if (decls.length !== 1) return [];
    const found: ts.PropertyAssignment[] = [];
    const walk = (node: ts.Node) => {
      if (ts.isPropertyAssignment(node) && node.name.getText(ast) === 'color') found.push(node);
      ts.forEachChild(node, walk);
    };
    walk(decls[0].initializer!);
    return found;
  }
  const matches: (ts.JsxElement | ts.JsxSelfClosingElement)[] = [];
  const call = site.key && new RegExp("\\bt\\(\\s*['\"`]" + site.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "['\"`]");
  const visit = (node: ts.Node) => {
    if (isElement(node) && attributeColours(ast, node).length > 0) {
      const open = ts.isJsxElement(node) ? node.openingElement : node;
      if (site.eyebrow) {
        const attr = open.attributes.properties.find(a => ts.isJsxAttribute(a) && a.name.getText(ast) === 'data-eyebrow') as ts.JsxAttribute | undefined;
        if (attr?.initializer && ts.isStringLiteral(attr.initializer) && attr.initializer.text === site.eyebrow) matches.push(node);
      } else if (call && call.test(node.getText(ast))) matches.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  const innermost = matches.filter(node => !matches.some(other => other !== node && other.pos >= node.pos && other.end <= node.end));
  if (innermost.length !== 1) return [];
  return attributeColours(ast, innermost[0]);
}

it('every Part 1 eyebrow declaration computes to rgb(248, 250, 252)', () => {
  expect(sites).toHaveLength(112);
  for (const site of sites as Site[]) {
    let colour: unknown;
    if (site.selector) {
      const sheet = readFileSync(resolve(root, site.file), 'utf8');
      const escaped = site.selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rule = new RegExp('(?:^|[}\\n])' + escaped + '\\s*\\{([^}]*)\\}').exec(sheet)?.[1];
      const declared = rule && /(?:^|;)\s*color\s*:\s*([^;]+)/.exec(rule)?.[1];
      colour = declared ? cssColour(declared, sheet) : undefined;
    } else {
      const found = locate(site);
      expect(found.length, `${label(site)} is found exactly once`).toBe(1);
      colour = evaluate(site.file, found[0].initializer);
      if (typeof colour === 'string') colour = cssColour(colour, css);
    }
    expect(typeof colour, `${label(site)} has a resolved colour`).toBe('string');
    const element = document.createElement('span');
    element.style.color = String(colour);
    document.body.appendChild(element);
    expect(getComputedStyle(element).color, label(site)).toBe('rgb(248, 250, 252)');
    element.remove();
  }
  const view = render(createElement(TileSection, { kicker: 'Fixture', children: null }));
  expect(getComputedStyle(view.getByRole('heading')).color).toBe('rgb(248, 250, 252)');
  cleanup();
  const card = source('src/features/courses/_shared/scorecard/CardScorecardSheet.tsx');
  const optedIn: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(card) === 'TileSection') {
      const attrs = node.attributes.properties.filter(ts.isJsxAttribute);
      const id = attrs.find(attr => attr.name.getText(card) === 'testId')?.initializer;
      if (id && ts.isStringLiteral(id) && ['card', 'rounds'].includes(id.text)) {
        const ink = attrs.find(attr => attr.name.getText(card) === 'ink')?.initializer;
        expect(ink && ts.isJsxExpression(ink) ? ink.expression?.getText(card) : undefined).toBeUndefined();
        optedIn.push(id.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(card);
  expect(optedIn.sort()).toEqual(['card', 'rounds']);
});
