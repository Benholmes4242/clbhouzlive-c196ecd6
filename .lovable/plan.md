# Explore kicker and achievement marks

## Scope
- Rebuild round-card kickers as structured scope/course data and a two-line treatment on lead and standard cards.
- Keep pair cards to one course/date line.
- Replace ambiguous achievement drawings with the settled emoji/figure family in both achievement render paths.
- Preserve card selection, headlines, dates, stat figures, callout priority, interactions, and all non-Explore behavior.

## Implementation
1. **Structured kicker copy**
   - Change `kickerParts` to return `{ scope, course }`.
   - Shorten world/county/country scopes as specified, preserve amber `Your round`, and retain existing locale keys unless a new short form is required.
   - Keep club-ring, course-record, and plain round scopes null; retain current story, clip, watch, backlog, list, moment, and course meaning.
   - Update all six locale values without deleting keys used elsewhere.

2. **Kicker layout**
   - On lead and standard cards, render the optional scope line above a course/date row with a 4px gap.
   - Make course name the only ellipsising kicker element; keep scope and date whole and remove every middle dot.
   - Render no scope element or reserved spacing when scope is null.
   - On pair cards, render only the course/date row and never the scope line.

3. **Achievement mark family**
   - Add a fixed 28px, aria-hidden emoji lane and start at 22px type.
   - Use trophy, star, flag, fire, eagle, and shield emoji for record, net record, ace, albatross, eagle, and clean feats.
   - Keep the existing green rank arrow and red birdie-count disc.
   - Update both icon switches in `AchievementCallout.tsx` so panel and stat-strip treatments agree.
   - Audit project-wide importers and remove only zero-caller icon exports; retain shared tokens and any still-used exports.

4. **Verification**
   - Update kicker and achievement tests for structured copy, scope suppression, pair behavior, amber own-round scope, and all eight distinct marks.
   - Render deterministic lead, standard, pair, no-scope, and eight-mark fixtures at 320px and 390px.
   - Compare emoji against the arrow/disc baseline and adjust from 22px only if needed; report the settled size.
   - Confirm only course names ellipse, no horizontal overflow, and run focused tests, TypeScript validation, and the production build.

## Constraints
- No SQL, data selection, callout priority, headline, trace, review, engagement, or round-sheet changes.
- No locale key deletion without a caller audit.
- Report any built behavior that contradicted this brief; this brief wins.
