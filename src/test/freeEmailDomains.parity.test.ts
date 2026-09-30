import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { FREE_EMAIL_DOMAINS as CLIENT_DOMAINS } from '@/components/business/verification/signals';
import { FREE_EMAIL_DOMAINS as EDGE_DOMAINS } from '../../supabase/functions/_shared/freeEmailDomains';

/**
 * The edge function cannot import from src/, so the free-mailbox list is
 * deliberately duplicated in two places. This test is the guard that makes
 * the duplication safe — the same job tests/sql/schema_parity_assert.sql does
 * for the fixture against the production column snapshot. If this test
 * fails, someone edited one list without the other; fix by copying the
 * changed entries across BOTH files.
 */
const CLIENT_PATH = 'src/components/business/verification/signals.ts';
const EDGE_PATH = 'supabase/functions/_shared/freeEmailDomains.ts';

/** Domain literals as written in the source file — catches duplicates a Set silently collapses. */
function domainsInSource(path: string): string[] {
  const source = readFileSync(resolve(process.cwd(), path), 'utf8');
  return [...source.matchAll(/'([a-z0-9.-]+\.[a-z]{2,})'/g)].map((m) => m[1]);
}

function diffReport(name: string, onlyIn: string[], missing: string[]): string {
  return [
    `FREE_EMAIL_DOMAINS has drifted between the two mirrored lists.`,
    `Only in ${name}: ${onlyIn.join(', ') || '(none)'}`,
    `Missing from ${name}: ${missing.join(', ') || '(none)'}`,
    `Copy the changed entries across BOTH ${CLIENT_PATH} and ${EDGE_PATH}.`,
  ].join('\n');
}

describe('free email domain list parity', () => {
  it('keeps the client list free of duplicate domains', () => {
    const domains = domainsInSource(CLIENT_PATH);
    const duplicates = domains.filter((d, i) => domains.indexOf(d) !== i);
    expect(duplicates, `Duplicate domains in ${CLIENT_PATH}: ${[...new Set(duplicates)].join(', ')}`).toEqual([]);
  });

  it('keeps the edge-function mirror free of duplicate domains', () => {
    const domains = domainsInSource(EDGE_PATH);
    const duplicates = domains.filter((d, i) => domains.indexOf(d) !== i);
    expect(duplicates, `Duplicate domains in ${EDGE_PATH}: ${[...new Set(duplicates)].join(', ')}`).toEqual([]);
  });

  it('keeps both mirrored lists identical as sets (order must not matter)', () => {
    const client = [...CLIENT_DOMAINS];
    const edge = [...EDGE_DOMAINS];

    const onlyInClient = client.filter((d) => !edge.includes(d));
    const onlyInEdge = edge.filter((d) => !client.includes(d));

    expect(
      { onlyInClient, onlyInEdge },
      diffReport(CLIENT_PATH, onlyInClient, onlyInEdge),
    ).toEqual({ onlyInClient: [], onlyInEdge: [] });
  });
});
