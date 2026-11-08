# Hero round missing-card correction

## Files changed
- `src/features/tourhub/tournament-v2/sections/MiniBoard.tsx`: removed emptyRounds, confirmEmpty, callback plumbing and started-round filter.
- `src/features/tourhub/tournament-v2/sections/HeroRoundPanel.tsx`: empty successful reads retain chip availability/selection and18 dots; footer note replaces OUT/IN using `overview.board.noHoleCard` and defaultValue “No hole-by-hole card for this round”.
- `src/features/tourhub/tournament-v2/sections/heroRoundRules.ts`: corrected availability ownership comment.
- `src/features/tourhub/tournament-v2/sections/heroRoundPanel.css`:9.5px/700 dim, single-line note; empty footer wraps its action if needed rather than overflowing narrow screens.
- `src/test/heroBoardExpand.test.tsx`: one authorized case update and one new case.
- `roadmap.md`, project memory and this report; four verification logs under `docs/verification/hero-round-empty/`.

## Assertion ledger
Renamed `confirms an empty selected card as disabled and renders eighteen dots` → `keeps an empty selected card enabled and renders eighteen dots`.

Old: `expect(v.container.querySelector('[data-round-chip="2"]')).toBeDisabled()`.

New: `expect(v.container.querySelector('[data-round-chip="2"]')).toBeEnabled()`.

Reason: this brief explicitly replaces disable-after-empty with score-based availability. The18-dot assertion is unchanged.

Added `keeps the empty round selected with a missing-card note instead of nine totals`: verifies enabled chip, aria-pressed=true, note presence, absence of OUT/IN slots and reads exclusively for selected round2. No other assertions changed; no tests deleted.

## Verification
Focused: `bunx vitest run src/test/heroBoardExpand.test.tsx --maxWorkers=2` — **16/16**.

Four separate commands, sequential:
- `bunx vitest run --shard=1/4 --maxWorkers=2` — **2,007 passed**.
- `bunx vitest run --shard=2/4 --maxWorkers=2` — **1,868 passed**.
- `bunx vitest run --shard=3/4 --maxWorkers=2` — **1,994 passed**.
- `bunx vitest run --shard=4/4 --maxWorkers=2` — **1,906 passed**.

Full suite: **7,774 before → 7,775 after**, all passed/executed. Delta+1 is the named new case in heroBoardExpand.test.tsx (15→16). Zero failures; known FW1 failure did not appear. Latest preview build log: build OK.

No SQL, migrations, server/RPC/edge, feed_config, round_pool_cap, guest browsing, review wizard, news, round posts or native/Median changes. No live authenticated end-to-end check was performed; this project has external unmanaged authentication.