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
