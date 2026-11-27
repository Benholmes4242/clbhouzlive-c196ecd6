# ANALYTICS_V3_4_SCREENS — HELD

## 1. Files changed, line counts before → after
Against `778d850ee8` (app/test content unchanged from baseline `6ae4885609`):
- `src/features/admin/components/analytics/ScreensLens.tsx`: 111 → 118.
- `src/test/adminAnalyticsV3Screens.test.tsx`: new → 98.
- `roadmap.md`: added the Screens task and marked it held.
- This report is new. No existing test changed, renamed or deleted.

Screens presentation is edited: summary, cached health denominator, wrapping/toggleable area chips, time-per-member rows, neutral unused count, normal-font wrapping routes. It is not accepted as complete.

## 2. Suite totals and failures
Verified baseline on `6ae4885609`: four sequential `npx vitest run --maxWorkers=2 --shard=N/4` commands passed **10,791 tests / 953 files, zero failures**. The baseline report is `.lovable/reports/analytics-v3-3-journeys/baseline.md`. There are no pre-existing failures to carry.

After this edit, the focused command was:
`npx vitest run --maxWorkers=2 src/test/adminAnalyticsV3Screens.test.tsx src/features/admin/components/analytics/analytics.test.tsx src/test/fixOverflowSource.test.ts`

Result: **29 tests executed: 28 passed, 1 failed; 2 files passed, 1 file failed**. Both existing test files passed untouched. The six new cases produced five passes and one failure.

Full-suite shards were **not started** after the new failure. There is no verified after-edit full-suite total. The added file contains six new tests, so the intended inventory delta is +6 tests/+1 file, entirely named in section 3; this is not a claim that a 10,797/954 full run passed.

Exact failure:
```text
FAIL src/test/adminAnalyticsV3Screens.test.tsx > ANALYTICS_V3_4_SCREENS > (c) area chips wrap without horizontal scrolling and active-chip taps return to All
AssertionError: expected undefined to be '' // Object.is equality

- Expected:
""
+ Received:
undefined

❯ src/test/adminAnalyticsV3Screens.test.tsx:68:40
68| expect(chips.style.scrollbarWidth).toBe('');
```

The property access returned undefined in this test environment. No repair or rerun was made after the failure.

The platform typecheck at the initial stop reported:
```text
src/test/adminAnalyticsV3Screens.test.tsx(64,61): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
src/test/adminAnalyticsV3Screens.test.tsx(73,54): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
```

These were new errors in the new test, not pre-existing failures. Work initially stopped without repairs. The subsequent instruction to fix typecheck errors authorized removal of the two unsupported `exact: true` role-query options only. The failing scrollbar assertion remains unchanged; no tests were rerun.

After the type-only repair, the platform entry at `2026-11-27T21:35:55Z` reported `build OK`. Test inventory is unchanged at six new cases; no after-edit full-suite run has been performed.

## 3. New tests, named
All in `src/test/adminAnalyticsV3Screens.test.tsx`:
- `(a) 30,360 seconds and 62 members shows 8m each; zero members omits each` — passed.
- `(b) Views uses health mau and shows an em dash for null, zero or loading` — passed.
- `(c) area chips wrap without horizontal scrolling and active-chip taps return to All` — failed before the click assertions ran.
- `(d) Unused and Nobody opened count use neutral ink, not amber` — passed.
- `(e) routes inherit the normal font and permit wrapping` — passed.
- `(f) source scan: no heavy or tiny type, amber, ellipsis, horizontal scrolling or monospace` — passed.

Updated new case `(c) area chips wrap without horizontal scrolling and active-chip taps return to All` under the later typecheck-fix instruction: removed the unsupported `exact: true` options at lines 64 and 73. Its assertions are unchanged, including `expect(feed).toHaveAttribute('aria-pressed', 'true')` and `expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')`. The role names remain `Feed` and `All`; Testing Library string names match exactly by default. No existing test changed, renamed or deleted; case count remains six.

Still requested, not applied: change the extra scrollbar assertion from direct `.scrollbarWidth` access to `.getPropertyValue('scrollbar-width')`, preserving the expected empty CSS declaration. This would verify the same absence rule through the CSS declaration API instead of an unsupported property accessor.

## 4. Source-scan patterns and hit counts
In `ScreensLens.tsx`:
- Numeric `fontWeight` > 700: 0.
- Numeric `fontSize` < 10: 0.
- `t.warnText`: 0.
- `t.brand`: 0.
- `textOverflow: 'ellipsis'`: 0.
- `overflowX: 'auto'`: 0.
- `monospace`: 0.

The unchanged cross-app overflow test passed. The lens uses only the existing Screens and Health(30) hooks; no hook or query implementation was edited.

## 5. Members-only / staff evidence
`useAnalyticsLenses.ts` says staff handling is the RPCs' job. `useAnalyticsScreens()` calls `get_admin_analytics_screens` with `{ p_days: 30 }`; the mapper does no client staff filtering. A repository search found no SQL definition of that RPC, so its actual staff exclusion cannot be confirmed from this codebase. Nothing found establishes that it includes staff either. No SQL or live query was run.

Health(30) retains the existing query key `['admin-v2', 'analytics', 'health', 30]`. The new lens uses that same hook/key; no new request kind was introduced. Live request/cache behaviour was not browser-verified.

## 6. Screenshots
None. Authenticated admin-route access and 390/320 captures were not attempted after the stop. Mock match, long-name wrapping and 320px horizontal overflow remain visually unverified. This report does not claim that authenticated access was tested or found inaccessible.

## 7. Brief findings and remaining work
No conflict found between the scoped Screens brief and its mock. Mock-only illustrative rows/chips/counts were not hardcoded. The frozen `dur` and date helpers and paging rules remain unchanged. The brief names `analytics.test.tsx`; its actual repository location is `src/features/admin/components/analytics/analytics.test.tsx`, and it passed untouched.

The current test blocker is agent-authored, not an error in the brief. The type-only repair was applied under the subsequent instruction; the scrollbar assertion repair still needs authorization. Focused tests, four sequential full-suite shards, authenticated captures (if reachable), and the final report remain outstanding. Journeys still waits for its written brief.

No guest browsing, review wizard, news, round plots, SQL, migrations, migration files, deployed RPCs or edge functions, feed_config, round_pool_cap, native/Median configuration, or security Fix all changes.