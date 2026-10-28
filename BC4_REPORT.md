# BC4 — Appearance step and step 3 reconciliation

## Result and stop

BC4 is implemented on hidden `/business/create-v2`. Nothing is saved or uploaded. The full test suite passes, but the automatic final type check fails. Work stopped without correcting the fixture or changing assertions.

Exact automatic diagnostic, 2026-10-28T18:48:40Z:

```text
src/test/bc4BusinessCreate.test.tsx(44,63): error TS2739: Type '{ id: string; name: string; country: string; sub_country: string; region: string; }' is missing the following properties from type 'SelectedClub': club_key, latitude, longitude
```

The new club-identity test fixture omits three required fields. This is a new completed-edit error; the preview is not accepted as verified. No manual build or typecheck was run.

## Step 3 reconcile list

- Main-button and facilities chips: gap 8→6px, top gap 8→10px; selected border transparent→ink.
- Sheet grabber: bottom gap 10→14px. The social card already had its correct 14px top gap, so it was preserved.
- Phone dial chip: inset fill, 5px/8px inner spacing and natural height replace translucent fill/fixed 32px height. Existing country picker and “Phone number” placeholder retained.
- Hours helper: moved from the sheet subtitle into the master row, below “Show on my profile”. Removed the extra framed card around the master row; matched 14px/6px row spacing.
- Hours day card: top gap 14→6px; rows 6→10px vertical spacing; day and closed text 13→14.5px.
- Hours pairs: added the en dash between time inputs; time controls 13→13.5px with inset fill and 10px horizontal spacing.
- Master switch: 44×26→46×28px with 22px knob. Added day-only 38×23px switches with 17px knob; on/off semantics unchanged.
- Social glyphs: inset fill replaces translucent fill; existing five networks and normalization retained.
- Frame: fixed the visible shell to viewport height with shrinking scrollable body and nonshrinking header/footer, so long content scrolls while Continue remains in place.
- Preserved existing sample-independent contact values, defaults, summaries, facilities catalogue, labels, title/frame geometry and navigation. Mock phone numbers, dates, selections and photos are illustrative, not seeded data.

## BC4 diff

- Added a 150px cover band, overlapping 60px crest, draft name/category/place and miniature action/Follow pills.
- Shared action-label function extracted in `businessHero.ts`; live hero selection priority is unchanged. BC4 prints the selected action, including category-specific booking labels, without copying label logic.
- Added growing About input capped at 2,500 characters with counter; numeric-only four-digit year input and blur error for the editor's 1800–current-year bounds.
- Generalized `WelcomeCropper` with default-preserving aspect/frame options and business-only subtitle/hint/appearance. Cover reads `BUSINESS_COVER_ASPECT`; logo uses the squircle frame. No slider/grid/Reset added.
- Picking opens cropper; Use photo writes `pendingFile` and `localPreview`; Cancel leaves the committed image unchanged. Filled images open the shared BC3 sheet without a title row, with change/remove/cancel actions.
- Parent flow owns committed object URLs across steps, releasing replacements and unmounts. Step 4 owns and releases temporary crop-source URLs.
- Create my profile and Skip reach the draft-only finish placeholder; Back retains photos/About/year. Create checks the optional year before advancing; Skip preserves the draft without saving.

## Files touched

- `src/features/business-create/BusinessCreateStep3.tsx`
- `src/features/business-create/BusinessCreateStep4.tsx` (new)
- `src/features/business-create/step4Rules.ts` (new)
- `src/features/business-create/business-create.css`
- `src/features/onboarding/WelcomeCropper.tsx`
- `src/lib/business/businessHero.ts`
- `src/pages/BusinessCreate.tsx`
- `src/test/bc4BusinessCreate.test.tsx` (new)
- `AGENTS.md`
- `roadmap.md`
- `BC4_REPORT.md` (this report)

## Tests: old → new

Command: `bunx vitest run`.

- Last green inventory: 4,060 tests / 433 files.
- Immediately preceding glass run: 4,059 passed / 1 failed / 4,060 executed / 433 files.
- BC4: **4,082 passed / 4,082 executed / 434 files**, zero failed tests.
- Delta: **+22 tests / +1 file**, entirely `src/test/bc4BusinessCreate.test.tsx` (0→22).
- Existing tests: no edits, rewrites, renames, removals or assertion changes. OB1 tests remain untouched.
- New cases: 4 identity/place cases; 5 action-label cases; 1 Follow-only case; 2 picker/crop-shape cases; 2 Use-photo cases; 1 Cancel-preservation case; 2 remove cases; 1 About-limit case; 1 numeric/blur case; 1 year-bounds case; 2 finish/Back cases.
- Known inherited failure: `src/test/ob1Welcome.test.tsx:109:980`, “cropper has no slider, grid or reset and Use photo hands the file to the existing upload”, previously reported `AssertionError: expected "spy" to be called with arguments: [ 'profilePhotoBlob', Any<File> ]` / `Number of calls: 0`. It passes unchanged in this full run; all 74 cases in that file pass. This is not a claim that its intermittent cause was repaired.
- Runtime test log: `/tmp/bc4/full-suite.log`; run started 18:48:50 UTC and completed in 321.01 seconds.

## Limits and protected scope

Authenticated end-to-end and rendered mock-match checks were not performed: this project's authentication is external/unmanaged, and work stopped on the final type error. Automated draft, navigation and crop handoff checks are not a substitute for a signed-in visual check.

No SQL, migrations, migration files, deployed RPC/edge edits, feed_config edits, cap changes or native/Median changes. `round_pool_cap` stays 30. No business creation is performed by BC4.