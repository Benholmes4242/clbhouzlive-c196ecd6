# Explore round-card reactions

## Build
- Hydrate the rendered Explore window with one batched round-post read and one batched `content_reactions` read.
- Hide the window's reaction controls if the reactions read fails, preserving existing card behavior.
- Add compact heart/count and comment/count controls to full-width round-card who-lines without increasing line height; preserve name ellipsis and prevent card taps.
- Use the round sheet's canonical `content_reactions` toggle and shared cache family for immediate cross-surface agreement and rollback toast behavior.
- Open the existing round sheet with comments already open from the comment control.
- Show read-only, nonzero counts on paired round cards; add the two requested analytics events.
- Keep reviews, courses, rails, and other card types unchanged.

## Technical details
- Pass resolved engagement state and handlers from `ExploreMagazine` into `ExploreCard`; cards perform no reads.
- Treat a resolved round post as the availability gate for both controls because the post ID is required to mirror post engagement caches and comments.
- Use existing amber and typography tokens, outline icons at 18px, stable 40x32 minimum targets, and nonshrinking nowrap layout.
- Add focused tests for visibility, styling, optimistic rollback, comments opening, zero counts, batching, pair behavior, and propagation.
- Validate TypeScript, focused tests, production build, and 320/390 widths with a long player name.

## Measured request count
- Before: 0 card-window comment reads and 0 card-window reaction reads.
- After: 1 comments/posts read plus 1 reactions read per rendered window, independent of whether it contains 1 or 12 round cards.
