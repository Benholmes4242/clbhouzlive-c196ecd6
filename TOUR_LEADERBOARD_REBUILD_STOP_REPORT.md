# Tour leaderboard rebuild — specification stop

No application files or tests changed. No SQL, migrations, provider calls or protected configuration changes.

## Contradictory score-colour requirements

The brief's KEEP WORKING clause says: “score colours from scoreColor.ts (under par TOPAR_UNDER_DARK, over par ink, level rgba(248,250,252,0.55))”. The mock agrees with the parenthesized colours: `.o { color: var(--ink); }` and `.e { color: rgba(248,250,252,0.55); }` (`leaderboard-signed-off.html:99–100`).

The existing canonical helper does not output those colours:
- `src/features/tourhub/_shared/scoreColor.ts:50–51`: `return theme === 'light' ? TOPAR_EVEN_LIGHT : TOPAR_EVEN_DARK;`
- `src/features/tourhub/_shared/scoreColor.ts:59`: `return theme === 'light' ? TOPAR_OVER_LIGHT : TOPAR_OVER_DARK;`
- `src/features/tourhub/_shared/tokens.ts:199`: `TOPAR_OVER_DARK = 'rgba(242,244,247,0.62)'`.
- `src/features/tourhub/_shared/tokens.ts:201`: `TOPAR_EVEN_DARK = 'rgba(242,244,247,0.42)'`.

Preserving the helper exactly and rendering the specified/mock colours cannot both hold. Await Ben's ruling; do not silently repoint shared tokens because the hero is frozen.

## Confirmed prerequisites

Whole-field scorecard syncing exists: `supabase/functions/sportradar-sync/index.ts:1036–1042,1063–1108` iterates all response players and upserts their hole rows. `supabase/functions/tournament-live-sync/index.ts:494–517` calls this for the active tournament/round, without a player filter. This is source evidence, not a claim of live database completeness. No additional Sportradar calls are required by the planned reader.

`tour_player_follows` is already typed in `src/integrations/supabase/types.ts:13621–13645`.

`FullBoardSheet` already delegates the column header to BoardTable (`FullBoardSheet.tsx:107–118`); the brief's duplicate-header description is stale, not a conflict. Keep one header owner.

The mock loads Geist, whereas the existing global typography rule freezes system typography. Preserve system typography and report that frozen difference.

## Verification and inventory

Last reported baseline: 4,972 tests across 500 files. No tests added, deleted, renamed or rewritten; no test run undertaken before the specification ruling. Latest available automatic preview log: `2026-10-31T18:46:54Z — build OK`.

Implementation, sharded suite and four 390×844 screenshot comparisons remain pending this ruling. Your players is to be unit-tested only as the brief requires.