# Restore Personal Bests in Explore Magazine

## Build
- Add a `PersonalBestsShelf` beside the existing Explore Magazine shelves, using `usePersonalBests` and the unchanged shared `StandoutTile`.
- Render the RPC order without client-side sorting or cross-section member limits; show at most eight returned rows and render nothing when settled empty.
- Pass `headline` and nullable `reference_line` through verbatim, pair `figure` with its returned `figure_unit`, and use the existing course/member/date/avatar fields.
- Resolve course photographs through the existing batched course metadata hook and open the existing round detail sheet when a tile is selected.
- Mount the shelf in Explore Magazine's shelf cadence without changing the retired Standout Rounds surface.

## Verification
- Add focused tests covering eight-tile limiting, varying units, null reference lines, exact server copy, and no client-side member budget.
- Render the supplied proof payload in a 390px fixture and capture a screenshot; also check 320px and 430px for overflow.
- Run the focused Explore tests, TypeScript check, and whitespace validation.

## Constraints
- No RPC, SQL, migration, schema, evaluator, or `StandoutTile` changes.
- No empty-state copy or padded tiles.
