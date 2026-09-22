# Round notifications over Activity

## Build
- Add the `/round/` chrome rule with a history back arrow, `/handicap` fallback, dark tone, and hidden HCP capsule cell.
- Give only the full-page scorecard presentation shared chrome clearance above its content.
- Make Activity round destinations use the existing background-location navigation pattern while preserving all current review destinations.
- Let `RoundPage` choose the canonical sheet's overlay presentation for in-app background-location arrivals and page presentation for cold/direct arrivals.
- Suppress only the overlay's pending full-page skeleton; leave unreachable missing-ID and signed-out states unchanged.
- Mount the existing lazy `RoundPage` in the background overlay routes using the same suspense treatment as its main route.

## Verification
- Run Activity round-link parity tests and focused tests for chrome resolution, background navigation, overlay/page selection, comments query preservation, and pending behavior.
- Run TypeScript checks and the full test suite, then exercise authenticated Activity and cold `/round/:id` behavior when the preview session permits.
- Report the existing RoundPage docstring mismatch: it says Discover, while code and chrome fallback use `/handicap`.
