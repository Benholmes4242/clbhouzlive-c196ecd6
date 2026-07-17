#!/usr/bin/env node
/**
 * Canonical i18n literal-string counter.
 *
 * Contract (pinned as of Wave 3e.ii):
 *   - Runs ESLint over `src` (no path filtering beyond that).
 *   - JSON formatter; counts every rule-id === 'i18next/no-literal-string'
 *     message across every file, regardless of severity (warn OR error).
 *   - No ignore-file overrides, no --quiet, no --rule flags: the number
 *     reflects whatever the repo's own .eslintrc says today.
 *
 * Output: a single integer on stdout (the total count). Any diagnostics
 * go to stderr so callers can pipe stdout straight into a report.
 *
 * Rationale: prior waves invoked ESLint with ad-hoc path args and, in
 * some cases, --quiet (which drops warnings). Under the global gate the
 * rule is 'warn' outside opted-in scopes and 'error' inside them, so
 * --quiet silently under-counts. This script removes that variable.
 */
const { spawnSync } = require('child_process');

const res = spawnSync(
  'npx',
  ['--no-install', 'eslint', 'src', '--format', 'json'],
  { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }
);

if (res.error) {
  console.error(res.error.message);
  process.exit(2);
}

const stdout = res.stdout || '';
let results;
try {
  results = JSON.parse(stdout);
} catch (e) {
  console.error('failed to parse eslint json output');
  console.error(stdout.slice(0, 400));
  process.exit(2);
}

let total = 0;
for (const file of results) {
  for (const m of file.messages || []) {
    if (m.ruleId === 'i18next/no-literal-string') total += 1;
  }
}

process.stdout.write(String(total) + '\n');
