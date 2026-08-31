# Tour Hub defaults to All Tours

## What will change

- Make `all` a valid persisted Tour Hub lens and use it only when no stored member choice exists.
- Remove the hero-driven landing override so the hero can choose the most relevant cross-tour event without changing the member's lens.
- Make the overview island label reflect the selected lens rather than the currently visible hero slide.
- Drive overview sections from the selected lens:
  - Coming Up: merged chronological cross-tour schedule on All Tours.
  - The Wire: all published stories on All Tours.
  - World Rankings: OWGR world list on All Tours.
  - Stat Watch: do not silently substitute PGA under All Tours; hide it because the underlying statistics coverage is PGA-only.
- Preserve the existing picker UI and acceptability model. Schedule and News continue accepting All Tours; Players and Leaders continue disabling it because they have no honest merged representation; Live remains cross-tour with no picker.
- Add focused tests for persistence/default and hero landing resolution behavior, then verify the Tour Hub in the browser.

## Technical details

- Update the canonical storage slug list and fallback values in the selection context.
- Remove `viewingTourSlug` from overview section filtering; it remains a hero/tournament readout only.
- Publish the Overview's actual applied lens so `appliedTourSlug` keeps the island label synchronized with the sections.
- Do not migrate or clear existing stored preferences. The preference is browser-local and is not centrally measurable from current analytics.

## Report after implementation

- List every surface that cannot express All Tours and its current behavior.
- Confirm whether the hero changed the lens before the fix.
- Explain the unmeasurable existing-PGA preference population and whether a one-time reset is warranted.
- Compare what a default member sees before and after, section by section.
- Call out any inaccurate assumptions in the brief.
