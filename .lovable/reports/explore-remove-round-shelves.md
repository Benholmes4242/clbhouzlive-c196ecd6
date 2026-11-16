# BRIEF_EXPLORE_REMOVE_ROUND_SHELVES

Product: WatchFeed no longer mounts RoundsThisWeekShelf or StandoutRoundsShelf; Filmed at your courses follows Quick hits directly. onOpenRound/onOpenMember props removed from WatchFeed and from ExploreMagazine's call. Deleted RoundsThisWeekShelf.tsx (useRecentRounds), StandoutRoundsShelf.tsx, useStandoutFeats.ts; standoutShelfRules.ts trimmed to shortStandoutDate (still used by RoundTileParts). RoundCard (+ OWN_ROUND_AMBER/BORDER) moved unchanged to watch/RoundCard.tsx; CourseLatelySection import updated. roundsShelfRules.ts, RoundTileParts.tsx, RoundTileMarks.tsx, standout-shelf.css kept (RoundCard uses them). Database functions untouched; no SQL/migrations.

Suite: 9,000 -> 8,945 (2,240 / 2,194 / 2,237 / 2,274), no failures. Delta -55 = -43 -13 -1 +2.

Deleted:
- src/test/sar1StandoutShelf.test.tsx, whole file (43 tests): only exercised StandoutRoundsShelf, useStandoutFeats and the removed rules.
- rsRoundsShelf.test.tsx (13), shelf-only: renders newest first from get_recent_rounds...; loads the next page when the sentinel shows...; ends on the final round without an end tile...; the header has no Leaderboards pill or Rounds door; the rail snaps to the 16px inset...; falls back to everyone under two circle rounds...; hides the heading when there are no rounds; hides the shelf quietly on error and logs; renders nothing for a signed-out visitor; reserves the heading and two cards while loading...; Recent rounds still reads the last 14 days; shows on the For you chip for a signed-in member, after Quick hits...; is absent for a signed-out visitor.
- memberTapProfile: "Standout rounds: the name/avatar opens the owner profile and not the scorecard" (shelf removed).

Rewritten (assertions unchanged, setup only): the six RoundCard cases in rsRoundsShelf and two in memberTapProfile now mount RoundCard directly instead of through the shelf; "Recent rounds: the name/avatar..." renamed "Round card: the name/avatar...". ws2 order test drops the rounds stub: `[lead, shorts, course, regions, watch]`. RoundsThisWeekShelf mocks removed from ws2/ws3/er1/er3; proLabelCoverage delegate key renamed to RoundCard.tsx.

Added (+2): ws2 "neither round shelf heading renders on Explore (signed in | guest)".

Not checked: signed-in Explore at 320/375 and a live course Lately section in the browser (sign-in unavailable for this backend).
