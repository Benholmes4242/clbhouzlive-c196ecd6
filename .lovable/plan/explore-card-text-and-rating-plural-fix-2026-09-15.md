# Explore card text and rating plural fix

## Build
- Give hero, standard, and pair cards the same white kicker/name and 85%-white date colors; retain amber for the viewer's own name and `YOUR ROUND` kicker.
- Keep text shadow exclusive to on-photo cards and leave card geometry, headlines, ranking, and data paths unchanged.
- Add `amateur.stream.ratingCount_one` and `_other` to all six course locale files with proper local translations.
- Add focused tests for standard, pair, review, ring, and own-round colors plus singular/plural shelf copy.

## Audit and verification
- Audit all static `amateur.stream.*` calls in this folder, treating valid i18next plural base calls as covered by `_one`/`_other`; report genuine missing keys separately.
- Validate locale JSON, focused tests, TypeScript, and diff formatting.
- Render fixture states for standard round, review, pair, viewer round, ring kicker, own-round kicker, and singular Around Kent copy; screenshot and confirm no horizontal overflow at 320px and 390px.

## Technical details
- `kickerParts()` returns strings rather than metadata, so identify the existing own-round condition from the same typed fields (`kind === 'round' && who.is_viewer`) at render time; do not alter copy precedence.
- Keep the existing shared `ExploreCard` path used by All, Scores, Watch, and Courses; no view-specific branches or server changes.
