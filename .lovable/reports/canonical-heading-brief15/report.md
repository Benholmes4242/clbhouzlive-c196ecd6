# Canonical heading series, brief 15 — Tour hub overview section heads

## Ruling needed (clause conflict, not resolved by me)
The brief says "Every title must be at most two lines at 320". The mock's own World rankings level copy, "Scheffler and McIlroy are level on 1,891 points" (the mock writes 18.91), reaches **three lines at 320**: the 21px title shares the row with "Full rankings ›". The copy and layout are exactly as specified, so I did not pick between the two clauses. Possible fixes: shorter level copy, or the action on its own line for this case. Ben to rule. Every other variant is at most two lines at 320.

## Component change
`src/features/tourhub/overview/sections/OverviewSectionHead.tsx`: props `{ eyebrow, title, live?, action?, onAction? }`, `meta` removed.
- Eyebrow: `SECTION_EYEBROW`, ink `INK`, flex with 7px gap. When `live`, a `●` in `LIVE_DOT` (#22C55E, the mock's `.live`) follows the text.
- Title: `<h2>` on `SECTION_TITLE`, `minWidth: 0`, wraps and never truncates. `SECTION_TITLE_GAP` (5px) above it.
- Title row: flex, `align-items: flex-end`, gap 14 (mock `.hd`).
- Action: `flex: none`, nowrap, 13.5px / 600, `INK_MUTE`, line-height normal, text `"{action} ›"` (mock). This replaces the old 12px/700 label with a ChevronRight icon.
- Margin `0 24px 10px` unchanged. The old `minHeight: 28` is dropped, because the mock's proposed head has none.

Pure title rules live in a new file, `sections/overviewHeadTitles.ts`. `comingUpRules.ts` adds `comingDays` (the same calendar-day count as `comingCountdown`, which is unchanged) and `comingHeadCountdown`.

## Sections
| section | eyebrow | title rule | removed |
|---|---|---|---|
| AlsoThisWeek.tsx | overview.alsoThisWeek.title | ≥2 events with some live: headLive ("Two more events, one live"). ≥2 with none live: headNone. 1 live: headOneLive ("{{event}}, round three"), round from `useEffectiveRound` (the effective-round rule; cached, no new table read). 1 not live: the event name. `live` = liveCount > 0 | `.also-week-meta` "N live" span |
| ComingUp.tsx | overview.comingUp.title | events[0].start_date in viewer-local calendar days: 0 today, 1 tomorrow, 2–20 days (words 2–9, numerals 10+), 21+ floor(days/7) weeks | — |
| WorldRankings.tsx | overview.rankings.sectionEyebrow | leadSentence() for the current board: headLeads / headLevel, plain text. Null falls back to the board chip label (World / Race to Dubai / …) | bold lead text in LeadSentence. The line now shows only the tail (tailTwice / tailNearly / tail…Events / tailEvents) and is not rendered without one. 13.5px muted styling kept |
| OverviewNews.tsx | overview.news.title | count > 0: head_one / head_other ("Three new since your last visit"). Otherwise headNone | `.overview-news-fresh` row (the `newSince` keys stay: NewsTab.tsx:399 still uses them) |
Other OverviewSectionHead callers: none outside these four (one test, canonicalSharedHeads.test.tsx).
The live chips are World / Race to Dubai / LPGA / Korn Ferry. The mock's "FedEx Cup" chip is placeholder content; chips are unchanged.

## New i18n keys (tourhub, overview.*), all six locales
- alsoThisWeek: headLive_one "{{words}} more events, one live", headLive_other "{{words}} more events, {{liveWords}} live", headNone "{{words}} more events this week", headOneLive_one "{{event}}, round one", headOneLive_other "{{event}}, round {{roundWords}}"
- comingUp.head: today "Next event starts today", tomorrow "Next event starts tomorrow", days_one/_other "Next event in {{words}} day(s)", weeks_one/_other "Next event in {{words}} week(s)"
- rankings: headLeads "{{name}} leads by {{gap}} points", headLevel "{{name}} and {{other}} are level on {{points}} points", tailTwice, tailTwiceEvents_one/_other, tailNearly, tailNearlyEvents_one/_other, tailEvents_one/_other ("With {{count}} event(s) left.")
- news: head_one "One new since your last visit", head_other "{{words}} new since your last visit", headNone "The latest from the tours"

de/es/ja/ko carry the English text, matching how those files already hold English for these sections. en-XA is pseudo-accented. Mid-sentence number words come from `titleCountWords` and are lower-cased with `toLocaleLowerCase`. The rewrite also re-indented 11 previously mis-indented `numbers` lines in en/en-XA tourhub.json; whitespace only.

## Test updates
- alsoWeekSection.test.tsx:20 — was `.also-week-meta` toBe('2 live'); now title 'Three more events, two live' and the live dot present (meta removed).
- alsoWeekSection.test.tsx:21 — was `.also-week-meta` toBeNull; now live dot null and title 'c' (the single event name).
- alsoWeekSection.test.tsx:22 — was toBe('1 live'); now title 'a, round three' and the dot present.
- alsoWeekSection.test.tsx:23 — was toBe('4 live'); now title 'Four more events, four live'.
- roundDelayOverview.test.tsx:122 — was `.also-week-meta` toBe('1 live'); now `[data-overview-live-dot]` not null.
- worldRankingsRebuild.test.tsx:207-209 — was the full sentence 'Scheffler leads by 343 points, nearly twice anyone else's total.' with 2 `strong`; now title 'Scheffler leads by 343 points', line 'Nearly twice anyone else's total.', 0 `strong`.
- worldRankingsRebuild.test.tsx:215 — was 'McIlroy leads by 822 points with 2 events left.'; now title 'McIlroy leads by 822 points' and line 'With 2 events left.'.
- worldRankingsRebuild.test.tsx:226 — was 'McIlroy leads by 822 points.'; now title as above and the line absent (no tail).
- worldRankingsRebuild.test.tsx:233-234 — was the full sentence plus `strong[2]` = count; now 'With {count} event(s) left.' (plain text).
- overviewNewsRebuild.test.tsx:92, :93 — was `.overview-news-fresh b` count 1 / 2; now title 'One new…' / 'Two new since your last visit'.
- overviewNewsRebuild.test.tsx:94 — kept `.overview-news-fresh` toBeNull; added title 'The latest from the tours'.
- canonicalSharedHeads.test.tsx:63 — was `<OverviewSectionHead title="Coming up" />`; now passes eyebrow and asserts the canonical title on 'Next event in four days' (the required prop changed).
- Added src/test/tourOverviewHeadsCanon.test.tsx (17 tests): head metrics, action and live dot present/absent; the four Also this week rules; countdown at 0/1/4/12/23 days; leads + tail, level with no tail, no-tail plain lead and board fallback; News at 0/1/3.

## Captures and mock comparison
Fixture page (b15.html + src/b15Fixture.tsx: HEAD OverviewSectionHead vs the new one, every title variant), removed afterwards. `captures/before_390.png`, `before_320.png`, `after_390.png`, `after_320.png`. Heads only; cards, chips, tables and tiles are unchanged and not drawn.
Mock comparison at 390: eyebrow 11/700/.16em/uppercase/lh 1, dot #22C55E with 7px gap; title 21/700/-.035em/1.05/font-synthesis none; 5px gap; flex-end row with gap 14; action 13.5/600 at .62 alpha with " ›". The mock's four titles wrap the same as ours (four days and Two more events: 1 line; Scheffler leads and Three new: 2 lines).

## Line table (title lines)
| variant | before 390 | before 320 | after 390 | after 320 |
|---|---|---|---|---|
| ATW two, one live | 1 | 1 | 1 | 1 |
| ATW two, none live | 1 | 1 | 1 | 1 |
| ATW one live ("Alfred Dunhill Links Championship, round three") | 1 | 1 | 2 | 2 |
| ATW one not live | 1 | 1 | 1 | 1 |
| CU today | 1 | 1 | 1 | 2 |
| CU tomorrow | 1 | 1 | 2 | 2 |
| CU four days | 1 | 1 | 1 | 2 |
| CU 12 days | 1 | 1 | 1 | 2 |
| CU three weeks | 1 | 1 | 2 | 2 |
| WR leads + tail | 1 | 1 | 2 | 2 |
| WR level | 1 | 1 | 2 | **3** (see ruling) |
| WR board fallback | 1 | 1 | 1 | 1 |
| News none | 1 | 1 | 1 | 2 |
| News one | 1 | 1 | 2 | 2 |
| News three | 1 | 1 | 2 | 2 |
"Before" is the old name-only head, which is always 1 line. No horizontal overflow at either width.

## Shards (sequential, `npx vitest run --shard=N/4`)
| shard | files | tests |
|---|---|---|
| 1 | 224 | 2,479 |
| 2 | 224 | 2,494 |
| 3 | 224 | 2,504 |
| 4 | 221 | 2,741 |
| total | 893 | 10,218 passed |
Baseline: 10,201 / 892 (brief 14, b412726550). Delta +17 tests / +1 file = tourOverviewHeadsCanon.test.tsx. No failures, no reruns. Typecheck (tsgo -b --noEmit) clean.
