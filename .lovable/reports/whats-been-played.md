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
