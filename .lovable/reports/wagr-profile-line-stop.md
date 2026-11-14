# WAGR profile ranking line — stop report

## Status
Implemented the requested profile ranking line; stopped on an unexpected focused-test failure. No test repair or further verification was attempted after the failure. Four app shards were not run.

## Files
- `src/components/profile/hero/ProfileHero.tsx`: shared server-gated amateur summary/history reads; rank and weekly movement; independent ranking line when handicap/index is absent. Existing fonts preserved; no new font-family declaration.
- `src/components/profile/hero/HeroHandicapDisplay.tsx`: optional afterIndex slot before verdict; suppressed in example mode.
- `src/pages/ProfilePageV2.tsx`: Ranking callback sets ?tab=ranking and scrolls the tab bar into view.
- `src/test/wagrProfileLine.test.tsx`: 12 new cases.
- `src/test/wagrProfileLinePage.test.tsx`: 1 new page navigation case.
- `roadmap.md`: tracked request and stop.

## Authorised mock-only additions
Added the complete amateur read-hook mock, returning a null summary and empty successful history/events/career, to these existing standalone hero tests; no assertions changed:
- `src/test/heroConnectPanel.test.tsx`
- `src/test/heroConnectExample.test.tsx`
- `src/test/proVerification2Hero.test.tsx`
- `src/test/linkedHandicapProfile.test.tsx`
- `src/test/profileBioFull.test.tsx`
- `src/test/removeBadges1.test.tsx`

No existing test was deleted, renamed or rewritten.

## Counts and command
Last reported full passing baseline: **8,714**. Added 13 cases (12 + 1 in the two new files), giving expected inventory **8,727**; full-suite execution remains unverified.

```text
bunx vitest run src/test/wagrProfileLine.test.tsx src/test/wagrProfileLinePage.test.tsx src/test/heroConnectPanel.test.tsx src/test/heroConnectExample.test.tsx src/test/proVerification2Hero.test.tsx src/test/linkedHandicapProfile.test.tsx src/test/profileBioFull.test.tsx src/test/removeBadges1.test.tsx --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-profile-line/focused.json
```

Focused: **54 executed / 53 passed / 1 failed**. Existing profile cases passed unchanged. The page navigation test passed; the new example-mode test failed before its assertions because the test lacks a QueryClientProvider for HeroConnectExample's useDeclineHandicapChip.

Four shard totals: **not run (stop rule)**.

## Exact failure

`/dev-server/src/test/wagrProfileLine.test.tsx` — **WAGR profile ranking line does not add ranking to the example mode**

```text
Error: No QueryClient set, use QueryClientProvider to set one
    at Module.useQueryClient (file:///dev-server/node_modules/@tanstack/react-query/src/QueryClientProvider.tsx:18:11)
    at Module.useDeclineHandicapChip (/dev-server/src/lib/whs/useDeclineHandicapChip.ts:15:23)
    at HeroConnectExample (/dev-server/src/components/profile/hero/HeroConnectExample.tsx:40:19)
    at renderWithHooks (/dev-server/node_modules/react-dom/cjs/react-dom.development.js:15486:18)
    at mountIndeterminateComponent (/dev-server/node_modules/react-dom/cjs/react-dom.development.js:20103:13)
    at beginWork (/dev-server/node_modules/react-dom/cjs/react-dom.development.js:21626:16)
    at beginWork$1 (/dev-server/node_modules/react-dom/cjs/react-dom.development.js:27465:14)
    at performUnitOfWork (/dev-server/node_modules/react-dom/cjs/react-dom.development.js:26599:12)
    at workLoopSync (/dev-server/node_modules/react-dom/cjs/react-dom.development.js:26505:5)
    at renderRootSync (/dev-server/node_modules/react-dom/cjs/react-dom.development.js:26473:7)
```

## Remaining verification and frozen mock differences
390/320 visual comparison and real-member authenticated flow were not performed before the stop. No visual parity claim is made. The mock's surrounding home-club subline/name/chart/handicap examples are frozen by this brief: the existing profile remains unchanged (including its existing amber club kicker and existing divider); no new divider was added. The existing profile fonts remain untouched as previously instructed.

Preview log: build OK at 2026-11-14T15:13:18Z. `git diff --check` passed. No SQL, migrations, feed_config changes, sync invocation, or schema changes.
