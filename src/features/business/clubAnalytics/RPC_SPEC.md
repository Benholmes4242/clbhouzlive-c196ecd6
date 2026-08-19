# `get_club_course_analytics(p_golf_course_id uuid)` — specification

BEN RUNS ALL SQL. This file specifies the function; the app does not create it and
no migration exists. Until it exists the tab renders its "no measured rounds yet"
state and never invents rows.

## Contract

`SECURITY DEFINER`, `STABLE`, `set search_path = public`. Returns ONE `jsonb`
object. `revoke execute ... from anon; grant execute ... to authenticated;`

Guard, before any read:

```sql
if not exists (
  select 1
  from business_members bm
  join business_accounts ba on ba.id = bm.business_id
  left join business_claimed_courses bcc on bcc.business_id = ba.id
  left join course_claim_requests ccr on ccr.business_id = ba.id and ccr.status = 'approved'
  where bm.user_id = auth.uid()
    and bm.role in ('owner','admin','manager')
    and ba.is_verified
    and ba.category = 'Golf Club'
    and p_golf_course_id in (bcc.course_id, ccr.source_course_id)
) then raise exception 'not permitted'; end if;
```

AGGREGATES ONLY. No `user_id`, no name, no individual round, no date a named
person played, in the payload or in any subquery output. A club learning which of
its members shot what is a different product and nobody agreed to it.

## Course resolution (NOTE — see report item 5)

`whs_scores.course_id` is a **`whs_courses`** id, not a `golf_courses` id. The
join to the claimed course must go through `whs_to_golf_course_map`:

```sql
with wc as (
  select whs_course_id from whs_to_golf_course_map where golf_course_id = p_golf_course_id
),
r as (  -- one row per measured round, with the tee it was played off
  select s.id, s.play_date, s.handicap_index_at_time,
         sum(h.distance_yards) as tee_yards, count(*) as holes
  from whs_scores s
  join wc on wc.whs_course_id = s.course_id
  join whs_score_holes h on h.score_id = s.id
  group by s.id, s.play_date, s.handicap_index_at_time
)
```

Index: `whs_scores_course_play_date_idx (course_id, play_date DESC) WHERE course_id IS NOT NULL`
ALREADY EXISTS — no new index needed.

## Tees (§4)

A tee is the round's exact 18-hole yardage total (`holes = 18`). No tolerance
band, no clustering. Rounds with `holes <> 18` are counted in `rounds` but
excluded from `tees` and from the tee correction — a nine-hole card has no
comparable total.

`tees`: `[{ yards, rounds, avg_to_par }]`, `avg_to_par` = mean `(actual_gross - par)`
per hole on that set.

## Verdict scope (§4.1/4.2)

Let `dom` be the tee set with the most rounds and `share = dom.rounds / (18-hole rounds)`.

- `share >= 0.5` → **scoped**: compute `holes` from rows on `dom` only.
  `verdict_scope = {mode:'scoped', tee_yards: dom.yards, tee_rounds: dom.rounds, tee_share: share, tee_count: n}`.
- otherwise → **adjusted**: per hole, take the mean `(actual_gross - par)`
  WITHIN each tee set, then combine across sets weighted by that set's rounds.
  Within a set all 18 holes share one population, so the ranking is unbiased.
  `verdict_scope = {mode:'adjusted', tee_yards: null, tee_rounds: <18-hole rounds>, tee_share: share, tee_count: n}`.

`measured_rank` = `rank() over (order by <corrected mean> desc)`, 1 = hardest.
`stroke_index` = modal declared index across the hole's rows.

## Remaining fields

- `rounds`, `hole_rows`, `course_name` (from `golf_courses`).
- `outcomes` — seven counts from `actual_gross - par`: `double_plus (>= 2)`,
  `bogey (1)`, `par (0)`, `birdie (-1)`, `eagle (-2)`, `albatross (-3)`,
  `ace (actual_gross = 1)`. `outcomes_total` = scored holes. ZERO IS A FACT: emit
  `0`, never null.
- `months` — `[{month, rounds}]` from `play_date`.
- `handicap_bands` — `[{label, rounds}]` from `handicap_index_at_time`,
  `handicap_rounds` = rounds carrying one. DISTRIBUTION ONLY; the function must
  not return any low-versus-high difficulty comparison (§8, withdrawn).
