// Source filenames must remain portable across case-sensitive and case-insensitive filesystems.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it('has no source file paths that differ only by letter case', () => {
  const pathsByCase = new Map<string, string[]>();
  function walk(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(path);
      } else if (entry.isFile()) {
        const key = path.toLowerCase();
        const paths = pathsByCase.get(key) ?? [];
        paths.push(path);
        pathsByCase.set(key, paths);
      }
    }
  }
  walk('src');
  const clashes = [...pathsByCase.values()].filter(paths => paths.length > 1);
  expect(clashes, `Case-only source path clashes:\n${clashes.map(paths => paths.join(' <-> ')).join('\n')}`).toEqual([]);
});