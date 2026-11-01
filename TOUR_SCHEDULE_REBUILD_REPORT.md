# TOUR SCHEDULE REBUILT — report

Brief: BRIEF — THE TOUR SCHEDULE, REBUILT + schedule-signed-off.html. Build matches the mock: layout, sizes, colours, copy, behaviour. No SQL, migrations, feed_config, RPC, edge-function or native/Median changes. No negative letter-spacing added (the pre-existing FIGURE -0.02em header stat style is unchanged legacy, not new).

## 1 — The major bug
Removed `'charles schwab cup championship'` from `CHAMPIONS_MAJOR_KEYWORDS` in `src/features/tourhub/utils/tournamentClassification.ts`. It now classifies as `CHAMPIONS TOUR EVENT` and gets the SEASON FINALE tag.

Surfaces reading `getContextLabel` / `isMajor` (all corrected by the one change):
- `schedule-v2/useSeasonTimeline.ts`, `schedule-v2/useMergedSchedule.ts` (schedule rows, next-major pick)
- `overview/sections/comingUpRules.ts` + `overview/data/useComingUp.ts` (Coming up major marking)
- `overview/sections/AlsoThisWeek.tsx`, `overview/sections/useOverviewNewsData.ts`
- `utils/majorScope.ts`, `hooks/useTourPickerRows.ts`, `hooks/useHeroCarouselData.ts`
- `player-v2/sections/TournamentsSection.tsx`, `tournament-v2/sections/MiniBoard.tsx`
- `news/StoryBody.tsx`, `news/NewsTab.tsx`, `leaders-v2/boards/AlmanacBoards.tsx`
- `leaderboard/LiveBoard.tsx`, `leaderboard/BoardTable.tsx`
- `components/overview-v3/HybridHeroBands/{LeadersGroup,LastYearRow,HeroBoardBand}.tsx`
- `components/TourSwitcherAffordance.tsx`, `features/search-v2/components/SearchEmptyState.tsx`

## 2 — Next major
Card above the list (margin 18px 16px 6px, padding 14, radius 16, #141418, 1px rgba(255,255,255,0.08), gap 14): 64px days-away column (26/800 over DAY/DAYS 9/800/0.14em), then NEXT MAJOR 9.5/800/0.14em, displayEventName 16/800, "{venue} · {EEE d MMM yyyy}" 12.5 INK_MUTE. Tap opens the event. Uses the same upcoming-major pick as the old header figure (`nextMajorDays`), which it replaces; PLAYED/REMAINING stats and the progress bar stay.

## 3 — Weeks, not months
`timelineUtils.ts` gains Monday→Sunday week helpers (noon-UTC anchored, timezone-safe); both timeline hooks bucket by week and sort within a week by start date, then tour order pga→liv→euro→lpga→pgad→champ (`ROW_TOUR_ORDER` in `scheduleRules.ts`). Sticky week headers: 22px 24px 8px, hairline under, left 11/800/0.16em (INK for THIS WEEK, INK_MUTE otherwise), right 12/600 dim date span, THIS WEEK adds " · n events". THIS WEEK section bg rgba(255,255,255,0.025), header #0E0E11. Anchor scroll offset now measures the real week-header height (`--tour-week-h`, replacing `--tour-month-h`) so the first row lands fully clear of the sticky header.

Interpretation noted: for weeks other than LAST/THIS/NEXT the left label already carries the range ("16 – 22 Nov"), so the right side is empty rather than duplicating it.

## 4 — The row
`SeasonRow.tsx` rebuilt: grid 40px | minmax(0,1fr) | 104px, gap 12, padding 14px 24px, hairline under. Date block (two-digit day 20/800 over weekday 9/800/0.12em), tour label 9.5/800/0.12em + one neutral tag, name 15/700 two-line clamp, venue 12px ellipsis, dates 11.5 dim. Tag priority MAJOR → SEASON FINALE → PLAYOFFS → TEAM, 16px-high neutral outline, never amber. Venue reads "{venue} · {city}", country only with no city, region words (Asia, Caribbean, …) dropped. Right column: DEFENDS+headshot+purse / PURSE alone / nothing / LEADS · R{n} (#3DDC97 + 6px dot) / LEAD · R{n} tied / WON, 22px SquircleAvatar headshots via resolvePlayerAvatarCandidates, scores 16/800 through getScoreColor, surnames never wrap. The amber CHAMPION label and the venue-line LIVE word are gone. `currentRound` derives from the leader's non-null round scores (+1, capped at 4).

Tags this season (from the data visible in the mock's window): DP World Tour Championship and Charles Schwab Cup Championship → SEASON FINALE; Abu Dhabi Aldar Championship → PLAYOFFS; majors → MAJOR; team events (event_type 'team') → TEAM. Live data will tag per the same rules.

## 5 — You, in amber (members only)
Followed leader/winner: who line amber with "★ " prefix. Followed players in the field: "★ {S} in the field" / "★ {S} and {S} in the field" / "★ {S}, {S} and {n} others in the field" under the dates, 7px above, 12/600 AMBER. "You've played here" when the event's golf_course_id is among the member's rounds. Guests get none of this (both reads are member-gated).

## 6 — This week button
Restyled portal: centred, 16px above the bottom nav, 40px high, padding 0 16px, radius 999, rgba(20,20,24,0.92) + blur(12px), 1px rgba(255,255,255,0.18), shadow 0 8px 24px rgba(0,0,0,0.4), up arrow + "This week" 13/700. Shown only when the THIS WEEK section is fully off screen (falls back to the former anchor-distance rule off-season); tap smooth-scrolls back.

## 7 — Data, in batches
Tournaments/leaders/champions as today. Follows from the cached `useTourPlayerFollows`. New `useScheduleFieldPlayers`: ONE sr_tee_times round-1 read for upcoming events starting within 14 days + ONE sr_leaderboards read for live events. Own rounds via the existing `useComingUpOwnRounds` over the season's linked course ids. Defending-champion headshots resolved by name via the existing `useScheduleDefendingChampionPhotos`. Never one query per row.

## 8 — Tests
- `src/test/scheduleRebuild.test.tsx` (new, 15): classification (Schwab not a major; six senior-major keywords still are), week grouping/relations/ranges, date spans, purse short form, tag priority, venue regions, right-column model, followed field names.
- `src/test/scheduleSeasonRow.test.tsx` (rewritten, 11; was 5). The old file encoded the replaced design; changed assertions, old → new:
  - "renders the completed kicker and one score/name figure stack without avatars" (`Korn Ferry · 10 Sep` kicker, CHAMPION amber, no img, grid `minmax(0,1fr) auto`) → "renders the date block, kicker, two-line name, venue and date span in the signed-off grid" + "completed: WON stack with headshot, surname and score coloured by getScoreColor" (grid `40px minmax(0,1fr) 104px`, headshot present, CHAMPION gone).
  - "never renders the purse and still ellipsises the venue line" (`no '$' anywhere`) → purse IS now shown for upcoming rows ("upcoming with a defending champion…", "upcoming without a defender…"); venue ellipsis retained.
  - "renders no meta line for an event with no live marker and no venue" → covered by "no tag for an ordinary event" and the venue-line region test.
  - "keeps only Live green and renders a tied leader in the figure stack" (venue-line LIVE word) → "live tied: no headshot, the tied count line in muted ink" + "live outright leader: green label with the live dot" (venue-line LIVE word removed per §4).
  - "uses a defender stack or collapses the right column when no defender exists" → "upcoming without a defender shows the purse alone; neither known shows nothing".
- i18n mock: the canonical full react-i18next mock (initReactI18next + defaultValue t); assertions are structural (sizes, colours, grid, presence) plus untranslated content (names, scores, dates, venues, purses), never translated words.

## Totals
Full sharded suite: **5,590/5,590 across 526 files** (shards 1,411 + 1,321 + 1,443 + 1,415), zero failures. Baseline 5,569/525 → **+21 tests, +1 file**: scheduleRebuild.test.tsx (+15/+1), scheduleSeasonRow.test.tsx (+6 net, 5→11). `npx tsgo --noEmit` clean.

## 9 — Proof
390×844 screenshots under `/tmp/browser/schedule/`. The guest join card gates the Tour schedule for signed-out sessions, so the page itself is unit-tested (26 tests above); member-only amber lines (your players, played here) are unit-tested via the `you` prop and cannot be captured signed-out.

## Not verified
Signed-in live run on a device (field lines, played-here, next-major card against real data); the tag list per event is derived from rules, not yet eyeballed against the live season.
