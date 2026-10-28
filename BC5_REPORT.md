# BC5 — Create business, saved finish and switch-over: STOP

## Result
The shared creation path, creating state, finish panels, next actions and route switch-over are implemented. BC5 is **not signed off as complete**: one new flow-test fixture failure remains alongside the pre-existing POST / REVIEW test/type error. No source or test corrections or reruns were made after the completed full-suite failure.

Ben resolved the upload conflict: **record photo failures for both callers**. The uploader previously returned null without collecting partials. The shared path now throws into the existing per-photo catches for failed/no-URL uploads, so the editor gains its existing warning toast and the finish gets the requested notice. All other insert/owner/claim/refresh semantics remain extracted from today’s editor.

## Diff / files touched
Modified:
- `src/pages/BusinessProfileEditor.tsx`: create branch calls shared module; same partial/claim/success toasts and navigation; ownerless uses shared persistent notice. Edit writes remain unchanged. Local error helpers moved to shared reporting.
- `src/pages/BusinessCreate.tsx`: saving/ownerless/finish states; pre-insert errors preserve draft; saved history replace/collapse; claim URL entry starts step 2; shared discard/recovery.
- `src/features/business-create/BusinessCreateStep4.tsx`: pending primary label/disabled state.
- `src/features/business-create/createRules.ts`, `step2Rules.ts`: canonical-route header comments.
- `src/features/business-create/business-create.css`: finish geometry and tokens; saved cover 110px, initials crest, next rows, notes and fixed-footer frame.
- `src/App.tsx`: canonical create flow; query-preserving alias redirect.
- `src/features/chrome-v2/registry.ts`: one exact dark/no-chrome/nonbleeding create entry.
- `src/components/GlobalBottomNavigation.tsx`: removed obsolete create-v2 hidden entry only; create prefix remains hidden. Earlier textBox error untouched.
- `src/test/bc1BusinessCreate.test.tsx`, `src/test/bc4BusinessCreate.test.tsx`: explicitly superseded route/discard/finish expectations below.
- `AGENTS.md`: canonical flow/shared save ownership.
- `roadmap.md`: scope, approved ruling, inventory and stop.

Added:
- `src/features/business-create/createBusiness.ts`: original insert mapping, club display fields (no club_id/club_key), post-insert uploads/patch, owner upsert/fatal recovery, claim proof/source, failure logs and original refresh predicate. Saved image metadata reflects successful patches only.
- `src/features/business-create/creationErrors.ts`: existing error vocabulary/logging.
- `src/features/business-create/BusinessCreationNotices.tsx`: shared persistent ownerless notice and editor discard copy.
- `src/features/business-create/BusinessCreateFinish.tsx`: saved miniature, coach/partials lines, claim/verification/team/post/share/view actions.
- `src/features/business-create/useCreateDeparture.ts`: scoped app-navigation/native POP guard; dirty exits confirm, empty exits leave; busy exits blocked.
- `src/features/business-create/BusinessCreateRedirect.tsx`: query-preserving alias.
- `src/test/bc5CreateBusiness.test.ts`, `src/test/bc5BusinessFinish.test.tsx`, `src/test/bc5BusinessFlow.test.tsx`.
- `BC5_REPORT.md`.

Project memory: BC5 requirement/ruling entry and index link.

There are **no existing editor behavioural test files** importing BusinessProfileEditor in this checkout; the existing BC1 route-source assertion mentions it and is explicitly superseded by BC5 switch-over. No editor behavioural test was edited. Existing BC2 and BC3 test files remain unedited and pass.

## Test changes: old → new
No tests deleted. Existing suite count retained in both modified files (BC1 10, BC4 22).

`bc1BusinessCreate.test.tsx`:
1. “hides chrome islands and bottom nav on /business/create-v2” → “hides chrome islands and bottom nav on canonical /business/create”. Old assertions: `expect(resolveChrome('/business/create-v2', ...)).toMatchObject({ chrome: 'none', tone: 'dark', bleed: false })` and `expect(hidden).toContain("'/business/create-v2'")`. New: same chrome values for canonical route, create hidden and alias absent. Reason: explicit BC5 switch-over.
2. “/business/create still renders the current BusinessProfileEditor” → “/business/create renders the new flow and create-v2 redirects”. Old assertions matched `/business/create` to `<BusinessProfileEditor />` with ManagePageSkeleton, and alias to `<BusinessCreatePage />`. New matches canonical to BusinessCreatePage and alias to BusinessCreateRedirect. Reason: explicit BC5 switch-over.
3. “Continue pushes a step; back returns with selection kept; back on step 1 leaves” retains its name and original selection/step assertions. Original final assertion: `expect(screen.getByText('before page')).toBeTruthy()`. Now requires alertdialog and Discard before that unchanged exit assertion. Reason: BC5 dirty departure confirmation.

`bc4BusinessCreate.test.tsx` (two expanded cases, Create my profile / Skip):
4–5. “%s reaches finish; Back retains photos, About and year” → “%s saves photos, About and year and reaches a finish without Back”. Old assertions: finish present, Back returns step 4, About `Our story`, year `2014`, same photo src. New: await saved finish, no Back, shared create called with description `Our story`, foundedYear `2014`, pending File and preserved blob preview. Reason: BC5 commits the business and explicitly removes Back from finish. Added real query provider and typed save mock; all other fixtures/assertions in file untouched.

## Full suite and reconciliation
Command: `bunx vitest run`.

Before: 4,112 tests / 436 files, 4,111 passing / 1 pre-existing POST / REVIEW failure.
After: **4,148 tests / 439 files, 4,146 passing / 2 failing**.
Delta: +36 cases, +3 files, entirely:
- `bc5CreateBusiness.test.ts`: 13/13.
- `bc5BusinessFinish.test.tsx`: 14/14.
- `bc5BusinessFlow.test.tsx`: 8/9.

Existing BC1–BC4: 10 + 23 + 9 + 22 = **64/64**.
Combined BC1–BC5: **99/100**.
No removals or count deltas in existing files.

## Errors / stop
New failure: `src/test/bc5BusinessFlow.test.tsx:38`, “passes URL source course to claim creation”; stack at `src/pages/BusinessCreate.tsx:64:19`:
```text
TypeError: Cannot read properties of undefined (reading 'then')
```
The test’s fetchGolfClub mock has no resolved default for this case. Diagnosis only; not corrected after failure.

Pre-existing failure: `src/test/postReviewTab.test.tsx:38:55`, “renders POST, the arrows and REVIEW in order with cap-trimmed words and ink-cropped arrows”:
```text
AssertionError: expected '' to be 'trim-both cap alphabetic' // Object.is equality
```
Pre-existing automatic type error, latest 2026-10-28T21:24:29Z:
```text
src/components/GlobalBottomNavigation.tsx(44,21): error TS2353: Object literal may only specify known properties, and 'textBox' does not exist in type 'Properties<string | number, string & {}>'.
```
No BC5 type errors survive that latest entry. Intermediate incomplete fixture typings were completed before the test run; no post-failure corrections occurred.

Known onboarding flake: `ob1Welcome.test.tsx` passed all 74 tests unedited. No other pre-existing failures observed.

## Boundaries / verification
Authenticated end-to-end real business creation unavailable (`external_unmanaged`); no user credentials requested, no writes performed for verification. No browser screenshot or signed-off visual-match claim after the stop. Native swipe and saved-history collapse are not verified on device. Current preview is not typecheck-clean due to the separately owned POST / REVIEW error.

No creation analytics event exists in the inspected editor branch, so no new event was invented; existing downstream share/post helpers retain their tracking.

The reference uses system typography and negative tracking while the new finish adds no negative letter-spacing; existing frame typography preserved. Decorative illustrated mock photos are not used as real saved photos.

No SQL, migrations, migration files, deployed RPC/edge changes, feed_config changes, round_pool_cap changes (30 retained), or native/Median configuration changes.