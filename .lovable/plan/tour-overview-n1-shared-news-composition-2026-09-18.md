# Tour Overview N1 — shared News composition

## Outcome
Replace the overview’s bespoke four-story News block with the existing News-tab composition: one hero, an optional complete two-up, and up to three rows. Keep the story-band exclusion and honest relative dates.

## Build
- Extend the shared story shapes additively:
  - `HeroStory` gets a `gutter` prop defaulting to its current 14px.
  - `FeatureStory` and `WorkhorseRow` get `showEngagement`, defaulting to `true`.
- Rework the overview selector to exclude the Story Band story, take at most six newest stories, render the first as the hero, render stories two and three as the two-up only when both exist, then use the remaining stories as up to three rows.
- Replace the overview-only lead and left-thumbnail row markup with imports from `StoryShapes.tsx`.
- Keep the current News heading/action, use 24px hero type inset, wrap the two-up and rows on the overview’s 24px line, use a 14px two-up gap, and pass `showEngagement={false}` to all six shapes.
- Delete only the obsolete bespoke overview-news presentation code; preserve routes, one-feed data ownership, band deduplication, News-tab layout, and all other shared callers.

## Verification
- Add focused tests for six-story order, band exclusion, exactly-four and exactly-two story compositions, no-image stories, shared-prop defaults, and overview engagement suppression.
- Compare the overview block with the News tab at 390px and verify the shared dimensions are identical apart from the 24px overview gutter and hidden engagement.
- Verify the 320px two-up remains two equal 139px cards with a three-line clamp and no horizontal overflow.
- Measure the overview’s full page height before and after the change using the same fixture and viewport.
- Confirm the News tab retains its 14px gutter, engagement controls, spacing, and rendered dimensions.
- Run focused tests and TypeScript checks; the project harness performs the production build.
