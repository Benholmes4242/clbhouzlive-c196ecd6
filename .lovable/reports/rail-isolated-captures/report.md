# Isolated rail captures

Real RegionRails and PlayedTile/usePlayedTile rendered on a temporary page outside src, with anonymous placeholder photos. Existing media query keys were populated before mounting. All queries used staleTime Infinity; every read remained idle and no external request occurred. The temporary page and placeholders were deleted after verification.

## Measurements at 390px and 320px

| Surface | Ordered tile sizes |
| --- | --- |
| Region rail | 156×216, 252×216, 156×216, 252×216 |
| PlayedTile photo row (canonical interleaving) | Portrait hole 156×216, landscape course 252×216, landscape hole 252×216 |

At 320px after scrolling 164px, the landscape tile spans x=16–268; the next tile starts at x=276 and 44px remains visible. Both rails have an 8px gap. At 390px, 114px of the next tile remains visible.

The document, body and root measured exactly 390px or 320px respectively. No element outside the rails crossed the page boundary. Only the two rails own horizontal scrolling: region scrollWidth 872px; photo row scrollWidth 708px.

All text overlays measured inside their own tile, including count badge, course name, Best round, hole number, COURSE chip and captions. Screenshots were visually reviewed at both widths. Each delivered capture combines the initial position and the same real rail scrolled to its landscape tile; these are not reconstructed UI.

The first 60 rendered animation-frame samples all reported [156,252,156,252,156,252,252]. No widening occurred in this preseeded-cache scenario. This does not verify the unseeded live network-loading transition.

No app or test files changed. No shards were run. Previously completed full-suite baseline remains 9,550/9,550 tests, 850 files; delta zero.

Delivered files: region-390.png, region-320.png, photos-390.png, photos-320.png.
