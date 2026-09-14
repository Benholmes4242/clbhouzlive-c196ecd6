# Explore people shelf: named record reasons

## Build
- Restrict the existing club-scoped `gam_course_legends` read to current, rank-1, all-time categories only. Keep the existing club-course IDs and add no request.
- Replace aggregate record counts with each golfer's deduplicated category options.
- Assign one unique category per visible golfer with a pure deterministic helper:
  1. process golfers by fewest available categories, then existing shelf order, then user ID;
  2. choose the rarest still-unclaimed category;
  3. if none remains, fall through to rounds here, new this month, or no reason.
- Add focused tests for all-time filtering, scarce-claim priority, no duplicate labels, fallback behavior, and stable output regardless of input/fetch order.
- Add six-locale labels and retire the count-based record keys without deleting them.

## Category labels
Use the Champions category vocabulary as the noun source, rendered as short identity claims:
- `lowest_gross_all_time` -> Course record holder
- `lowest_gross_women_all_time` -> Women's course record holder
- `most_birdies_all_time` -> All-time birdie leader
- `most_eagles_all_time` -> All-time eagle leader
- `most_aces_all_time` -> All-time ace leader
- `best_stableford_all_time` -> All-time stableford leader
- `most_albatrosses_all_time` -> All-time albatross holder
- `most_rounds_all_time` -> Most rounds here
- `best_score_diff_all_time` -> Best score-to-par here

`best_score_diff_all_time` is the only awkward category: Champions calls it “Score Legend,” which is internal and not a good member-facing identity. “Best score-to-par here” states what it measures without using “legend.”

## Assignment rarity
Use this explicit order, matching the ruling and completing the omitted categories:
1. albatross
2. ace
3. eagle
4. stableford
5. birdie
6. course record / women's course record
7. score-to-par
8. rounds

The first five and rounds follow the supplied order. Gross and score-to-par were not placed in the brief's rarity sentence; they are placed after scored achievements and before rounds. This is the only interpretation added by the implementation.

## Determinism
Deduplicate and sort each golfer's categories by the fixed rarity table. Sort assignment candidates by option count, then their stable shelf position, then user ID. Return reasons to the original shelf order. Fetch order cannot change the result.

## Plural audit
The earlier diagnosis that i18next was selecting the singular fallback is not reproducible and was incorrect. This project uses i18next 26; both the existing three-argument call and the object-options form select `_one`/`_other` correctly when `count` is supplied. A direct runtime reproduction returns “Holds 2 course records,” “Holds 8 course records,” and “2 rounds here.”

The count was flattened by the product rule now being superseded, not by a systemic plural API fault: any golfer with exactly one legend row was intentionally sent to a singular record claim, while the combined 90-day/all-time row count made the number semantically misleading.

Explore strings with genuine singular risk because their locale key is not pluralized are:
- `amateur.stream.roundCount` (Circle, club-week, course shelves)
- `amateur.stream.ratingCount` (course shelves)

The `seeAllRounds`, `seeAllCourses`, `seeAllClips`, `seeAllMoments`, and `roundsHere` families already have `_one`/`_other` keys and pass `count`. This change will verify `roundsHere` explicitly in tests; it will not widen into unrelated copy changes.

## Verification
- Focused assignment and plural tests.
- Typecheck/build checks run by the harness.
- Six locale JSON files parse successfully.
- Report the final mapping, rarity order, determinism rule, plural audit, and the score-to-par vocabulary exception.
