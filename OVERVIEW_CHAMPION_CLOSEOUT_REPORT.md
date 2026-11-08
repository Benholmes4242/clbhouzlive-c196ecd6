# Overview champion close-out

## Tests
Previous reported baseline: 7,777. Overview build shards: 2,007 / 1,871 / 1,994 / 1,908 = **7,780 passed**, zero failures. Fourth shard freshly rerun with `bunx vitest run --maxWorkers=2 --shard=4/4`: 169 files, 1,908 passed. Output: `docs/verification/overview-champion/ruling-shard4.log`. Shards 1–3 are the previous reported results, not fresh reruns.

The +3 cases are: `tourOverviewDesignA.test.ts` — “(a2) the live spine node is TOUR_LIVE_GREEN — the island green, never amber”; `tourOverviewMergedAiry.test.tsx` — “a finished band with no sentence drops both live-only lines”; `tourChampionAvatarCandidates.test.tsx` — “renders the shared .tv-champion block with the narrative and \"BY TWO\", and drops the photo sentence and Full board link”. No deletions or count changes in this close-out.

## Prerequisite screens
Actual PhotoBand and ChampionStrip, real app CSS and tourhub translations, at 320/390/430. Live band 350px; finished band 300.6875px. Shared champion block, BY TWO, narrative, gold ring and fading panel verified; no horizontal overflow or ring clipping. At320 the champion name wraps cleanly. Completed photo has no sentence or Full board. Live retains sentence, Full board and green spine. Screens: `/tmp/browser/overview-closeout/live_{320,390,430}.png` and `done_{320,390,430}.png`. Fallback ground/initials used; real remote cover/headshot rendering and authenticated board actions remain device checks, not claimed here.

Fresh one-line-title baseline with the real SquircleAvatar leader: text top189.9375px at every width; row182.53125px, venue18.75px, leader trio72.1875px. This differs from the previous193.9 measurement because the leader face has the canonical1/1.05 aspect plus its border and inline baseline contribution. The reference must be derived from rendered constants, never copied from either measurement.