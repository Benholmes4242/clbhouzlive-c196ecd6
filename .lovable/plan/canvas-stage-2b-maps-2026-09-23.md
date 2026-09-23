# Canvas Stage 2B — Maps

## Goal
Make all three Mapbox surfaces use one dark, ramp-based style path while preserving amber markers and existing map behaviour.

## Implementation
- Replace the shared light base style with Mapbox dark and keep `applyClbhouzMapStyle` as the single styling function.
- Update its dark palette to import Canvas, Panel, Cell, Raised, and existing ink tokens by reference:
  - land/background: Panel
  - water: Canvas
  - roads, borders, coastlines: low-alpha white derived through the token helper
  - labels and halos: the existing dark ink ramp over Canvas/Panel
- Attach the shared function to `style.load` in Map Preview and Expanded Map.
- Move Pin Drop from its private Streets URL onto the same shared style URL and `style.load` handler.
- Remove the per-map colourful style bypass so all three maps resolve identically.
- Move the two pre-ramp map container backgrounds to the appropriate shared Panel token.
- Leave amber markers, charts, admin, media letterboxing, and photo fallbacks unchanged.

## Verification
- Add focused guards proving all three maps use the shared URL and styling function, with no private style URL remaining.
- Run focused tests and the existing suite, distinguishing unrelated known failures.
- Open a signed-out reachable course map, inspect the rendered Mapbox layer colours, and open its expanded view when available.
- Report the prior zero-caller state, chosen approach, exact token mapping, shared-path confirmation, and any unreachable authenticated map.
