# Pro finish tiles — Tour In Form grammar

## Files changed
- src/features/pro-profile/proProfileRules.ts:26-43 — finishClass replaced by finishTone (header: stay in step with tileTone); chipLabel added. finishLabel unchanged.
- src/features/pro-profile/ProSeasonSection.tsx:10 (imports), :15 (row chip tone + chipLabel), :26 (ResultDetail FINISH chipLabel, gold removed), :36/:38 (BEST tile chipLabel, gold removed), :39 (strip chip tone + chipLabel; still variant={null} size={null}; aria-label keeps finishLabel).
- src/features/pro-profile/ProProfileBuildOne.tsx:16, :46 — hero BEST counter chipLabel, gold removed.
- src/features/pro-profile/pro-profile.css:30-35 five tone rules; :41 strip mc 9.5px; career win dot and win switch now ink; unused .pro-profile-gold rule removed. .pro-ss-* untouched.
- src/features/pro-profile/ProCollectionSections.tsx:29, ProCollectionSheets.tsx:41 — two copy lines.

## Changed tests (authorised files)
- proSeasonForm: describe "Season shared finish classification" `%s is %s` — old `expect(finishClass(finish)).toBe(classification)` over 8 cases (out/win/top/made); new `expect(finishTone(finish)).toBe(tone)` over the brief's 10 cases. Reason: tone rule replaced.
- proSeasonForm "each chip class and aria-label use the shared finish rules" — `finishClass(...)` → `finishTone(...)`. Reason: helper replaced.
- proSeasonForm "%s row uses %s finish chip" — expected classes out/win/top/made → mc/win/t10/t25/other. Reason: tone rule.
- proSeasonForm "ProfileTourTab inherits…" — `toHaveClass('pro-finish-top')` → `'pro-finish-t10'`. Reason: tone rule.
- proProfileSeason "covered-tour BEST tile is best finish 1st…" renamed "…best finish 1…"; `getAllByText('1st')).toHaveLength(2)` → BEST tile value and row chip read `1`, no `1st`. Reason: bare chip labels.
- proProfileScale "…" — `rule('.pro-profile-finish.pro-finish-out')` → `rule('.pro-profile-finish.pro-finish-mc')` (still 11px). Reason: class rename.
- proCollectionSections ×2 — "Wins show in gold." → "Wins are highlighted."; "Shows in gold" → "Highlighted on your timeline". Reason: copy change.

## Added tests (+13)
finishTone it.each 8→10 (+2: `25 is t25`, `26 is other`; others renamed with new tones); chipLabel ×5; "finishLabel still returns 1st…"; "a win chip in the strip has the win class and reads 1"; "no season section or ResultDetail element carries pro-profile-gold"; "a win row chip has the win class and reads 1"; "career win dot uses ink, not gold" (proProfileScale); "hero BEST counter uses the bare chip label without pro-profile-gold" (proProfileBuildOneB).

## Shards (sequential)
2,315 / 2,309 / 2,403 / 2,463 = 9,490 / 848 files, all passed. Baseline 9,477 → +13 as above.

## Notes
- Hero BEST counter only shows with zero top 10s, so it can never display a win; its test uses 14.
- The hero headline "BEST FINISH" (ProProfileBuildOne.tsx:35, no rank) still uses finishLabel ("14th") — not listed in the brief; left unchanged.
- Old --pro-finish-* tokens remain defined in src/index.css (outside the allowed folder), now unused.
- Captures: actual components in a temporary harness at 320px, seeded data, no network; harness removed. No overflow (scrollWidth 320).
