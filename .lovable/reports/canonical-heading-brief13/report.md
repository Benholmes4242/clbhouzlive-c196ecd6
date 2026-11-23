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
**Not produced in this pass — open.** The before/after 390/320 fixture-page captures were not run, so new wraps, three-line titles at 320 and overflow are unverified. Risk to check first: SECTION_TITLE is 21px where these sheet titles were 16–20px, so "Remove from your review?", Settings "Lock members out?" (24→21, smaller) and the Field sheet title at 320 are the likeliest to wrap.
