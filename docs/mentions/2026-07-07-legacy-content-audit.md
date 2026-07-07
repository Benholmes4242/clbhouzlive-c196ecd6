# Legacy Mention Content Audit

**Date:** 2026-07-07
**Purpose:** measure the volume of pre-v2 `@handle` strings across
every user-authored text column before v2 goes live, and decide
whether a backfill is warranted.

## Method

For each user-authored text column, count rows where the content:
- **Legacy handle style:** contains `@word` but does **not** contain
  `@[` (i.e. `@bendonaldson` style, no v2 markup)
- **v2 markup:** contains a match for `@\[[^\]]+\]\((u|b):UUID\)`

Run against production Supabase, `2026-07-07`.

## Results

| Surface | Legacy `@handle` rows | v2 markup rows | Total non-null rows | % legacy |
|---|---:|---:|---:|---:|
| `post_comments.content` | 1 | 0 | 82 | 1.2% |
| `top_ten_comments.body` | 1 | 0 | 4 | 25.0% |
| `posts.content` | 12 | 0 | 297 | 4.0% |
| `course_ratings.review` | 1 | 0 | 139 | 0.7% |

## Decision: **no backfill**

- Total legacy rows across all four surfaces: **15**.
- Volume is trivially low.
- Backfill is unsafe: `@handle` → `user_id` resolution has no unique
  guarantee (users have renamed; historical handles now belong to
  different accounts in a few cases), so a rewrite could
  misattribute mentions.
- `MentionText` already handles legacy content correctly by
  degradation — the v2 regex doesn't match, and the string renders
  as plain text. Pre-existing behaviour, no regression.

## What "no backfill" means for users

- Old comments/posts that pre-date the v2 markup format will
  continue to display `@bendonaldson` as plain text (as they did
  before this PR).
- The moment a legacy row is **edited**, it flows through the same
  composer as a new row and can gain v2 markup organically.
- No historical notifications are generated or duplicated.

## Follow-up

None. Reviewed after the v2 write path has been live for 30 days:
if the plain-text drift becomes visible in user reports, revisit
with a per-mention manual disambiguation flow (never a bulk rewrite).
