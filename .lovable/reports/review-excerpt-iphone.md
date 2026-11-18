# iPhone review excerpt — text-flow fix

## Delivered
- `InlineProMemberName` accepts opt-in `flow="text"`; omitted flow leaves the existing DOM attributes/structure unchanged.
- Scoped `pro-label.css` rules make the name, name text and badge inline rather than atomic inline-flex boxes. Text wraps normally; badge overflow is visible, height auto, padding 1px 5px, vertical alignment 2px, left margin 4px. Plate, rim, radius and foil remain unchanged; text flow uses the requested 7.5px / 800 / 0.14em / line-height 1 badge text.
- Media-first `ReviewPostCard` body opts in. `REVIEW_BODY_CLAMP` remains two lines; body remains 15px / 1.4. Header identity, CTA gap, scores, media and footer remain unchanged.
- Local architecture ownership is documented in the shared name component header: clamped member names opt into text flow; other callers retain their defaults.

## Clamp audit
Searched `WebkitLineClamp`, `line-clamp` classes and `-webkit-line-clamp`; inspected JSX nesting and shared renderers, not merely files containing both words.

Actual affected locations:
1. `src/components/feed/ReviewPostCard.tsx:113`: body lead name (shared `REVIEW_BODY_CLAMP` imported from reviewPostCard.ts). Applied text flow.
2. `src/components/feed/FeedCommentPreview.tsx:173`: comment author inside a two-line clamp. Applied text flow.
3. `src/components/shared/overlay/OverlayCorners.tsx:218`: creator name inside a two-line button clamp. Applied text flow.
4. `src/components/business/BusinessCommandCard.tsx:374`: verified-name inline-flex wrapper inside a two-line name clamp. Changed the wrapper to inline and the existing verified icon to inline, preserving size and badge component.
5. `src/components/business/hero/ClubProfileHero.tsx:268`: verified-name inline-flex wrapper inside the two-line heading clamp. Changed wrapper and existing verified icon to inline, preserving geometry and verification identity.

No additional clamped `InlineProMemberName` or direct `ProLabel` children found. Shared `ProMemberName` calls in FeedCard are outside CaptionBlock's clamp; its lead is a string, not a name component. The “less” button exists only after the clamp is removed.

Inspected clamped MentionText uses in FeedCard, PostDeepLinkPage, BusinessReviewsPage, PersonalReviewCard, PostSuccessV2 and VideoRailCard: MentionText defaults to span and renders inline spans, including navigable mention segments; **none** contain atomic name/badge boxes. Remaining file-level matches place names, badges and inline controls outside their clamped boxes: LoopCard, separate grid FeedCard, ReviewOverlayCore, StandoutTile, ProfileTopTenRail, ProfileHero, ProfileCoverBand, CourseCard, PendingPostCard, FriendsPlayedRail, CoursesPlayedSection, CompetitionBoards, AboutThisPlace, PlayedTile, videoUnit, HubVideoRow, ExploreCard, ReviewRailSlot, WatchLead, WatchFeed, AmateurMediaBlock, PeopleShelf, HelpfulReviewsShelf, StatBrowse, old tournament HeroSection, AnalyticsDiagnostics, SeasonRow, scorecardParts, PostInsightSheet, SuggestedGolfersRail, PhotoBand, AchievementCard and MyRequestsPage. No changes needed there.

## Reference scope
The attached `review-card-signed-off.html` depicts a broader opened-review redesign, not this media-first feed excerpt. Its header, score comparisons, media grid and single-row footer were not adopted; this brief changes text flow only.

## Tests and counts
Last completed passing suite: **9,164**. Prior Your pick removal report reconciled the expected inventory to **9,068** (100 removed cases, four added); that full suite remains unverified. This request adds **two** cases, for expected **9,070**. No existing tests deleted, renamed, rewritten or changed in this request.

Added `src/test/reviewExcerptTextFlow.test.tsx`:
- `media-first review body opts every nested member name into text flow`: asserts `[data-review-body]` contains `[data-flow="text"]`, contains no `.pro-inline-name:not([data-flow])`, retains the AM badge and leaves header identity without data-flow.
- `default member name preserves its existing structure including badge attributes`: explicit inline structure snapshot of the original default name, text span, small AM badge, badge text and button/dialog attributes. Passed without snapshot updates.

Focused command: `npx vitest run src/test/reviewExcerptTextFlow.test.tsx src/test/cb109MediaFirstEverywhere.test.tsx src/test/proLabelMemberRows.test.tsx --maxWorkers=2`.
Result: **16/16 passed**, three files. Existing jsdom container-CSS parser warnings appeared; no failed tests or unhandled test errors were reported.

Sequential full-suite command started: `npx vitest run --maxWorkers=2 --shard=1/4`; shards 2/4, 3/4 and 4/4 were not started after the stop.
Shard 1: **2,225 executed / 2,224 passed / 1 failed**, 202 files (201 passed / one failed).

### STOP — unchanged previous Tour assertion
`src/test/yourPickRemoval.test.tsx:31:18`
`Your pick removal > tee tags prioritise Our pick then following then defending without viewer treatment`

```text
AssertionError: expected [ 'OUR PICK', 'FOLLOWING', …(4) ] to deeply equal [ Array(3) ]
Expected: ["OUR PICK", "FOLLOWING", "DEFENDING"]
Received: ["OUR PICK", "FOLLOWING", "DEFENDING", "OUR PICK", "FOLLOWING", "DEFENDING"]
```

This is the previously reported, untouched test blocker. No Tour component, fixture, selector or expectation was changed for this request. Full-suite passing total remains unavailable; expected inventory is not presented as passing.

## Preview and device validation
Latest preview harness result: **2026-11-18T11:39:08Z — build OK**. No manual build/typecheck run.
Stopped before browser/device checks. Ben's physical iPhone check remains required: two full excerpt lines, complete AM badge and normal gap above Read the full review. This report does not claim Safari/iPhone rendering is verified.

Logs: `/tmp/review-excerpt/focused.log`, `/tmp/review-excerpt/shard1.log`, `/tmp/review-excerpt/audit-after.txt`.