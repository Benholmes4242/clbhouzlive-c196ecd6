# Brief 31 — stopped verification checkpoint

## Status

**Stopped at the first unexpected test failure.** Shared profile/feed/permalink drawing is implemented but is not signed off as complete. No test was rerun, no full-suite shard was started, and no deployment or live flow was performed.

### Exact failure

`src/test/topTenOwnerLabelRender.test.tsx:98:50`

Test: **positions two to ten are square with rank at the top left**

```text
AssertionError: expected undefined to be '1' // Object.is equality

98| expect(getComputedStyle(tile).aspectRatio).toBe('1');
```

The source stylesheet already declares `aspect-ratio:1`. A standalone jsdom diagnostic (not a test rerun) returned `undefined` for `style.aspectRatio` and an empty string for `getPropertyValue('aspect-ratio')`. This environment does not expose that CSS property. No source or assertion was changed after the failure. Proposed ruling: make only this square-tile assertion inspect the actual `.ten-block .ten-tile` CSS declaration, retaining the expected ratio of 1; browser measurements must additionally verify real square dimensions.

## Commits

- `f7add06189` — Top Ten update activity/client/shared notification routing and parity cases.
- `ec8551e3e6` — shared block, profile replacement, feed admission/batching, permalink, explicit fullscreen/SnapFeed exclusions, search omission, mutation invalidation, new tests and authorised existing-test replacements.
- This report is saved in the subsequent checkpoint commit.

## Implemented

- One `TenBlock` with position-addressed ten slots, 178px full-width number one, square lower tiles, plain member scores with empty null corners, one course band after its containing row, dimming, reduced motion, course comments and course navigation.
- Server-owned score/comparison/chart facts; own/signed-out two-column and signed-in visitor three-column score bands. Existing share sheet remains the export owner.
- Profile display reads `get_top_ten_block`, with null/below-three visitor omission; owner below-three invitation remains, and Manage still uses its original curation hook. Added invalidation of both block key prefixes after add/remove/reorder and auto-order.
- Inline host lists batch `get_top_ten_post_blocks`; missing rows are removed before indices and mixed-item post indices are remapped. Pending cards retain the final block geometry.
- Feed mapper and published-post mapper propagate post kind. Ten cards omit fallback content and the standard course/media presentation while reusing author, owner menu and post actions.
- Permalinks use the same inline card, never fullscreen; post comments remain separate from course comments.
- Session identity is appended to the requested query-key prefixes to prevent viewer-private payload reuse across accounts. Reads wait for session resolution; no previous-viewer placeholder is used.

## Surface inventory

| Surface | Current work | Verification / remaining scope |
|---|---|---|
| Clubhouse CardFeed / FeedCard | Shared ten card, batched blocks, pending skeleton, pre-index omission/remapping | New card/admission tests pass; real page not exercised |
| Personal profile Posts → All | LightCardFeed uses the same card/batch/pre-index omission | Real profile feed and RPC kind projection still need checking |
| Business/club Posts → All | Same shared LightCardFeed path if a ten post is admitted | No business-specific card added; real admission not verified |
| Profile/business Reviews, Images, Videos, Shorts | Existing positive review/media filters naturally omit media-less ten posts | Final complete surface audit remains pending |
| Search All/posts | One page-level `posts(id,post_type)` classification read omits ten results; no fallback row rendered | Live read and pagination behavior unverified |
| `/post/:postId`, member or guest | `TenPostPermalink` reuses FeedCard; bypasses media-less redirects and fullscreen | Existing generic permalink regressions pass; actual ten permalink unverified |
| Fullscreen viewer | Explicit top-ten rejection plus existing media gate | New rejection still needs dedicated end-to-end verification |
| SnapFeed | Top-ten posts filtered before slide indices | Actual slide flow unverified |
| Watch grids, course Media grids/gallery | Remain media-only; no ten tile renderer introduced | Final candidate-level exclusion audit remains pending |
| Explore discovery/community/moments/watch rails | Existing media-oriented readers remain unchanged | Final reader/candidate audit remains pending |
| Friend-sheet latest snippet | Unchanged | Must complete reader audit and decide omission at source before close-out |
| Mini-player/composer/scheduled previews | No generated-ten creation/editor path added | Final eligibility audit remains pending |

### Other Top Ten readers

The only displayed member list was ProfileTopTenRail; it switched from client curation/enrichment to the RPC block. `useUserTopTenCourses` remains untouched in its selection/mutation logic for Manage (invalidation additions only). `ProfileHero` and `ProProfileBuildOne` use that hook for cover-photo fallback, not ten-list drawing, so those consumers were not switched. The audits identified their visibility-independent cover fallback as pre-existing behavior; no silent privacy/cover change was made.

The repository's old feed comment says `get_profile_posts` does not project post kind. The new mapper now carries kind when supplied; verifying the actual live projection or adding a safe batched kind hydration remains required before claiming every profile ten post renders correctly.

## Tests and population

Command:

```text
bunx vitest run src/test/brief31TopTen.test.tsx src/test/topTenTileWidth.test.tsx src/test/topTenOwnerLabelRender.test.tsx src/test/profileRailFollowup.test.tsx src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts src/test/brief18EyebrowInk.test.tsx src/test/cb109MediaFirstEverywhere.test.tsx src/test/viewPost1Navigation.test.tsx --maxWorkers=1 --no-file-parallelism
```

| File | Passed / total |
|---|---:|
| brief31TopTen | 12 / 12 |
| topTenTileWidth | 5 / 5 |
| topTenOwnerLabelRender | 6 / 7 |
| profileRailFollowup | 14 / 14 |
| notifRoute.parity | 92 / 92 |
| brief18EyebrowInk | 1 / 1 |
| cb109MediaFirstEverywhere | 9 / 9 |
| viewPost1Navigation | 13 / 13 |
| **Focused run** | **152 / 153, seven files passed and one failed** |

Last verified full-suite baseline: **10,676 tests / 930 files**. Full-suite after total: **not run**. Expected population after this brief: **10,690 / 931** (+14 tests / +1 file): twelve named cases in new `brief31TopTen.test.tsx`, plus the `top_ten_update` parity vector and explicit routing test (+2). No test file/case was deleted. The existing tile-width file stays five cases and owner-label render file stays seven cases.

The eight authorised renamed/replaced retired-layout cases, every old/new assertion and rationale are quoted in `test-assertions.md`. The profileRailFollowup change is only a block-data mock; its deep-link assertions are unchanged. The notification additions do not edit any existing assertion.

| Full-suite shard | Result |
|---|---|
| 1/4 | Not started — focused test stop |
| 2/4 | Not started |
| 3/4 | Not started |
| 4/4 | Not started |

Log: `/tmp/brief31-focused.log` (sandbox temporary log).

## Screenshots, runtime and safety

- Preview build log: **build OK**, latest observed `2026-11-25T23:48:37Z`.
- 320/375/390 measurements and all four requested 390 captures: **not performed**; neither actual signed-in nor guest ten flow verified.
- No SQL run, no migration or migration file written, no generated database type edits (signatures already exist).
- `feed_config` untouched; `round_pool_cap` unchanged at 30.
- No security “Fix all”, no security finding changes, and no new security scan performed.
- No function deployed, no trigger invoked and no schedule created in Brief 31.

## Next checkpoint

Await the exact square-tile test assertion ruling. Then resolve that check without changing the square ratio, finish candidate/kind-projection and real-viewer checks, capture the four states at 390 and measure 320/375/390, run four sequential shards against 10,676 / 930, stopping at any unexpected failure, and replace this stopped status with the actual close-out.