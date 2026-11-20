# Review wizard step 2 — ten-step bars

## Result and counts
Baseline: **9,373 tests / 836 files**, last full pass e4175b225f. After: **9,383 tests / 837 files**, all passing. Delta: +10 named cases (a)–(j) in `src/test/reviewStepTwoBars.test.tsx`; no deleted tests. Existing file counts unchanged: reviewStepTwo 39, scrubberEmptyState 4, reviewPhase2 10. Two existing cases renamed as documented below.

| Command (separate sequential execution) | Passed | Failed | Files | Full output |
|---|---:|---:|---:|---|
| `bunx vitest run --shard=1/4` | 2,304 | 0 | 210 | shard-1.log |
| `bunx vitest run --shard=2/4` | 2,287 | 0 | 210 | shard-2.log |
| `bunx vitest run --shard=3/4` | 2,349 | 0 | 210 | shard-3.log |
| `bunx vitest run --shard=4/4` | 2,443 | 0 | 207 | shard-4.log |
| Total | **9,383** | **0** | **837** | |

Initial shard 2: 2,286 passed / 1 failed, 2,287 executed. The failure was explicitly authorized by TESTS: the retired numbered-axis assertion in reviewPhase2.test.ts:103:22, `AssertionError: expected '/** Step 2 comparison uses only the h…' to contain 'Array.from({ length: 10 }'`. Its complete output is retained as shard-2-authorized-axis-stop.log. Only the retired-axis assertions were replaced; shard 2 was rerun, then shards 3 and 4 ran sequentially. No unexpected test failures occurred.

Focused command: `bunx vitest run src/test/reviewStepTwoBars.test.tsx src/test/reviewStepTwo.test.tsx src/features/review-v2/components/__tests__/scrubberEmptyState.test.tsx src/test/courseRatingConsistency.test.ts` — 72/72, full output focused.log. All ten new cases also passed in both shard-2 executions.

## Changed files
- `src/features/review-v2/components/ScoreBar.tsx` (new): one ten-segment slider shared by overall and categories; partial fill, 32px hit target.
- `src/features/review-v2/components/OverallScrubber.tsx`: empty-only denominator/hint; set overall/member comparison using the header aggregate and saved-rating exclusion.
- `src/features/review-v2/components/CategoryGrid.tsx`: independent required values, shared bars; removes checks/prompts/flagged props.
- `src/features/review-v2/hooks/useScoreRuler.ts`: shared x/width × 10 mapping; Shift arrows ±1, normal arrows ±0.1; tap/drag/Home/End preserved.
- `src/features/review-v2/lib/scoreStepRules.ts`: replaces unused scorePercent with barValueFromX; comparison base helper. missingScores/scoreAction/scoreFooter unchanged.
- `src/features/review-v2/lib/scoreStepNavigation.ts` (new): real scroll-owner smooth scrolling and keyboard focus to first missing bar; respects reduced motion.
- `src/features/review-v2/ReviewComposerV2.tsx`: removes step-only calibration read/props and amber/pulse nudges; passes the existing header facts and saved rating. Keeps ordinal for unrelated existing threshold/step-one consumers.
- `src/index.css`: local score tokens, unframed overall/category layout, bar geometry, responsive 56px overall and 16px gutters, 52px action and ready/not-ready tones.
- `src/locales/en/courses.json`: requested hint/kicker/action copy plus members comparison strings; retired prompts deleted.
- `src/locales/{de,es,ja,ko}/courses.json`: deletes only retired tapToScore/stillToScore keys; locales remain disabled. Calibration/calibrationFirst retained because ReviewReceipt constructs those keys dynamically.
- `src/test/reviewStepTwoBars.test.tsx` (new): ten requested cases with a real translation provider; synchronous init uses initAsync:false. No mock or added component defaults.
- `src/test/reviewStepTwo.test.tsx`, `src/features/review-v2/components/__tests__/scrubberEmptyState.test.tsx`, `src/features/review-v2/__tests__/reviewPhase2.test.ts`: authorized changes below.
- `roadmap.md`: current task outcome and superseded prior test stops.

## Every changed existing test (quoted old → new)
### reviewStepTwo.test.tsx, 39 → 39
Case renamed: `unscored rows have no value and flag clears immediately on scoring` → `unscored rows have no aria value and never flag on scoring`.
- `expect(row?.getAttribute('data-flagged')).toBe('true')` → `expect(row?.getAttribute('data-flagged')).toBeNull()`.
- `expect(row?.getAttribute('data-flagged')).toBe('false')` → `expect(row?.getAttribute('data-flagged')).toBeNull()`.
Why: the brief explicitly removes flagged amber styling and the flagged prop. Fixture props `flagged`, `tapToScore`, `stillToScore` removed from this case; all aria-value and scoring assertions retained.

### scrubberEmptyState.test.tsx, 4 → 4
- `commits a ruler tap immediately without a ghost handle`: `expect(onChange).toHaveBeenCalledWith(5.5)` → `expect(onChange).toHaveBeenCalledWith(5)`.
- `commits when the pointer actually moves`: `expect(onChange).toHaveBeenLastCalledWith(7.2)` → `expect(onChange).toHaveBeenLastCalledWith(6.8)`.
Why: the brief changes the old 1 + fraction × 9 scale to fraction × 10, rounded to tenths and clamped to 1–10. Names and every other assertion retained.

### reviewPhase2.test.ts, 10 → 10
Case renamed: `marks the dial axis with numerals, not three band names` → `uses a ten-step bar without a numbered axis or band names`.
- `expect(scrubber).toContain('Array.from({ length: 10 }')` → `expect(src('src/features/review-v2/components/ScoreBar.tsx')).toContain('Array.from({ length: 10 }')`.
- `expect(scrubber).toContain('{i + 1}</span>')` → `expect(scrubber).not.toContain('review-score-axis')`.
Why: numbered axis removal is explicitly authorized; the ten elements now belong to the shared bar. The unchanged `expect(scrubber).not.toContain('bandLabels')` and all unrelated cases remain.

No other existing test or assertion changed. No tests deleted; the +10 suite delta is entirely the new bars file.

## Preview and verification
Harness build OK at 2026-11-20T20:53:15Z. Intermediate preview errors were repaired before the completed edit: ordinal remains imported for existing non-calibration consumers; new provider initImmediate changed to the installed i18next type's initAsync. Neither repair changed assertions.

Chromium checked actual score components at 390×1000 and 320×1000, empty/part/all states: no horizontal overflow, correct action labels, member comparison and averages, focus moves overall first then Design, keyboard completion reads back Post review. Six state screenshots and the keyboard-all capture were visually inspected. Browser check uses isolated actual controls, not a signed-in live review; authenticated creation/editing and RPC read-back remain unverified because this project is external_unmanaged. The course header is not included in the isolated check. Browser evidence is retained alongside this report.

## Mock differences / protected elements
- Frozen course header, How good is it? / Step 2 row and share-switch copy/type/paint remain as shipped, not restyled to the reference. In particular the build heading is 22px rather than the mock's 24px at 390; the share title is 14px/700 rather than 15px/600. The brief freezes these elements.
- Existing measured fixed-footer lifecycle and safe-area reservation remain; the reference presents a short static phone frame. No page-scroll ownership changed.
- Figure letter-spacing remains 0 rather than mock −0.04em overall / −0.02em category, following the applicable zero-letter-spacing implementation constraint. Kicker tracking retains its established .16em style.
- Existing score-share white token stays #F3F5F7 to preserve the frozen switch; new score fills and ready action use #F8FAFC.
- Calibration remains on the receipt, not step 2. Existing threshold footer content and scoreAction/missingScores authority remain unchanged.
- No SQL, migrations, feed_config, round_pool_cap, submit RPC/payload or step-one behaviour changed.
