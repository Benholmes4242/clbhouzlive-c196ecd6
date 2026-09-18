# C1 Course Rating Consistency

## Scope
Fix the Course tab empty-state keys, restore category aggregates on the Course tab, remove the category minimum-count gate on both tabs, and unify dark-surface rating colors across the Course tab, Reviews tab, and review card. No data, query shape, routing, or rating-tier utility changes.

## Changes

### 1. Empty-state copy
- Add `discover.scores.noOnePlayed` and `discover.scores.beTheFirst` to all six `courses.json` locale files.
- Use proper German, Spanish, Japanese, and Korean translations; add the matching pseudo-localized `en-XA` strings.
- Give both affected calls in `HowItPlays` explicit English fallback strings before interpolation options.
- Audit course-detail translation calls that pass an options object as argument two. Report every finding and whether the key exists; do not alter unrelated copy.

### 2. Category aggregates on both tabs
- Replace the obsolete `WhatPeopleSay` header history with the 18 Sep 2026 rule: category aggregates belong on both Course and Reviews tabs and render even for thin samples.
- Render available Design, Condition, Clubhouse, and Facilities aggregate figures inside “What people say,” between the headline figures and the thin-sample caveat.
- Omit missing values completely and let remaining figures rebalance without gaps.
- Remove the Reviews-tab category threshold so available aggregate categories render from the first rating onward.
- Keep only the tier word gated below five ratings; the overall figure and category values remain factual at any sample size.

### 3. One dark-surface score palette
- Change `WhatPeopleSay` community scoring from `bandColor` to `bandColorOnDark`; preserve the viewer’s own amber figure.
- Color both the Reviews-tab headline figure and its tier word with `bandColorOnDark(score)`.
- Color the review card’s headline figure and tier word with `bandColorOnDark(rating)`.
- Apply the existing binary sub-score rule everywhere touched: values at least 9 use `A.GREEN`; lower values use `A.MUTE`. This covers the Course-tab aggregates, Reviews-tab aggregates, and review-card spread without introducing amber mid-band sub-scores.
- Leave `getScoreTier` unchanged; it remains a label source here and still has other callers.

## Verification
- Add focused checks for both locale keys in all six locales, explicit `HowItPlays` fallbacks, ungated category rendering, missing-category omission, and the exact headline/sub-score color rules.
- Run the focused tests and the project’s normal test command where practical; rely on the harness for build/type validation.
- In the preview, compare the Course tab, Reviews tab, and an open review card for one course: a 9.0 headline must use the same dark green on all three; a 7.0 category must remain muted; the viewer’s own Course-tab figure must remain amber.
- Report any runtime/auth limitation honestly rather than creating member data.
