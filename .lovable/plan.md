# Tour Overview Magazine

## Goal
Rebuild the Tour Hub Overview as one editorial stream using the same visual grammar as Explore: photograph, kicker, sentence headline, and meta. The tournament remains the dominant lead unit, while stories, course, insight, schedule, and rankings differ by shape and scale rather than by unrelated section treatments.

## Page structure
1. Replace the current hero-plus-eight-section stack in `OverviewPageV3` with a magazine stream in this order:
   - lead tournament card, including its existing live board and field figures beneath the editorial lead
   - lead story
   - Coming up rail
   - second story
   - Course of the week card
   - World rankings rail
   - third story
   - College franchise insight card
2. Skip settled-empty units without reserving space. Show shape-matched loading shells while unresolved, and a quiet retry row for failed rails rather than treating errors as empty.
3. Keep one vertical page scroller. Rails may scroll horizontally, with stable widths and no nested vertical scrolling.
4. Use the shared Explore view-chip primitive for the tour lens, preserving the existing selection context, stored default, and hero/tour synchronization behavior.

## Shared magazine unit
- Add a Tour Overview magazine unit modeled directly on `ExploreCard`: shared radius, photograph heights, glass chips, kicker scale, headline scale, caption spacing, truncation, and fallback-image behavior.
- Support these variants without separate visual grammars:
  - **Tournament lead:** large photograph; live/tour glass chip; event-name kicker; sentence headline; place and round-state meta; existing six-row board, full-leaderboard destination, and field figures rendered flat beneath it.
  - **Story:** photograph; event/day kicker; existing editorial headline; standfirst on the lead story only; story destination.
  - **Course:** photograph; membership-backed rank chip; course-of-the-week/name kicker; sentence headline; canonical `region, sub_country` place; course and Top 100 destinations.
  - **Insight:** no photograph; College franchise sentence and existing figures/table rendered as the visual content; college destination and existing view/tap analytics retained.
- No bordered panels inside units, no nested boxes, and no page-level horizontal overflow.

## Typed, localized headline builders
Create pure typed headline helpers and locale keys in all six supported locales (`en`, `de`, `es`, `ja`, `ko`, `en-XA`). No prose will be read from tournament tables; story headlines and the existing College editorial sentence remain their authoritative editorial copy.

Tournament templates and safe fallbacks:
- **Live, clear leader:** “{leader} leads by {margin} at {venue} with {remaining} to come.”
  - Requires a unique leader, a positive score gap to second, venue, and a truthful remaining-round phrase.
  - Missing remaining phrase → “{leader} leads by {margin} at {venue}.”
  - Missing margin → “{leader} leads at {venue}.”
  - Missing venue → “{leader} leads by {margin}.”, then “{leader} leads.”
- **Live, tied:** “{leaderA} and {leaderB} share the lead at {venue} on {spokenScore}.”
  - More than two tied leaders uses a localized count form rather than naming only two.
  - Missing score → shared-lead sentence without the score.
  - Missing venue → shared-lead sentence without the venue.
- **Live, final round:** “{leader} takes a {margin}-shot lead into the last day.”
  - Requires a unique leader and real positive margin.
  - Missing margin → “{leader} leads into the last day.”
- **Complete:** “{winner} won by {margin} at {venue}.”
  - Playoff/tied regulation uses a playoff-specific result, never a zero-shot win.
  - Missing margin → “{winner} won at {venue}.”
  - Missing venue → “{winner} won by {margin}.”, then “{winner} won {event}.”
- **Upcoming:** “{defending champion or field note} — {event} starts {when}.”
  - Defending champion available → localized defender-led sentence.
  - No defender but a truthful field note exists → field-note sentence.
  - Neither → “{event} starts {when}.”
  - Missing countdown/date → “{event} is next.”
- **Course of the week:** “{ordinal} in {list}, and the {count} members who have played it rate it {rating}.”
  - Rank/list missing → ratings sentence only.
  - Played count missing → review-count basis if available.
  - Rating below its established sample floor or missing → rank sentence only; never print an unsupported rating.
- **Tournament Intelligence:** “Our pick: {player}, {spokenScore} through {rounds}.” only when a real scoped prediction and current score/round facts support every clause.
  - Pre-event prediction → localized pick plus win probability when present.
  - Missing live score/round → localized pick-name sentence only.
  - No scoped prediction → omit the card completely.
- **College insight:** reuse the existing editorial headline; if absent, retain the current localized close-race/runaway fallback.

Use the established score formatters: spoken to-par in prose and symbolic true-minus values only in chips/figures. Margin is always derived from sorted leaderboard scores and emitted only for a unique leader or confirmed winner.

## Existing data and behavior
- Keep `useHeroCarouselData`, `useTourLeaderboard`, live round detection, course-shape reads, field-stat calculations, `useComingUp`, `useTourStories`, `useRankingsBoards`, `useCourseOfTheWeek`, College hooks, and Tournament Intelligence hooks/query keys unchanged.
- Move composition around those hooks rather than changing RPCs, tables, polling, cache keys, filters, or instrumentation.
- Preserve reachability for tournament detail/full leaderboard, full schedule with its lens, all stories, full rankings/stats, course detail/Top 100, player pages, and college golf.
- Preserve the course rating floor, truthful failed-read behavior, membership-derived rank/list labels, and `coursePlaceLine` geography.

## Course shape and Tournament Intelligence
- Remove both collapsed accordions from the lead band.
- **Course shape:** promote it into the flat tournament lead body only when real round/hole facts exist; otherwise omit it. It will not remain behind a disclosure control.
- **Our picks:** Tournament Intelligence is active: `useAIPredictions(tournamentId)` has current consumers in the hero and picks surfaces, and returns scoped `topContenders`. Promote the top supported prediction into a stream card using the sentence rules above. Keep its deeper case/player destinations where data permits; omit it when no prediction exists.
- This deliberately supersedes the current `HeroBoardSection` comments/ruling that permit two collapsed rows. The brief wins, and the contradiction will be recorded in code comments and the completion report.

## Retired files and compatibility
- Do not delete files. Remove Overview imports only after the replacement stream is wired.
- Record every displaced section/wrapper on the dead-file list with an exact outside-importer count, distinguishing real imports from self-references, comments, skeleton references, and constants imported by News pages.
- Keep files that still have any outside consumer; only mark their Overview treatment retired.
- Update the Overview skeleton to mirror the new stream without altering unrelated Tour, News, Schedule, leaderboard, or tournament-detail surfaces.

## Verification
- Add focused tests for every headline branch and missing-fact fallback, tie/margin safety, spoken versus symbolic score output, story ordering, settled-empty/error behavior, and all six locale key sets.
- Run focused tests, the production build, locale JSON parsing, and whitespace checks.
- In Playwright, capture the Overview at 320px and 390px widths, save screenshots, and measure `scrollWidth === clientWidth` for the page while confirming rail overflow is local.
- Exercise live and no-live/upcoming fixtures where available; confirm the upcoming lead is a sentence and that all destination controls navigate correctly.
- If authenticated or feed-state verification is unavailable, report the exact limitation without claiming those states were visually exercised.
