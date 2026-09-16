# Explore card date and achievement label fix

## Scope
- Move round and review dates from the who-line into a shared kicker row.
- Widen the achievement cell and replace truncating achievement copy with the requested tag-and-label treatment.
- Preserve all round selection, beaten-record, engagement, headline, trace, score, and review behavior.

## Implementation
1. **Kicker row**
   - Keep the existing kicker content as a flexible, ellipsising left side, including the amber `YOUR ROUND` treatment.
   - Add the existing `relativeDay` result as a nonshrinking right-side date with the exact kicker typography and white color.
   - Remove round/review dates and their separator from `WhoLine`; leave other content types' existing subtext unchanged.
   - Apply this same row to review cards because they use the same `ExploreCard` who-line and currently carry the date there.

2. **Achievement cell**
   - Change the achievement-plus-figures grid to `minmax(0, 2.3fr) repeat(3, minmax(0, 0.7fr))`; keep equal thirds without an achievement.
   - Map every achievement to the requested optional amber tag and white label, including ranked and unranked `rank_up` variants.
   - Allow labels to wrap naturally to two lines with no ellipsis or line clamp; retain the existing icons and achievement priority.
   - Keep PAR, NET, and VS HCP labels and figures intact.

3. **Regression coverage and verification**
   - Update existing strip tests for the new grid and text mapping.
   - Add kicker tests proving the long course name truncates, the date stays whole and white, and the who-line has no date.
   - Add browser-layout guards at 320px and 390px for every achievement label, checking cell descendants for overflow and ellipsis.
   - Confirm page width remains contained at both viewport widths with the supplied long course and player names.
   - Run focused tests, TypeScript validation, and the production build.

## Expected review-card result
Review cards currently use the same date-bearing `WhoLine`, so their date will move to the kicker row too; their on-photo treatment and all other review styling remain unchanged.
