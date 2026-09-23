# Reorder the handicap page around Next round

## Outcome
Make **Next round** the page title and first section, retain the useful handicap context beneath it, and remove the history blocks now covered by the profile Rounds tab.

## Changes

1. **Reorder the retained sections**
   - Render: Next round → Handicap index → Rounds that count → How you score a hole → Records to break → Your circle → Trophy room.
   - Keep the existing section components and calculations unchanged apart from the requested presentation edits.
   - Keep the trophy-room action at the foot of Records to break, so it remains the final destination after Your circle.

2. **Remove four page blocks**
   - Remove Last round, Stableford / How you're scoring, and Friends' rounds / Recently played from the dashboard composition.
   - Remove the “All N rounds” action and its archive sheet from the footer, leaving only “Live WHS data · Member ####”.
   - Remove dashboard-only data fetching and props made unnecessary by those removals.
   - Keep the component files themselves, and report which are left without consumers.

3. **Trim Records to break**
   - Remove Best gross from the record order and calculation.
   - Keep Best differential, Best stableford, Best against handicap, missing-record copy, and the Trophy room action.

4. **Promote and simplify Next round**
   - Make the route header title “Next round” while keeping `/handicap` unchanged.
   - Remove the Next round section eyebrow.
   - Move “Based on your last 20 rounds.” into the projection supporting sentence and remove the separate “Last 20 rounds” meta label.
   - Retitle visible controls that explicitly name this destination “Handicap”; leave generic handicap terms, connection controls, and the handicap index label unchanged.

5. **Equalise the last-20 dots**
   - Give counting and non-counting rounds the same dot radius in the shared chart.
   - Preserve green for counting rounds, neutral fill for the rest, point positions, selection behavior, and all calculations.

## Verification and report
- Run the focused tests and TypeScript check.
- Verify the signed-in `/handicap` page order and copy in the live preview if the available session permits it.
- Report the four removed blocks and whether their components still have consumers.
- List every route label changed from Handicap to Next round.
- Report any controls or links that pointed only to removed blocks; do not silently redirect them.
