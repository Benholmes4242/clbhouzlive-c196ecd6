## What's actually broken

I audited the data behind the "The Case For …" sheet. Two independent failures conspire to blank the tiles for every non-PGA tour:

**1. Season Snapshot (Wins / Top 10s / SG Total)** reads `sr_player_statistics`. That table has:
- 312 rows for PGA players
- **0 rows for LPGA**
- 21 for PGAD, 8 for EURO, 1 for LIV

So Anna Nordqvist's tiles blank out even though her Last-5 shows a 3rd and a T7 — the results are in `sr_leaderboards`, not `sr_player_statistics`.

**2. World Rank** reads `sr_world_rankings`. That table only holds OWGR (men). LPGA needs the Rolex Women's World Golf Rankings, which we've never synced.

## Fix, in two parts

### Part A — Results-derived fallback for Wins / Top 10s (all tours)

The Case sheet already loads `usePlayerResults` for Last-5. Extend the Season Snapshot tiles to:

1. Prefer `sr_player_statistics.wins` / `top_10s` when present (keeps PGA numbers exactly as today).
2. Fall back to counting the player's completed events in the **current season year** from `sr_leaderboards`:
   - Wins = `position === 1` (ignore `status in ('cut','WD','DQ')`)
   - Top 10s = `position !== null && position <= 10` (same status filter)
3. Extend the results fetch to the full season (not just the last 5) so counts are accurate. Add a `useSeasonResultsSummary(playerId, year)` hook that queries `sr_leaderboards` filtered by tournament season year and returns `{ wins, top10s, starts }`.
4. SG Total stays "—" when stats are absent — it isn't recoverable from finish positions and we don't fake numbers.

This fixes every non-PGA tour immediately, without any new sync.

### Part B — Per-tour World Rank (Rolex for LPGA, WGR otherwise)

1. **Schema**: add `ranking_type text` (`'wgr'` | `'rolex'`) to `sr_world_rankings`, backfill existing rows to `'wgr'`, and change the unique constraint to `(player_id, ranking_date, ranking_type)`.
2. **Sync**: extend `sportradar-sync` `rankings` action to accept a `rankingType` param and hit the correct endpoint:
   - `wgr` → `/players/wgr/{year}/rankings.json` (unchanged)
   - `rolex` → `/players/rolex/{year}/rankings.json`
   Stamp each row with the correct `ranking_type`.
3. **Cron**: add a scheduled Rolex sync alongside the existing WGR sync.
4. **generate-predictions**: pick the ranking source per tournament — LPGA tour ⇒ `rolex`, otherwise ⇒ `wgr` — when building `rankingsMap`. Everything downstream (`worldRanking`, `priorRank`, momentum) then reflects the right board.
5. Kick off a one-off Rolex sync for 2026 so the LPGA sheets aren't blank until the next scheduled run.

### Files touched

- `src/features/tourhub/overview/sections/TIPicksCarousel.tsx` — read derived wins/top10s.
- `src/features/tourhub/hooks/useSeasonResultsSummary.ts` — new hook.
- `supabase/migrations/*` — add `ranking_type` + unique index change.
- `supabase/functions/sportradar-sync/index.ts` — Rolex branch + `rankingType` param.
- `supabase/functions/generate-predictions/index.ts` — per-tour ranking source; bump `PREDICTION_LOGIC_VERSION` to 3.
- `src/features/tourhub/lib/predictionLogicVersion.ts` — bump to 3.
- Cron entry for Rolex weekly sync.

### Out of scope (flag for later)

- Ingesting full LPGA player statistics (`sr_player_statistics` for LPGA) — needs a separate season-stats sync path per tour. Once shipped, the Part-A fallback quietly hands over to real stats without any UI change.

Confirm and I'll ship all of the above in one pass.
