# Media rebuild follow-up — stopped, not green

## Result and inventory
`bunx vitest run`:3,704 passed/27 failed/3,731 total tests in414 files (409 passed/5 failed files).
Last green3,670/411:+61 tests/+3 files:9 courseMediaV2,41 cb116NameCoach (intervening coach work),11 coursePlaceTagging this turn. Immediately preceding suite3,720/413:+11 tests/+1 file this turn. No tests removed.
Targeted nine files:134 passed/3 failed/137 tests before the expressly authorised untagged-row lookup correction. Final full suite verifies both old Media failures now pass. Latest automatic build OK2026-10-27T21:20:53Z.

## New failures — no further corrections
- coursePlaceTagging.test.tsx:17:660 “submit copies owned metadata and invalidates place plus hole key”.
- coursePlaceTagging.test.tsx:18:488 “remove deletes the owned row and invalidates both keys”.
Both: `AssertionError: expected "invalidateQueries" to be called with arguments: [ { queryKey: [ …(3) ] } ]` / `Number of calls: 0`.

## Pre-existing failures untouched
25 CB116/profile cases remain: cb116NameCoach.test.tsx:40:332 `Error: Missing [data-coach-connect]`;14 heroConnectExample,5 heroConnectPanel,5 profileBioFull share `Error: No QueryClient set, use QueryClientProvider to set one` at features/coach/hooks.ts:15:10 / BusinessCoachCards.tsx:20:77. Full case names below.

## This turn's existing test changes (none deleted)
- holeInlineAutoplay.test.tsx “batch-open pauses the underlying walk and Close releases it”: `screen.getByRole('button', { name: 'Tag them' })` → `.media-v2-untagged` row, explicit missing-row guard; pause true/release false assertions unchanged. Label now renders but whole button also includes the count sentence, so exact name was still unreachable; explicit ruling authorises this retarget.
- holeMediaVideos.test.tsx “video-only hole uses poster and count one and opens the viewer with the stream”: `tile.querySelector('.hole-walk-count')` / `toHaveTextContent('1')` → `.media-v2-hole-count` / `toHaveTextContent('1 shot')`; button Hole7, /poster.jpg, panel/viewer/HLS assertions unchanged. Explicit ruling.
- holeTagBatchV3.test.tsx “no Skip or Done button exists” → “member Skip exists and Done remains absent”: `queryByRole(button,/Skip/)` null → `getByRole(button,'Skip')` enabled; Done absence retained. Ruling supersedes no-Skip.
- holeTagBatchV3.test.tsx “tag dialog keeps tap-to-tag with no note” → “tag dialog selects then confirms with no note”: Hole2 tap now asserts `submit` not called; Confirm tag then `toHaveBeenCalledWith(2)`; no already-tagged note assertion retained. Ruling supersedes immediate submit.
- holeWalk.test.tsx “existing picker preselects and submits selected hole”: retains Hole3 `aria-pressed=true`; tap now `submitted=[]`, Confirm tag then `submitted=[3]`; name unchanged. Ruling supersedes immediate submit.
- holeTagSingleToast.test.tsx “counts the member own non-rejected tags on that hole plus one”: Hole9 selection followed by Confirm tag; toast exactly `Tag confirmed. This is your second tag on the 9th.` and dialog-closed assertions unchanged. Ruling supersedes immediate submit.

## Implemented
Member single/batch shared hole/place segment, ordered nine-place grid,64px thumbnail/header, batch OF position, primary selection confirmation, existing place preselect/removal, independent place callbacks, place-only no-hole-list sources/taggers, place analytics and English defaultValues. Admin batch remains hole-only/no Skip; panel/viewer/HLS behavior preserved. Added11 tests for mutations/ownership/read filters/selection/Skip/preselect/no-hole-list.
No SQL/migrations/deployed RPC/edge/config/native changes. No authenticated visual/persistence check (external_unmanaged).

## Incomplete
New invalidation failures prevent green completion; MEDIA_TAB_V2_STOP_REPORT.md retained because deletion is conditional on green. CB116 is independently stopped. No further corrections after new failures, except the still-explicitly-authorised old autoplay lookup.

## Failing cases
- src/test/cb116NameCoach.test.tsx > CB116 coach naming > server no_handicap opens connect and no success toast
- src/test/coursePlaceTagging.test.tsx > Media place contributions and member taggers > submit copies owned metadata and invalidates place plus hole key
- src/test/coursePlaceTagging.test.tsx > Media place contributions and member taggers > remove deletes the owned row and invalidates both keys
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

## Earlier Media test-change inventory (retained)
## Existing test changes
`holeWalk.test.tsx`:
- “selection keeps every tile mounted” → “selection keeps the sparse rail and full coverage mounted”: empty rows → two approved shot fixtures; existing mounted/pressed assertions retained because rail hides empty holes.
- “Add first passes selected hole” → “open coverage segment passes its hole directly to Add first”: click Hole 3 then Add the first → click open coverage segment; `expect(selected).toEqual([3])` retained.
- “tile 4 opens its region directly after tile 6 and before tile 7” → “hole 4 opens its existing region directly under the rail”: previous tile6/next tile7 assertions → parent previous sibling has media-v2-hole-rail / no next sibling.
- “switching from tile 4 to tile 11 moves the only region after tile 12” → “switching from hole 4 to hole 11 retains one region under the rail”: previous tile12/next tile13 → rail placement/no next sibling; one-region assertion retained.
- “tile 18 opens the region after the final tile” → “hole 18 opens its region under the rail”: previous Hole18 button → parent previous sibling is rail; no next sibling retained.
- “tapping tile 4 again closes its region and clears aria-pressed” and “scrolls only when the region is below/visible the viewport”: added approved shot fixtures in place of empty rows, behavior assertions unchanged.

`holeWalkNoRounds.test.tsx`:
- “unselected unscored walk shows the exact quiet line without a field-loses claim” → “unselected unscored rail omits the retired quiet line and field-loses claim”: quiet text equality → `.hole-walk-quiet` null.
- “quiet line remains when every unscored hole is photographed and observation is absent” → “fully photographed unscored rail omits retired quiet copy and observation”: quiet text equality → null; observation absence retained.
- “Media with photos and empty available analysis renders eighteen walk tiles and enables known holes” → “Media with photos and empty analysis renders four shot cards and eighteen coverage segments”: 18 old tiles → 4 sparse cards plus 18 coverage segments; known-hole/panel assertions retained.
- “Media automatically restores real scored holes when analysis receives rounds”: old tile selector → new card selector; expected count 1 unchanged.
- Added empty place-hook fixture; no other assertion changes.

`holeMediaTidy.test.tsx`: “an empty hole keeps "Add the first" and never shows the more button”: empty whole walk / click Hole7 → approved Hole1 plus focus Hole7, retaining both panel-action assertions. Preserves empty panel behavior while empty segments now take the direct add path.

`adminHoleTagging.test.tsx`: “member own block stays before admin and uses unchanged member write”: lookup old heading `One of yours is untagged` → `.media-v2-untagged` with explicit missing-row failure; click label Tag them → click that row. Ordering and member/RPC assertions unchanged. Empty place hook fixture added.

`holeTagSingleToast.test.tsx`, `holeInlineAutoplay.test.tsx`, `latestHolesSection.test.tsx`, `holeLibraryVideosStage2.test.tsx`: added empty place-hook fixtures only; no test names or assertions altered.

## Nine added tests — courseMediaV2.test.tsx
1. uses the approved shared nine-place order
2. groups only approved shots in catalogue order and sorts newest first
3. place tiles open exactly their sorted approved rows
4. empty or private-only place groups render nothing
5. conditions age uses local calendar day boundaries
6. processing videos are skipped while ready videos and images remain
7. cover shimmers until load and retries the next ready image on error
8. exhausted covers and processing-only rows render the nonblank processing state
9. place viewer is one ready-only newest-first run with each member credited