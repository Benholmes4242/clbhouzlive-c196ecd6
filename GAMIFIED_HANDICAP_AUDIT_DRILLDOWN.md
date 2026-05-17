# Gamified Handicap Audit — Drilldown

Companion to `GAMIFIED_HANDICAP_AUDIT.md`. Read-only inventory for two
follow-ups: (A) the four WHS edge functions that aren't checked into the
repo, and (B) the full schema of every `whs_*` table with a real sample row
from Benjamin's connection.

---

## Drilldown A — `connect-whs`, `sync-whs-one`, `create-whs-invite`, `sync-whs-due`

### A.0  Source-availability note (important)

The TypeScript source for these four functions is **not in the repository**
(confirmed: `supabase/functions/` only contains `backfill-whs-course-mapping`,
`delete-whs-data`, `disconnect-whs` from the WHS family). They are deployed
to Supabase project `ybxkehyomcakqjvuhnna` but cannot be pulled from the
sandbox — the Supabase Management API requires a personal access token that
is not in this environment, and `supabase functions download` is gated on
the same token.

Everything below is reconstructed from three observable sources:

1. **Client call sites** — `src/lib/whs/api.ts` (request shapes + response
   types) and `src/lib/whs/types.ts`.
2. **Database side-effects** — every `whs_*` table's columns, defaults, and
   the rows actually present for Benjamin's connection after a sync.
3. **Triggers** — `pg_trigger` rows on `whs_*` tables that fire *because*
   these edge functions write to them.

This is sufficient to enumerate the write-surface (point 2 of the brief) and
the client contract (points 4–5). Full source listings (point 1) and inline
comments / TODOs (point 6) cannot be produced without management API access
or a fresh `supabase functions download` from a workstation that has the
project's access token. **Recommend running `supabase functions download
connect-whs sync-whs-one create-whs-invite sync-whs-due --project-ref
ybxkehyomcakqjvuhnna` locally and checking the result into
`supabase/functions/`** so future audits don't have this blind spot.

---

### A.1  `connect-whs`

**Client call** (`src/lib/whs/api.ts:254`):

```ts
POST {SUPABASE_URL}/functions/v1/connect-whs
Headers: { Authorization: Bearer <user JWT>, apikey, Content-Type: application/json }
Body: { membership_number: string, password: string }
→ ConnectWhsResponse
```

`ConnectWhsResponse` shape (from `src/lib/whs/types.ts`):
```ts
{ ok: true, passport_id: number, initial_sync_complete: boolean }
| { ok: false, error_code: 'invalid_credentials'|'locked'|'rate_limited'|'internal_error'|..., message: string }
```

**Tables it writes** (inferred from schema + downstream rows):

| Table | Op | Columns populated |
|---|---|---|
| `whs_connections` | INSERT (one per user/provider) | `user_id`, `provider='england_golf'`, `passport_id`, `membership_number`, `vault_secret_id` (FK into `vault.secrets` — password is stored encrypted there, **never** in the table), `last_synced_at`, `last_sync_status`, `initial_sync_complete`, `created_at`, `updated_at` |
| `whs_courses` | UPSERT (per course seen in initial backfill) | `provider`, `upstream_course_id`, `name`, `country_code`, `country_name`, `is_linked_to_multi_course_club`, `last_seen_course_rating`, `last_seen_slope_rating`, `last_seen_marker_name` |
| `whs_scores` | INSERT (every historical EG round) | full row, see A.4 — including `raw_payload` jsonb (the verbatim England Golf response for that score) |
| `whs_score_holes` | INSERT (per hole, when EG returns hole-by-hole) | `score_id`, `hole_no`, `par`, `distance_yards`, `stroke_index`, `strokes_allowed`, `actual_gross`, `adjusted_gross`, `played` |
| `whs_handicap_snapshots` | INSERT (initial value at connect) | `connection_id`, `handicap_index`, `observed_at=now()` |
| `whs_friends` | UPSERT (every "marker" seen in any round) | `connection_id`, `friend_passport_id`, `friend_name`, `friend_gender`, `friend_home_club`, `friend_handicap_index`, `friend_thumbnail_url`, `friend_privacy_mode`, `last_round_*` fields |

**Hole-by-hole?** Yes, written to `whs_score_holes`. The boolean
`whs_scores.hole_by_hole_fetched` flips to `true` per score row once holes
are persisted.

**Returns to client:** `{ ok, passport_id, initial_sync_complete }`. Client
then immediately calls `fetchWhsConnection` to display state.

**Async/downstream:**

- Trigger `whs_connections_complete_invites_aft_insert` → `complete_pending_whs_invites()` runs on every connect insert: scans `whs_invites` for any pending invite whose `invitee_passport_id` matches this new connection's `passport_id`, marks them redeemed, and writes a row into `whs_invite_completions` (see A.3).
- Trigger `trg_sync_user_profiles_handicap_from_snapshot` on the initial snapshot insert pushes `handicap_index` into `user_profiles.eg_handicap_index`.
- Trigger `trg_notify_friend_content_recompute` fires once per inserted `whs_scores` row.

**TODOs / FIXMEs:** unknown — source not available in repo.

---

### A.2  `sync-whs-one`

**Client call** (`src/lib/whs/api.ts:268`):
```ts
POST {SUPABASE_URL}/functions/v1/sync-whs-one
Headers: { Authorization, apikey }
Body: (none — connection resolved from JWT)
→ SyncWhsResponse: { ok: boolean, message?: string, new_scores?: number, handicap_changed?: boolean }
```

**Tables it writes** (delta-sync of the single calling user's connection):

| Table | Op | Notes |
|---|---|---|
| `whs_connections` | UPDATE | `last_synced_at`, `last_sync_status`, `last_sync_error`, `consecutive_failures`, `next_sync_after`, `updated_at` |
| `whs_courses` | UPSERT | any new courses encountered |
| `whs_scores` | INSERT | only rounds newer than the connection's most recent `play_date` / `upstream_score_id`. Conflict on `(connection_id, upstream_score_id)` skips dupes. |
| `whs_score_holes` | INSERT | per hole for each new score |
| `whs_handicap_snapshots` | INSERT | one row **only when** the freshly-fetched `handicap_index` differs from the previous snapshot (this is why a stable handicap shows as a single point on the chart) |
| `whs_friends` | UPSERT | new markers from the new rounds |

**Hole-by-hole?** Yes, same flow as `connect-whs`.

**Returns to client:** `SyncWhsResponse` — the client uses `new_scores` to
toast "X new round(s) imported" and `handicap_changed` to invalidate the
handicap trend query.

**Async/downstream:**

- `trg_notify_friend_content_recompute` (on `whs_scores`) — recomputes friend feed materialised views via `pg_notify`.
- `trg_sync_user_profiles_handicap_from_snapshot` — only fires when a new snapshot row is inserted (i.e. handicap actually changed).
- No notification / push insert happens in `sync-whs-one` itself based on the schema — `notifications` table has no row pattern tied to `whs_scores.id` and there are no triggers on `whs_scores` that insert into `notifications`. **A new round does not currently produce a push or in-app notification.**

**TODOs / FIXMEs:** unknown — source not in repo.

---

### A.3  `create-whs-invite`

**Client call** — search of repo finds the type `CreateInviteResponse` but
**no live call site to `create-whs-invite`**. The invite-status fetch hits
the view `whs_invite_status` directly via `from()`. Either the function is
dormant, or it's invoked from a UI surface that has since been removed and
the type was kept. Worth confirming.

Expected body (from `CreateInviteResponse` type):
```ts
Body: { invitee_passport_id: number, invitee_name: string, invitee_home_club?: string, share_method?: 'sms'|'email'|'copy_link' }
→ { ok: true, invite_id: uuid, invite_code: string, share_url: string }
| { ok: false, error_code, message }
```

**Tables it writes:**

| Table | Op | Columns |
|---|---|---|
| `whs_invites` | INSERT | `inviter_user_id`, `inviter_connection_id`, `invitee_passport_id`, `invitee_name`, `invitee_home_club`, `invite_code` (unique, random), `share_method`, `sent_at` |

**Hole-by-hole?** No.

**Returns:** invite id, code, share URL for the inviter to share.

**Downstream:** when the invitee later runs `connect-whs` with a matching
passport id, the trigger `complete_pending_whs_invites` populates
`whs_invite_completions` and stamps `redeemed_at` / `redeemed_by_user_id`
on the `whs_invites` row. View `whs_invite_status` joins both for display.

**TODOs / FIXMEs:** unknown — source not in repo.

---

### A.4  `sync-whs-due`

Cron-driven batch sync. Not directly callable from the client (no reference
to it in `src/`). Schedule lives in `cron.job` (pg_cron) outside the repo;
inferable behaviour:

**Selects:** `whs_connections` rows where
`next_sync_after <= now() AND last_sync_status != 'fatal'`, batched
(probably 50–200 per invocation).

**For each:** runs the same delta-sync flow as `sync-whs-one`, so writes
the same set of tables (see A.2). Updates `next_sync_after` to schedule
the next attempt (typical pattern: +6 h on success, exponential backoff
on failure; the `whs_connections.consecutive_failures` integer and the
`6h` offset in Benjamin's row — `next_sync_after = last_synced_at + 06:00`
— corroborate this).

**Returns to client:** not user-facing — likely a JSON summary
`{ processed, succeeded, failed }` consumed by the cron logs only.

**Async/downstream:** same triggers as `sync-whs-one` (notify_friend_content_recompute, sync_user_profiles_handicap_from_snapshot). No notification writes observed.

**TODOs / FIXMEs:** unknown — source not in repo.

---

### A.5  Triggers fired by the four functions (authoritative — from `pg_trigger`)

```
whs_connections   AFTER INSERT  → complete_pending_whs_invites()
whs_connections   BEFORE UPDATE → set_updated_at()
whs_scores        AFTER  INS/UPD/DEL → notify_friend_content_recompute()
whs_scores        BEFORE UPDATE → set_updated_at()
whs_handicap_snapshots AFTER INSERT → sync_user_profiles_handicap_from_snapshot()
whs_friends       AFTER INS/UPD → log_friend_handicap_snapshot()  (writes whs_friend_handicap_snapshots)
whs_courses       BEFORE UPDATE → set_updated_at()
whs_invites       BEFORE UPDATE → set_updated_at()
```

This is the complete downstream surface — anything a gamification engine
needs to listen for must hook one of these or add a new trigger.

---

## Drilldown B — every `whs_*` table

Tables present: `whs_ai_insights`, `whs_ai_recommendation_history`,
`whs_connection_nudges`, `whs_connections`, `whs_country_to_golf_country`,
`whs_course_aliases`, `whs_courses`, `whs_friend_course_bests`,
`whs_friend_handicap_snapshots`, `whs_friend_matches` (view),
`whs_friend_window_rankings` (view), `whs_friends`,
`whs_handicap_snapshots`, `whs_invite_completions`,
`whs_invite_status` (view), `whs_invites`, `whs_round_reactions`,
`whs_score_holes`, `whs_scores`, `whs_to_golf_course_map`.

### B.1  Temporal anchors at-a-glance

| Table | created_at | updated_at | other time column usable for streaks |
|---|---|---|---|
| `whs_connections` | ✓ | ✓ | `last_synced_at` |
| `whs_scores` | ✓ | ✓ | **`play_date` (date)**, `capture_date` (timestamptz) ← use `play_date` for streaks |
| `whs_score_holes` | — | — | inherits via `score_id → whs_scores.play_date` |
| `whs_handicap_snapshots` | — | — | **`observed_at`** |
| `whs_friend_handicap_snapshots` | ✓ | — | `snapshot_date` |
| `whs_friends` | `first_seen_at` | `last_seen_at` | `last_round_played_at` |
| `whs_invites` | ✓ | ✓ | `sent_at`, `redeemed_at` |
| `whs_invite_completions` | — | — | `completed_at` |
| `whs_connection_nudges` | — | — | `sent_at` |
| `whs_round_reactions` | ✓ | — | — |
| `whs_courses` | ✓ | ✓ | — |
| `whs_course_aliases` | — | — | `resolved_at` |
| `whs_to_golf_course_map` | — | — | `matched_at`, `reviewed_at` |
| `whs_ai_insights` | — | — | `generated_at`, `date_key` |
| `whs_ai_recommendation_history` | — | — | `generated_at`, `date_key` |

### B.2  Per-table column lists (full)

#### whs_connections
```
id                      uuid       NN  default gen_random_uuid()
user_id                 uuid       NN
provider                whs_provider NN default 'england_golf'
passport_id             bigint     NN
membership_number       text       NN
vault_secret_id         uuid       NN     ← FK to vault.secrets (password)
last_synced_at          timestamptz NULL
last_sync_status        text       NULL  ('ok'|'error'|...)
last_sync_error         text       NULL
consecutive_failures    int        NN default 0
next_sync_after         timestamptz NULL
initial_sync_complete   bool       NN default false
created_at              timestamptz NN default now()
updated_at              timestamptz NN default now()
```

#### whs_courses
```
id                              uuid  NN
provider                        whs_provider NN
upstream_course_id              bigint NN
name                            text  NN
country_code                    text  NULL
country_name                    text  NULL
is_linked_to_multi_course_club  bool  NN default false
last_seen_course_rating         numeric NULL
last_seen_slope_rating          int   NULL
last_seen_marker_name           text  NULL
created_at / updated_at         timestamptz NN
```

#### whs_scores (round-level — primary gamification source)
```
id                              uuid    NN
connection_id                   uuid    NN
upstream_score_id               bigint  NULL
whs_score_uid                   text    NULL
course_id                       uuid    NULL  → whs_courses.id
play_date                       date    NN     ← TEMPORAL ANCHOR
capture_date                    timestamptz NULL
total_holes                     int     NN
is_nine_hole                    bool    NN default false
actual_gross                    int     NULL   ← GROSS SCORE (raw)
adjusted_gross                  int     NULL   ← GROSS SCORE (capped for handicap)
stableford_points               int     NULL   ← STABLEFORD POINTS
course_rating                   numeric NULL   ← COURSE DIFFICULTY
slope_rating                    int     NULL   ← COURSE DIFFICULTY
pcc                             numeric NULL   ← daily playing-conditions adjustment
marker_name                     text    NULL   ← TEE PLAYED (e.g. "Black", "White")
course_handicap                 int     NULL
handicap_differential           numeric NULL
handicap_index_at_time          numeric NULL
is_counter                      bool    NN default false
is_considered                   bool    NN default false
is_competition_score            bool    NN default false
is_penalty_score                bool    NN default false
is_eligible_for_handicapping    bool    NN default true
all_holes_attempted             bool    NN default true
hole_by_hole_fetched            bool    NN default false  ← flag: holes present in whs_score_holes
permalink_url                   text    NULL
raw_payload                     jsonb   NULL   ← full England Golf response
created_at / updated_at         timestamptz NN
```

#### whs_score_holes (hole-level — birdie/eagle/HIO source)
```
id              bigint NN (seq)
score_id        uuid   NN → whs_scores.id
hole_no         int    NN
hole_alias      text   NULL
par             int    NN   ← combined with actual_gross to derive birdie/eagle/HIO
distance_yards  int    NULL
stroke_index    int    NULL
strokes_allowed int    NN default 0
actual_gross    int    NULL   ← per-hole gross
adjusted_gross  int    NULL   ← per-hole net-double-bogey capped
played          bool   NN default true
```
**No** dedicated `is_birdie` / `is_eagle` / `is_hio` column — these must be
derived as `actual_gross - par` (`-1`=birdie, `-2`=eagle, `actual_gross=1`=HIO).

#### whs_handicap_snapshots
```
id              bigint NN (seq)
connection_id   uuid   NN
handicap_index  numeric NN
observed_at     timestamptz NN default now()
```
Only one row per *change* — not one per day.

#### whs_friends
```
id, connection_id, friend_passport_id, friend_name, friend_gender,
friend_home_club, friend_handicap_index, friend_thumbnail_url,
friend_privacy_mode, last_round_played_at, last_round_course_name,
last_round_adjusted_gross, first_seen_at, last_seen_at
```

#### whs_friend_handicap_snapshots
```
friend_passport_id  bigint NN
snapshot_date       date   NN
handicap_index      numeric NULL
created_at          timestamptz NN
```

#### whs_friend_matches (view)
Joins `whs_friends` with `whs_connections` / `user_profiles` to surface
`friend_user_id`, `friend_connection_id`, `is_clbhouz_user`, `owner_user_id`.
Read-only; not writable by edge functions.

#### whs_friend_window_rankings (view)
Aggregates of `whs_scores` per friend: `this_year_avg_diff`,
`this_year_rounds`, `this_month_avg_diff`, `this_month_rounds`,
`last_8_avg_diff`, `last_8_rounds`. Recomputed on read; not stored.

#### whs_friend_course_bests
```
friend_connection_id, course_id, best_gross, best_score_id, best_play_date
```

#### whs_invites
```
id, inviter_user_id, inviter_connection_id, invitee_passport_id, invitee_name,
invitee_home_club, invite_code (unique), share_method, sent_at, redeemed_at,
redeemed_by_user_id, created_at, updated_at
```

#### whs_invite_completions
```
id, invite_id, inviter_user_id, invitee_user_id, invitee_passport_id, completed_at
```

#### whs_invite_status (view)
Convenience join of `whs_invites` + `whs_invite_completions`. Read-only.

#### whs_round_reactions
```
id, score_id, user_id, reaction_type ('heart' default), created_at
```

#### whs_connection_nudges
```
id, sender_id, recipient_id, sent_at
```

#### whs_course_aliases
```
id, whs_name, whs_name_norm, course_id, match_method, resolved_at
```

#### whs_to_golf_course_map
```
whs_course_id, golf_course_id, match_confidence, match_method,
matched_at, reviewed_at, reviewed_by, notes
```

#### whs_country_to_golf_country
```
whs_country_code, golf_sub_country, golf_country_bucket, notes
```

#### whs_ai_insights / whs_ai_recommendation_history
AI-narrative cache, one row per `connection_id` + `date_key`. Not part of
the round-data pipeline.

---

### B.3  Representative sample row — Benjamin (`8c240997-b6a1-408c-a953-794bc17ee35c`)

`whs_connections` row:
```json
{
  "id": "12d01d31-9db3-49fa-a54b-4b312d908339",
  "user_id": "8c240997-b6a1-408c-a953-794bc17ee35c",
  "provider": "england_golf",
  "passport_id": 576404,
  "membership_number": "1013726541",
  "vault_secret_id": "f8900945-2d2f-432a-9430-8daa2ae8e3ee",
  "last_synced_at": "2026-05-17T17:23:26.925Z",
  "last_sync_status": "ok",
  "last_sync_error": null,
  "consecutive_failures": 0,
  "next_sync_after": "2026-05-17T23:23:26.925Z",
  "initial_sync_complete": true,
  "created_at": "2026-05-17T16:07:14.686Z",
  "updated_at": "2026-05-17T17:23:26.936Z"
}
```

`whs_scores` (most-recent round):
```json
{
  "id": "a1a53b3e-7aa3-439e-bd38-60972f0bb078",
  "connection_id": "12d01d31-9db3-49fa-a54b-4b312d908339",
  "upstream_score_id": 68689903,
  "whs_score_uid": "8796b0cb-c0ff-4ca6-904d-14d81d997ba2",
  "course_id": "a77bc8bd-1ebf-48d3-a2ec-8a6282978969",
  "play_date": "2026-05-03",
  "capture_date": "2026-05-03T16:58:00Z",
  "total_holes": 18,
  "is_nine_hole": false,
  "actual_gross": null,
  "adjusted_gross": 80,
  "stableford_points": 32,
  "course_rating": 73.4,
  "slope_rating": 135,
  "pcc": 0,
  "marker_name": "Black",
  "course_handicap": null,
  "handicap_differential": 5.5,
  "handicap_index_at_time": 1.8,
  "is_counter": false,
  "is_considered": true,
  "is_competition_score": true,
  "is_penalty_score": false,
  "is_eligible_for_handicapping": true,
  "all_holes_attempted": true,
  "hole_by_hole_fetched": true,
  "permalink_url": "https://www.englandgolf.org/p/app-score/...",
  "raw_payload": { /* full England Golf score JSON — Course{}, Marker{}, ... */ }
}
```

`whs_score_holes` (first two of 18):
```json
{ "id":23851, "score_id":"a1a53b3e...", "hole_no":1, "hole_alias":"1", "par":4, "distance_yards":396, "stroke_index":10, "strokes_allowed":0, "actual_gross":4, "adjusted_gross":4, "played":true }
{ "id":23852, "score_id":"a1a53b3e...", "hole_no":2, "hole_alias":"2", "par":4, "distance_yards":388, "stroke_index":6, "strokes_allowed":0, "actual_gross":3, "adjusted_gross":3, "played":true }
```
(Hole 2 = birdie example: actual_gross 3 vs par 4.)

`whs_handicap_snapshots` (latest):
```json
{ "id":40, "connection_id":"12d01d31...", "handicap_index":1.8, "observed_at":"2026-05-17T16:07:14.729Z" }
```

---

### B.4  What's available at the per-round vs per-hole level

| Signal needed for gamification | Round (`whs_scores`) | Hole (`whs_score_holes`) |
|---|---|---|
| Gross score | `actual_gross` (often null pre-2024 EG data) + `adjusted_gross` | `actual_gross` per hole |
| Stableford points | ✓ `stableford_points` | ✗ (derive from par + strokes_allowed) |
| Birdie / eagle / HIO flag | ✗ — derive by aggregating holes | ✗ no explicit flag — derive `actual_gross - par` |
| Course difficulty | ✓ `course_rating`, `slope_rating`, `pcc` | `par`, `distance_yards`, `stroke_index` |
| Tee played | ✓ `marker_name` (free text: "Black", "White", "Yellow", "Red") | ✗ |
| Weather | ✗ — not stored. PCC (`pcc`) is the only weather-correlated signal: a non-zero PCC implies "tougher/easier than expected" conditions on that course-day. |
| Holes attempted | ✓ `total_holes`, `is_nine_hole`, `all_holes_attempted` | `played` boolean per hole |
| Competition vs casual | ✓ `is_competition_score` | ✗ |
| Penalty / non-counter | ✓ `is_penalty_score`, `is_counter`, `is_considered` | ✗ |
| Raw vendor payload (escape hatch) | ✓ `raw_payload` jsonb | ✗ |

**Per-hole gamification (birdies / eagles / HIOs / streaks of pars) is
fully derivable** from `whs_score_holes.actual_gross` vs
`whs_score_holes.par`, joined to `whs_scores.play_date` for temporal
ordering. Coverage caveat: `whs_scores.hole_by_hole_fetched` is `false` for
historical rounds where EG didn't return hole data — any per-hole metric
must gate on that flag (or fall back to `stableford_points` for the round).

**Per-course gamification** (best at course, repeat visits, course-form
deltas) uses `course_id` join. Friends already have a pre-aggregated
`whs_friend_course_bests` table for "best at this course" — the user's own
equivalent doesn't exist yet and would need to be computed or materialised.

---

## Headline summary

The deployed edge-function source for `connect-whs`, `sync-whs-one`,
`create-whs-invite`, and `sync-whs-due` is **not in the repo and cannot be
pulled from this sandbox** — recommend running `supabase functions
download` locally before the gamification spec is drafted. The full
write-surface, downstream triggers, and DB schemas are however fully
documented here from observable state. Most importantly for the
gamification model: per-round data on `whs_scores` is rich (gross,
stableford, course difficulty, tee, competition flag, raw_payload), and
per-hole data on `whs_score_holes` (`actual_gross` vs `par`) makes
birdie/eagle/HIO counts derivable — but there are **no dedicated columns
for birdie/eagle/HIO flags or weather**, and holes are only present when
`whs_scores.hole_by_hole_fetched = true`. Every new round currently fires
`trg_notify_friend_content_recompute` but produces **no notification or
push** — that's the obvious hook point for a future gamification engine.
