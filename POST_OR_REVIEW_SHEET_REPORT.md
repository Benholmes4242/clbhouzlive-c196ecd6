# Post or review sheet — STOP REPORT

## Delivered
- Separate signed-off Post / OR / Review boxes, content-height sheet, direct synchronous camera/library inputs, original files handed to the studio with the existing ten-item limit, cancel leaves sheet open.
- Search and suggested courses use the existing close-first/history-settled review navigation. August incident header rule retained verbatim. No round copy, selection state, NEXT, empty-round state or entry counter.
- One member-scoped query, enabled only while open and signed in: primary_club_id club courses, own composer posts, outgoing followed reviewers within 90 days; popular non-mock last-30-day reviews only when all personal candidates are empty. Complete 500-row pagination and 200-ID batches; reviewed/missing courses excluded, deduplication and two-row cap. Read errors suppress cached rows too.
- Confirmed from generated schema and existing hook audit: user_follows with follower_id = member and following_id is the app’s outgoing people-follow relationship. No SQL was executed.
- Counters changed only for display: post 1/1 hides counter; review internal 2/3 displays 1/2, internal 3/3 displays 2/2. Wizard state, draft restoration, analytics step numbers and handoff rules unchanged.
- Removed old locale keys after confirming only the replaced sheet read them. Six locales carry the new English copy; retained step/close/back unchanged.

## Full suite
Command: `bunx vitest run`.
Last reported inventory: 4,148 tests across 439 files (4,146 passed / 2 failed).
This run: **4,184 tests across 441 files: 4,182 passed / 2 failed**.
Delta: +36 tests / +2 files, entirely `src/test/postOrReviewSheet.test.tsx` (15) and `src/test/reviewSuggestions.test.tsx` (21). Both new files passed completely. No cases deleted or renamed. `ob1Welcome.test.tsx` passed all 74 unchanged.
Log: `/tmp/post-or-review/full-suite.log`.

### Existing test changed
`src/features/post-v2/__tests__/postPhase3.test.ts` — “draws the shared header, not a counter of its own”. Previous assertion: `expect(SRC).toContain('<ComposerStepHeader step={2} total={2}')`; now `expect(SRC).toContain('<ComposerStepHeader step={1} total={1}')`. Explicitly authorised by this brief’s removal of the entry-sheet step. Case count remains 9; all nine passed. No other existing tests changed.

### Pre-existing failures (both reproduced, untouched)
1. `src/test/bc5BusinessFlow.test.tsx:38`, “passes URL source course to claim creation”; stack `src/pages/BusinessCreate.tsx:64:19`: **TypeError: Cannot read properties of undefined (reading 'then')**.
2. `src/test/postReviewTab.test.tsx:38:55`, “renders POST, the arrows and REVIEW in order with cap-trimmed words and ink-cropped arrows”: **AssertionError: expected '' to be 'trim-both cap alphabetic' // Object.is equality**.

## Automatic type/build check — STOP
Latest diagnostic: 2026-10-28T21:36:52Z. No manual build/typecheck run.

New surviving errors:
```text
src/test/postOrReviewSheet.test.tsx(31,89): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'initImmediate' does not exist in type 'InitOptions<unknown>'.
src/test/reviewSuggestions.test.tsx(36,70): error TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and 'initImmediate' does not exist in type 'InitOptions<unknown>'.
```

Pre-existing surviving error:
```text
src/components/GlobalBottomNavigation.tsx(44,21): error TS2353: Object literal may only specify known properties, and 'textBox' does not exist in type 'Properties<string | number, string & {}>'.
```
Stopped without corrections or reruns after these completed-edit diagnostics. The sheet cannot be reported fully complete while its new test fixtures fail the automatic type check. No authenticated end-to-end or visual checks performed after the stop; mobile native picker activation is covered by synchronous control tests, not real iOS verification.

## Every file changed or added
- AGENTS.md
- roadmap.md
- src/index.css
- src/features/composer-flow/ComposerFlowSheet.tsx
- src/features/composer-flow/hooks/useReviewSuggestions.ts (new)
- src/features/composer-flow/post-or-review.css (new)
- src/features/composer-flow/components/ComposerStepHeader.tsx
- src/features/post-v2/components/BottomSheet.tsx (opt-in surface class; defaults unchanged)
- src/features/post-v2/StageComposer.tsx (counter only)
- src/features/review-v2/ReviewComposerV2.tsx (counter only)
- src/features/admin/lib/eventLabels.ts
- src/features/post-v2/__tests__/postPhase3.test.ts
- src/test/postOrReviewSheet.test.tsx (new)
- src/test/reviewSuggestions.test.tsx (new)
- public/locales/en/composerFlow.json
- public/locales/de/composerFlow.json
- public/locales/es/composerFlow.json
- public/locales/ja/composerFlow.json
- public/locales/ko/composerFlow.json
- public/locales/en-XA/composerFlow.json
- POST_OR_REVIEW_SHEET_REPORT.md (new, this report)

Deleted source: `src/features/composer-flow/hooks/useRecentCoursesForComposer.ts` — no remaining consumers; replaced by the required no-round-data hook. No tests deleted.
Project memory updated to preserve the signed-off sheet requirements.

No SQL, migration files, deployed RPC/edge changes, feed_config, round_pool_cap or native/Median configuration changes.
