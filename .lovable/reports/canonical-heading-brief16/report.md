# Brief 16 — Tour hub overview hero band section heads

Status: complete after the continuation ruling (see "Continuation" at the end). The STOP section below is the original record.

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


## Continuation — test ruling, grammar, World rankings level case, captures

### Files changed in the continuation
- `components/overview-v3/heroHeadRules.ts` — rule c agreement: one name or the "{surname}'s group" form uses `teeOffOne` / `teeOffDayOne` and `groupFinished` ("has finished"); only the two-name form keeps `teeOff` / `teeOffDay` / `finished`.
- `overview/sections/worldRankingsRules.ts` — the `level` sentence also carries `count` (rows sharing the top points) and `eventsLeft` (0 → null, as for `leads`).
- `overview/sections/overviewHeadTitles.ts` — level title `headLevelPair` "{name} and {other} level" or `headLevelMany` "{words} level at the top" (2–9 words); the tail line opens `tailLevelBoth` "Both on {points} points." / `tailLevelAll` "All on {points} points." and appends the existing `tailEvents` sentence when events are left.
- Six locales (en, en-XA, de, es, ja, ko): `leaders.teeOffOne`, `leaders.teeOffDayOne`, `rankings.headLevelPair`, `rankings.headLevelMany_one/_other`, `rankings.tailLevelBoth`, `rankings.tailLevelAll`. de/es/ja/ko carry English (accepted, as brief 15); en-XA pseudo-accented. Old `rankings.headLevel` key kept, now unused by code (no deletion was asked).
- Points keep the existing `fmtPoints` (rounded, en-GB separators), so the brief's "18.91" example renders as e.g. "1,891" for the World board's data. Not changed: the brief gives the figure only as an example.

### Test edits (old → new)
Seven newly authorised files:
- effectiveCurrentRound.test.tsx:97 `.live-picks-full` toBe 'ROUND 3 · DELAYED' → `[data-hero-head-eyebrow]` toBe 'OUR TOURNAMENT PICKS · DELAYED' (the round number is no longer in the picks eyebrow per rule k; the delay is).
- effectiveCurrentRound.test.tsx:102 `[data-leaders-group-state]` 'Round 3· Delayed' → title 'A and B, delayed' + eyebrow "THE LEADERS' GROUP · ROUND 3".
- seasonRecap.test.tsx:186 `[data-recap-cards] h2` 'TOP 20 · PGA TOUR CARD FOR 2027' → same text on `[data-hero-head-eyebrow]`; `[data-recap-youngest]` 'Blades Brown earned his card at 19, the youngest of the 20.' → title 'Brown, 19, is the youngest of the 20'.
- seasonRecap.test.tsx:200 `[data-recap-see-all]` 'See all 80 ›' → head action 'See all ›'. **Deleted**: `expect(c2.querySelector('[data-recap-youngest]')!.textContent).toContain('earned her card')` — the youngest paragraph is removed outright; the title carries no pronoun.
- upcomingOverviewPlus.test.tsx:37 `.upcoming-players-line strong` '7 of your players' → title 'Seven of your players are in the field'.
- upcomingOverviewPlus.test.tsx:42 `.tv-lead b` = glanceFacts parts[0] → title 'Par 72, 6,660 yards' (the 'Course guide ›' click to ?section=course is unchanged and passes).
- boardHeadersNoPosPlayer.test.tsx:67 `head h3` not null → column row holds no h2/h3; its preceding `[data-hero-head]` holds exactly one h2, the title. :80 and :89 `head h2` not null → column row holds no h2/h3; the section holds exactly one h2, the head title.
- roundDelayOverview.test.tsx:86 'Round 3· Delayed' → title 'A, delayed' + eyebrow round 3; the `span[aria-hidden]` (no dot) check → `[data-hero-head-live]` null. :92 'Round 3· Tees off Sat 09:10' → 'A tees off at 09:10' (same day as `now`, so rule c drops the weekday) + eyebrow round 3. :97 → 'A, delayed' + eyebrow. :102/:104 toContain('Tees off') / 'Round 3· Delayed' → 'A tees off at 09:10' / 'A, delayed'.
- liveBoardTeeAndZone.test.tsx:88/:92/:97 'Round 4· Tees off Sat 11:00' / device-time / 'Sat 21:00' → 'A tees off Sat 11:00' / `A tees off ${weekday} ${time}` / 'A tees off Sat 21:00', each plus eyebrow "THE LEADERS' GROUP · ROUND 4". :107 → `[data-leaders-group] [data-hero-head-title]` 'A tees off Sat 11:00'. The fixtures name one player ("A"), so these read the singular form.
- recapOurPicks.test.tsx:33 `.recap-head` children H2+BUTTON → `[data-hero-head]` holds one h2 (the title) and a `[data-hero-head-action]` button reading 'How we pick ›'. :46 `.recap-head button` → that action; still opens OurRecordSheet.

Brief 16 files (26):
- overviewNarrowFixes.test.tsx:54 css contains `.recap-head-row>.upcoming-kicker{grid-column:1 / 3}` → css lacks it; the head row holds no h2/h3; its first span keeps grid-column 1 / 3.
- overviewRoundParity.test.tsx fixtures `picks`: 'ROUND 3 · LIVE' → 'OUR TOURNAMENT PICKS · ROUND 3'; 'AFTER ROUND 3' → 'OUR TOURNAMENT PICKS'; 'ROUND 3 · DELAYED' → '… · DELAYED'; 'ROUND 3 · SUSPENDED' → '… · SUSPENDED'; 'ROUND 1 · First tee' → 'OUR TOURNAMENT PICKS'; 'FINAL ROUND · LIVE' → '… · FINAL ROUND'. :82 `.live-picks-full` → `[data-live-picks] [data-hero-head-eyebrow]`; :84 `[data-live-picks-heading]` textTransform 'uppercase' → eyebrow text equals its upper case. :98 `.live-picks-short` 'DELAYED' → eyebrow 'OUR TOURNAMENT PICKS · DELAYED'. :111/:115 (×3) `.live-picks-full` contains / not contains 'DELAYED' → the eyebrow.
- pk1RecordHeading.test.tsx:26 (×2) `[data-overview-picks-heading]` → `[data-overview-picks] [data-hero-head], [data-overview-picks-heading]` (upcoming/completed use the head; the live card branch keeps its old heading).
- tourOverviewMergedAiry.test.tsx:98 picks paddingTop '8px' / heading paddingTop '16px' → completed: '0px' and a `[data-hero-head]` present; live unchanged. :111 first child `.upcoming-sec-head` + h2 `.upcoming-sec-kick` + children[1] minHeight 31px → first child `[data-hero-head]` with title h2, children[1] `.upcoming-sec-head`, children[2] row minHeight 31px. :118 movement padding '12px 20px 10px' → '0px 20px 10px' + head present. :124 leaders padding '14px 20px 12px' → '0px 20px 12px' + head present; state line marginTop 6px → state line absent, title present. (The head's top gap is `var(--hero-head-gap)`; jsdom drops `var()` in inline styles, so presence is asserted instead.)
- tourOverviewPicksTeeLine.test.tsx:119 / :136 tee-day label not null → label null, card keeps its HH:MM tee. :170 full label / day-only / back on resize → no label and no `[data-overview-picks-tee-measure]` at any width. **For Ben**: these encode the brief 16 removal of the right-hand tee-day label; the tests are kept, inverted.
- upcomingHeroNewOrder.test.tsx:60 `.tv-lead` not null → course `[data-hero-head-title]` not null. :67 `[data-course-guide]` has `upcoming-sec-kick` + click → `[data-course-guide]` absent and the course head present. **For Ben**: under this file's canonical react-i18next mock the action label is '' so the action does not render; the click to ?section=course remains asserted with real i18n at upcomingOverviewPlus.test.tsx:42.
- upcomingLastYearBoard.test.tsx:39 header h2 'Last year · 2025' + `.upcoming-sec-kick` → section head eyebrow 'LAST YEAR · 2025', column row holds no h2/h3, title is the head h2. :51 'Last year' → eyebrow 'LAST YEAR'.
- upcomingLastYearWon.test.tsx:23 `.cw-kick` contains '2026' → `[data-overview-last-year] > [data-hero-head]` eyebrow present (mocked t returns '', so the year cannot be read here; it is covered in heroHeadRender).
- yourPickRemoval.test.tsx:23 `[data-overview-picks-heading]` has text `en.overview.hero.ourPicks` → head eyebrow equals `en.overview.heroHead.picks.eyebrow`.

Added: heroHeadRules.test.ts `agreement` it.each, 9 cases (one name / two names / group × tees off today / tees off day / finished). tourOverviewHeadsCanon.test.tsx: 'level title has no tail' → 'level pair: surnames title, points on the line beneath' ('Scheffler and McIlroy level', 'Both on 1,891 points.'), plus 'level pair with events left continues the line' and 'three or more level' ('Three level at the top', 'All on 1,891 points.').

### Shards (four sequential commands, `bunx vitest run --shard=N/4`)
| Shard | Files | Tests | Passed | Failed |
|---|---|---|---|---|
| 1/4 | 224 | 2,492 | 2,492 | 0 |
| 2/4 | 224 | 2,486 | 2,486 | 0 |
| 3/4 | 224 | 2,505 | 2,505 | 0 |
| 4/4 | 223 | 2,828 | 2,828 | 0 |
| Total | 895 | 10,311 | 10,311 | 0 |

Delta against 10,218 / 893: +93 tests, +2 files = heroHeadRules.test.ts (68 + 9 = 77), heroHeadRender.test.tsx (14), tourOverviewHeadsCanon +2 (one level test became three). One assertion deleted (seasonRecap 'earned her card', above); no test deleted or renamed except the level test's title.

### Captures
Fixture page with the real section components (RoundMovementBand, LivePicksBlock live and delayed, LiveFirstTees, UpcomingLastYear, YourUpcomingPlayers, UpcomingCourse, CompletedWeekBlock — the tournament page's finished block — RecapFacts, RecapStandings, RecapCardList), served from the current tree (after) and from a copy of eccb6eb (before), plus an after-only panel rendering every title rule through HeroSectionHead and the World rankings level cases through OverviewSectionHead with 'Full rankings ›'. Page removed afterwards. `captures/before_390.png`, `before_320.png`, `after_390.png`, `after_320.png`.
Not drawn with live data: the hero photo band itself, the live hero board and the leaders' group rows (they need live reads); their titles are in the panel.

### Line table, after (Playwright, h2 height / line-height)
| Surface / case | Title | 390 | 320 |
|---|---|---|---|
| live | Christiansen up 14 places | 1 | 1 |
| live | Two picks, tee times to come | 1 | 1 |
| live | Three groups, off the 1st and 10th | 1 | 2 |
| delayed | Two picks, tee times to come | 1 | 1 |
| upcoming | Up second, two back | 1 | 1 |
| upcoming | Seven of your players are in the field | 1 | 2 |
| upcoming | Par 72, 8,460 yards | 1 | 2 |
| completed / tournament finished block | Featherstone was level after round three | 2 | 2 |
| completed / tournament finished block | Best in the field on the par 5s | 1 | 1 |
| completed / tournament finished block | Featherstone second, one back | 1 | 2 |
| completed / tournament finished block | 71 made the cut, at −2 | 1 | 1 |
| season recap | 20 different winners in 25 events | 1 | 2 |
| season recap | Steelman finished 30 points clear | 1 | 2 |
| season recap | Brown, 19, is the youngest of the 20 | 1 | 2 |
| a movers | Christiansen and Featherstone up 14 places | 2 | 2 |
| b share lead, two long surnames | Christiansen and Featherstone share the lead | 2 | 2 |
| b within three | Four within three of the lead | 1 | 1 |
| c one name tees off day | Christiansen tees off Sat 13:40 | 1 | 1 |
| c two long names tee off day | Christiansen and Featherstone tee off Sat 13:40 | 2 | 2 |
| c three-player group tees off day | Christiansen's group tees off Sat 13:40 | 2 | 2 |
| c three-player group finished | Christiansen's group has finished | 1 | 2 |
| c two long names stopped | Christiansen and Featherstone, stopped on 14 | 2 | 2 |
| d course live | Playing 1.23 under par | 1 | 1 |
| f tee times both | Three groups, off the 1st and 10th | 1 | 2 |
| g won within | Featherstone got within one after round three | 2 | 2 |
| h hole type, 12-letter surname eyebrow | Joint third-best on the par 4s | 1 | 1 |
| i runner-up tie two long | Featherstone and Montgomerie tie for second | 2 | 2 |
| j week cut | 71 made the cut, at -2 | 1 | 1 |
| l your players | Seven of your players are in the field | 1 | 2 |
| o upcoming picks first tee | Featherstone off first, Thu at 13:40 | 1 | 2 |
| p season | 20 different winners in 25 events | 1 | 2 |
| q points clear | Featherstone finished 30 points clear | 1 | 2 |
| r cards youngest | Featherstone, 19, is the youngest of the 20 | 2 | 2 |
| s season picks | We picked three winners | 1 | 1 |
| WR level pair | Scheffler and McIlroy level | 2 | 2 |
| WR level pair, long surnames | Christiansen and Featherstone level | 2 | 3 |
| WR three level | Three level at the top | 1 | 2 |

### Before (eccb6eb) headings in the same sections
| Surface | Heading | 390 | 320 |
|---|---|---|---|
| live | ROUND 1 TEE TIMES | 1 | 1 |
| upcoming | Last year · 2025 | 1 | 1 |
| upcoming | YOUR PLAYERS | 1 | 1 |
| upcoming | THE COURSE | 1 | 1 |
| completed / tournament finished block | HOW IT WAS WON | 2 | 2 |
| completed / tournament finished block | THE TOP THREE | 1 | 1 |
| completed / tournament finished block | THE WEEK | 2 | 2 |
| season recap | THE SEASON | 2 | 2 |
| season recap | THE POINTS LIST | 1 | 1 |
| season recap | TOP 20 · PGA TOUR CARD FOR 2027 | 1 | 1 |

World rankings tail at 320: 'Both on 1,891 points. With 2 events left.' 1 line; 'All on 1,891 points.' 1 line.

### Three-line cases at 320
- 'Christiansen and Featherstone level' (World rankings, two 12-letter surnames, beside 'Full rankings ›'): **3 lines** at 320, 2 at 390. The ruled pair case 'Scheffler and McIlroy level' is 2 lines; 'Three level at the top' is 2. Left unchanged for Ben.
- Every other title, including the 12-letter hole-type eyebrow, the three-player group form and 'Christiansen and Featherstone share the lead', is ≤ 2 lines at 320.

### Overflow at 320
None: document scroll width equals the viewport (320 and 390) before and after; no element's right edge passes the viewport.

### Could not match / for Ben
1. Long-surname World rankings level title is 3 lines at 320 (above).
2. Picks eyebrow no longer names the round for after-round / before-first-tee states (rule k), so the parity fixtures changed from 'AFTER ROUND 3' / 'ROUND 1 · First tee' to 'OUR TOURNAMENT PICKS'.
3. Tee-day label tests inverted, and the course-guide click covered by another file (above).
4. 'See all 80 ›' became 'See all ›' (heroHead.seeAll), so the card count is no longer on the action.

## Close-out

### Files changed
- `src/features/tourhub/overview/sections/worldRankingsRules.ts` — new pure `levelHeadForm(lines) → 'names' | 'count'` (> 2 lines → count).
- `src/features/tourhub/overview/sections/RankingsLead.tsx` (new) — head + chips + lead line; measure-then-switch with useLayoutEffect and a ResizeObserver on the head (re-checks on width change and `document.fonts.ready`). Only the names form is measured, so the shorter count title cannot flip back.
- `src/features/tourhub/overview/sections/measureTitleLines.ts` (new) — height ÷ computed line-height; its own module so tests stub layout.
- `src/features/tourhub/overview/sections/overviewHeadTitles.ts` — `rankingsTitle`/`rankingsTail` take an optional `form` (default `'names'`, so existing callers and tests are unchanged). Count form for a pair = "Two level at the top" via the existing `headLevelMany`; its line uses the new key.
- `src/features/tourhub/overview/sections/WorldRankings.tsx` — renders `RankingsLead`; the local `LeadSentence` component moved into it (same `data-lead-sentence` element and style).
- Locales (all six): `overview.rankings.tailLevelNames` = "{{name}} and {{other}}, both on {{points}} points." (de/es/ja/ko English, en-XA pseudo-accented).
- Three or more level is unchanged.

### Tests added (`src/test/brief16LevelFallback.test.tsx`, 5 tests, no existing test edited)
- `levelHeadForm` at 1, 2 and 3 lines.
- Stubbed 3-line measurement → title "Two level at the top", line "Christiansen and Featherstone, both on 1,891 points. With 2 events left."
- Stubbed 2-line measurement → "Scheffler and McIlroy level" / "Both on 1,891 points." unchanged.

### Shards (sequential, `npx vitest run --shard=N/4`; raw logs outside the repo)
| Shard | Files | Tests | Result |
|---|---|---|---|
| 1/4 | 224 | 2,490 | pass |
| 2/4 | 224 | 2,490 | pass |
| 3/4 | 224 | 2,507 | pass |
| 4/4 | 224 | 2,829 | pass |
| Total | 896 | 10,316 | pass |

Delta against 10,311 / 895: +5 tests, +1 file — all from `brief16LevelFallback.test.tsx`.

### Captures (`closeout/`, real components on a temporary fixture page, since deleted)
- Live board: `LiveHeroBoard` with a pre-seeded QueryClient. Note: the board reads tee times through `useTeeTimesAll` (key `['tournament-v2','tee-times-all', id, round]`), not `useTournamentTeeTimes`; both keys were seeded. Fixture rows Lee −14 thru 14, Smith −13 thru 14, Smylie −12 F, Scott −11 thru 12, Herbert −11 F.
- Leaders' group: `LeadersGroupContent`, round 3, Lee + Smith in onCourse / before (Sat 13:40) / suspended / finished, plus a three-player group (Lee, Smith, Smylie).
- World rankings level: Scheffler/McIlroy and Christiansen/Featherstone through `RankingsLead`.

### Line table
| Surface | Title | 390 | 320 |
|---|---|---|---|
| Live board | Four within three of the lead | 1 | 1 |
| Leaders' group onCourse | Lee and Smith, through 14 | 1 | 1 |
| Leaders' group before | Lee and Smith tee off Sat 13:40 | 1 | 2 |
| Leaders' group suspended | Lee and Smith, stopped on 14 | 1 | 1 |
| Leaders' group finished | Lee and Smith have finished | 1 | 1 |
| Leaders' group three players | Lee's group, through 18 | 1 | 1 |
| WR level, short names | Scheffler and McIlroy level | 2 | 2 |
| WR level, long names | 390: Christiansen and Featherstone level · 320: Two level at the top (fallback) | 2 | 2 |

All titles ≤ 2 lines. No overflow: document scroll width equals the viewport at 320 and 390, and no element passes the right edge.
