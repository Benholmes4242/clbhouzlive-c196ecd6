# Canonical heading series, brief 13 — report

Baseline d4fb715: 10,188 tests / 889 files. After: **10,194 / 890** (+6 tests, +1 file: `src/test/brief13HeadingCanon.test.tsx`).

## Classification and changes (file:line, before → after)

### Courses
| Row | Class | Before | After |
|---|---|---|---|
| CourseDirectorySheet.tsx:161 | sheet title | `...TITLE` (17/700/-0.032em/1.2) | `...SECTION_TITLE` |
| CourseSearchSheet.tsx:212 | sheet title | `...TITLE` | `...SECTION_TITLE` |
| RequestCourseSheet.tsx:119 (success) / :135 | sheet titles | `style={TITLE}` | `style={SECTION_TITLE}` |
| review/RatingFilterChips.tsx:83 | sheet title | 16/700 | `...SECTION_TITLE` |
| ReviewFeaturedSlot.tsx:43 | confirmed `DiscoverSectionHeading` (canonical) | — | no change |
| CoursesContent.tsx:369 | page title, hero rule | `text-2xl font-semibold tracking-tight` | 24/600 kept, `letterSpacing -0.035em, lineHeight 1.05` |
| CoursesErrorBoundary:60, FriendsCoursesSignedOutEmpty:16, UserCoursesEmptyStates:17/40/54, CourseDetailPage:54 | state headlines | — | parked, unchanged |

None of these sheets has an eyebrow, so no eyebrow/gap change applied.

### Review v2
| Row | Class | Before | After |
|---|---|---|---|
| ReviewComposerV2.tsx:1157 | step heading | 24/700/lh 1.15 | 24/700, -0.035em, lh 1.05 |
| ReviewScoreHeadings.tsx:13 (`.review-score-heading`, index.css) | step heading | 22/700 | 22/700, -0.035em, lh 1.05 |
| EditLossSheet.tsx:51 | sheet title | `...TITLE` | `...SECTION_TITLE` |
| RemoveReviewSheetV2.tsx:85 | sheet title | `...TITLE` | `...SECTION_TITLE` |
| ReviewHoleTags.tsx:110 "Put them on a hole" | **eyebrow** (uppercase label above the shot list) | 11px bold uppercase, tracking normal | `...SECTION_EYEBROW`, colour kept |
| ReviewReceipt.tsx:95/:99/:104 (yourScore, didEyebrow, nextEyebrow) | **eyebrows** — reviewReceipt.css:20 computes 10.5/700/0.16em uppercase (not 16/400 as inventoried); each sits above its card/content | 10.5px | `--section-eyebrow-*` vars (11/700/0.16em/lh 1), colour kept |

### Admin (ruling recorded)
Admin adopts the canon surface by surface inside the admin v3 programme; only these rows change now, every other admin row stays as is.
| Row | Before | After |
|---|---|---|
| SettingsPage.tsx:336 "Maintenance mode" eyebrow | 11/700/0.16em, no lh | `...SECTION_EYEBROW`, danger colour kept |
| SettingsPage.tsx:337 "Lock members out?" | 24/700/-0.03em, margin-top 8 | `...SECTION_TITLE`, margin-top 5 (SECTION_TITLE_GAP under the eyebrow) |
| SettingsPage.tsx:435 / :539 / :719 | 20/700/-0.02em | `...SECTION_TITLE` |
| StorySection.tsx:75 "Newsroom" | 10/700/0.12em | `...SECTION_EYEBROW` |
| StorySection.tsx:76 story type | 17/700/-0.01em | `...SECTION_TITLE`, marginTop SECTION_TITLE_GAP |
| StorySection.tsx:98 story.kicker | 9.5/700/0.1em | SECTION_EYEBROW metrics, colour kept |

## Number words
Shared helper `titleCountWords(count, t, numeral?)` beside `countInWords` (overviewTokens.tsx): 2–9 words, otherwise numeral. 1 is the locale singular key. Plural selection stays on `{{count}}`.

| Candidate | Classification | Result |
|---|---|---|
| team requests "{{count}} people asked to join your team" | **row label** — Do next list item title (14px row), not a section/sheet title | unchanged; `cb68DoNext.test.tsx:74` not changed |
| coach `coach.activeTitle` | section title (`h2.coach-title`) | `{{words}}`; _one "One golfer…" |
| Insights `insights.courseCard.title` | section title (`h3.insights-course-title`) | `{{words}}` (10+ keeps formatNumber); _one "One round at…"; days stays numeral |
| `handicap.form.archive.roundsTitle` | sheet title (RoundsArchiveSheet) | `{{words}}`; _one "One round" |
| Tour Full field `fieldSheetTitle` | sheet title | `cap(words(n))` for 2–9 via tournamentRules (en-only copy); new `fieldSheetTitleOne` "One player, by world ranking" |

Locales updated: en, en-XA, de, es, ja, ko (de/es/ja/ko common strings are English copies and received "One"; de/es tourhub field keys "Ein Spieler"/"Un jugador"). Further en title keys interpolating a count: the `"{{count}} rounds"` family elsewhere in common/courses are meta lines, chips and row subtitles (e.g. `sample`, `metaAll`, `nRounds`, `pickerRowSubRounds`) — not titles, left.

## Tests
- Added `src/test/brief13HeadingCanon.test.tsx` (6 cases: Courses sheet, Review v2 sheet, composer step heading, admin Diagnostics sheet, StorySection eyebrow+title, number-word title at 1/4/12).
- Changed: `src/test/tourSheetHeadingCanon.test.tsx:90` — `toBe('3 players, by world ranking')` → `toBe('Three players, by world ranking')` (old-value expectation of a changed title).
- No other test changed.

## Shards (sequential, separate commands)
| Shard | Files | Tests | rc |
|---|---|---|---|
| 1/4 | 223 | 2,462 | 0 |
| 2/4 | 223 | 2,493 | 0 |
| 3/4 | 223 | 2,494 | 0 |
| 4/4 | 221 | 2,745 | 0 |
| Total | 890 | 10,194 | — |
Delta +6 = the six new brief13 cases. Typecheck clean.

## Captures
Produced in the close-out below (originally open: The before/after 390/320 fixture-page captures were not run, so new wraps, three-line titles at 320 and overflow are unverified. Risk to check first: SECTION_TITLE is 21px where these sheet titles were 16–20px, so "Remove from your review?", Settings "Lock members out?" (24→21, smaller) and the Field sheet title at 320 are the likeliest to wrap.)


## Close-out

Method: temporary `b13.html` + `src/b13Fixture.tsx` (fetch interception as in brief 12; unmatched backend requests left pending, no real data, no sign-in), headless Chromium on the system stack. "Before" = the 30 production/locale files from 4fc7e55 restored from d4fb715 in the working tree; "after" = 4fc7e55. Files restored and the fixture deleted afterwards. No production code changed, so no shards were run. Lines = rendered height ÷ computed line-height (the first pass counted inline change chips as extra lines; re-measured and checked against the screenshots).

**Real components:** CourseDirectorySheet, CourseSearchSheet, RequestCourseSheet (request, and success reached by a real submit against a fixture response), RatingFilterChips sheet (opened by a real tap), EditLossSheet, RemoveReviewSheetV2, ReviewStepHeading (step 3), InsightsCourseSection, RoundsArchiveSheet, Tour FieldSection → Full field sheet (opened by a real tap).

**Heading isolates** (the exact before/after declarations or the real stylesheet class, with the real locale string, at the surface's padding), because these surfaces need sessions, admin roles or many hooks: composer step 1 heading, review receipt eyebrows (real `.review-receipt h2` CSS), hole-tags eyebrow, the four admin Settings sheet titles plus the Maintenance eyebrow, the StorySection header, the user courses page title (long username "Alexandra_Montgomery-Fitzwilliam"), and the coach title (real `.coach-card .coach-title` CSS). Sheet widths in isolates approximate the real container; check those on the phone.

Captures: `captures/<surface><n>_<390|320>_<before|after>.png` (112 files).

### Line table (font size · lines)
| Surface | Title (after) | 390 before → after | 320 before → after |
|---|---|---|---|
| dir | Looking for somewhere else? | 17px·1 → 21px·1 | 17px·1 → 21px·1 |
| search | Choose Golf Club | 17px·1 → 21px·1 | 17px·1 → 21px·1 |
| req | Request a course | 17px·1 → 21px·1 | 17px·1 → 21px·1 |
| reqok | Thanks — we've got it. | 17px·1 → 21px·1 | 17px·1 → 21px·1 |
| filter | Filter by rating | 16px·1 → 21px·1 | 16px·1 → 21px·1 |
| editloss | Remove from your review? | 17px·1 → 21px·1 | 17px·1 → 21px·1 |
| remove | Remove review? | 17px·1 → 21px·1 | 17px·1 → 21px·1 |
| step1 | What was it like? | 24px·1 → 24px·1 | 24px·1 → 24px·1 |
| step3 | How good is it? | 22px·1 → 22px·1 | 22px·1 → 22px·1 |
| receipt | YOUR SCORE | 10.5px·1 → 11px·1 | 10.5px·1 → 11px·1 |
| receipt | WHAT YOUR REVIEW DID | 10.5px·1 → 11px·1 | 10.5px·1 → 11px·1 |
| receipt | REVIEW ANOTHER | 10.5px·1 → 11px·1 | 10.5px·1 → 11px·1 |
| holetags | Put them on a hole | 11px·1 → 11px·1 | 11px·1 → 11px·1 |
| settings | Maintenance mode | 11px·1 → 11px·1 | 11px·1 → 11px·1 |
| settings | Lock members out? | 24px·1 → 21px·1 | 24px·1 → 21px·1 |
| settings | App Store | 20px·1 → 21px·1 | 20px·1 → 21px·1 |
| settings | Google Play | 20px·1 → 21px·1 | 20px·1 → 21px·1 |
| settings | Flag another account | 20px·1 → 21px·1 | 20px·1 → 21px·1 |
| settings | Diagnostics | 20px·1 → 21px·1 | 20px·1 → 21px·1 |
| story | Newsroom | 10px·1 → 11px·1 | 10px·1 → 11px·1 |
| story | Amateur News story | 17px·1 → 21px·1 | 17px·1 → 21px·1 |
| username | Alexandra_Montgomery-Fitzwilliam's Courses | 24px·2 → 24px·2 | 24px·2 → 24px·2 |
| coach n=1 | One golfer has named you as their coach. | 17px·1 → 17px·2 | 17px·2 → 17px·2 |
| coach n=4 | Four golfers have named you as their coach. | 17px·2 → 17px·2 | 17px·2 → 17px·2 |
| coach n=12 | 12 golfers have named you as their coach. | 17px·2 → 17px·2 | 17px·2 → 17px·2 |
| insights n=1 | One round at Sundridge Park in the last 30 days2 fewer | 21px·2 → 21px·2 | 21px·2 → 21px·3 |
| insights n=4 | Four rounds at Sundridge Park in the last 30 days+1 | 21px·2 → 21px·2 | 21px·2 → 21px·2 |
| insights n=12 | 12 rounds at Sundridge Park in the last 30 days+9 | 21px·2 → 21px·2 | 21px·2 → 21px·2 |
| archive n=1 | One round | 17px·1 → 17px·1 | 17px·1 → 17px·1 |
| archive n=4 | Four rounds | 17px·1 → 17px·1 | 17px·1 → 17px·1 |
| archive n=12 | 12 rounds | 17px·1 → 17px·1 | 17px·1 → 17px·1 |
| field n=1 | One player, by world ranking | 21px·1 → 21px·1 | 21px·1 → 21px·1 |
| field n=4 | Four players, by world ranking | 21px·1 → 21px·1 | 21px·1 → 21px·2 |
| field n=12 | 12 players, by world ranking | 21px·1 → 21px·1 | 21px·1 → 21px·1 |
| insightslong n=12 | 12 rounds at The Royal and Ancient Golf Club of St Andrews (Old Course | 21px·3 → 21px·3 | 21px·4 → 21px·4 |
| insightslong n=4 | Four rounds at The Royal and Ancient Golf Club of St Andrews (Old Cour | 21px·3 → 21px·3 | 21px·4 → 21px·4 |

### New wraps
- coach n=1, 390: "One golfer has named you as their coach." 1 → 2 lines (the word is wider than the digit).
- insights n=1, 320: "One round at Sundridge Park in the last 30 days" (+ "2 fewer" change chip) 2 → **3** lines.
- field n=4, 320: "Four players, by world ranking" 1 → 2 lines.
All other surfaces keep their line counts; the 21px sheet titles all still fit on one line at 320.

### Three-line titles at 320 (not changed; for Ben's ruling)
| Surface | String | Lines 320 (before → after) |
|---|---|---|
| Insights rounds, count 1 | "One round at Sundridge Park in the last 30 days" + chip "2 fewer" | 2 → 3 (new) |
| Insights rounds, longest club name, count 12 | "12 rounds at The Royal and Ancient Golf Club of St Andrews (Old Course) in the last 30 days" + "+9" | 4 → 4 (already existed; 3 at 390 before and after) |
| Insights rounds, longest club name, count 4 | "Four rounds at The Royal and Ancient Golf Club of St Andrews (Old Course) in the last 30 days" + "+1" | 4 → 4 (already existed; 3 at 390 before and after) |

The long club name is a fixture of my own (the brief-12 fixtures only had "Sundridge Park Golf Club"); it is the longest name used in these fixtures.

### Overflow
None. No horizontal page overflow and no heading wider than its box, at either width, before or after.

### Not rendered as real components
Listed above under isolates, with reasons: the composer, receipt and hole-tags steps need a live review session; admin Settings needs the admin role and settings reads; StorySection needs story/insight reads; the coach card needs coach reads; the user courses page needs the full profile page.
