# BE4 — completed edits, stopped at verification

## Result and scope
Edit-only On your profile and Links groups/sheets implemented: canonical businessSecondPill preview/action priority, read-only booking/soon, data-gated Main button radios, Hours switch/day editing/copy-to-all, category facilities, ordered socials and unchanged handle stripping/null-empty payload. Parent saves only each sheet's fields through protectBusinessPayload, invalidates business queries and updates local saved values. Saved status moved beneath the final Links card. CreateBusiness.ts and businessHero.ts untouched.

Removed file: `src/components/business/editor/BookingComingSoonSection.tsx` (no remaining consumers).
Removed blocks in BusinessProfileEditor: unused booking notice import; edit snapshot/currentSnapshot/image dirty comparison and snapshot advancement; focusLegacy and legacy refs; edit handleSave branch with deferred image/full-form updates; edit rendering of FacilitiesSection, PrimaryActionSection, OpeningHoursSection, SocialSection and Save changes; edit discard dialog. Create-only sections/save/dialog remain. Populated latch replaces snapshot-as-population guard. New module BusinessEditProfileLinks owns sheet drafts; its header and AGENTS ownership pointer record the decision.

Changed files: BusinessProfileEditor.tsx; BusinessEditPreview.tsx; business-edit.css; new BusinessEditProfileLinks.tsx; be1BusinessEditSettings.test.tsx; be2BusinessPreview.test.tsx; be3BusinessWhereContact.test.tsx; new be4BusinessProfileLinks.test.tsx; AGENTS.md; roadmap.md; BE4 memory/index; this report. BE1_REPORT.md, BE2_REPORT.md and BE3_REPORT.md retained because the pass prerequisite was not met.

## Authorized existing-test changes — old → new
No existing tests deleted; BE1 26, BE2 33, BE3 41 counts unchanged.
- BE1 `preserves unsaved changes and the existing back guard across tabs` → `preserves immediately saved facilities across tabs and leaves without a discard guard`: `textbox Facilities = Practice green; alertdialog Discard changes? present` → save Parking through Facilities sheet, verify saved row across tabs, `queryByRole(alertdialog) = null` and destination `/business/b1`. BE4 explicitly removes deferred edit/guard.
- BE2 `keeps legacy dirty values while advancing only the saved field baseline` → `keeps saved facilities while saving only the identity field`: `Save changes enabled` → Facilities Parking retained and identity update exactly `{name:'New name'}`. BE4 removes unsaved legacy values.
- BE2 generated `saves only {name,description,founded_year} and advances the dirty baseline`: existing payload/sheet-close assertions retained; `Save changes disabled` → `queryByRole(Save changes) null` (3 cases).
- BE2 `chooses, crops and immediately uploads {logo,cover}`: file/crop/upload assertions retained; `Save changes disabled` → `queryByRole(Save changes) null` (2 cases).
- BE2 preview test fixture now provides a website for its chosen website action; its existing expected Website remains valid under the canonical live-profile rule. Fixture reset supplies it; no assertion changed.
- BE3 address full-save, direct pin save, generated Email/Website save and Phone save: payload/protection assertions retained; `Save changes disabled` → `queryByRole(Save changes) null` (5 cases).
- BE3 `retained Save changes omits immediate fields` → `Facilities sheet saves only amenities and omits immediate contact fields`: deferred Practice green save → immediate Parking save exactly `{amenities:['Parking']}`, preserving omitted-field assertions.

New BE4 file: 22 tests (6 canonical action cases, 5 hours/facilities, 3 socials/departure, 8 completion chip cases). Before 4,893 tests/495 files → after 4,915/496: exactly +22/+1; no deleted tests.

## BE4.1 authorised test fix — old → new
`BE4 socials and departure > Add a logo opens a sheet` (all eight chip cases in the loop, line 54):
- Old: `fireEvent.click(screen.getByRole('button', { name: chip }));` — document-wide query matched both the top-card photo button ("Add a logo") and the things-left chip.
- New: `const card = screen.getByTestId('be2-completion'); fireEvent.click(within(card).getByRole('button', { name: chip }));` — every chip in the loop is a completion chip, so the query is scoped to the things-left card. No production change; both buttons remain correctly named.
- Earlier compiler-only edit removing two unsupported `exact:true` role options is retained (string role names already match exactly).

## Verification (post-fix)
Commands:
- `bunx vitest run src/test/be4BusinessProfileLinks.test.tsx --maxWorkers=2`: 22/22.
- `bunx vitest run --maxWorkers=2 --shard=1/2`: 2,411/2,411 across 248 files.
- `bunx vitest run --maxWorkers=2 --shard=2/2`: 2,504/2,504 across 248 files.
- Full scope: 4,915 passed / 4,915 across 496 files, zero failures, no unhandled errors. Reconciles exactly with the 4,915/496 baseline: +0 tests, +0 files, the prior Add a logo failure cleared.
- `tsgo --noEmit`: clean.

BE1_REPORT.md, BE2_REPORT.md and BE3_REPORT.md deleted after the pass prerequisite was met. Visual comparison and real-member persistence not exercised; managed authenticated checks unavailable (`external_unmanaged`). No SQL, migrations/migration files, deployed RPC/edge, feed_config or native/Median changes; round_pool_cap stays 30.