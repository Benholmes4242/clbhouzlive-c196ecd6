# TOUR SCORECARD TILE — PROFILE MOVES UP TO THE PLAYER ROW

Spec: `tour-scorecard-profile-signed-off.html` (signed off by Ben). Build date: 2026-11-02.

## Diff

### `src/features/courses/_shared/scorecard/scorecardParts.tsx` (tour identity row)
- The tour identity row (headshot + name) now carries the same `SheetDoorButton`
  doors the member head uses, pushed to the far edge: course first, then
  profile, each only when its handler is passed. The name keeps flex 1 with
  ellipsis (`flex: '0 1 auto'` → `'1 1 auto'`). No new negative letter-spacing.
- Member surface, review tile, swipe preview: untouched.

### `src/features/courses/_shared/scorecard/CardScorecardSheet.tsx` (the foot)
- Foot block condition `(engagement || (isTour && (onViewProfile || onViewCourse)) || onShareRound)`
  → `(engagement || onShareRound)`: with no engagement row and no Share the
  whole foot does not render, so the tile ends at the existing scroll padding
  below the card.
- `data-scorecard-exit-links` now renders only for the no-engagement Share case,
  as a single-column grid; the tour Course/Profile `GlassCardFootAction`s are
  removed. `MapPin`/`User` imports dropped (now unused here).
- Minimum height: `ScorecardGlassOverlay` enforces none (`minHeight: 0` only);
  nothing to remove. Reported as required by the brief.

## Tests

New `src/test/tourScorecardProfileDoor.test.tsx` (5):
- profile door renders in the identity row (beside the player name) and opens the profile;
- no profile door without a handler;
- a passed course door sits beside Profile, course first, both handlers fire;
- no foot block (`data-scorecard-exit-links` / `data-scorecard-interactive`) without engagement or Share;
- Share keeps its foot slot, alone, when passed.

Changed assertion (cb61SheetDoors.test.tsx, tour case — the brief's §1/§2 rule
supersedes the CB61 behaviour it encoded):
- OLD: "tour retains its existing foot doors and does not gain player-row doors" —
  `expect(document.querySelector('[data-scorecard-exit-links]')?.querySelectorAll('button').length).toBe(2); expect(document.querySelector('[data-sheet-door]')).toBeNull();`
- NEW: "tour moves its doors into the identity row and drops the foot actions" —
  `expect(document.querySelector('[data-scorecard-exit-links]')).toBeNull(); expect(Array.from(document.querySelectorAll('[data-sheet-door]')).map(n => n.getAttribute('data-sheet-door'))).toEqual(['course', 'profile']);`

Member-surface tests (cb61SheetDoors, scorecardSheetBasis, scorecardNotPlayedLine,
scorecardHeadPar) pass untouched.

## Results

- Focused (5 scorecard files): 33/33 passed.
- `npx tsgo --noEmit`: clean.
- Full suite, 4 shards: **5,663 passed / 4 failed / 5,667 across 530 files**
  (+24 tests / +2 files vs the 5,643/528 baseline: +5 tourScorecardProfileDoor,
  +19 roundCommentsStacked, which had never appeared in a full-suite run).
- The 4 failures are the pre-existing, already-reported
  `roundCommentsStacked.test.tsx` typed-draft cases (backdrop/card/Escape/back,
  line 127: Draft textbox unreachable behind the scorecard's `hideOthers`
  aria pass) — unchanged, still awaiting Ben's ruling on the stacked-layer fix.
  No new failures.
- Preview build: OK (`/tmp/observability/build-errors.log`).

## Proof

`external_unmanaged` auth: no session can be minted, and a guest tap on a Tour
leaderboard row opens no scorecard (verified in a 390×844 browser — the tap is
inert signed-out). A live tour-scorecard capture is therefore not possible;
the door placement, foot removal and Share retention are unit-tested above.
The signed-off mock at 390×844: `/tmp/browser/tour-scorecard/mock_390x844.png`.
Signed-in device check outstanding for Ben.

No SQL, no migrations, no RPC/edge changes, `feed_config` untouched,
`round_pool_cap` still 30, no native/Median changes.
