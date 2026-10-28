# Media tab round 3 — stop report

## Result

Implemented the reordered Media page, Everything add/filter controls, ordered 128×164 place rail, photo/video picker title variants and shared option B glass tagging card. Member single/batch and admin batches share ShotTagCard and ScorecardGlassOverlay. Hole/place selection is exclusive; member saves remain on their existing paths. Admin place tag/untag calls use the existing RPCs and refresh queue/place/hole keys. Thumbnail opens use the canonical read-only synthetic viewer. Existing hole cards and unrelated upload/retag pickers were not redesigned.

Deleted `MEDIA_TAB_FINAL_REPORT.md` as requested. No SQL, migration, deployed RPC/edge-function, feed_config or native/Median changes. round_pool_cap remains 30.

The work is **not accepted as green**. No app/test correction followed the new test failure. Only the mandatory full-suite run and reporting followed it.

## Verification and inventory

- Targeted command: `bunx vitest run src/test/mediaV3.test.tsx src/test/coursePlaceTagging.test.tsx src/test/courseMediaV2.test.tsx src/test/holeTagBatchV3.test.tsx src/test/adminHoleTagging.test.tsx src/test/holePhotoFastPaths.test.tsx src/test/holeInlineAutoplay.test.tsx src/test/holeMediaTidy.test.tsx src/test/holeTagSingleToast.test.tsx src/test/holeWalk.test.tsx src/test/coursesRailsUnlimited.test.tsx`
- Targeted: **163 passed / 1 failed / 164 total, 11 files**.
- Full command: `bunx vitest run`
- Full: **3,805 passed / 3 failed / 3,808 total, 417 files**. No skipped tests reported.
- Requested historical green baseline: **3,734 / 414**. Intervening CB117 added 22 tests in `cb117BusinessMentions.test.tsx` (+1 file); CB118 added 33 in `cb118BusinessVisiting.test.tsx` (+1 file), reaching 3,789 / 416 with two CB107 failures. This turn adds **19 tests in mediaV3.test.tsx** (+1 file), reaching 3,808 / 417. Total delta against requested baseline: **+74 tests / +3 files**.
- No existing test deleted; existing case counts unchanged. Renames and retargets listed below.
- Latest automatic preview check: **build OK, 2026-10-28T07:26:48Z**. Earlier intermediate segment-prop errors cleared during the multi-file edit.
- Authenticated live save/readback and signed-off visual geometry were not verified. No browser check was performed after the test stop.

## New failure (stop)

`src/test/adminHoleTagging.test.tsx:127:85`

Case: **admin block and batch > member own block stays before admin and uses unchanged member write**

Tool words: `TestingLibraryElementError: Found multiple elements with the role "button" and name "Hole 7"`

The document-wide Hole 7 lookup now matches the background no-photographs grid and the glass card's Hole 7. The former Dialog modal hid the background from accessible queries; the shared glass overlay does not. The requested member-write assertion was not reached. No selector, component or test correction was made after the failure.

## Pre-existing failures, still present

These were new in the preceding CB118 task and pre-existing for this Media task:

1. `src/test/cb107ClubVisiting.test.tsx:257:107` — **CB107 page integration > club Visiting follows What golfers say; contact rows and About are gone**.
   Tool words: `AssertionError: expected false to be true // Object.is equality`.
2. `src/test/cb107ClubVisiting.test.tsx:273:43` — **CB107 page integration > Team stays conditional and moves into Visiting as Meet the team**.
   Tool words: `AssertionError: expected <div role="tablist" …(3)>…(3)</div> to be null`.

Neither protected test was changed. No other failure was reported.

## Existing test retargets and renames

The new brief explicitly supersedes primary-button wording, large preview, segmented selection, header and glass presentation. The following cases retain write/ownership/state assertions and retarget those superseded controls. No existing test was removed.

### src/test/adminHoleTagging.test.tsx (19 → 19)

- **no walk disables the admin queue and block** → **no hole list keeps the admin place-only queue and block**. Old assertion: `expect(f.rpc).not.toHaveBeenCalledWith('admin_get_untagged_course_media', expect.anything())`; new: exact course queue call and visible block. Reason: v3 permits admin place tagging without a hole list.
- **admin block shows count, own attribution copy and Tag them**: old `expect(screen.getByText("Each tag is saved as the member's own.")).toBeInTheDocument()` → absent old intro. Reason: requested removal of the old admin intro.
- **tag passes media id/hole, reads returned row and refreshes all required keys**; **23505 displays message and advances without member mutation**; **other error keeps current shot and existing error handling**; **Remove tag calls admin_untag_hole_media with the row id and refreshes the same keys**; **member own block stays before admin and uses unchanged member write**: `getByRole('button', { name: 'Confirm tag' })` → `name: /^Tag to the /`. Existing RPC, readback, invalidation, refusal and member-write assertions retained. The last case now fails as reported above.

### src/test/coursesRailsUnlimited.test.tsx (15 → 15)

- **admin hole-tag predicate invalidation refetches the active infinite holes rail**: `name: 'Confirm tag'` → `name: /^Tag to the /`; retained exact RPC arguments, request count and cache readback. Reason: new primary label.

### src/test/holePhotoFastPaths.test.tsx (16 → 16)

- **successful next tags exact URL and hole then advances**; **a second and third photograph can be tagged to the same hole**; **batch unique violations identify the duplicate photo and do not advance**: same primary lookup retarget; retained exact URL/hole writes, advance and error assertions.
- In **a second and third photograph can be tagged to the same hole**, `name: 'All tagged'` → `name: 'Tag'` with disabled assertion retained, because v3's disabled primary reads Tag.

### src/test/holeMediaTidy.test.tsx (11 → 11)

- **the tag dialog renders the poster, never an img holding a video URL**: `getByAltText('Your video')` → `getByAltText('Current video')`; retained poster URL and no-manifest-image assertion. Reason: shared current-shot thumbnail.
- **after tagging an item to hole 4, holes 1-3 stay enabled and no closed-holes paragraph renders**: primary lookup retarget only; retained exact write and enabled-hole assertions.

### src/test/holeTagSingleToast.test.tsx (1 → 1)

- **counts the member own non-rejected tags on that hole plus one**: primary lookup retarget; `expect(screen.queryByRole('dialog')).toBeNull()` now waits for the glass overlay's existing exit animation. Exact toast assertion retained.

### src/test/holeWalk.test.tsx (14 → 14)

- **existing picker preselects and submits selected hole**: primary lookup retarget only. Retained `aria-pressed: true`, no write on selection and submitted `[3]` assertions. HoleWalk tests otherwise unchanged.

### src/test/coursePlaceTagging.test.tsx (11 → 11)

- **single place selects without saving then primary submits** and **batch place selection waits for primary then advances**: removed the old `getByRole('tab', { name: 'Around the club' })` click. Place choices now appear simultaneously with holes; retained no-save-on-selection and exact place-submit/advance assertions.

### src/test/holeInlineAutoplay.test.tsx (16 → 16)

- **batch hero elects contain video, keeps its still thumbnails and duration, and restarts on shot change** → **batch glass thumbnail stays still and opens the canonical read-only video viewer**.
  Old assertions: registration in `hole-tag-batch`, `object-fit: contain`, `0:42` hero duration, detach and attach on changing shot. New assertions: no video/registration in the compact glass thumbnail, correct current poster, canonical open options `{ readOnly: true, syntheticPosts: true }`, updated poster on thumbnail change. Reason: brief removes the large batch preview and makes the 52px thumbnail open fullscreen. Underlying HoleWalk autoplay and batch-open pause tests unchanged.

### src/test/holeTagBatchV3.test.tsx (29 → 29)

Shared helper now targets `[data-tag-primary]`; removal flows target the separate Remove tag text control instead of the old overloaded primary. Every helper-consuming case is named here, including cases whose concrete mutation assertions are unchanged:

- **tapping the selected hole again deselects it and disables Confirm tag; a different tap moves the selection** → **tapping the selected hole again deselects it and disables Tag; a different tap moves the selection**. Disabled/enabled and selected-state assertions retained.
- **Confirm tag is disabled with no selection, enabled with one, and tags the current url and hole** → **Tag is disabled with no selection, enabled with one, and tags the current url and hole**. Old primary text `Confirm tag` → `Tag`; exact `/1.jpg`, 4 write retained.
- **changing the selection before confirming tags the last selected hole**: exact `/1.jpg`, 7 assertion retained.
- **after a tag the selection clears and the next untagged shot becomes the hero**: same current image, unselected hole and disabled primary assertions.
- **wraps around to an earlier untagged shot**: current `/1.jpg` assertion retained.
- **"All tagged" when nothing is left, window still open, grid disabled** → **disabled Tag when nothing is left, window still open, grid disabled**. Old primary text `All tagged` → `Tag`; open window, disabled grid, no-close assertions retained.
- **Close closes and is disabled while a tag is pending**: removed old `Tagging...` wording expectation; disabled primary/Close and close callback retained.
- **a tagged thumbnail reopens for removal with onRemove and stays inert without it**: old primary `Remove tag` expectation now targets separate Remove tag; badge, inertness and no-extra-write assertions retained.
- **the chip shows position / n** → **the header shows position OF n**. Old `[data-chip]` `1 / 12`, `5 / 12` → header `[data-tag-position]` `1 OF 12`, `5 OF 12`.
- **renders all 100 shots in one non-wrapping row; sheet keeps its max-height rules** → **renders all 100 shots in one non-wrapping row; glass card keeps its max-height rules**. Old batch row/strip classes and full-height sheet CSS → shared row/strip classes and glass maxHeight `82dvh`. Count 100 retained.
- **member first and second tag, counting existingHoleTags**; **member first tag with no existing tags**; **admin copy with and without owner name**: same exact confirmation assertions, primary helper retarget only.
- **an error hides the confirmation and keeps shot and selection**: same error/status/current image and selected-hole assertions.
- **admin 23505 marks the shot unavailable and moves on**: unavailable/inert/no-badge assertions retained; final disabled primary text now Tag.
- **tag dialog selects then confirms with no note**: primary lookup retarget; exact submitted 2 assertion retained.
- **tagged state selects the hole, locks and dims the grid, and shows the line and Remove tag**: old inline opacity `0.4` assertions → concrete `data-dim` state; locked grid/status retained. Remove tag now separate text control.
- **Remove tag calls onRemove with the stored row; success clears the badge and re-enables the grid**: separate removal control, primary becomes disabled Tag; exact stored row, badge removal and grid reopening retained.
- **the freed shot can be confirmed on a different hole**: separate Remove tag control; exact `/1.jpg`, 7 and two-write assertions retained.
- **a member count after remove-and-retag excludes the removed tag**: separate Remove tag control; same second-tag confirmation retained.
- **a remove error keeps the tag and shows the message**: separate removal control; same error, badge and selected state retained.
- **"Removing..." disables the button and the cross**: separate removal text changes while pending; disabled primary/Close assertions retained.
- **admin-unavailable shots stay non-interactive with onRemove present**: asserts absent separate Remove tag instead of old primary not reading Remove tag; unavailable/inert/current shot assertions retained.
- **from "All tagged", tapping a thumbnail shows Remove tag** → **from a completed batch, tapping a thumbnail shows Remove tag**: disabled Tag then enabled separate Remove tag; same stored-hole confirmation retained.

## Remaining acceptance

Resolve the new member integration accessibility/lookup failure only after authorization, then rerun the targeted and full suite. Two inherited CB107 failures also prevent the required all-passing result. Real signed-in admin/member save/readback and visual comparison remain unverified. No completion claim is made.