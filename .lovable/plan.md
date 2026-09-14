# Explore circle shelf spacing and labels

## Outcome
- Place the circle/suggestions slot and following stream blocks in the same 26px-gap stack, removing position checks and per-shelf gap props.
- Preserve the existing chip-row-to-content lead-in.
- Show 10 circle tiles before see-all.
- Give every Explore shelf see-all a localized unit with singular/plural handling.

## Changes
1. Move the top All-view slot into the shared stream block stack so the stack owns every inter-block seam, including circle/suggestions to lead.
2. Remove `blockGapAfter` from `CircleShelf` and `PeopleShelf`; both occupants inherit identical spacing from their parent.
3. Raise the circle rail cap from 8 to 10.
4. Add unit-specific see-all keys for rounds, clips, moments, and courses in all six course locales; use them in circle, clips, moments, and standing.
5. Keep shelf order, data sources, navigation, analytics, and settled follow-set gating unchanged.

## Verification
- Check at 390px that chip-row lead-in is unchanged and the shelf-to-lead gap is 26px for both possible slot occupants.
- Confirm 10 circle tiles are rendered and singular/plural round labels resolve correctly.
- Check all Explore see-all callsites for remaining bare counts and run focused checks plus the project build.
