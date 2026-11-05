# FIX6 sign-up and pro — implemented, suite stopped

## Implemented

1. WelcomeCropper explicitly uses contain, minZoom 1/maxZoom 4 and restrictPosition, with defensive `max-width:none;max-height:none` image CSS. Existing getCroppedImg output path/cap/quality is untouched. All four specified flows use this shared cropper. The reachable business ImageCropModal is explicitly hardened the same way, including matching slider maximum 4. The legacy ImageCropperModal UI has no production consumers of its wrapper cards and already defaults to contain; it was audited and left unchanged (its helper remains live).
2. CommentsSheetV2 and its real CommentComposer use SHEET_SURFACE. No additional header canvas paint found. One new computed-colour test passes for both surfaces: rgb(22,22,26).
3. Account doors no longer use container-type or @container; max-width:360px media query keeps the smaller 8px gap/12px label. Existing first-render AccountGlance test finds the Notifications tile and label. Physical iOS Safari/native cold-first-open reproduction was unavailable, so this is a prescribed defensive CSS change, not a verified WebKit fix.
4. One member-only OnboardingGuard wraps app routes and redirects only after profile loading finishes, only for explicit has_completed_onboarding=false, excluding guests and the brief's welcome/auth/legal/privacy/terms/delete-account paths. Existing shared profile cache/read is reused. Post-auth read errors and exceptions now lead to /welcome regardless of redirect parameter. Step 1 has no Skip; steps 2–4 retain it. Native fresh-install email-code/Apple/Google/new-email flows were not reproduced; deployed provider/settings claims are unverified.
5. Pro-details focus outline is #F8FAFC, retaining 2px/2px offset. No #F7931E remains in that stylesheet.
6. Removed pro-board promises, without changing eligibility or server notifications.

### Every changed pro string

- `src/pages/Welcome.tsx` pending subtitle: “Once we've checked, your PRO label goes live and the Rounds boards open up.” → “Once we've checked, your PRO label goes live.” Other subtitle text unchanged.
- `src/features/pro-verification/ProStatusSheet.tsx`: “Your handicap prompts and the Rounds handicap requirement come back.” → “Your handicap prompts come back.”
- `public/locales/en/courses.json`, `amateur.gate.proPendingBody`: “The boards open as soon as your pro verification is checked. Pros don't need a handicap.” → “Your PRO label goes live as soon as your pro verification is checked. Pros don't need a handicap.”

Search of src/public locale pro/verification/Welcome copy found no other matching board promises. Non-pro board copy remains. Ben's server approval notification was not edited or queried.

## Verification and stop

- Focused command: `bunx vitest run src/test/fix6SetupGuard.test.tsx src/test/fix6Cropper.test.tsx src/test/ob1Welcome.test.tsx src/test/cr1CreatorChoice.test.tsx src/test/accountDoorFit.test.tsx --maxWorkers=2`: **107/107**, five files.
- Surface command: `bunx vitest run src/test/fix6CommentsSurface.test.tsx src/test/accountDoorFit.test.tsx src/test/proStatusControls.test.tsx --maxWorkers=2`: **22/22**, three files. These overlap accountDoorFit; they are not summed into a suite total.
- Fresh shard command: `bunx vitest run --maxWorkers=2 --shard=n/4`.
- Shard 1: **1,820 passed**, 155 files.
- Shard 2: **1,663 passed, 1 failed / 1,664**, 155 files.
- Shards 3–4: **not run**, stopped at the existing CH1 failure. Executed full-suite subset: **3,483 passed, 1 failed / 3,484 tests**, 310 files; not a full-suite pass total.

Full shard output retained in `docs/verification/fix6/shard1.log` and `shard2.log`. The sole observed failure predates FIX6 and its file was not edited:

```text
FAIL src/test/ch1ChampionsTidy.test.tsx > CH1 Champions tidy > field keeps What it takes without the You link
AssertionError: expected null not to be null
❯ src/test/ch1ChampionsTidy.test.tsx:78:66
expect(subtree?.querySelector('.champions-field-panel')).not.toBeNull();
```

No isolated reruns or fixture repairs: this brief says stop on an unexpected failure; CH1 still awaits field-fixture authorisation. No new FIX6 test failures observed.

Last reported passing full-suite baseline: **6,973 / 613**. CH1 introduced **+7/+1**, giving pre-FIX6 inventory **6,980 / 614** with its known failure. FIX6 adds **+17/+3**: fix6SetupGuard (15), fix6Cropper (1), fix6CommentsSurface (1). ob1Welcome replaces one step-one Skip expansion with one no-Skip case (net 0); other case counts unchanged. Expected complete inventory: **6,997 / 617**, +24/+4 from last green baseline; it was not executed in full.

Latest preview log: **build OK, 2026-11-05T17:54:24Z**. No manual build/typecheck run.

### Browser limitation

`python3 /tmp/browser/fix6/check_crop.py` attempted the real WelcomeCropper and global preflight at 390×844 with local landscape/portrait images. It timed out before the harness became ready:

```text
playwright._impl._errors.TimeoutError: Page.wait_for_function: Timeout 30000ms exceeded.
```

Full log: `docs/verification/fix6/crop-browser.log`. No natural/computed aspect-ratio result or screenshot was produced; landscape/portrait within-1% verification remains unclaimed. This is an unavailable browser check, not a passing geometry proof. Do not substitute mocked Cropper props for natural media dimensions. Device-only menu/signup checks likewise remain unavailable.

## Every rewritten test / assertion

- `src/test/ob1Welcome.test.tsx`, **Skip on screen 1 saves completion and keeps progress** expansion: removed from `[1,2,3,4]` → `[2,3,4]`; replaced by **screen one has no Skip and cannot finish before identity**. Old: click Skip, assert completion update and `onboarding_skipped {step:1}`. New: `expect(document.querySelector('.welcome-skip')).toBeNull(); expect(f.update).not.toHaveBeenCalled();`. Reason: brief prohibits step-one Skip. Counts remain 81 before/after.
- Same file, **cropper has no slider, grid or reset and Use photo hands the file to the existing upload**: `expect(crop).toHaveAttribute('data-fit','cover')` → `...('data-fit','contain')`; all other assertions unchanged. Reason: prescribed contain fix.
- `src/test/cr1CreatorChoice.test.tsx`, **Skip never writes the toggled creator choice**: old click step-one Skip and expect `{has_completed_onboarding:true,updated_at:expect.any(String)}` → new `expect(screen.queryByRole('button',{name:'Skip'})).toBeNull(); expect(h.update).not.toHaveBeenCalled();`. Existing “no is_creator written” assertion retained. Reason: step one can no longer finish by Skip. Case name/count unchanged (8).
- `src/test/accountDoorFit.test.tsx`, **doors container queries shrink gap and label to 12px at 300px and below**: expected `.account-doors` string loses `container-type:inline-size`; query matcher changes `@container (max-width:300px)` → `@media (max-width:360px)`; adds absence checks for container-type/@container. Existing 8px gap/12px font assertions retained. Reason: prescribed first-paint mitigation. Historical case name/count unchanged (2).

No other existing tests deleted, renamed or rewritten; no existing fixture additions. New tests use local fixtures and real router/query providers where required. No CH1 assertion change in FIX6.

## Remaining tasks / boundaries

- Await CH1 field-fixture authorisation, then rerun its focused tests and fresh full suite.
- Natural image aspect ratio, iOS first-open tile paint and native fresh-install/provider signup journeys remain unverified.
- Explicit separate automated focus/pro-copy absence tests were not added before the suite stop; source audit confirms the requested strings, but additional coverage remains open.
- No SQL/migrations/deployed RPC or edge changes, feed_config/cap/native/Median edits. No guest mint behaviour changed. Crop uploads and stored WHS connections are unchanged.