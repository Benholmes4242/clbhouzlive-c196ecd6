# Media tab final follow-up — green

## Result
Command: `bunx vitest run`.
**3,734 tests passed / 0 failed in 414 files**, 2026-10-27 21:32:36 UTC; duration 217.23 seconds.
Requested comparison baseline: 3,731 tests /414 files (3,704 passed,27 failed).
Delta: +3 tests, no file-count change, solely intervening CB116.1 additions in cb116NameCoach.test.tsx:
- `no_handicap refusal keeps flow open with connect and no toast or invalidation`
- `ProfileHero has no coach imports and its absent optional prop leaves the line empty`
- `ProfilePageV2 passes the member and viewer coach line through the hero prop`
Immediately preceding full run:3,732 passed/2 failed/3,734 total in414 files. This turn adds/removes/renames/rewrites no test cases, changes no assertions, and clears the two remaining failures.
Against last fully green3,670/411: +64 tests/+3 files =9 Media top +41 coach +11 place tagging +3 CB116.1.

## This turn's exact changes
- `src/test/coursePlaceTagging.test.tsx`: replaced only mocked insert/delete entries with the exact supplied chain. Applies to `submit copies owned metadata and invalidates place plus hole key` and `remove deletes the owned row and invalidates both keys`; assertions unchanged: `expect(invalid).toHaveBeenCalledWith({queryKey:['course-place-media','course','me']})`, `expect(invalid).toHaveBeenCalledWith({queryKey:['hole-photo-tags','course','me']})`, owned insert payload and owner/id filters remain intact. Reason: old mock dropped the chain before success/invalidation. All11 cases pass.
- `src/test/heroConnectExample.test.tsx`, `src/test/heroConnectPanel.test.tsx`, `src/test/profileBioFull.test.tsx`: added exactly the requested partial BusinessCoachCards mock overriding CoachProfileLine to null. All27 cases retain their names, bodies and assertions. Reason: requested coaching isolation; these already passed after CB116.1 moved the read to the page, so mocks do not fix a remaining production bug.
- CoachNameSheet's no_handicap branch already calls only onNoHandicap from CB116.1; no further app edit needed. Existing refusal test passes unchanged; coach suite44/44.
- No application, style, hook, SQL, migration, deployed RPC/edge, feed_config, round_pool_cap, native or Median changes this turn.
- Removed `MEDIA_TAB_V2_STOP_REPORT.md` and `MEDIA_TAB_V2_FOLLOWUP_REPORT.md` only after full green; their test-change inventories are preserved below.
- No authenticated browser/persistence check performed; this follow-up changes tests only.

## Previous follow-up test-change list (preserved verbatim)
- holeInlineAutoplay.test.tsx “batch-open pauses the underlying walk and Close releases it”: `screen.getByRole('button', { name: 'Tag them' })` → `.media-v2-untagged` row, explicit missing-row guard; pause true/release false assertions unchanged. Label now renders but whole button also includes the count sentence, so exact name was still unreachable; explicit ruling authorises this retarget.
- holeMediaVideos.test.tsx “video-only hole uses poster and count one and opens the viewer with the stream”: `tile.querySelector('.hole-walk-count')` / `toHaveTextContent('1')` → `.media-v2-hole-count` / `toHaveTextContent('1 shot')`; button Hole7, /poster.jpg, panel/viewer/HLS assertions unchanged. Explicit ruling.
- holeTagBatchV3.test.tsx “no Skip or Done button exists” → “member Skip exists and Done remains absent”: `queryByRole(button,/Skip/)` null → `getByRole(button,'Skip')` enabled; Done absence retained. Ruling supersedes no-Skip.
- holeTagBatchV3.test.tsx “tag dialog keeps tap-to-tag with no note” → “tag dialog selects then confirms with no note”: Hole2 tap now asserts `submit` not called; Confirm tag then `toHaveBeenCalledWith(2)`; no already-tagged note assertion retained. Ruling supersedes immediate submit.
- holeWalk.test.tsx “existing picker preselects and submits selected hole”: retains Hole3 `aria-pressed=true`; tap now `submitted=[]`, Confirm tag then `submitted=[3]`; name unchanged. Ruling supersedes immediate submit.
- holeTagSingleToast.test.tsx “counts the member own non-rejected tags on that hole plus one”: Hole9 selection followed by Confirm tag; toast exactly `Tag confirmed. This is your second tag on the 9th.` and dialog-closed assertions unchanged. Ruling supersedes immediate submit.


## Earlier Media test-change list and nine additions (preserved verbatim)
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

## Eleven place-tagging additions from previous follow-up
- submit copies owned metadata and invalidates place plus hole key
- remove deletes the owned row and invalidates both keys
- foreign owner removal refuses without delete
- read is course/approved-or-owner scoped and newest added first
- single place selects without saving then primary submits
- single Skip closes without saving the selection
- single existing place preselects and removes its row
- batch place selection waits for primary then advances
- batch Skip advances without save then closes after last
- batch existing place preselects and Remove tag clears it
- single hole tap waits for primary and Skip does not save
