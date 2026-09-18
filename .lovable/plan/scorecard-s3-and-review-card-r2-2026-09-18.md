# Scorecard S3 and review card R2

## Confirmed before changing code

- The scorecard first-open clipping is caused by S2's `lockedHeight`: the overlay measures `card.offsetHeight` on its first mounted frame and writes that skeleton-era pixel value back as inline `height`. Later content is therefore trapped inside the first-frame box. This is not the retired shared-sheet `ResizeObserver`.
- The scorecard's 150ms readiness hold is still useful for smoothness, but intrinsic sizing and internal scrolling must provide correctness if data arrives later.
- Review R1 has landed: the ghost numeral and eyebrow are gone, the header mirrors the scorecard, the reference no longer repeats the rating, and sub-score bars are gone.
- Review stacking remains intentionally split: the review is above the mounted fullscreen feed, while its media viewer portals above the review and preserves its scroll position.

## Scorecard S3

1. Remove `lockedHeight`, first-frame measurement, and all computed height styling. Keep intrinsic `height: auto`, `max-height: 82dvh`, fixed summary, and the body at `flex: 1; min-height: 0; overflow-y: auto`.
2. Preserve the 150ms unresolved-data hold and opacity/transform-only motion.
3. Remove the “Tap anywhere to close” line and retire its six locale entries. Preserve card-background dismissal, the guarded controls, backdrop, downward swipe, Escape, and horizontal-swipe click suppression.
4. Split the exits into a fixed comment-then-heart cluster and one indivisible links group. Give the links group the remaining width with equal spacing, change “Share this round” to “Share”, and move the whole links group to a full-width second row when narrow.

## Review card R2

1. Correct the file history: translucent 14px blur originally, opaque from 5 August, glass rejected then overturned on 18 September, now denser glass for prose legibility.
2. Replace the bottom-sheet presentation with the scorecard family's centred geometry: 14px side insets, 82dvh ceiling, 24px radius, matching border/shadow/30px blur, and the same backdrop.
3. Start at the requested review fill `rgba(24,27,35,0.88)`. Inspect it over a bright fullscreen photograph; increase opacity only if prose is muddy, leaving blur at 30px.
4. Remove the drag handle. Use the scorecard's asymmetric opacity/scale timing and reduced-motion fade-only behavior.
5. Keep card taps inert. Preserve only backdrop, downward swipe, and Escape dismissal. Keep intrinsic auto height and the existing internal scroller between the fixed header and footer.
6. Preserve the completed R1 content, all entry points, and the load-bearing viewer/media stacking behavior and comments.

## Verification

- Scorecard: cold first open and warm second open; compare complete content and geometry. Force late tall content and confirm it grows to the ceiling then scrolls without clipping.
- Scorecard exits: capture 390px and 320px, confirming even spacing and group-only wrapping. Verify guarded actions and every dismissal/paging path.
- Review: capture directly after the scorecard to compare shape and density; test a cold 190-word review, feed entry, and fullscreen-viewer entry over a bright photograph.
- Review interactions: card taps do not close; backdrop, downward swipe, and Escape do; media opens above the retained review and returns to the same scroll position.
- Check both cards at 390px and 320px for overflow, run focused tests and TypeScript checks, and rely on the project harness for build validation.
