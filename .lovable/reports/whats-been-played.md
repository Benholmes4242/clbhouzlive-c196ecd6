# BRIEF_WHATS_BEEN_PLAYED — build report

## What changed
- **Start:** restored playedRings.ts and usePlayedRounds.ts from a32cd26395. The restored playedRingsAreaTabs.test.tsx was dropped (it encoded the old wide tabs; it was never in HEAD, so it does not move the count). Kept: get_recent_rounds('everyone','14') paged to total_count and capped at 500, one golf_courses read, home via useViewerHomeClubId (primary_club_id), NEAR_KM 40, haversine, orderRings and the per-device seen state. Added course_par to PlayedRoundRow. The rounds read is now disabled for guests.
- **§1 Tabs:** buildAreaTabs gives Near you, then the home county, with label dedupe. Fallbacks: the home nation, then the busiest nation. The wider tabs are gone. Uses RailChips size="tile".
- **§2 Rings:** 72px items, 64px ring with 4px either side, 1.5px border, 21.76/17.76 radii, 2.5px inset. Glass count top-right. Label line-height 13px and variant line 12px, so everything sits on whole pixels. A tap marks the ring seen.
- **§3 Tile:** PlayedTile.tsx has the head, distance, sub line, BEST LATELY, alternating hole/course tiles (hardest first, cap 12), the no-photos tile, the faces line and the Explore button. Every tap goes to `/courses/:id`.
- **§4 Rails:** RegionRails.tsx with buildRails, topUpRail, railShowsSeeAll and the heading map. See all sets country, lens=played and removes region, then scrolls to section 08.
- **§5 Page:** LatestCoursesSection is unmounted and its gate id `latestCourses` and fallback shell are removed (the files stay). WhoPlayingCard and useCircleLatestRounds are retired from this section. The tile reads and top-up reads now gate `whoPlaying`. WhoPlayingShell is redrawn in the new shape.

## Mock vs brief
- The section and rail heads follow the mock (10/800 .18em kicker, 21/800 title) rather than SectionHead (11/700, 19/700).
- The ring row has the mock's 4px top padding on top of the brief's 14px gap.
- The rails mock shows See all on a 4-card rail. I followed the brief's rule (more than 10 played courses) and treated the mock as illustrative.

## Facts
- **Ireland / Northern Ireland sub_country:** the code vocabulary uses 'Ireland' and 'Northern Ireland' (lib/whs/countryVocabulary.ts). These were not confirmed against the data, because no SQL is run.
- **p_country:** StatBrowse passes facets.countries[].sub_country, so p_country matches golf_courses.sub_country.
- **Hole-photo read:** no single per-course RPC returns hole number, par, yards and member. I used the course page's own path, the same one useCourseGallery uses: the Media tab's hole tag list (['hole-photo-tags'], fetchHolePhotos) gives the tagged holes, then get_hole_media per hole (holeMediaQuery) gives the credited rows. No new RPC.
- **9-hole rounds:** I can't confirm from the client whether get_recent_rounds returns them. Best lately stays lowest gross.
- **Course photos:** these skip posts already used as a hole photo's source_post_id, so one photo can't show twice.

## Tests
Baseline 9,028. Now **9,049** (2,271 / 2,224 / 2,246 / 2,308). That is +21 from the new src/test/whatsBeenPlayed.test.tsx.

Authorised rewrites, old → new:
- **coursesSectionSettled.test.tsx:** added a usePlayedRounds mock only. No assertion changed.
- **proVerification2B.test.tsx "course members":**
  - Old: `expect(proReadIds()?.sort()).toEqual([...ids].sort())`. New: `toEqual([...mountedIds(name)].sort())`, where course members mount the two BEST LATELY names.
  - Added `expect(container.querySelectorAll('[data-best-entry]').length).toBe(2)`.
  - The new mocks for usePlayedRounds (gross defaults to 80+i), usePlayedTile and useRailTopUps were added.
- **coursesWholePageHold.test.tsx:**
  - Old: `expect(screen.getByTestId('courses-shell')).toBeVisible()` (×2). New: `queryByTestId('courses-shell')` is null, and `latestCourses` is not mounted.
  - 'latestCourses' was removed from the ready and hidden id lists.
- **latestCoursesSection.test.tsx:**
  - Old: "CoursesBrowsePage gates latestCourses after byRegion and renders the section between By region and The regulars", which asserted `/'byRegion', 'latestCourses', 'mostPlayed'/` and that `<LatestCoursesSection />` sits between the sections.
  - New: "CoursesBrowsePage no longer gates or mounts latestCourses". It asserts `'byRegion', 'mostPlayed'` with neither the gate id nor the element present.

## Device checks
- Signed-in checks at 375 and 320 are unchecked, because I can't sign in.
- Signed out, /courses at 375 and 320 renders with no section (guests see nothing), no sideways overflow and no page errors.
- The 320 containment for the signed-in section is checked structurally in jsdom only.

## BRIEF_WHATS_BEEN_PLAYED_FIXES

- §1 Built. The section's readiness is latched after its first ready, and useSectionReady reports only that first ready. Later ring or tab changes re-render in place. While a course's photo reads are pending, the photo row shows two 140×186 radius-14 shell Bars after BEST LATELY. The row stays 186px high.
- §2 Built after Ben's ruling. One owner writes the seen map: an effect keyed on the shown course writes its newest `whs_score_id` to state and localStorage once per change of selection — the default on load, the default after a tab change, and a tap. `select` now only sets the selection. The shown ring still draws as selected (ink border, ink count); it draws as seen (grey border, mute count) as soon as another is picked.
- §2 assertion changed (authorised): `selecting a ring stores its newest round as seen` expected `toEqual({ kent: '4' })`, now `toEqual({ near: '3', kent: '4' })`. The near entry is the default ring's write; its newest round is `3`, not `1`, because rounds `1` and `3` share the play date and `groupRounds` breaks that tie on `whs_score_id` descending.
- §3 Built. `HOLE_DIFFICULTY_MIN_ROUNDS` (20) lives in src/lib/courses/holeDifficulty.ts and is read by AllHolesSheet and by `hardestHoleFromRanks` (playedRings.ts, used by usePlayedTile). HARDEST appears only when the rank-1 row's rounds reach that minimum.
- New tests (+3): pending ring stays mounted, then swaps; pending tab change; hardest at the minimum and at one fewer.
- New test (+1, §2): `the ring whose tile is showing counts as seen on load and after a tab change` — asserts `{ near: '1' }` on load, `{ near: '1', kent: '3' }` after the tab change, and rings `['selected', 'seen']`.
- Shards: 2,271 / 2,224 / 2,250 / 2,308 = 9,053 (9,052 + 1). The §2 assertion above is the only existing assertion changed.

## BRIEF_WHATS_BEEN_PLAYED_SEEN_GUARD (seen write must never overwrite a saved map)

Fault: the §2 write effect merged into `seen` state with no signed-in member; on
the render where userId changed, state still held the previous key's map and the
write saved {old map + current ring} under the new member's key, wiping history.

Fix (src/components/courses/browse/WhoPlayingSection.tsx):
- No write until a signed-in userId: `if (!current || !userId) return;`.
- Write built from storage, not state: `{ ...(readSeen(userId) ?? {}), [current.courseId]: current.latestScoreId }`.
- Single owner, stamp and once-per-selection rule unchanged.

Tests: +1 in src/test/whatsBeenPlayed.test.tsx — "a session resolving after
cached rounds keeps the stored seen map" (stored { fife: '5' } ends as
{ fife: '5', near: '3' }; nothing written under the guest key). The session
mock became controllable via the hoisted fixture (default unchanged:
{ user: { id: 'me' }, loading: false }); no existing assertion changed.

Suite: 9,053 → 9,054 (2,271 / 2,224 / 2,251 / 2,308). Delta: +1 new test.
Typecheck: clean.

## BRIEF_WHATS_BEEN_PLAYED_V2

**STOP resolved by ruling** — the 8 failures were all in `src/test/coursesHeroPlaceScrim.test.tsx` ("Courses-only place line"): `Error: No QueryClient set, use QueryClientProvider to set one`. §1 requires `useCourseRecordHolders` in CoursesPageHero, which is a query; that test rendered the hero without a QueryClientProvider. No assertion was wrong. Ben ruled: "Mock useCourseRecordHolders" — one `vi.mock` returning an empty map, no assertions changed. Added at src/test/coursesHeroPlaceScrim.test.tsx:19; with no holder the crown fact line stays, so all 10 tests in that file pass untouched.

Reads: `get_recent_rounds('everyone','30')` paged (cap 500); `posts` status published, `course_id not null or tagged_course_ids <> {}`, created_at ≥ window start (useMomentsOfTheWeek filters); `course_ratings` is_mock false, review not null, created_at ≥ window start (useLatestReviews filters); readMemberFaces; `stat_browse_base.community_rating` for active courses without a round; useCourseMediaCounts; useCourseRecordHolders([hero], {includePlayers:false}). No new RPCs, no SQL.

Middle East / USA spellings: countryVocabulary.ts has no US or Middle East entries, so the brief's spellings are used verbatim (United States / United States of America / USA; United Arab Emirates, Qatar, Bahrain, Oman, Saudi Arabia, Kuwait, Jordan, Israel, Lebanon).

Removed: NEAR_KM, haversineKm, milesAwayText, tileDistanceText (replaced by tilePlaceText), the hero HELD comment. hero.factBestRound kept (crown fallback uses it).

Changed assertions in whatsBeenPlayed.test.tsx:
- area tabs (3 tests: Near you / patch-only) → 4 tests: county, nation, GB&I, Europe, USA, Middle East, Rest of world order; empty tabs hidden; label-repeat skip; no home → world only.
- `milesAwayText(...)` / `tileDistanceText(...) toBe('Kent')` → `tilePlaceText` county else nation.
- `g()` fixture `rounds/latestScoreId` → `activity/latestKey`.
- rings follow the tab: `toEqual(['selected'])` then Kent `toHaveLength(2)` → `['selected','new']` then GB&I `toHaveLength(3)`.
- seen `{ near: '3', kent: '4' }` → `{ near: 'round:3', kent: 'round:4' }`; `{ fife: '5', near: '3' }` → `{ fife: '5', near: 'round:3' }`.
- tab change with pending reads: clicks GB&I instead of Kent (Kent is now first).
- seen on load/tab change: fixture adds fife; `{ near: '1' }`/`{ near:'1', kent:'3' }`/`['selected','seen']` → `{ kent:'round:3' }`/`{ kent:'round:3', fife:'round:8' }`/`['selected','seen','new']`.
- Added: best lately distinct golfers.
New: whatsBeenPlayedV2.test.tsx (10), whatsBeenPlayedHero.test.tsx (3).

Suite: 9,059 → 9,074 (2,241 / 2,249 / 2,252 / 2,332), all passing. +15 = whatsBeenPlayed +2, V2 +10, hero +3. Typecheck clean. Device checks: unchecked (signed-in flows unavailable in the test browser).

---

## BRIEF_WHATS_BEEN_PLAYED_V3

### What changed
- §1 Ring count moved onto the ring box's top-right corner (top/right -7px, z-index 2, 18px tall, min 20px, radius 6px, canvas #0A0A0C, 1.5px border in the ring's own colour, 9.5px/800 tabular number amber/ink/mute by state; no glass/blur). `RING_ROW_PAD_TOP` 4 → 10, shared by WhoPlayingShell.
- §2 BEST LATELY kicker ink; to par beside the gross (10.5px/700 tabular, baseline, dim, red under par, E level, true minus); day alone under the name. Photo captions: title one line ellipsis; credit = 14px face + 5px + full name (10px, .85 white, ellipsis); course photos add " · {day}". Names fill from the section's member faces (readMemberFaces), then username. COURSE tag #FFFFFF; HARDEST unchanged.
- §3 Rail count white. Played course: 16px face + best golfer's full name (bestLately n=1: lowest gross, ties more recent), then "Best round {gross}" white 800. Posts/reviews only: get_course_media_counts → "{v} video(s) & {p} photo(s)" / one part / nothing. Star and rating removed.
- §4 Rails: home nation ("ACROSS {NATION}" / "Played lately"), ONE rest-of-grouping rail ("BEYOND {HOME NATION}" / "The rest of GB&I", or "Played lately" outside B&I), Abroad. Rest rail busiest first, max 10, never See all; See all only on home rail.
- §5 ByRegionSection and HardestSection unmounted; `byRegion`/`hardest` removed from GATE_IDS. Files kept.

### Deleted
- `useRailTopUps.ts` (stopped reading get_stat_browse_courses for this section), NotPlayedCard, `topUpRail`, `RAIL_MIN`, `RatedCandidate`, the per-nation/Ireland rail kinds and Scotland/Ireland heading map, FaceStack use on rail cards, GOLD use on rails.
- The `stat_browse_base` community-rating read in usePlayedRounds (`ratings`, `unplayedIds`) — only fed the removed star line.
- `ByRegionShell` from the page's loading fallback (its section no longer mounts). Signed-out fallback is now empty until the page is ready. The shell export remains in sectionShells.tsx.

### Points to note
- With no home club there is no home nation; the rest rail's kicker reads "ACROSS GB&I" (brief has no wording for this case).
- A course with rounds but no gross shows no best-golfer line.

### Changed assertions (old → new)
whatsBeenPlayed.test.tsx:
- rails `key` `['England','ireland','Scotland','__abroad']`, `rails[1]` `['down','kerry']` → `['home','rest','abroad']`, rest `['down','fife','kerry']`, abroad `['spain']` (test renamed to V3 §4 wording).
- `rails.some(r => r.key === 'England')` → `r.key === 'home'`.
- no-home kinds `['nation','abroad']` → `['rest','abroad']`.
- headings `railHeading('nation','Scotland')` North of the border / `('ireland')` Across the water / `('nation','Wales')` → `railHeading('rest','England')` = BEYOND ENGLAND / The rest of GB&I and `('rest','California','Rest of World')` title Played lately.
- DELETED "tops up to three in rating order…" (`topUpRail(['fife'],…)).toEqual(['b','a'])`) — top-ups removed by §3.
- See all: `kind:'ireland'` false → `kind:'rest'` false; renamed to home-rail wording.
- best lately `pars[1].style.color` `''` → `'rgba(248, 250, 252, 0.42)'` (renamed).
- "played and not-played rail cards" (`'SCOTLAND'`, NOT PLAYED LATELY, `'★ 10'`) → "rest-of rail card with no top-ups": BEYOND ENGLAND, one played card, no not-played card, no See all.
- Removed the `useRailTopUps` mock and `f.topUps` fixture (module deleted).
whatsBeenPlayedV2.test.tsx:
- `[data-activity-stat]` `'★ 9.1 · 4 photos'` → `'4 photos'` (renamed "…or media counts (V3 §3)"); removed `useRailTopUps` mock/fixture.
coursesWholePageHold.test.tsx:
- `getByTestId('region-shell')` visible (both tests) → `queryByTestId('region-shell')` null; hidden/ready id lists drop `byRegion`,`hardest`; list parent check uses `mostPlayed` instead of `byRegion`.
latestCoursesSection.test.tsx:
- `/'byRegion', 'mostPlayed'/` → `/'whoPlaying', 'mostPlayed'/`; `<ByRegionSection />` before MostPlayed → `<WhoPlayingSection />` before MostPlayed.

New: `src/test/whatsBeenPlayedV3.test.tsx` (10 tests).

### Device checks
Signed-out page at 320 checked: By region and Tough tracks absent, no horizontal overflow. Signed-in section at 375/320 unchecked (sign-in unavailable in automated browser).

### Suite
`npx vitest run --shard=i/4` ×4: 2,274 / 2,231 / 2,254 / 2,324 = 9,083 passing, 0 failing. Baseline 9,074 → 9,083: +10 (whatsBeenPlayedV3.test.tsx) −1 (deleted top-up test) = +9. Typecheck (`npx tsgo -b --noEmit`) clean.

---

## FIX_COURSES_GUEST_LOADING_SHELL (2026-11-17)

**Fault.** Since 95dcf08fbd removed ByRegionSection, the PageLoadGate fallback in
`src/components/courses/CoursesBrowsePage.tsx` rendered only `{user && <WhoPlayingShell />}`,
so a signed-out visitor saw an empty area until the gate opened.

**Fix.** The fallback now renders the first section a signed-out visitor actually sees, using
that section's own existing shell:

```
{user ? <WhoPlayingShell /> : <PhotoRailShell count={MOST_PLAYED_COUNT} />}
```

`PhotoRailShell` is imported from `./browse/sectionShells` and `MOST_PLAYED_COUNT` from
`./browse/PhotoFigureCard` — the same shell and the same count `MostPlayedSection` uses for
itself. No new shell, no geometry change, no other section touched. Signed-in visitors keep
`WhoPlayingShell` first.

**Test.** `src/test/coursesWholePageHold.test.tsx` gains one test: signed out the fallback shows
the Most played shell and not the circle shell; signed in it shows the circle shell and not the
Most played shell. No existing assertion changed. The `sectionShells` mock gained a
`PhotoRailShell` entry — a mock export, not an assertion (a mock missing an export the page now
imports is broken, not smaller).

**Suite.** 9,083 -> 9,084 (one test added, none deleted, renamed or rewritten).
Shards: 2,275 / 2,231 / 2,254 / 2,324, all passing; baseline shards were 2,274 / 2,231 / 2,254 / 2,324.
Typecheck clean (`npx tsgo -b --noEmit`).

**Not checked.** The signed-out Courses page in a real browser: the preview at
http://localhost:8080 renders the page, but the shell-to-content handover was verified only
through the test, not by eye.

## BRIEF_WHATS_BEEN_PLAYED_V4

**What changed**
- Courses page hero location line: amber → ink #F8FAFC (`placeColor={A.INK}`); size, weight, position and record row unchanged.
- Tile head: title is `shortCoursePart` (full name, e.g. "Sundridge Park (East Course)"), 18px/800 ink, line-height 22px, 2-line clamp; sub line "Through members' eyes" only; county removed (`tilePlaceText` deleted, now unused). Explore keeps the short name. The head is no longer a tap target. WhoPlayingShell keeps its one 22px title bar; its county bar (72px) was removed so the shell draws no bar for absent content.
- Taps: Best lately (incl. "{n} rounds lately ›") and the faces line → `courseLatelyHref(id)` = `/courses/:id?tab=course&section=lately`. Photos → canonical viewer (`tilePhotoViewer.ts`), never navigate. Explore, the no-photos tile and Add a photo → course page top (unchanged).
- Rail cards no longer navigate; they open `PlayedTileSheet` (canonical BottomSheet, the one OurRecordSheet uses): top radius 22, grabber 36×4 rgba(255,255,255,.22) 8px from top, tile 8px under it with 16px sides, bottom 30px + safe area, max 90vh, swipe/backdrop close. Same PlayedTile + usePlayedTile for that course; placeholders while photos load. Sheet navigation closes the sheet then navigates via `afterSheetHistorySettled`.
- Seen: WhoPlayingSection's single seen effect now also stamps the sheet's course.
- Course detail masthead kicker: new `kickerColor` prop on CourseMasthead (default amber); GolfClubView passes `A.INK`. Other mastheads unchanged.
- GolfClubView: `useLatelyDeepLink` reads `section=lately` once, waits for `[data-course-lately="ready"]`, scrolls it under the islands with `chromeClearancePx()` on its scroll owner, then deletes `section` with replace. Absent Lately (loading then gone, error, or 10s with nothing) → tab top, param cleared.

**Tab id used for Lately:** `course` (CourseLatelySection renders in CourseAboutTab, the default course tab).

**Viewer paths:** hole photos → the hole's get_hole_media rows (holeMediaQuery, already read by usePlayedTile) → `holeShotsToFeedPosts` → `openWithOrigin`, opened on the tapped row's media id. Course photos → the course's get_course_media_v2 set (galleryCourseMediaQuery) → `coursePostsToShotPosts` → `openWithOrigin`, opened on the tapped post's media. `openedFrom: 'courses-whats-played'`, readOnly, synthetic.

**Departures to rule on**
1. Viewer above the sheet: FS_OVERLAY_Z (200) sits below every BottomSheet (1400), so from the sheet the viewer opens at `VIEWER_ABOVE_SHEETS_Z` (12200), the registry's value for a viewer opened from a sheet. From the page it stays FS_OVERLAY_Z.
2. Sheet surface #141418 and backdrop 0.6: the BottomSheet canon forbids caller backgrounds, so I added a named variant `surface="panel"` (default `canon` unchanged for every other sheet).
3. NOT BUILT — LATEST REVIEW card: §3 says open "the course page on its reviews the way Latest reviews does today", but Latest reviews does not open the course page; it opens the read-review sheet (`useReviewSheetStore.open`). The clauses disagree, so the card keeps its V3 tap (course page top) pending your ruling.

**Changed assertions (authorised §7)**
- `whatsBeenPlayed.test.tsx` — deleted "head right reads the county, else the nation" (`tilePlaceText({ region: 'Kent', … })` → `'Kent'`; null region → `'England'`): the county and its helper are removed.
- `whatsBeenPlayedV2.test.tsx` — "…county in the head; played line" → "…no county in the head; played line"; `[data-tile-place]` text `'Kent'` → element `null`.
- `coursesHeroPlaceScrim.test.tsx` — "keeps the existing one-line place style, with amber…" → "…in ink…"; colour `A.AMBER` → `A.INK`.

**New tests:** `src/test/whatsBeenPlayedV4.test.tsx` (11): tile head; Best lately/faces → Lately link; photo taps open viewer (hole + course) without navigating; Explore → top; rail card → sheet, seen, no navigation; sheet photo above sheet; sheet Best lately closes then navigates; deep link scrolls once and clears; absent Lately lands at top; GolfClubView wiring; kicker tone.

**Suite:** 9,084 → 9,094 (+11 new, −1 deleted). Shards 2,275 / 2,231 / 2,260 / 2,328, all passing (baseline 2,275 / 2,231 / 2,254 / 2,324). Typecheck clean.

**Unchecked:** device checks at 375 and 320 (signed-in only; the test browser cannot sign in). Scroll position kept on sheet close is left to the BottomSheet's own scroll lock and is not asserted in jsdom.

## Amendment V4 §3 — one sideways viewer page
`tilePhotoViewerArgs(row, tapped, course, coursePosts)` builds ONE synthetic post (`shots:played:<courseId>`) from the tile's already-loaded rows, mediaItems in row order, landing on the tapped photo via mediaId; posts length 1 so no vertical neighbours. Credits/videos from the canonical converters. In the sheet the viewer uses VIEWER_ABOVE_SHEETS_Z (FS_OVERLAY_Z sits below the sheet layer; reported, unchanged from V4). whatsBeenPlayedV4.test.tsx: replaced "hole and course photos open the viewer…" (asserted per-photo single post) with the row-order/index 2 test; extended the sheet test. Count unchanged at 11 in file; full suite not rerun.

## FIX_LATEST_REVIEW_TAP (2026-11-17)
- LATEST REVIEW card (incl. "{n} reviews lately ›") now opens that review in the review sheet; never navigates. The handleReviewTile mapping moved verbatim into `browse/useOpenLatestReview.ts`; CoursesBrowsePage and PlayedTile both use it (one copy). Tile fields the card lacks (username, breakdown, media) pass null.
- Rail sheet: the sheets cannot stack — ReviewBottomSheet sits at REVIEW_SHEET_Z 240, below BottomSheet's 1400 — so the tile sheet closes first, then the review sheet opens.
- Kicker amber → ink #F8FAFC (A.INK). Nothing else changed.
- Tests: new `src/test/latestReviewTap.test.tsx` (+3). No existing assertion changed.
- Full suite after 7a7bec2b4e + this fix: 2,275 / 2,227 / 2,260 / 2,335 = 9,097 passing (9,094 + 3). Typecheck clean (tsgo). Device checks unchecked (signed-in).

## BRIEF_PLAYED_MEMBER_MEDIA_AUTOPLAY (2026-11-17)

- **Read per rail card:** `get_course_media_v2` with `p_filter 'all'`, `p_page_size 1`, first row only, own key `['course-newest-media', courseId, userId, actorType, actorId]` (new `useNewestCourseMedia.ts`). Signed in passes `p_user_id` plus viewer actor; signed out passes `p_user_id: null` and no actor. Verified against the live API with the public key: for Yas Links Abu Dhabi the signed-out call returns rows. `get_latest_course_media` is denied to signed-out callers ("permission denied"), so it was not usable; no new RPC needed.
- **Deferral:** `useNearViewport` IntersectionObserver, rootMargin 400px, disconnects after first hit; query is disabled until then.
- **Review media:** yes. The Yas Links row returned is review media (`source_review_id` set).
- **Fallback:** `CourseImageFallback` with `thumbnail_image` always drawn; member media layers on top only once loaded (pending or none → stock image, no blank, no shift). Overlays and tap unchanged.
- **Autoplay:** hole videos and course post/review videos in the tile row (main and sheet) and video rail cards render `HoleInlineVideo` fit cover, active, group `courses-member-shots`; poster underneath. Photo tiles unchanged; video tile taps open the sideways viewer as before.
- **Tests:** new `src/test/playedMemberMediaAutoplay.test.tsx` (6). No existing assertion changed.
- **Suite:** run sequentially in four shards: 2,275 / 2,227 / 2,259 / 2,342 = 9,103 (9,097 + 6). One failure on shard 1: `coursesRailsUnlimited.test.tsx` › "admin hole-tag predicate invalidation refetches the active infinite holes rail" (could not find hole button). File untouched by this brief; passed 3/3 alone. A first attempt with shards in parallel had 4 timeouts/flakes in untouched files (ms1MessagesHeadToHead, guestStage24, avatarFallbackCanonical, claimClub), all passed alone.
- **Typecheck:** `npx tsgo -b --noEmit` clean.
- **Device:** unchecked (sign-in unavailable); 320 overflow unchecked visually, no geometry changed.
