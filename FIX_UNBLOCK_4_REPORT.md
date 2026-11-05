# FIX_UNBLOCK_4 — suite green; device checks with Ben

## Combined close-out — suite green; device checks with Ben

Accepted by Ben on 2026-11-05 on the test evidence, covering **FIX_TOUR_NOTIF_1, FIX_LIVE_DOT_1, FIX_UNBLOCK_1–4**, and their Pro status controls dependencies. Tour digest trophy/meta and client overview navigation are delivered; the Tour hub retains its always-burger header. News label fit handling and live-dot fold-column halo clearance are implemented. Authorised fixture repairs, island-only profile readiness and Settings pro-only readiness are covered by the passing suite.

All four shards were run fresh, in order, using `bunx vitest run --maxWorkers=2 --shard=n/4`: **1,753 / 1,653 / 1,750 / 1,723 = 6,879 tests / 608 files, zero failures**. Before/after inventory is unchanged; focused checks passed **36/36 + 67/67**. Latest recorded harness build: **OK, 2026-11-05T13:27:02Z**. Full current and historical test output remains under `docs/verification/`; no tests, fixtures or product source changed during this close-out.

The headless preview's `application/json` module MIME error and `ERR_INSUFFICIENT_RESOURCES` are accepted as **sandbox environment faults, not product faults**. Signed-in checks are unavailable in this sandbox. Browser verification is not claimed; **Ben owns the four device checks**:

1. Live-dot geometry at 424×970, 1×: label x61/y19.25, 60.84375×15; caption x71/y38.25, 32.109375×8.5; island x13/y10, 142.84375×46, within 0.5px. Halo visible on all sides expanded; no dot/halo sliver condensed.
2. Tour News at 320px: no bar title or overlap. Amateur News title hidden, not clipped, at 320px and shown fully at 430px.
3. Signed-in Activity digest opens the top of Tour overview with the burger; browser back returns to Activity.
4. Cold-load island for a non-pro member and Mason's verified PRO cell, with no additional blank flash.

The five superseded STOP reports are deleted by explicit authorisation: FIX_TOUR_NOTIF_1_REPORT.md, FIX_LIVE_DOT_1_REPORT.md, FIX_UNBLOCK_1_REPORT.md, FIX_UNBLOCK_2_REPORT.md and FIX_UNBLOCK_3_REPORT.md. PRO_STATUS_CONTROLS_REPORT.md was already deleted under the preceding instruction. No SQL, migrations or edge-function edits.

## Scope

The four known files already contain the authorised settled non-pro `useMyProStatus` fixture including `verifiedKnown: true`, added in the immediately preceding continuation. No new test or product changes are needed initially. Existing assertions, names and case counts remain unchanged. Expected suite: 6,879 tests / 608 files.

## Checks

- Focused known-four: 36/36 across 4 files; dependency checks: 67/67 across 5 files. Commands: `bunx vitest run <requested files> --maxWorkers=2`. Complete output in docs/verification/fix-unblock-4/focused-four.log and focused-chain.log.
- All four shards freshly run in order using `bunx vitest run --maxWorkers=2 --shard=n/4`: 1,753 / 1,653 / 1,750 / 1,723, each 152 files. Total 6,879 / 608, zero failures, baseline unchanged. Full output in docs/verification/fix-unblock-4/shard1.log through shard4.log. No flakes or further fixture repairs occurred.
- Browser at 424x970/dpr1 on /tourhub and 320/430 News could not start the app. Screenshots viewed: /tmp/browser/fix-unblock-4/tour.png and amateur-news-320.png show the startup failure, not the requested surfaces. All four browser checks remain unverified.
- Signed-in Activity/back and non-pro/Mason cold islands additionally lack managed session access: environment reports `external_unmanaged`. No credentials requested and no substitute demo account/data used.

## Historical sandbox startup diagnostics

Browser console: `Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "application/json". Strict MIME type checking is enforced for module scripts per HTML spec.` Additional browser errors: `Failed to load resource: net::ERR_INSUFFICIENT_RESOURCES`. Boot recovery displays `App couldn't start` via index.html:169. No source-line stack is supplied for the failing module by the browser. Diagnostics preserved at /tmp/browser/fix-unblock-4/errors.json; captures/route observations at public.log and per-page JSON files beside it.

No product repair was attempted. This historical sandbox stop is superseded by Ben's test-evidence acceptance above; device verification remains with Ben.

## Fixture ledger

No files or fixture lines changed under this brief. Preceding authorised additions remain at src/test/linkedHandicapState.test.tsx:23 (historical b/c), linkedHandicapProfile.test.tsx:19 (b), islandsRound2.test.tsx:25 (c), hb5ProfileBackName.test.tsx:19 (a). All pass now. No assertion, case name or expected value changed. Historical failing output remains in docs/verification; no current test failure is labelled pre-existing.

## Accepted close-out condition

Ben explicitly accepted close-out on the green suite and build, with device checks assigned to him. Superseded STOP reports are deleted as authorised; no additional browser or test run is claimed in this documentation-only close-out.

No SQL, migrations, RPC/edge changes, feed_config, cap, native/Median or product source changes.