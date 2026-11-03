# G2C Rounds — implemented, full-suite verification stopped

## Scope and files
- `src/features/chrome-v2/registry.ts`: /rounds island, dark/bleeding/soft/condensing, history back with /amateur fallback.
- `src/pages/RoundsPage.tsx`: old header removed; shared PageTitle and actual h1 name anchor; island clearance; board/session/sheet behavior unchanged.
- `src/features/chrome-v2/PageTitle.tsx`, `page-title.css`: shared h1, optional subtitle/trailingAction, forwarded h1 ref.
- `src/features/explore-magazine/ScoresFilterHead.tsx`, `rounds-scope-dock.css`: /rounds-only IslandDock wrapper with shared controlled copies; other callers keep their original scope. The existing board decides gated/held omission; no new reads or fallback.
- `src/test/g2cRoundsHeader.test.tsx`: seven added cases.
- `src/test/rsRoundsShelf.test.tsx`: one explicitly authorized old-header test rewritten, no count change.
- `AGENTS.md`: shared PageTitle ownership note.
- `roadmap.md`, `G2C_ROUNDS_REPORT.md`: result and blockers.

No SQL, migrations, feed_config, RPC/edge deployment, native/Median, guest browsing, wizard, news or round plots changes. round_pool_cap unchanged.

## Specification difference
30px/700/1.1/F8FAFC, 18px inset and 6px/13.5px/55% subtitle implemented. Title letter-spacing is **0**, not brief/mock −0.025em: the higher-priority project instruction prohibits negative letter spacing. Screenshot parity is therefore not claimed. In-place scope styling remains the existing build under the mock-authority frozen-elements rule; only its new docked copy gets the signed-off separated glass choices.

## Tests and count reconciliation
Before: prior G2B candidate **6417 tests / 570 files**, not an all-green baseline. After: candidate **6424 / 571** (+7/+1). No deletion; one rewritten/renamed case below is count-neutral. A fresh `bunx vitest list --json` collection exceeded 120 seconds without emitting inventory, so the candidate is reconciled against the prior reported inventory, not independently collected or a full passing total.

New `g2cRoundsHeader.test.tsx` cases:
1. opts /rounds into soft dark back islands with the /amateur fallback
2. PageTitle forwards its h1 and keeps subtitle/action optional
3. shows Rounds only past its actual h1 while expanded
4. docks the scope only past the row and expanded, retaining its hidden copy
5. shares selections in both directions without changing scope semantics
6. does not create a dock when the caller omits the gated scope
7. retains the single original scope on other routes

Authorized rewrite: `rsRoundsShelf.test.tsx`, “back falls back to /amateur when there is no history” → “global back retains the /amateur fallback when there is no history”. Removed `fireEvent.click(screen.getByRole('button', { name: 'Back' })); expect(screen.getByTestId('amateur-route')).toBeInTheDocument();`. Replaced with `expect(resolveChrome('/rounds', new URLSearchParams()).left).toEqual({ kind: 'back', title: null, backTarget: 'history', backFallback: '/amateur' });`. Reason: the page no longer owns a Back button; the global registry owns its fallback. Other test assertions/fixtures unchanged.

Focused command: `bunx vitest run src/test/g2cRoundsHeader.test.tsx src/test/rsRoundsShelf.test.tsx --maxWorkers=2`: **38/38**, 2/2 files, no unhandled errors. Full output `/tmp/g2c/focused.log`.

Full command: `bunx vitest run --shard=1/4 --maxWorkers=2`: **1620 passed / 4 failed / 1624**, 141 passed / 2 failed / 143 files. No unhandled-errors summary. Full unmodified output `/tmp/g2c/shard1.log`. Stopped; shards 2–4 not run and no failures corrected. All four are reproduced pre-existing G2B failures:
- `src/test/roundNotificationOverlay.test.ts:11:68`: `AssertionError: expected { chrome: 'island', …(6) } to deeply equal { chrome: 'island', …(4) }`; Received adds `condense: true`, `scrim: 'soft'`.
- `src/test/tourPlayoffShortenedEvents.test.tsx`: “shows the situation block for an awaiting-playoff event (pulse live) and not "Final"”, same `(pulse completed)`, and “renders no block for a normal finished four-round event”: `Error: No QueryClient set, use QueryClientProvider to set one`; `src/features/tourhub/hooks/useTournamentPick.ts:37:10`, through TournamentPage. Test line not included by the tool's stack.

Other prior failures not rerun here: `headerB1.test.tsx:97:39` expected23px/received16px; `g2aCourseTabs.test.tsx:104:34` expected `env(safe-area-inset-top, 0px)`/received empty string. Suspected tourOverviewBand stale fixture is not a confirmed failure. Existing siLadderRules/SiLadder import mismatch left untouched.

## Browser and build
Real Chromium, 390×844 fixture at `http://localhost:8080/g2c-fixture`, real PageTitle/ScopeSegments/IslandDock/IslandBackCapsule/back-name observer and #root scroller, real i18n/MemoryRouter. Top h1 y109/font30/weight700; scroll down500 then up450 gives name “Rounds” and shown dock y109/h36. Clicking dock “Your circle” updates the in-place selection. No page errors. Screenshots reviewed: `/tmp/browser/g2c/title.png`, `/tmp/browser/g2c/docked.png`. Fixture omits right island, scrim, board and nav; it is not signed-in/live-route or full-mock parity proof.

Automatic preview build: latest `/tmp/observability/build-errors.log` entry **build OK 2026-11-03T19:01:20Z**. No manual build/typecheck. Zero-failure full-suite acceptance remains blocked by the inherited failures above.

## Final status (STABILISE_1, 3 Nov 2026)
The test stops that were open in this brief were resolved with test-only changes. The diffs, the authority for each and the named cases are in `STABILISE_1_REPORT.md`. Full suite in four shards with --maxWorkers=2: 1,638 / 1,538 / 1,641 / 1,632 = **6,449 tests, 574 files, 0 failures, 0 unhandled errors**. This confirms the earlier estimate of 6,449. Browser evidence: signed-in checks unavailable (external sign-in); signed-out live checks and fixture coverage are listed in STABILISE_1_REPORT.md.
