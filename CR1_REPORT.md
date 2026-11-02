# CR1 — Final report (CR1.1 verified)


## CR1.1 final verification — 2 November 2026
Only the five authorised files below changed, plus this report and roadmap. Switch behaviour, profile page, fallback read and root AGENTS.md are unchanged.

- `src/hooks/useUserProfile.tsx`: `is_creator: boolean;` → `is_creator?: boolean;`.
- `src/test/ep3EditProfileGolf.test.tsx`: required fixture now includes `isCreator: false`; nothing else changed.
- `src/test/ep4LinksPrivacy.test.tsx`: required fixture now includes `isCreator: false`; nothing else changed.
- `src/test/cr1CreatorChoice.test.tsx`, case **Skip never writes the toggled creator choice**: `expect(h.update.mock.calls.every(([v]) => !Object.hasOwn(v, 'is_creator'))).toBe(true);` → `expect(h.update.mock.calls.every(([v]) => !Object.prototype.hasOwnProperty.call(v, 'is_creator'))).toBe(true);`. Same assertion, target-compatible own-property check.
- `src/test/ep2EditProfileYou.test.tsx`: only the three authorised Name sheet queries below changed; case names and all assertions preserved.

### Exact scoped-query before and after
**toggle starts off when the display name is first + last, and Golfers see follows it**
Before:
```tsx
expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
fireEvent.click(screen.getByRole('switch'));
```
After:
```tsx
expect(within(screen.getByTestId('ep-sheet-name')).getByRole('switch')).toHaveAttribute('aria-checked', 'false');
fireEvent.click(within(screen.getByTestId('ep-sheet-name')).getByRole('switch'));
```
**toggle starts on for a differing display name**
Before:
```tsx
expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
```
After:
```tsx
expect(within(screen.getByTestId('ep-sheet-name')).getByRole('switch')).toHaveAttribute('aria-checked', 'true');
```
These are authorised query-scoping edits, not deleted, renamed or rewritten test cases. No assertion removed, no test added or removed in CR1.1.

### Counts and commands
Immediate baseline before CR1.1: CR2 executed **5,928 tests / 545 files**, **5,926 passed**, two known CR1 failures, zero unhandled errors. After CR1.1: **5,928 / 545 passed**, zero failures, zero unhandled errors. Delta **0 tests / 0 files**.
The brief's **5,920 / 544** was the earlier CR1 inventory; intervening CR2 added eight named cases in `src/test/cr2CreatorProfile.test.tsx` and one file. No tests were removed to match the older total.

Focused command:
`bunx vitest run src/test/cr1CreatorChoice.test.tsx src/test/ep2EditProfileYou.test.tsx src/test/ep3EditProfileGolf.test.tsx src/test/ep4LinksPrivacy.test.tsx src/test/ob1Welcome.test.tsx --maxWorkers=2`
Result: **154 / 154**, **5 files**. Full output: `/tmp/cr11/focused.log`.

Full commands: `bunx vitest run --maxWorkers=2 --shard=N/4`, separately for N=1,2,3,4.
| Shard | Tests passed | Files passed | Failures | Unhandled errors |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1,489 | 137 | 0 | 0 |
| 2 | 1,455 | 137 | 0 | 0 |
| 3 | 1,526 | 137 | 0 | 0 |
| 4 | 1,458 | 134 | 0 | 0 |
| Total | 5,928 | 545 | 0 | 0 |
Full outputs retained: `/tmp/cr11/shard1.log` through `/tmp/cr11/shard4.log`.
Automatic typecheck/build latest signal: `=== build 2026-11-02T19:05:56Z ===` / `build OK`. No manual build or typecheck run, following project harness instructions.

### Pre-existing failures, now resolved
The two EP2 multiple-switch failures and all four type errors quoted in the historical stop sections below are resolved by the exact authorised changes. No pre-existing failures remain in the full-suite or automatic check outputs; no new failures occurred.

### Screenshot limitation
The requested Welcome off/on and Edit profile → Profile type screenshots against `creator-choice.html` remain **unverified**: authentication status is `external_unmanaged`, so managed authenticated checks are unavailable. No credentials requested, fabricated session, mocked live screenshot or signed-out substitute used. Actual authenticated persistence/readback remains unverified; tests verify behaviour with controlled service responses. No app changes made to enable screenshots.

The earlier STOP sections below are retained as historical evidence, not the current verification status. Header ownership notes are accepted per CR1.1 §5; root AGENTS.md remains unchanged and no relocation is pending.

## Historical CR1 stop

## Status
Shared neutral creator switch, Welcome card under Username, Continue-only identity persistence, immediate Edit profile partial save/rollback, off-only success toast, scoped cache invalidations, toggle analytics and creation-only Creator tile removal are implemented. Profile page (CR2) unchanged.

Generated Supabase types already contain user_profiles.is_creator in Row/Insert/Update; no manual edit was required or made. No SQL, migrations, deployed RPC/edge-function, feed_config, round_pool_cap, native/Median, guest browsing, review wizard, news or round-plot changes.

## Verification and counts
Last reported full-suite baseline: **5,911 tests / 543 files**, all passing. Inventory after this edit: **5,920 tests / 544 files**, NOT a full-suite passing result. Delta: eight new cases in cr1CreatorChoice.test.tsx and one new case in bc1BusinessCreate.test.tsx. No tests removed or renamed.

Command executed:
`bunx vitest run src/test/cr1CreatorChoice.test.tsx src/test/bc1BusinessCreate.test.tsx src/test/bc2BusinessCreate.test.tsx src/test/bc3BusinessCreate.test.tsx src/test/bc5BusinessFlow.test.tsx src/test/ob1Welcome.test.tsx src/test/ep2EditProfileYou.test.tsx --maxWorkers=2`

Result: **152 passed / 154 executed**, six passing files and one failing file. All eight new creator cases pass. The protected OB1 case “partial save cannot finish onboarding or write unrelated profile fields” passes unchanged. Full output preserved at `/tmp/cr1/focused.log`. No four-shard run was started after the unexpected failure, per STOP rule. No pre-existing failures known against the last green baseline.

## Unexpected test failures (not changed)
- `src/test/ep2EditProfileYou.test.tsx:66:19`, “toggle starts off when the display name is first + last, and Golfers see follows it”: `TestingLibraryElementError: Found multiple elements with the role "switch"`.
- `src/test/ep2EditProfileYou.test.tsx:77:19`, “toggle starts on for a differing display name”: `TestingLibraryElementError: Found multiple elements with the role "switch"`.

The existing unscoped role query now finds both the new Creator switch and the Name sheet's existing switch. No component was changed to suit that test and no unauthorized selector edit was made. Suggested authorization: scope these existing Name-switch queries to ep-sheet-name; preserve assertions and case names.

## Automatic typecheck errors — build is not clean
```text
=== build 2026-11-02T18:47:50Z ===
--- typecheck ---
src/hooks/useUserProfile.tsx(121,15): error TS2352: Conversion of type '{ actor_type: string; background_image_url: string; bio: string; city: string; college_id: string; country: string; cover_photo_url: string; created_at: string; display_name: string; eg_handicap_index: number; ... 27 more ...; youtube_handle: string; }' to type 'UserProfile' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
Property 'is_creator' is missing in type '{ actor_type: string; background_image_url: string; bio: string; city: string; college_id: string; country: string; cover_photo_url: string; created_at: string; display_name: string; eg_handicap_index: number; ... 27 more ...; youtube_handle: string; }' but required in type 'UserProfile'.
src/test/cr1CreatorChoice.test.tsx(48,55): error TS2550: Property 'hasOwn' does not exist on type 'ObjectConstructor'. Do you need to change your target library? Try changing the 'lib' compiler option to 'es2022' or later.
src/test/ep3EditProfileGolf.test.tsx(34,7): error TS2741: Property 'isCreator' is missing in type '{ displayName: string; username: string; firstName: string; lastName: string; bio: string; city: string; country: string; gender: string; profilePhotoUrl: null; headerPhotoUrl: null; profilePhotoBlob: null; headerPhotoBlob: null; homeClubName: string; primaryClubId: null; ... 10 more ...; youtubeHandle: string; }' but required in type 'ProfileFormData'.
src/test/ep4LinksPrivacy.test.tsx(45,7): error TS2741: Property 'isCreator' is missing in type '{ displayName: string; username: string; firstName: string; lastName: string; bio: string; city: string; country: string; gender: string; profilePhotoUrl: null; headerPhotoUrl: null; profilePhotoBlob: null; headerPhotoBlob: null; homeClubName: string; primaryClubId: null; ... 10 more ...; youtubeHandle: string; }' but required in type 'ProfileFormData'.
```

These require a ruling before further work: the handwritten required UserProfile field conflicts with public_profiles fallback (which lacks is_creator); two existing typed ProfileFormData fixtures omit the new required field. The new test also uses Object.hasOwn, unavailable under the project's target. No corrections or reruns followed the stop.

## Screenshot and flow limits
Welcome off/on and Edit profile screenshots were not captured before the stop. Authenticated end-to-end readback is unavailable with this externally managed Supabase project (`external_unmanaged`); focused tests exercise the actual form/save hook and switch with controlled service responses, not live persistence. Mock faded sections remain unchanged; existing Edit profile photos, tabs, completion card and expanded You/Golf groups are retained rather than copied from the illustrative frozen mock.

## Architecture note
CreatorSwitch.tsx and EditProfileType.tsx headers record presentation and optimistic-state ownership. An attempted root AGENTS.md ownership note was rejected because it would exceed 12,288 bytes (12,473 proposed); root AGENTS.md remains unchanged. Cross-entrypoint ownership is pending an authorised note relocation, never compression of absolute rules.

## New cases (inventory +9)
- `Welcome toggles locally and Continue writes creator in the identity payload` — cr1CreatorChoice.test.tsx
- `Skip never writes the toggled creator choice` — cr1CreatorChoice.test.tsx
- `Welcome starts on for an existing creator` — cr1CreatorChoice.test.tsx
- `form hydration maps the creator flag and defaults missing values off` — cr1CreatorChoice.test.tsx
- `edit toggle writes only creator and updated_at and has no on toast` — cr1CreatorChoice.test.tsx
- `turning off writes false and shows the standard-profile toast after success` — cr1CreatorChoice.test.tsx
- `a failed edit save reverts the switch` — cr1CreatorChoice.test.tsx
- `successful creator saves invalidate all three viewer-scoped keys` — cr1CreatorChoice.test.tsx
- `the create picker offers no Creator tile` — bc1BusinessCreate.test.tsx

## Authorised existing test edits — exact before/after

### bc1BusinessCreate.test.tsx
```diff
--- /tmp/cr1/bc1BusinessCreate.test.tsx	2026-11-02 18:46:01.928163504 +0000
+++ src/test/bc1BusinessCreate.test.tsx	2026-11-02 18:46:53.916237181 +0000
@@ -63,6 +63,11 @@
 });
 
 describe('BC1 step 1 selection', () => {
+  it('the create picker offers no Creator tile', () => {
+    renderAt(['/business/create-v2']);
+    expect(document.querySelector('[data-value="Creator"]')).toBeNull();
+    expect(CREATE_CATEGORY_TILES.some(t => t.value === 'Creator')).toBe(false);
+  });
   it('arrives with nothing chosen; selecting enables Continue and moves', () => {
     renderAt(['/business/create-v2']);
     expect(document.querySelectorAll('.bizc-tile[aria-pressed="true"]').length).toBe(0);
@@ -77,8 +82,8 @@
   });
   it('maps every stored value to BUSINESS_CATEGORIES exactly once', () => {
     const values = CREATE_CATEGORY_TILES.map(t => t.value);
-    expect(values.length).toBe(BUSINESS_CATEGORIES.length);
-    expect([...values].sort()).toEqual([...BUSINESS_CATEGORIES].sort());
+    expect(values.length).toBe(BUSINESS_CATEGORIES.filter(v => v !== 'Creator').length);
+    expect([...values].sort()).toEqual(BUSINESS_CATEGORIES.filter(v => v !== 'Creator').sort());
     for (const v of values) expect(BUSINESS_CATEGORIES).toContain(v);
   });
   it('the draft stores the value, not the display label', () => {
@@ -103,14 +108,14 @@
 describe('BC1 history', () => {
   it('Continue pushes a step; back returns with selection kept; back on step 1 leaves', async () => {
     renderAt(['/before', '/business/create-v2'], 1);
-    fireEvent.click(tile('Creator'));
+    fireEvent.click(tile('Brand / Manufacturer'));
     fireEvent.click(cont());
-    /* BC2: step 2 is now the real branch screen; Creator takes the
+    /* BC2: step 2 is now the real branch screen; Brand / Manufacturer takes the
      * everyone-else branch. */
     expect(screen.getByTestId('bizc-step-2').getAttribute('data-branch')).toBe('other');
     expect(screen.getByTestId('bizc-progress').querySelectorAll('i[data-complete="true"]').length).toBe(2);
     fireEvent.click(screen.getByRole('button', { name: 'Back' }));
-    await waitFor(() => expect(tile('Creator').getAttribute('aria-pressed')).toBe('true'));
+    await waitFor(() => expect(tile('Brand / Manufacturer').getAttribute('aria-pressed')).toBe('true'));
     fireEvent.click(screen.getByRole('button', { name: 'Back' }));
     expect(screen.getByRole('alertdialog')).toBeTruthy();
     fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

```

### bc2BusinessCreate.test.tsx
```diff
--- /tmp/cr1/bc2BusinessCreate.test.tsx	2026-11-02 18:46:01.928268856 +0000
+++ src/test/bc2BusinessCreate.test.tsx	2026-11-02 18:46:30.151397359 +0000
@@ -353,13 +353,13 @@
   it('the country defaults from the profile and the address waits without one', async () => {
     s.tables['user_profiles'] = [{ id: 'me', country: 'United Kingdom' }];
     renderAt(['/business/create-v2']);
-    toStep2('Creator');
+    toStep2('Brand / Manufacturer');
     await waitFor(() => expect(screen.getByTestId('bizc-country-line').textContent).toContain('United Kingdom'));
     expect(screen.getByTestId('address-autocomplete').getAttribute('data-country')).toBe('GB');
     cleanup();
     s.tables['user_profiles'] = [{ id: 'me', country: null }];
     renderAt(['/business/create-v2']);
-    toStep2('Creator');
+    toStep2('Brand / Manufacturer');
     await waitFor(() => expect(screen.getByTestId('bizc-country-line').textContent).toContain('Choose a country'));
     expect(screen.getByTestId('address-autocomplete').getAttribute('data-disabled')).toBe('true');
   });
@@ -367,7 +367,7 @@
   it('Change opens the country picker and Drop a pin opens the pin sheet', async () => {
     s.tables['user_profiles'] = [{ id: 'me', country: 'United Kingdom' }];
     renderAt(['/business/create-v2']);
-    toStep2('Creator');
+    toStep2('Brand / Manufacturer');
     await waitFor(() => expect(screen.getByTestId('bizc-country-line').textContent).toContain('United Kingdom'));
     fireEvent.click(screen.getByText('Change'));
     expect(screen.getByTestId('bizc-country-picker')).toBeTruthy();
@@ -385,7 +385,7 @@
     s.rpcs['get_course_stats_batch'] = (a: { p_course_ids: string[] }) =>
       a.p_course_ids.map(id => ({ course_id: id, rounds_tracked: id === 'n1' ? 4000 : 120 }));
     renderAt(['/business/create-v2']);
-    toStep2('Creator');
+    toStep2('Brand / Manufacturer');
     await waitFor(() => expect(screen.getByTestId('address-autocomplete').getAttribute('data-country')).toBe('GB'));
     fireEvent.click(screen.getByTestId('address-pick'));
     const card = await screen.findByTestId('bizc-area-card');
@@ -399,7 +399,7 @@
     s.rpcs['get_nearby_courses'] = [{ course_id: 'n1', course_name: 'Near One', distance_km: 1.9 }];
     s.rpcs['get_course_stats_batch'] = new Error('boom');
     renderAt(['/business/create-v2']);
-    toStep2('Creator');
+    toStep2('Brand / Manufacturer');
     await waitFor(() => expect(screen.getByTestId('address-autocomplete').getAttribute('data-country')).toBe('GB'));
     fireEvent.click(screen.getByTestId('address-pick'));
     const card = await screen.findByTestId('bizc-area-card');
@@ -411,7 +411,7 @@
     s.tables['user_profiles'] = [{ id: 'me', country: 'United Kingdom' }];
     s.rpcs['get_nearby_courses'] = [];
     renderAt(['/business/create-v2']);
-    toStep2('Creator');
+    toStep2('Brand / Manufacturer');
     await waitFor(() => expect(screen.getByTestId('address-autocomplete').getAttribute('data-country')).toBe('GB'));
     fireEvent.click(screen.getByTestId('address-pick'));
     await waitFor(() => expect(screen.getByTestId('address-value')).toBeTruthy());
@@ -420,7 +420,7 @@
     s.tables['user_profiles'] = [{ id: 'me', country: 'United Kingdom' }];
     s.rpcs['get_nearby_courses'] = new Error('boom');
     renderAt(['/business/create-v2']);
-    toStep2('Creator');
+    toStep2('Brand / Manufacturer');
     await waitFor(() => expect(screen.getByTestId('address-autocomplete').getAttribute('data-country')).toBe('GB'));
     fireEvent.click(screen.getByTestId('address-pick'));
     await waitFor(() => expect(screen.getByTestId('address-value')).toBeTruthy());

```

### bc3BusinessCreate.test.tsx
```diff
--- /tmp/cr1/bc3BusinessCreate.test.tsx	2026-11-02 18:46:01.928366819 +0000
+++ src/test/bc3BusinessCreate.test.tsx	2026-11-02 18:46:30.151664930 +0000
@@ -231,7 +231,7 @@
     cleanup();
 
     renderAt(['/business/create-v2']);
-    toStep2('Creator');
+    toStep2('Brand / Manufacturer');
     fireEvent.change(screen.getByTestId('bizc-name').querySelector('input') as HTMLInputElement, { target: { value: 'A Creator' } });
     await waitFor(() => expect((screen.getByTestId('bizc-continue-2') as HTMLButtonElement).disabled).toBe(false));
     fireEvent.click(screen.getByTestId('bizc-continue-2'));

```

### bc5BusinessFlow.test.tsx
```diff
--- /tmp/cr1/bc5BusinessFlow.test.tsx	2026-11-02 18:46:01.928449415 +0000
+++ src/test/bc5BusinessFlow.test.tsx	2026-11-02 18:46:30.152061972 +0000
@@ -42,7 +42,7 @@
     s.create.mockResolvedValue({ id: 'new', slug: 'new', claim: 'none', partials: [], ownerless: { name: 'Academy', id: 'new', target: '/profile' } }); setup(); fireEvent.click(screen.getByRole('button', { name: 'Skip' })); await screen.findByRole('alertdialog'); expect(screen.queryByTestId('bizc-finish')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: "I've noted it" })); await screen.findByTestId('profile');
   });
   it('dirty step 1 asks before leaving and Discard exits', async () => {
-    setup(1); fireEvent.click(document.querySelector('[data-value="Creator"]') as HTMLButtonElement); fireEvent.click(screen.getByRole('button', { name: 'Back' })); expect(screen.getByRole('alertdialog')).toBeTruthy(); fireEvent.click(screen.getByRole('button', { name: 'Keep editing' })); expect(screen.queryByTestId('before')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Back' })); fireEvent.click(screen.getByRole('button', { name: 'Discard' })); await screen.findByTestId('before');
+    setup(1); fireEvent.click(document.querySelector('[data-value="Brand / Manufacturer"]') as HTMLButtonElement); fireEvent.click(screen.getByRole('button', { name: 'Back' })); expect(screen.getByRole('alertdialog')).toBeTruthy(); fireEvent.click(screen.getByRole('button', { name: 'Keep editing' })); expect(screen.queryByTestId('before')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Back' })); fireEvent.click(screen.getByRole('button', { name: 'Discard' })); await screen.findByTestId('before');
   });
   it('empty step 1 leaves silently', async () => { setup(1); fireEvent.click(screen.getByRole('button', { name: 'Back' })); await screen.findByTestId('before'); expect(screen.queryByRole('alertdialog')).toBeNull(); });
   it('canonical claim URL starts step 2 with the fetched club', async () => {

```

BC1 parity excludes Creator only from the picker; its membership assertions remain. BC1 history, six BC2 scenarios (eight selection calls), BC3 facilities selection and BC5 dirty departure select Brand / Manufacturer instead; all non-category assertions unchanged. BC3 case name remains verbatim as instructed, including its historical Creator wording. The canonical Creator finish/category support test remains unchanged.

## Files touched
- `src/features/creator/CreatorSwitch.tsx`
- `src/features/creator/creator.css`
- `src/features/edit-profile/EditProfileType.tsx`
- `src/index.css`
- `src/hooks/useUserProfile.tsx`
- `src/hooks/useProfileForm.ts`
- `src/hooks/useProfileSave.ts`
- `src/components/profile/profile-wizard/types.ts`
- `src/pages/Welcome.tsx`
- `src/pages/EditProfile.tsx`
- `src/features/business-create/createRules.ts`
- `src/test/bc1BusinessCreate.test.tsx`
- `src/test/bc2BusinessCreate.test.tsx`
- `src/test/bc3BusinessCreate.test.tsx`
- `src/test/bc5BusinessFlow.test.tsx`
- `src/test/cr1CreatorChoice.test.tsx`
- `roadmap.md`
- `CR1_REPORT.md`
- `mem://features/profile/creator-choice-cr1`
- `mem://index.md`
