# BE3 — Where and Contact — STOP

## Result and exact stops
Implementation is present, not complete. Per the brief's stop rule, no app/test fixes were made after the unexpected targeted failure.

1. `src/test/be2BusinessPreview.test.tsx:76:263`, “BE2 immediate editing > makes Name read-only for club”: `TestingLibraryElementError: Found multiple elements with the text: /from your club/`. Both the existing Name lock (`.be2-lock`) and the new required Address lock (`.be3-lock`) match the unchanged document-wide query. No query or copy workaround applied.
2. Surviving automatic typecheck at `src/pages/BusinessProfileEditor.tsx(573,20)`: `error TS2367: This comparison appears to be unintentional because the types '"about" | "cover" | "established" | "hours" | "logo"' and '"website"' have no overlap.`
3. Same file `(574,9)`: `error TS2367: This comparison appears to be unintentional because the types '"about" | "cover" | "established" | "hours" | "logo"' and '"phone"' have no overlap.` The new early sheet handoff narrows the keys, leaving two unreachable legacy comparisons. No correction after the completed-edit stop. Preview is **not build-clean**.

No pre-existing test/type failure at baseline; these are newly exposed by BE3. Previous Tour 4(a) data stop remains unrelated and unchanged.

## Counts and commands
- `bunx vitest run src/test/be3BusinessWhereContact.test.tsx src/test/be2BusinessPreview.test.tsx src/test/be1BusinessEditSettings.test.tsx src/test/bc2BusinessCreate.test.tsx src/test/bc3BusinessCreate.test.tsx src/test/cb65BusinessFixes.test.tsx --maxWorkers=2`: **139 passed / 1 failed / 140 total across6 files**.
- BE3 **41/41**, BE1 **26/26**, BE2 **32/33**, BC2 **23/23**, BC3 **9/9**, CB65 **8/8**. BC files and CB65 unchanged.
- `bunx vitest run --maxWorkers=2 --shard=1/2`: **2,372/2,372 across245 files**.
- `bunx vitest run --maxWorkers=2 --shard=2/2`: **2,496 passed / 1 failed / 2,497 total across245 files**.
- Combined **4,868 passed / 1 failed / 4,869 total across490 files**, no unhandled errors. Last reported **4,828/489 +41 new BE3 cases/1 file =4,869/490**. Existing test inventories unchanged; no deletion or rename.
- Latest automatic validation `2026-10-31T10:22:59Z` retains the two TS2367 errors above. No manual build/typecheck.

## Diff — every project file changed
- `src/components/business/CountrySelector.tsx`: home-nation/UK/Great Britain GB resolution; GB display United Kingdom; flag selection by resolved ISO, no stored-country write.
- `src/components/business/AddressAutocomplete.tsx`: exported postcode-inclusive precision helper; neutral plain broad-location panel and Place the pin command replace warning; unresolved-query callback and neutral suggestions option; timer cleanup. Existing bare/default field shape retained.
- `src/components/business/PhoneInputWithDialCode.tsx`: opt-in labelled Code/Number field layout; other callers retain default layout.
- `src/components/map/MapPreview.tsx`: supplied markerColor now used by Mapbox; omitted colour retains glass marker. Existing supplied-colour callers now honour their already-requested colours; no map styling change otherwise.
- `src/components/business/editor/businessContactRules.ts` (new): canonical full address payload, pin place and website display helpers, lossless saved-phone parsing.
- `src/components/business/editor/BusinessEditWhereContact.tsx` (new): local Address/Phone/Email/Website drafts, BizcSheets, existing pin handoff, map150px, neutral marker, validation and chip request consumption. Module header records draft/parent-save ownership.
- `src/components/business/editor/business-where-contact.css` (new): opt-in row/field/map treatment and shared neutral precision note tokens; no font override/negative tracking.
- `src/pages/BusinessProfileEditor.tsx`: edit-only groups replace old LocationContactSection (create render retained); sheet saves use protectBusinessPayload/runPartial and update only relevant baseline/state; retained Save changes omits immediate identity/contact/address fields; chips open sheets; existing create pin modal retained. New save-ownership comment is local to the module.
- `src/test/be3BusinessWhereContact.test.tsx` (new):41 cases below.
- `src/test/be1BusinessEditSettings.test.tsx`, `src/test/be2BusinessPreview.test.tsx`: dirty-control retargets below; inventories26/33 unchanged.
- `roadmap.md`, `BE3_REPORT.md`: task/result. Memory `mem://features/business/be3-where-contact` and index link record requirements and Ben's hidden club-linked Map pin ruling.

No SQL, migration/migration files, deployed RPC/edge, feed_config or native/Median edits; round_pool_cap remains30. No publication.

## Existing assertions and test changes — old → new
BE1 “preserves unsaved changes and the existing back guard across tabs”: edit textbox `Website` with `https://changed.test` → edit textbox `Facilities` with `Practice green`. `expect(screen.getByRole('textbox', { name: 'Website' })).toHaveValue('https://changed.test')` → `expect(screen.getByRole('textbox', { name: 'Facilities' })).toHaveValue('Practice green')`. Existing discard-dialog assertion unchanged. FacilitiesSection mock now exposes the retained dirty amenities field rather than null. Why: Website is now immediate-save and no longer an inline dirty control.

BE2 “keeps legacy dirty values while advancing only the saved field baseline”: edit `Legacy website` with `https://changed.test` → edit `Legacy facilities` with `Practice green`. Its assertions remain exactly `expect(screen.queryByTestId('be2-identity-sheet')).toBeNull()` and `expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()`. FacilitiesSection mock now exposes amenities instead of null. Why: the same retained dirty field rule. No other existing test change. The failing club Name assertion was left unchanged.

## New41 cases — be3BusinessWhereContact.test.tsx
-7 home-country cases: England, Scotland, Wales, Northern Ireland, UK, Great Britain, United Kingdom →GB; unknown →empty (1).
-4 precise cases: address, poi, postcode, pin;4 broad-note cases: city, region, country, unknown;1 postcode-no-note.
-1 saved UK phone parsing;1 website protocol/slash display.
-1 England country/search/map;1 +44 default;1 protected full address save/baseline;1 display-only country preservation;1 club Address lock/no Map pin;1 street-before-town;1 Not placed/open pin;1 direct pin immediate save;1 Place the pin;1 unresolved search Done.
-2 contact field-only saves/baselines (Email/Website);2 invalid/empty-clear cases (Email/Website);1 full Phone save;1 phone clear;1 trimmed website row;2 phone/website chip cases;1 address chip;1 retained Save changes omission;1 unknown precision payload.

## Mock ruling and verification limits
Ben explicitly chose **Hide Map pin** for club-linked businesses over the BE3-A example showing it; implementation/test follows his ruling. Reference-only decorative/old negative tracking not introduced. Header/shell/create visual elements retained.

No live authenticated editor/address/contact persistence or screenshot match claimed: member session unavailable (`external_unmanaged`), and current preview has surviving type errors. Test-only map/PinDrop mocks verify props/handoff, not real map marker pixels or delivery/search service availability. Stop cleared only after authorised follow-up and a fresh targeted/full validation.

## BE3.1 — authorised fixes (2026-10-31)
1. BE2 test scope (test-only), `src/test/be2BusinessPreview.test.tsx:76` "makes Name read-only for club". Old: document-wide `expect(screen.getByText(kind === 'club' ? /from your club/ : /owners and admins/)).toBeInTheDocument()`. New: scoped to the Name row — `const nameRow = screen.getByText('Name').closest('.ep-row'); expect(within(nameRow as HTMLElement).getByText(...)).toBeInTheDocument()` — plus one added assertion that the Address row also shows `from your club` (club kind only). No app code or other test changed; inventory stays 33.
2. TS2367 at `BusinessProfileEditor.tsx` 573/574: already resolved — the unreachable `key === 'website'`/`key === 'phone'` branches and the `input[type=url]/[type=tel]` lookups were removed in the linked-without-index pass; current `focusLegacy` keeps only the hours and remaining-field lookups. No further source change.

## BE3.1 validation
- `npx vitest run src/test/be2BusinessPreview.test.tsx`: 33/33.
- Full suite in two shards (`--shard=1/2`, `--shard=2/2`, `--maxWorkers=2`): **4,890 passed / 4,890 across 494 files** (2,389 + 2,501), zero failures, zero unhandled errors. Reconciles against the BE3 baseline 4,869/490 +21 tests/+4 files from the concurrent linked-without-index changes; the one pre-existing BE2 failure above is now fixed and no test was deleted, renamed or rewritten beyond the single scoped assertion.
- `tsgo --noEmit` clean; `vite build` OK. Preview is build-clean.