# NAV SQ1 — completed

## Scope and exact product diff
Only `src/components/GlobalBottomNavigation.tsx` product code changed:
```diff
-import { r } from '@/lib/radius';
-                borderRadius: r.xl,
+                // NAV_SQ1: local squircle geometry; shared radius canon is frozen.
+                borderRadius: 20,
-                            borderRadius: r.md,
+                            borderRadius: 16,
-                          borderRadius: r.md,
+                          borderRadius: 16,
```
Both normal and centre-action button branches use the local16px tile radius; this affects their painted active background, not their icons/labels/content. Bar radius20px applies expanded and condensed. Shared `src/lib/radius.ts` is untouched (xl24px/md14px and all other values unchanged).

Widths, height, padding, fill/hairline/shadow, fold state/transition, labels/icons, POST/REVIEW centre mark, badges and visibility logic are unchanged. Guest browsing, review wizard, news, round plots, SQL/migrations, deployed RPCs/edge functions, feed_config and native/Median configuration untouched; round_pool_cap remains30.

## Tests and inventory
Before: GI1 latest green6,295 tests/563 files. After:6,298 tests/564 files (+3/+1), all passing.
New `src/test/navSq1.test.tsx` has exactly3 cases:
1. `pill computed radius stays20px expanded and condensed` — computed20px in both states; asserts existing396px/324px max-width expressions so the condensed check cannot pass on an expanded bar.
2. `selected tab tile computed radius is16px` — selected Home aria-current,page; computed16px; existing46px item height.
3. `shared radius tokens remain unchanged` — exact full radius object, including xl24px and md14px.

No existing tests deleted, renamed or rewritten. Read-only search found no nav24px/selected14px protecting assertions requiring the brief's authorized updates. Existing24px references in islandsNav concern a scroll threshold, not radius, and remain unchanged.

Focused command:
`bunx vitest run src/test/navSq1.test.tsx src/test/roundsGateNav.test.tsx --maxWorkers=2`
Result9/9 across2 files (new3 plus existing6), no failures/unhandled errors; `/tmp/navsq1/focused.log`.

Full commands: `bunx vitest run --maxWorkers=2 --shard=N/4`, N=1,2,3,4, run sequentially in two bounded batches.

|Shard|Passed tests|Failed|Passed files|
|---|---:|---:|---:|
|1|1594|0|141|
|2|1523|0|141|
|3|1554|0|141|
|4|1627|0|141|
|Total|6298|0|564|

Zero Vitest unhandled errors. No pre-existing failing test observed against the latest green baseline. Existing act/jsdom CSS parsing/Browserslist warnings are not failing tests or Vitest unhandled errors. All complete outputs retained `/tmp/navsq1/shard1.log` through`shard4.log`; no failing shard occurred.

## Real-browser evidence
Fresh Chromium on real signed-out`/`,390×844,`--sat:47px`, actual Virtuoso feed scroll500 drives registered nav store; no fixtures/auth/session changes.
- Expanded: bar368×60px, radius20px; selected Home tile radius16px,height46px.
- Condensed: bar324×60px, radius20px; selected Home tile radius16px,height46px.
- Both states unchanged padding6px 7px, computed fill`rgba(22,22,26,0.62)`,1px10% white hairline, original inset/drop shadow,220ms max-width/padding transition.
- No page errors; final URL`http://localhost:8080/`.
- Screenshots visually inspected: `/tmp/browser/navsq1/expanded-nav.png`, `condensed-nav.png`; whole viewport captures also saved `expanded.png`/`condensed.png`. Script/output`check_nav.py`/`result.log`.
- Uploaded`nav-squircle-2.html` is the signed-off optionB. Its58px total bar height, simplified placeholder glyphs, fill/shadow/background differ from the frozen build; the actual60px total (46px items+12px padding+2px border), real icons/centre mark and glass remain unchanged per §3. Only changed geometry is adopted.

## Build
Latest automatic result `=== build 2026-11-03T17:18:35Z ===` / `build OK`; no surviving diagnostics. No manual project build/typecheck, per environment rules.

## Every touched file
- Product: `src/components/GlobalBottomNavigation.tsx`.
- Tests: new`src/test/navSq1.test.tsx`.
- Documentation: new`NAV_SQ1_REPORT.md`, `roadmap.md`.
- Memory: new`mem://style/navigation/nav-sq1.md`, `mem://index.md`.
- Temporary browser/test scripts and outputs only under`/tmp/browser/navsq1` and`/tmp/navsq1`.