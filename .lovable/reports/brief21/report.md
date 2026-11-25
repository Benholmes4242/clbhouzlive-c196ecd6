# Brief 21 report

## Part E audit — reads feeding groupActivity

| Read | Source | Loading flag used | Limit / window | Key | Stable across sessions |
|---|---|---|---|---|---|
| Rounds | `get_recent_rounds` (p_scope everyone), `usePlayedRounds.rounds` | `settled(played.rounds)` | 30-day window (`ACTIVITY_WINDOW_DAYS`), pages of 100, cap 500 (`PLAYED_ROUND_CAP`) | `round:<whs_score_id>` | Yes — server id |
| Posts | `posts` (published, course_id or tagged ids), `usePlayedRounds.posts` | `settled(played.posts)` | `created_at >= now − 30 days`, pages of 100, cap 500 (`ACTIVITY_CAP`), then `countsAsActivity` | `post:<id>` | Yes — row id |
| Reviews | `course_ratings` (is_mock false, review not null), `usePlayedRounds.reviews` | `settled(played.reviews)` | `created_at >= now − 30 days`, pages of 100, cap 500 | `review:<id>` | Yes — row id |
| Faces | `readMemberFaces(memberIds)`, `usePlayedRounds.faces` | `settled(played.faces)` (only when memberIds) | none; names/photos only | none — adds no keys | n/a |

Courses (`played.courses`) only filters groups to known courses; it adds no keys.

Cause confirmed: the old owner wrote `ringKeys(current)` as soon as a tile showed, even while posts/reviews were still pending (the new test fails on the old code with `expected { sun: [ 'round:1' ] } to deeply equal {}`). Once later reads reordered the rings the default ring changed, so the earlier course was never rewritten and its late keys read as new on the next open.

Note: the 30-day window means a key ageing out never makes a ring amber (amber needs a key missing from the stored set, not the reverse).
