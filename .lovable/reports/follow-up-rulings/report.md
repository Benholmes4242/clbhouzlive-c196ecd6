# Follow-up rulings — STOPPED in shard 3

Stop: `src/test/pf1bFeedCard.test.tsx:183` "PF1B feed card golf context > renders a post with no context exactly as before" — `Snapshot ... mismatched`.
Cause (confirmed): the stored snapshot contains the initials span as `line-height: 1; user-select`; the §2(8) SquircleAvatar change now renders `line-height: 1; display: block; user-select` (Chromium also gets `text-box: trim-both cap alphabetic`, not serialised by jsdom). No other difference. The brief authorises snapshot updates only for the PF3B teaser, so the snapshot was not updated.

Shards: 1/4 2,401 passed; 2/4 2,432 passed; 3/4 2,443 passed / 1 failed (2,444). Shard 4 and all captures/audit not run.

Changed tests:
- overviewRoundParity.test.tsx:44 `picks: 'ROUND 1 · FIRST TEE'` → `picks: 'ROUND 1 · First tee'`; added `expect(heading.style.textTransform).toBe('uppercase')` (§1).
- playedWithTags.test.tsx "place chip lifts to bottom 50 above the played-with chip" → "place chip sits top-left at the hole chip position, clear of the played-with chip"; `expect(chip.style.bottom).toBe('50px')` → `expect([left, top, bottom]).toEqual(['12px','12px',''])` (§2(5)).
- courseMediaViewerAddendum.test.tsx:51 `['place', 'The clubhouse']` → `['place', 'Clubhouse']`; :61 `title: 'Course conditions'` → `title: 'Conditions'` (§4).
- New: followUpRulings.test.tsx (8 cases).
