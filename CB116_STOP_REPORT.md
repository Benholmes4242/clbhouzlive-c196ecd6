# CB116 — stopped after completed-edit tests

## Outcome
Implemented shared session-scoped RPC reads/invalidation, coach invitation and naming/switch/connect sheets, current-coach You sentences, personal hero coach line, edit-profile Your coach/options/stop/find, public results/chart, team progress/list and coach hero figures. Any read error hides its dependent surface even if stale data exists. Connect route: `/manage/handicap`.

Ben waived the signed-in prerequisite and reports all COACH_LINKS_V1 checks and seven scratch-tested function contracts passing. The agent did not independently verify signed-in hosted calls. Auth status remains external_unmanaged; no authenticated visual/persistence check was possible.

## Test inventory
- Last green: 3,670 tests /411 files.
- Immediately preceding run: 3,679 tests /412 files;3,677 passing/2 failing. The intervening +9 is courseMediaV2.test.tsx.
- `bunx vitest run src/test/cb116NameCoach.test.tsx`:40 passing/1 failing/41 tests.
- `bunx vitest run`:3,693 passing/27 failing/3,720 tests across413 files (407 passing/6 failing files).
- Delta from preceding run:+41 tests,+1 file, all new cases in cb116NameCoach.test.tsx. No existing tests deleted, renamed, rewritten, or mock changes. No correction followed the new failure.
- Latest automatic preview build:build OK at2026-10-27T21:06:55Z. No separate typecheck run.

## New blocking failures
`src/test/cb116NameCoach.test.tsx:40:332`: “server no_handicap opens connect and no success toast” — `Error: Missing [data-coach-connect]`. Naming refusal closes the parent flow before connect is rendered.

24 existing profile tests newly fail with `Error: No QueryClient set, use QueryClientProvider to set one`:
`src/features/coach/hooks.ts:15:10` (useMemberCoach), called from `src/features/coach/BusinessCoachCards.tsx:20:77` (CoachProfileLine).
- heroConnectExample.test.tsx:14 failures
- heroConnectPanel.test.tsx:5 failures
- profileBioFull.test.tsx:5 failures
These are new CB116 integration regressions, not pre-existing failures. Tests were not amended.

## Pre-existing failures (untouched)
- `src/test/holeInlineAutoplay.test.tsx:131:28` — `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Tag them"`.
- `src/test/holeMediaVideos.test.tsx:52:52` — `Error: expect(received).toHaveTextContent() received value must be a Node. Received has type: Null. Received has value: null`.

## Every failing test
- src/test/cb116NameCoach.test.tsx > CB116 coach naming > server no_handicap opens connect and no success toast
- src/test/heroConnectExample.test.tsx > CE1 fixed connected example > crops the example wrapper with both masks and the approved opacity
- src/test/heroConnectExample.test.tsx > CE1 fixed connected example > clicking every example form tile fires no analytics or navigation
- src/test/heroConnectExample.test.tsx > CE1 fixed connected example > clicking the example chart fires no analytics or navigation
- src/test/heroConnectExample.test.tsx > CE1 fixed connected example > clicking the example index figure fires no analytics or navigation
- src/test/heroConnectExample.test.tsx > CE1 fixed connected example > appears for an unconnected member on their own profile
- src/test/heroConnectExample.test.tsx > CE1 fixed connected example > connected chart and index omit example handles and retain their analytics calls
- src/test/heroConnectExample.test.tsx > CE1 fixed connected example > is absent when the hide setting is set
- src/test/heroConnectExample.test.tsx > CE1 fixed connected example > is absent on another member’s profile
- src/test/heroConnectExample.test.tsx > CE1 fixed connected example > is absent for a connected member
- src/test/heroConnectExample.test.tsx > CE1 fixed connected example > does not appear while connection reads remain unsettled
- src/test/heroConnectExample.test.tsx > CE1 fixed connected example > prints fixed index 12.4, never the supplied member index or trend
- src/test/heroConnectExample.test.tsx > CE1 fixed connected example > keeps the pill present alongside every displayed example
- src/test/heroConnectExample.test.tsx > CE1 fixed connected example > supplies both movements and five approved round figures
- src/test/heroConnectExample.test.tsx > CE1 fixed connected example > Hide calls the decline hook once and waits for the loaded flag, even after its promise resolves
- src/test/heroConnectPanel.test.tsx > CP1 connect panel > renders for a member with no connection on their own profile
- src/test/heroConnectPanel.test.tsx > CP1 connect panel > does not render when hideConnectPrompt is true
- src/test/heroConnectPanel.test.tsx > CP1 connect panel > does not render on someone else’s profile
- src/test/heroConnectPanel.test.tsx > CP1 connect panel > does not render for a connected member
- src/test/heroConnectPanel.test.tsx > CP1 connect panel > its ghost labels are labels the connected hero renders
- src/test/profileBioFull.test.tsx > profile hero bio shows whole > a bio at the editor limit collapses to eight lines, not two
- src/test/profileBioFull.test.tsx > profile hero bio shows whole > the expanded bio lifts the clamp
- src/test/profileBioFull.test.tsx > profile hero bio shows whole > no More and no Less while the bio measures inside the clamp
- src/test/profileBioFull.test.tsx > profile hero bio shows whole > More appears only when the measurement says the bio overflows
- src/test/profileBioFull.test.tsx > profile hero bio shows whole > Less appears only once the bio is expanded
- src/test/holeInlineAutoplay.test.tsx > active hole tile autoplay > batch-open pauses the underlying walk and Close releases it
- src/test/holeMediaVideos.test.tsx > Stage1 hole video display and lifecycle > video-only hole uses poster and count one and opens the viewer with the stream

## Diff scope
New `src/features/coach/{contracts.ts,hooks.ts,copy.ts,CoachSheets.tsx,BusinessCoachCards.tsx,coach.css}` and `src/test/cb116NameCoach.test.tsx`. Integrated BusinessProfilePage, BusinessYouCard, ClubProfileHero optional strip color, ManageProfile, ProfileHero and ProfileCoverBand optional line slot. Added semantic coach CSS tokens in src/index.css and coach keys/plurals in six common.json locale files without rewriting existing content. Updated architecture/roadmap and coach requirement memory.

No SQL, migrations/migration files, deployed RPC/edge functions, feed_config, cap or native/Median config changes.

## Remaining gates
CB116 cannot be called complete/all passing. Await the explicit correction ruling after this stop. Authenticated end-to-end/visual checks remain unavailable. Media rebuild is independently pending its earlier corrections and tagger ruling; not changed in CB116.
