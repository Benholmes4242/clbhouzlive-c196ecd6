# FIX_UNBLOCK_4 — STOP: browser startup failure

## Scope

The four known files already contain the authorised settled non-pro `useMyProStatus` fixture including `verifiedKnown: true`, added in the immediately preceding continuation. No new test or product changes are needed initially. Existing assertions, names and case counts remain unchanged. Expected suite: 6,879 tests / 608 files.

## Checks

- Focused known-four: 36/36 across 4 files; dependency checks: 67/67 across 5 files. Commands: `bunx vitest run <requested files> --maxWorkers=2`. Complete output in docs/verification/fix-unblock-4/focused-four.log and focused-chain.log.
- All four shards freshly run in order using `bunx vitest run --maxWorkers=2 --shard=n/4`: 1,753 / 1,653 / 1,750 / 1,723, each 152 files. Total 6,879 / 608, zero failures, baseline unchanged. Full output in docs/verification/fix-unblock-4/shard1.log through shard4.log. No flakes or further fixture repairs occurred.
- Browser at 424x970/dpr1 on /tourhub and 320/430 News could not start the app. Screenshots viewed: /tmp/browser/fix-unblock-4/tour.png and amateur-news-320.png show the startup failure, not the requested surfaces. All four browser checks remain unverified.
- Signed-in Activity/back and non-pro/Mason cold islands additionally lack managed session access: environment reports `external_unmanaged`. No credentials requested and no substitute demo account/data used.

## Exact new failure

Browser console: `Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "application/json". Strict MIME type checking is enforced for module scripts per HTML spec.` Additional browser errors: `Failed to load resource: net::ERR_INSUFFICIENT_RESOURCES`. Boot recovery displays `App couldn't start` via index.html:169. No source-line stack is supplied for the failing module by the browser. Diagnostics preserved at /tmp/browser/fix-unblock-4/errors.json; captures/route observations at public.log and per-page JSON files beside it.

This is outside the authorised pro-fixture failure class: STOP, no product repair attempted. Latest available harness signal: build OK 2026-11-05T13:27:02Z. No claim of browser or combined sign-off.

## Fixture ledger

No files or fixture lines changed under this brief. Preceding authorised additions remain at src/test/linkedHandicapState.test.tsx:23 (historical b/c), linkedHandicapProfile.test.tsx:19 (b), islandsRound2.test.tsx:25 (c), hb5ProfileBackName.test.tsx:19 (a). All pass now. No assertion, case name or expected value changed. Historical failure details remain in their existing reports; no current test failure is labelled pre-existing.

## Close-out condition

Keep superseded STOP reports until all four shards and all four browser checks are green. The preceding instruction already deleted PRO_STATUS_CONTROLS_REPORT.md after its fresh full-suite pass; it is absent before this brief and is not recreated.

No SQL, migrations, RPC/edge changes, feed_config, cap, native/Median or product source changes.