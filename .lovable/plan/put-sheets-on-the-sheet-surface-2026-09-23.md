# Put sheets on the sheet surface

## Scope
- Inspect every canvas-token background within components that render a bottom sheet.
- Remove only sheet-ground and flush-header overrides so the canonical sheet surface shows through.
- Preserve deliberate inset wells or full-page overlays, replacing a canvas token only when a semantic recessed token is required.

## Token cleanup
- Rename Tour Hub’s misleading `SLATE_50` export to a role-based canvas name with no alias.
- Update all of its consumers without changing rendered values outside corrected sheets.
- Audit the remaining `SLATE_*` exports and report contradictory names without renaming them.

## Verification
- Run focused tests and the TypeScript check.
- Open a reachable tournament and compare the leaderboard and holes sheets at the current preview size.
- Capture both sheets when reachable and report any inaccessible surface or uncertain classification.
