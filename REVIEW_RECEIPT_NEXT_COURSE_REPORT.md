# Review receipt → next course

## Implementation
- `src/features/review-v2/ReviewComposerV2.tsx`: receipt state records its submitted course ID; receipt rendering requires that ID to match the route. Both next-course entrypoints clear success and submittedRef before navigation. A course-ID effect also clears them for external route/back/forward changes.
- Receipt layout, suggestion rules, analytics, pending upload controller, existing-review reads and hero geometry were not changed.
- Local ownership comment records why receipt persistence is course-scoped; no new cross-cutting architecture rule.

## Files changed
- `src/features/review-v2/ReviewComposerV2.tsx`
- `src/test/reviewReceiptNextCourse.test.tsx` (new)
- `roadmap.md`
- `REVIEW_RECEIPT_NEXT_COURSE_REPORT.md` (new)

## Tests added
All four are in `src/test/reviewReceiptNextCourse.test.tsx`:
1. `Review another opens course B at the first step with empty scores and text`
2. `Find another course search pick opens the same empty course B wizard`
3. `an external route course change never renders the course A receipt for B`
4. `Review another resolves the next course existing review for editing`

No existing tests deleted, renamed or rewritten; no existing assertions changed.
Baseline full-suite total: **7,784**. Added four cases: expected total **7,788**; this is not a verified full-suite result.

## Verification STOP
Command:
```text
bunx vitest run src/test/reviewReceiptNextCourse.test.tsx src/test/reviewComposerChrome.test.tsx src/test/reviewConfirmationRedesign.test.tsx src/test/reviewCourseSearch.test.tsx --maxWorkers=2
```
Result: **44 passed, 4 failed, 48 executed**; three existing files passed, the new file failed all four cases.

All four failures have the same test-harness error:
```text
Error: [vitest] No "headerScore" export is defined on the "@/features/review-v2/hooks/useReviewHeaderFacts" mock. Did you forget to return it from "vi.mock"?
```
Stack: `ReviewComposerHeader`, `src/features/review-v2/components/ReviewComposerHeader.tsx:99:17`.
The incomplete mock is in `src/test/reviewReceiptNextCourse.test.tsx:19`. Its counterpart in the existing composer test correctly preserves the module's real exports; this new mock does not. No repair or rerun was made after failure, per the stop rule.
Full output: `docs/verification/review-receipt-next/focused.log`.

| Shard | Result |
| --- | --- |
| 1/4 | Not run — unexpected focused failure |
| 2/4 | Not run — unexpected focused failure |
| 3/4 | Not run — unexpected focused failure |
| 4/4 | Not run — unexpected focused failure |

Preview build log: `build OK` at 2026-11-08T18:20:27Z. This does not prove receipt transitions.

## Screen checks
320/390/430 receipt → next wizard → second receipt checks **not performed** after the test stop. No screenshot or shared start-line claim.
Authenticated end-to-end checks also unavailable in this environment (`external_unmanaged`); the real account/course review flow remains for device verification. Scroll-to-top and second submission readback are unverified, not claimed complete.

No SQL, migrations, deployed RPC/edge edits, feed_config edits, native/Median changes or round_pool_cap changes.