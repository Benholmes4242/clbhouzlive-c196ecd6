/** Static literal-key calls are checked against the real English resources.
 * Dynamic keys/options are reported separately rather than guessed. */
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(dir, entry.name)) : /\.tsx?$/.test(entry.name) ? [join(dir, entry.name)] : []);
}
function lookup(data: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((value, part) => value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined, data);
}
describe('Tour and chrome English interpolation contract', () => {
  it('supplies every English placeholder in literal t(key, options) calls', () => {
    const resources = Object.fromEntries(readdirSync('public/locales/en').filter(name => name.endsWith('.json')).map(name => [name.slice(0, -5), JSON.parse(readFileSync(join('public/locales/en', name), 'utf8'))]));
    const mismatches: string[] = [];
    let inspected = 0;
    for (const file of [...files('src/features/tourhub'), ...files('src/features/chrome-v2')]) {
      const source = readFileSync(file, 'utf8');
      const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const defaultNs = source.match(/useTranslation\(['"]([^'"]+)['"]\)/)?.[1] ?? 'translation';
      function visit(node: ts.Node) {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
          const options = node.arguments.find((arg, index) => index > 0 && ts.isObjectLiteralExpression(arg));
          if (options && ts.isObjectLiteralExpression(options)) {
            const supplied = new Set(options.properties.filter(prop => ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)).map(prop => prop.name.getText(tree).replace(/^['"]|['"]$/g, '')));
            const nsProp = options.properties.find(prop => ts.isPropertyAssignment(prop) && prop.name.getText(tree) === 'ns');
            const namespace = nsProp && ts.isPropertyAssignment(nsProp) && ts.isStringLiteral(nsProp.initializer) ? nsProp.initializer.text : defaultNs;
            const key = node.arguments[0].text;
            const [ns, localKey] = key.includes(':') ? key.split(':', 2) : [namespace, key];
            const value = lookup(resources[ns], localKey);
            if (typeof value === 'string') {
              inspected++;
              for (const match of value.matchAll(/\{\{\s*-?\s*([\w.]+)(?:,[^}]*)?\s*\}\}/g)) {
                if (!supplied.has(match[1].split('.')[0]) && !options.properties.some(ts.isSpreadAssignment)) {
                  const line = tree.getLineAndCharacterOfPosition(node.getStart()).line + 1;
                  mismatches.push(`${file}:${line} ${key}: missing ${match[1]}`);
                }
              }
            }
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(tree);
    }
    expect(inspected).toBeGreaterThan(100);
    expect(mismatches).toEqual([]);
  });
});