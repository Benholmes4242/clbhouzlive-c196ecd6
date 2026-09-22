# Round sheet clarity

## What will change
- Add one member-and-course scope block immediately above the best-effort spans, using the existing course round count and the round owner’s name/pronouns.
- Give the spans table three named columns, add the exact hole span beneath every row label, and show a muted em dash when no comparison exists.
- Keep ranked comparisons amber, including “Top ten” and ordinals.
- Remove the repeated lower “at this course” heading while retaining its three existing figures; clarify only the first two labels and leave “HCP at the time” unchanged.
- Add the required translated copy to the existing six locale files and focused regression coverage for own/other wording and the 390px-safe table structure.

## Technical details
- Reuse `courseContext.roundsHere`; no new query or second count derivation.
- Pass the profile’s existing gender value into the canonical scorecard to select he/she/they and his/her/their; viewer-owned rounds always use you/your.
- Keep `finish_six` and “Holes 13–18” in this client display, matching the still-deployed `get_round_awards` payload.
- Touch only the canonical scorecard presentation, wrapper data threading, locale copy, and focused tests. No SQL, evaluator, feed-card, grid, header, feat, or award-RPC changes.

## Verification
- Run focused round-result and subject-copy tests, TypeScript checks, and the full suite against the known baseline.
- Render at 390px and confirm one “at this course”, all five spans, visible em dashes, consistent own/other voice, no clipping, and no horizontal scroll.
