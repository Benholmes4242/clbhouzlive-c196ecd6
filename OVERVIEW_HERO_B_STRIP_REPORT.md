# Tour Overview: tour line, leader B, board spacing and members strip

## Summary and stop
Implemented the requested presentation only. Ben resolved both mock conflicts in favour of the brief: movers bottom **10px** plus board top **0px**, and white position beside independently coloured score. Other photo content, countdown/spine, YourPickCard conditions, picks/sheets and server reads remain unchanged.

Focused tests passed **67/67**. Fresh shard1 stopped on an unexpected existing assertion:

```text
FAIL src/test/tourPlayoffShortenedEvents.test.tsx > hero chip > a standard result still reads RESULTS
AssertionError: expected 'FINALButterfield Bermuda Championship' to contain 'RESULTS'
Expected: "RESULTS"
Received: "FINALButterfield Bermuda Championship"
src/test/tourPlayoffShortenedEvents.test.tsx:89:35
```

This assertion pins the old result pill wording, while the new brief requires FINAL. It was discovered only in the completed shard run and is left untouched under the stop rule. No skip, deletion, subsequent repair or further shard run occurred. The only allowed-known FW1 meta-line failure did not occur in shard1. The previous tight-chips Needs assertion remains untouched and cannot be treated as allowed-known here.

## Files changed
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx`: joined tour/state kicker, removed pill/separate kicker, 4px title-row seam and zero h1 top margin; leader24px faces/21px score/5px face-bottom/-8px overlap/4px caps margin.
- `src/features/tourhub/tournament-v2/sections/MiniBoard.tsx`: hero-only optional `afterMovers`, default false; panel/light/tournament branches unchanged.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`: passes the exact movement condition and changes only movers bottom padding.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock.tsx`: passes existing board snapshot to member bands.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PickMemberBands.tsx`: replaces only locked/no-own-pick/most-picked door; up to three faces in public board order, canonical headshot resolver, live board snapshot, tie counts and singular/plural, two unchanged board-open actions. Local header records snapshot ownership.
- `public/locales/en/tourhub.json`: new strip strings/plurals and overview round/final-round keys. Existing state keys and casing preserved; uppercase kicker styling supplies display casing.
- `src/index.css`: semantic locked-line and face-ring tokens.
- `src/test/overviewHeroBStrip.test.tsx`:16 new cases.
- `src/test/tourOverviewMergedAiry.test.tsx`, `src/test/pickSheetV2.test.tsx`: only authorised obsolete expectations/selectors below.
- `roadmap.md`; project memory records exact signed-off presentation and Ben's conflict rulings. No AGENTS rules altered; local ownership is in the member-band header.

## Existing assertion ledger
No test deleted or renamed. No other existing assertions changed.

1. `tourOverviewMergedAiry.test.tsx`, **tightens movers and their figure gap**:
   - Old `expect(movement?.style.padding).toBe('12px 20px')`.
   - New `expect(movement?.style.padding).toBe('12px 20px 10px')`.
   - Reason: exact requested bottom-padding change; all remaining assertions retained.
2. `pickSheetV2.test.tsx`, **locked no-pick members door opens read-only board**:
   - Old presence assertion/target `[data-members-picks-door]`.
   - New presence assertion/target `[data-members-picks-tile]`.
   - Reason: the brief replaces the old door with this tile; `expect(open).toHaveBeenCalledWith('board')` retained. Case name unchanged.

## New test counts and commands
`overviewHeroBStrip.test.tsx` adds **16** cases: seven lifecycle/empty-tour kicker cases, leader geometry, two board-spacing opt-ins, movers bottom padding, strip counts/actions, three-face cap, singular/missing-board entry, own-pick exclusion, and caller-integrated render/spacing. Uses real i18n/provider, not a translation mock. No existing test count changes.

```text
OVERVIEW_B_BROWSER=1 bunx vitest run src/test/overviewHeroBStrip.test.tsx src/test/pickSheetV2.test.tsx src/test/tourOverviewMergedAiry.test.tsx src/test/tourOverviewPicksChipsFullBoard.test.tsx --maxWorkers=2
67 passed /4 files:16+19+16+16

bunx vitest run --maxWorkers=2 --shard=1/4
1986 passed +1 failed =1987 executed /167 files (166 passed+1 failed)
shard2: not run, unexpected failure stop
shard3: not run, unexpected failure stop
shard4: not run, unexpected failure stop
```

Full suite has not passed or been fully executed. Last reported reconciled scope **7632 tests/667 files** (last green7607/664 +tight chips3/1 +photo grid22/2); this task adds16/1, giving expected **7648/668**. This is an expectation, not a runner-verified full inventory. Logs: `/tmp/overview-b/focused.log`, `/tmp/overview-b/shard1.log`.

## 320px checks
Mounted actual production components through the test's real React/i18n/query/router providers, emitted their DOM into Chromium at320×844 with actual global styles, without signing in, minting a guest or calling hosted reads. This is a component-render check, not live account end-to-end verification. Final page width320: no horizontal overflow.

- **Live hero:**340px high, kicker x20–300, Full board retained. Long tour kicker client179px/scroll369px, CSS ellipsis occurs before button; three-line long event title contained.
- **Upcoming hero:**340px high; kicker client179px/scroll270px with ellipsis before Full board. Existing countdown tile fits. Test fixture intentionally retains same long title/venue to stress layout, rather than claiming live Champions event data.
- **Board seam:** measured movers bottom10px and board top0px. Chip bottom to header box top is10px (not16px); the header's own2px padding/min-height is unchanged. This follows Ben's explicit10+0 ruling, despite the original16px description/mock geometry.
- **Members strip:**x20–300,width280,height127.25px; tile280×58.75px; footer wraps its left locked sentence and preserves right action. No overflow. Long surname client188px/scroll317px confirms ellipsis; default Griffin snapshot displays white T22 and canonical red−11.
- **Avatar limitation:** jsdom's emitted DOM reserves avatar geometry but does not capture avatar effects/loaded photos; these static screenshots do not prove face images or loading. Mounted source/DOM assertions prove requested size props/geometry. Actual loaded member/player faces and tie overlap need Ben's live-device check.

Evidence `/tmp/browser/overview-b/results.json`, `live.png`, `upcoming.png`, `movers.png`, `strip.png`, `strip-long.png`. Browser verifier also confirms no width overflow on the long-name variant.

## Left for Ben
Live account/member face loading and ordering, real tournament data and both entrypoints opening the existing board sheet; native notch/countdown/play state remain unverified. Full-suite close-out is blocked by the exact RESULTS assertion above. No SQL, migration/files, RPC/edge deployment, feed_config, round_pool_cap, native/Median, guest browsing, review wizard, news or round-plot changes.