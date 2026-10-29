# Review Step 2 one screen — STOP report

## Implemented
- Step 2 replaces the shared strip with the title and display-only composerFlow counter; Step 1 keeps its shared strip through ReviewStepHeading.
- Fixed-height category heading shows an average only after all four categories are scored. Both score screen and ReviewReceipt use categoryAverage; integer-tenths half-up rounding gives8.4 for9.2/8.0/7.4/8.8, independently of overall.
- Share switch/context moved out of the body into a solid fixed footer above the unchanged action. Summary is now threshold-only and still requires overall. Footer reports its measured height for the score page's bottom padding; shorter content can still use the existing page scroller.
- Overall/rulers/category row states, live share state/default and action/nudge logic retained. No new negative tracking. Frozen mock details retain the build.

## Full suite and inventory
Command: `bunx vitest run`.
Previous executed total:4,388 across451 files (4,386 passed /2 failed in Step1 header report).
Current:**4,397 total;4,394 passed /3 failed across451 files** (449 passed files /2 failed files).
Delta:**+9 cases**, no removals.

Added8 cases in `src/test/reviewStepTwo.test.tsx`:
- `uses a heading counter on step 2 and retains the shared strip on step 1` (1).
- `rounds 9.2, 8.0, 7.4, 8.8 half up to 8.4 independently of overall` (1).
- `has no average with %s missing` for design/condition/clubhouse/facilities (4).
- `hides average without a placeholder then shows the category mean` (1).
- `places the live share switch inside the footer above its action and retains threshold` (1).
Added1 case in `src/test/reviewReceiptAverageLine.test.tsx`:
- `receipt uses the same half-up category mean of 8.4 rather than the overall`.
All9 new cases passed.

## Existing cases explicitly updated
`src/test/reviewStepTwo.test.tsx`, two parametrised cases:
- Old names:`ready share=true has step3.postingLine`, `ready share=false has step3.savingLine`.
- Old assertion:`expect(scoreFooter({ ...complete, shareToFeed }, null)).toEqual({ key, score: '8.6' })`.
- New names:`ready share=true has no posting or saving line`, `ready share=false has no posting or saving line`.
- New assertion:`expect(scoreFooter({ ...complete, shareToFeed }, null)).toBeNull()`.
- Why: brief explicitly removes posting/saving summaries. Case count unchanged.

`src/features/review-v2/__tests__/reviewPhase2.test.ts`, one case:
- Old:`renders the one shared counter instead of its own step rail`.
- Old assertion:`expect(composer).toContain('<ComposerStepHeader')`.
- New:`keeps the shared counter on step 1 and uses the score heading on step 2`.
- New assertions protect the Step1 ReviewStepHeading branch and its delegation to ComposerStepHeader; existing no-stepLabels assertion retained.
- Why: brief removes only Step2's shared strip. Case count unchanged. Passed.
No other existing cases/assertions changed; no cases deleted.

## Failures — stopped, no fixes or reruns
### Newly failing unchanged counter-source cases
`src/test/postOrReviewSheet.test.tsx:146:20`
- `display-only counters > internal review step 2 displays one fewer out of two`
- `display-only counters > internal review step 3 displays one fewer out of two`
```text
AssertionError: expected 'import { mediaCountKey } from \'./lib…' to contain '<ComposerStepHeader step={step - 1} t…'
```
Failing assertion:
```ts
expect(source).toContain('<ComposerStepHeader step={step - 1} total={REVIEW_TOTAL_STEPS - 1} left="none"');
```
The source delegates its display-only header through ReviewStepHeading. These two protecting source assertions were missed before the full run; the file was left untouched after failure. Both count as new regressions, not inherited failures.

### Inherited Step1 header failure — unchanged
`src/test/reviewStepOne.test.tsx:91:90`
Case:`header forms > preserves the safe-area photo height and compact height through the measured fold`.
```text
AssertionError: expected '' to be 'calc(env(safe-area-inset-top, 0px) + …' // Object.is equality
- Expected
+ Received
- calc(env(safe-area-inset-top, 0px) + 136px)
```
That test/source was not modified here. The previously observed unchanged onboarding upload-spy failure in ob1Welcome.test.tsx **passed in this full run**; it is not among these3 failures.

### Inherited automatic type-check failure — unchanged
Latest available log:2026-10-29T06:54:23Z.
```text
src/test/ep51SearchAndCarets.test.tsx(20,551): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
```
Not touched here. No successful typecheck/build claim.

## Verification limits
Signed-off HTML was rendered and visually inspected. Live-control phone geometry apparatus failed before rendering with:
```text
Locator.wait_for: Timeout 30000ms exceeded.
waiting for locator("[data-score-step-heading]") to be visible
```
This is an apparatus timeout, not evidence of a product error; no geometry result or screenshot of the actual controls was obtained. **390×844 no-scroll fit remains unverified**, including threshold state and safe-area behavior. No authenticated central-flow test: service status external_unmanaged. Source-level geometry and passing focused composition cases do not establish end-to-end behavior.

## Every changed project file
1. `src/features/review-v2/lib/categoryAverage.ts` — new shared half-up average.
2. `src/features/review-v2/components/ReviewScoreHeadings.tsx` — Step1 delegation / Step2 heading and complete-only average.
3. `src/features/review-v2/components/ReviewReceipt.tsx` — shared average reader.
4. `src/features/review-v2/lib/scoreStepRules.ts` — threshold-only summary; relocated score ownership documentation.
5. `src/features/review-v2/components/SubmitBar.tsx` — footer share slot and measured-height callback; other appearances retain behavior.
6. `src/features/review-v2/ReviewComposerV2.tsx` — headings, footer-owned sharing and measured bottom reserve.
7. `src/index.css` — requested heading/average/footer spacing and solid token material.
8. `public/locales/en/courses.json` — scoped Average label; retired summaries remain as inactive keys.
9. `src/test/reviewStepTwo.test.tsx` —8 additions,2 authorised case updates.
10. `src/test/reviewReceiptAverageLine.test.tsx` —1 addition.
11. `src/features/review-v2/__tests__/reviewPhase2.test.ts` —1 authorised case update.
12. `AGENTS.md` — moved local score ownership note to scoreStepRules header, retaining a reference; no absolute rule compressed/removed.
13. `roadmap.md` — scope and stop status.
14. `REVIEW_STEP_TWO_ONE_SCREEN_STOP_REPORT.md` — report.
Requirement memory added/indexed separately at mem://features/courses/review-step-two-one-screen and mem://index.md.

No SQL, migrations/migration files, RPC/edge edits, feed_config, cap changes or native/Median changes.