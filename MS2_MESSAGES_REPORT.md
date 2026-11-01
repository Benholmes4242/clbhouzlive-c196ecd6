# MS2 — Messages: the true round count and your last four-ball

Brief: `MS2 — Messages the true round count and pasted.md`; mock `ms2-fourball.html` (signed off). No SQL, no migrations, no RPC/edge edits, `feed_config` untouched, `round_pool_cap` stays 30, no native/Median changes.

## Diff

### 1. One count everywhere (§1)
- `src/lib/whs/api.ts`
  - `dedupeSharedRounds` moved here from `useSharedGround.ts` (same (play_date, course_id) rule, keep-first, newest-first sort — byte-identical logic).
  - `fetchSharedRounds` now dedupes the `detect_shared_rounds` rows BEFORE counting: `shared_rounds_count`, `stableford_record`, `gross_record` and `shared_rounds_last_90d` all describe real rounds. The compare sheet (`CompareSheet.tsx`) reads these same numbers, so it agrees with Messages by construction.
- `src/hooks/messaging/useSharedGround.ts`
  - Re-exports `dedupeSharedRounds` from `lib/whs/api` so existing imports (incl. `ms1MessagesHeadToHead.test.tsx`) keep working.
  - `toGround` no longer takes a server count: `count` is always the deduped rounds length. The "server figure verbatim" path and its BRIEF_MESSAGES_DARK §5.2 comment are removed; the header comment and the `headToHead` comment now state that count and record always agree.
  - Both call sites (`useSharedGroundBatch`, `useSharedGroundOne`) updated to the new signature.

### 2. Four-ball card (§2)
- `src/hooks/messaging/useLastFourball.ts` (new) — reads `get_my_last_fourball` (already deployed and typed) only while the sheet is open; returns up to 3 rows.
- `src/pages/messaging-v2/NewConversationSheet.tsx`
  - Card under the search field, shown only when the RPC returns 2–3 people, the search field is empty, and the read is neither loading nor errored: margin 14/16/0, `#1E1E23`, radius 16, padding 14.
  - Avatar stack: `SquircleAvatar` 34 with a 2px `#1E1E23` border, each overlapping the previous by 8px.
  - Title 15px/600, 10px below the stack: "Your last four-ball" (3 people) / "Your last three-ball" (2).
  - Line 13px mute, 2px below: first names joined ("Simon, Chris and Matt"), " · ", `shortCourseName(course_name)`, ", ", "{d MMM}".
  - Ink pill 12px below: "Start a group", height 36, padding 0 18, 14px/600. Runs the sheet's existing group-creation path (`msg_create_group`) with exactly those members and opens the new group thread; disabled while busy; the existing "Could not create group" error toast on failure.
  - The footer `createGroup` and the card share one extracted `runCreateGroup(members)` — the RPC call, title fallback, navigation and error toast are literally the same code path.

### 3. Still pairing-based, by design (named per brief)
- `friend_rivalry` and the friend sheet's `HeadToHeadCard` (`src/components/friend-sheet/parts/HeadToHeadCard.tsx`, `deriveSheetState.ts`, `deriveH2H.ts`) still read the evaluator-written pairing-based `shared_rounds_count`. Not touched.

## Tests
- New: `src/test/ms2MessagesFourball.test.tsx` — 14 tests.
  - `fetchSharedRounds`: four duplicate rows for one day count 1; records tallied from the deduped rows; 90-day figure deduped; `useSharedGroundOne` count equals its deduped rounds; `dedupeSharedRounds` re-export identity.
  - Card: four-ball and three-ball titles; names line with `shortCourseName` and date; hidden for 0 people, 1 person, loading, error and while searching; "Start a group" calls `msg_create_group` with exactly those member ids.
- Changed existing tests: NONE. MS1, compare-sheet and all other messaging tests are byte-identical and green.
- One in-flight fix during development (my own new test, not an existing one): the search-field case first looked up the input by placeholder, but `search.people` has no `defaultValue` so the i18n mock renders it empty; the test now selects the first textbox by role. No component change.

## Suite
- Baseline: 5,541 passed / 523 files (MS1).
- After: **5,555 passed / 524 files, 0 failed, 0 skipped** (sharded 4 ways: 638 + 1,980 + 1,538 + 1,399).
- Delta: +14 tests / +1 file, reconciled entirely to `ms2MessagesFourball.test.tsx`.
- Pre-existing failures: none.
- `npx tsgo --noEmit`: clean.

## Unverified
- Signed-in device check of the card against the live `get_my_last_fourball` RPC (no authenticated session available from the sandbox).
