# Explore Phase C — two proposed, UNAPPLIED, schema-adjacent RPC changes

Neither statement below has been run. Both are filed here as evidence for the
Phase C ship report and wait on a ruling.

## 1. board_pool / get_board_courses cannot filter on county

`board_pool`'s `ok_region` predicate, verbatim from `pg_get_functiondef`:

```sql
case
  when p_region_kind is null then true
  when p_region_kind = 'country'     then c.country     = p_region_value
  when p_region_kind = 'sub_country' then c.sub_country = p_region_value
  else true
end
```

`golf_courses.region` (the county) has no branch, and the `else true` arm means
an unrecognised `p_region_kind` passes EVERY row instead of failing. So the
county shelf filters client-side over a `sub_country`-bounded request
(`useCountyCourses`).

Proposed minimal change — one new accepted value, no new parameter, no change
to any existing call:

```sql
-- inside board_pool's ok_region case, before `else true`
when p_region_kind = 'region' then c.region = p_region_value
```

Cost: `board_pool` is `STABLE`/`SECURITY INVOKER` and is called by
`get_board_courses`, `get_board_page`, `get_board_facets`. Adding a branch is
additive; every existing `p_region_kind` value keeps its current result.

## 2. find_golfers_v1 returns no club id

`find_golfers_v1(p_query, p_limit)` returns `home_club` (free text) and no club
id, so it cannot be filtered to the viewer's club without matching on the
unreliable free-text field — which Phase C §4 forbids.

The people shelf therefore reads a NAMED club-scoped source instead:
`user_profiles` filtered on `primary_club_id`, which is the same canonical
`golf_clubs.id` the shared resolver returns. RLS already allows authenticated
members to read active profiles.

Proposed minimal change, if the shelf should ever share the RPC's reason
ranking:

```sql
-- add to find_golfers_v1's picked/select list
up.primary_club_id,
-- and an optional argument
p_club_id uuid default null
-- with, in picked's WHERE:
and (p_club_id is null or up.primary_club_id = p_club_id)
```
