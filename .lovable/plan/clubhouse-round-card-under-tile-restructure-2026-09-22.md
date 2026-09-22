# Clubhouse round card under-tile restructure

## Build
- Make the feat panel render only when a round has an achievement, retaining its icon, label, single amber tag, and full-width qualifier.
- Move NET and VS HCP into the always-present identity row beside the member avatar/name and the new Course · Date second line.
- Move heart and comment controls into their own row below identity.
- Remove the round score-restatement headline, standalone venue/kicker row, and YOUR ROUND label only from standard Clubhouse round cards.
- Preserve pair cards and every non-round card type.

## Verification
- Add focused render checks for feat and no-feat structures, own-round copy, qualifier width, and reactions placement.
- Run the focused tests, TypeScript check, and full suite; inspect the 390px live card when feed data is available.
