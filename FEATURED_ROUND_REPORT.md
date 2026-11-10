# Featured round / Round of the week — close-out

## Follow ruling
Applied. The date line mounts the same `FeedFollowPill` as normal score posts: FOLLOW when not followed, tappable FOLLOWING when followed, hidden on the member's own round. Follow taps do not open the round.

FeedCard passes its existing gated score-post callback and `post.isFollowedByMe`. HomeRail and Explore use `ConnectedFeaturedRoundCard`, which reads canonical actor-aware follow state and calls `useToggleFollow`; its mutation preserves the existing guest refusal, optimistic cache patch and rollback. No independent follow flag is introduced in production.

The date row spans the name/feat columns so a long feat cannot squeeze the follow control off the date line. The name retains ellipsis before the feat. The header/body otherwise retain the signed-off figures and shared `ScorePostBody`.

## Tests and count reconciliation
Baseline from the prior build: **8,031 passed, 0 failed**.
The intervening full run was **8,038**: six new cases in `src/test/featuredRoundChamp.test.tsx`, plus SIGNIN_FIX_2 test (g) in `src/test/signinFix1.test.tsx`.

This ruling changes `src/test/roundCardFollowCB29.test.tsx` from 5 to 7 cases:
- Replaced “FeaturedRoundCard shows \"· Following\" only when followed” (old assertions: `toContain('· courseDetail.featured.following')` and `not.toContain('following')`). The old plain qualifier was explicitly superseded by this ruling.
- Replacement parameterized case: “FeaturedRoundCard mounts the inline Follow pill (followed=%s) with the score-post handler” (true and false). Asserts the Follow/Unfollow control belongs to `[data-featured-date-line]`, calls the supplied handler once and does not open the round.
- Added “FeaturedRoundCard hides the Follow pill on the member’s own round”, asserting `[data-round-follow]` is absent.
- No other tests were deleted, renamed or rewritten in this continuation.

Focused command:
`bunx vitest run src/test/roundCardFollowCB29.test.tsx src/test/featuredRoundChamp.test.tsx src/test/featuredRoundNet.test.tsx src/test/cb111RoundScoreLed.test.tsx src/test/homeRailEmpty.test.tsx src/test/holeTilesBoardBuild.test.tsx --maxWorkers=2`

Result: **6 files / 51 tests passed**.

Each full-scope shard was a separate command, run sequentially:

| Command | Passed | Failed |
| --- | ---: | ---: |
| `bunx vitest run --maxWorkers=2 --shard=1/4` | 2,087 | 0 |
| `bunx vitest run --maxWorkers=2 --shard=2/4` | 1,916 | 0 |
| `bunx vitest run --maxWorkers=2 --shard=3/4` | 2,066 | 0 |
| `bunx vitest run --maxWorkers=2 --shard=4/4` | 1,971 | 0 |
| **Total** | **8,040** | **0** |

Total reconciliation: **8,031 + 6 featured cases + 1 SIGNIN_FIX_2 + 2 follow-rule cases = 8,040**. Shards 3 and 4 were rerun after the date-row width adjustment, with the same counts. Shards 1/2 preceded that final presentation adjustment. No known/pre-existing test failures appeared; `tourIsland.test.tsx:235` did not recur.

Latest preview log: **build OK** (2026-11-10 11:47:24 UTC). The intermediate ByRoleOptions `exact` type error was corrected with an anchored name expression; no surviving error.

## Phone-width checks
Production FeaturedRoundCard and real global stylesheets/i18n rendered in a temporary isolated fixture. Checked 320, 390 and 430 CSS pixels with a deliberately long name, course-record figure, hole-in-one words and birdie-run words, in both Follow states: **18 checks passed**.

- No name/feat collision at any width.
- Long name ellipsised first in all 18 cases.
- Follow/Following stayed on the date line and within its width in all cases.
- No page overflow or browser page errors.
- Clicking Follow updated the fixture's Following state without opening the card.
- An initial width check exposed a genuinely cramped date line for the long birdie-run feat; extending that row across the two text columns resolved it. Final checks passed.

Evidence: `docs/verification/featured-round/measurements.json` and 18 header screenshots. Examples:
- `docs/verification/featured-round/course_record_320_following.png`
- `docs/verification/featured-round/hole_in_one_320_follow.png`
- `docs/verification/featured-round/birdie_run_390_following.png`

Temporary fixture source was removed. Screenshots were visually inspected.

Authenticated live Home/Explore mutation-and-readback remains **unverified**: this project reports `external_unmanaged`, so no managed test session is available. Device checks still required: follow/unfollow an actual featured member on Home rail, Home featured feed post and Explore; confirm own-round absence and the cross-surface cache result. Fixture interaction is not claimed as a real account follow.

## Original build outcome carried forward
The card uses the standard score-post body rather than a separately rebuilt plot. The old photo, photo wash/frame, top pill and static RoundShape preview were removed; the champion gold wash and ring remain. Existing net-row tests cover the no-NET/no-line case. Course record uses gross + COURSE RECORD (joint qualifier when applicable); hole-in-one/albatross, birdie-run/eagle-brace/birdie-haul/clean-card use words; stableford reasons use points + PTS; exceptional net reasons use net to-par; the fallback uses vs-handicap. Selection and placements remain unchanged.

No SQL, migrations, deployed RPC/edge changes, guest-browsing changes, review wizard, news, round plots, native/Median or feed_config changes were made. round_pool_cap remains untouched.