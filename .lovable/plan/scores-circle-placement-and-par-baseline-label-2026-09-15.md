# Scores circle placement and PAR baseline label

## Changes
- Replace the Scores tab’s fixed top “Where you stand” shelf with the existing “Your circle” shelf.
- Keep “Where you stand” in the in-stream Scores rotation at its current second rotation slot, after the county-course shelf, so it cannot follow the circle rail immediately.
- Change the shared Explore round-shape baseline caption from “LEVEL” to “PAR” in all six course locales.
- Leave unlabeled shared trajectory renderers unchanged: feed scorecards, circle tiles, and the scorecard sheet continue using the same shape renderer and baseline behavior without introducing a new label.

## Verification
- Confirm Scores begins with “Your circle” when circle data exists and no longer mounts “Where you stand” above the stream.
- Confirm the Scores rotation remains county courses, Where you stand, club week, then people.
- Enumerate all live round-shape callers and confirm only the shared Explore end-label path displayed “LEVEL”.
- Run focused checks, locale JSON validation, and mobile overflow checks where available.
