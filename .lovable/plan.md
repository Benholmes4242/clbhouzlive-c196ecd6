# Tour Overview H10

## Build
- Replace the fixed tour column in Also This Week with a flexible content column and optional score column.
- Use the full uppercase tour name above each tournament, clamp only the tournament name to two lines, and preserve status and score semantics.
- Give Coming Up the same full-name, tracked uppercase tour kicker while retaining its date chip and existing row facts.
- Keep the four-row Also This Week cap, whole-row navigation, section hairlines, and all existing data gates.

## Technical details
- Centralize full tour labels so both sections render PGA TOUR, DP WORLD TOUR, LPGA TOUR, KORN FERRY TOUR, CHAMPIONS TOUR, and LIV GOLF identically.
- Also This Week rows use `minmax(0, 1fr) auto`; the figures track is omitted unless both score and leader surname exist.
- Tournament names use a two-line webkit clamp; kicker, status, score, and surname remain untruncated.

## Verification
- Capture deterministic 390px and 320px fixtures containing all four named tournaments, plus a name exceeding two lines.
- Confirm an upcoming row has no reserved figures width and photograph Also This Week with Coming Up to compare kickers.
- Run focused tests, TypeScript checks, and the production build.
