# PF1B_FEED — Report (CLOSED)

## Summary
Posting rebuild stage 1b: feed and fullscreen golf context. Composer now writes
`posts.add_to_hole_guide` server-side (client `postHoleGuide.ts` writer/subscription deleted);
a batched `usePostGolfContext` hook (≤100 IDs/call, authenticated non-guest) supplies hole
metadata and attached-round shapes; feed first slide shows the hole chip and scorecard row,
fullscreen first slide shows the chip and caption round pill; tags stay hidden; text-only
scheduled success follows the server's `status: 'scheduled'`.

## Files
- src/features/post-studio/ComposerFlowSheet.tsx — add_to_hole_guide write, scheduled success
- src/features/clubhouse/usePostGolfContext.ts — batched context reads (new)
- Feed card + fullscreen viewer surfaces — hole chip / scorecard row / caption round pill
- Deleted: src/features/post-studio/postHoleGuide.ts and src/test/pf1HoleGuide.test.ts
  (four tests: ready-row insertion, processing filtering, unique-conflict tolerance, nonfatal failure)

## Tests
- New PF1B tests: 30/30; PF1 regression: 87/87; typecheck clean.
- Four shards (each its own command): 1,919 / 1,831 / 1,909 / 1,804 = 7,463 tests / 648 files, zero failures.

## Limits
- Hosted/authenticated flow checks unavailable (external unmanaged auth).
