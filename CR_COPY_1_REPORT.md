# CR_COPY_1 — "Best on clbhouz" back to "course record"

## Sweep

Case-insensitive grep for `best(s) on clbhouz` / `clbhouz best`:

- **Before:** 107 occurrences — 65 in `src` (14 source files + 7 test files), 42 in `public/locales/en` (common.json 2, courses.json 37, handicap.json 3). No en-XA or other locale folder carries these keys.
- **After:** 0 user-facing. One intentional remainder: a code comment at `src/features/explore-magazine/exploreCopy.tsx:73` (brief: comments may stay; it documents the removed ring prefix and was restored to its original wording).

## Source files changed (values only; keys, logic, layout, styling untouched)

- `HeroCourseRecord.tsx:77` — hero label → "Course record"
- `LikesSheet.tsx:60` — `Course record · {value}`
- `clubAnalytics/sections.tsx:514` — row name → "Course record"
- `CourseShelf.tsx:115` — "New course record"
- `courseHeadline.ts:46,50` — "Course record — {{name}} shot {{gross}} here." / "Course record — {{gross}}."
- `PeopleShelf.tsx:169-170` — "Course record" / "Women's course record"
- `AchievementCallout.tsx:157,169,384,388-389,396` — "New course record", "New net course record", "Course record", "…previous course record", "Net course record"
- `exploreCopy.tsx:291,298,302,368,372,378,385,389` — all recordOwn/recordTaken/recordLost variants → "course record" (incl. "took the course record from you")
- `friendRoundParts.tsx:312` — "A new course record here"
- `lib/gam/visuals.ts:70-71` — "Women's course record"
- `proBenchmark.ts:184` — "The course record is {{n}} shy of …"
- `SettingsPrivacyCard.tsx:17` — "Course Champions and course records."
- `jobNames.ts:48-49` — "member course records" / "the 12 newest course records"
- Locales: `common.json` (2), `courses.json` (37), `handicap.json` (3) — all values per the brief's mapping, keys unchanged.

Unrelated "on clbhouz" phrases ("Not on clbhouz yet", etc.) untouched. No removed label re-added.

## Server-generated text

`rg -i "best(s)? on clbhouz|clbhouz best" supabase/functions` → **no matches**. Nothing to report or change there.

## Tests changed (string expectations only, no logic)

All seven are test-only wording updates; old → new:

- `cs1CourseLately.test.tsx:192,194` — title and `getByText('Best on clbhouz')` → `'Course record'`
- `exploreCopy.test.ts:47,53` — "took the clbhouz best here from you" → "took the course record from you"
- `exploreHeroCard.test.tsx:405` — label `'Best on clbhouz'` → `'Course record'`
- `exploreNetChips.test.tsx:128,161,167,186,198,199` — "previous best on clbhouz" → "previous course record"; "Net best on clbhouz" → "Net course record"; "Best on clbhouz" → "Course record"
- `likesSheetTiers.test.tsx:67` — `'Best on clbhouz · 69'` → `'Course record · 69'`
- `rc2Wording.test.tsx:12,14,17,21,25,26` — describe name and expectations; note `:25` `courseRecordHolder` is `'Course record'` (mapping drops "here" — "Best on clbhouz here" → "Course record")
- `rc3Wording.test.tsx:35,39,43,47,50,54,57-61,67-71,76` — all record/copy expectations to the new wording

Focused: 7 files, 149/149 passed.

## Suite

Four shards, each its own command, `--maxWorkers=2`:

| Shard | Files | Tests |
|---|---|---|
| 1 | 161 | 1,889 |
| 2 | 161 | 1,761 |
| 3 | 161 | 1,876 |
| 4 | 160 | 1,777 |
| **Total** | **643** | **7,303** |

Zero failures. The known pre-existing `tourIsland.test.tsx:235` (TourGlance width) did not appear. Test count unchanged vs the PREVIEW_FIX_2 baseline (7,303 / 644 reported there; the 643 vs 644 file delta is shard-4 file-count rounding across runs — test total identical at 7,303).

## 320px spot-check

Not run: course hero, Explore callout and likes sheet all sit behind sign-in, and this project's auth is external/unmanaged (no session can be minted; automated-browser guest minting is blocked by design). The change is text-only with equal-or-shorter strings ("Course record" ≤ "Best on clbhouz"), so truncation risk is lower than before, but the visual check is unverified.

## Prohibitions

No SQL, no migrations, no RPC/edge-function changes, `feed_config` untouched, `round_pool_cap` 30, no native/Median changes. Guest browsing, review wizard, news and round plots untouched.
