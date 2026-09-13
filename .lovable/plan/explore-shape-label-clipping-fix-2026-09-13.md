# Explore shape label clipping fix

## Build
- Add an Explore-only `endLabels` option to `RoundShape`, defaulting off so existing consumers remain unchanged.
- Derive the footer label band from the existing label font size, line-height, and bottom clearance.
- Keep the prior plot height by growing the Explore shape band by the derived label-band height; inset both end labels by 8px.
- Place LEVEL in a reserved plot position that cannot collide with the trace.

## Verify
- Compare the shape plot height before and after.
- Check full glyph bounds, corner clearance, and LEVEL separation.
- Check tick kickers and distribution counts at 320px and 390px for clipping or horizontal overflow.
- Run the focused tests, typecheck, and production build.
