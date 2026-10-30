# Guest browsing Stage 3 — activation and test stop

## Status
The switch is enabled outside tests. Not ready to publish: one new test-harness failure remains. No test or application corrections were made after the failure. Ben publishes after the stop is resolved; no publication was attempted.

## Diff and changed files
- `src/features/guest/guestConfig.ts`: `GUEST_BROWSING_ENABLED = import.meta.env.MODE !== 'test'`; `guestEnabledForHost` now returns `mode !== 'test'` regardless of host. Removed the preview-host import. Header states Stage 3, production on, and runtime environment ownership.
- `src/App.tsx`: updated only RootGate's Stage 2 comment to Stage 3. No logic changes.
- `src/test/guestBrowsing.test.tsx`: updated one switch test and its header.
- `src/test/guestStage2.test.tsx`: updated two switch tests and the describe label.
- `src/test/guestStage3.test.tsx`: added five launch regressions. Uses the real RootGate leaf extracted/transpiled from App, real GuestSessionHold and shared envStatus, controlled bridge/session services, and real AppDownloadGate with service mocks.
- `roadmap.md`: added Stage 3 work and the scoped failure.
- `GUEST_STAGE3_REPORT.md`: this report.

No visual or negative-letter-spacing changes. Apple name diagnostic logging in AuthForm is unchanged. No SQL, migrations, migration files, deployed RPC/edge changes, feed_config, round_pool_cap, or native/Median configuration changes.

## Runtime environment audit
- RootGate reads `const envStatus = useEnvStatus()` in `src/App.tsx:217` and passes it to `useGuestSessionBootstrap` at line 224. It returns BootHold for `pending`, AppDownloadGate for `web`, and Clubhouse for an existing native/preview session.
- GuestSessionHold's inner Hold reads `useEnvStatus()` in `src/features/guest/GuestSessionHold.tsx:18`, passes it into bootstrap at line 20 and hold rules at lines 21–24.
- `src/features/guest/guestSession.ts` checks `envStatus !== 'native' && envStatus !== 'preview'` before anonymous sign-in. Neither caller makes a module-load native decision for guest creation.
- `src/utils/native/envStatus.ts` has the existing synchronous positive fast-path; otherwise status stays `pending` until `waitForNativeBridge(2000)` resolves to `native` or `web`. A fresh installation with no early bridge is therefore not disabled by the module-load guest switch. The existing bounded wait is unchanged; bridges arriving after its timeout remain outside this verification.
- Normal production web resolves to `web`; App's web gate and bootstrap's environment guard prevent anonymous sign-in. The new direct gate-render test is blocked by the mock error below, so its end-to-end assertion is not claimed passing.

## Existing test changes — names and quoted assertions
No tests deleted. Three existing cases renamed/updated; counts unchanged in both existing files.

1. `src/test/guestBrowsing.test.tsx`: `ships preview-only` → `ships on everywhere outside test mode without module-load host detection`.
   - Old: `expect(src).toContain('GUEST_BROWSING_ENABLED = guestEnabledForHost(isPreviewHost(), import.meta.env.MODE)')`.
   - New: `expect(src).toContain("GUEST_BROWSING_ENABLED = import.meta.env.MODE !== 'test'")`, plus `expect(src).not.toContain('isNativeAppSync')` and `expect(src).not.toContain('isPreviewHost()')`.
   - Why: Stage 3 changes the shipped switch and expressly prohibits module-load native gating.
2. `src/test/guestStage2.test.tsx`: `enables the switch on preview hosts only outside test mode` → `enables the switch on every host outside test mode`.
   - Old preview assertions retained: `expect(actual.guestEnabledForHost(true, 'development')).toBe(true)` and `expect(actual.guestEnabledForHost(true, 'production')).toBe(true)`.
   - New additional assertion: `expect(actual.guestEnabledForHost(false, 'production')).toBe(true)`.
   - Why: production hosts now have the switch on too.
3. Same file: `keeps production hosts and every test run off` → `enables production hosts but keeps every test run off`.
   - Old: `expect(actual.guestEnabledForHost(false, 'development')).toBe(false)`.
   - New: `expect(actual.guestEnabledForHost(false, 'development')).toBe(true)`.
   - Retained: `expect(actual.guestEnabledForHost(true, 'test')).toBe(false)`.
   - Added: `expect(actual.guestEnabledForHost(false, 'test')).toBe(false)` and `expect(actual.GUEST_BROWSING_ENABLED).toBe(false)`.
   - Why: only test mode is off, regardless of host.
   - Describe label: `Stage 2 preview` → `Stage 3 switch and preview`.

## Added tests and result
`src/test/guestStage3.test.tsx` adds exactly five cases:
1. `production mode enables the switch even before native detection` — PASS.
2. `production web renders AppDownloadGate and never attempts anonymous sign-in` — FAIL before final assertions, missing mock language.
3. `a native bridge arriving after module load opens the first launch as a Clubhouse guest` — PASS; pending makes no sign-in call, bridge resolves native, guest Clubhouse renders, exactly one anonymous sign-in.
4. `preview still opens as a Clubhouse guest` — PASS; exactly one anonymous sign-in, no bridge wait.
5. `a signed-in native member reaches Clubhouse without anonymous sign-in` — PASS. This checks launch only; broader member flows remain covered by the unchanged full suite, not a live member session.

## Commands and totals
- Targeted: `bunx vitest run src/test/guestStage3.test.tsx src/test/guestStage2.test.tsx src/test/guestBrowsing.test.tsx src/test/guestEntryPoints.test.tsx src/test/guestSessionHold.test.tsx --maxWorkers=2`: **58 passed / 1 failed / 59 total across 5 files**.
- Full: `bunx vitest run --maxWorkers=2`: **4,742 passed / 1 failed / 4,743 total across 485 files**; 484 files passed, one failed; duration 469.04s. Output: `/tmp/guest-stage3-full.log`.
- Reconciliation against **4,738 tests / 484 files**: +5 tests and +1 file, entirely `guestStage3.test.tsx`; all existing 4,738 tests pass. No pre-existing failures observed.
- Automatic preview build: **build OK**, latest observed entry `2026-10-30T22:59:01Z`.

## Exact stop
`src/test/guestStage3.test.tsx > Stage 3 launch > production web renders AppDownloadGate and never attempts anonymous sign-in`

```text
TypeError: Cannot read properties of undefined (reading 'language')
 ❯ AppDownloadGate src/pages/AppDownloadGate.tsx:143:23
    141|   const location = useLocation();
    142|   const { t, i18n } = useTranslation('common');
    143|   const locale = i18n.language || 'en';
       |                       ^
```

The new test copied the required react-i18next mock (including initReactI18next and defaultValue-only t), but that mock supplies no i18n object, while the real AppDownloadGate reads i18n.language. App code was not changed for the mock, and no mock/assertion correction was made after failure. The scoped next step requires authorization to use the real translation provider or supply language in the new test harness; production gate verification must then be rerun, followed by the full suite.

## Preview proof and limitations
Fresh Chromium at localhost, 1280×1800, opened `/` with a real anonymous session, no remaining guest hold and no page errors. Screenshot `/tmp/browser/guest-stage3/preview.png` shows Clubhouse, guest Log in/Join free and the existing locked guest card. One anonymous preview session was created. No live member sign-in, actual native first-install or real production-web check was performed. Native late-bridge and member launch checks above are controlled tests. No phone Apple sign-in was attempted; diagnostics are retained for Ben.
## Resolution — approved mock fix (2026-10-30 23:11 UTC)
Ben approved a test-only fix: the `react-i18next` mock in `src/test/guestStage3.test.tsx` now supplies `i18n: { language: 'en', changeLanguage: () => Promise.resolve() }` alongside the unchanged `initReactI18next` and defaultValue-only `t`, so the real `AppDownloadGate` renders. No app code changed.

- Old mock: `useTranslation: () => ({ t: (_k, o) => o?.defaultValue ?? '' })`
- New mock: `useTranslation: () => ({ t: (_k, o) => o?.defaultValue ?? '', i18n: { language: 'en', changeLanguage: () => Promise.resolve() } })`

## Final result
- Targeted: `bunx vitest run src/test/guestStage3.test.tsx`: **5 passed / 5**, including the previously failing production-web case.
- Full: `bunx vitest run --maxWorkers=2`: **4,743 passed / 4,743 across 485 files**, zero failures; duration 415.97s.
- Reconciliation against **4,738 / 484**: +5 tests, +1 file, entirely `guestStage3.test.tsx`; no other test changed, added or removed.

Guest browsing Stage 3 is green and ready for Ben to publish.
