# Brief 20 — status

Commits: audit 58bf588be5 · A (partial) a5f98916c8 · C 6cb5ead9ca · E 670c4ac1df · D 809b9b5679. B not started.

## STOP — shard 1
`npx vitest run --shard=1/4`: 2,510/2,511 passed, 226/227 files.
Failure: `src/test/roundAndReviewComments.test.tsx:91:17` — "src/pages/Clubhouse.tsx resolves round and review targets before falling back to the post":
`AssertionError: expected 'import React, { useState, useEffect, …' to match /['"]round['"]/`.
Cause: Part A moved Clubhouse's round > review > post choice into `engagementTargetFor` (src/lib/engagement/engagementTarget.ts), so Clubhouse.tsx no longer contains the literal 'round'. Behaviour is unchanged; the source-text test encodes the old location. Not edited — awaiting a ruling.
Shard 2 also ran in the same command (2,516/2,516) before the stop was read; shards 3–4 not run. No baseline delta stated.

## Part B
Not implemented. Rail tiles need each source post's full media set in one batched read, but there is no shared post_media → viewer MediaItem mapper (video stream/HLS derivation lives per surface). Writing a new one is a new canonical mapping; needs a ruling.

## Part D
Overlays claim a layer on open (src/lib/overlayLayers.ts): viewer, review sheet (re-claims on REVIEW pill via openTick), More, Comments, Likes, scorecard, media preview. Proven by layer-rule tests (brief20OverlayLayers.test.tsx), not by rendering all overlays together.

## Part E
Review card closes on any non-control tap; drag/scroll never closes (shared useTapAnywhereDismiss with scorecard). brief20ReviewTapDismiss.test.tsx, 4 tests. Existing scorecard tests unchanged and passing.
