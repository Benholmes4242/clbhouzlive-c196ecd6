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

---
# Close-out (captures, video title, eyebrow list)

## Manage ruling
ContactPage:98 "Request received", MyRequestsPage:102 "No requests yet", SupportThreadPage:79 "Couldn't load this request" are state headlines in panels (like brief 10's inbox empty state). Ruled: unchanged; they belong to the parked body and tile pass.

## Captures — method
A temporary page (`b11.html` + `src/b11Fixture.tsx`) rendered the real components with the real stylesheets, one surface per load (`?s=<key>`), with deterministic fixture props and no session. "Before" = production files restored from 8888237 in the working tree; "after" = 4c47c54. Files restored to HEAD afterwards; temporary page deleted. Captures: `captures/<key>_<390|320>_<before|after>.png`. No overflow (document scrollWidth ≤ viewport) on any capture.

| Surface | Before 390 / 320 | After 390 / 320 | Wrap note |
|---|---|---|---|
| explore-magazine Section (fixture "The rounds people are talking about at the weekend") | 19px · 2 / 2 lines | 21px · 2 / 2 | none new |
| Shelf (fixture "Courses members are playing this month") | 16px · 1 / 2 | 21px · 2 / 2 | **new wrap at 390** (1→2) |
| FindGolfers sheet | 17 · 1/1 | 21 · 1/1 | — |
| Region sheet | 17 · 1/1 | 21 · 1/1 | — |
| LatestReviews sheet | 17 · 1/1 | 21 · 1/1 | — |
| ExploreSheetShell ("Top 100") | 14.5 · 1/1 | 21 · 1/1 | — |
| Featured deck ("The week's best") | 22 · 1/1 | 21 · 1/1 | — |
| Video About sheet (92-char title) | 17 · 3/3 | 21 · 3/**4** | see below |
| ActorSheet / AdjustSheet / CoverFrameSheet / DraftsSheetV2 / ScheduledPostsSheetV2 | 17 · 1/1 | 21 · 1/1 | — |
| ScheduleSheetV2 / CourseTagSheet | 17 · 1/1 | 21 · 1/1 | — |
| VideoDetailsSheets ("Add a credit") | 17 · 1/1 | 21 · 1/1 | — |
| Post-or-review header / two box heads | 24, 18, 18 · 1/1 | 21 · 1/1 | — |
| Course search ("Review a golf course") | 22 · 1/1 | 21 · 1/1 | — |
| CommentsSheetV2 | 19 · 1/1 | 21 · 1/1 | — |
| Report flow ("Why are you reporting this?") | 17 · 1/1 | 21 · 1/1 | — |
| ReviewBottomSheet ("Royal Lytham & St Annes Golf Club") | 22 · 2/2 | 21 · 2/2 | clamp unchanged |
| CourseStatsSheet (same name) | 17 · 1/1 | 21 · 1/**2** | **new wrap at 320** (two lines, no clamp needed) |
| WAGR link sheet | 21 · 1/1 | 21 · 1/1 | already canonical via `.canon-sheet-title`; kicker 9.5→11 |
| Amateur ranking sheet kicker (`.amr-sheet .pro-collection-kicker`) | 10/.14em | 11/.16em | title unchanged |
| FriendsEmptyState | 26 · 1/1 | 26 · 1/1 (tracking/leading only) | — |
| GuestJoinCard | 26 / 22 · 2/2 | same sizes · 2/2 | — |

No three-line title at 320 except the Video About fixture.

Not captured, with reason:
- Watch feed headings changed in this brief (Section h2 with inline kicker, Quick hits) and the Creators sheet: they render only with signed-in data (`signedIn` gate / non-empty rails). The fixture's Watch feed showed only the unchanged "Shorts"/"Long form" heads. Phone check.
- SettingsWagrCard unlink sheet: opens only from a linked WAGR state. Phone check.
- GuestJoinCard on its real route: the signed-out route redirects automated browsers to /auth, and the guest-mint rule forbids automated browsers minting a guest. Phone check (signed out).

## Video About title
Fixture (92 characters): "A very long round video title from Royal Lytham & St Annes, hole by hole, with every putt in".
- Before (17px, line-height 1.3): 3 lines at 390, 3 at 320.
- After (21px, 1.05): 3 lines at 390, **4 lines at 320**. Exceeds two lines at 320; not clamped or changed, per the brief.

## Eyebrow-without-title list (complete; feeds the mock — nothing changed)
Scope: src/components/explore-tab-new (incl. courseled), src/features/explore-magazine (incl. watch), src/features/watch-v2. Locale values from src/locales/en/courses.json.

| File:line | Eyebrow | Subline | Data the section already receives |
|---|---|---|---|
| courseled/FriendsPlayedRail.tsx:194–199 | `discover.whosBeenPlaying` → "Your Circle" (component fallback "Who's been playing") | none; round-card rail follows | Props userId, lastSeen, onCardPress, onSeeAll. `useCircleLatestRounds(userId,{limit:10,allowMultiplePerFriend:true})`: round_id, score_id, course_id, course_name, play_date, feats, gross, user_id, display_name, profile_photo_url; plus useCourseCardMeta, useRoundHoleShapes, useContentReactions |
| courseled/LatestReviews.tsx:94–103 | `discover.latestReviews` → "Latest reviews" | none; featured review + grid follow | Props reviews: LatestReview[], totalCount, isPending, viewerId, lastSeen, onTilePress, onSeeAll. Review shape: course id/name/image/geography, rating, quote, timestamp, reviewer, media, Top-100 flag, breakdown; useContentReactions |
| courseled/MomentsOfTheWeek.tsx:65–74 | `discover.momentsFromCommunity` → "From the community" | none; MomentsGrid follows | Props moments: Moment[], totalCount, isPending, lastSeen, onTilePress, onSeeAll, creators?, onCreatorPress. Moment: course id/name, FeedPost, thumbnail, media type/duration, region, aspect, rating; creators: id/name/avatar, clip/photo counts, overlap |
| courseled/CourseHolePanel.tsx:222–235 (nested in course panel) | `discover.coursesPlayed.courseWideBasis` → "How the course plays" (KICKER 10px) | none below; beside it "{{count}} rounds" | Props courseId, userId, onCoursePress; useCourseHoleAnalysis, useMyHolePerformance, useCourseHoleField; this block gets count=totalRounds |
| courseled/CourseHolePanel.tsx:188 (nested) | `discover.coursesPlayed.howEachPar` → "By par" (BLOCK_TITLE = KICKER 10px) | none; ParTypeBars follow | parRows (buildParTypeRows: par, field avg_to_par, personal avg_to_par), fieldIsOnlyYou |
| courseled/CourseHolePanel.tsx:194 (nested) | `holes.preview.eyebrow` → "Hole by hole" (same) | none; distribution strip, caption, extremes | shares (courseBucketShares), hasYou, hardest/easiest holes by avg_to_par |

The last three are subsections inside the expandable course panel, not top-level sections. No qualifying sections in src/features/watch-v2 (its kickers sit above titles via ui/SectionHeader).

### Watch kickers inline beside titles (separate)
- explore-magazine/watch/WatchFeed.tsx:499–501 — `amateur.watch.rail.quickKicker` "Under 3 min" (fallback; key absent from en JSON) beside `amateur.watch.rail.quick` "Quick hits" (also fallback only); rendered at :577 and conditionally :609.
- WatchFeed.tsx:132–140 defines an optional inline kicker on its Section helper, but no call site (:424–432, :552) passes one — no rendered hit.
