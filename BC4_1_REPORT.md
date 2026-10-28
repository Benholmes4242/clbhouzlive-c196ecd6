# BC4.1 — Complete BC4's test fixture

## One-line diff

Only `src/test/bc4BusinessCreate.test.tsx:44` changed in the test file:

```diff
-    expect(draftHeroIdentity(fixture({ category: 'Golf Club', selectedClub: { id: 'club', name: 'Park', country: 'United Kingdom', sub_country: 'Kent', region: 'South East' } })).line).toBe('Golf Club · Kent');
+    expect(draftHeroIdentity(fixture({ category: 'Golf Club', selectedClub: { id: 'club', name: 'Park', country: 'United Kingdom', sub_country: 'Kent', region: 'South East', club_key: 'park', latitude: 51.4, longitude: 0.03 } })).line).toBe('Golf Club · Kent');
```

Assertion unchanged: `.line).toBe('Golf Club · Kent')`. No other fixture, assertion, test name or application code changed. No tests added, deleted, renamed or rewritten. The three authorised values complete the existing SelectedClub fixture.

## Verification

- Automatic type/build check: **passed**, diagnostic `build OK` at `2026-10-28T18:58:39Z`. No manual project typecheck/build was run because the environment requires the automatic check.
- Full command: `bunx vitest run` — **4,082 passed / 4,082 executed across 434 passing files**. Run started 18:58:44 UTC; duration 324.92 seconds.
- Before → after: **4,082 → 4,082 tests; 434 → 434 files**. Zero inventory delta.
- Pre-existing failure: BC4's TS2739 at line 44 (missing `club_key`, `latitude`, `longitude`) is now cleared. No pre-existing test failure remained at the preceding BC4 baseline. The earlier welcome upload-spy failure had already passed unchanged in BC4; no correction to it was made here.
- No new failures. Runtime log: `/tmp/bc41/full-suite.log`.

No SQL, migrations, migration files, deployed RPC/edge edits, feed_config changes, cap changes or native/Median changes. `round_pool_cap` remains 30.

Documentation-only changes: `roadmap.md` marks the authorised stop resolved; this report records the diff and results.