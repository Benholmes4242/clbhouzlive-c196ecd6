# BE2 — Business preview — done (BE2.1)

## Result
BE2.1's authorised fixes are complete. Targeted: **72/72 across 3 files**. Full suite: **4,816/4,816 across 488 files**, with **zero failures and zero unhandled errors**. Latest automatic validation: **build OK**, `2026-10-31T09:42:02Z`; updated preview module served HTTP 200. The prior three BE2 failures and two URL errors listed below are resolved. No pre-existing failures remain.

## BE2.1 diff and assertion accounting
- `src/components/business/editor/BusinessEditPreview.tsx`: removed the creation-only `categoryDisplayLabel` import; `const label = category` supplies both preview identity and the read-only Category row. Header documents stored-label ownership. `createRules.ts` unchanged; no other visual or application changes.
- `src/test/be2BusinessPreview.test.tsx`: file-local configurable `URL.createObjectURL` and `URL.revokeObjectURL` stubs; cleanup restores original descriptors or deletes absent original properties. Cropper mock's accessible name corrected to `Move and scale`. Added exactly two tests, **31 → 33**; no deletion, rename or wholesale rewrite.
- `roadmap.md`: BE2.1 completion and result.
- `BE2_REPORT.md`: final result and exact assertion changes.
- Project memory `mem://features/business/be2-preview`: retains the BE2 requirements and stored-category ruling; this referenced memory was absent when read and has been restored.

### Existing assertions old → new (both authorised)
1. “chooses, crops and immediately uploads logo”: `expect(screen.getByRole('dialog', { name: 'Crop' })).toHaveAttribute('data-frame', 'squircle')` → `expect(screen.getByRole('dialog', { name: 'Move and scale' })).toHaveAttribute('data-frame', 'squircle')`.
2. “chooses, crops and immediately uploads cover”: `expect(screen.getByRole('dialog', { name: 'Crop' })).toHaveAttribute('data-frame', 'square')` → `expect(screen.getByRole('dialog', { name: 'Move and scale' })).toHaveAttribute('data-frame', 'square')`.
Reason for each: WelcomeCropper's title is Move and scale, not Crop. All other existing assertions remain unchanged.

### Two added tests
- “protects the photo update payload for an editor member”: imports the actual image-upload hook despite the file's existing UI mock, runs a logo upload under a real QueryClient provider with the editor role, spies on the real protection helper and records the Supabase update. Assertions: `expect(protect).toHaveBeenCalledWith({ logo_url: '/editor-logo.jpg' }, 'editor')` and `expect(update).toHaveBeenCalledExactlyOnceWith({ logo_url: '/editor-logo.jpg' })`. This checks both passage through protection and the exact outgoing photo-only payload (no protected fields or timestamp).
- “does not render the things-left card when all eight checks are done”: renders the real preview first with blank checks, then rerenders with logo, cover, About, year, zero-coordinate pin, phone, website and displayed open hours. Assertions: `expect(screen.getByTestId('be2-completion')).toBeInTheDocument()` before and `expect(screen.queryByTestId('be2-completion')).toBeNull()` after.

### BE2.1 commands and reconciliation
- `bunx vitest run src/test/be2BusinessPreview.test.tsx src/test/be1BusinessEditSettings.test.tsx src/test/bc5CreateBusiness.test.ts --maxWorkers=2`: **72/72 across 3 files**; BE2 **33/33**, untouched BE1 **26/26**, untouched BC5 **13/13**.
- `bunx vitest run --maxWorkers=2 --shard=1/2`: **2,360/2,360 across 244 files**.
- `bunx vitest run --maxWorkers=2 --shard=2/2`: **2,456/2,456 across 244 files**.
- Combined full suite: **4,816/4,816 across 488 files**. Prior total **4,814/488 + 2 named BE2.1 tests = 4,816/488**, exactly the expected inventory. Last green **4,783/487 + 31 BE2 cases/1 file + 2 BE2.1 cases = 4,816/488**. Zero unhandled errors in targeted or either shard. Existing React act warnings remain warnings, not failures or unhandled errors.
- The three pre-existing BE2 failures were “previews identity, city and the selected main action”, “chooses, crops and immediately uploads logo”, and “chooses, crops and immediately uploads cover”; all now pass. The two pre-existing `URL.createObjectURL is not a function` errors are gone. No new failures.

No SQL, migrations or migration files, deployed RPC/edge edits, feed_config edits or native/Median changes; cap remains 30. No publication. No new negative letter-spacing. Live authenticated editor/photo readback remains unavailable (`external_unmanaged`); passing tests do not establish hosted photo persistence.

## Original BE2 implementation and historical stop

## Diff
- `src/pages/BusinessProfileEditor.tsx`: edit-only BusinessEditPreview replaces the old top photo/Identity block; create branch retains those controls. Immediate Name/About/Established writes pass only the changed field through protectBusinessPayload and use the existing business-query invalidation scope. Successful fields update state and their JSON snapshot keys; initial empty values are normalised to the populated state. Immediate photo operations use the existing upload hook. Added saving/saved/retry line above the retained Save changes control; legacy focus handling points to existing fields.
- `src/components/business/editor/BusinessEditPreview.tsx` (new): preview photo/name/category/city/action row, eight-check completion chips, Name/About/Established and photo-action BizcSheets, shared WelcomeCropper. Name is non-interactive for linked clubs/editors. About helper wraps beside the count per Ben's ruling.
- `src/components/business/editor/businessCompletion.ts` (new): pure ordered eight-check completion helper; zero coordinates count as a pin; displayed hours require a non-closed day with both times.
- `src/components/business/editor/business-edit.css`: scoped preview, completion, field and status styling with semantic tokens. The new name tracking follows the brief's explicit -0.02em value. System font inheritance retained. Lower-form neutralisation is scoped; not visually verified.
- `src/hooks/useBusinessImageUpload.ts`: optional BE2 mode passes changed-photo-only writes through the existing protection helper and propagates failures; defaults retain original behaviour, timestamps and toast handling.
- `src/test/be2BusinessPreview.test.tsx` (new): **31 cases**, **28 pass / 3 fail**. Completion checks, identity saves/baselines, read-only names, validation, count, removals and save/retry tests executed. Choose/crop upload paths are blocked by missing jsdom URL setup.
- `src/test/be1BusinessEditSettings.test.tsx`: two existing cases retargeted below; test count remains **26**.
- `roadmap.md`: task status. Module ownership notes are in the new preview/completion and image-hook headers; the attempted AGENTS.md addition was refused by its size budget and was not applied. No architecture rule was compressed or removed.
- Project memory: recorded BE2 requirements and wrapping helper ruling.

No SQL, migrations or migration files, deployed RPC/edge changes, feed_config changes, guest changes or native/Median changes. round_pool_cap stays 30. No publication.

## Existing test changes — old → new
No test removed, renamed or rewritten wholesale. Two BE1 cases changed:
1. “keeps the Profile form without Notifications or the obsolete verification box”: `expect(screen.getByRole('textbox', { name: 'Business name' })).toBeInTheDocument()` → `expect(screen.getByRole('button', { name: /^Name / })).toBeInTheDocument()`. Why: Name now opens its sheet rather than being an inline field. Other assertions retained.
2. “preserves unsaved changes and the existing back guard across tabs”: edit inline Business name to `'Changed'` and assert `toHaveValue('Changed')` → edit the unchanged lower-form Website to `'https://changed.test'` and assert `toHaveValue('https://changed.test')`. The unchanged discard-dialog assertion is still `expect(screen.getByRole('alertdialog', { name: 'Discard changes?' })).toBeInTheDocument()`. Why: BE2's Name saves immediately; the frozen lower Website remains dirty until Save changes. LocationContactSection mock now exposes only this Website field. Both cases pass.

## Historical stops — resolved by BE2.1
1. `src/test/be2BusinessPreview.test.tsx:50:234`, “previews identity, city and the selected main action”: `AssertionError: expected 'Something else · London' to be 'Other · London' // Object.is equality`. Existing creation-only categoryDisplayLabel maps Other to Something else; the new preview reused it despite the signed-off Other label. No correction after failure.
2. `src/test/be2BusinessPreview.test.tsx:62:463`, “chooses, crops and immediately uploads logo”: `TestingLibraryElementError: Unable to find an accessible element with the role "dialog" and name "Crop"`.
3. Same file/location, “chooses, crops and immediately uploads cover”: same tool error.
4. Both photo cases also raise unhandled `TypeError: URL.createObjectURL is not a function` at `src/components/business/editor/BusinessEditPreview.tsx:47:30`, because jsdom lacks that URL method. No production workaround or test setup fix was applied after failure.

## Commands and totals
- `bunx vitest run src/test/be2BusinessPreview.test.tsx src/test/be1BusinessEditSettings.test.tsx src/test/bc5CreateBusiness.test.ts --maxWorkers=2`: **67 passed / 3 failed / 70 total across 3 files**, plus **2 unhandled errors**. BE1 **26/26**, BC5 **13/13**.
- `bunx vitest run --maxWorkers=2 --shard=1/2`: **2,360/2,360 across 244 files**.
- `bunx vitest run --maxWorkers=2 --shard=2/2`: **2,451 passed / 3 failed / 2,454 total across 244 files**, plus **2 unhandled errors**.
- Combined: **4,811 passed / 3 failed / 4,814 total across 488 files**. Baseline **4,783/487 + 31 new BE2 cases/1 file = 4,814/488**. No other inventory delta.
- `feedEndDot.test.tsx` **6/6** and `roundPlotLineStrip.test.tsx` **14/14**: the earlier failures were resolved by the preceding separately authorised work. Neither file touched in BE2; no guest file changed.
- Latest automatic validation: **build OK**, `2026-10-31T09:26:51Z`. Intermediate type errors in the newly written selector were corrected before tests; no surviving type/build error observed.

## Remaining verification and scope notes
Authenticated editor/photo persistence and screenshot comparison remain unavailable (`external_unmanaged`). Preview geometry, lower-form amber neutralisation, exact address-chip focus and photo failure recovery still need live browser verification. BE2.1 now independently verifies the protected editor photo payload and hiding the completion card with all eight checks done through the rendered UI. No claim of hosted persistence verification.

The brief asked to delete old photo component uses from this page but also explicitly preserve the unreachable create branch: they remain only inside that frozen create branch. All edits stopped after the reported test failures.