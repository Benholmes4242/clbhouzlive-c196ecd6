# Review suggestions — only courses the member has actually been to

## Confirm read (brief's cause)

Ben (`8c240997-b6a1-408c-a953-794bc17ee35c`, benjaminholmes) on the two named courses:

| Course | created_at | actor_type | actor_id |
|---|---|---|---|
| Royal Norwich (`1658ceed…`) | 2026-07-23 10:26 | **business** | `b54c35bf…` (clbhouz business actor) |
| Sunningdale Golf Club (Old) (`f667e22a…`) | 2026-01-27 06:41 | personal | Ben himself |

Both rows have `whs_score_id`/`source_review_id` null, so the old query counted both as
"You posted from here". The cause is confirmed: the business-actor post on Royal Norwich
was never filtered. Sunningdale (Old) is a genuine personal post and stays eligible.

## Fix (`src/features/composer-flow/hooks/useReviewSuggestions.ts`)

1. **Posted** — the posts read now selects `actor_type, actor_id` and keeps only
   `actor_type = 'personal'`, or `actor_id = userId` where `actor_type` is null on older
   rows. Filtered in JS after the read (the query builder has no OR for this shape);
   business-actor posts never count.
2. **Played (new source, ahead of posted)** — `gam_round_stats` by `user_id`, `course_id`
   not null, ordered by `play_date` desc. Chosen over `user_whs_played_golf_course_ids`
   because that table does not exist in this database; `gam_round_stats.course_id` was
   verified to join `golf_courses.id` directly (the mapped course id). Reason:
   "You played here on {d MMM}" with the latest round's date. New key `reason.played`
   added to all six locales (en, de, en-XA, es, ja, ko), each carrying the English.
3. **Priority** — club → played (most recent first) → posted → followed reviewers →
   popular only when nothing personal exists. Two-row cap, reviewed exclusion and
   fail-closed reads unchanged.

## Proof from Ben's real data

- Club: Sundridge Park (East) and (West) — both already reviewed → excluded.
- Played, not yet reviewed, most recent first: Rochester & Cobham Park (4 Aug 2025),
  Vale do Lobo (Ocean) (9 May 2025), Westerham (17 Jun 2023)…
- Posted: Sunningdale (Old) personal post survives; Royal Norwich business post excluded.

His sheet now shows: **Rochester & Cobham Park Golf Club — "You played here on 4 Aug"**
and **Vale do Lobo (Ocean) — "You played here on 9 May"**. Sunningdale (Old) is third
and cut by the two-row cap; Royal Norwich no longer appears.

## Tests (`src/test/reviewSuggestions.test.tsx`, 21 → 26, +5)

New:
- `a played course outranks a posted one and formats its latest d MMM play date`
- `played courses are most-recent first`
- `a business-actor post never produces a posted suggestion; a personal post does`
- `a legacy post with null actor_type counts only when actor_id is the member`
- `played courses come from gam_round_stats and outrank posted ones`

Changed (brief authorises updating tests encoding the changed rules):
- `club precedes own post and caps at two before followed courses` → renamed
  `club precedes played and own post, capping at two before followed courses`; a played
  row now takes slot two (old assertion `[['club','club'],['post','posted']]` →
  `[['club','club'],['other','played']]`).
- `excludes every course already reviewed by the member` and
  `only returns courses that resolve to golf_courses rows` — fixtures gained played
  rows; assertions unchanged.
- `only reads own composer posts with non-null course and null reference ids` —
  fixtures gained actor fields; assertion unchanged.
- `uses one identity-scoped query when open and signed in` — forbidden-table list now
  permits `gam_round_stats` (the new played read); `whs_scores`/`whs_rounds` stay banned.

No test deleted.

## Results

- Targeted: 26/26.
- Full suite in shards: 2,450 + 2,494 = **4,944/4,944 across 497 files** (+5 over the
  4,939/497 baseline, reconciled by name above). No failures, no unhandled errors.
- Typecheck clean. Automatic build OK (14:50:32Z).

No SQL, migrations, RPC/edge, `feed_config`, or native/Median changes; `round_pool_cap`
untouched. Nothing visual changed; no negative letter-spacing introduced.
