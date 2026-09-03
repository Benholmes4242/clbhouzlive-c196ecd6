# Match Discover hero and leaderboard to Tour Overview

## Goal
Recompose the Discover “Who” board so it uses the Tour Overview’s broadcast anatomy while keeping all Discover ranking, filtering, privacy, pinned-viewer, course, and sheet behavior unchanged.

## Changes
- Rebuild the Discover photo hero to the Tour Overview proportions and lower-third treatment: canonical photo height/scrim, 20px inset editorial title stack, leader/course context, and the existing pool figures retained as Discover’s contextual rail.
- Make the Discover leaderboard a full-bleed continuation of the hero on the shared `#15171F` canvas, using the Tour Overview board rhythm: compact column masthead, six visible rows, hairline separators, and edge-to-edge rows.
- Move the existing See All action into a Tour-style full-width terminal row directly beneath the board; retain RPC positions, ties, board-specific figures, amber viewer treatment, and pinned viewer behavior.
- Keep the sticky filter bar as the governing control for the whole Discover region, but style/place it as settled chrome so it does not visually split the hero-board composition.
- Update the Discover course-led loading skeleton to mirror the revised hero and board geometry, including the same canvas and row count.

## Technical details
- Limit changes to Discover presentation components and skeletons; no SQL, RPC, schema, query, filter-default, maintenance, or Tour Overview changes.
- Reuse existing canonical Tour constants/tokens where their semantics match rather than duplicating raw colours or gradients.
- Verify TypeScript, focused Discover tests, and the rendered mobile layout for seams, clipping, sticky-filter behavior, row interaction, and loading-state parity.
