# BE1 — Edit business frame and Settings — done

## BE1.1 final result — 31 October 2026
Both authorised corrections are complete. BE1 **26/26** passes, including the unchanged verified-heading expectation. No new failures; the full suite has only four pre-existing round-plot failures, untouched here.

### BE1.1 diff and test inventory
- `src/components/business/editor/BusinessEditSettings.tsx`: title-only badge changed from `<VerifiedBadge size="sm" />` to `<span aria-hidden="true"><VerifiedBadge size="sm" /></span>`. Visible title/badge retained; accessible heading is `Verified`. Shared VerifiedBadge is unchanged.
- `src/components/business/editor/business-edit.css`: removed `.be1-shell{font-family:Geist,sans-serif}`. BE1 inherits the app's system stack; no replacement font declaration.
- `src/test/be1BusinessEditSettings.test.tsx`: added only “inherits the app font without a font-family declaration in business-edit.css”, with raw stylesheet import and assertion `expect(businessEditCss).not.toMatch(/font-family\s*:/i)`. All 25 existing cases and assertions are unchanged; no deletion, renaming or rewriting.
- `BE1_REPORT.md`: status changed from STOP to done; final result added. Historical failure evidence remains below.
- `roadmap.md`: BE1.1 completion and current result.
- Project typography memory corrected to reflect the user's ruling that Geist is retired and features inherit the system stack. No app-wide typography code change.

### Commands and exact counts
- `bunx vitest run src/test/be1BusinessEditSettings.test.tsx src/test/bc5CreateBusiness.test.ts --maxWorkers=2`: **39/39 across 2 files** (BE1 26, unchanged BC5 13).
- `bunx vitest run --maxWorkers=2 --shard=1/2`: **2,360/2,360 across 244 files**.
- `bunx vitest run --maxWorkers=2 --shard=2/2`: **2,419 passed / 4 failed / 2,423 total across 243 files**.
- Combined: **4,779 passed / 4 failed / 4,783 total across 487 files**.
- Before BE1.1: **4,782 tests / 487 files**, 4,777 passed and 5 failed. After: **4,783 / 487**, +1 named font test in `be1BusinessEditSettings.test.tsx`; verified-heading failure cleared. Against round-plot baseline **4,757 / 486**, BE1 adds 25 original cases plus this 1 = **4,783 / 487**.
- Automatic preview validation: **build OK**, `2026-10-31T08:56:24Z`. Authenticated live business-editor verification remains unavailable (`external_unmanaged`); test routing/rendering is verified, not live persistence.

### Pre-existing failures — untouched by BE1.1
The brief's 20 failures describe the earlier round-plot run. The separately authorised setup correction immediately before BE1.1 cleared the six endpoint failures and exposed four animation setup failures. This BE1.1 run confirms `feedEndDot.test.tsx` **6/6** and `roundPlotLineStrip.test.tsx` **10 passed / 4 failed / 14**. Neither file was edited here.

All remaining failures are in `src/test/roundPlotLineStrip.test.tsx`:
1. “never draws before threshold and plays after the 120ms delay”, **107:103**: `TypeError: [Function requestAnimationFrame] is not a spy or a call to a spy!`
2. “renders a remounted round finished without replaying”, **24:59**, called from **114:88**: `TypeError: raf is not a function`
3. “finishes immediately with reduced motion”, **119:131**: `TypeError: [Function requestAnimationFrame] is not a spy or a call to a spy!`
4. “cancels pending animation on unmount”, **125:144**: `TypeError: [Function requestAnimationFrame] is not a spy or a call to a spy!`

No SQL, migrations or migration files, deployed RPC/edge changes, feed_config edits or native/Median changes. round_pool_cap remains 30. No publication.

## Historical BE1 implementation report

## Diff
- `src/pages/BusinessProfileEditor.tsx`: edit mode uses BusinessEditFrame and URL-backed Profile/Settings selection; preserves handleClose, dirty-state guard, current form and Save changes flow. Both old Notifications/verification-nudge render blocks removed. Create mode retains ManagePageShell through the new frame, without the deleted nudge.
- `src/components/business/editor/BusinessEditFrame.tsx` (new): shared ep-shell/head/tabs/body CSS; Back delegates unchanged; Profile remains mounted and hidden on Settings so local form/photo state survives.
- `src/components/business/editor/BusinessEditSettings.tsx` (new): unchanged deriveVerificationState and request hook; five signed-off cards; owner/admin verification action; existing business-team hook count; owner-only canonical DeleteBusinessDialog.
- `src/components/business/editor/NotificationsSection.tsx`: opt-in Settings rows and role-disabled switches; same five keys, select/update payload and rollback; existing default rendering preserved. Immediate notification save remains separate from main form save.
- `src/components/business/editor/business-edit.css` (new): scoped signed-off material, dimensions, switch rows, neutral focus outlines and owner-delete styling; personal editor/BC defaults unchanged. No new negative tracking.
- `src/components/business/editor/VerificationNudgeSection.tsx`: deleted as requested; no active consumers remain.
- `src/test/be1BusinessEditSettings.test.tsx` (new): 25 tests.
- `roadmap.md`: BE1 task and current stop.
- `BE1_REPORT.md`: this report.

## Test changes and count
No existing test deleted, renamed, rewritten or modified. No existing test referenced the removed NotificationsSection/VerificationNudgeSection render blocks, so there is no old → new assertion change. The new file adds 25 cases (loops expand to five verification states, two manager counts and two delete roles).

Targeted command: `bunx vitest run src/test/be1BusinessEditSettings.test.tsx src/test/bc5CreateBusiness.test.ts --maxWorkers=2`: **37 passed, 1 failed, 38 total across 2 files**. BE1 itself is **24 passed / 1 failed / 25**; existing bc5CreateBusiness is **13/13**.

Full scope commands (sharded because the previous unsharded full run exceeded the environment's 600-second maximum):
- `bunx vitest run --maxWorkers=2 --shard=1/2`: **2,352 passed / 7 failed / 2,359 total across 244 files**.
- `bunx vitest run --maxWorkers=2 --shard=2/2`: **2,409 passed / 14 failed / 2,423 total across 243 files**.
- Combined: **4,761 passed / 21 failed / 4,782 total across 487 files**.
- Last executed inventory **4,757/486 + BE1 25/1 = 4,782/487**. Against last green **4,743/485 + earlier round-plot 14/1 + BE1 25/1 = 4,782/487**.
- No guest-browsing test failed. Guest browsing is out of scope and untouched.

## New failure — stopped without correction
`src/test/be1BusinessEditSettings.test.tsx:86:43`, “BE1 business editor Settings > renders verification state verified with its correct action”:

`TestingLibraryElementError: Unable to find an accessible element with the role "heading" and name "Verified"`

Tool-observed actual heading name: `Verified Verified`. The existing VerifiedBadge contributes its own accessible name alongside the visible title. No badge, source or test change was made after the failure; a ruling is required. All four other verification states and navigation/notification/manager/delete/dirty-guard checks passed.

## Pre-existing failures — untouched
## Exact stops
1. All six cases in `src/test/feedEndDot.test.tsx` fail in test setup (width spy declared on line 12). Tool error: `TypeError: 'getBoundingClientRect' called on an object that is not a valid instance of Element.` Stack: `node_modules/jsdom/lib/jsdom/living/generated/Element.js:892:15`. This also blocks its two otherwise unchanged Explore endpoint cases.
2. All fourteen new cases fail at `src/test/roundPlotLineStrip.test.tsx:28:6`: `TypeError: Cannot redefine property: ResizeObserver`. The shared test setup defines the global without configurability; the new test attempts vi.stubGlobal. No change was made after this failure.


These are the same twenty failures reported before BE1, in feedEndDot.test.tsx (six) and roundPlotLineStrip.test.tsx (fourteen). Every failing case name is recorded in ROUND_PLOT_LINE_STRIP_REPORT.md and the current shard logs. No round-plot code or test changed in BE1.

## New test names
- renders the edit frame with Profile and Settings tabs
- opens Settings from the query parameter
- switches the query param while preserving unrelated parameters
- keeps the Profile form without Notifications or the obsolete verification box
- preserves unsaved changes and the existing back guard across tabs
- hides the verification action for editors
- allows admins to open verification
- reads all five notification types from muted_types
- turning a type off adds its exact key to muted_types
- turning a type on removes only its exact key from muted_types
- reverts a refused notification write
- editors cannot change preferences and see their specific note
- shows no manager value on error
- shows no manager value while loading
- opens the team page from Managers
- owners open the existing deletion dialog for this business
- renders verification state none / pending / needs_more_info / rejected / verified with its correct action (5)
- reads 1 / 3 managers with the correct singular or plural (2)
- hides Delete business for admin / editor (2)

## Validation and limitations
Automatic preview build last observed `build OK` at 2026-10-31T08:33:43Z. Authenticated end-to-end preview checks are unavailable (`external_unmanaged`); live writes, manager reads, actual deletion, and signed-off screenshot comparison were not performed. Tests use real routing/providers and canonical deletion dialog with only the destructive mutation mocked; opening the dialog does not delete a business.

Frozen Profile form retains its existing gutters, save styling and fields rather than adopting unrelated mock styles. Shared frame geometry remains EditProfile's canonical CSS; the original Geist override was removed by BE1.1 above. No SQL, migrations, deployed RPC/edge, feed_config, round_pool_cap, or native/Median configuration changes. No publication.
