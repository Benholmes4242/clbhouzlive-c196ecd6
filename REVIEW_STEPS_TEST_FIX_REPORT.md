# Review Steps 1 and 2 — Approved correction report

## Results
- `bunx vitest run`: **4,398/4,398 passed across451/451 files**, zero failures.
- Previous executed baseline:4,397 total,4,394 passed /3 failed across451 files (EP5.1.1).
- Delta **+1**, solely the new long-name case in `src/test/reviewStepOne.test.tsx`. No tests removed or renamed.
- Automatic typecheck/build: **build OK**,2026-10-29T07:10:46Z. No remaining type-check error. The brief's EP5.1 TS2769 statement is superseded by EP5.1.1; that test file is untouched here and passes8/8.
- All3 pre-existing failures now pass: header safe-area/fold case, and both display-only counter cases for internal steps2/3. No other failures appeared; the previously intermittent unchanged onboarding upload-spy case also passes.

## Source changes
- New `reviewComposerHeader.css` owns exactly the existing safe-area heights206.75/68/136px and200ms height transition, with reduced-motion override.
- ReviewComposerHeader imports it once, adds photo/compact and photo classes, and removes only the corresponding inline height/transition and inline reduced-motion stylesheet. Photo/name split, fixed measured header, exported spacer fallback, back action and fold behavior retained.
- Name was already nowrap/hidden/ellipsis and stays so. Metadata explicitly stays one line; region has min-width0 and ellipsis while dot/score/rank all have flex-shrink0.

## Authorised old/new assertion lines
### `src/test/reviewStepOne.test.tsx`
Case name unchanged:`preserves the safe-area photo height and compact height through the measured fold`.
Old:
```ts
expect((container.querySelector('[data-photo-header]') as HTMLElement).style.height).toBe('calc(env(safe-area-inset-top, 0px) + 136px)');
expect(header?.style.height).toBe('calc(env(safe-area-inset-top, 0px) + 206.75px)');
expect(header?.style.transition).toBe('height 200ms ease');
// After rerender:
expect(header?.style.height).toBe('calc(env(safe-area-inset-top, 0px) + 68px)');
```
New:
```ts
expect(container.querySelector('[data-photo-header]')).toHaveClass('rv2-photo');
expect(header).toHaveClass('rv2-header--photo');
const cssText = readFileSync(resolve(__dirname, '../features/review-v2/components/reviewComposerHeader.css'), 'utf8');
expect(cssText).toContain('.rv2-header--photo { height: calc(env(safe-area-inset-top, 0px) + 206.75px); }');
expect(cssText).toContain('.rv2-header--compact { height: calc(env(safe-area-inset-top, 0px) + 68px); }');
expect(cssText).toContain('.rv2-photo { height: calc(env(safe-area-inset-top, 0px) + 136px); }');
expect(cssText).toContain('transition: height 200ms ease');
// After rerender:
expect(header).toHaveClass('rv2-header--compact');
```
Why: jsdom drops env() inline expressions; authorised stylesheet move preserves browser values. Same-element and absent-name-block assertions retained.
Added case:`keeps long course names on one ellipsized line and gives region truncation priority`, using Royal Portrush Golf Club (Dunluce Links). Asserts name nowrap/hidden/ellipsis, one-line metadata, region min-width0/ellipsis and dot/score/rank non-shrink. Existing translated-word mocks unchanged.

### `src/test/postOrReviewSheet.test.tsx`
Both case names retained:
- `internal review step 2 displays one fewer out of two`
- `internal review step 3 displays one fewer out of two`
Old mounted element:
```tsx
<ComposerStepHeader step={step - 1} total={2} left="none" />
```
New mounted element:
```tsx
<ReviewStepHeading step={step - 1} total={REVIEW_TOTAL_STEPS - 1} />
```
Old assertion:
```ts
expect(source).toContain('<ComposerStepHeader step={step - 1} total={REVIEW_TOTAL_STEPS - 1} left="none"');
```
New:
```ts
expect(source).toContain('<ReviewStepHeading step={step - 1} total={REVIEW_TOTAL_STEPS - 1}');
const headingSource = readFileSync('src/features/review-v2/components/ReviewScoreHeadings.tsx', 'utf8');
expect(headingSource).toContain('if (step !== total) return <ComposerStepHeader step={step} total={total} left="none"');
```
Step1 additionally asserts no score heading and two shared strip segments. Step2 asserts score heading/Step2of2 label and no shared segments. Existing display-number assertion retained. Why: test actual delegated display logic rather than a retired source line. Both test cases retained; no inventory delta.

## Every changed file
1. `src/features/review-v2/components/reviewComposerHeader.css` — new geometry stylesheet.
2. `src/features/review-v2/components/ReviewComposerHeader.tsx` — class-based geometry and metadata shrink protection.
3. `src/test/reviewStepOne.test.tsx` — authorised height-case rewrite,+1 long-name case.
4. `src/test/postOrReviewSheet.test.tsx` — authorised two counter-case rewrites, names retained.
5. `roadmap.md` — current green status and still-unverified visual checks.
6. `REVIEW_STEPS_TEST_FIX_REPORT.md` — this report.

No SQL/migrations/migration files, RPC/edge changes, feed_config, cap changes or native/Median changes. No new authenticated visual verification was performed in this test-correction scope; previous phone/end-to-end checks remain unverified.