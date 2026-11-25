# Brief 25 close-out

## Parts
- A (f9e9dde502): Places category `sport.golf_course` (call + header comment); non-OK bodies (first 200 chars, apiKey values replaced with ***) carried as `message: body=...` in both getJson paths, logged as `firstHttpError club=... status=400 body=...`; httpError on one club (timeouts included, reverse-town lookups included) stamps now − 23 days (RETRY_DAYS 30 − 7); blocked unchanged. Deployed `geocode-played-clubs` alone at ~18:39 UTC 25 Nov 2026. Not triggered, nothing scheduled.
- B1 (79e2dddf08): Your courses hidden on a non-live club, like Insights.
- B2: no change (38px circles).
- B3 (d0b4822ab2): invite tile 44×44, radius 14, Plus 18.
- B4 (002cd591c5): current account line "Under review · View page"; the single "Switch to …" button shows the status line for a non-live club.
- B5 (b6c0dc4e96): see below.
- B6: audit below, no fixes needed.
- B7 (353e655804): new `ListingStatusPanel` owns the card and its claim sheet; profile page uses it.
- Tests (78f116554a).

## B5 routes and handlers
- Routes wrapped in `NotLiveBusinessRedirect` (replace to /business/:id): `/business/:id/insights`, `/business/:id/course`, `/business/:businessId/team/invite`. Edit is not wrapped.
- Posting/messaging as the business: there's no route to guard. `ActiveActorContext` already leaves non-live businesses out of `availableActors`, so the app can't act as one.
- `notLiveErrorMessage` (42501 + the "This club is still being checked" / "This club isn't open yet" prefixes) feeds the normal toast in: `useBusinessTeam` both invite onError handlers; `StageComposer` publish and edit-save catches.

## B6 audit — business_accounts embeds in src
| Read | Verdict |
|---|---|
| useDeleteAccount.ts:19 `business_accounts(name)` | null name filtered out; warning skips it |
| useMyBusinesses.ts:54 `business:business_accounts(...)` | null business filtered out before use |
| useReviewResponses.ts:39 `business_accounts!inner(...)` | inner join drops the row; reply not shown |
| usePostData.tsx:28 and :75 `business:business_accounts!actor_id(...)` | MiniPlayer reads `business?.name ?? null`; no crash |
| BusinessInviteAcceptPage.tsx:47 `business:business_accounts!...(...)` | falls back to "this business", no logo |

## Existing tests changed
- brief22SecondPass.test.ts:23 — old `expect(seen[1]).toContain('categories=sport.golf');` new `expect(new URL(seen[1]).searchParams.get('categories')).toBe('sport.golf_course');` (A2).
- geocodePlayedClubs.test.ts:109–110 — old `it('an HTTP error leaves geocode_attempted_at unset'` / `expect(updateFor({ kind: 'httpError' }, now.toISOString())).toBeNull();` new `it('an HTTP error stamps geocode_attempted_at 23 days back'` / `toEqual({ coords: null, stamp: { geocode_attempted_at: <now − 23 days> } })` (A4).
- geocodeGolfClub.test.ts:14 — old `toEqual({ kind: 'httpError', status: 500 })` new `toEqual({ kind: 'httpError', status: 500, message: 'body=x' })`. The brief did not name this test. A3's new error shape changes the result it encodes, so I updated it under the documented-rule clause and am reporting it here.

## New tests
brief25Geocode.test.ts (3), brief25PendingFollowUps.test.tsx (9). No new strings, so no locale changes.

## Shards (sequential, no retries)
| Shard | Tests | Files |
|---|---|---|
| 1/4 | 2,532 | 232 |
| 2/4 | 2,544 | 232 |
| 3/4 | 2,736 | 232 |
| 4/4 | 2,811 | 230 |
| Total | 10,623 | 926 |

Against 10,611 / 924: +12 / +2, exactly the two new files above.

No SQL was run and no migration was written.
