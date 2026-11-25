# Brief 31: existing tests tied to the retired layout

Part B replaces the one-big/two/list layout and removes all tile score pills. Eight existing tests explicitly assert that retired presentation:

- `topTenTileWidth.test.tsx` — “tiles 2 and 3 sit in an equal minmax grid that text cannot widen”: old `repeat(2, minmax(0, 1fr))`; proposed `repeat(3,minmax(0,1fr))`, preserving equal tracks and zero minimum tile width.
- `topTenOwnerLabelRender.test.tsx` — seven cases: the 42px row score columns; five owner-name labels on resting tiles; owner name in photograph pills/list rows; five “Them” fallbacks; five clipped names in pills; five own “You” labels; and the separate 6px two-tile grid. Proposed replacements assert the shared band's equal two/three columns, no resting labels/pills, the server's owner name in the open visitor band, no invented owner-name fallback, unmodified server name with nonwrapping labels, the two-column owner band, and the one 2px three-column grid.

Counts stay unchanged: five cases in `topTenTileWidth`, seven in `topTenOwnerLabelRender`. The four standalone `RegionRankLine` cases and the standalone `ownerScoreLabel` helper cases remain unchanged because Manage still imports those helpers.

The existing `profileRailFollowup.test.tsx` comment-deep-link case only needs its data mock switched from the curation hook to the block RPC hook; all assertions remain identical. No other existing assertions are proposed for editing. Every replacement will be quoted old/new by test name in the report.