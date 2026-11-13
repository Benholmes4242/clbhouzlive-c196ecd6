# BRIEF_FOLLOW_TILE_POSTED_AGE — build report

Date: 2026-11-13. Baseline 8,557 → 8,573 (+16 tests).

## New file
`src/features/find-people/followTileRules.ts` — pure `tilePostedLine(postedAt: string, now: Date): ActivityLine` (same key/vars/def shape). Elapsed floored, never negative: <1m just now; <60m `postedMinutes {n}`; <24h `postedHours {n}`; 24–47h `postedYesterday`; 2–6d `findPeople.tile.postedDays {count}`; 7–34d `postedWeeks {count: floor(days/7)}`; 35–364d `postedMonths {count: max(1, floor(days/30))}`; 365d+ `postedOverYear`. `activityLine`/`activeRingRules.ts` untouched — active ring and FindPeoplePage keep their behaviour.

## Changed line (WhoToFollowRail.tsx:473)
Old: `const line = source?.media ? activityLine({ actor_id: actorIdOf(card), kind: 'post', post_id: '', created_at: source.media.posted_at, course_name: null }, new Date()) : null;`
New: `const line = source?.media ? tilePostedLine(source.media.posted_at, new Date()) : null;`
The `t(line.key, { ...line.vars, defaultValue: line.def })` call is unchanged. `activityLine` removed from the import (`type RecentActivity` still used at line 449, so the import stays); `tilePostedLine` imported from `./followTileRules`.

## Locale files touched (all six, +9 lines each, pure additions)
`public/locales/{en,en-XA,de,es,ja,ko}/common.json` — new `findPeople.tile` block after `findPeople.active` with `postedDays_one/_other`, `postedWeeks_one/_other`, `postedMonths_one/_other`, `postedOverYear` (English text everywhere, matching how the existing findPeople keys sit in the non-English files).

## Tests
- New `src/features/find-people/__tests__/followTileRules.test.ts` (15 cases): 30s, 59m, 23h, 24h, 47h, 48h (2 days), 6d, 7d (1 week), 13d (1 week), 14d (2 weeks), 34d (4 weeks), 35d (1 month), 364d (12 months), 365d (over a year), future postedAt (just now).
- `src/test/followTilesB.test.tsx` gained one case: "a post three days old reads Posted 3 days ago".
- No existing test deleted, renamed or rewritten.

## Shard totals (each its own command, --maxWorkers=2)
- 1/4: 2,170 passed
- 2/4: 2,032 passed
- 3/4: 2,181 passed
- 4/4: 2,190 passed
- Total: 8,573 passed, 0 failed. 8,557 + 15 + 1 = 8,573. Reconciled.

No SQL, no migrations.
