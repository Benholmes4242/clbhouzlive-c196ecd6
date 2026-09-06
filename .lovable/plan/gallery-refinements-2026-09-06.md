# Gallery refinements

## What will change
- Remove the Gallery banner entirely and start the page with **Clips**, with its heading 18px below the fixed Discover header.
- Keep the existing four sections in their current order, their current hidden-when-empty rules, Moments/Videos geometry, the footer search, and the fixed header.
- Change review tiles so the tapped photograph opens the existing fullscreen viewer rather than navigating straight to the course.
- Build a course-bounded review media sequence: the tapped review’s media first, followed by every other media-bearing review for that course in current review order. The sequence stops at that course.
- Populate each review slide with that review’s course, reviewer, rating, profile, and review metadata so existing viewer chrome updates when the sequence crosses into another review. Keep the viewer’s course-name control as the deliberate route to course detail.
- Add poster-first autoplay to Clips and Videos only: one shared Gallery observer ranks tiles at 50% visibility and grants at most two playback slots page-wide, preferring tiles nearest the viewport centre.
- Use the existing video lane system so active tiles are muted, looping, inline, control-free, and return immediately to their poster when playback ends or the tile leaves eligibility. Disable all Gallery autoplay for reduced motion, Save-Data, a hidden document, or an open fullscreen viewer.
- Preserve tap-to-fullscreen and explicitly cold-open the tapped video from the beginning with the viewer’s normal sound behavior, rather than inheriting the muted tile playhead.

## Data and viewer details
- Extend the existing latest-reviews read, without SQL or schema changes, to retain each review’s full ordered media array and the dimensions/stream fields needed by the shared viewer.
- On review-tile activation, fetch all media-bearing reviews for that tile’s course with the same moderation and newest-review ordering already used by Gallery, then map one fullscreen post per review. This lets the existing horizontal media pager exhaust a review before the existing vertical post pager advances to the next reviewer.
- Use a dedicated Gallery hook/cache entry for the course-wide set so Gallery’s eight review tiles remain lightweight and unchanged visually.
- No new fullscreen viewer, portal, overlay, or z-order layer will be created.

## Verification and report
- Verify Gallery opens directly on Clips and the first heading is exactly 18px below the fixed header, including at 320px width.
- Verify a multi-image review starts on the tapped image, continues through that review, then crosses into another review of the same course with updated reviewer/rating chrome, and cannot reach another course.
- Verify poster-first rendering, 50% visibility gating, pause/reset on exit, a global maximum of two active videos, reduced-motion, Save-Data, and fullscreen tap behavior.
- Measure the rendered Gallery video count from current data and profile a top-to-bottom scroll. Report the viewer extension required and expected memory/battery cost. If the measured page is too heavy despite the two-lane pool, reduce autoplay to only the first tile in Clips and the first tile in Videos.
