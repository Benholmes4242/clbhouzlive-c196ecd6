# Tour rebuild: verification against the brief, and the retirement list

8 September 2026. Page verified at 423×1800 on `/tour`, signed out, real data.
Nothing retires and nothing cuts over until Thursday's four checks pass.

## Verification, point by point

| Brief point | Result |
| --- | --- |
| One page, one scroll, on the Amateur skeleton | Pass. `src/pages/TourPage.tsx`: header, hero, then four blocks in one scroll. |
| Fixed transparent-to-solid header | Pass. `TourHeader.tsx` fades to solid on scroll. |
| 340px full-bleed three-state hero | Pass. All three states reviewed and accepted 7 Sep. Today reads JUST FINISHED — champion Thriston Lawrence −18, Omega European Masters, Crans-Sur-Sierre. |
| Header owns the safe area, page pays nothing at top | Pass. Hero bleeds under the bar; page top padding is 0. |
| `NAV_CLEARANCE` at the foot | Pass. No flat number. |
| No tabs, no burger | Pass. Nothing survives of the six-tab or drawer navigation. |
| Picker governs leaderboard + Our Picks only | Pass. Coming Up and the wire are cross-tour by design, stated in the file comments. |
| Picker and board are two views of one state | Pass. Tour → season race, race chip → tour. Cannot disagree. |
| Colleges the one exception, dimmed, reads "Colleges" | Pass. |
| Leaderboard chip absent when nothing is live | Pass. Today the row is six race chips and no Leaderboard. |
| A chip only exists if its board has rows | Pass, five-row floor. **Race to Dubai is back** — 225 rows, chip present today, where on 7 Sep it was hidden at 1 garbage row. |
| Board counts are real and state their basis | Pass. "219 players · PGA Tour season". |
| Ten rows, see-all pushes rather than expanding | Pass. "SEE ALL 219" → `/tourhub/rankings?board=…`. |
| Round avatars for players, square marks for schools | Pass, same row component. |
| Our Picks: two identities | Pass. Today backward: "How our picks did · PGA Tour · TOUR Championship", finishing labels FINISHED T14 / T4 / T21, reasoning, and the sample-qualified record line "2 of 3 picks finished inside the top 20". |
| No confidence figure, no win percentage | Pass. |
| Coming Up: five dated rows, real count, see-all | Pass. 41 events, see-all → `/tour/schedule`. |
| Tour News reuses the Amateur wire shape | Pass. `TourNewsBlock.tsx` reuses `LeadStory`/`StoryRow`/`useTourStories`; one lead plus two rows. |
| Empty sections render nothing | Pass. Champions out of tournament shows no board at all — confirmed. |
| True minus, under par red, over par ink | Pass. −18, −9, −11, −5 rendered from numeric to-par. |
| Amber only for the viewing member | Pass. No amber on this page; nothing here is the viewer. |
| No new radii | Pass. Existing tokens only. |
| `tourhub_tab_viewed` / `tourhub_tab_changed` preserved | Pass. `/tourhub` still stands, still reporting, until cutover. |
| No nested scrolling, no layout shift | Pass. Chip rails scroll horizontally with a partial chip visible at the right edge; no label clipped mid-word. |
| Console | Clean on load. |

Untestable until Thursday, and recorded as such: the LIVE hero on real data,
the Irish Open prediction generating when Sportradar publishes the field, and the
picks block flipping from backward to forward on its own.

## Retirement list

Method, not a spot check: every one of the 247 files under
`src/features/tourhub/` was resolved through its real import graph, and the
transitive closure taken from every file *outside* that directory. 200 files are
reachable from outside and therefore not touched by a delete pass. 47 are
reachable from nowhere outside the hub.

### Files that must MOVE rather than be deleted

These are inside `features/tourhub` but imported by courses, amateur, admin,
search, feed, profile or the new Tour page. They move to a shared location at
cutover:

- `_shared/tokens.ts` and `overview/tokens.ts` — 30+ outside consumers each. The
  largest single dependency in the app on this directory.
- `_shared/scoreColor.ts`, `_shared/heroGradient.ts`, `_shared/resolvePlayerAvatar.ts`,
  `_shared/tourOrder.ts`, `_shared/PlayerInitialAvatar.tsx`, `components/PlayerAvatar.tsx`
- `news/*` — `NewsTab`, `StoryPage`, `StoryShapes`, `WireFeedSlide`, `blocks.ts`,
  `parseStoryText`, `resolveStoryMarkers`, `useTourStories`, `NewsChromeBridge`.
  Clubhouse, admin and the whole Amateur wire sit on these.
- `hooks/useOverviewData.ts`, `hooks/useAIPredictions.ts`, `hooks/useAnyTourLive.ts`,
  `hooks/useVenueImage.ts`, `hooks/useCourseImageResolver.ts`, `hooks/useCollegeMovers.ts`
- `players-v2/data/usePlayersRanking.ts`, `college-v2/hub/data/useFranchiseStandings.ts`
- `overview/data/usePickLiveState.ts`, `overview/sections/tiVerdict.ts`, `overview/sections/SectionShell.tsx`
- `utils/fmtScore.ts`, `utils/majorScope.ts`
- `components/overview-v3/HybridHero*` — pulled by `CoursesPageHero`, the last
  round card and `useTournamentsCache`. Awkward, and it moves rather than dies.

### Files with no outside consumer — the removal set

47 files, safe to delete the moment `/tourhub` itself is unrouted. Notably:
`overview/sections/TIPicksCarousel.tsx` (superseded by the dark picks block),
`components/overview-v3/TISlot.tsx` (the dead code that was suppressing
prediction generation), `HybridHeroBands/CinematicFrame`, `CinematicHeroFullBleed`,
`InsightSheet`, `TourSwitcherAffordance`, `SectionTourLens`,
`ConnectHandicapTile`, `TeeTimesBand`, and 30-odd unused hooks and utils
(`useLiveArena`, `usePowerLadder`, `useWorldRankings`, `useElitePlayers`,
`usePredictionTracker`, `useTournamentScoring`, and so on). Full list in the
reachability output; it is regenerated at cutover rather than trusted from today.

### Also going, outside the hub

- `src/pages/HomeLanding.tsx` — second unrouted Overview consumer — and its lazy
  import in `App.tsx`.
- Compare Schools: its route, its `registry.ts` entry and its chrome exclusion.
  College *profile* pages stay.

### One caveat, stated plainly

This set is "unreachable **while `/tourhub` still stands**". Removing the hub's
own routes will make a further tranche unreachable. The list is therefore
computed twice: once now, for planning, and again at cutover, for the delete.
