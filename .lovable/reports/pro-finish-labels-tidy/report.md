# Pro profile finish labels — last tidy-up (follow-up to 612694f)

Date: 2026-11-21. Brief: plain-number finish labels signed off; two loose ends.

## Lines changed

1. `src/features/pro-profile/ProProfileBuildOne.tsx:35` — hero headline figure:
   `finishLabel(summary.best)` → `chipLabel(summary.best)`. The headline now reads
   "14" instead of "14th" when there is no world rank. Label text "BEST FINISH {year}",
   sizes and movement line unchanged. CAREER sentences and chip aria-labels keep
   `finishLabel`.
2. `src/index.css` — deleted the five unused declarations at lines 113–117:
   `--pro-finish-wash`, `--pro-finish-top-ring`, `--pro-finish-win-wash`,
   `--pro-finish-win-ring`, `--pro-finish-out-ring`. `--pro-finish-add-edge` kept
   (still used by `pro-profile.css:303`).

## Grep result for the five tokens (before deletion)

```
src/index.css:113:  --pro-finish-wash: rgba(255,255,255,0.06);
src/index.css:114:  --pro-finish-top-ring: inset 0 0 0 1px rgba(255,255,255,0.55);
src/index.css:115:  --pro-finish-win-wash: rgba(251,188,46,0.12);
src/index.css:116:  --pro-finish-win-ring: inset 0 0 0 1px rgba(251,188,46,0.6);
src/index.css:117:  --pro-finish-out-ring: inset 0 0 0 1px rgba(255,255,255,0.1);
```

No uses outside `index.css` — declarations only, zero consumers. `--pro-finish-add-edge`
matched at `src/index.css:145` (kept) and `src/features/pro-profile/pro-profile.css:303`
(consumer, kept).

## New test

`src/test/proProfileBuildOneB.test.tsx` — **"hero BEST FINISH headline uses the plain
chip label"**: with no world rank and a best finish of 14, the `.pro-hero-headline`
figure reads "14", the label reads "BEST FINISH {year}", and "14th" is absent from
the hero. No existing test changed.

## Shard totals (four sequential runs, each its own command)

| Shard | Tests | Files |
|-------|-------|-------|
| 1/4 | 2,315 passed | 212 |
| 2/4 | 2,310 passed | 212 |
| 3/4 | 2,403 passed | 212 |
| 4/4 | 2,463 passed | 212 |
| **Total** | **9,491 passed** | **848** |

Baseline 9,490 / 848 → 9,491 / 848. Delta reconciled: +1 = the new headline test
(landed in shard 2, which moved 2,309 → 2,310). No unexpected failures.
