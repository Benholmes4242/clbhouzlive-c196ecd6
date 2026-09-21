# Tournament hero chip and completed playoff correction

## Build
- Restyle the tournament hero state chip to match the Tour Overview glass pill, separating the tour kicker and preserving CJK casing and spacing.
- Make holes remaining live-only and add an explicit completed-playoff decision flag based on the winning row's untied first position.
- Update the contest headline and evidence sentence for decided playoffs while preserving completed margin and live shared-lead behavior.
- Add the new playoff copy in all six locale files, with proper German, Spanish, Japanese, Korean, and pseudo-localized English.
- Leave the pack track markup and styling unchanged.

## Verification
- Extend focused contest tests for stale completed `thru`, decided playoffs, unresolved finished ties, live shared leads, and completed non-playoff margins.
- Check tournament hero states at 320, 390, and 430 pixels, including scheduled rounds and CJK typography.
- Verify the PURE Insurance Championship copy and query whether any completed tournament leader remains marked tied.
- Run focused tests and TypeScript checks; make no SQL, migration, or RPC changes.
