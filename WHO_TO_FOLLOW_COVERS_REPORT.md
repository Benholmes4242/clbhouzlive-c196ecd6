# Who to follow — cover cards and 48-hour activity

## Result
Added the signed-off decorative covers to the rail only: 68px cover area, sized/lazy image, scrim, no-cover/error gradient, 31px avatar overlap, card-coloured unringed padding, and a 26px dismiss circle inside a 44px target. Cards are 172×266 and Follow stays bottom-pinned. Existing ring gradient, active gap, activity line colour, destinations, dismissal/follow timings and community row appearance are preserved. Removed the rail heading's negative tracking as requested; the app's system font is retained rather than loading the mock's retired Geist.

The cover source/privacy choice remains server-owned. One typed `get_suggestion_covers` call per slot receives the same pre-hide slot list used by recent activity, separated into people/business IDs in display order. Each input is capped at 100; cache key includes viewer and sorted prefixed IDs, stale time is ten minutes, and focus refetch is off. Signed-out and anonymous sessions do not read. Existing generated Supabase types already contain this RPC, so no regeneration or cast was necessary.

Posts at 24 hours or more use `findPeople.active.postedYesterday`; rounds/reviews retain their course wording. The existing server-provided 48-hour window is consumed without client re-filtering. All six locale files receive the approved English key, matching their existing active-ring strings.

## Changed files
- `src/features/find-people/useSuggestionCovers.ts` — new batched read; module header records ownership.
- `src/features/find-people/SuggestionCover.tsx` — new decorative image/failure state.
- `src/features/find-people/suggestion-covers.css` — new scoped cover/dismiss geometry.
- `src/features/find-people/WhoToFollowRail.tsx` — slot read, covers and authorised card geometry.
- `src/features/find-people/ActiveRing.tsx` — inactive card padding only; canvas padding unchanged.
- `src/features/find-people/activeRingRules.ts` — yesterday bucket.
- `src/features/find-people/useRecentActivity.ts` — correct 48-hour ownership comment.
- `src/index.css` — semantic cover/card/dismiss tokens.
- `public/locales/en/common.json`
- `public/locales/en-XA/common.json`
- `public/locales/de/common.json`
- `public/locales/es/common.json`
- `public/locales/ja/common.json`
- `public/locales/ko/common.json`
- `src/test/activeRing.test.tsx`
- `src/test/wfFixRail.test.tsx`
- `roadmap.md`
- `WHO_TO_FOLLOW_COVERS_REPORT.md`

No SQL, migrations, migration files, deployed RPC/edge-function changes, feed_config changes, round_pool_cap changes, native/Median changes, or guest-browsing/review-wizard/news/round-plot changes.

## Tests and exact inventory reconciliation
Last reported baseline: **5,936 tests / 545 files** (EXPLORE_TOP_1).
Final: **5,946 passing / 545 files**. No failures or unhandled errors in any shard. No pre-existing test failures were observed.

`activeRing.test.tsx` grows from 15 to 25 cases, adding exactly ten:
1. `post at 1439 minutes uses the correct age bucket` — postedHours with n=23.
2. `post at 1440 minutes uses the correct age bucket` — postedYesterday, no variables.
3. `post at 2820 minutes uses the correct age bucket` — postedYesterday, no variables.
4. `makes one cover call for all slot cards and keeps cover dismissal isolated` — batched arguments, image/plain state, dismissal without profile navigation.
5. `renders a sized lazy decorative image and scrim, then falls back on error` — 344px URL, decorative/lazy/async attributes, error removes image and scrim.
6. `renders the plain material without an image or scrim when no cover exists`.
7. `keys match railCardId for people and businesses`.
8. `caps each input at 100 and preserves display order`.
9. `does not read when signed out`.
10. `does not read with no ids`.

No tests deleted. Two existing cases were changed because the brief explicitly changes card height:
- `wfFixRail.test.tsx`, **golfer and business cards share the fixed height and a bottom-pinned Follow button**: `expect(card.style.height).toBe('252px')` → `expect(card.style.height).toBe('266px')`. All flex/button assertions stay unchanged.
- `activeRing.test.tsx`, **an unringed card has an empty when line of the same height and no avatar button; cards are 252 tall** renamed only at the end to **cards are 266 tall**. Assertions `expect(card.style.height).toBe('252px')` and `expect(cardOf('Danny Holmes').style.height).toBe('252px')` become `'266px'`; all when-line and avatar-door assertions stay unchanged.

Focused command: `bunx vitest run src/test/activeRing.test.tsx src/test/wfFixRail.test.tsx src/test/wf2FeedRail.test.tsx --maxWorkers=2` — **61/61, three files**.

Full commands: `bunx vitest run --maxWorkers=2 --shard=N/4`, N=1..4:
| Shard | Passing tests | Passing files | Exit |
|---|---:|---:|---:|
| 1 | 1,492 | 137 | 0 |
| 2 | 1,470 | 137 | 0 |
| 3 | 1,526 | 137 | 0 |
| 4 | 1,458 | 134 | 0 |
| Total | 5,946 | 545 | |

Complete outputs retained at `/tmp/cover-cards/focused.log` and `/tmp/cover-cards/shard1.log` through `shard4.log`. Existing non-failing test warnings (Browserslist/ref mock) are not unhandled errors.

Automatic preview build/typecheck: **build OK**, latest entry `2026-11-02T21:34:25Z`. The separately requested manual `NODE_OPTIONS=--max-old-space-size=6000 npx tsc --noEmit -p tsconfig.app.json` was not run: the environment prohibits manual project builds/typechecks and runs its own automatic checks.

## Visual verification limitation
Signed-in live card readback and screenshot comparison could not be performed: this project's browser auth is `external_unmanaged`. No member session was invented, no credentials requested, and no guest gate bypassed. Cover image/failure, batching, navigation isolation and dismissal were exercised through real QueryClientProvider/MemoryRouter tests. CSS supplies the requested scrim/gradient, dismiss positioning and inactive-card material; exact visual parity remains unverified, not claimed complete.