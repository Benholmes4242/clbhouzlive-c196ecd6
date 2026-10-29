# Review Step 2 — completed-edit stop report

## Result
Implemented the signed-off empty overall, 1–10 rulers, category rows and flags, share row, quiet incomplete actions, score/footer priority, and removal of the Step 2 path-changing skip. Compact course header, shared step header, and Step 1 remain unchanged. No SQL, migrations, deployed RPC/edge edits, feed_config, cap or native/Median changes.

STOP: the final automatic typecheck still reports a new test-helper typing error. It was not corrected or rerun after the completed-edit check:

```text
src/features/review-v2/components/__tests__/scrubberEmptyState.test.tsx(14,13): error TS2345: Argument of type 'EventTarget' is not assignable to parameter of type 'Document | Element | Node | Window'.
Type 'EventTarget' is missing the following properties from type 'Window': clientInformation, closed, cookieStore, customElements, and 210 more.
```

The pointer helper should accept Element | Window rather than EventTarget; correction awaits authorisation under the stop rule. Preview compilation cannot be reported clean.

## Full suite
Command: `bunx vitest run`
Before: **4,272 passed / 11 failed / 4,283 total, 447 files** (EP3 report).
After: **4,303 passed / 11 failed / 4,314 total, 448 files**.
Delta: **+31 cases and +1 file**, solely new `src/test/reviewStepTwo.test.tsx`. No tests deleted. Existing files keep their counts: reviewPhase2 10, scrubberEmptyState 4. All 45 tests across those three files passed in the full suite. No new test failures.
Last green: 4,256 / 446 files; EP3 added 27 cases / one file, this brief adds 31 / one file = 4,314 / 448.

## Changed existing tests (authorised by the brief)
`src/features/review-v2/__tests__/reviewPhase2.test.ts`:
- Renamed “opens the dial at 9.0” to “starts the overall empty rather than supplying a score”. Old assertion `expect(DEFAULT_OVERALL).toBe(9)` is replaced by null initialization and absence of DEFAULT_OVERALL; the brief removes the implicit score.
- Renamed “exists as its own boolean and gates the rating step” to “derives score presence and gates the rating step”. Old `expect(hook).toContain('overallTouched')` now checks `const overallTouched = state.overall != null`; the ratingGate assertion remains. The separate flag was explicitly removed.
- “starts satisfied in edit mode, because the member already has a score”: old assertion `expect(hook).toContain('() => isEditMode || restored?.overallTouched === true')` now checks `overall: existing.rating ?? null`, retaining the existing-score rule without a separate flag.
- “marks the dial axis with numerals, not three band names”: old literal-source checks `>1</span>`, `>5</span>`, `>10</span>` now check the ten-number generation; the brief changes the axis to all ten integers.

`src/features/review-v2/components/__tests__/scrubberEmptyState.test.tsx`:
- Renamed “leaves the scrubber null when the handle is tapped without movement” to “commits a ruler tap immediately without a ghost handle”. Old `expect(onChange).not.toHaveBeenCalled()` becomes a concrete 5.5 tap plus absent-thumb check; the brief explicitly requires tap-to-score.
- “commits when the pointer actually moves”: old `expect(onChange).toHaveBeenCalled()` strengthened to `expect(onChange).toHaveBeenLastCalledWith(7.2)` with concrete ruler geometry; the old ghost handle no longer exists.
- Its dash and assistive-tech assertions remain unchanged; shared props/helper and obsolete comments updated for the new ruler.
No other existing test file changed. Step 1 skip test remains untouched.

## New tests: 31 cases
`src/test/reviewStepTwo.test.tsx`: create null/cannot-submit; missing-overall draft; restored score draft; existing edit score; submit and stage null guards (2); no-overall action; one-category action; multi-category action/order; ready post/save (2); posting/saving (2); enabled incomplete button/no score-step skip; no-overall threshold omission; threshold priority; incomplete footer omission; ready share-on/off footer (2); four share-sub selectors (4); share toggle; four snap/bounds cases (4); keyboard stepping/Home/End; unscored category/flag-clear; calibration peer minimum/ranks.

## Pre-existing failures: all 11 unchanged EP1 cases
File: `src/test/ep1EditProfile.test.tsx`; common failing source: `src/features/edit-profile/EditProfileGolf.tsx:37:14`.
Tool words: `Error: No QueryClient set, use QueryClientProvider to set one`.
- EP1 frame > signed in renders the card; signed out renders no card
- EP1 frame > tabs switch and Settings renders SettingsTabContent
- EP1 card > shows name, username and city, and the cover at the personal aspect
- EP1 card > username alone without a city
- EP1 card > index tag only with an index
- EP1 card > home club tag only with a club
- EP1 photos > empty cover opens the square frame at the cover aspect and saves only the header
- EP1 photos > empty avatar opens the squircle frame and saves only the profile photo
- EP1 photos > a failed save shows the retry line and retrying saves again
- EP1 photos > a filled cover opens change-or-remove and remove saves the cleared header
- EP1 photos > a filled avatar offers Remove photo and saves the cleared profile photo
No EP1 source or test edits here.

## File inventory
- src/features/review-v2/ReviewComposerV2.tsx
- src/features/review-v2/hooks/useReviewComposer.ts
- src/features/review-v2/hooks/useScoreRuler.ts (new)
- src/features/review-v2/lib/scoreStepRules.ts (new)
- src/features/review-v2/components/OverallScrubber.tsx
- src/features/review-v2/components/CategoryGrid.tsx
- src/features/review-v2/components/ShareToggle.tsx
- src/features/review-v2/components/SubmitBar.tsx
- src/features/review-v2/__tests__/reviewPhase2.test.ts
- src/features/review-v2/components/__tests__/scrubberEmptyState.test.tsx
- src/test/reviewStepTwo.test.tsx (new)
- src/features/admin/lib/eventLabels.ts
- src/index.css
- public/locales/en/courses.json
- public/locales/en-XA/courses.json
- public/locales/de/courses.json
- public/locales/es/courses.json
- public/locales/ja/courses.json
- public/locales/ko/courses.json
- AGENTS.md
- roadmap.md
- REVIEW_STEP_TWO_REPORT.md (this report)
Project memory: mem://features/courses/review-step-two and its index entry.

## Copy and preserved paths
Deleted exclusive handleSkipToPost and its review_skipped_to_post callsite/analytics label. Added review_score_nudge {missing, count}. All other review events remain. Removed obsolete Step 2 lede/caption/confirm/category-gate/skip/share/summary keys in all six locales; new Step 2 strings are English. Step 1 summary keys stay because they are actively consumed. Existing useReviewSubmit already rejects null overall for submit and stage, so it is unchanged and covered by two new tests. Score ink uses semantic CSS tokens #F8FAFC; new controls use no negative letter-spacing. Geist remains authoritative rather than the mock's Inter. Mock compact/shared headers are frozen and not adopted; built headers stay unchanged.

## Verification limitations / outstanding work
- Surviving type error above blocks clean preview verification; stopped without corrections.
- Real signed-in end-to-end and phone screenshot comparison were not exercised; authentication is external_unmanaged, so no managed session is available.
- Scroll/pulse nudge and category pointer interaction are implemented, but full-composer end-to-end interactions were not verified. Tests cover underlying state/action rules, overall pointer interactions, keyboard, and category flag clearing, not a signed-in live submission.
- Existing EP1 provider failures need their separate authorisation.
