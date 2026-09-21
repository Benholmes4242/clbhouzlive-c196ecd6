# Round results plan

## Build
- Add a gated round-awards hook matching the existing feat-rarity query pattern.
- Render separate Awards, Holes, and Best efforts blocks in the round detail sheet, preserving the feat band and existing sheet styling.
- Add medal-specific semantic tokens and handicap translations in every enabled locale.

## Behaviour
- Hide empty awards/hole blocks and hide the entire addition when the RPC is null, inaccessible, or has no awards and no efforts.
- Reuse the existing to-par formatter; never infer ranks 4–9.
- Keep rows stable at 320px and 390px without wrapping delta chips.

## Verification
- Run existing focused tests and the project typecheck.
- Check the specified round and no-hole/empty responses.
- Capture 390px screenshots of the open round sheet.
