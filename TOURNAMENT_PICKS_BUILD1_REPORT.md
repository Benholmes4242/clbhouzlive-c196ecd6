# Tournament picks build 1 — stopped at focused regression

## Authorized follow-up in build 2
Ben authorized targeting `.your-pick-text` instead of the entire radio row. The exact assertion now reads `expect(screen.getByRole('radio', { name: 'Alejandro Fierro' }).querySelector('.your-pick-text')?.textContent).toBe('Alejandro FierroNot ranked');`. No avatar/product change, no case rename or count delta. `yourPickSheet.test.tsx` passed **25/25** in the build2 focused command recorded in TOURNAMENT_PICKS_BUILD2_REPORT.md. The original stop below is historical and resolved; full-suite verification remains pending because build2 hit three other regressions.

## Outcome
Implemented the isolated YourPickSheet, field/state/mutation hooks and English/en-XA copy. No overview button or guest browsing changes. The Opened/Chosen/Search presentation uses the signed-off dimensions and global semantic colour tokens, canonical BottomSheet and real PlayerAvatar. The app's system font remains authoritative instead of the reference's retired Geist.

**STOP:** one new assertion failed. No correction or rerun was made after that failure; full shards and browser comparison were not run.

## Exact failure
Command: `bunx vitest run src/test/yourPickSheet.test.tsx --maxWorkers=2`

**24 passed / 25 executed / 1 file; 1 failed; no unhandled errors reported.**

`src/test/yourPickSheet.test.tsx:85:81`, case **“unranked metadata omits a missing country and keeps RPC order”**:

```text
AssertionError: expected 'AFAlejandro FierroNot ranked' to be 'Alejandro FierroNot ranked' // Object.is equality

Expected: "Alejandro FierroNot ranked"
Received: "AFAlejandro FierroNot ranked"
```

Assertion: `expect(screen.getByRole('radio', { name: 'Alejandro Fierro' }).textContent).toBe('Alejandro FierroNot ranked');`

The real shared avatar renders fallback initials `AF`, so the whole-row text includes them. The assertion targets the whole row rather than its metadata. Product code and this assertion remain unchanged pending authorization. Complete focused stdout/stderr retained at `/tmp/your-pick-build1/focused.log`. No failing shard exists because shards were not started. No pre-existing failure was observed; earlier historical stops are not claimed to have been rerun.

## Test reconciliation
Last reported full green baseline: **6,091 tests / 552 files** (ER3.1, documented in ER3_REPORT.md).

Candidate inventory after this build: **6,116 tests / 553 files**, +25 tests / +1 file, all in new `src/test/yourPickSheet.test.tsx`. This is inventory arithmetic, **not a full-suite pass result**. No existing test was deleted, renamed or rewritten.

New cases (each one test unless noted):
1. renders our three in prop rank order with numbered tags and no field duplicates
2. reads only the field and state RPCs with tournament identity
3. shows followed tiles and singular/plural counts when at least one followed member picked
4. hides followed tiles when no followed member picked
5. tapping a followed tile chooses its field player
6. unranked metadata omits a missing country and keeps RPC order
7. fi search matches all five required surname prefixes in field order
8. search retains our pick rank tags
9. zzz search shows a no-match line with its query
10. clear search returns the full sectioned list
11. requires one chosen row before enabling the named pick button
12. submits tournament and player ids, actively refetches state and closes
13. opens with the current pick chosen and closes without rewriting that pick
14. reopening clears search and resets to the current pick
15. locked state renders header and refusal only, with no list or submit
16. server lock refusal toasts exact copy and closes
17. removed field player refusal refetches field and leaves sheet open
18. uses real shared squircle avatars for every player
19. null lock time shows only the live field count
20–22. pick state read is disabled for signed out / anonymous / guest
23. matches case-insensitive starts across spaces dots and hyphens, not substrings
24. formats lock time in viewer-local 24 hour time and full weekday
25. country metadata is title case with null omitted

## Every file touched
- `src/features/tourhub/hooks/useTournamentPick.ts` — typed field/state RPC hooks, viewer-scoped state keys, member mutation and active refetch.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/yourPickRules.ts` — search, viewer-local lock time and country formatting.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/yourPickSheet.css` — isolated sheet geometry and semantic-token presentation.
- `src/features/tourhub/components/overview-v3/HybridHeroBands/YourPickSheet.tsx` — sheet-only selection/session/submission and refusal states.
- `src/index.css` — global picker semantic colour/gradient/shadow tokens, available to portalled contents.
- `public/locales/en/tourhub.json` — overview.yourPick copy.
- `public/locales/en-XA/tourhub.json` — matching key mirror.
- `src/test/yourPickSheet.test.tsx` — 25 new tests using real QueryClientProvider, MemoryRouter, English I18nextProvider, BottomSheet and PlayerAvatar.
- `AGENTS.md` — ownership pointer in the managed section; absolute rules unchanged.
- `roadmap.md` — task and focused-test stop.
- `TOURNAMENT_PICKS_BUILD1_REPORT.md` — this report.
- Project memory `mem://features/tourhub/your-pick-sheet` and `mem://index.md` — persistent signed-off requirements.

## Validation and limits
- Latest automatic build signal inspected: **2026-11-03T11:02:00Z — build OK**. No manual build/typecheck was run.
- Four full shards were **not run**, respecting ANY NEW FAILURE IS STOP AND REPORT.
- No live overview entrypoint exists in build 1 by design; authenticated hosted save/readback and browser/mock parity remain unverified.
- No SQL, migrations, RPC definitions, existing/new edge functions, feed_config, round_pool_cap, native/Median, review wizard, news, guest browsing or round plots were changed.
- Needed next: authorization to scope the failed new assertion to `.your-pick-meta` (rather than changing the canonical avatar), then focused checks and all four shards.