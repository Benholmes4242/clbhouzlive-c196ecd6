# CB118.2 — Loading watcher correction and Media isolation checks

## Result

`bunx vitest run`: **3,816 passed / 0 failed / 3,816 tests across 418 files**, duration **306.02s**. Business-profile tests and all Media tests pass. Automatic preview check: **build OK, 2026-10-28T08:07:43Z**.

Before/after inventory: **3,816/418 → 3,816/418**, no count delta. Against the prior Media v3 baseline **3,808/417**, the eight additional tests remain the four intervening CB118.1 loading tests and the four shared glass accessibility tests in one new file. No tests added, deleted or renamed in CB118.2.

## Watcher diff

Only the explicitly authorized test **CB118.1 club courses loading identity > resolved club courses render the club layout without an intermediate non-club card** in `src/test/cb118BusinessVisiting.test.tsx` changed.

Old watched selector:
`[data-business-tabs], [data-about-content], [data-posts-content]`

New watched selector:
`[role="tablist"], [data-business-you], [data-business-nearby], [data-business-followers], [data-business-mentions], [data-visiting-variant="business"]`

Exact card roots:
- BusinessYouCard: `data-business-you` (emitted by its shared YouCardShell).
- BusinessNearbyCourses: `data-business-nearby`.
- BusinessFollowersCard: `data-business-followers`.
- BusinessMentionsRail: `data-business-mentions`.
- Non-club ClubVisiting: newly added `data-visiting-variant="business"`.

The watcher still checks added elements and their descendants throughout pending-to-resolved rendering. Shared PostsTabContent is no longer misclassified as non-club. Every assertion stays unchanged, including `expect(nonClubNodes).toHaveLength(0)` and the resolved Visiting-after-What-golfers-say assertion. Reason: the club legitimately renders PostsTabContent in ClubFromTheClub.

The only application-file change is the brief's explicit diagnostic-attribute exception: `data-visiting-variant={nonClub ? 'business' : undefined}` on ClubVisiting's section. Club markup omits the attribute, and appearance/behavior are unchanged. The accepted two-line loading gate is untouched.

## Isolation results

Each file was run alone, sequentially, using `bunx vitest run src/test/<file>.test.tsx --reporter=verbose`. None of the Media files, selectors or timeouts changed.

| File | Result | File duration | Named formerly timing-out case | Case time |
| --- | --- | --- | --- | --- |
| adminHoleTagging.test.tsx | 19/19 passed | 11.10s | Remove tag calls admin_untag_hole_media with the row id and refreshes the same keys | 982ms |
| coursesRailsUnlimited.test.tsx | 15/15 passed | 8.22s | admin hole-tag predicate invalidation refetches the active infinite holes rail | 1786ms |
| holePhotoFastPaths.test.tsx | 16/16 passed | 8.40s | MEDIA_FAST_1 > successful next tags exact URL and hole then advances | 545ms |
| holePhotoFastPaths.test.tsx | same file run | same run | MEDIA_FAST_1 > a second and third photograph can be tagged to the same hole | 1351ms |
| holeTagBatchV3.test.tsx | 28/28 passed | 19.59s | tapping the selected hole again deselects it and disables Tag; a different tap moves the selection | 1036ms |
| mediaV3.test.tsx | 19/19 passed | 10.71s | single has one selection across holes and places, and only submits on primary | 1306ms |

All six are **pre-existing, Media-owned, load-dependent timeout failures** from the earlier run; none reproduces in isolation or in this turn's single full run. No timeout increases or Media fixes were made.

Business check: `bunx vitest run src/test/cb118BusinessVisiting.test.tsx src/test/cb107ClubVisiting.test.tsx`: **59/59 passed across 2 files**, duration **6.98s**.

## Historical Hole 7 failure

**admin block and batch > member own block stays before admin and uses unchanged member write** was the pre-existing Media-owned multiple-Hole-7 failure. Its selector and assertions remain unchanged here. The preceding shared-overlay accessibility correction already fixed it; it passes this isolation run (**723ms**) and this full run. No Media edit was made in CB118.2.

## Protected scope

No SQL, migrations, migration files, deployed RPC/edge function edits, feed_config changes or native/Median configuration edits. round_pool_cap remains 30. No authenticated live checks were required for this test-only correction.

With full green confirmed, `MEDIA_V3_STOP_REPORT.md` is deleted as previously requested. Its historical test-change inventory is preserved below; those historical edits were not repeated in CB118.2.
## Historical Media v3 test-change inventory (unchanged this turn)


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

### src/test/holeMediaTidy.test.tsx (9 → 9)

- **the tag dialog renders the poster, never an img holding a video URL**: `getByAltText('Your video')` → `getByAltText('Current video')`; retained poster URL and no-manifest-image assertion. Reason: shared current-shot thumbnail.
- **after tagging an item to hole 4, holes 1-3 stay enabled and no closed-holes paragraph renders**: primary lookup retarget only; retained exact write and enabled-hole assertions.

### src/test/holeTagSingleToast.test.tsx (1 → 1)

- **counts the member own non-rejected tags on that hole plus one**: primary lookup retarget; `expect(screen.queryByRole('dialog')).toBeNull()` now waits for the glass overlay's existing exit animation. Exact toast assertion retained.

### src/test/holeWalk.test.tsx (21 → 21)

- **existing picker preselects and submits selected hole**: primary lookup retarget only. Retained `aria-pressed: true`, no write on selection and submitted `[3]` assertions. HoleWalk tests otherwise unchanged.

### src/test/coursePlaceTagging.test.tsx (11 → 11)

- **single place selects without saving then primary submits** and **batch place selection waits for primary then advances**: removed the old `getByRole('tab', { name: 'Around the club' })` click. Place choices now appear simultaneously with holes; retained no-save-on-selection and exact place-submit/advance assertions.

### src/test/holeInlineAutoplay.test.tsx (16 → 16)

- **batch hero elects contain video, keeps its still thumbnails and duration, and restarts on shot change** → **batch glass thumbnail stays still and opens the canonical read-only video viewer**.
  Old assertions: registration in `hole-tag-batch`, `object-fit: contain`, `0:42` hero duration, detach and attach on changing shot. New assertions: no video/registration in the compact glass thumbnail, correct current poster, canonical open options `{ readOnly: true, syntheticPosts: true }`, updated poster on thumbnail change. Reason: brief removes the large batch preview and makes the 52px thumbnail open fullscreen. Underlying HoleWalk autoplay and batch-open pause tests unchanged.

### src/test/holeTagBatchV3.test.tsx (28 → 28)

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

