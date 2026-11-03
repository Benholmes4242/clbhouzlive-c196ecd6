# Tournament pick follow-up fixes — complete

## Delivered
- Selected row ring moved from inline wrapper to the shared avatar box, 34% radius, 36px wide; YourPickCard ring moved to its 34px avatar box. Existing canonical 1/1.05 aspect ratio and hairline preserved; selection shadow uses sheet-colour 1.5px separation and 3px amber outer edge.
- Repeated chosen-row or followed-tile taps clear local choice and disable submission. Closing preserves server/cache pick and reopening restores it; no deselection RPC.
- Submit and card Pick/Change retain Button but explicitly remove variant/size classes; token-backed inline fill/ink/weight prevent utility overrides. Submit remains 48px, fully rounded, 15px/800; disabled white8%/ink42%; chosen amber/dark ink. Change preserves its existing transparent treatment.
- English and en-XA record continuation now lowercase “from {{count}} picks ›”.
- Shared PicksBlock maps CUT/MC to MC without changing BoardTable/statusWord. Viewer card already mapped CUT correctly; completed coverage added. WD/DQ unchanged; missed cuts remain dim and scoreless.

## Test changes and reconciliation
Before: DEFAULT_B1 **6,455 tests / 575 files**. After: **6,462 / 575**, +7 tests, +0 files.
- `yourPickSheet.test.tsx`:25→28, +3: “tapping a chosen row again clears local selection and disables submission”; “tapping a chosen followed tile again clears selection and disables submission”; “closing after clearing a saved pick preserves server and cached choice on reopening”. Existing cases/assertions unchanged.
- `tournamentPickInsights.test.tsx`:52→56, +4 via CUT/MC/WD/DQ rows of “finished viewer and shared pick cards preserve the canonical %s token”. Existing cases/assertions unchanged.
- `tourOverviewPicksChipsFullBoard.test.tsx`:15→15. Two authorised table-driven cases rewritten: “in live events: token in place of position, no score, no numeral” and completed equivalent. `expect(fig.textContent).toBe(token)` remains unchanged; expected fixture tokens below change under the brief's explicit CUT→MC rule. Every other assertion unchanged. Describe label changes board token→pick token to distinguish unchanged BoardTable.
```diff
-describe('a pick with a non-scoring status shows the board token', () => {
+describe('a pick with a non-scoring status shows the pick token', () => {
- const cases: Array<[string, string]> = [['WD', 'WD'], ['DQ', 'DQ'], ['CUT', 'CUT'], ['MC', 'CUT'], ['MDF', 'MDF'], ['DNS', 'DNS']];
+ const cases: Array<[string, string]> = [['WD', 'WD'], ['DQ', 'DQ'], ['CUT', 'MC'], ['MC', 'MC'], ['MDF', 'MDF'], ['DNS', 'DNS']];
```
No deleted tests; no other renamed/rewritten tests. No translated-copy/style/snapshot tests added: ring/fill/copy verification uses real Chromium rather than fragile jsdom colour checks. Existing real English i18n providers retained.

## Commands/results
Focused: `bunx vitest run src/test/yourPickSheet.test.tsx src/test/tournamentPickInsights.test.tsx src/test/tourOverviewPicksChipsFullBoard.test.tsx --maxWorkers=2`: **99/99**,3 files.
Full: `bunx vitest run --shard=N/4 --maxWorkers=2`, individually N=1–4.

| Shard | Tests passed | Files passed |
|---|---:|---:|
|1|1645|144|
|2|1535|144|
|3|1638|144|
|4|1644|143|
|Total|6462|575|

Zero failures and zero Vitest unhandled errors. Full outputs `/tmp/pick-followup/focused.log`, `shard1.log`–`shard4.log`; no failing shard. No pre-existing failure reproduced; historical stops listed in DEFAULT_B1_REPORT.md remain cleared. Temporary logs disappear after sandbox resets.

## Chromium verification
Real YourPickSheet/YourPickCard bundled in temporary fixture with field/state hook substitution only, real avatars, buttons, English provider and CSS. At1280×1800: selection box36×37.796875 exactly matched inner avatar; card34×35.6875 matched inner avatar; both34% radii and exact 1.5px sheet/3px amber shadows. Chosen submit rgb(247,147,30), text rgb(10,10,12),48px,800 weight; disabled rgba(255,255,255,.08); card Pick amber; Change remains white65%. Row second tap disabled submission. Selected-row and chosen-button screenshots viewed and confirmed. Apparatus retries corrected alias/dependency lookup, automatic JSX and transition-settle waits only; no product changes for the fixture. Not a live signed-in verification: external_unmanaged credentials unavailable. Saved-pick mutation/readback covered through real hook and RPC test fixture, not production.

## Files touched
- `src/features/tourhub/components/overview-v3/HybridHeroBands/YourPickSheet.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/yourPickSheet.css`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/YourPickCard.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock.tsx`
- `public/locales/en/tourhub.json`, `public/locales/en-XA/tourhub.json`
- `src/test/yourPickSheet.test.tsx`, `src/test/tournamentPickInsights.test.tsx`, `src/test/tourOverviewPicksChipsFullBoard.test.tsx`
- `roadmap.md`, `PICK_FOLLOWUP_FIXES_REPORT.md`
- Project memory `mem://features/tourhub/pick-followup-fixes.md`, `mem://index.md`.

No SQL, migrations, migration files, deployed RPCs/edge functions, feed_config, native/Median, news, guest-browsing or round-plot changes; round_pool_cap remains30. No publication. Latest observed automatic build:2026-11-03T21:30:49Z — build OK; no manual project build/typecheck run.
