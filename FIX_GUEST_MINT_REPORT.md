# FIX Guest mint environments

## Shipped
- `guestMintAllowed(envStatus)` in `src/features/guest/guestSession.ts` owns eligibility for bootstrap, guest hold and signed-out outcome.
- Native is eligible; preview requires URL `guest=1` or tab-stored `clbhouz_preview_guest=1`. `guest=0` clears that key. Every storage operation is guarded; failures return false.
- Webdriver and HeadlessChrome are blocked in every environment, including opted-in preview and native.
- Preview without opt-in returns auth and has no guest hold. Native guest behavior and production web remain unchanged.
- No SQL, migrations, server deployment, native/Median changes, feed_config changes or round_pool_cap changes. Existing guest cleanup remains with Ben.

## Verification
Focused command: `bunx vitest run src/test/guestMintAllowed.test.tsx src/test/guestStage2.test.tsx src/test/guestStage3.test.tsx src/test/guestSessionHold.test.tsx src/test/guestStage23.test.tsx src/test/guestEntryPoints.test.tsx --maxWorkers=2`: **61/61, six files**.

Four fresh shards ran in order with `bunx vitest run --maxWorkers=2 --shard=n/4`:

| Shard | Passed tests | Passed files |
| --- | ---: | ---: |
| 1 | 1,769 | 153 |
| 2 | 1,667 | 153 |
| 3 | 1,747 | 153 |
| 4 | 1,712 | 150 |
| Total | **6,895** | **609** |

Baseline **6,879 / 608** → **6,895 / 609**, exactly **+16 tests / +1 file**, all in new `src/test/guestMintAllowed.test.tsx`. No failures, deleted tests, renamed tests or changed assertions. Full output: `docs/verification/guest-mint/focused.log` and `shard1.log` through `shard4.log`. Latest harness build entry: **build OK**, 2026-11-05T14:41:33Z; earlier intermediate type error was resolved before focused tests and shards.

## Existing test setup changes (assertions unchanged)
These tests retain their original names and expected values but now explicitly opt into preview guest behavior:

- `src/test/guestStage2.test.tsx:47`: “bootstraps a preview guest once”. Existing assertions remain `expect(h.anon).toHaveBeenCalledTimes(1)` and `signedOutOutcome(...).toBe('hold')`; setup now uses `/?guest=1`, followed by storage/URL cleanup. No old → new assertion change.
- `src/test/guestStage3.test.tsx:107`: “preview still opens as a Clubhouse guest”. Existing assertions remain guest `data-guest` equal to `'true'`, anonymous sign-in once, and no bridge wait; setup now uses `/?guest=1`, followed by storage/URL cleanup. Native cases and shared native setup untouched.
- `src/test/guestSessionHold.test.tsx:39–40`: preview-only fixture opts in before each case and clears storage/URL afterward. Existing assertions unchanged, including sign-in once, shared sign-in once, hold presence and release, failure release, and switch-off/web false. File header now says opted-in preview.
- `src/test/guestStage23.test.tsx:104,115`: timeout and late-success preview cases explicitly opt in. Line 52 clears storage/URL after cases. Assertions remain timeout `8000`, failed reason `'timeout'`, hold released, and sign-out called once. No native cases changed.

## New coverage
16 cases cover native eligibility, default preview denial, URL opt-in and later-path persistence, opt-out and clearing, web/pending denial, webdriver and HeadlessChrome denial across all environments, storage read/write/clear failures, native independence from storage, preview bootstrap with/without opt-in, and automation bootstrap denial across all environments. Shared decision checks assert helper, hold and outcome together.

## Browser limitation
Headless Chromium at `/?guest=1` reported webdriver true, zero anonymous signup requests and zero guest holds, but the page displayed “App couldn't start”. Therefore this is not claimed as an end-to-end guest-block verification; source-level integration tests provide the verified behavior. Screenshot retained at `/tmp/browser/guest-mint/automated-preview.png`. Real native and non-automated phone preview checks were not performed.