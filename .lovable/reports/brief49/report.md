# Brief 49 — final report

28 November 2026. Code, tests and deployment were accepted by Ben; this request completed the screenshot evidence and report only.

## 1. Files changed across the brief

- `src/features/activity-v2/utils/activityLinks.ts`
- `supabase/functions/_shared/notifRoute.ts`
- `src/pages/Clubhouse.tsx`
- `src/components/clubhouse/hooks/useClubhousePostArrival.ts`
- `src/components/feed/CardFeed.tsx`
- `src/components/feed/useFeedPostArrivalScroll.ts`
- `src/styles/top-ten.css`

Test files:

- `src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts` — authorised rewrite
- `src/test/brief31TopTen.test.tsx` — authorised rewrite
- `src/test/brief39TopTenAlertPost.test.ts` — authorised rewrite
- `src/test/brief49ClubhousePostArrival.test.tsx` — new
- `src/test/brief49TopTenAlertsPills.test.tsx` — new

Reports/evidence: `roadmap.md`, `.lovable/reports/brief49/report.md`, the accepted deployment record and four shard logs, test-delta ledger and screenshots.

Post-bearing `top_ten_update` and `new_course` alerts use `/?post=<id>`. The arrival target is consumed once; the shared published reader supplies a missing pinned card, later pages deduplicate it, and failure silently leaves the normal feed. The `/post/<id>` shared-link route and `TenPostPermalink` remain unchanged. Pills use auto height, 26px minimum, 5px/10px padding, 16px lines and a two-line clamp without changing font weight/size/colour.

## 2. Rewritten tests — six authorised assertions, zero deleted cases

No existing test file or case was deleted. Existing files keep the same declaration counts; parameterized cases remain in their original files. Renamed cases are listed old → new below. Shared fixture/selector edits are quoted in the full patch for their file.

### `src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts`

Reason: Ben explicitly ruled line 175 to be an authorised Brief 39 destination rewrite; parity and other notification cases stay unchanged.

- **top_ten_update with a post id opens the post**

  Old assertion(s):

```ts
expect(getActivityLink(row({ notif_type: 'top_ten_update', data: { target_user_id: 'u2', post_id: POST } }))).toBe(`/post/${POST}`);
```

  Replacement assertion(s):

```ts
expect(getActivityLink(row({ notif_type: 'top_ten_update', data: { target_user_id: 'u2', post_id: POST } }))).toBe(`/?post=${POST}`);
```

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts b/src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts
index 60fb092a63..5b2c3f543d 100644
--- a/src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts
+++ b/src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts
@@ -172,7 +172,7 @@ const TOUR_EXCEPTIONS: Fixture[] = ['tour_preview','tour_roundup'].map(notif_typ
 
 describe('notifRoute parity with activityLinks', () => {
   it('top_ten_update with a post id opens the post', () => {
-    expect(getActivityLink(row({ notif_type: 'top_ten_update', data: { target_user_id: 'u2', post_id: POST } }))).toBe(`/post/${POST}`);
+    expect(getActivityLink(row({ notif_type: 'top_ten_update', data: { target_user_id: 'u2', post_id: POST } }))).toBe(`/?post=${POST}`);
   });
   it('pro_round_posted opens the pro profile on the client', () => {
     expect(getActivityLink(row({ notif_type: 'pro_round_posted', data: { pro_id: ACTOR, event_id: 'event-1', round_no: 2, to_par: -3, holes_played: 18 } }))).toBe(`/profile/${ACTOR}`);
```

### `src/test/brief31TopTen.test.tsx`

Reason: Its top_ten_update post assertion had already adopted Brief 39; Brief 49 changes that exact destination to the Clubhouse query target.

- **top_ten_update with a post id routes to the post**

  Old assertion(s):

```ts
expect(getActivityLink({ notif_type:'top_ten_update', data:{target_user_id:'owner',post_id:POST.id}, actor_user_id:'actor' } as never)).toBe(`/post/${POST.id}`);
```

  Replacement assertion(s):

```ts
expect(getActivityLink({ notif_type:'top_ten_update', data:{target_user_id:'owner',post_id:POST.id}, actor_user_id:'actor' } as never)).toBe(`/?post=${POST.id}`);
```

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/brief31TopTen.test.tsx b/src/test/brief31TopTen.test.tsx
index 8b9733452f..04e1f6b8b0 100644
--- a/src/test/brief31TopTen.test.tsx
+++ b/src/test/brief31TopTen.test.tsx
@@ -92,7 +92,7 @@ describe('Brief 31 member ten', () => {
     }
   });
   it('top_ten_update with a post id routes to the post', () => {
-    expect(getActivityLink({ notif_type:'top_ten_update', data:{target_user_id:'owner',post_id:POST.id}, actor_user_id:'actor' } as never)).toBe(`/post/${POST.id}`);
+    expect(getActivityLink({ notif_type:'top_ten_update', data:{target_user_id:'owner',post_id:POST.id}, actor_user_id:'actor' } as never)).toBe(`/?post=${POST.id}`);
   });
   it('unreadable tens are removed before indices and pending tens keep their slots', () => {
     const posts=[{id:'before'},POST,{id:'after'}];
```

### `src/test/brief39TopTenAlertPost.test.ts`

Reason: Brief 49 expressly changes the four post-bearing inbox/push assertions; both no-post profile fallbacks stay unchanged.

- **routes data.post_id to /post/p1** → **routes data.post_id to /?post=p1**
  Assertions retain their meaning; updated shared selector/fixture access is quoted below.

- **routes a post entity to /post/p2** → **routes a post entity to /?post=p2**
  Assertions retain their meaning; updated shared selector/fixture access is quoted below.

- **routes data.post_id to /post/p1** → **routes data.post_id to /?post=p1**
  Assertions retain their meaning; updated shared selector/fixture access is quoted below.

- **routes a post entity to /post/p2** → **routes a post entity to /?post=p2**
  Assertions retain their meaning; updated shared selector/fixture access is quoted below.

Exact source change, including shared fixtures and selectors:

```diff
diff --git a/src/test/brief39TopTenAlertPost.test.ts b/src/test/brief39TopTenAlertPost.test.ts
index 2ab7f271ea..cccf939128 100644
--- a/src/test/brief39TopTenAlertPost.test.ts
+++ b/src/test/brief39TopTenAlertPost.test.ts
@@ -8,13 +8,13 @@ const withEntity = { ...base, notif_type: 'top_ten_update', entity_type: 'post',
 const noPost = { ...base, notif_type: 'top_ten_update', entity_type: 'top_ten', entity_id: null, data: { target_user_id: 'owner' } };
 
 describe('Brief 39 inbox: top_ten_update opens the post', () => {
-  it('routes data.post_id to /post/p1', () => expect(getActivityLink(withPostId as never)).toBe('/post/p1'));
-  it('routes a post entity to /post/p2', () => expect(getActivityLink(withEntity as never)).toBe('/post/p2'));
+  it('routes data.post_id to /?post=p1', () => expect(getActivityLink(withPostId as never)).toBe('/?post=p1'));
+  it('routes a post entity to /?post=p2', () => expect(getActivityLink(withEntity as never)).toBe('/?post=p2'));
   it('falls back to the profile link without a post id', () => expect(getActivityLink(noPost as never)).toBe('/profile/owner?tab=courses'));
 });
 
 describe('Brief 39 push: top_ten_update opens the post', () => {
-  it('routes data.post_id to /post/p1', () => expect(routeForNotif(withPostId as never)).toBe('/post/p1'));
-  it('routes a post entity to /post/p2', () => expect(routeForNotif(withEntity as never)).toBe('/post/p2'));
+  it('routes data.post_id to /?post=p1', () => expect(routeForNotif(withPostId as never)).toBe('/?post=p1'));
+  it('routes a post entity to /?post=p2', () => expect(routeForNotif(withEntity as never)).toBe('/?post=p2'));
   it('falls back to the profile link without a post id', () => expect(routeForNotif(noPost as never)).toBe('/profile/owner?tab=courses'));
 });
```

## Accepted full-suite results

The accepted combined run covered Briefs 48–48C and 49 together, sequentially on 28 November 2026. No tests were re-run for this screenshot/report-only request.

```text
npx vitest run --maxWorkers=2 --shard=1/4
npx vitest run --maxWorkers=2 --shard=2/4
npx vitest run --maxWorkers=2 --shard=3/4
npx vitest run --maxWorkers=2 --shard=4/4
```

| Shard | Passed tests | Passed files | UTC start | Duration |
|---|---:|---:|---|---:|
| 1/4 | 2,597 | 240 | 09:10:33 | 340.42s |
| 2/4 | 2,580 | 240 | 09:16:37 | 362.38s |
| 3/4 | 2,767 | 240 | 09:23:03 | 564.89s |
| 4/4 | 2,915 | 240 | 09:32:41 | 545.10s |
| **Total** | **10,859** | **960** | | |

**Zero failures.** Last passing baseline: **10,804 tests / 955 files** at `6b450d8dc8`. Difference: **+55 tests / +5 files**. Compared with the previous 10,859/960 attempt, suite scope is unchanged; its one obsolete parity assertion is now authorised and passing. No pre-existing failures are carried into the passing baseline or the accepted run.

| Added test file | Added executed cases |
|---|---:|
| `src/test/tourOverviewHybrid48.test.tsx` | 37 |
| `src/test/overviewUpcomingCupRead.test.tsx` | 3 |
| `src/test/overviewHybridPhotoNavigation.test.tsx` | 2 |
| `src/test/brief49ClubhousePostArrival.test.tsx` | 8 |
| `src/test/brief49TopTenAlertsPills.test.tsx` | 5 |
| **Total** | **55** |

Briefs 48–48C contribute **42 cases / 3 files**; Brief 49 contributes **13 cases / 2 files**. Rewritten existing cases contribute no count delta. Full runner logs are retained at `.lovable/reports/brief49/close/shard1.log` through `shard4.log`. The complete 55-case addition inventory, with parameterized names expanded, is in [test-delta.md](test-delta.md).

## process-push-queue deployment

**Successfully deployed**, using the existing worker and its shared `notifRoute.ts` import. The deployment tool confirmed:

```text
Successfully deployed edge functions: process-push-queue
process-push-queue source_sha256:
04b15a2dba54222272ca421d0ac32d2cbec18d20922c9c7a1e889efde1b25584
```

This is deployment confirmation, not verification of an actual delivered native push. No queue processing or notification send was invoked for screenshots. Previously delivered `/post/<id>` links remain supported.

## 5. Screenshot evidence

Actual signed-in native push captures were unavailable. The session command refused:

```text
gateway error (failed_precondition): this project's Supabase backend is user-managed; Lovable does not sign its tokens, so no session can be minted for it
```

Ben explicitly allowed test data instead of stopping. The captured **simulated Top 10 push** uses an isolated browser fixture, the actual `routeForNotif`, `useClubhousePostArrival`, `CardFeed`, `FeedCard` and `TenRail`, and a realistic `top_ten_update` payload for `fixture-ten`. It does not mint a session, send a push or contact the live backend. Data reads and identity providers are local fixture replacements; the static clbhouz header is fixture framing, not actual account-island evidence.

| Requested capture | Test-data result | Screenshot |
|---|---|---|
| Post already loaded | A fourth-card Thomas Muchmore Top 10 post; no singular read. After the simulated tap the card author starts at ~73.45px, under the 72px clearance; URL target consumed to `/`. Normal following posts stay below it. | `top-ten-push-loaded-fixture-390.png` |
| Post not loaded | Same target fetched once by the fixture substitute for the shared reader; pinned first at 72px; URL target consumed. A simulated later page includes its id but it remains exactly once. | `top-ten-push-missing-fixture-390.png` |
| Missing-post narrow supplement | Same pinned-first flow at 320px | `top-ten-push-missing-fixture-320.png` |
| Royal County Down long pill | Exact supplied line, within two lines | `royal-county-down-pills-fixture-390.png` |
| Royal County Down long pill, narrow | Exact supplied line, within two lines | `royal-county-down-pills-fixture-320.png` |

At both widths the short pill measured **26px**, the long pill **42px**, line height **16px**, clamp **2**. Visual screenshots confirm text stays inside the pill. The later-page readback contains one `fixture-ten` and the unchanged surrounding order plus the new page item. Final fixture page-error lists were empty. The initial short loaded fixture did not have sufficient trailing content to scroll to the fourth card; the apparatus was changed to a realistic longer feed, not the app.

This confirms the isolated UI flow, **not** receipt/tap of a production/native push, authenticated production post reads, actual full Clubhouse ranking or server impressions. No production impression was sent; the fixture records local ids only. The accepted jsdom tests cover the routing/fallback/deduplication rules and other routes remain protected by the existing suite.

## 6. Previous failure and scope findings

The preceding 10,859/960 attempt had one expected obsolete assertion:

```text
src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts:175
"top_ten_update with a post id opens the post"
AssertionError: expected '/?post=post-1' to be '/post/post-1'
```

Ben ruled it an authorised Brief 39 rewrite. Only that assertion changed to `/?post=${POST}`; no app change accompanied the correction. Its case name remains the same, and the final combined run has zero failures. The other four Brief 39 and one previously-updated Brief 31 destination assertions are individually named/quoted above. Both no-post fallbacks and other notification cases were preserved.

## Scope and constraints

This final request changed **reports and evidence only**: no application, test, function or configuration changes, no additional test run, no new deployment or push sent. The accepted source remains `b409d1ef40`.

No SQL, migrations or migration files. `feed_config` untouched; `round_pool_cap` remains 30. No native/Median changes and no security “Fix all”. No new security scan was requested or run, so this report makes no new security-findings claim. No credentials requested or authentication bypass added to the app. Temporary test-data readers/providers are confined to isolated browser fixtures and cannot contact the live backend.
