# Review Step 1 photo header Option A — STOP report

## Delivered edits
- Empty Step 1 photograph is safe-area + 136px, centre65%, straight-cut and without the previous fade overlay. Existing back action/label retained.
- Course name and score metadata now sit below the photograph on the page ground; name22px/700, metadata5px below. Existing zero-review/no-rank omission logic remains.
- One fixed header ref and the measured spacer remain. Photo/name height includes both blocks, preserving the 200ms height fold; empty-only header-to-step seam6px; compact seam14px remains. Empty lede top14px and words gap18px.
- Compact header, shared counter, fold rules, other content and all protected backend/config/native paths unchanged. No new negative tracking.

## Full test result
Command: `bunx vitest run`.
Before: last reported green 4,386/4,386 across451 files.
After: **4,386 passed / 2 failed / 4,388 total across451 files** (449 files passed;2 failed).
Delta +2: both new cases in `src/test/reviewStepOne.test.tsx`:
1. `keeps the name and score outside the straight-cut photo with no overlay` — passes; asserts photo has exactly image/back children, no overlay, and name/score belong to its sibling block.
2. `preserves the safe-area photo height and compact height through the measured fold` — fails at the first height assertion below.
No existing tests deleted, renamed, rewritten or assertions changed. Existing sticky fold, score/rank omission, compact edit/delete cases retained.

## Failures — stopped without changing assertions or rerunning
### New test failure
`src/test/reviewStepOne.test.tsx:91:90`
Case: `header forms > preserves the safe-area photo height and compact height through the measured fold`
Tool output:
```text
AssertionError: expected '' to be 'calc(env(safe-area-inset-top, 0px) + …' // Object.is equality
- Expected
+ Received
- calc(env(safe-area-inset-top, 0px) + 136px)
```
Assertion: `expect((container.querySelector('[data-photo-header]') as HTMLElement).style.height).toBe('calc(env(safe-area-inset-top, 0px) + 136px)')`.
The source supplies this CSS value; jsdom discards the env() height expression and returns an empty style value. Later assertions in this case were not reached. No test/source workaround applied after failure.

### Unchanged existing test failed in this run
`src/test/ob1Welcome.test.tsx:109:980`
Case: `OB1.2 first sign-in fixes > cropper has no slider, grid or reset and Use photo hands the file to the existing upload`
```text
AssertionError: expected "spy" to be called with arguments: [ 'profilePhotoBlob', Any<File> ]
Number of calls: 0
```
This same existing upload-spy case has previously failed intermittently, but the last green baseline passed; do not count it as a persistent baseline failure. Its test and onboarding/cropper source are untouched here. No isolated rerun after stop.

### Pre-existing automatic type-check blocker — unchanged
Latest available automatic log, 2026-10-29T06:42:50Z:
```text
src/test/ep51SearchAndCarets.test.tsx(20,551): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.
```
This is the inherited EP5.1 error, not introduced here. That file was not touched. Automatic checks are not clean; no successful preview-build claim.

## Every changed project file
1. `src/features/review-v2/components/ReviewComposerHeader.tsx` — photo/name sibling layout, explicit photo-form height, local ownership documentation and existing semantic material references.
2. `src/features/review-v2/ReviewComposerV2.tsx` — empty-only measured seam/fallback and two spacing values; compact spacer gap retained.
3. `src/index.css` — one semantic back-circle token; existing ground/ink/mute/dim/fallback tokens reused.
4. `src/test/reviewStepOne.test.tsx` — two additional cases only.
5. `roadmap.md` — this task and stop status.
6. `REVIEW_STEP_ONE_HEADER_STOP_REPORT.md` — this report.
Persistent requirement record added at `mem://features/courses/review-step-one-header` and indexed in `mem://index.md`; these are not app files.

## Visual and scope limits
Rendered and inspected the signed-off HTML reference, not an authenticated live composer. Hosted service status is external_unmanaged; authenticated end-to-end checking unavailable. Exact live geometry and persistence therefore remain unverified.
Frozen mock differences retain the build (project font and compact/shared content); no mock font adoption. No SQL, migrations, migration files, RPC/edge edits, feed_config, cap or native/Median changes.