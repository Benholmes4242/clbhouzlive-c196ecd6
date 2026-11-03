# Tour player page rebuild — stopped at focused verification

## Result
The frontend rebuild is implemented but **not verified complete**. No product or test edits were made after the unexpected focused-test failure. No full-suite shards or browser comparisons were run after the stop.

## Exact stop
Focused command:
```text
bunx vitest run src/test/playerRebuildRules.test.ts src/test/playerRebuildPage.test.tsx src/test/tourPlayerHeroBand.test.tsx src/test/yourPickSheet.test.tsx src/test/youAndTour.test.tsx src/test/seasonRollover.test.tsx --maxWorkers=2
```
**102 passed / 113 executed, 11 failed, 6 files (5 passed, 1 failed).**
All 11 failures are new page tests in `src/test/playerRebuildPage.test.tsx`, with the same error:
```text
TypeError: scroller?.scrollTo is not a function
❯ Module.scrollPageToTop src/lib/getScrollParent.ts:101:13
❯ src/features/tourhub/player-v2/PlayerPage.tsx:41:17
```
The existing root-scroller helper calls an element API absent in jsdom. The new page test setup supplies no element scrollTo stub. The existing helper and all assertions remain unchanged after failure. A scoped test-environment correction is needed before rerunning.

Full focused output is retained in `PLAYER_PAGE_REBUILD_FOCUSED_OUTPUT.log` and `/tmp/player-rebuild/focused.log`. The runner reported no separate unhandled-error count, but React/jsdom logged caught/uncaught versions of this same error; do not describe this run as error-free.

## Counts
Last full-suite green: **6,168 / 554 files**. Candidate inventory after edits: **6,234 / 556 files**, NOT a full-suite passing total.
- `playerRebuildRules.test.ts`: +52 new cases.
- `playerRebuildPage.test.tsx`: +14 new cases.
- `tourPlayerHeroBand.test.tsx`: 4 before / 4 after; four authorized cinematic cases replaced below, net zero.
- All other existing tests remain unchanged. `yourPickSheet` 25/25, `youAndTour` 11/11, `seasonRollover` 7/7, new pure rules 52/52 and rewritten hero 4/4 passed in focused verification.
- No pre-existing test failure was observed in the executed files. The unrun full suite is not independently established as free of pre-existing failures.
- Requested shard commands (not run after stop): `bunx vitest run --maxWorkers=2 --shard=1/4`, `2/4`, `3/4`, `4/4`.

## Implementation inventory
Added:
- `src/features/tourhub/player-v2/data/usePlayerData.ts`: five RPC hooks, header-season race reader, inspected pick-history parser and next event/picks read.
- `src/features/tourhub/player-v2/playerRules.ts`: copy selection, figures, positions, hole arithmetic, member comparison, round analysis, majors, picks and place cleaning.
- `src/features/tourhub/player-v2/playerPage.css`: scoped signed-off geometry, shared global colour tokens.
- `src/features/tourhub/player-v2/sections/PlayerSection.tsx`
- `src/features/tourhub/player-v2/sections/PlayerForm.tsx`
- `src/features/tourhub/player-v2/sections/PlayerGame.tsx`
- `src/features/tourhub/player-v2/sections/PlayerShots.tsx`
- `src/features/tourhub/player-v2/sections/PlayerSeasonDetails.tsx`
- `src/test/playerRebuildRules.test.ts`
- `src/test/playerRebuildPage.test.tsx`
Changed:
- `src/features/tourhub/player-v2/PlayerPage.tsx`
- `src/features/tourhub/player-v2/sections/HeroSection.tsx`
- `src/features/tourhub/player-v2/sections/TournamentsSection.tsx`
- `src/features/tourhub/player-v2/sections/AboutSection.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/YourPickSheet.tsx`: optional initialPlayerId; existing callers unchanged; explicit submit still required.
- `src/features/tourhub/players-v2/you/useYouAndTour.ts`: widen tour parameter to TourId for Champions, no query/behaviour changes for existing callers.
- `src/index.css`: global semantic tokens.
- `public/locales/en/tourhub.json` and `public/locales/en-XA/tourhub.json`: player.v3 additions only.
- `src/test/tourPlayerHeroBand.test.tsx`
- `AGENTS.md`, `roadmap.md`, this report and full focused output.
- Approved plan archived at `.lovable/plan/tour-player-page-rebuild-2026-11-03.md`; project memory saved for the signed-off requirements.
Deleted (checked no remaining production consumers):
- `src/features/tourhub/player-v2/StatsSheet.tsx` (only old SeasonCards opened it; no dedicated StatsSheet tests existed).
- `src/features/tourhub/player-v2/sections/SeasonCards.tsx`
- `src/features/tourhub/player-v2/sections/AgainstTheFieldSection.tsx`
- `src/features/tourhub/player-v2/sections/FormSection.tsx`
Legacy `playerSeason.ts` and its five existing tests were retained unchanged; it is no longer consumed by the page. It was not silently deleted or rewritten.

## Authorized hero replacements (4 → 4)
The brief replaces the cinematic hero geometry and figure selection, authorizing replacement of the four tests protecting the old design. The old names and every assertion follow; no other existing test file was changed.

### `the section is a flex column that still carries the 268px floor`
```tsx
expect(section.style.display).toBe('flex');
expect(section.style.flexDirection).toBe('column');
expect(section.style.minHeight).toBe(TOUR_PLAYER_HERO_H);
expect(section.style.overflow).toBe('hidden');
expect(section.style.position).toBe('relative');
```
Why: the signed-off hero removes the fixed floor/bottom anchoring/insets and replaces the legacy rank row.

### `the content wrapper grows to fill the band and sits at its foot`
```tsx
expect(content.style.flexGrow).toBe('1');
expect(content.style.justifyContent).toBe('flex-end');
expect(content.style.minHeight).toBe('');
expect(content.style.display).toBe('flex');
expect(content.style.flexDirection).toBe('column');
```
Why: the signed-off hero removes the fixed floor/bottom anchoring/insets and replaces the legacy rank row.

### `the inset and the avatar door stay exactly as they were`
```tsx
expect(content.style.paddingTop).toBe('24px');
expect(content.style.paddingRight).toBe('114px');
expect(content.style.paddingBottom).toBe('16px');
expect(content.style.paddingLeft).toBe('16px');
expect(avatarDoor.style.right).toBe('16px');
expect(avatarDoor.style.top).toBe('50%');
```
Why: the signed-off hero removes the fixed floor/bottom anchoring/insets and replaces the legacy rank row.

### `the band still holds the name, the verdict gap and the rank row`
```tsx
expect(container.querySelector('h1')!.textContent).toBe('Rory McIlroy');
expect(rankRow).not.toBeNull();
expect(rankRow.style.marginTop).toBe('16px');
expect(rankRow.textContent).toContain('1');
expect(rankRow.textContent).toContain('3');
```
Why: the signed-off hero removes the fixed floor/bottom anchoring/insets and replaces the legacy rank row.

Replacement names:
- `selects four recorded season figures for a ranked winner`
- `renders only starts best and top10 for a one-start player`
- `follow action remains explicit and does not run on mount`
- `next-start pick action opens only on an explicit tap`

## Verification and limitations
- Latest automatic typecheck/build entry before reporting: **2026-11-03T12:50:00Z — build OK**. Intermediate errors were resolved before testing. No manual build/typecheck was run.
- Existing public RPCs inspected without SQL or writes: header, season results, hole scoring, stat percentiles and pick history. Header/result shape is real; pick-history JSON is `{ picks: [{won,name,end_date,position,tournament_id}], member_picks }`.
- Scheffler’s live RPC hole stats differ from the dated mock sample (currently 62 rounds, par3 −.028/par4 −.138/par5 −.562/bogey .1022). Live data is not replaced with the mock’s snapshot. The concrete mock scoring fixture tests pass independently.
- System font retained rather than loading the mock’s retired Geist. Compare excluded under explicit brief/approved plan. Mock tabs/notes are reference-only, not member-facing controls.
- LiveNowStrip source unchanged and still inserted beneath the hero; its new page placement test is blocked by the same scroller error.
- No browser comparison has been completed. Squircle dimensions/colours and long-copy fit remain browser-unverified. Auth status is `external_unmanaged`, so authenticated member action/readback cannot be verified with managed sessions.
- Four full shards are still required after the scoped test setup correction. No per-shard pass counts can be claimed.
- No SQL, migrations, deployed RPC/edge-function edits, guest browsing, review wizard, news, round plots, feed_config or native/Median changes. round_pool_cap remains 30.

## Failed test names
- `reads header season2026 for all four dependent player RPCs`
- `one-start LPGA shows three cells and only results`
- `renders only returned entries with no blank result dash`
- `next pick goes to the existing guest action gate without sheet`
- `member next pick preselects the player and never sends automatically`
- `following toggles only from the visible control`
- `our record gets header tour and year`
- `full season opens all returned starts using shared rows`
- `live strip retains place immediately below hero`
- `no stats suppresses game and member comparison`
- `guest never calls own scoring RPC`
