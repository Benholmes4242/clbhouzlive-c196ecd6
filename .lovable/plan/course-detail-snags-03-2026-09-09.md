# Course Detail Snags 03

## Scope
Correct the You tab, course-detail hero, Courses browse hero, and Courses list without new data reads, RPCs, schema changes, deletions, or changes to established routing and analytics.

## Implementation

1. **Normalize all five tab lead-ins**
   - Establish the Course tab's current 34px `AboutSection` lead-in as the shared top gap.
   - Apply that exact mechanism to Course, You, Champions, Reviews, and Media across loading, empty, signed-out, and populated states.
   - Preserve each tab's content order and canvas ownership.

2. **Share the centered four-stat strip**
   - Extract an additive centered stat-strip primitive and use it for Course facts and Your record.
   - Render four equal `1fr` columns with 21px tabular figures and 9px tracked labels.
   - Shorten “YOUR AVERAGE” to “YOUR AVG” in all six locale files if the 320px/large-text fit check requires it.
   - Keep BEST amber, all other values INK, and keep the explanatory note left-aligned at the 20px gutter.

3. **Remove the unexplained form marker and fix trend semantics**
   - Remove the amber circle: it marks the lowest gross score already stated by the BEST label.
   - Preserve the line, headline, window comparison, and BEST/WORST labels.
   - Per the approved found-alongside ruling, color improvement GREEN and worsening RED by meaning, not numeric sign; audit sibling lower-is-better panels for consistency.

4. **Reuse the existing course media strip for Your Moments**
   - Extend `AboutMediaStrip` additively so it can accept the existing viewer-scoped moments array and rail presentation, while defaults remain unchanged.
   - Feed heading count and rail from the same `useUserCourseMoments` result; render all five when below the cap and the canonical overflow tile above it.
   - Preserve read-only fullscreen opening, video mute, and existing tile analytics.

5. **Remove the duplicate course-detail rank ground**
   - Remove only the outer redundant gradient/ground around the Top 100 badges.
   - Preserve the live glass pill, badge content/order/icons, and stat band unchanged.
   - Verify over a bright course photograph and report the actual badge/stat-band treatments if they remain intentionally different.

6. **Contain and center Courses sort chips**
   - Remove the duplicate negative margin causing the left clip.
   - Add an additive RailChips layout mode that centers content-sized chips with one fixed gap when they fit, and naturally falls back to left-starting horizontal scroll with 20px edge insets when they do not.
   - Preserve active filled inversion and inactive outlined state; test at 320px and enlarged text.

7. **Reduce the browse-card bottom scrim**
   - Replace the current full-height, canvas-ending gradient with a shorter smooth bottom scrim covering the text plus about 24px clearance, with a lower darkest opacity.
   - Keep card geometry and all overlay content unchanged.
   - Verify the three brightest available tiles and retain the lightest gradient that keeps name, location, and rating legible.

8. **Unify all three photographic hero heights and straight edges**
   - Use the existing shared height constant for Explore, course detail, and Courses browse; remove the Courses hero's 260px literal.
   - Keep legibility scrims but remove only fade-to-canvas tails, producing straight photograph edges.
   - Preserve logo/search islands, hero fact gates, mood selection, and all hero content.

9. **Fix the approved Courses hero duplication**
   - When the location sub-line already names the area, remove the repeated area from the unranked kicker and leave its count/value.
   - Preserve ranked kicker content unchanged.

## Verification
- Run TypeScript checks and locale JSON validation.
- Browser-check every tab state available without authentication and restore a managed session if available for You-specific states.
- Compare all five tab lead-ins; inspect equal stat columns and label wrapping.
- Test sort chips at 320px and enlarged text, including forced overflow and state styling.
- Verify read-only moment fullscreen behavior and video mute.
- Capture bright-photo evidence for rank badges, browse-card scrims, and the unified Courses hero.
- Measure all three hero heights and confirm no literal per-surface height remains.
- Report unavailable authenticated/data-dependent states explicitly; do not claim them verified.
