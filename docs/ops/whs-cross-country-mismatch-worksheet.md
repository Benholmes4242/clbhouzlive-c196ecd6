# WHS cross-country mismatch worksheet

Fourteen existing WHS -> clbhouz course links cross a country border under the
country vocabulary (`src/lib/whs/countryVocabulary.ts`). The country gate stops new
ones. It does NOT fix these, and they must NOT be repointed in bulk: each needs a
human to say which course was actually played, exactly as Ben did for Vale do Lobo
and The Els Club.

Measured 15 Sep 2026. Ordered by rounds affected.

| # | WHS name | WHS country | Current (wrong) target | Target country | Rounds | Members | Source | Human-reviewed |
|---|---|---|---|---|---|---|---|---|
| 1 | Tournament Course | England | The Tournament Course at the The Woodlands Country Club | Texas | 29 | 4 | alias + map | YES - approved by a human |
| 2 | Ocean Golf Course | Portugal | Prince's Golf Club (Shore, Dunes & Himalayas) | England | 4 | 4 | alias | no |
| 3 | Centurion Club | England | Centurion Country Club | South Africa | 3 | 2 | alias | no |
| 4 | Marlborough | England | Marlborough Country Club | Massachusetts | 3 | 2 | alias | no |
| 5 | The Belfry Club-PGA National | England | Beloit Club | Wisconsin | 3 | 1 | alias | no |
| 6 | The Belfry Club-The Brabazon | England | Beloit Club | Wisconsin | 3 | 1 | alias | no |
| 7 | Burhill-Old Course | England | Old Mill Golf Course | Utah | 2 | 1 | alias | no |
| 8 | The Els Club | Portugal | The Els Club | United Arab Emirates | 2 | 1 | alias | no |
| 9 | Ballyliffin-Old Course | Ireland | Old Baldy Golf Course | Montana | 1 | 1 | alias | no |
| 10 | Dunas Golf Course | Portugal | Dunas Clube de Pelotas | Brazil | 1 | 1 | alias | no |
| 11 | El Paraiso | Spain | El Paraiso Country Club | Argentina | 1 | 1 | alias | no |
| 12 | Hillside | England | Hillside Links | Connecticut | 1 | 1 | alias | no |
| 13 | Les Dunes | France | Les Dunes Golf Club | Morocco | 1 | 1 | alias | no |
| 14 | St Andrews New Course | Scotland | St. Andrews Golf Course | Kansas | 1 | 1 | alias | no |

Thirteen live only in `whs_course_aliases`. Only row 1 also has a
`whs_to_golf_course_map` row, and that one carries `reviewed_at` - a human approved
it, because the review screen showed "Texas" and never showed the WHS country. That
gap is now closed (the admin sheets show the WHS country and warn on disagreement).

Zero ratings were created through any of these links. This is a fix, not a cleanup,
only because it was caught now.

## THE TWO-STATEMENT RULE

Repointing a mapping requires updating `whs_to_golf_course_map` AND
`gam_round_stats.course_id` **together**, filtered by `whs_score_id`. The map alone
moves the round and leaves the activity behind - we found that by doing it wrong.

```sql
-- 1. the mapping
update whs_to_golf_course_map
   set golf_course_id = :correct_golf_course_id,
       reviewed_at = now()
 where whs_course_id = :whs_course_id;

-- 2. the activity already written from it, same run
update gam_round_stats
   set course_id = :correct_golf_course_id
 where whs_score_id in (
   select id from whs_scores where course_id = :whs_course_id
 );
```

And the stale alias for the same WHS name must go, or the client matcher will keep
returning the old target from cache:

```sql
delete from whs_course_aliases where whs_name = :whs_name;
```
