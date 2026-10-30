# Review confirmation — stopped

## Result and stop
The requested layout and data changes are implemented but not signed off as complete. No further fixes or assertion edits were made after the new test failure.

Command: `bunx vitest run src/test/reviewConfirmationRedesign.test.tsx src/test/reviewReceiptAverageLine.test.tsx src/test/reviewStepOne.test.tsx src/test/courseRatingConsistency.test.ts --maxWorkers=2`

- 68 executed: 67 passed, 1 failed; 3 files passed, 1 failed.
- `src/test/reviewConfirmationRedesign.test.tsx:28:361`, **receipt hero reuses the photo block but omits its reference line**:
  `AssertionError: expected 'position: relative;' to contain '196px'`
  Expected: `196px`; received: `position: relative;`.
- The assertion reads the rendered inline height containing `calc(env(...))`. The browser-height check has not been performed; the test has not been rewritten to bypass the failure.
- No pre-existing test failures observed in this run. Latest automatic build at 09:43:53 UTC: `build OK`. Earlier intermediate type errors cleared before this test run.
- Full suite not run after this failure, per STOP AND REPORT. Last full green: `bunx vitest run --maxWorkers=2`, **4,547/4,547 across 464 files**, ST3. Inventory expectation is 4,567 across 465 (+20 in the new file); this is not an executed full-suite result.

## Diff summary
- Shared `ReviewCourseHero` owns photo, canonical wash, fade and CourseMasthead. Step 1 retains its reference slot and inline geometry; receipt supplies no reference and requests safe-area + 196px height.
- Corrected RPC interface to its actual return fields, replacing `unlocked_subscores` with `subscore_threshold_met`. Removed non-returned course identity/client-score fields, including `course_id`.
- Composer success snapshot includes mediaCount and hasText; receipt does not re-read them.
- Receipt now renders settled/pending/uploading/publishing/failed status, white read-only score card/mean/calibration, member/full-score/Top100 impact rows, up to two review-search idle suggestions and canonical search entry, fixed measured footer, course-back primary and shared/live-only Clubhouse secondary. Close tracks action `close` and returns to course.
- Viewed payload drops unrated_count and adds next_count. Existing event names and admin labels are unchanged, so eventLabels.ts was not edited.
- All six locale receipt blocks carry the requested English; unused old receipt keys removed. Existing pendingBody/failedBody retained as English.

## Consumer audit
Prior production consumption of removed interface fields was confined to ReviewReceipt: course_name fallback and unlocked_subscores conditional/event. region and your_* score fields were typed but unused there; scores and course identity were already client props. The previous screen consumed next_course_id/name/played_at and unrated_count for the round-based next card and viewed payload; those reads are gone. Repository search after edits found no remaining `receipt.<removed-field>` reads. The four legacy round-derived fields remain typed because the RPC still returns them. No hosted function or SQL was inspected or changed.

## Existing tests changed, old → new
No tests deleted. Existing case counts are unchanged: reviewReceiptAverageLine 8, reviewStepOne 21, courseRatingConsistency 19.

### src/test/reviewReceiptAverageLine.test.tsx
All eight cases retain their concrete mathematical rules; fixture now matches the RPC, and real router/query providers plus isolated config/idle/standing reads support the shared hero/search.
- **receipt uses the same half-up category mean of 8.4 rather than the overall**: `filter(node => node.textContent === '8.4')).toHaveLength(1)` → `.receipt-score-head b` equals `8.4`; average moved to card head.
- **names the displayed average and measures 7.3 against 7.8, not avg_before 8.1**: `3 members rate Quinta do Lago Laranjal 7.8 on average` / `Your 7.3 is 0.5 below that average` → `Quinta do Lago Laranjal is now 7.8 from 3 members` / `Your 7.3 is 0.5 below it`; same displayed-average comparison.
- **measures an above-average 8.4 as 0.6 above 7.8**: `Your 8.4 is 0.6 above that average` → `Your 8.4 is 0.6 above it`; copy replacement only.
- **always shows the equality line when 7.8 matches 7.8**: `Your 7.8 matches that average` → `Your 7.8 matches it`.
- **uses the equality line when the absolute gap rounds below one tenth**: same equality-copy change, input 7.84 preserved.
- **shows only the first-member line with one rating** → **shows the first-member title and score sub with one rating**: `You're the first member to rate…`, parent children length `1` → `…to review…`, children length `2`; brief explicitly adds firstSub.
- **shows only the first-member line when the community average is null** → **shows the first-member title and score sub when the community average is null**: same `1` → `2` and title change; null-average rule preserved.
- **does not invent a comparison without an overall score**: old members-line locator → new members-line locator; comparison absence remains asserted with new comparison wording.

### src/test/reviewStepOne.test.tsx
- **lays the course page wash and the fade into the page over the photo, neither taking taps**: source containing `background: HERO_CANON_WASH` and canonical fade now read from ReviewCourseHero rather than ReviewComposerHeader. DOM/style assertions unchanged.
- **renders the course page masthead over the photo: shared kicker, place, two-line name clamp**: source `nameClamp={2}` now read from shared hero. DOM geometry and name assertions unchanged.

### src/test/courseRatingConsistency.test.ts
- **preserves viewing-member identity accents and white composer scores**: receipt excluded from source-loop requirement `courseSubScoreTone`; old `const c = courseSubScoreTone(v)` assertion replaced with receipt category-fill semantic ink rule. Composer/other surface assertions preserved; the new brief explicitly requires white receipt scores.

## New test inventory (+20)
src/test/reviewConfirmationRedesign.test.tsx:
1. receipt hero reuses the photo block but omits its reference line — failed as above.
2. close and primary return to the course with separate actions.
3–6. posted share sub: 5/true, 1/false, 0/true, 0/false.
7. share off is saved and never links to Clubhouse.
8. uploading has count/bar; publishing fills bar; published flips in place.
9. pending without key has waiting copy and no bar.
10. failed keeps failure body and no bar.
11. read-only score card has client values, complete mean and receipt calibration.
12. incomplete categories suppress mean and null values have no fill.
13–14. calibration stays empty for total 5 / null.
15. calibration first uses existing highest wording.
16. full scores follows the returned flag and configured ordinal.
17. false full-score flag omits the row; Top 100 uses actual list/rated count.
18. Review another selects unique unreviewed idle courses in priority order.
19. no suggestions shows search alone and opens the canonical search sheet.
20. receipt never accesses legacy round-derived fields.

## Every file changed this turn
- src/features/review-v2/components/ReviewCourseHero.tsx (new)
- src/features/review-v2/components/ReviewComposerHeader.tsx
- src/features/review-v2/components/ReviewReceipt.tsx
- src/features/review-v2/components/reviewReceipt.css (new)
- src/features/review-v2/hooks/useReviewReceipt.ts
- src/features/review-v2/lib/receiptSuggestions.ts (new)
- src/features/review-v2/ReviewComposerV2.tsx
- src/features/composer-flow/ReviewCourseSearchSheet.tsx
- public/locales/en/courses.json
- public/locales/en-XA/courses.json
- public/locales/de/courses.json
- public/locales/es/courses.json
- public/locales/ja/courses.json
- public/locales/ko/courses.json
- src/test/reviewConfirmationRedesign.test.tsx (new)
- src/test/reviewReceiptAverageLine.test.tsx
- src/test/reviewStepOne.test.tsx
- src/test/courseRatingConsistency.test.ts
- roadmap.md
- REVIEW_CONFIRMATION_STOP_REPORT.md (new)
- Project memory: mem://features/courses/review-confirmation-redesign (new).

A temporary reviewCourseHero.css was created and removed during extraction; it is not part of the final source change.

## Unverified / protected scope
Chromium visual checks, final full suite and authenticated publish/readback were not completed after the stop. Live authenticated checking is unavailable with the project's external_unmanaged session. No SQL, migrations, migration files, RPC/edge deployments, feed_config, round_pool_cap or native/Median configuration changes.