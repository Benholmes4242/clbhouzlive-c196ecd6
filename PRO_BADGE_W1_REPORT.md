# PRO badge W1

## Summary
Applied the signed-off static pearl plate, top highlight and island-ratio corners through CSS only. PRO copy, dimensions, callers and non-pro verified ticks are unchanged. No shimmer or animation was added. All four fresh shards passed; authenticated 320px checks remain unverified.

## Files changed
- `src/index.css`: exact four-stop `--pro-label-plate` and `--pro-label-edge`; unchanged `--pro-label-ink: #0A0A0C`. Removed unused `--pro-label-ground` after confirming its only two consumers now use the plate.
- `src/features/pro-verification/pro-label.css`: normal7px/small5.5px corners, plate/edge,0.14em tracking, centre alignment and hidden overflow; existing dimensions retained.
- `src/features/pro-verification/pro-status-controls.css`: island7.5px corners/plate/edge/0.14em; pending tag radius alone changed to7px.
- `src/features/pro-profile/pro-profile.css`: removed only the unused `.pro-ss-nm .pro-label[data-size]` rule. No current source renders `.pro-ss-nm`; hero badge1px nudge retained.
- `src/test/proBadgeW1.test.ts`: five new source-text cases using `readFileSync`, never raw imports.
- `roadmap.md`: W1 task tracking.
- Project memory: signed-off W1 styling requirements recorded.
- `PRO_BADGE_W1_REPORT.md`: this report.

`ProLabel.tsx`, `ProMemberName`, `ProOrVerifiedMark` and all callers are untouched. No SQL, migrations, server/deployed function changes, feed_config, round_pool_cap or native/Median changes.

## Test ledger
Existing assertions updated: **none**. No tests deleted, renamed or rewritten, so no old/new assertion substitutions.

New `src/test/proBadgeW1.test.ts`: **5 cases**:
1. Centred static pearl plate,7px corners and unchanged normal dimensions.
2. Small dimensions with5.5px corners.
3. Island7.5px corners, plate/edge and unchanged dimensions; no999px radius.
4. Pending7px corners; no badge pill radius or motion declarations.
5. Exact four gradient stops, highlight, ink and retained hero nudge.

Baseline latest PF3C run:1973+1810+1942+1877=**7602 tests**. Final W1: **7607 tests/664 files**, delta **+5 tests/+1 file**, entirely from `proBadgeW1.test.ts`. Compared with last PF3B report7538/660, the intervening PF3C run added64 tests; W1 itself adds only five. Shard redistribution is runner assignment, not deletion.

Focused command: `bunx vitest run src/test/proBadgeW1.test.ts src/test/islandProBadge.test.tsx src/test/proVerification2.test.tsx src/test/proStatusControls.test.tsx --maxWorkers=2`:43/43 across3 matched files; the islandProBadge filename matched no test file and is not counted as executed coverage.

Each full shard ran as its own command:

| Command | Tests passed | Files passed |
|---|---:|---:|
| `bunx vitest run --maxWorkers=2 --shard=1/4` |1975|166|
| `bunx vitest run --maxWorkers=2 --shard=2/4` |1810|166|
| `bunx vitest run --maxWorkers=2 --shard=3/4` |1941|166|
| `bunx vitest run --maxWorkers=2 --shard=4/4` |1881|166|
| **Total** |**7607**|**664**|

Zero failures. Permitted known `fw1FeaturedDeck` “reserves no right padding on the meta line” did not recur. Logs retained under `/tmp/pro-badge-w1/`. Latest preview build log: `build OK`,2026-11-07T18:29:50Z.

## Five 320px checks
Browser viewport320×844. Managed browser auth status is `external_unmanaged`: authenticated end-to-end checks are unavailable, and no session was minted or guest enabled.

| Requested surface | Result |
|---|---|
| Mason profile hero name row | **Unverified**: profile entry redirected to `/auth`; no rendered PRO badge. |
| Feed post header | **Unverified**: no authenticated feed session available. |
| Followers list row | **Unverified**: no authenticated member-list session available. |
| Own pro top island | **Unverified**: signed-out profile displayed authentication, not the own pro island. |
| Settings handicap card | **Unverified**: attempted `/settings` was not the Settings destination and showed404; no handicap card/badge was rendered. |

Screenshots of the actual attempted profile and Settings URLs were reviewed. They are access evidence only, not badge-layout proof. All five real-device checks remain for Ben; no claim is made that wrapping, clipping or name displacement was visually verified. Source tests confirm nowrap/flex:none and retained badge heights/padding; these do not replace real 320px surface checks.