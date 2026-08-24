# Honours Bone and Champagne

## Scope
Update only the Honours feat-block grounds and its gradient-safe avatar-ring mechanism. Preserve card/rail geometry, lower panel, ordering, typography family, maintenance flag, and all scorecard marks.

## Implementation
- Replace the local ace and albatross gradients with the specified bone and champagne ramps; use shared dark ink and 60% dim ink on both.
- Document the unusual hierarchy rule: rarity separates by saturation, not value; champagne is richer, not lighter or darker.
- Keep the avatar at 40px in its current grid position. Add an Honours-specific outline ring using the measured Best This Week geometry (1px ring, 0.5px visible gap), leaving the gradient genuinely visible through the gap.
- Do not alter the shared podium ring used by Best This Week or Courses Played.
- Retire the local platinum/gold Honours constants only after confirming whether they have external consumers.

## Verification and stop conditions
- Render the actual five-card rail ordered as one albatross beside four aces and capture a 390px mobile screenshot.
- If champagne does not read as the richer rarity at rail scale, stop and report without adjusting either supplied gradient.
- Measure WCAG contrast for 60% dim ink at the darkest bone and champagne stops and verify every feat-block string uses the intended ink role.
- Check outline geometry and avatar dimensions in Chromium. Median WebView remains a release gate: do not claim device confirmation unless a Median device session is available; if unavailable, report that limitation rather than substituting desktop evidence.
- Audit every avatar over a gradient or photograph for a filled-gap shadow and report findings without expanding implementation beyond this brief.
- Run focused tests/type checks and confirm no scorecard source changed.

## Known input discrepancy
- The locked JSX reference is not present at the supplied path or in the mounted uploads. The written values are deterministic and will be treated as authoritative; the void reference will not be consulted.
