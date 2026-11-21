# Tour-pro profile fixes — stopped verification

## Result
The three requested changes are implemented, but verification stopped at the first unexpected test failures. No failing tests were repaired or rerun. Four full-suite shards and browser captures were not run.

- HeroShell's default-false fallbackCover renders existing FallbackCover then PhotoBandFade when there is no working cover; layer/insets/padding/minHeight remain unchanged.
- ProProfileBuildOne opts in to fallback artwork and compactCounterLabels only for four counters. Counter selection and figures remain unchanged.
- The pro owner menu now has Copy link with Link2, separator, Settings with the existing destination, and conditional separator/Switch to business with the existing first-business slug-or-ID destination. Visitor menu content is preserved.
- No SQL, migrations, feed_config, round_pool_cap changes, or deployments.

## Files changed (current line numbers)
- `src/components/profile/hero/HeroShell.tsx:10–12,17,98–99,145,244–246,269–270,331–349,439`: local opt-in ownership note, existing fallback import, default-false props, fallback layer and compact label forwarding.
- `src/features/pro-profile/ProProfileBuildOne.tsx:8,47–48`: preserve the original counter expression in a typed variable; opt in to artwork and four-counter tracking.
- `src/pages/ProfilePageV2.tsx:1035–1048`: scoped pro owner-menu actions; personal and visitor menu actions unchanged.
- `src/test/profileCoverFallback.test.tsx:94–95,377–402`: four added cases.
- `src/test/proProfileBuildOneB.test.tsx:49–55`: four added cases.
- `src/test/proProfileOwnerMenu.test.tsx:1–125`: new page test fixture and four cases, using real router/query/menu providers; only the pro hero is stubbed to expose its page-owned menu.
- `roadmap.md:3–6`: stopped task and outstanding verification.
- `.lovable/reports/tour-pro-fixes/report.md`: this report; `focused.log`: complete test output.

## Test command and outcomes
`bunx vitest run src/test/profileCoverFallback.test.tsx src/test/proProfileBuildOneB.test.tsx src/test/proProfileOwnerMenu.test.tsx`

**76 executed: 70 passed, 6 failed across 3 files (1 passed, 2 failed).** All 64 existing cases in this filtered run passed unchanged; 6 of the 12 new cases passed.

| Requested full-suite command | Status |
| --- | --- |
| `bunx vitest run --shard=1/4` | Not run: stop rule |
| `bunx vitest run --shard=2/4` | Not run: stop rule |
| `bunx vitest run --shard=3/4` | Not run: stop rule |
| `bunx vitest run --shard=4/4` | Not run: stop rule |

## Failures — exact runner messages
1. `src/test/proProfileBuildOneB.test.tsx:53:269`, **four counter labels use compact tracking**: `AssertionError: expected …(5) to have a length of 4 but got 5`.
2. `src/test/proProfileBuildOneB.test.tsx:54:237`, **two counter labels keep default tracking**: `AssertionError: expected …(3) to have a length of 2 but got 3`.
3. `src/test/proProfileOwnerMenu.test.tsx:95`, **owner business none keeps ordered account actions and no moderation**: `TestingLibraryElementError: Unable to find role="menuitem"`.
4. `src/test/proProfileOwnerMenu.test.tsx:95`, **owner business slug keeps ordered account actions and no moderation**: `TestingLibraryElementError: Unable to find role="menuitem"`.
5. `src/test/proProfileOwnerMenu.test.tsx:95`, **owner business id keeps ordered account actions and no moderation**: `TestingLibraryElementError: Unable to find role="menuitem"`.
6. `src/test/proProfileOwnerMenu.test.tsx:118:25`, **visitor keeps Copy link Report and Block without owner actions**: `TestingLibraryElementError: Unable to find role="menuitem"`.

The counter selector includes an extra non-counter node. The menu test output shows the trigger remains `data-state="closed"` after its pointer event. Neither fixture was changed after the failures. A ruling is needed before correcting these new test selectors/interactions and resuming verification.

## New tests by name (12)

### profileCoverFallback.test.tsx
- shows fallback artwork and fade without a cover when opted in
- shows fallback artwork after an opted-in cover fails
- preserves the no-cover shell without the opt-in
- preserves the Tour overview skeleton without fallback artwork

### proProfileBuildOneB.test.tsx
- a null cover renders fallback artwork
- a cover URL renders its image without fallback artwork
- four counter labels use compact tracking
- two counter labels keep default tracking

### proProfileOwnerMenu.test.tsx
- owner business none keeps ordered account actions and no moderation
- owner business slug keeps ordered account actions and no moderation
- owner business id keeps ordered account actions and no moderation
- visitor keeps Copy link Report and Block without owner actions

**Existing tests deleted, renamed or rewritten: none.** Imports were added to the existing fallback test file; all pre-existing case bodies/assertions and mocks were preserved.

## Continuous full-suite accounting
The brief cites the historical **9,399 / 841 files** baseline. The last reported full run is **9,411 / 844 files**, reconciled chronologically as follows:
- +3 in `navTourLiveLabel.test.tsx`: (a) not live shows Tour with the Tour accessible name; (b) live shows Live with Tour, live now and the existing live colour; (c) other tab labels are unchanged in both live states. Total 9,402.
- +5 in `featuredRoundOptionB.test.tsx`: (a) course record kicker and gold gross fourth cell replace AWARDS; (b) birdie-run kicker keeps AWARDS; (c) Home rail keeps Round of the week and its own like/comment row; (d) Home feed carries played-with, the round celebrated line and the shared footer; (e) no element in the featured card uses font-weight 800. Total 9,407.
- +4 in `upcomingLastYearWon.test.tsx`: (a) prior facts and board render the shared chart and three key items for the actual rounds; (b) no prior facts keeps the original list; invalid charts fall back and no prior edition stays absent; (c) PAR 5S and WON AT fill available cells in order while the cap remains four and pars require all 18 holes; (d) points Behind is an em dash for the leader and the formatted difference for other rows. Total 9,411.

This request adds **12 cases / 1 new file**, so expected full-suite inventory is **9,423 / 845 files**. That is an inventory projection, **not a verified passing total**; the latest verified full-suite passing total remains 9,411. No inventory losses.

## Other verification and limitations
- Harness output: `=== build 2026-11-21T10:34:24Z ===` followed by `build OK`.
- 320px browser appearance and menu interaction remain unverified because the test stop halted further verification.
- Authentication status is `external_unmanaged`; authenticated end-to-end checks are unavailable, and no live save/readback is claimed.
- The shared hero still declares the canonical system stack explicitly, contrary to the inheritance-only rule. Left unchanged for the scope of this brief while the separate font question awaits an answer.
