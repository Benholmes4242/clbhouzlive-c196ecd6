# Canonical heading brief 11 — Clubhouse, Explore, Watch, composer, comments

Canon: SECTION_EYEBROW 11/700/0.16em/uppercase/1; SECTION_TITLE 21/700/-0.035em/1.05/synthesis none; gap 5. CSS surfaces use the `--section-*` variables. Colours and weights unchanged.

## Confirmed canonical, unchanged
ui/SectionHeader, ui/SheetHeader, DiscoverSectionHeading, courseled Eyebrow/SECTION_TITLE, PostSuccess.
WAGR titles (`WagrLinkSheet:51`, `SettingsWagrCard:41`) already rendered canonical via `.canon-sheet-title` (3× specificity beats `.wagr-heading.wagr-heading`); the `.wagr-heading` rule itself was also repointed so it no longer carries stale values.

## Changes (before → after)
| Where | Before | After |
|---|---|---|
| explore-magazine/Section.tsx eyebrow | EYEBROW + lineHeight 1 | SECTION_EYEBROW, colour kept |
| explore-magazine/Section.tsx title | 19/700/-0.02em/1.1 | SECTION_TITLE, gap SECTION_TITLE_GAP (5) |
| ExploreShelf SHELF_HEADING | 16/700/-0.015em | SECTION_TITLE |
| FindGolfersSheet kicker / title | courseled KICKER (legacy 11/.16em) / TITLE 17/-0.032em/1.2 | SECTION_EYEBROW (colour kept) / SECTION_TITLE |
| RegionSheet eyebrow / title | 11/600/0.06em, mb 4 / TITLE 17 | SECTION_EYEBROW (600→700 per brief), mb 5 / SECTION_TITLE |
| LatestReviewsSheet caption / title | KICKER / TITLE 17 | SECTION_EYEBROW (colour DIM kept) / SECTION_TITLE |
| courseled/ExploreSheetShell h2 | 14.5/700 | SECTION_TITLE |
| post-v2/components/BottomSheet TITLE | 17/-0.032em/1.2 | SECTION_TITLE (carries ActorSheet, AdjustSheet, CoverFrameSheet, DraftsSheetV2, ScheduledPostsSheetV2, VideoDetailsSheets) |
| post-flow.css `.pf-header h3` | 17/700 | --section-title-* (ScheduleSheetV2, CourseTagSheet) |
| featured.css `.featured-kicker` | 11/700/0.2em | --section-eyebrow-* |
| featured.css `.featured-title` | 22/700/-0.02em, mt 3 | --section-title-*, mt 5 |
| CommentsSheetV2 title | 19/700/-0.4px unless `canonicalTitle` | SECTION_TITLE always; `canonicalTitle` prop removed; WireFeedSlide no longer passes it |
| ReportCommentSheetV2 eyebrow / titles | 11/700/0.14em / TITLE 17 | SECTION_EYEBROW (amber kept) / SECTION_TITLE |
| feed/CourseStatsSheet kicker / h2 | 9/700/0.16em / TITLE 17, mt 6 | SECTION_EYEBROW / SECTION_TITLE, mt 5 |
| posts/ReviewBottomSheet location eyebrow / h1 | 9.5/700/0.16em / 22/700/-0.02em/1.15, mt 7 | SECTION_EYEBROW / SECTION_TITLE, mt 5. Title is a two-line clamp today (not nowrap); clamp kept |
| watch/WatchFeed Section h2 + inline kicker (:134) | 17/-0.3px; kicker 11/0.14em | SECTION_TITLE; inline kicker SECTION_EYEBROW |
| watch/WatchFeed Quick hits h2 + kicker (:495) | 17/-0.01em; kicker 9.5/0.13em | SECTION_TITLE; SECTION_EYEBROW (still inline beside title) |
| watch/CreatorsRow "Creators" sheet h2 | 17/-0.01em | SECTION_TITLE |
| video-viewer.css `.video-about h2` | 17/700/1.3 | --section-title-* |
| composer-flow `.post-or-review-header h1` | 24/700/0 | --section-title-* |
| composer-flow `.post-or-review-box-head h2` | 18/700/0 | --section-title-* |
| composer-flow `.rcs-head h1` | 22/700/0 | --section-title-* |
| wagr-settings.css `.wagr-kicker` / `.wagr-heading` | 9.5/0.16em / 22/-0.02em/normal, mt 6 | --section-eyebrow-* / --section-title-*, mt 5 |
| ranking-tab.css `.amr-sheet .pro-collection-kicker` (brief 10 carry-over) | 10/700/.14em, mb 6 | --section-eyebrow-*, mb 5 |
| FriendsEmptyState eyebrow / h1 (hero) | 13/700/0.14em / 26 -0.01em 1.15 | SECTION_EYEBROW / 26 -0.035em 1.05 |
| guestGate.css `.guest-gate-kicker` / `.guest-gate-head` (hero) | 11/0.14em / 26 -0.025em 1.12 | --section-eyebrow-* / 26 (22 under 341px unchanged) -0.035em 1.05 |

## Left unchanged, with reasons
- CoursesPlayedSection.tsx:509 and HowTheyPlayedSection.tsx:201 h3 (15px): card titles inside panels (course name atop a card) — left.
- Manage body titles ContactPage:98, MyRequestsPage:102, SupportThreadPage:79: centred icon-led state messages at 600 weight. Canon would move weight 600→700, which conflicts with "NOT CHANGED: weights". Held for a ruling, not changed.
- Centred alerts (AlertDialogTitle in MoreOptionsDrawer, PostOwnerMenu, CommentsSheetV2), WatchGridPage PageTitle 30px, nav-bar titles, tile/card titles, PostGolfContext facts.kicker — listed, unchanged.
- video-viewer.css `.video-about-kicker` (10.5/.18em): section labels over rows, no title — see list below.

## Eyebrow without title (for the mock)
- video-viewer.css `.video-about-kicker` in VideoAboutSheet: chapter/people/gear section labels over rows, no title.
- WatchFeed kickers sit inline after a title, not above it (`Under 3 min` beside Quick hits) — a shape question for the mock.
- Courseled eyebrow-over-subline sections were not exhaustively enumerated in this pass; open item.

## Dead code (unreachable from any route, left)
components/post/scheduled (ScheduledPostsList), components/post/GalleryPicker + gallery-picker/MultiSelectPreview, components/posts/EmojiPicker — no importers outside their own folders.

## New wraps / three-line risk
- Video About title (video names are member text) and ReviewBottomSheet course names grow from 17/22 to 21px; long names may wrap more. Review title stays clamped to two lines. Video titles have no clamp — a very long title can reach three lines at 320. Not measured.
- Composer headings shrink (24/22/18→21), so no new wraps there.

## Test updates
- src/test/exploreSheetShell.test.tsx:34 — was `expect(title).toHaveStyle({ fontSize: '14.5px', fontWeight: '700', color: A.INK })`, now `{ fontSize: '21px', fontWeight: '700', letterSpacing: '-0.035em', color: A.INK }`. Old ExploreSheetShell h2 value; authorised by the brief's old-value clause. Found when shard 3 failed on it (first run log kept locally); not a separate defect.
- New src/test/clubhouseExploreHeadingCanon.test.tsx, 5 cases: Section, RegionSheet, post-v2 BottomSheet, CommentsSheetV2 default title, ReviewBottomSheet — titles 21/700/-0.035em/1.05, eyebrows 11px/0.16em.
- No `canonicalTitle` assertions existed in tests.

## Captures
Not produced. Every listed surface sits behind sign-in in the preview (/amateur redirected to /auth; the capture script timed out waiting for content), and no test credentials were provided. Before captures were not taken either.
Phone check for Ben (all of them): Explore page and its sheets (Find golfers, Region, Latest reviews, Top 100/Most improved), Watch hub and feed, featured deck, video About sheet, composer sheets (posting as, adjust, cover frame, drafts, scheduled, schedule, course tag, video details), post-or-review sheet and course search, comments and report flow, review and course stats sheets, WAGR sheet and card, friends empty state, guest join card (signed-out — reachable on a phone).

## Shards (sequential)
| Shard | Files | Tests |
|---|---|---|
| 1/4 | 222 | 2,454 passed |
| 2/4 | 222 | 2,482 passed |
| 3/4 (rerun after the authorised line-34 update) | 222 | 2,493 passed |
| 4/4 | 221 | 2,740 passed |
| Total | 887 | 10,169 passed |
Baseline 10,164 / 886 → +5 tests / +1 file, all from clubhouseExploreHeadingCanon.test.tsx. pf3aVideoComposerMounted did not time out.
