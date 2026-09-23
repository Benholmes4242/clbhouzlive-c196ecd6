# Fix the immersive route canvas

## Scope
- Rename `LIGHT_IMMERSIVE_CANVAS` to `IMMERSIVE_ROUTE_CANVAS` with no compatibility alias.
- Set it from the canonical `PAGE_CANVAS` token so immersive page roots cannot drift from the app canvas.
- Update every direct consumer and the canvas guard test.

## Route chrome
- Preserve the current transparent native status bar on dark immersive routes.
- Make the DOM surface and non-light immersive fallback resolve to the canonical canvas.
- Keep the genuine light-immersive Watch routes on `LIGHT_ROUTE_CANVAS` with dark status-bar icons.

## Audit and verification
- Audit every exported surface token against its actual callers and report mismatched names without changing them.
- Run the focused surface-token test and the project TypeScript check.
- Open the signed-out course detail Course tab at the supplied viewport, sample the exposed page ground, and capture a screenshot confirming the slate strips are gone.

## Files expected to change
- `src/lib/tokens/surfaces.ts`
- `src/components/layout/PageRoot.tsx`
- `src/lib/routeChrome.ts`
- `src/test/canvasSurfaceToken.test.ts`
