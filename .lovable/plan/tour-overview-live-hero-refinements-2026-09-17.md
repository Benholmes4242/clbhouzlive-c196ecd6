# Tour Overview live hero refinements

## Scope
- Leave the LIVE badge unchanged.
- Update only the live leader label, the shared tournament action row, and the venue destination below the hero.
- Preserve all data gates, queries, navigation behavior, analytics, carousel behavior, and shared hero dimensions.

## Implementation
1. **Tied leader wrapping**
   - Let the leader-name line wrap within its existing maximum width, with right alignment and 1.25 line-height.
   - Keep single leaders on one natural line with no reserved second line.
   - Preserve the tournament title size and position; isolate the right column if a two-line leader would collide.

2. **Tournament action**
   - Restyle Full leaderboard, Full results, and View tournament as transparent, right-aligned 44px links with 24px gutters, a top hairline, muted 13/700 text, and chevron.

3. **Venue destination**
   - Keep the existing rank-or-rating gate unchanged.
   - Resolve the active tournament venue image through `useBatchCourseImages`, the same path used by the hero.
   - Render a 76px rounded photo only when an image resolves; otherwise render text and chevron without a placeholder.
   - Present the venue as one course-page tap target with the existing heading, larger course name, and rank/rating facts.
   - Remove the page-stack spacing that would add more than the specified 18px above this block while preserving normal collapse when it is absent.

## Verification
- Add focused assertions for wrapping, action alignment, unchanged venue gate, and conditional thumbnail.
- Check 390×844 and 320px fixtures with a tied leader and two-line title; capture screenshots.
- Check a single leader, venue with no photo, and no venue record/no gap.
- Measure the venue block bottom at 390×844 and report its distance below the 764px nav top.
- Confirm no horizontal overflow, then run focused tests, TypeScript, and the production build.
