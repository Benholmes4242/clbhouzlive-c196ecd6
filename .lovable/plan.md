# Glass scorecard S2

## Confirmed before changing code

- The flicker is a real intrinsic-height swap, not easing: the overlay has only `max-height`, so it centres and sizes itself from whichever middle is present. On a cold member open it first renders the 296px skeleton, then replaces it with the resolved one- or two-nine card and optional course figures. The tour sheet has the same skeleton-to-card swap. Seeded Explore rounds usually avoid the hole skeleton, but unresolved enrichment can still put them through the loading branch.
- `ScoreMark` has two live visual surfaces:
  - The shared member/tour scorecard and its neighbour preview: 26px marks with 14px numerals. The separate 18px use is only the unplayed-dot explanation, so the birdie change cannot appear there.
  - The round-card hole strip inside `RoundCardShell`: 20px marks with the default 8px numeral. This is the smallest live birdie and is the critical outline-legibility check.
- Direct scorecard renderers remain the member `RoundDetailSheet` and tour `ScorecardSheet`; `/round` continues to use the member renderer in full-height page mode.

## Implementation

1. **Stable opening and closing**
   - Keep data fetching active immediately, but defer mounting the visible overlay until hole data resolves or 150ms elapses.
   - When data resolves within 150ms, enter directly with the completed card. On a cold slow read, enter with a full-height scorecard skeleton and lock the card's measured height before opacity/scale begins; late content replaces the skeleton inside that fixed frame and scrolls if needed.
   - Never transition height. Use explicit animation phases so entry is opacity 180ms ease-out plus scale 0.96 to 1 over 240ms, and exit is opacity 140ms ease-in plus scale 1 to 0.97. Match backdrop timing, keep reduced motion opacity-only, and apply `will-change` only while entering or leaving.
   - Preserve page presentation without overlay timing or floating-card behaviour.

2. **Tap-anywhere dismissal**
   - Put the close click on the glass card and add the centred `Tap anywhere to close` footer line in all six locales.
   - Guard the exits/engagement container with one propagation stop. Guard the existing tour round selector as its own interactive block so changing rounds remains possible.
   - Suppress the synthetic click after horizontal or vertical touch gestures, preserving horizontal paging and downward dismissal. Backdrop, Escape, and downward swipe remain valid dismissal paths.

3. **App-wide birdie grammar**
   - Change the shared dark `ScoreMark` birdie to a transparent circle with a 1.6px under-par-red outline and white numeral.
   - Keep eagle double rings, bogey/double squares, par numerals, and all score derivations unchanged.
   - Verify the 20px round-card mark remains legible before retaining the app-wide rule.

## Verification

- Add focused tests for the 150ms ready/cold paths, fixed visible height, entry/exit timing, reduced motion, temporary layer promotion, card/background dismissal, guarded exits, and horizontal-drag click suppression.
- Update score-mark tests for the app-wide outlined birdie at 26px and 20px.
- In a real browser: open/close ten times; test cached and cold data; exercise every exit and every dismissal path; page horizontally; inspect 390px and 320px cards containing birdie/eagle/bogey/double over bright photography; verify reduced motion in and out; confirm `/round` remains full-height.
- Run focused tests and TypeScript checks. The project harness performs build validation.
