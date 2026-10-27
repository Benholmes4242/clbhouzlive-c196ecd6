# Media tab rebuild — incomplete / stopped

## Implemented scope
- Sparse approved-shot hole rail, full coverage strip and unchanged selected panel below the rail. Open coverage taps use the existing add path; final open-holes card opens CourseFirstPhotoPicker.
- Shared ready cover: processing-video skip, loading shimmer, 180ms fade, next-image retry and exhausted Processing state.
- Ordered approved place tiles, Conditions calendar-age chip and canonical ready-only sideways place viewer with member-profile attribution.
- Header, Everything/All shots and combined member hole/place tag identity.
- Independent place read/submit/remove hook; generated types already contained the table, left unchanged.
- English media.v2 text copied into all six course locale files. No SQL, migrations, deployed RPC/edge, admin component, feed_config or native configuration edits.

## Not finished
Place writes/removal have not been wired into the batch/single sheets; their UI remains unchanged. The requested no-hole-list place tagger is not implemented. New place mutations and invalidations lack dedicated tests. No authenticated persistence or visual verification was completed.
The tagger question remains unresolved: the user's answer explicitly confirmed place order only. Existing single-shot hole taps submit immediately; current batch has Confirm tag and no Skip. The brief freezes those actions but the new mock adds selection/primary confirmation and Skip.

## Exact results
Targeted command: `bunx vitest run src/test/courseMediaV2.test.tsx src/test/holeWalk.test.tsx src/test/holeWalkNoRounds.test.tsx src/test/holeMediaTidy.test.tsx src/test/holeTagSingleToast.test.tsx src/test/adminHoleTagging.test.tsx src/test/holeInlineAutoplay.test.tsx src/test/latestHolesSection.test.tsx src/test/holeLibraryVideosStage2.test.tsx`.
130 passed, 1 failed, 131 tests / 9 files.
Full command: `bunx vitest run`: 3,677 passed, 2 failed, 3,679 total / 412 files. Last green 3,670 /411; delta +9 tests /1 file entirely courseMediaV2.test.tsx. No tests removed. Latest harness build: build OK 2026-10-27T20:54:07Z.

New failures, no corrections after stop:
1. src/test/holeInlineAutoplay.test.tsx:131:28 — `batch-open pauses the underlying walk and Close releases it`: `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Tag them"`. The translation mock returns empty text for new translated labels; existing text lookup was not retargeted.
2. src/test/holeMediaVideos.test.tsx:52:52 — `video-only hole uses poster and count one and opens the viewer with the stream`: `Error: expect(received).toHaveTextContent()` / `received value must be a Node.` / `Received has type: Null` / `Received has value: null`. It targets retired `.hole-walk-count`; new rail uses `.media-v2-hole-count`. This file was not edited.
No pre-existing failing case established in this run; both failures are new layout regressions.

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