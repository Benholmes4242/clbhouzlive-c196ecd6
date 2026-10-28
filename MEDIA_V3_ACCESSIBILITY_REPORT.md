# Media v3 accessibility finish — blocked by pre-existing CB118.1 test

## Diff

`ScorecardGlassOverlay.tsx` imports the installed `hideOthers` helper and calls it only when `open`, `mounted` and `presentation === 'overlay'`, with a non-null card element. The effect returns its undo callback, restoring background accessibility on close, unmount or presentation change. Scrim, focus behavior, animation, layout and gestures are unchanged. All floating scorecard/tagging callers inherit this behavior; page presentation remains non-modal.

No existing test, selector, assertion or page was edited. No SQL, migrations, deployed RPC/edge functions, feed_config or native/Median configuration changes; round_pool_cap remains 30.

## CB107 checks against CB118

CB118 scope says: “Generalise ClubVisiting with optional props whose defaults reproduce today's club card byte for byte: same rows, wording, tee-time toast and tests.” Its test clause says: “the club card unchanged: existing cb107/cb108 tests pass untouched”.

- **club Visiting follows What golfers say; contact rows and About are gone**: CB118 did not authorize a club placement change. The preceding CB118.1 loading gate already restores the club identity before content renders. This unchanged test passes targeted and full-suite runs; no additional page fix was needed.
- **Team stays conditional and moves into Visiting as Meet the team**: CB118 did not authorize a club Team behavior change. The existing CB118.1 gate likewise resolves the earlier premature non-club rendering. This unchanged test passes targeted and full-suite runs; no retargeting or page edit was needed.

## Tests and inventory

Targeted command:
`bunx vitest run src/test/scorecardGlassAccessibility.test.tsx src/test/adminHoleTagging.test.tsx src/test/cb107ClubVisiting.test.tsx src/test/cb118BusinessVisiting.test.tsx`

Result: **81 passed / 1 failed / 82 total, 4 files**. The unchanged **member own block stays before admin and uses unchanged member write** passes, including its document-wide Hole 7 selector and member write assertion.

Full command: `bunx vitest run`.

Complete run: **3,815 passed / 1 failed / 3,816 total, 418 files**, duration 507.38s. No new failures in this completed run. No scorecard test required a lookup retarget.

Requested baseline: **3,808 tests / 417 files**. Intervening CB118.1 added four tests in existing `cb118BusinessVisiting.test.tsx`, making the pre-edit inventory **3,812 / 417**. This turn adds four tests in new `scorecardGlassAccessibility.test.tsx`, making **3,816 / 418**: total delta **+8 tests / +1 file** against the requested baseline.

New tests:
- **mounted open overlay hides background controls and exposes only the card control** — asserts one accessible Hole 7 inside the card and aria-hidden on the background.
- **close restores the background during the exit animation** — asserts immediate restoration and background-only control after exit.
- **unmount restores other content without removing existing aria-hidden values** — asserts restored background access and preserved pre-existing hidden state.
- **page presentation and unmounted not-ready overlays leave background accessible** — asserts non-modal page and readiness behavior.

No tests deleted, renamed, rewritten or retargeted this turn. The original v3 historical change list remains in `MEDIA_V3_STOP_REPORT.md`; that file was not deleted because full green is a prerequisite.

## Remaining pre-existing failure

`src/test/cb118BusinessVisiting.test.tsx:274:28`

**CB118.1 club courses loading identity > resolved club courses render the club layout without an intermediate non-club card**

Tool words: `AssertionError: expected [ …(1) ] to have a length of +0 but got 1`.

The observer classifies every `[data-posts-content]` as non-club, although the legitimate club From the club section also renders PostsTabContent. The actual club layout/Visiting placement/tab absence checks immediately above pass. This failure predates the accessibility change. This brief authorizes only scorecard lookup corrections and the two named CB107 investigations, not rewriting this CB118.1 test, so it remains unchanged.

An initial full run was killed at the 600-second command limit before reporting totals; it contained timing failures in unchanged Media tests. A second, complete run finished with only the pre-existing CB118.1 failure; all Media tests passed. No edits were made between runs.

Automatic preview check: **build OK, 2026-10-28T07:47:14Z**. Authenticated live scorecard/tagging verification remains unavailable and was not attempted after the test stop.