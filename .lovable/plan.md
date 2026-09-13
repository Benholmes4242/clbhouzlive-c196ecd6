# Explore islands and sticky chip seam

## Outcome
- Keep the current top-of-page clearance: islands first, then chips, then the first card.
- Make the shared islands move away with `/amateur` content.
- Pin the chip row at the live safe-area inset with no exposed strip or layout jump.
- Use the existing sentinel-driven safe-area scrim only while the chips are stuck.

## Changes
1. Update `/amateur` in the shared chrome registry to use its existing `scrollAway` mode. This changes `ChromeIsland` from fixed to absolute for this route without forking or reparenting it.
2. Replace the chip row's sticky offset from the island clearance to `var(--sat, env(safe-area-inset-top, 0px))`.
3. Register the chip row with `useStickySafeAreaState` and `StickySafeAreaScrim`, using the same canonical page/chip background for both surfaces.
4. Keep the scope row outside the sticky host so it scrolls away. Only the primary view selector remains persistent, preserving vertical space for results on Scores, Courses, and Reviews.
5. Keep the existing outer page clearance and scroll-memory code unchanged.

## Verification
- Check top, stuck, and returned-to-top states at 320px and 390px widths.
- Confirm islands leave and return, the chip row has no gap above it, and the scrim is transparent at rest and opaque while stuck.
- Confirm the sticky host retains a stable height and the scope row scrolls normally.
- Confirm stored scroll restoration still reaches the saved position.
- Run the relevant checks and report device-only acceptance items as pending Ben's device walk.

## Technical details
- Registry mechanism: `ChromeSpec.scrollAway`; `ChromeIsland` renders `position: absolute` instead of `fixed`.
- Sticky detection: shared `useStickySafeAreaState` sentinel plus `StickySafeAreaScrim`.
- Safe-area ownership remains with the shell/chrome; the sticky row only reads the inset token and adds no safe-area padding.
