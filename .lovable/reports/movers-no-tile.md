# Tour overview movers lose their tile — report

## What changed

- `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx`
  - Hairline under the pills removed; band padding kept.
  - Each mover is now picture and text only: no tile background, no radius, padding 0.
  - Three movers spread edge to edge with at least 12px between them; two sit as a centred pair, each 16px from the middle; one sits centred.
  - Sizes, colours and the tap target are unchanged. One unused colour import dropped.
- `src/features/tourhub/components/overview-v3/overviewShells.tsx`
  - Movers loading shell has no line and no tiles, with the same three-mover spacing. Picks loading cards keep their outline.

## Tests

- New: `src/test/tourMoversNoTile.test.tsx` — 6 cases (a)–(f), all passing.
- Authorised update, `src/test/tourOverviewScorecardTap.test.tsx` (case "pick-style movers have direction-only arrows and independent white place counts"): the three old-tile expectations changed from
  `expect(card.style.background).toBe('transparent'); expect(card.style.borderRadius).toBe('12px'); expect(card.style.padding).toBe('7px');`
  to
  `expect(card.style.background).toBe(''); expect(card.style.borderRadius).toBe(''); expect(card.style.padding).toBe('0px');`
  Reason: user authorised in reply ("My brief was wrong to say that file stays unchanged; those three lines describe the old tile"). Every other line in the file — the 28px avatar, the white place count, the arrow colours and all tap checks — is untouched.
- Authorised update, `src/test/tourOverviewMergedAiry.test.tsx`: card padding expectation `'7px'` → `'0px'` (approved earlier for the same tile removal).

## Step 3 — what sits under the pills

Code search of the live board before round 2, the finished board, the upcoming facts, the season recap and the champion strip: none draws a line at the top. The only top lines nearby are inside the picks panels and the pick sheet, which do not sit under the pills. Checked in code only, not on screen.

## Suite totals

Baseline 8,771; +6 new cases = expected 8,777.

| Shard | Tests | Passed | Failed |
|-------|-------|--------|--------|
| 1 | 2,236 | 2,236 | 0 |
| 2 | 2,105 | 2,105 | 0 |
| 3 | 2,203 | 2,203 | 0 |
| 4 | 2,233 | 2,233 | 0 |
| **Total** | **8,777** | **8,777** | **0** |

Total reconciles exactly: 8,771 + 6 = 8,777. No test deleted or renamed.

Build: OK (`/tmp/observability/build-errors.log`, 2026-11-15T14:35:20Z).

## Not verified

- On-screen appearance of the no-tile movers against the signed-off mock (checked in code and tests only).
