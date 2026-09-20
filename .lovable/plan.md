# Rebuild the Tour player feature

## Scope
- Rebuild only `player-v2` and the shared Tour hero-token comment; no SQL, schema, Season-page logic, index, or unrelated Tour surfaces.
- Preserve the existing live strip, statistics sheet, tournament navigation, college instrumentation, and data ingestion.
- Apply the clarified duplication rule: prose may restate evidence, but no stat may appear in two figure treatments.

## Data and selection
- Add pure `playerSeason.ts` selection functions using player statistics, results, full-pool rank maps, and category pool sizes.
- Restrict selection to the eleven skill categories in the brief; classify strengths at the top 10% and weaknesses at the lower half of each category's own pool.
- Mark the 10% strength threshold as an unverified editorial judgement.
- Prefer a qualifying scoring average as the headline, otherwise choose the best-ranked eligible skill; remove the headline from field rows.
- Deduplicate overlapping strokes-gained and scoring categories before selecting up to three strengths and two weaknesses.
- Return formatted, ranked evidence plus verdict facts and module count without JSX or hooks.
- Add focused tests for thresholds, category exclusions, headline preference, overlap removal, rank ordering, caps, missing data, and the no-duplicate-figure rule.

## Photographic hero
- Keep `TOUR_HERO_BAND_H` unchanged, update the stale token comment, and move the player hero to `TOUR_HERO_PHOTO_H`.
- Replace the avatar layout with a bottom-anchored 340px photographic masthead using the canonical candidate resolver, sequential error fallback, eager/high-priority loading, masked image edge, radial highlight, and specified scrim.
- If all photo candidates fail, retain the same-height branded gradient with no avatar or silhouette.
- Preserve the existing tour, country flag, and college stamp eyebrow exactly.
- Add the name-size ladder, localized evidence verdict, and restacked WORLD/FEDEX proof figures.
- Extract the existing locale-aware ordinal formatter from `StatsSheet` into a shared player-v2 helper so hero and season treatments use one implementation.

## Season hierarchy and field profile
- Replace the equal four-cell season grid with one optional 60px headline skill figure and ranked Tour caption, followed by the subordinate WINS / TOP 10s / CUTS MADE / EARNINGS row.
- Keep result-derived EVENTS / BEST FINISH / MADE CUTS for tours without statistics, hide any counting section with fewer than two cells, and preserve the existing All stats action and sheet.
- Add `AgainstTheFieldSection`, backed by the existing full-pool leader query and canonical stat-label registry.
- Render strengths and weaknesses only after ranking data resolves, with ranked rows, pool totals, and proportional field tracks; omit empty halves or the entire section as specified.
- Ensure the headline skill is excluded from this section and overlapping skill figures cannot both render.

## Season shape, wins, and residence
- Replace the six-chip rail with one full-season inline SVG, sorted oldest to newest, using finish-position height, floor-pinned missed results, connecting line, month endpoints, and localized key.
- Self-hide the plot below three plottable results and avoid a nested horizontal scroller.
- Tint winning tournament rows in place and add the localized amber Won marker without changing row geometry or promoting/duplicating the result.
- Normalize residence by removing empty comma segments and trailing ISO codes, then combine the surviving town with the canonical player country; omit when neither exists.
- Insert Against the field between This season and The shape of it.

## Language and accessibility
- Add every new phrase to en, de, es, ja, ko, and en-XA, keeping verdict shapes as whole interpolated sentences.
- Preserve real German and Spanish diacritics; avoid uppercase transforms and tracking for CJK prose and headings.
- Keep the photograph decorative, preserve semantic headings, and use numerals plus the shared ordinal formatter.

## Verification
- Run TypeScript and focused player-season/Tour tests.
- Inspect a representative PGA player at 320px, 390px, and 430px for the 340px hero, masked photo seam, long-name sizing, proof row, ranked headline, field tracks, result chronology, win treatment, and normalized residence.
- Inspect a deliberately failing photo-candidate path to confirm a gradient-only 340px hero with unchanged typography and no silhouette.
- Inspect an accessible non-PGA player to confirm no headline/field module, the result-derived counting row, and intact shape/list modules.
- Measure horizontal overflow, clipped rank figures, stat-label wrapping, hero image state, and figure duplication at all three widths.
