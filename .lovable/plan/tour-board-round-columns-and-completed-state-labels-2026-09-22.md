# Tour board round columns and completed-state labels

## Implementation
- Restore the Median bridge declarations as true ambient globals so authentication compiles without changing runtime behavior.
- Update the Tour Overview hero board to derive its R1–Rn columns from the complete tournament field, remove TODAY and PRIZE, and preserve blank-score behavior.
- Update the tournament-page board to keep THRU/TODAY during active play, but show the final round label and omit THRU after completion.
- Pass the completed lifecycle only from the completed tournament-page callsite.
- Replace the obsolete hero prize-column test with coverage for played-round columns and totals-only data.

## Verification
- Run TypeScript checking and the focused Tour Overview test.
- Run the full suite and compare failures with the existing baseline.
- Inspect representative completed and live boards at narrow width when available.

## Deliberate non-change
- Leave the Full Board’s completed-round amber header behavior unchanged and report the known wording/meaning mismatch.
