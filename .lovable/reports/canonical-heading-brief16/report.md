# Brief 16 — Tour hub overview hero band section heads — STOPPED (unauthorised test failures)

Status: build complete and typechecks; the full suite has 19 failures in seven test files outside the brief's authorised list. Per the standing rule, STOP AND REPORT. No unauthorised test was edited. The 26 failures in authorised files were also left unedited pending the ruling, so the authorised updates can be done together with whatever Ben rules. Captures (§6) not taken yet: they follow the ruling.

## Files changed

New
- `src/features/tourhub/_shared/CanonSectionHead.tsx` — the one shared primitive (eyebrow + live dot, wrapping h2, action on the title's last line). Brief 15's OverviewSectionHead and the new HeroSectionHead both render through it.
- `src/features/tourhub/components/overview-v3/HeroSectionHead.tsx` + `heroSectionHead.css` — `--hero-head-gap: 28px`, `--hero-head-side` 20 (16 under 340), `.hero-head-cols` (margin-top 10), `.hero-head-lead` (mock `.lead`). `--hero-section-gap` unchanged.
- `src/features/tourhub/components/overview-v3/heroHeadRules.ts` — one pure function per section, rules a–s.
- `src/test/heroHeadRules.test.ts` (68 tests), `src/test/heroHeadRender.test.tsx` (14 tests).

Changed
- `overview/sections/OverviewSectionHead.tsx` (renders through the primitive; output unchanged).
- `HybridHeroBands/HeroBoardBand.tsx` (RoundMovementBand head; structured picks intro for the live block), `LiveHeroBoard.tsx`, `LeadersGroup.tsx` (state line removed, becomes the title), `LivePicksBlock.tsx` (right-hand `data-live-picks-heading` removed; order title → sentences → door → rows), `PicksBlock.tsx` (tee-day label + measure span + ResizeObserver removed; completed FINAL removed; order title → rest → door → cards). The live-phase card branch used only by the tournament page keeps its old heading (outside rules k/o).
- `LiveOverviewSections.tsx` (LiveFirstTees, LiveCourse), `UpcomingOverviewSections.tsx` (YourUpcomingPlayers, UpcomingLastYear both variants, UpcomingCourse), `SeasonRecapSections.tsx` (RecapFacts, RecapStandings, RecapCardList, RecapOurRecord), `tournament-v2/sections/CompletedWeekBlock.tsx` (both pages).
- Six locales: new `overview.heroHead` block. de/es/ja/ko carry English (as brief 15), en-XA pseudo-accented.
- CSS clean-up (grepped first): removed `.cw-kick`, `.cw-sub`, `.cw-hrow .cw-kick`, `.upcoming-kicker` and its two child rules, `.upcoming-players-line`, `.recap-head`, `.recap-link`, `[data-recap-record]` head/link rules, `.recap-foot`, `.upcoming-course-link`, `.pick-overview-verdict`, `.live-picks-full/short`. `.recap-kicker-only` had no stylesheet rule. `.recap-next-up-kicker` kept (still used by the NEXT UP footer, out of scope). `.upcoming-sec`/`.upcoming-block`/`.recap-block` keep their CSS; heads zero their top padding inline so `overviewTypeScale.test.tsx:49` stays green.
- `LiveCourseExtras` keeps an optional, ignored `lead` field so `tourLiveStates.test.tsx:117` still typechecks without an edit.

## Shard table (four sequential commands, `bunx vitest run --shard=N/4`)

| Shard | Files | Tests | Passed | Failed |
|---|---|---|---|---|
| 1/4 | 224 | 2,490 | 2,481 | 9 |
| 2/4 | 224 | 2,486 | 2,475 | 11 |
| 3/4 | 224 | 2,505 | 2,494 | 11 |
| 4/4 | 223 | 2,819 | 2,805 | 14 |
| Total | 895 | 10,300 | 10,255 | 45 |

Baseline eccb6eb: 10,218 / 893. Delta +82 tests / +2 files = heroHeadRules.test.ts (68) + heroHeadRender.test.tsx (14). No test deleted, renamed or rewritten. weightCanonSweep passed, no allowlist entry.

## STOP — failures outside the authorised list (19 tests, 7 files)

All come from removals the brief requires (state line, right-hand labels, kicker h2s/classes, paragraphs). None is a logic regression: the delay, zone and day rules they cover now feed the titles.

| File:line | Test | Message |
|---|---|---|
| effectiveCurrentRound.test.tsx:97 | picks heading reads ROUND 3 · DELAYED | expected undefined to be 'ROUND 3 · DELAYED' (`.live-picks-full` removed; eyebrow now OUR TOURNAMENT PICKS · DELAYED) |
| effectiveCurrentRound.test.tsx:102 | leaders' group shows round 3 delayed… | expected undefined to be 'Round 3· Delayed' (`[data-leaders-group-state]` removed) |
| seasonRecap.test.tsx:186 | Korn Ferry fixture renders exactly the mock names and points | expected 'Brown, 19, is the youngest of the 20' to be 'TOP 20 · PGA TOUR CARD FOR 2027' (the card-list h2 is now the title; the label is the eyebrow) |
| seasonRecap.test.tsx:200 | card list over 20 shows See all, and the LPGA youngest line says her | Cannot read properties of null (reading 'textContent') (youngest paragraph removed) |
| upcomingOverviewPlus.test.tsx:37 | five followed rows, total count, tees and overflow | toHaveTextContent on null (`.upcoming-players-line` removed) |
| upcomingOverviewPlus.test.tsx:42 | course reads glance facts, shares lead… | expected undefined to be 'Par 72, 6,660 yards' (`.tv-lead` replaced by the head title) |
| boardHeadersNoPosPlayer.test.tsx:67 | completed THE TOP THREE: R<last> and TOT on the heading line | expected null not to be null (no h3 on the column row) |
| boardHeadersNoPosPlayer.test.tsx:80 | upcoming LAST YEAR: TOT on the heading line | expected null not to be null |
| boardHeadersNoPosPlayer.test.tsx:89 | season in review THE POINTS LIST: PTS on the heading line | expected null not to be null |
| roundDelayOverview.test.tsx:86 | leaders group shows Delayed from the same event… | expected undefined to be 'Round 3· Delayed' |
| roundDelayOverview.test.tsx:92 | leaders group retains Tees off when the round is not delayed | expected undefined to be 'Round 3· Tees off Sat 09:10' |
| roundDelayOverview.test.tsx:97 | leaders group uses the event's first tee… | expected undefined to be 'Round 3· Delayed' |
| roundDelayOverview.test.tsx:102 | standalone leaders clock crosses the delay boundary… | invalid arguments (undefined and string) |
| recapOurPicks.test.tsx:33 | keeps the heading and sheet action in one heading row | Target cannot be null or undefined (`.recap-head` removed) |
| recapOurPicks.test.tsx:46 | opens the existing OurRecordSheet when the heading action is tapped | Missing record action (action is now `[data-hero-head-action]`) |
| liveBoardTeeAndZone.test.tsx:88 | America/New_York 16:00 UTC tee reads Tees off Sat 11:00 | expected undefined to be 'Round 4· Tees off Sat 11:00' |
| liveBoardTeeAndZone.test.tsx:92 | without a zone preserve today's device-time day and time | expected undefined to be 'Round 4· Tees off Sat 16:00' |
| liveBoardTeeAndZone.test.tsx:97 | weekday and time from the course zone across midnight | expected undefined to be 'Round 4· Tees off Sat 21:00' |
| liveBoardTeeAndZone.test.tsx:107 | HeroBoardBand passes the course zone to the leaders group | expected undefined to be 'Round 4· Tees off Sat 11:00' |

Proposed ruling: add these seven files to the authorised list, limited to assertions on the removed state line, labels, kicker elements/classes and paragraphs, retargeted at `[data-hero-head-eyebrow]` / `[data-hero-head-title]` with the same values (e.g. `Lee and Smith tee off Sat 11:00`, `…, delayed`).

## Failures inside the authorised list (26 tests, not yet edited)

overviewNarrowFixes (1), overviewRoundParity (10), pk1RecordHeading (2), tourOverviewMergedAiry (4), tourOverviewPicksTeeLine (3), upcomingHeroNewOrder (2), upcomingLastYearBoard (2), upcomingLastYearWon (1), yourPickRemoval (1). heroBlocks passes. These are all the expected kicker/class/right-label assertions. They will be updated, each listed with its old assertion, once the ruling above lands.

## Points for Ben

1. Leaders' group "tee off" with the three-or-more form: brief text gives "{name} tee off at {time}" for every name form and fixes agreement only for "finished". Built literally, so it reads "Lee's group tee off at 13:40". Ruling needed: keep, or "tees off" for the group form.
2. Plural forms the brief doesn't spell out, added for completeness: "One winner in {events}", "one event", "{n} point clear" (_one), "One player, no cut", "One group, off the 1st and 10th", "One made the cut, at {score}", "One card decided".
3. Live picks title with no intro (field not started) uses rule (o) on the live rows' tee times, with the row's own venue-time formatter and the weekday in the course zone.

## Not yet done

Captures (§6) and the title line table at 320. Both wait for the ruling, so the capture set matches the committed build.
