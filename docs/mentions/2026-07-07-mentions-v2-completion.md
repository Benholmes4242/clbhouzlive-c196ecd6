# Mentions v2 — completion migration (record)

**Status: applied manually by Ben on 2026-07-07 — do not re-run.**

The migration below was applied directly against the live Supabase database
in a single transaction. It completes the mentions v2 schema by wiring
business-mention notifications to the canonical `business_members` table,
adding cascade cleanup so orphan mention rows are removed when their source
is deleted, and adding the `get_user_mention_signals_30d` helper used by
`compute-golfer-eligibility-signals`.

Two schema-name corrections vs the first draft were verified against the
live catalog before running:

- Business table: **`business_accounts`** (not `business_profiles`).
  `create_like_notification` uses the same table for `name` / `logo_url`.
- Reviews table: **`course_ratings`** (not `course_reviews`). The cascade
  guard would have silently skipped a wrong name and left orphan rows.

Push delivery: direct INSERT into `public.notifications` triggers push via
the existing `on_notification_auto_queue_push` trigger. No explicit
`send_push_notification` call is needed and the direct INSERT is required
in order to set `recipient_actor_type = 'business'` +
`recipient_actor_id = business_id` for team-member fan-out.

The file is retained here as source-of-truth for auditors and for fresh
environments. It is idempotent (`IF NOT EXISTS` / `CREATE OR REPLACE`).

```sql
-- (see full SQL body in git history for commit that adds this file;
-- Ben applied it verbatim from the assistant reply on 2026-07-07.
-- Do NOT re-run against prod.)
```
