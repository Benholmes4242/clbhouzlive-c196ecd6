# Roadmap

## ST4 — Settings Notifications and Friends
- [x] Share unchanged notification categories; replace only Notifications/Friends using existing push/invite actions.
- [x] Add 12 ST4 cases (all pass) and complete ST3_ST4_SETTINGS_REPORT.md; existing tests untouched.
- [ ] STOP: sheetTopV5.test.tsx:7 forbids the required Alerts label; retained assertion unchanged. Full suite timed out at600s:350 completed files,3884 passed/2 failed/3886 executed; pre-existing review hero failure remains. Expected inventory4579/466, not a full result. Await specific vocabulary-rule exception before correction/rerun.
- [ ] Live authenticated action/readback unavailable with external_unmanaged; fixture checks do not verify persistence.

## Review confirmation redesign
- [x] Shared course hero, corrected receipt contract, client media/text snapshot and signed-off receipt layout implemented; not verified complete.
- [x] Review-only suggestions and search, live upload states, measured footer and all-locale English copy implemented.
- [ ] STOP: reviewConfirmationRedesign.test.tsx:28:361 — expected 'position: relative;' to contain '196px'. 67/68 targeted pass; no assertion edits after failure. Full suite/Chromium blocked by stop. See REVIEW_CONFIRMATION_STOP_REPORT.md.

## ST3 — Settings Privacy
- [x] Replace only Privacy with live summary, sheet rows, unchanged auto-post handler and scoped blocked count.
- [x] Add 19 ST3 regressions and retarget the two obsolete EP4 Settings-handicap tests explicitly; delete ST2 report.
- [x] Full suite --maxWorkers=2: 4,547/4,547 across464; Chromium sample card/sheets at390/375 checked, no overflow; live persistence unavailable external_unmanaged. Report completed in ST3_ST4_SETTINGS_REPORT.md, including historical assertion-recovery limits.

## Awards follow-ups — Ring and widest fit
- [x] Change only the score-led ring to FEED_CARD_SURFACE; add one ring regression without changing other callers.
- [x] Chromium widest case: gross102 (+30), handicap28, net74 (+2), awards4/5/3 total12 at375px. scrollWidth375/clientWidth375; right group is61.796875px clear of net, no touching/overlap/shrinking.
- [x] Full bunx vitest run --maxWorkers=2: 4,528/4,528 across463 files, +1 from4,527/463; no failures. Build OK. See AWARDS_FOLLOWUPS_REPORT.md for changed files and limits.

## ST2 — Settings Your handicap card
- [x] Replace only the interim handicap row and move its switch out of Privacy; preserve existing handler and destinations.
- [x] Add connection-scoped earliest-round-year reader with three-state gating and 22 regressions for figures/actions/toggle; existing tests unchanged.
- [x] Full bunx vitest run --maxWorkers=2: 4,527/4,527 across 463 files, +22/+1 from 4,505/462. Automatic build OK. Real-card sample fixture verifies connected/disconnected/unknown states, switch and destinations at 390px.
- [ ] Live authenticated Settings persistence unavailable: external_unmanaged session; sample fixture is presentation-only verification.

## Round awards — Signed-off score-led card
- [x] Restore the awards figure after handicap using canonical medal counts/marks; no-awards and other card surfaces unchanged.
- [x] Added seven regressions without rewriting/removing existing cases; full bunx vitest run --maxWorkers=2: 4,505/4,505 across 462 files, +7 from 4,498/462. First foreground run timed out; uninterrupted rerun passed. Build OK.
- [x] Real ExploreCard sample-data browser fixture fits at 375/390/430px, with 17px totals, 18px/22px gaps and working tap. Authenticated live feed unavailable (external_unmanaged).

## ST1 — Settings Account, Help and end card
- [x] Reorder only the specified groups and reuse profile rows for Account/Help/end actions; preserve existing confirmations and deferred groups.
- [x] ST1 adds 19 tests, no existing cases changed; bunx vitest run --maxWorkers=2: 4,498/4,498 across 462 files, up from 4,479/461. Automatic build OK.
- [ ] Authenticated flow verification unavailable: external_unmanaged session.

## Rounds gate — Keep bottom navigation live
- [x] Diagnose actual nav layer 100 versus body-level shade/card 997/998 and absent lock expansion lease.
- [x] Use canonical Z.nav without remounting navigation; hold expansion while locked; preserve card/fade/tile geometry and behavior.
- [x] Added five locked-nav regressions without changing existing tests; full bunx vitest run: 4,407 passed / 1 failed / 4,408 total across 453 files (+5/+1 from 4,403/452).
- [ ] STOP: new roundsGateNav.test.tsx:56:17 `Error: expect(element).toBeVisible()`; Framer Motion's nav has `opacity: 0` in the fake-timer mount. No correction/rerun; no pre-existing failures. Automatic build OK09:40:16Z. Authenticated locked-page/browser check unavailable (external_unmanaged); see ROUNDS_GATE_NAV_STOP_REPORT.md.

## Review Step 1 — Photo under the notch
- [x] Key the review-composer claim to the actual header form before paint; preserve route rules, geometry and one unmount release.
- [x] Add four claim transition/step/edit cases replacing one old case; run full bunx vitest run: 4,399 passed / 4 failed / 4,403 total across 452 files (+3).
- [ ] STOP: all four reviewComposerChrome cases fail at ReviewComposerHeader.tsx:41:17: No "headerScore" export is defined on the useReviewHeaderFacts mock. No fix/rerun; no pre-existing failures. See REVIEW_PHOTO_NOTCH_STOP_REPORT.md. Signed-in device checks unavailable; automatic build OK08:45:07Z.

## Review steps — Approved three-test correction
- [x] Move unchanged safe-area heights/fold transition into stylesheet; update only authorised height/counter tests and add long-name truncation coverage.
- [x] Full bunx vitest run4,398/4,398 across451 files (+1 long-name case); all3 prior failures clear. Automatic build OK07:10:46Z, no type errors. EP5.1 test untouched (already fixed by EP5.1.1). See REVIEW_STEPS_TEST_FIX_REPORT.md.

## Review Step 2 — One screen and category average
- [x] Replace only Step 2 strip with heading counter; share half-up categories average with receipt; move share to solid fixed footer with measured bottom reserve.
- [x] Add9 cases and update3 authorised existing cases; full bunx vitest run executed.
- [ ] Phone geometry and authenticated flow remain unverified. Test/type blockers from REVIEW_STEP_TWO_ONE_SCREEN_STOP_REPORT.md cleared by EP5.1.1 and approved review correction (4,398/4,398, build OK); external unmanaged session prevents authenticated checking.

## Review Step 1 — Photo header Option A
- [x] Straight-cut safe-area photograph; course name/score below; preserve compact header and sticky fold, measured spacer; empty lede/words gaps 14/18.
- [ ] Signed-in visual unavailable (external_unmanaged). Test/type blockers from REVIEW_STEP_ONE_HEADER_STOP_REPORT.md cleared by EP5.1.1 and approved review correction (4,398/4,398, build OK); ob1Welcome also passes.

## EP5.1 — Edit profile snags and white cursors
- [x] Correct avatar framing, top/bottom safe-area spacing and scoped shared mute labels; visual checks not completed after stop.
- [x] Extract stable content-height search shell; club-only autofocus/keyboard docking, canonical confirmation/save/request paths and direct editor entrypoints. Review tests and retained browser regression unchanged/passing.
- [x] Sweep amber/undefined carets; targeted91/91 and full bunx vitest run4,386/4,386 across451 files (+8 new ep51SearchAndCarets tests).
- [ ] STOP: automatic typecheck src/test/ep51SearchAndCarets.test.tsx(20,551): TS2769, "Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'." No correction or rerun after stop. No pre-existing failures. See EP5_1_STOP_REPORT.md; signed-in/native keyboard and remaining visual checks unavailable/unperformed.

## Review a course — Content height, max 85dvh
- [x] Remove fullHeight; short lists fit content and long lists scroll beneath pinned header/search at 85dvh.
- [x] Hold first-character content height until clear/close; keyboard handling unchanged.
- [x] Full bunx vitest run 4,378/4,378 across 450 files (+2 solely reviewCourseSearch.test.tsx); no existing cases/assertions changed. Retained browser regression passes: 349px short sheet, 668.09px capped sheet at 430×786. Automatic build OK06:18:59Z. See REVIEW_COURSE_SEARCH_HEIGHT_REPORT.md; authenticated entrypoint/native keyboard unverified (external_unmanaged).

## EP4.1 + EP5 — Completion card and switch-over
- [x] Complete only EP4's useDeleteAccount mock; Part 1 full suite 4,340/4,340 across 449 files, no assertion changes.
- [x] Add settled-input completion card, action chips and arrival deep links.
- [x] Switch the canonical editor, preserve alias queries/back/entrypoints, and update route comments; remove redundant onboarding nav special case.
- [x] Add 36 EP5 tests; full suite 4,376/4,376 across 450 files. Automatic build OK06:03:24Z; alias/Settings shell and hidden nav checked publicly, no runtime errors. Real signed-in actions/persistence and populated visual match remain unverified (external_unmanaged). See EP4_1_EP5_REPORT.md.

## EP4 — Links and Who sees what
- [x] Add signed-off link sheets and visibility groups below Your golf, preserving Settings and legacy editor.
- [x] Reuse existing validation/normalisation, partial saves and handicap privacy hook; add 26 isolation/sync cases.
- [x] Full bunx vitest run: 4,339 passed / 1 failed / 4,340 total / 449 files (+26/+1 solely EP4); existing tests unchanged. Automatic build OK05:42:32Z.
- [x] EP4.1 authorised full useDeleteAccount mock clears the settings-handicap / ownedBusinessNames failure; bidirectional test passes unchanged. Historical error preserved in EP4_REPORT.md.

## Review Step 2 — The score
- [x] Match signed-off empty overall/rulers/category states/share and footer; preserve compact/shared headers and Step 1.
- [x] Remove implicit score confirmation and exclusive skip event/copy; add incomplete nudges and 31 required-score/interaction cases.
- [x] Full bunx vitest run: 4,303 passed / 11 known EP1 failures / 4,314 total / 448 files (+31/+1). Existing review cases retargeted by brief, no removals; REVIEW_STEP_TWO_REPORT.md records each assertion.
- [x] Approved helper type-only correction EventTarget → Element | Window; automatic build OK05:28:23Z and full reruns4,314/4,314 across448 files. No assertions/cases changed. Signed-in/visual checks unavailable/unperformed.

## EP3 — Edit profile Your golf
- [x] Add five golf rows and signed-off handicap/home/other-club sheets with isolated saves and unchanged visibility.
- [x] Reuse coach sheets and profile Top 10 editor; new EP3 tests 27/27, preview build OK.
- [x] EP3.1 authorised EP1 QueryClientProvider/golf-read mocks; all14 EP1 tests pass without assertion changes. Full suite4,314/4,314 across448 files; prior11 provider failures resolved. See EP3_1_REPORT.md in Files.

## Post or review sheet
- [x] Replace the numbered kind/course/NEXT form with signed-off Post and Review boxes and direct picker/handoff actions.
- [x] Add member-scoped paginated review suggestions without round reads; update displayed composer counters, locales and analytics label.
- [x] Full `bunx vitest run`: 4,182 passed / 2 pre-existing failures / 4,184 total across 441 files. +36 tests: postOrReviewSheet 15, reviewSuggestions 21; one postPhase3 counter assertion updated, no cases removed.
- [x] Follow-up corrected both test setup options to initAsync and typed the existing nav textBox extension without assertion/style changes. Automatic build 21:38:07Z OK; targeted 45/45. Full suite unchanged: 4,182 passed / 2 inherited failures / 4,184 total / 441 files.
- [ ] Existing BC5 TypeError and POST/REVIEW text-box assertion still fail; their tests remain untouched. See POST_OR_REVIEW_SHEET_REPORT.md. Authenticated/visual checks not performed after stop.

## BC5 — Create business and finish
- [x] Ben approved recording returned-empty photo failures as partials in both shared callers; editor uses its existing warning toast.
- [x] Extract shared creation/error reporting/owner notice, preserve editor toasts and edit writes; approved photo-failure recording added.
- [x] Add creating, saved finish/partials/claim actions, canonical route/alias and dirty departure guard. Retarget superseded BC1/BC4 expectations; BC2/BC3 unedited.
- [x] Full `bunx vitest run`: 4,146 passed / 2 failed / 4,148 total across 439 files, +36 cases/+3 files from 4,112/436. New tests: bc5CreateBusiness 13, bc5BusinessFinish 14, bc5BusinessFlow 9.
- [ ] STOP: new bc5BusinessFlow.test.tsx:38 case reaches BusinessCreate.tsx:64:19 `TypeError: Cannot read properties of undefined (reading 'then')`; mock fetchClub returned undefined. No corrections/reruns. Existing postReviewTab.test.tsx:38:55 failure and GlobalBottomNavigation.tsx(44,21) TS2353 remain. BC5_REPORT.md records full inventory. Authenticated real creation and visual checks unavailable/unperformed; external_unmanaged.

## POST / REVIEW — Centred option B
- [x] Apply cap-trimmed words, cropped 14×11.9 arrows and centred 3.5px gaps; preserve other tabs and behaviour.
- [x] Full `bunx vitest run`: 4,111 passed / 1 failed / 4,112 total across 436 files; inventory unchanged. Known ob1Welcome flake passes all 74 tests untouched.
- [ ] STOP: postReviewTab.test.tsx:38:55 expected text-box 'trim-both cap alphabetic', received ''. Automatic typecheck: GlobalBottomNavigation.tsx(44,21) TS2353, textBox absent from React.CSSProperties. No corrections/reruns after failure; rendered gaps unavailable. See POST_REVIEW_CENTRED_REPORT.md.

## Rounds gate — Look, then lock (DONE)
- [x] Approved follow-up: scroll distance now starts at mount; isolated scrollers and repaired React remount fixture. Targeted four gate files 43/43; full suite 4,111 passed / 1 failed / 4,112 total across 436 files (+2 restored-position cases). No other test edited.
- [x] Replace cropped gate with visit-local scroll/timer lock and signed-off glass card/tile; preserve state, reads and page sections. Ben confirmed CB39 scope switch/test remain unchanged.
- [x] Audit score/index blur attributes and run `bunx vitest run`: 4,107 passed / 3 failed / 4,110 total across 436 files; +24 new look-lock cases and +1 analytics case from 4,085/435. Predicate and CB39 tests pass unchanged.
- [x] Approved correction clears all three prior gate failures in targeted and full runs; historical errors/inventory remain in ROUNDS_GATE_LOOK_LOCK_REPORT.md.
- [x] CLOSED AS DONE (Ben, 2026-10-28): gate work complete. The single ob1Welcome failure (src/test/ob1Welcome.test.tsx:109:980 upload spy) is a known flake — it passed in the previous full run, passes in isolation, and this build touched none of its files. Test not edited here; it belongs to the onboarding workstream. See ROUNDS_GATE_FIX_REPORT.md and ROUNDS_GATE_LOOK_LOCK_REPORT.md.
- [x] Automatic build 20:36:24Z build OK; earlier missing glimpseFits diagnostic superseded. Authenticated visual checks unavailable (external_unmanaged); browser checks not attempted after stop.

## BC4 — Create a business profile appearance
- [x] Reconcile step 3 with panels 3A–3E: chips, sheet grabber, phone chip, hours helper/time pairs/day sizing/switches and fixed footer.
- [x] Add draft-only step 4, shared cropper options, image actions and history-preserved finish.
- [x] Full `bunx vitest run`: 4,082/4,082 across 434 files; +22/+1 solely bc4BusinessCreate.test.tsx. All existing tests untouched; inherited ob1Welcome upload test passes unchanged.
- [x] BC4.1 resolved the fixture-only TS2739 stop: added club_key 'park', latitude 51.4, longitude 0.03 on line 44; no other test changes. Automatic type/build check 2026-10-28T18:58:39Z build OK; `bunx vitest run` 4,082/4,082 across 434 files, unchanged count, zero failures. BC4_1_REPORT.md records the one-line diff and results. Authenticated visual verification remains unavailable (external_unmanaged).

## One neutral floating-glass material
- [x] Share card/backdrop/island tokens across the specified glances, scorecard and review; update badge edges only.
- [x] Audit other old glass values without changing them; full `bunx vitest run`: 4,059 passed / 1 failed / 4,060 tests across 433 files, unchanged inventory from 4,060/433 baseline. No tests edited, added, removed or renamed. Automatic build 18:18:13Z OK.
- [ ] STOP: src/test/ob1Welcome.test.tsx:109:980, “cropper has no slider, grid or reset and Use photo hands the file to the existing upload”: `AssertionError: expected "spy" to be called with arguments: [ 'profilePhotoBlob', Any<File> ]` / `Number of calls: 0`. No corrections or reruns after failure; no known pre-existing failures at baseline. Authenticated visual checks not performed after stop. See Neutral_glass_report.md in Files.

## Signed-off account tile
- [x] Replace mobile avatar sheet with AccountGlance and shared modal lifecycle; preserve desktop dropdown and close-first actions.
- [x] Removed exclusive sheet components; retained shared readers/course analytics. Full `bunx vitest run`: 3,999 passed/5 new failures/4,004 executed across429 files; baseline4,007 −28 retired cases +25 new cases. ACCOUNT_TILE_STOP_REPORT.md quotes removed assertions and exact errors.
- [ ] STOP: five new exact accessible-name queries fail because the real avatar fallback prefixes `?`; no corrections after failure. Await authorization for new test-query corrections. Authenticated real-account/visual checks unavailable (external_unmanaged); latest automatic build16:00:30Z OK.

## Logo island Option B tidy-up
- [x] No disc, 30px mark, signed-off rest/scrolled spacing and 20px wordmark slot; 1.5px avatar ring; system-font glances; plain shared-style Connect CTA.
- [ ] Replace SVG with exact 192×60 PNG and verify PNG src: supplied uploads contain no standalone PNG, and the new HTML embeds only the old SVG wordmark. Existing SVG retained rather than breaking/substituting artwork.
- [x] Full `bunx vitest run`: 4,007/4,007 across 429 files; +2/+1 solely SquircleAvatar.ringWidth.test.tsx. Two existing island cases updated by brief authority, no deletions/renames. LOGO_ISLAND_OPTION_B_REPORT.md names every changed file and PNG blocker. Signed-in visual checks unavailable (external_unmanaged); automatic diagnostic mount inaccessible.

## Islands round 2
- [x] Restored exact prior bottom nav; squircle avatar; shared connected/disconnected glance and decline; local-time test correction.
- [x] Wordmark landed: Ben supplied the exact artwork as clbhouz_white_transparent.svg; uploaded as src/assets/clbhouz-wordmark-white.svg.asset.json. Registry scrolledTitle→scrolledWordmark on '/' and '/clubhouse'; LeftCapsule shows the mark + wordmark img (height 16, alt clbhouz, 180ms fade, maxWidth collapse, grown padding 0 15px 0 6px). New wordmark-only test; targeted 27/27; full suite 4,005/4,005 across 428 files.
- [x] Targeted87/87; full suite twice4004/4004 across428 files including Europe/London; report in ISLANDS_ROUND2_REPORT.md. Live member preview unavailable: external_unmanaged, public browser redirects /auth with no errors.

## OB1 — Five-screen first sign-in
- [x] Built five-screen /welcome, existing-source adapters, partial saves, old-entry redirects and separate coach card; no gallery code/test edits.
- [ ] STOP: OB1 tests36 passed/3 failed/39; full `bunx vitest run`3,907 passed/4 failed/3,911 across421 files. Outside OB1/gallery3,832/3,832 passed. New failures ob1Welcome.test.tsx:50:322 save spy0 calls; :65:311 skipped expected step3 but empty fixture advanced4; :71:295 completion event absent. No corrections after stop; OB1_STOP_REPORT.md names exact errors, retained branches, APIs and39-case inventory. Before3,872/420; +39/+1 solely OB1. Additional first-look gate coverage awaits stop resolution.
- [ ] Course tile uses existing live catalogue count or “Every course”; no fixed snapshot. Verify usable screens where authentication permits; report external-unmanaged live-check limit.

## Course gallery — signed-off viewer
- [ ] STOP after authorized component correction: eligible tagger header/strip posters bypass processing; gallery cards retain readiness. Full `bunx vitest run`:3,871 passed/1 failed/3,872 total across420 files (+1 courseGallery regression). Unchanged holeMediaTidy9/9 passes. New courseGallery.test.tsx:53:95: `AssertionError: expected [] to deeply equal [ '/poster.jpg', '/poster.jpg' ]` because overlay is portalled outside render container. Surviving type error courseGallery.test.tsx(50,40): `error TS2322: Type '{ url: string; mediaType: string; posterUrl: string; streamId: string; }' is not assignable to type 'TagShot'.` No correction/rerun; stop report retained.
- [x] Added canonical gallery mode/chrome, shared catalogue order, grid/info, same-shot tagging and ready-thumbnail paths.
- [x] Routed Media entries/deep links to gallery; removed inline panel and obsolete focus/scroll state; added39 cases and authorized retarget inventory.
- [ ] STOP: full `bunx vitest run` 3,870 passed/1 failed/3,871 total across420 files. `holeMediaTidy.test.tsx:53:19`: `TestingLibraryElementError: Unable to find an element with the alt text: Current video`. Await explicit ruling; no correction or rerun after stop. Before3,832/419; delta+39/+1 solely courseGallery.test.tsx; no deletions/pre-existing failures. Automatic build OK09:32:24Z. COURSE_GALLERY_STOP_REPORT.md contains exact assertion and old/new inventory.
- [ ] Authenticated real gallery/tagging and mock-match visual checks unavailable with external_unmanaged authentication; not attempted after test stop. No protected SQL/backend/config/cap/native changes.

## CB118.2 — Correct loading watcher and isolate Media timeouts
- [x] Watch only non-club tablist, business card roots and non-club Visiting variant; all assertions and accepted loading gate unchanged. Exact marker/old-new selector inventory in CB118_2_REPORT.md.
- [x] Five Media files and all six timeout cases pass in isolation; business59/59. Single full bunx vitest run3,816/3,816 across418 files, zero failures, no test count delta. Media code/timeouts/Hole7 test unchanged; delete prior Media stop report after preserving historical inventory.

## Media v3 — Glass modal accessibility finish
- [x] Hide background with aria-hidden hideOthers while an overlay card is open/mounted; undo on close/unmount; appearance, focus and gestures unchanged.
- [x] Unchanged admin Hole7 selector and both unchanged CB107 cases pass; four new shared-overlay lifecycle tests pass. Complete bunx vitest run:3,815 passed/1 pre-existing CB118.1 failure/3,816 total/418 files. Delta vs3,808/417 is four intervening CB118.1 tests plus four new accessibility tests/new file. No existing tests edited. MEDIA_V3_ACCESSIBILITY_REPORT.md records diff and results.
- [x] CB118.2 authorized correction of the watcher; full green3,816/418 confirmed. Historical Media inventory preserved in CB118_2_REPORT.md before deleting MEDIA_V3_STOP_REPORT.md.

## CB118.1 — Club identity during course loading
- [x] Added two-line existing-skeleton gate on pending club-courses; query/hooks/error fallback/non-clubs unchanged. Both CB107 failures now pass UNEDITED in targeted/full runs; automatic build07:36:05Z OK.
- [x] Added four regression tests in cb118BusinessVisiting (33→37); no old assertion/name changes or removals. Targeted58 passed/1 failed/59; full bunx vitest run3,804 passed/8 failed/3,812 total/417 files, +4 solely CB118.1. CB118_1_STOP_REPORT.md records diff, all errors and inventory.
- [x] CB118.2 corrected the authorized watcher without changing assertions; business tests green. Historical Media Hole7 failure resolved by preceding accessibility fix; six Media-owned load timeouts pass in isolation and full run unchanged.

## Media tab round 3
- [x] Applied page order, Everything controls, 128×164 place rail and picker titles; shared option B glass card and existing admin place RPCs with queue/place/hole refresh. No protected backend/config changes.
- [x] Added19 mediaV3 tests, retargeted superseded presentation checks with inventory in MEDIA_V3_STOP_REPORT.md; deleted MEDIA_TAB_FINAL_REPORT.md. Full bunx vitest run3,805 passed/3 failed/3,808 total across417 files =3,734/414 +CB11722/1 +CB11833/1 +MediaV319/1. Automatic build07:26:48Z OK.
- [ ] STOP: new adminHoleTagging.test.tsx:127:85 `TestingLibraryElementError: Found multiple elements with the role "button" and name "Hole 7"`; document lookup sees background and glass grids. No correction after failure. Two pre-existing CB107 failures:257:107 and273:43 remain; no visual/authenticated flow verification after stop. Await authorization to resolve new failure and separately owned CB107 failures.

## CB118 — Visiting or Contact for non-club businesses
- [x] Generalised ClubVisiting with opt-in non-club rows and shared hero booking callback; inserted after mentions, tabs retained. Added 33 CB118 tests and only user-authorized CB107/CB112 corrections.
- [ ] STOP: protected cb107ClubVisiting.test.tsx:257:107 `AssertionError: expected false to be true // Object.is equality`; :273:43 `AssertionError: expected <div role="tablist" …(3)>…(3)</div> to be null`. New card resolves fixture waits before club-course query settles; no correction after stop. Await authorization for protected wait correction.
- [x] Full bunx vitest run 3,787 passed/2 new failures/3,789 total across416 files, +33/+1 from3,756/415 solely CB118. No pre-existing failures; Media stays green. Latest automatic build06:56:55Z OK. CB118_REPORT.md records diff and all five approved existing-test changes; no removals. Authenticated/visual checks unavailable external_unmanaged; protected backend/config/native scope untouched.

## CB117 — Mentioned by golfers
- [x] Added non-club rail after followers, owner/admin hide/show sheet, server-only qualification and read-error omission; both RPCs exist and deny anon with401/42501 permission denied (signed-in checks unavailable external_unmanaged). Existing post route /post/:postId. No app scope beyond non-club insertion.
- [x] Added22 tests in cb117BusinessMentions.test.tsx; no existing tests changed/deleted/renamed. Full bunx vitest run3,756/3,756 across415 files (+22/+1 from3,734/414), zero failures. Build OK21:39:19Z. Both earlier coursePlaceTagging failures already resolved and remain green. Diff/inventory/limitations in CB117_REPORT.md; authenticated visual and real hide/show readback unavailable.

## Course Media tab — signed-off rail and place tags
- [x] Final follow-up: exact approved insert/delete mock and three requested coach-line test mocks applied; all assertions unchanged, no app changes. Full bunx vitest run3,734/3,734 across414 files, zero failures. Delta+3 vs3,731 solely intervening CB116.1; no new tests this turn. Both obsolete Media reports consolidated into MEDIA_TAB_FINAL_REPORT.md and removed after green.
- [x] Partial top/header, sparse hole coverage rail, ready-cover fallback, place tiles and combined tag identity implemented; existing panel, hole RPCs and admin component unchanged. Place order follows places.ts by Ben's ruling; mock tile order is illustrative.
- [x] Added independent owner-source place hook and canonical credited viewer mapping; course_place_media already exists in generated types; no generated types or SQL touched.
- [x] Ruling received21:11UTC: both member taggers select then primary-submit; Skip closes single, advances batch and closes after last. Opening/errors preserved; admin remains hole-only. Nine-place order unchanged; every new Media t call gets English defaultValue.
- [x] Added shared member hole/place choice, select-primary/Skip, place callbacks/preselect/removal, no-hole-list place sources/taggers, analytics and English defaults; admin hole-only behavior retained. Added11 tests in coursePlaceTagging.test.tsx. Explicit old Media failures corrected; final suite passes both.
- [x] Earlier place invalidation stop resolved by exact approved mock-chain repair; both mutation tests now pass unchanged. Inventory preserved in MEDIA_TAB_FINAL_REPORT.md.
- [x] Earlier autoplay lookup stop resolved by previous Media ruling; final full suite passes pause/Close behavior.
- [x] Earlier video-count selector stop resolved by previous Media ruling; final full suite passes video-only hole behavior. Historical inventory preserved in MEDIA_TAB_FINAL_REPORT.md. Authenticated visual/persistence checks remain unverified (external_unmanaged); this follow-up is test-only.

## CB116 — Naming a coach
- [x] CB116.1: refusal now swaps to connect without close/toast/invalidation; ProfilePageV2 passes coachLine to the standalone hero. Three regression tests added; no existing tests changed/removed. Full bunx vitest run3,732 passed/2 failed/3,734 across414 files (+3 from3,731);44 coach cases and all original hero tests pass. Only the two pre-existing coursePlaceTagging invalidation failures remain untouched; older named Media failures pass. Build OK21:26:13Z. Detailed diff/counts in CB116_1_REPORT.md; full green blocked by separately owned Media failures.
- [x] Signed-in prerequisite waived by Ben 21:01 UTC; Ben confirms COACH_LINKS_V1 checks and scratch-tested seven-function shapes. No agent SQL or hosted-verification claim. Read errors hide the whole dependent card/line; connect route /manage/handicap.
- [x] Implemented shared coach reads/writes, invitation/name/connect/manage/find sheets, You card sentences, personal hero line, team/public results and coach hero strip. No hosted writes/SQL/config changes.
- [x] Added41 tests in cb116NameCoach.test.tsx; no existing test changes/removals. Targeted40 passing/1 failing; full bunx vitest run3,693 passing/27 failing/3,720 total across413 files (+41/+1 from previous3,679/412; +9 earlier Media tests from last green3,670/411).
- [x] Earlier CB116 refusal and24 hero failures resolved by CB116.1; final suite3,734/3,734 now also clears separately owned Media failures. Historical CB116_STOP_REPORT.md retained; no authenticated visual verification claimed.

## CB110 — Club review links and course Reviews landing
- [x] Updated club links; CourseReviewsTab lands below measured sticky tabs through scrollElementIntoView. CourseDetailPage resets only on course entry, not landing-query cleanup. Public live 404×970 verified row top 48.14px / tabs bottom 48px, at consumed, no runtime errors; signed-in checks unavailable (external_unmanaged).
- [x] Only old-page importer was App; replaced lazy/page route with CourseReviewsRedirect and deleted CourseReviewsPage.tsx. No direct old-page tests/importers remained. Preserves review/highlight parameters.
- [x] Three CB106 link cases retargeted/renamed; new cb110CourseReviewsLanding.test.tsx adds 12 cases. Targeted bunx vitest run src/test/cb110CourseReviewsLanding.test.tsx src/test/cb106ClubWhatGolfersSay.test.tsx src/test/reviewCourseNoReopen.test.tsx:44/44. Baseline3,514/401 →3,526/402 (+12 solely new file). Initial bunx vitest run3,526/3,526; final run3,525 passed/1 failed/3,526 across402 files. Build OK13:58:16Z; separate typecheck not run (harness only).
- [ ] STOP: final full suite unexpected src/test/cb74TeamFixes.test.tsx:164:88, “CB74 invite membership guard > non-member redirects with replace and never renders the form”: `AssertionError: expected [] to have a length of 1 but got +0`. No edits or retests after failure. No pre-existing failing cases at start; this unchanged unrelated test passed in first full run. Requires a ruling before further investigation/correction.

## CB109 — Media-first in every post feed
- [x] Applied caller layouts and shared review/footer slots; standard, rounds, grids and viewers unchanged. Two-line clamp per Ben's ruling. All five new rendered review-flow checks pass; no existing test retargeted.
- [x] Ran targeted `bunx vitest run src/test/cb109MediaFirstEverywhere.test.tsx src/test/cb108ClubFeed.test.tsx src/test/reviewPostCard.test.tsx src/test/feedActionsRight.test.tsx`: 33 passed / 4 failed / 37. Full `bunx vitest run`: 3,506 passed / 4 failed / 3,510 across 400 files; baseline 3,501/399 +9 new cases/one file. Existing 3,501 tests pass; no pre-existing failures. Latest automatic build log build OK 13:19:16Z.
- [ ] STOP: four new source-reading cases fail at src/test/cb109MediaFirstEverywhere.test.tsx:34:34: `Error: ENOENT: no such file or directory, open '/dev-server/src/test/undefined'`. No source/test corrections after failure. Caller-default, personal/business and out-of-scope checks await explicit correction authorisation. Signed-in visual verification unavailable (external_unmanaged).
- [x] Caller/diff/test report supplied; no backend/config/native changes.

## Narrow ReviewScoreRow card labels
- [x] Added full-row inline-size query wrapper and scoped 400px/330px overrides; default grid, caption and null behavior retained. Existing tests unchanged; three query-rule tests added to reviewScoreRow.test.tsx.
- [x] Targeted `bunx vitest run src/test/reviewScoreRow.test.tsx`: 15/15. Full `bunx vitest run`: 3,480 passed / 2 failed / 3,482 total across 397 files. Latest baseline 3,479/397 +3 new query-rule cases; user's 3,438/395 +CB106 22/1 +CB107 19/1 +this 3/0 =3,482/397. No existing test renamed/retargeted/deleted.
- [ ] STOP: new wrapper breaks sibling assertions: reviewSheetCalibration.test.tsx:122:51 “no bars and no ticks at 1 rating(s); the first-rating note follows the row only at one”: `AssertionError: expected null to be <div …(2)></div> // Object.is equality`; reviewsState2.test.tsx:61:59 “overall score has one home, the score row directly under the rater row”: `AssertionError: expected false to be true // Object.is equality`. No changes after failure; rendered narrow-width verification not run.
- [ ] Pre-existing CB107 type errors remain at cb107ClubVisiting.test.tsx(190,72), (263,64), (265,58): `error TS2769: No overload matches this call. The last overload gave the following error. Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.` Unrelated tests untouched; preview not build-clean.

## CB107 — Club Visiting
- [x] Added club-only Visiting after What golfers say, shared hours keys/formatOpeningHours in src/lib/business/openingHours.ts and SOCIAL_CONFIG in src/lib/business/socialLinks.ts (also re-exported by BusinessProfileInfo); non-club hours keep the spaced hyphen. Resolved mock choices: week -2px top; Visiting en dash.
- [x] Removed club contact rows/About tab and hid the single-tab bar. Added 19 cases in cb107ClubVisiting.test.tsx; existing tests unchanged. Audited CB103.1 “club with a promoted book action shows no Book button” and “non-club promoted book still works”, both unchanged and passing; no old About/tab-bar assertion found.
- [x] Targeted `bunx vitest run src/test/cb107ClubVisiting.test.tsx src/test/cb103ClubHero.test.tsx`: 43/43. Full `bunx vitest run`: 3,479/3,479 across 397 files, baseline 3,460/396 +19/+1 solely new file; no pre-existing failures.
- [ ] STOP: harness 2026-10-27T11:35:17Z reports src/test/cb107ClubVisiting.test.tsx(190,72), (263,64), (265,58): error TS2769: No overload matches this call. The last overload gave the following error. Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'. No correction after completed-edit stop; preview not verified. Live signed-in check unavailable (external_unmanaged); controlled screenshot harness also failed with React refresh preamble missing, no screenshots/visual-match claim.

## CB104.1 — Club "You and {club}" title letter-spacing — 09:23 brief
- [x] `.club-you-title` letter-spacing changed 0 → -0.01em in src/index.css:42; no other rule touched. Added cb104ClubYou.test.tsx case "title carries -0.01em letter-spacing" reading the rule from src/index.css (file 29 → 30 cases); AGENTS.md gained one line ruling the Tour-plan zero-spacing note Tour-only.
- [x] Targeted `bunx vitest run src/test/cb104ClubYou.test.tsx`: 30/30. Full `bunx vitest run`: 3,413 passed / 1 failed / 3,414 total, 392 passed / 1 failed / 393 files; +1 case is the new title test. Sole failure is the inherited ratings-white signature assertion (profileCoursesSignature.test.tsx:86:16). Build OK.

## Ratings-white follow-up — 09:07 brief
- [x] Confirmed globalAchievementMilestoneSystem.ts already has one top-level A import; app code unchanged. Renamed and strengthened only the two authorised rating cases with direct A.INK expectations and null helper checks; LatestReviews also checks all three figures and omitted null row. No cases added/deleted; baseline 3,413/393.
- [ ] STOP: targeted `bunx vitest run src/test/profileCoursesSignature.test.tsx src/components/explore-tab-new/courseled/__tests__/LatestReviews.test.tsx`: 19 passed / 1 failed / 20 total. Full `bunx vitest run`: 3,412 passed / 1 failed / 3,413 total, 392 passed / 1 failed / 393 files. src/test/profileCoursesSignature.test.tsx:86:16: `TypeError: Cannot read properties of null (reading 'style')` at the added `expect(fig('clubhouse').style.color).toBe(norm(A.MUTE))`. Null category has no matching figure; no correction after failure. LatestReviews 12/12. No pre-existing failures; no protected changes. Await explicit test-selector correction authorisation.

## Final photography-rating correction
- [x] Restored PHOTO_WHITE in the two specified ExploreCard photo-chip sites; removed CourseShelf figureTone override. ExploreCard retains its helper import for two other existing consumers.
- [x] Renamed/retargeted only the authorised courseRatingConsistency photography case; retained both comment checks. Audit found no other colour expectations to retarget; exploreHeroCard.test.tsx unchanged, 30/30 passing. Full `bunx vitest run`: 3,413/3,413 across 393 files, unchanged inventory, zero failures. Build OK at 2026-10-27T09:00:42Z; ExploreCard module HTTP 200. All inherited ratings blockers below resolved; CB104's independent data-definition/sign-in verification remains unavailable.

## Finish all-white ratings — three authorised corrections
- [x] Removed only the two duplicate A imports; source scan found no other duplicates. Applied exact signature/bar colour assertions and test renames, retaining other assertions.
- [x] Preview build log: build OK (2026-10-27T08:51:23Z); changed source module HTTP 200. Both corrected test files pass: signature 8/8 and LatestReviews 12/12.
- [ ] STOP: full `bunx vitest run`: 3,412 passed / 1 failed / 3,413 executed, 392 passed / 1 failed / 393 files. Inventory unchanged from intervening CB104 (3,384/392 + 29 cases/one file); zero tests added/deleted. Newly exposed failure src/test/exploreHeroCard.test.tsx:185:95: `AssertionError: expected 'rgb(248, 250, 252)' to be 'rgb(255, 255, 255)' // Object.is equality`. Previously blocked collection hid this case. No further corrections; the three authorised inherited blockers are resolved.

## CB104 — Club profile: You and the club
- [x] Founder chose mock arrangement: small uppercase club kicker and larger rounds/best sentences. Added keyed per-course collectors reusing stats/circle hooks, merged followed golfers and nation-valued place filtering; shared activity-name helper re-export preserves Insights consumers.
- [x] Added cb104ClubYou.test.tsx: 29/29, including four place-line cases. Existing tests unchanged. `bunx vitest run src/test/cb104ClubYou.test.tsx src/test/cb103ClubHero.test.tsx src/test/cb99InsightsCourse.test.tsx`: 78/78 across 3 files.
- [ ] Full verification blocked by inherited all-white failures: `bunx vitest run`: 3,253 passed / 2 failed / 3,255 executed, 377 passed / 16 failed / 393 total files; +29/+1 from prior executed 3,226/392, solely cb104ClubYou.test.tsx. Candidate inventory 3,413/393, not successfully collected. Same 14 duplicate-import collection failures and two colour assertions; no new failures. Build still reports globalAchievementMilestoneSystem.ts(55,10),(333,10),(445,10): `error TS2300: Duplicate identifier 'A'.` No out-of-scope corrections made.
- [ ] your_rounds/your_best RPC definition absent locally: hole count, gross basis and window cannot be verified without Ben's authoritative definition. Existing fields used unchanged. Screenshot shows inherited compiler overlay, not club card; live signed-in verification also unavailable (external_unmanaged). Report in Files.

## All-white course and review ratings — 27 October 2026
- [ ] Apply colours-only ruling across helpers, local displays and wizard; preserve null dim states and non-rating colours.
- [ ] Update authorised colour assertions, add two helper cases, audit deliberate remaining hits and report full-suite counts.
- [x] Affected tests: 120/120 across 11 files. Added exactly two helper cases in ratingsWhite.test.ts; no deletions. Full `bunx vitest run`: 3,224 passed / 2 failed / 3,226 executed, 376 passed / 16 failed / 392 total files. Candidate inventory 3,384/392 = prior 3,378/390 + unchanged CB104 four cases/one file + this task two cases/one file; 14 collection failures prevent verifying that full count.
- [ ] STOP: globalAchievementMilestoneSystem.ts(55,10),(333,10),(445,10): `error TS2300: Duplicate identifier 'A'.` profileCoursesSignature.test.tsx:81:39: `AssertionError: expected '#F8FAFC' not to be '#F8FAFC' // Object.is equality`. LatestReviews.test.tsx:208:43: `AssertionError: expected 'rgb(248, 250, 252)' to be 'rgba(248, 250, 252, 0.62)' // Object.is equality`. No corrections after failure; full report in Files. No pre-existing failures; live signed-in check unavailable (external_unmanaged).

## CB102.1 — Welcome gutters and Driving Range facilities
- [x] Corrected ruling: apply only welcome outer padding 4px 0 0 and wrapper pb-7; preserve opening inset 6px 2px 22px and shared ManagePageShell. Code-derived kicker left 34→18px, header gap 42→26px; cards left 32→16px. Device measurements waived; original bottom target withdrawn.
- [x] Give Driving Range the exact dedicated facilities list; preserve COACHING and every other category.
- [x] `bunx vitest run src/test/cb102BusinessWelcome.test.tsx`: 9/9. `bunx vitest run`: 3,348/3,348 across 388 files, zero failures, from 3,347/388 (+1 solely “Driving Range has its own facilities list”). Existing tests unchanged. Brief's 3,346 expectation predates the two tagging follow-up cases.
- [x] After approved spacing edits, both commands rerun: welcome 9/9; full 3,348/3,348 across 388 files, zero failures and unchanged inventory. No pre-existing failures.

## Review media tray — Add tile leads the strip
- [x] Moved the one Add control ahead of items.map in MediaTray.tsx so the 72px square sits at the strip's front once anything is picked; empty tray keeps the full-width row, ceiling/disabled still hide it, item order and tile contents unchanged.
- [x] `bunx vitest run src/test/mediaTrayAddTileFirst.test.tsx`: 4/4; review-v2 group (`src/features/review-v2` + reviewUploadProgress + reviewComposerChrome): 43/43. Full `bunx vitest run`: 3,332/3,332 across 387 files, from 3,328/386 (+4/+1 solely the new file); no existing test changed. Automatic build OK 19:52:47Z. Signed-in/phone visual check unavailable (external_unmanaged).

## Restore Stream uploads and cleanup
- [ ] Credential blocker: earlier My Cloudflare API connection is linked but gateway-only; CLOUDFLARE_STREAM_API_TOKEN absent from secret listing. CLOUDFLARE_API_TOKEN exists; awaiting confirmation that it is the supplied Stream token. No secret values read or copied.
- [ ] Restore direct API calls in the two specified functions, preserving validation and ownership; bump versions and deploy.
- [ ] Verify signed-in upload creation with a redacted response; run full suite against baseline 3,328 tests / 386 files.
- [x] Before function changes, bunx vitest run: 3,328/3,328 across 386 files, unchanged baseline; no failures and no test edits. Neither function edited or deployed while credential identity is unresolved.

## Review wizard notch canvas
- [x] Claim review chrome through the existing overlay API on wizard mount; release on unmount. Overlay wrapper uses RV2.canvas; other chrome and tokens unchanged.
- [x] `bunx vitest run src/test/reviewComposerChrome.test.tsx`: 1/1 passed; `bunx vitest run`: 3,328/3,328 passed across 386 files, zero failures. Baseline 3,327/385 plus one new lifecycle case/file; no existing tests changed, renamed or deleted. CB99 ruling test passes. Automatic build 18:08:34Z OK; native/signed-in visual verification unavailable with external_unmanaged authentication.

## CB99 — Insights on the course
- [x] Added useBusinessCourseActivity and InsightsCourseSection after Reviews; server totals/order/privacy unchanged, sections 1–7 frozen. Added scoped global styles and en/en-XA copy; title tracking stays 0 under environment restriction rather than requested -0.01em.
- [ ] STOP: src/test/cb99InsightsCourse.test.tsx:75:71, “query key and arguments include each picker period; old snapshot remains until settled”: AssertionError: expected undefined to be truthy. Fixture sets gcTime: 0, so inactive 30-day cache is removed before final assertion. No assertion or fixture correction after failure. Targeted bunx vitest run src/test/cb99InsightsCourse.test.tsx src/test/cb89InsightsReviews.test.tsx src/test/cb88InsightsEngagement.test.tsx: 65 passed/1 failed/66 total/3 files (CB99 24/25; CB89 23/23; CB88 18/18). No existing tests changed. Last full baseline3,293/381; +25 new cases/one file = candidate3,318/382, full run not executed after stop.
- [ ] Full suite and browser checks blocked by the new test stop. Latest harness build OK16:00:43Z; standalone typecheck not run. External_unmanaged prevents authenticated live read verification. Report CB99_Insights_on_the_course_report.md; no pre-existing failure observed in targeted files.

## CB95 — Where the tee sheet has room
- [x] Extract shared weekRoom without changing CB91 courseLead tests; replace seasonality with tee-sheet week/year card and separate unchanged year-on-year content.
- [x] Add22 tests in cb95TeeSheet.test.tsx; targeted84/7 pass, unchanged22 CB91 helper tests green. Retarget only cb91CoursesTop section list/mock from SeasonalitySection to TeeSheetSection + YearOnYearSection; no count delta there. Full bunx vitest run3,244 passed/18 pre-existing failed/3,262 total/376 files. Last verified full3,208/373 +14 ownership +18 progress +22 CB95 =3,262/376; no new failures. Existing reviewUploadProgress.test.tsx:30:6 Error: createObjectURL does not exist remains untouched in all18 cases. Harness build OK14:49:41Z; standalone typecheck prohibited, not run.
- [x] Controlled actual cards438x970: Sundridge, single-day, early and empty states verified without overflow; computed busiest/quiet/ordinary colours match white/0.12/0.28. Screenshots reviewed. Title lettering stays0 under environment rule instead of brief's-0.01em; Geist retained. Report CB95_Tee_sheet_report.md.
- [ ] Live authenticated course data remains unverified: external-managed auth unavailable; controlled figures are not live read verification.

## BRIEF_REVIEW_MEDIA_UPLOAD_PROGRESS
- [x] OWNERSHIP foundation: Cloudflare connection linked; TUS auth.getUser, server Upload-Creator and stripped creator/owner metadata; creator/owned-legacy-row Stream cleanup, owned-row deletion and real signed R2 HEAD/DELETE. Both deployed GET versions confirmed 2026-10-26-review-owner-v1; unsigned POST401 verified. Deno check --node-modules-dir=auto passed after dependency/request-type fixes. No SQL/migrations.
- [x] Initial ownership stop superseded by OWNERSHIP ruling. Added14 ownership cases, all pass. Review upload controller/hook now have two-slot preuploads and joins, serial probes/no-preview and Stream poster fallback, exact tray/batch states and count-aware footer keys. Existing-media removal delegates cleanup before row deletion so legacy proof survives. Signed-in live creation/cleanup not verified (external_unmanaged).
- [ ] STOP: src/test/reviewUploadProgress.test.tsx:30:6 — Error: createObjectURL does not exist. All18 new cases fail in beforeEach's vi.spyOn; assertions not reached. Targeted bunx vitest run src/test/reviewUploadProgress.test.tsx src/test/reviewMediaOwnership.test.ts src/test/composerHoleTags.test.tsx:40 passed/18 failed/58 total/3 files. Existing26 composerHoleTags and14 ownership cases pass; no test changed after failure. Full suite not run; previous3,208/373 plus14 ownership and18 progress=3,240/375 candidate inventory, unexecuted full total. No existing tests retargeted/deleted/renamed.
- [ ] Full-suite/typecheck/real browser flow and remaining probe/endpoint behavior tests blocked by the new fixture stop; standalone project typecheck prohibited. Harness had Deno duplicate-package error; restored frozen Bun dependencies and removed node_modules/.deno without source changes to unrelated files; latest outcome to be reported. Report Review_media_upload_progress_ownership_report.md.

## CB94 — Card against course
- [x] Replace club IndexDisagreesSection chart with neutral grouped list from buildSiLadder only; shared chart/helper and CB91–CB93 frozen. No reads added.
- [x] Add8 new cases in cb94CardAgainstCourse.test.tsx; no existing tests changed/deleted/renamed/retargeted. Targeted39/4 pass; full bunx vitest run3,208/373 pass, zero failures, from3,200/372 (+8/+1 solely CB94). No pre-existing failures observed. Harness build OK14:16:51Z; standalone typecheck not run under environment policy.
- [x] Controlled actual card438x970: flagged groups, agree and under100 states verified, no overflow; screenshots reviewed. Brief-provided Sundridge helper-result values tested; no reusable real input fixture or direct shared-chart tests found. Live Sundridge inputs/authenticated page remain unverified (external_unmanaged). Shared chart/helper files and existing consumers unchanged. Report CB94_Card_against_course_report.md.

## CB93 — Your courses section 3
- [x] Update HoleBySection: hardest-first default, five-column table, ranked headline, single expanded per-hole split, HIP card paint and full-round empty state; CB91/CB92 and all other sections frozen. Reuse HIP, score colours, ramp, toParParts and howItPlaysShare.
- [x] User approved passing existing businessName/courseCount through the single page call for CB91's exact label; no new reads.
- [x] Add 14 behavior tests in cb93HoleByHole.test.tsx; no existing tests changed/deleted/renamed/retargeted. Targeted command (new file + CB91/CB92 files) 32/32. Full bunx vitest run: 3,200 passed/372 files, zero failures, from last reported 3,186/371 (+14/+1 solely CB93). No pre-existing failures observed. Harness build OK13:59:57Z; standalone typecheck not run under environment policy.
- [x] Controlled actual component at438x970: default, expand, card-order toggle and retained open hole verified; no card overflow. Reviewed screenshots. Live authenticated course reads unverified (external_unmanaged); no live-data claims. Header uses house Geist and local horizontal HOLE text fit within fixed columns. Final full-suite rerun3,200/372 passes; final harness build OK14:06:35Z.

## CB91 — Your courses section 1
- [x] Received and read courses-s1.html; written brief wins changed typography (23px) and selected-course rules; frozen shell/chips/lower sections retain existing design.
- [x] Implement selected-course pure lead, loaded business subtitle and unchanged request panel after course block/before privacy. Chips, gates/notices/unclaimed and all lower sections untouched.
- [x] Add 22 courseLead.test.ts cases and 6 cb91CoursesTop.test.tsx cases; no existing tests retargeted/deleted/renamed/rewritten. Targeted28/2 pass. Full bunx vitest run:3,171 passed/3 pre-existing failed/3,174 total/369 files. Baseline3,131/366 +15 rails/one file +28 CB91/two files =3,174/369.
- [x] Rails stop resolved by BRIEF_COURSES_RAILS_UNLIMITED_TEST_FIX (approved test-only edits): sentinel assertion split into root/rootMargin toBe checks; admin refetch findByRole gains hidden: true (batch window stays open by BRIEF_HOLE_TAG_BATCH_V3). Targeted file 15/15; full bunx vitest run 3,174/369, 0 failures; tsc -p tsconfig.app.json clean. No source or other test changes. Live exact visual/authenticated selected-course verification unavailable (external_unmanaged), not claimed.

## BRIEF_COURSES_RAILS_UNLIMITED
- [x] BRIEF_COURSES_RAILS_UNLIMITED_FIXTURE: only the new test file extends the shared observer class and assigns/restores the writable global; unstubAllGlobals retained. Assertions/source/other tests/lettering untouched.
- [x] BRIEF_COURSES_RAILS_UNLIMITED_TEST_FIX: both approved edits applied (sentinel root/rootMargin toBe; admin refetch hidden: true) — file 15/15, full suite 3,174/369 zero failures, typecheck clean. Both FIXTURE/STOP items above now closed; no further failure to report.
- [x] Implement cursor-page rails, loaded-row dedupe, rail-local observer/end skeleton and fullscreen holes paging gate. First-page minimum/readiness and course tap behavior preserved; not accepted as verified after test stop.
- [x] Add 15 cases in coursesRailsUnlimited.test.tsx; retarget only latestHolesSection/latestCoursesSection single-query fixture/contract assertions. Baseline 3,131 / 366; candidate 3,146 / 367 (+15 / +1), full count unverified.
- [x] RESOLVED by FIXTURE ruling (line above): observer extended/re-stubbed, 12/15 then; the remaining 3 closed by TEST_FIX entry. Report Courses_rails_unlimited_fixture_report.md.
- [x] Targeted command: bunx vitest run src/test/coursesRailsUnlimited.test.tsx src/test/latestHolesSection.test.tsx src/test/latestCoursesSection.test.tsx src/test/latestHolesSwipeCaption.test.tsx src/test/adminHoleTagging.test.tsx — 68 passed / 15 failed / 83 total / 5 files. Latest automatic build 12:56:40Z OK, earlier findLast intermediate errors cleared before test run. No separate manual typecheck (environment prohibition). Report Courses_rails_unlimited_stop_report.md.
- [x] Founder ruling: existing negative card letter spacing and its protecting test stay exactly unchanged; zero-or-positive applies only to new additions.

## BRIEF_SYNC_WHS_DUE_FAILURE_TYPE
- [x] Widen retry/failure parameter types to shared EgErrorKind excluding preauth_expired, retaining ok for success. Type-only call-site assertions preserve existing runtime paths; auth early return remains unchanged, member-token reads cannot throw preauth_expired. SyncResult.status already string. not_found/bad_request retain default backoff; all writes/timing unchanged.
- [x] deno check supabase/functions/sync-whs-due/index.ts clean. bunx vitest run: 3,130 passed / 1 pre-existing CB90 selector failure / 3,131 total / 366 files. No tests changed; prior full 3,119/365 plus CB90's 12 cases/one file reconciles exactly. No new failures.
- [x] Deployed sync-whs-due successfully; submitted source SHA-256 be66e55815d33f44de2801a5981eff5120f9f4fe7bdcd5b3d22182bf6034a81a. No SQL or timing/write/runtime changes.
- [ ] Platform deployment version/live SHA unverified: deploy tool returned success and submitted SHA only; function exposes no version and available read-only metadata tools/routes do not list deployed versions. No cron invocation made because it writes data. Pre-existing CB90 failure at src/test/cb90ReviewsNeutral.test.tsx:118:28 remains untouched.

## CB90 — Reviews neutral paint and one reply close control
- [x] Read the brief and audit existing reviews assertions; none require retargeting. Preserve reply behaviour, rating foregrounds and outer-band washes.
- [x] Replace page-only notice/empty/error/mid-rating paint; hide the shared sheet close control only here. Add 12 new cases in cb90ReviewsNeutral.test.tsx; existing tests untouched.
- [ ] STOP: src/test/cb90ReviewsNeutral.test.tsx:118:28, “CB90 reviews neutral paint and reply close > the selected-course empty Sparkles tile is neutral”: TestingLibraryElementError: Unable to find an accessible element with the role "button" and name `/West Course/`. Existing RailChips exposes role="tab"; new fixture selector is wrong. No correction after failure. Targeted bunx vitest run src/test/cb90ReviewsNeutral.test.tsx: 11 passed / 1 failed / 12 total. Full suite not run after stop; last reported baseline 3,119 / 365 files / zero failures; candidate inventory 3,131 / 366 (+12 new cases / +1 file), unverified. Latest automatic build 12:25:55Z OK. Live authenticated verification unavailable (external_unmanaged).

## CB87 — Signup detection and database-owned clbhouz follow
- [x] Remove the app-side follow and use parsed confirmation/creation timestamps for all three signup-success events. Exported business ID has no consumers; separate onboarding-nudges local constant unchanged. No other equality sites; no existing tests retargeted.
- [x] Add 16 helper tests and 7 AuthForm/audit tests. Targeted bunx vitest run src/lib/auth/isNewSignup.test.ts src/test/cb87SignupAnalytics.test.tsx: 23/23. Full bunx vitest run: 3,031 passed / 1 failed, 3,032 total / 359 files, versus 3,009 / 357 (+23 / +2). Prior AdminShell failure did not recur. Automatic build 09:18:17Z OK. Report: CB87_signup_stop_report.md.
- [ ] STOP: src/test/cb84InsightsAudience.test.tsx:215:65, CB84 page > the old "Who's viewing you" card is gone; the other cards still render. AssertionError: expected null not to be null. No fixes, reruns, standalone typecheck or live verification after this new failure.

## BRIEF_HOLE_PANEL_VIDEO_AUTOPLAY_V2
- [x] Add shared muted active-shot autoplay using the existing tile coordinator; pause beneath tagging dialogs and fullscreen. Manual players, thumbnails, processing and viewer unchanged.
- [x] Added 16 cases in holeInlineAutoplay.test.tsx; two approved existing disc cases use reduced-motion fixtures with assertions unchanged. Targeted 44/3 passed. Full bunx vitest run: 3,008 passed / 1 failed, 3,009 total / 357 files, from 2,993/356 (+16/+1). Automatic build 09:07:25Z OK; standalone typecheck prohibited, not run.
- [ ] STOP: src/features/admin/AdminShell.test.tsx:88:25, case /admin-v2/health?tab=settings redirects to /admin-v2/settings. TestingLibraryElementError: Unable to find an element with the text: Settings page. No correction or rerun after failure; browser verification not attempted after stop. Report Hole_inline_autoplay_V2_report.md.

## BRIEF_LATEST_HOLES_SWIPE_AND_CAPTION
- [x] Separate caption details, rail-wide immediate synthetic run and active-shot course header; frozen entrypoints/offsets unchanged.
- [x] Retargeted four authorised cases; added nine cases (+2 memberShotPosts, +7 latestHolesSwipeCaption). Full bunx vitest run: 2,917 passed/1 failed, 2,918 total/351 files, from 2,909/350. Only existing Top100CoursesHubPanel.test.tsx:234:55 failure remains: expected '0' to be '237'. Latest automatic typecheck/build23:15:32Z OK; manual typecheck prohibited.
- [ ] Live authenticated swipe/header/navigation verification unavailable (external_unmanaged); known Top100 scroll failure awaits fixture authorisation in its own task.

## BRIEF_TOP100_OFFICIAL_RANK_AND_TAP
- [x] Show active rated denominator and published rank; row taps reuse main-list scroll preservation, with chevrons and three shell bars. Maths/frozen styling unchanged.
- [x] Full `bunx vitest run`: 2,908 passed/1 failed, 2,909 total/350 files; baseline2,903/350 +6 (five section cases, one panel navigation case). Three authorised existing cases retargeted only. Automatic build23:07:01Z OK; manual typecheck prohibited, separate result unavailable.
- [ ] STOP: src/components/courses/Top100CoursesHubPanel.test.tsx:234:55, `AssertionError: expected '0' to be '237' // Object.is equality`, new case “argument row opens its course through the scroll-preserving main-list handler”. Fixture root lacks scroll-container overflow, so resolver chooses document at0; no correction after failure. Await authorisation for fixture-only overflow setup. Live authentication unavailable (external_unmanaged); no browser check after stop.

## CB83.1 — Busiest-day post counts
- [x] Count posts on the applicable UTC same/previous day; add twice/times clauses in en/en-XA, leaving weekly wording unchanged.
- [x] Full `bunx vitest run`: 2,886 passed/349 files, zero failures/skips, from 2,879/348; seven added cases solely in cb831InsightsPostCount.test.tsx, existing tests unchanged.
- [x] Automatic check 21:00:05Z confirms only pre-existing src/test/adminHoleTagging.test.tsx(50,85): error TS2339: Property 'staleTime' does not exist on type 'QueryOptions<unknown, Error, unknown, QueryKey, never>'. Test untouched; stop remains limited to this existing compiler error. Protected backend/config/native scope untouched.

## BRIEF_ADMIN_HOLE_TAGGING
- [x] Added server-authoritative admin check, admin untagged read and opt-in batch credit/duplicate handling; member source paths and all existing tests unchanged.
- [x] Full bunx vitest run2,879 passed/348 files, zero failures from2,861/347 (+18 only adminHoleTagging.test.tsx). RPC/readback/required invalidations, visibility, order and unchanged member path covered.
- [ ] STOP: src/test/adminHoleTagging.test.tsx(50,85): error TS2339: Property 'staleTime' does not exist on type 'QueryOptions<unknown, Error, unknown, QueryKey, never>'. New test accesses cache options through a narrower type; no correction after completed-edit stop. Build/typecheck not clean.
- [ ] Live authenticated admin tagging/readback and member attribution verification unavailable (external_unmanaged); browser validation not attempted after compiler stop. Report Admin_hole_tagging_stop_report.md.

## CB83 — Insights section two
- [x] Replaced visits/discovery with UTC bars, post markers, busiest-period sentence and merged sources; CB82 and later card source unchanged.
- [x] Added en/en-XA and 41 tests in cb83InsightsVisits (35) / cb83InsightsLoading (6). Retargeted two named CB82 page cases only, stable post-date fixture added. Full bunx vitest run 2,861 passed/347 files, zero failures from 2,820/345; latest automatic build OK.
- [x] Controlled browser 7/30/90 bars 7/30/13 and axis labels 7/4/4, empty/no sources verified; screenshots reviewed and no section overflow at320/430/1280. Dedicated chart keeps club analytics untouched; deleted only empty.visits/discovery in en/en-XA. Report CB83_Insights_section_two_report.md.
- [ ] Live authenticated Insights reads/markers remain unverified: external_unmanaged authentication cannot be restored here.

## BRIEF_MEMBER_SHOTS_VIEWER_POLISH_FIX
- [x] Resolved spacing hold: user drops clause 4 and spacing test; title stays at 0.
- [x] Corrected authorised text-column assertion plus member T/no-relative-time checks, safe-area scrubber string and active-video caption clearance; added two placement tests only. Title spacing stays 0.
- [x] Full `bunx vitest run`: 2,799 passed/344 files, zero failures/skips/unhandled errors, from2,797/344 (+2 solely memberShotCredit.test.tsx). Previously failed member caption and unchanged coursesHighestRatedTen scan pass. Automatic check19:35:24Z build OK/no type errors; separate manual typecheck prohibited, not run. Controlled browser measured image24px/video48px and reviewed both caption screenshots; live authenticated/native checks unavailable. Report Member_shots_viewer_polish_fix_report.md.

## CB79.2 — Invite history
- [x] Team's sole Invite entry carries fromTeam; back/success pop, cold opens replace. Guard and invalidations unchanged; opt-in hook toast suppression lets Team-origin success toast fire after navigation without duplicates.
- [x] Three real-history tests pass; targeted `bunx vitest run src/test/cb792InviteHistory.test.tsx src/test/cb79InvitePage.test.tsx src/test/cb74TeamFixes.test.tsx` 38/3 green. No existing tests changed.
- [x] Previous STOP resolved in viewer-polish-fix full run: all2,799/344 pass including unchanged coursesHighestRatedTen and all3 CB79.2 tests; automatic build OK/no surviving type errors. Historical CB79.2 run2,797/344 had timeout and caption failure; no CB79.2 source/test changes in subsequent fix. Live authenticated browser remains unavailable; historical report CB79.2_Invite_history_stop_report.md.

## BRIEF_MEMBER_SHOTS_VIEWER_POLISH
- [x] Received authorisation for six hole-open fixture/provider/wait updates preserving assertions, plus Latest courses' credit field assertion; applied them.
- [x] Implemented synthetic-only full-height geometry, active member caption/avatar and shared get_hole_media query; normal author/header paths retained.
- [x] Previous caption/TS2322 stop resolved by explicitly authorised viewer-polish-fix: full2,799/344 pass and automatic build OK. Historical run2,794/343 and stop report retained. Live authenticated/native swipe checks remain unavailable; controlled active caption switch and real-chrome tests verified.

## BRIEF_MEMBER_SHOTS_SWIPE_ACROSS
- [x] Build one synthetic carousel per course/hole with ordered ready shots and per-item credits; retain real-post behaviour and synthetic request gates. Added synthetic fullscreen post_views and likers mount gates; module headers own the local contract.
- [x] Authorised retargets in four existing files; full bunx vitest run 2,782/341 → 2,787/342, zero failures (+2 builder/gate tests, +3 new actual-chrome tests). Targeted103/7 green; automatic build OK14:55:34Z. Detailed report Member_shots_swipe_across_report.md names every changed case and assertion.
- [x] Audited post-keyed requests and horizontal native scroll-snap configuration; no custom bounce added.
- [ ] Native iOS/Android bounce and live signed-in card→viewer→swipe checks unavailable (external_unmanaged session/device access). Controlled actual carousel opening on tapped b verified; browser programmatic credit-change check timed out; actual-chrome tests pass.

## BRIEF_COURSES_LATEST_HOLES
- [x] Full unchanged baseline `bunx vitest run`: 2,585 passed /328 files, zero failures; matches CB75.1.
- [x] Add Latest holes rail/shell/readiness and once-per-mount Media hole/shot deep link; existing sections and HoleWalk unchanged.
- [x] Full `bunx vitest run`: 2,601 passed /329 files /0 failed/skipped/unhandled errors, from2,585/328; +16 solely new latestHolesSection.test.tsx, existing tests unchanged. Harness build OK19:10:48Z.
- [ ] Authenticated live visibility/shot navigation unavailable with external_unmanaged session. Signed-out Courses stays /courses; get_latest_hole_media returns HTTP401/code42501 `permission denied for function get_latest_hole_media`, so rail absent. Temporary controlled browser mount failed to render; no visual-match claim. Report names limitations and zero-letter-spacing environment departure. No SQL/migrations/RPC/edge/feed_config/native changes; cap30 unchanged.

## BRIEF_HOLE_WALK_NO_ROUNDS
- [x] Implemented Media-only eighteen-hole fallback and unscored panel/quiet line; default scored JSX and deriveHoleWalk retained, frozen flows untouched.
- [ ] STOP: full bunx vitest run baseline 2,569 passed/326 files → 2,581 passed/1 failed =2,582 cases/327 files. +13 solely holeWalkNoRounds.test.tsx; all existing tests unchanged/pass. New automatic-restoration test fails at src/test/holeWalkNoRounds.test.tsx:115:23: `Error: expect(element).not.toHaveClass("hole-walk-panel-unscored")`; received `hole-walk-panel hole-walk-panel-unscored`. No correction after failure. Harness build OK16:47:32Z. Browser verification not attempted after stop; awaiting ruling on new fixture failure.

## HOLE_MEDIA_VIDEOS_STAGE_2
- [x] Final timing ruling: remove only the authorised beforeAll namespace preload and unused beforeAll import; retain afterEach cleanup/imports and every test name/assertion/value. Inventory remains 2,538 cases/324 files.
- [x] Two consecutive full `bunx vitest run` runs: run1 2,538 passed/324 files, run2 2,538 passed/324 files; both exit0 with zero failures/skips/unhandled errors. Inventory unchanged; no test names/assertions/expected values changed, no tests deleted/renamed/rewritten. cloudflare-stream-webhook deployment succeeded; submitted source SHA-256 3fe9b5af8e0393709486e0242dbce8b1330741f0325dade428239ebe1e60eef2. Automatic preview build OK12:44:28Z. Live webhook processing remains unverified; no SQL/migrations/feed_config changes, cap30 unchanged.
- [x] Applied authorised tourOverviewDesignA.test.ts top-level namespace preload and render cleanup only; all names/assertions/expected values unchanged, zero inventory delta.
- [x] RESOLVED by final timing ruling and two clean full suites: earlier first `bunx vitest run` exits1: src/test/tourOverviewDesignA.test.ts:31:1, `Error: Hook timed out in 10000ms.` 2,477 passed /61 skipped =2,538 inventory;323 passed files/1 failed suite. Historical report HOLE_MEDIA_VIDEOS_STAGE_2_ruling_stop_report.md.
- [x] Extend both hole-library pickers and route videos through review resilient uploader, preserving R2 photos and EXIF-only months. Founder ruling enforces 4 GiB, four MIME types and empty-MIME extension fallback; private SUPPORTED_VIDEO_TYPES reproduced from shared three-type list plus x-m4v without touching the review composer.
- [x] Insert processing video contributions; isolate three guarded webhook metadata updates before the byte-identical post lookup-to-handler-end (verified against HEAD).
- [x] Add only holeLibraryVideosStage2.test.tsx: 20 tests; targeted20/20. Full `bunx vitest run`: 2,538 passed /324 files /0 failed tests, but1 unhandled rejection and exit1. Delta from2,518/323 is exactly20 new tests/one file; no existing tests changed. Automatic preview build OK12:27:57Z; standalone tsc prohibited by environment, unverified.
- [x] RESOLVED by retained afterEach cleanup and two clean full suites: earlier ReferenceError: window is not defined, node_modules/react-dom/cjs/react-dom.development.js:10993:22; Vitest attributed it to src/test/tourOverviewDesignA.test.ts after environment teardown, via react-i18next onLoaded. Historical report HOLE_MEDIA_VIDEOS_STAGE_2_stop_report.md. Live authenticated video-flow verification remains outside this ruling and unavailable with external_unmanaged authentication.

## HOLE_MEDIA_VIDEOS_STAGE_1
- [x] Apply founder rulings: change only mediaTrust line23 expected photo copy; restore EXIF-only captureMonth and the original missing-EXIF test, preserving all other video work.
- [x] Full ruling suite `bunx vitest run`: 2,518 passed /323 files /0 failures, unchanged total from 2,518 (previously 2,517 passed /1 failed). Only mediaTrust.test.tsx and holeWalk.test.tsx changed in this ruling. Automatic preview build OK05:28:07Z. Manual tsc not run under the environment's harness-only checks rule; separate typecheck remains unverified.
- [ ] Include only encoded own published-post/review videos in sources and tagging; keep new library uploads image-only.
- [ ] Add video posters/duration to existing tagging surfaces, hole panels and moderator review; reuse existing HLS and audio ownership.
- [x] Confirm four founder-added course_hole_media fields already exist; generated schema unchanged, no SQL/migrations.
- [x] Previous protected-copy stop resolved by founder's exact line23 authorization; missing-EXIF test name and original empty-array assertion restored. Full suite now green. Broader browser/audio validation remains uncompleted; no claim of live persisted video-flow verification.

## CB75 — Team section 1
- [x] Read the brief/reference and audit the header, team/invite reads, request decisions and protecting tests. Full baseline `bunx vitest run`: 2,467 passed /321 files /0 failures, matching the latest reported suite.
- [x] Founder ruling: preserve BottomSheet's own #16161A surface, radius20 and36×4 handle; role cards #1C1C21. Shared sheet unchanged.
- [x] Implement Team header/subtitle/Invite, member summary and ordered waiting line, shared requests query and request rows; preserve section2. Membership also settles before waiting copy, preventing an invite/request flash.
- [x] Approve/decline sheets and row-scoped locks; CB74 decision helper/RPC assertion retargeted without count/name changes. Full final `bunx vitest run`: 2,502 passed /322 files /0 failures (+35 solely cb75TeamSectionOne.test.tsx). No pre-existing failures; automatic preview build OK05:08:56Z. No manual build/typecheck run.
- [x] ASK answers, per-file diff and controlled rendered measurements in CB75_report.md. Chromium390×844: summary358×53.078125, quoted row324×145.890625, approve sheet390×515.21875; controlled refusal→Analyst success→summary update→decline→card removal passed, final page errors0. Screenshot review and320/1280 empty-state overflow checks complete.
- [ ] Live owner/profile-field permission verification is unavailable with external_unmanaged authentication; source policy permits non-deleted profiles, but deployed permissions and persisted live decisions remain unverified. No SQL/migration/RPC/edge/config/native changes; cap30 unchanged.

## CB74 — Team fixes before rebuild
- [x] Replace access decisions with TEAM_FIX_V1 RPC, preserve recovery/invalidation paths and add team/invite refresh on approve; align role labels.
- [x] Label elapsed pending invites Expired without removing Revoke; guard invite form with membership canManage and existing route-loading skeleton.
- [x] Full `bunx vitest run`: 2,430/319/0 before new tests → 2,450/320/0 after; +20 solely cb74TeamFixes.test.tsx, no existing tests edited/renamed/deleted and no pre-existing failures. Automatic preview build OK. Standalone typecheck prohibited by environment; not claimed. ASK answers and frozen mock differences recorded in /mnt/documents/CB74_report.md.
- [ ] Authenticated live approval/invite verification unavailable on externally managed Supabase; do not claim live authorization or data persistence verified.

## CB72 — Omit placeholder business categories
- [x] Business home and live business profile hero omit Other/empty categories, preserving each header's existing location format and every other category.
- [x] Audited other category displays; left directory, success and verification surfaces and alternate profile category chip unchanged as audit-only.
- [x] Full `bunx vitest run`: baseline 2,412/316/0; final 2,418/317/0. Three new cases in cb66BusinessHomeHeader.test.tsx and three in cb72BusinessProfileCategory.test.tsx; no existing tests renamed/deleted/rewritten. Automatic preview build OK; standalone typecheck not run under environment restrictions. No pre-existing failures. Authenticated live-header check unavailable; real home page and hero identity rendering covered by tests.

## Public delete-account information
- [x] Confirmed Profile three-dot menu → Settings → Account Actions → Delete Account; baseline `bunx vitest run`: 2,289 passed /306 files /0 failures.
- [x] Added static English legal page and lazy route; approved download/maintenance exemptions apply only to /delete-account, preserving privacy/terms.
- [x] Full `bunx vitest run`: 2,294 passed /307 files /0 failures, from 2,289/306; five additions only in publicDeleteAccountAccess.test.tsx, no existing tests changed. Automatic build OK. Signed-out localhost at1280×1800,390×844,320×568 shows all content without app chrome/overflow/runtime errors; footer opens /privacy, /terms remains reachable. No SQL/backend/config changes.
- [ ] Verify https://clbhouz.co.uk/delete-account after publication; blocked on publication not requested in this brief.

## CB61 — Player-row sheet doors
- [x] CB61.1: reproduced all three TS2741 errors using `bunx tsgo --noEmit -p tsconfig.app.json`; root command exits0 but files[] is empty. Fixed only rating9.6, empty courseId and empty user.id in cb61SheetDoors.test.tsx; all names/assertions unchanged. Root/application typecheck exits0; full `bunx vitest run` 2,289/306/0 unchanged; harness build OK. Controlled390×844 before/after rows and feet, long-name ellipsis and30px doors/44px hit targets measured; report /mnt/documents/CB61.1_report.md. No pre-existing test failures; three pre-existing fixture type errors cleared. Git pull skipped because workspace Git is platform-managed.
- [x] Read signed-off option A; full baseline `bunx vitest run`: 2,280 passed /305 files /0 failures, matching CB60. Git pull skipped because Git is platform-managed.
- [x] Move member Course/Profile actions to shared player-row buttons and inert swipe preview; preserve tour foot, Share, navigation and frozen head details.
- [x] Retarget only authorized review navigation/footer assertions; add requested regressions, run full suite and check harness diagnostics.
- [x] Measure before/after rows and feet at390px, long-name fit and hit targets; controlled measurements completed in CB61.1. Authenticated real-member navigation remains unavailable with external-managed authentication, not claimed verified.
- [x] Implemented doors and authorized review selectors; `bunx vitest run`: 2,289 passed /306 files /0 failures (+9 solely cb61SheetDoors.test.tsx). Targeted35/3 green; no pre-existing failures. STOP: harness reports TS2741 at new fixture lines68,74 (missing rating),79 (missing user.id); no corrective edit made. Measurements/live verification unfinished; report CB61_stop_report.md names all retargets/errors. External-managed authentication also prevents signed-in end-to-end verification.

## CB58 — Leaders' group
- [x] Read brief/mock and audited source before building: round advances by scored/live participation or course-local date, not last card/first tee; IDs share sr_players.id. Baseline bunx vitest run: 2,233/303, no pre-existing failures. Git pull skipped because workspace Git is managed.
- [x] Implemented shared selection/rendering and en/en-XA copy; existing tour-green ruling confirmed. Historical completed cards scope stale thru/today without changing shared scoring helpers; shared event-format gate; existing scorecard sheet and analytics callback.
- [x] Full bunx vitest run: 2,270/304, no failures (+37 solely cb58LeadersGroup.test.tsx; no existing test changed/deleted/renamed). Targeted107/3 green. Harness build OK; standalone typecheck not exposed. Controlled390×844: all three3-player/note states240.390625px exactly match supplied HTML (brief244 differs by3.609375); two-player/no-note175px. Reviewed every screenshot; no page errors. Live authenticated verification unavailable external_unmanaged. CB58_report.md records source audit, overrides and limitations. No SQL/migration/RPC/edge/feed_config/native changes; cap30.

## CB57 — Tour hero board removals and tie brackets
- [x] Baseline `bunx vitest run`: 2,224 passed /302 files /0 failures. CB56 added five tests/one file since 2,219/301; no pre-existing failures. Git pull skipped: workspace Git is platform-managed.
- [x] Removed specified separator, next-round/action rows and caller callback; shared stretched position-cell brackets, retained cap and protected helpers/locales/tee-alert code. Existing movement/card rules retained and reported, not silently removed.
- [x] Full `bunx vitest run`: 2,233 passed /303 files /0 failures (+9 solely cb57HeroBoardRemovals.test.tsx); targeted 76/3 green. One authorized cap assertion retargeted in tourOverviewDesignA.test.ts, no rename/delete; tee-alert test unchanged. Harness build OK; no separate compiler result exposed. Controlled 430×786 three-phase measurements/screenshots passed; all five live brackets x42.5 from board/-7.5 from avatar, completed x40.5/-7.5. Empty upcoming height0. Live authenticated verification unavailable (external_unmanaged). No SQL/migrations/RPC/edge/feed_config/native changes; cap30.

## CB50.1 — Finish monitor value snapshots and borrow fixture
- [x] Record brief: copy reader values in start/progress; complete authorized BorrowDescriptor fixture without assertions/casts; audit fullscreen layer and change only spinner z-index if needed. Freeze signed-off spinner, timing, event/caps, CB48/49, preview/legacy/native.
- [x] Full `bunx vitest run`: 2,162 passed /293 files /0 failures, from 2,158 passed/four failed with identical inventory. Four untouched cb50Buffering.test.ts cases at lines 24,28,32,47 now pass; engine fixture assertion/name unchanged; no test added/deleted/renamed/rewritten.
- [x] Source stacking audit: spinner fixed 29 above media/poster (1/2/borrow-wrapper 3), below chrome context 30 containing rail/author/scrubber 11500 and top-progress 11502, and sibling flash 11504. Keep 29: raising to 31 would cover chrome despite child values. Signed-in phone check unavailable (external-managed auth).
- [ ] STOP: latest automatic harness typecheck 12:20:12Z contains only pre-existing `src/test/reviewCourseNoReopen.test.tsx(57,3): error TS2589: Type instantiation is excessively deep and possibly infinite.` CB50 BorrowDescriptor TS2739 resolved; typecheck/build not green, review fixture untouched as outside brief. Report /mnt/documents/CB50.1_validation_report.md. Protected playback/style/timing/analytics/backend/native scope unchanged.

## REVIEW_SHEET_OPENS_REAL_POST — STOP (new fixture type error)
- [x] Only requested application files changed: new useReviewPost.ts calls the already-generated get_review_post RPC with canonical actor/session and feed mapping; ReviewBottomSheet.tsx replaces synthetic posts with real post/URL-or-stream matching and clamped pager fallback. No readOnly; stacking and return store unchanged.
- [x] Authorized correction: reviewCourseNoReopen.test.tsx direct sheet renderer and reviewSheetCalibration.test.tsx sheet helper now use a fresh QueryClient with queries.retry false in QueryClientProvider. RPC spies return empty data/no error to prevent network calls. No test name or assertion changed. All 15 previously failing review cases now pass.
- [x] Full `bunx vitest run` before: 2,158 passed / 4 CB50 failures =2,162 total/293 files; after: 2,143 passed /19 failures =2,162 total/293. Inventory unchanged; all 15 result changes named in /mnt/documents/Review_sheet_real_post_stop_report.md. Four earlier CB50 failures and BorrowDescriptor TS2739 at cb50BufferingEngine.test.tsx(67,53) remain untouched.
- [x] Authorized rerun `bunx vitest run`: 2,158 passed / four pre-existing CB50 failures =2,162 total/293 files. Before correction 2,143 passed/19 failed; +15 passing, zero inventory delta. No test added/deleted/renamed/retargeted.
- [ ] STOP: src/test/reviewCourseNoReopen.test.tsx(57,3): error TS2589: Type instantiation is excessively deep and possibly infinite. New RPC spy typecheck error; no correction after failure. Standing cb50BufferingEngine.test.tsx(67,53) TS2739 remains unchanged. Full build/typecheck and authenticated three-entrypoint verification not complete. Report /mnt/documents/Review_sheet_real_post_stop_report_v2.md. No SQL/migrations/RPC/feed_config changes; round_pool_cap 30.

## CB50 — Buffering spinner Design A (STOP, not complete)
- [x] Fresh baseline `bunx vitest run`: 2,142 passed / 291 files / zero failures; CB49 added ten tests in two files since the recorded CB48.2 baseline of 2,132/289.
- [x] Added engine progress observation, buffering snapshot field (VideoEngine.snapshot and useVideoLane.NULL_SNAP), shared Design A spinner, active inline/fullscreen render sites and visible-stall session budget. Frozen playback/audio/gestures/watchdogs and legacy/preview files untouched.
- [ ] STOP: full `bunx vitest run` is 2,158 passed / four new failures = 2,162 total / 293 files. Delta +20: 12 cb50Buffering.test.ts cases and eight cb50BufferingEngine.test.tsx cases. No existing test edited, renamed or deleted. Failures at cb50Buffering.test.ts:24:77, :28:51, :32:59 (expected true to be false) and :47:19 (expected spy once, calls 0). No correction after failure.
- [ ] STOP: latest harness typecheck src/test/cb50BufferingEngine.test.tsx(67,53): TS2739 missing BorrowDescriptor ownerKey, posterUrl, viewportW, viewportH. Build OK preceded this test addition; final build/typecheck not green.
- [ ] Reduced-motion browser check, real fullscreen visual verification and iOS playback remain unverified. Report: /mnt/documents/CB50_buffering_stop_report.md. No SQL/migrations/RPC/feed_config/native changes; round_pool_cap remains 30.

## CB48.2 — Restore canonical lane roles in the test fixture
- [x] Added test-only `feedLaneRoles.__resetForTests()` (canonical map, frozen set cleared, one emit); only caller is the test file — confirmed by repo-wide search, no production call site.
- [x] videoAudioRoleRecovery.test.tsx beforeEach now calls `__resetForTests()` instead of `promoteToActive('feed-active')`; no test body or assertion changed.
- [x] Whole file rerun: 15/15 pass, including the original self-pause case with all four assertions verbatim. No case changed result in either direction beyond the previously failing one now passing.
- [x] Leakage audit: `videoAudioRoleRecovery.test.tsx` is the only test file driving feedLaneRoles or VideoEngine; no other file shares the singleton.
- [x] Full suite 2,132 passed / 289 files / 0 failures (expected count met, zero pre-existing failures). tsgo --noEmit clean. Preview harness build-errors.log last entry predates these two edits; no newer entry yet, so harness typecheck status for this exact change is unverified from that source.

## CB48.1 — Finish snapshot completeness and unconditional unmute detection
- [x] Added required audioBlocked:false to useVideoLane.ts NULL_SNAP. Only other LaneSnapshot literal is VideoEngine.snapshot(), already complete; no test/fixture literals found.
- [x] Every reconciler engine unmute now arms the owner-bound attempt; gestureDepth had no other purpose and was removed. Added one passing unblockFromGesture self-pause case; all existing cases/assertions untouched.
- [x] Original failure traced in temporary diagnostic copies (removed): before rotation active=feed-active,next=feed-prev,prev=feed-next; after down rotation active=feed-prev. Paused feed-next has no armed attempt and is already muted; pause event DOES fire, owner/wantPlay/mountedHost/visibility otherwise eligible. Isolated original case passed before edits. promoteToActive in setup swaps only active, not canonical next/prev. Sequence does not simulate an unmuted WebKit self-pause; no engine change to misclassify muted non-speaker pauses and no test edits made. Await explicit fixture-reset ruling.
- [x] Full bunx vitest run: 2,131 passed +1 pre-existing failed =2,132 total/289 files; prior 2,131 total (2,130 passed/1 failed). Delta +1 solely new gesture case; zero deletions/renames/rewrites. Failure remains videoAudioRoleRecovery.test.tsx:118:53, AssertionError: expected false to be true // Object.is equality. Targeted 19 passed/1 failed. Automatic preview build OK 2026-10-22T05:58:11Z; separate typecheck not available from harness output, manual build/typecheck prohibited by environment.
- [x] RESOLVED by CB48.2: canonical roles restored via test-only `__resetForTests()` in beforeEach; original case passes with assertions verbatim.

## CB48 — Role-based sound and honest blocked-state controls
- [x] Implemented role-capable focus and shared resolver for reconciliation/heartbeat; physical fullscreen close handoff unchanged.
- [ ] STOP: engine self-pause fallback does not pass new test `src/test/videoAudioRoleRecovery.test.tsx:118:53`: `AssertionError: expected false to be true // Object.is equality`; no implementation/test correction after failure.
- [ ] STOP: preview typecheck `src/video/useVideoLane.ts(60,7): error TS2741: Property 'audioBlocked' is missing in type '{ laneId: "feed-active"; state: "idle"; currentTime: number; readyState: number; duration: number; muted: true; firstFrame: false; postId: null; endedCount: number; }' but required in type 'LaneSnapshot'.` No correction after stop.
- [x] Implemented (not accepted complete): engine blocked state/gesture rescue/visibility intent, inline/fullscreen icon wiring, real-refusal analytics and separate silent-switch hint. No existing test retargeted, deleted or renamed.
- [x] Full `bunx vitest run`: before 2,112 passed/287 files/0 failures; after 2,130 passed +1 failed =2,131/289 files. +19 exclusively 14 new videoAudioRoleRecovery cases and 5 new videoAudioAnalytics cases. No pre-existing failures. Prior fullscreen pill change removed zero tests (305 tracked test files before/after; executable Vitest files 287).
- [x] Close handoff/legacy pool audit recorded in `/mnt/documents/CB48_sound_stop_report.md`; legacy path unreachable through the sole fullscreen SnapFeed mount, but SnapVideoPlayer does contain live VideoSlot JSX despite stale poster-only header. Authenticated/phone checks not run after stop; external_unmanaged auth.
- Held: element priming, buffering UI, wake-lock changes; preview and legacy pool path untouched.

## CB42 — Gate height fills to viewport bottom; diagnostic removal confirmed
- [x] Part 1: wrapper div in AmateurPage.tsx gained `data-amateur-page=""`; roundsGate.css scopes `[data-amateur-page]:has([data-rounds-gate])` as flex host at height 100dvh/min-height 0, and main's `height: calc(100dvh - var(--sat, 0px))` became `flex: 1 1 auto` (var(--sat) term gone). padding-bottom expression, card 20px padding, nav offset, CB38 mask/opacity, CB36 rule, scope switch, five-round rule and copy untouched.
- [x] Part 2: GateFootDiag already fully removed under CB41; `rg GateFootDiag src/` empty. Only remaining matches are historical roadmap entries. No test referenced it.
- [x] No test asserted the height expression or var(--sat) term; no test changed. Full `npx vitest run`: 2,104 passed / 285 files before and after, zero failures. tsc clean; preview build OK 19:46:27Z.
- [x] Controlled harness (real roundsGate.css, stand-in header 148px/nav 60px/card 278px/rows 110px): main rect.bottom equals innerHeight on all three sizes; no-handicap button to nav gap exactly 20px; no scroll introduced. 430x932: main 932, glimpse 426px, 3 rows. 390x844: main 844, glimpse 338px, 3 rows. 360x640: main 640, glimpse 134px, 1 row. Glimpse GAINS ~59px (brief predicted a loss; the 59px were dead space below the old main bottom, now usable). Authenticated live-gate check unavailable (external_unmanaged); harness evidence labelled controlled.
- [ ] Authenticated real-phone verification of the gate remains open, blocked on a signed-in preview session.

## CB35 — Gate action and bullets
- [x] Baseline `bunx vitest run`: 2,092 passed / 282 files, zero failures; matches last reported count. Only CTA role selector is roundsGateAnalytics.test.tsx:79, case “reports the white CTA tap before retaining its connect destination”; preserve its accessible button semantics and all assertions unchanged. No bullet-count/removed-string protecting assertion.
- [x] Matched white inline text action, exactly two bullets (courses then index), and gate-only flex anchoring at the measured nav top. Frozen states, predicate, inert mask, sheet and analytics retained. No existing tests changed.
- [x] Full `bunx vitest run`: 2,092 passed / 282 files before and after, zero failures, no inventory delta. Preview build OK. Controlled real-component 390×844 capture: header 308.05px; two fully visible rounds and third partly visible; card/nav seam 0px; action 196.44×44px; secondary gap 13px. StrictMode impression fired once; click fired connect event and navigated to /manage/handicap. Hosted authenticated end-to-end check unavailable (external_unmanaged); capture is controlled, not a signed-in live gate. Report and screenshot in Files. No SQL/migrations/RPC/feed_config/cap changes.

## BRIEF_REVIEW_POST_SCORE_MATCH_CARDS
- [x] Compacted block D only to option B sizes/spacing; preserved tones, verdict, dashes, drop rules and navigation. Authorised renames: reviewPostScoreBlockB2.test.tsx:35 'renders the overall at 30 / 800 in its rating tone with a right divider' becomes24; :38 `expect(score.style.fontSize).toBe('30px')` becomes24px. reviewPostScoreCompact.test.tsx:26 'the score figure is 30 / 800 / -0.045em' becomes24; :28 `expect(s.style.fontSize).toBe('30px')` becomes24px. These two cases reflect signed-off size change; every other existing assertion retained, six requested assertions added in B2. No tests deleted or other cases renamed/rewritten.
- [x] Full `bunx vitest run`: before2,060 passed+3 failed=2,063/279 files; after2,059 passed+4 failed=2,063/279 files. No inventory delta. Both authorised files pass (8+3 cases). Preview build OK12:36:00Z; manual typecheck not run (preview harness ownership).
- [ ] STOP: src/test/scoreLabelSpacing.test.tsx:91:35 `AssertionError: expected '5px' to be '6px' // Object.is equality`, case 'places the review post tier word at B2’s 6px gap'. Brief explicitly changes marginTop to5 but authorises only two other test files; protected assertion untouched awaiting Ben's ruling. Other three failures unchanged (divider formatting and CB27). No visual verification after stop. No SQL/migrations/RPC/feed_config/cap changes.

## BRIEF_COURSE_CARD_SCORE_BLOCK — stopped at validation
- [x] Moved BrowseCourseCard headline/count below unchanged photography into opt-in CategoryScores split; preserved grid4/pairs, canonical tones and frozen photo elements. Facts use 10/8px seams and 13px embedded figures; both shared card-gap constants are 24px.
- [x] Added categoryScoresSplit.test.tsx with six cases. No existing test deleted, renamed, rewritten or assertion changed; courseRatingConsistency.test.ts unedited and all 19 cases pass. Preview build OK 2026-10-21T12:33:26Z. No SQL/migrations/RPC/feed_config/cap changes.
- [ ] STOP: categoryScoresSplit.test.tsx:24:45 `AssertionError: expected 'rgba(255,255,255,0.08)' to be 'rgba(255, 255, 255, 0.08)' // Object.is equality`. New divider colour assertion has formatting mismatch; no correction after failure, awaiting Ben's ruling.
- [x] Requested full `bunx vitest run`: 2,060 passed +3 failed =2,063 executed across279 files. Previous reported2,053 passed+2 failed reconciles with two added By region cases to2,055 passed+2 failed/278 files before this brief; six new split cases add five passing/one failing and one file. Known CB27 failures remain scoresLeadBoard.test.tsx:134 `AssertionError: expected '1' to be '−3' // Object.is equality`, :144 `AssertionError: expected '70' to be '−2' // Object.is equality`.
- [ ] Browser/mock verification not run after stop; authenticated checks unavailable (external_unmanaged). Typecheck not manually run because preview harness owns it. Local header documents split ownership; root cross-cutting rules unchanged.

## CB27 — Six-board Leaderboards replacement
- [x] Replaced CB25 controls with six outlined count tiles using existing facets; shared ScoreWithToPar leads gross/net, faint positions, six-board feat suppression with Rare air rules preserved. Existing page/read/filter owners unchanged; comments record local ownership.
- [x] Full `bunx vitest run`: baseline2,018/271 zero failures; after2,022 executed/272 files =2,020 passed+2 failed. +1 count test in leaderboardsSection.test.tsx/+3 new leaderboardsScorePairs.test.tsx cases. Announced two superseded CB25 cases before updating; no other existing assertions changed. Build OK11:33:26Z. Count/ranking/shapes/exact failures saved in CB27_stop_report.md.
- [ ] STOP — scoresLeadBoard.test.tsx:134 `AssertionError: expected '1' to be '−3' // Object.is equality`; :144 `AssertionError: expected '70' to be '−2' // Object.is equality`. Existing cases require to-par-leading cells/red main/amber position; await Ben's test ruling. No code/test corrections after failure. Requested390px screenshot/widths/height/total/interactions not run because verification stopped.
- [ ] Authenticated real-member check depends on an available hosted session; controlled evidence must be labelled.

## Explore sheets — One shell
- [x] Extracted canonical shell/default markup/styles; existing Top100/Most improved contents unchanged. Board sheets use cap counts/no24px band and sheet-only typography; competition uses DONE/header/footnote and16px row inset; English Just played title updated. Local headers record shell/gutter ownership; cards/RPCs untouched.
- [x] Full bunx vitest run 2,011/270→2,018/271, zero failures; seven added exploreSheetShell.test.tsx cases. Announced then updated only competitionBoards.test.tsx old93 subtitle locator and old106 containment assertion for portal/footnote; no deleted/renamed tests. Build OK11:25:00Z.
- [x] Controlled394×970 actual shell/board/competition readers: opening/DONE/score handoff,14.5px titles/10.5px caps/16px field inset/footnote order verified; four screenshots reviewed, no fixture errors. Report saved; no SQL/migrations/feed_config/RPC/cap changes.
- [ ] Authenticated real-member checks unavailable on external_unmanaged; controlled evidence explicitly labelled in report.

## CB25 — Leaderboards section returns
- [x] Remounted four allowed boards on existing state.page/shared rows/head/See-all; sole caller supplies optional net default, existing recent entryBoardFor/scope probes unchanged. Local headers record ownership and mandated shape exception; no other sections or BoardFilterPanel edited.
- [x] No protecting assertions needed changes. Full bunx vitest run 2,005/269 → 2,011/270, zero failures; delta solely six new leaderboardsSection.test.tsx cases. No existing tests deleted/renamed/rewritten. Preview build OK11:15:25Z.
- [x] Controlled actual section/query/sheet verified at390px: widths48.15625/66.140625/91.8125/72.390625, total299.5 including21 gaps; client/scroll358, no English scrolling. All board taps/values, score-id handoff, existing sheet, shared club/30day args and empty disappearance passed; no fixture errors. Reviewed screenshots, CB25_report.md records frozen mock differences, full shapes and no conflict-free scoped slot. No SQL/migrations/RPC/feed_config/cap changes.
- [ ] Authenticated real-data screenshot unavailable under external_unmanaged; label controlled evidence.

## CB24 — Remove Top 100 basis line
- [x] Removed basis call/component, THE_HUNDRED.basis, HUNDRED_BASIS_HEIGHT and unused en/en-XA key; retained RANK_SCOPE_LABEL (page chips/slab/sheet still read it), Trans and blockGap. CB23 and frozen surfaces untouched; local comments updated.
- [x] Only authorised theHundred.test.ts:57/58 heights assertions changed 334→288 and 522→476; head119+rows144+See-all25=288, signed-in adds slab100+strip88=476. Full bunx vitest run baseline and after 2,005/269, zero failures and no inventory delta; no other assertion edits/deletions/renames/additions.
- [x] Reviewed synthetic actual-section screenshot at 394×970: out rendered331.234375→285.890625, in520.015625→474.671875, pending519.234375→473.890625. Render reduction45.34375 versus reserved46 reflects paragraph33.34375+gap12 versus rounded lines34+12; no compensation. Saved CB24_report.md and CB24_synthetic_section.png. Bare latest-course subline now unexplained intentionally; no replacement elsewhere on page/sheet. Locale JSON parses, cleanup refs absent, final preview build OK11:03:56Z; no SQL/migrations/RPC/feed_config/cap changes.
- [ ] Authenticated live-data check unavailable under external_unmanaged; distinguish controlled section evidence from real member data.

## CB23 — Remove Top 100 sub-head
- [x] Removed both HundredSubHead calls/component, subHead/stripTop tokens and unused theListHundred/hundredPlayedCount keys in all locales where present; kept RANK_SCOPE_LABEL for chips/basis/slab/sheets/ExploreCard. Pending 76px spacer and rail key/geometry/blockGap frozen.
- [x] Ben approved only theHundred.test.ts:55 strip 118→88 and :58 signed-in 552→522; case/name and other assertions untouched. Signed-out 334 = 119+46+144+25 excludes strip, slab 88 and rows 144 have no removed terms. Final full bunx vitest run after locale cleanup: 2,005/269 before and after, zero failures/count delta.
- [x] Controlled actual section branch at 394×970: signed-out 331.234375 unchanged; signed-in 538.015625→520.015625; pending 537.234375→519.234375. Reservation 552→522; existing margin collapse means rendered reduction 18, not 30, with new residual ~2px. No compensation; report distinguishes synthetic board spacer from real data.
- [x] Saved CB23_report.md and reviewed CB23_synthetic_section.png; all cleanup references absent and locale JSON parses. Preview build OK 10:56:42Z. Played count remains in slab and own-row progress sheet; count semantics differ (board versus course rows). No SQL/migrations/RPC/feed_config/cap changes.
- [ ] Authenticated real-data screenshot/measurement unavailable under external_unmanaged; synthetic screenshot has a controlled 144px board spacer and no-photo tiles, not live member evidence.

## CB22 — Rare Air badge and comparison fit
- [x] One identity-bound badge uses highest uncapped all-time rounds per occurrence; unobserved all-time feats rank above finite rates, ties retain incoming RPC rarity order. All CB21 tokens/order/zeros unchanged. Shortened only English more/less; removed allRate and Trans n/unit/g interpolation, retained unit for first rate line.
- [x] Full `bunx vitest run`: 2,001/268 before → 2,005/269 after, zero failures. +4 solely new rareAirBadge.test.tsx (render regression, ties, unobserved feats, cross-unit uncapped rarity); no existing tests changed. Preview build OK 2026-10-21T10:44:25Z.
- [x] Actual component/English-provider synthetic measurements at 320: inner 166, 190×156 tiles, no name/rate/comparison clipping or page overflow, Eagles tap returns eagle, zero page errors. Full synthetic rail and individual tile screenshots reviewed. Widths and font caveat in CB22_report.md; no loaded font faces and actual SANS token uses system fallback, not Geist.
- [ ] Real-data full-rail screenshot remains blocked: live get_feats_window read returned code 42501, `permission denied for view whs_friend_matches`; external_unmanaged session unavailable. Supplied screenshot is explicitly synthetic, not production evidence. No SQL/migrations/RPC/feed_config/cap changes.

## CB21 + CB21.1 — Rare Air smaller tiles and phone-first placeholder
- [x] Applied all named local tile tokens: measured 244×178 → 190×156. Rail top 14; removed kicker/unused English key only. Stable positive-first sort runs on a copied rail rows prop; zeros and page totals retained. Frozen elements unchanged.
- [x] CB21.1 withdraws the prior one-pixel rule. Placeholder terms: 18+11+5+20.9+8+36.25+12+14+156+18=299.15 out; signed-in adds 10+17.4+10+12=49.4 → 348.55. Comment documents unknowable wrapping, two-line lede/one-line slab, 18.125/17.4 per extra line, accepted wide error, CSS quantisation and external-margin exclusion. No fudge factor or measurement machinery.
- [x] Measured at BOTH 320/390: out 299.140625 vs 299.15 (+0.009375 placeholder excess), in 348.53125 vs 348.55 (+0.01875). At BOTH 628/1280: out 281.015625 (+18.134375 excess), in 330.40625 (+18.14375 excess), accepted one-line-lede wide cost. 48 synthetic actual-component measurements; screenshots reviewed, zero page errors. 390 exposes one full tile +174px of second; first Eagles tap opens eagle callback.
- [x] Only authorised rareAir.test.ts:36–38 exact assertions changed 178→156, 324→299.15, 373→348.55; original case/name retained, no deletion. Full `bunx vitest run`: before 1,998/267 → after 2,001/268, zero failures. +3 solely new rareAirOrder.test.ts: stable positive-first groups; all zeros retained; input/first totals row unchanged. Preview build OK 2026-10-21T10:26:10Z. No SQL/migrations/RPC/feed_config/cap changes.
- [ ] Real-data screenshot blocked by externally managed Supabase: existing anonymous get_feats_window HTTP 401/code 42501, `permission denied for view whs_friend_matches`. No SQL/credentials requested. Files report CB21_CB21.1_report.md and explicitly synthetic ordinary screenshot supplied; production leading feat not claimed.

## CB17 — Two copy changes on the gate card
- [x] Read-only audit found no test asserting the body string or bullet count; no existing tests changed, added, deleted, renamed or rewritten.
- [x] English body adds “an official synced handicap”; bulletCourses is “Your rounds across the world's best courses”, last in GateCard’s existing array. No presentation/state/logic/analytics/frost changes; REVEAL remains 300. No SQL/migrations/RPC/feed_config/cap changes.
- [x] Full `bunx vitest run`: 1,989 passing / 264 files before -> 1,989 passing / 264 files after, zero failures, no inventory delta. Preview build OK at 2026-10-21T09:02:58Z.
- [ ] STOP — shortest phone rendered, 320 × 568: actual RoundsGate component with real router/English i18next/global CSS in isolated Chromium page, nonempty pool and no outer chrome, card top 300, height 417.703125, bottom 717.703125 (149.703125 beyond viewport); CTA top 617.953125/bottom 666.203125, secondary top 679.203125/bottom 695.703125. Both actions require scrolling, so short-phone acceptance fails even without header/nav. No trimming or REVEAL/layout adjustment made; awaits Ben’s ruling. At current 394 × 970, isolated card top 300/height 365.203125/bottom 665.203125, CTA bottom 613.703125, secondary bottom 643.203125, both fit. Screenshots reviewed; zero final harness page errors. Hosted authenticated placement remains unverified on external_unmanaged Supabase; isolated measurement suffices to demonstrate the failure. Browser harness lives only in /tmp/browser/cb17, no app fixture route added.

## CB16 — Competition boards say whose field
- [x] Read-only wording/test audit and full `bunx vitest run` baseline: 1,988 passing / 264 files, zero failures, matches last reported total. No existing test asserts subtitle player/players; shared subtitle default also says players. Separate card CTA uses `seeAllPlayers` / "See all players" and four existing tests protect/select it at competitionBoards.test.tsx:59,68,79,91.
- [x] Ben authorised changing CTA/fallback and only four named test lines, with before/after assertion report. Added requirement: use existing `amateur.leaderboards.seeAllMembers` if plain duplicate and delete competition key. Search confirms both are plain strings without count or pluralisation, and only CompetitionBoards reads the competition key.
- [x] English subtitle count nouns and shared fallback now say members; new `amateur.competitions.fieldLimit` renders exact copy beneath sheet subtitle and above Heads at 11.5px/A.DIM, no icon/panel/card explanation. CTA reuses `amateur.leaderboards.seeAllMembers`; unused English competition key deleted. Ranking/figures/mark/colours unchanged; module header documents member-field ownership.
- [x] Full `bunx vitest run`: 1,988 passing / 264 files before -> 1,989 passing / 264 files after, zero failures. Delta +1 solely competitionBoards.test.tsx `CB16 renders the member-field limit only in the sheet, never on the rail card`; no tests deleted or renamed. Four authorised button-name lines only: :59 asserts two buttons; :68 opens full-field sheet; :79 asserts CTA exists for three members; :91 opens sheet for Competition/trophy test — each exact `See all players` lookup changed to `See all members`, all other existing assertions unchanged. Preview build OK 2026-10-21T08:50:50Z. Live /amateur opens with zero page errors but no competition cards; authenticated populated-sheet visual check unavailable on external_unmanaged Supabase, not claimed. Real component/provider test verifies card CTA -> sheet and limit placement. No SQL/migrations/RPC/feed_config/cap edits. Full report in Files CB16_report.md.

## BRIEF_TOP_TEN_OWNER_NAME_LABEL — Row score centring follow-up
- [x] Preserved owner-name helper and labels; both row score columns now use display flex, flexDirection column, alignItems center, minWidth 42 and flexShrink 0; figures and labels use whiteSpace nowrap. Photo pills, font sizes/weights/spacing/colours, header and other strings unchanged. Local helper header corrected to describe minimum-width rows rather than fixed-width rows.
- [x] Full `bunx vitest run`: 1,987 passing / 264 files before -> 1,988 passing / 264 files after, zero failures. Delta +1 solely `src/test/topTenOwnerLabelRender.test.tsx`: `both row score columns centre non-wrapping figures and labels with a 42px minimum` asserts flex/column/center/minWidth 42px/flexShrink 0, no fixed width and non-wrapping children. No existing test deleted, renamed, rewritten or assertion changed; topTenTileWidth untouched. Preview build OK 2026-10-21T08:40:10Z. Browser at 415x970 redirects the actual profile to /auth, zero page errors; screenshot reviewed, authenticated visual centring remains unverified on external_unmanaged Supabase. No SQL/migrations/RPC/feed_config/cap changes.

## BRIEF_TOP_TEN_OWNER_NAME_LABEL — The score label reads the owner's name
- [x] `ownerScoreLabel` exported from ProfileTopTenRail.tsx: trim, empty/null -> null, over nine characters -> first eight + `\u2026`. `pillKicker` is now `isOwnProfile ? t('topTen.you','You') : (ownerScoreLabel(ownerName) ?? t('topTen.them','Them'))`, so one value feeds the glass pill on tiles 1-3 and the label under the score in rows 4-10. Uppercase styling, sizes, colours and layout unchanged; header sentence and every other string untouched; `topTen.them` kept as fallback.
- [x] New `src/test/topTenOwnerLabel.test.ts` (5 helper cases incl. exactly-nine stays whole) and `src/test/topTenOwnerLabelRender.test.tsx` (5 render cases: label appears five times = three pills + two rows, name present in pill and row, `Them` fallback on null, clipped name reaches the pill, own profile still `You`). The render case sits in a `.tsx` sibling because JSX cannot live in the named `.ts` file; its mocks are copied in full from topTenTileWidth.test.tsx with `t` additionally honouring a string default.
- [x] No existing test assertion changed: grep found no test asserting the text "Them" (topTenTileWidth.test.tsx renders the visitor rail but never asserts the label). Full `bunx vitest run`: 1,977 passing / 262 files before (CB15) -> 1,987 passing / 264 files after, zero failures; delta +10 tests / +2 files, all in the two new files. `tsgo --noEmit` clean; preview build OK 2026-10-21T08:37:32Z. No SQL/migrations/RPC/feed_config/cap changes.


## CB15 — Instrument the gate
- [x] Four RoundsGate-only events: rounds_gate_viewed, rounds_gate_connect_tap, rounds_gate_no_handicap_tap, rounds_gate_sheet_row_tap. Payload is { gate_state: 'gated' }, with row: 'england' | 'club' only for row taps. ProfileHero convention is analyticsEvents.track('profile_hero_stat_tap', { stat }); snake_case names and a minimal property object. Existing analytics envelope owns user_id/session_id/page/path/build/ua; no country or WHS/member identifiers added. Club remains an unlinked div; taps only report, no new action. Gate presentation, copy, states, predicate, frost and destinations untouched.
- [x] Impression ref set before track, empty-dependency effect, no cleanup reset: once per mount including StrictMode replay and settled-query rerenders. Existing ScoresLeaderboardsPage mounts RoundsGate only for gated; loading/signedOut/connected cannot emit. Local ownership documented in RoundsGate header under root architecture budget rule; root AGENTS unchanged.
- [x] Full `bunx vitest run`: before 1,968 passing / 261 files; after 1,977 passing / 262 files, zero failures. Delta +9 solely new src/test/roundsGateAnalytics.test.tsx: once with replay/rerenders; three excluded-state cases; genuine remount; connect CTA; no-handicap opening; England row; club row. No existing test deleted, renamed, rewritten or assertions changed; CB14 cases untouched. Preview build OK 2026-10-21T08:26:52Z. Integration tests exercise actual gate/sheet with real router/i18next and intercepted analytics; authenticated hosted write/readback unavailable (external_unmanaged), not claimed.
- [x] Existing WhsConnectScreen.tsx:237-271 fires whs_connect_succeeded after successful connect response and connection-query invalidation, payload { country: country?.id ?? null }; join using existing analytics row user_id, with session_id for same-session funnels and event chronology. No completion event added. This is connection success, not an ongoing active-status measurement or later disconnect report. No SQL/migrations/RPC/feed_config/cap changes. Prior CB14.1 key conflict remains out of scope. Report: /mnt/documents/CB15_report.md.

## SR1 — Standout rounds
- [x] Added the four-row read and section below scope chips (Ben's placement ruling), consuming state.filters from useAmateurBoardState and the same boardRowPress callback. Callback parameter narrowed to its existing score/user fields; handler body unchanged. courses namespace, English only. Frozen files/tests, RPCs, SQL, migrations, feed_config and cap untouched. Local headers own architecture; root AGENTS addition rejected by size budget, no root change.
- [x] `npx vitest run`: 1,939/257 before -> 1,955/258 after, zero failures; +16 solely src/test/standoutRounds.test.tsx, no existing test edits. Preview build OK. Chromium real-component isolated transport: all four taps return corresponding score id; scope/window args and right label change together; no page errors; screenshots reviewed. Hosted authenticated acceptance unavailable (external_unmanaged).
- [ ] STOP — SR1.14 says “the mock is 345px”, but Chromium measures the attached mock's kicker-to-final-border height as 365.3125px, both at original 400px and adjusted 390px width. New section at 390px is exactly 365.3125px (row heights 90.375/90.375/90.375/74.1875). Await ruling on contradictory stated height; no arbitrary trimming or forced fixed height applied.

## CTA1 — White solid account-sheet buttons
- [x] Cta background A.AMBER -> A.INK, foreground A.CANVAS unchanged; removed amber from its doc comment. All three PreIndexCards callers deliberately share this change; Door and other amber details untouched. No test edits or added colour assertions.
- [x] Read-only hide-gate audit: ProfileSheetV2.tsx:149 reads profileQ, :159 passes hide_handicap_chip, :277-280 passes derived state to SheetCards. sheetState.ts:67/69/71 returns business/unsettled/hidden before any none/manual/connected state; SheetCards.tsx:29-32 returns null for those kinds. No connect path when the supplied flag is true.
- [x] Exact command `npx vitest run`: before and after 1,913 passing / 249 files, zero failures and no inventory delta; profileSheetRebuild.test.tsx fingerprint unchanged. Preview build OK. Chromium component fixture: all three buttons background rgb(248,250,252), text rgb(10,10,12), marginTop/padding 14px, all navigate /manage/handicap; Door rgb(247,147,30). Screenshot reviewed. Hosted authenticated account-sheet flow not verified on external/unmanaged Supabase. Only application edit is token swap/doc comment; no SQL/migrations/RPC/feed_config/cap changes.

## CEX1 — Crop the connect example
- [x] Applied wrapper opacity 0.5/maxHeight 205/overflow hidden/both masks; example-only axis removed; counting props false/0/0, unused fixture fields removed; English rest and fallback matched. Connected counting gate, handlers, controls and ProfileHero gates untouched. Crop derivation documented in local header; no structural changes.
- [x] Exact command `npx vitest run`: before 1,910 passing / 249 files -> after 1,913 passing / 249 files, zero failures. Brief's 1,908 / 248 predates the +2 profileHeroClubWhite tests already reported. Three added cases solely heroConnectExample.test.tsx: wrapper style; example axis/counting absence; connected axis/counting presence. Sole authorised rewrite: `supplies both movements, five approved round figures and two counting rounds` renamed `supplies both movements and five approved round figures`, dropping only `expect(CONNECT_EXAMPLE.countingN).toBe(2)` because fixture counting data no longer displays. All 12 other existing blocks byte-identical; heroConnectPanel.test.tsx untouched.
- [x] Chromium actual ProfileHero fixture at 390px: panel 305px (NOT requested 308.8), display 205px, lead 18.75px/one line. Retained shipped line boxes/actions differ from standalone mock; no frozen typography/gap nudged. Connected shared display normalized DOM, every element rectangle and screenshot pixels identical before/after at 390/1280px. Screenshots reviewed, zero fixture page errors. Hosted /profile redirects /auth; authenticated acceptance unavailable on external/unmanaged Supabase.
- [ ] STOP — preview typecheck errors survive finished edit: `src/test/heroConnectExample.test.tsx(45,102): error TS2769: No overload matches this call. The last overload gave the following error. Object literal may only specify known properties, and 'initImmediate' does not exist in type 'InitOptions<unknown>'.` And `src/test/heroConnectExample.test.tsx(63,27): error TS2551: Property 'WebkitMaskImage' does not exist on type 'CSSStyleDeclaration'. Did you mean 'webkitMaskImage'?` No corrective edits made after stop; await authorization. Also report 305 versus 308.8 without changing frozen styles. No SQL/migrations/RPC/feed_config/cap changes.

## BRIEF_PROFILE_HERO_CLUB_WHITE — Home club line reads the name's colour
- [x] ProfileCoverBand subline div colour W_55 -> '#FFFFFF' (the h1 name's value); fontSize 12.5, fontWeight 600, marginTop 3, textShadow '0 1px 8px rgba(0,0,0,0.5)' and single-line ellipsis untouched. "Add your home club" button keeps W_55 (prompt, not information); W_55 import retained — still used by that button, HeroShell and BusinessProfileHero.
- [x] New src/test/profileHeroClubWhite.test.tsx (2 cases): subline "Kristianstad Golf Club" colour equals #FFFFFF, equals the h1's colour and is not W_55, with the frozen line properties asserted; add-home-club button colour still W_55. No existing test deleted, renamed or rewritten.
- [x] `npx vitest run`: before 1,908 passed / 248 files -> after 1,910 passed / 249 files, zero failures. Delta +2 tests / +1 file, all in the new file. Preview build OK. Live signed-in profile view unverified — /profile redirects to /auth and Supabase is external/unmanaged, so no session can be minted.

## CEF1a — Superseding test handles
- [x] Exact example-only chart/index handles added; example forwarded into local IndexChart and attribute applied directly to existing button, no wrapper. All three handler families remain undefined in example mode, tabindex -1; connected attrs undefined. Original nine CE1 test blocks byte-identical. CEF1 chart/index selectors updated under CEF1a, all prior assertions retained; added tile/index button structure assertions and one connected handles/analytics case.
- [x] Exact command `npx vitest run`: verified pre-CEF1 baseline 1,904 passed / 248 files -> CEF1 intermediate 1,906 passed + 1 failed = 1,907 / 248 -> final 1,908 passed / 248, zero failures. +4 relative to CE1 solely heroConnectExample.test.tsx (form, chart, index no analytics/navigation; connected handles absent and chart/index analytics retained). No tests deleted/renamed, no existing assertion rewritten. CEF1a expressly supersedes prior selector stop.
- [x] Actual shared display browser comparison against /tmp/cef1/HeroHandicapDisplay.before.tsx: connected DOM identical after generated SVG ID normalization; every element rectangle and screenshot pixel-identical in both modes at 394/1280px. All seven example buttons clicked without inert emit no analytics/navigation and have tabindex -1; connected chart/index analytics retained, no handles. Nine counting/person forms character-identical with real English i18next, zero page errors, screenshot reviewed. Wrapper/actions/gates untouched. Temporary harness import.meta initialization fault corrected only in /tmp, no application affordances. Preview build OK. Hosted authenticated profile verification remains unavailable on external_unmanaged Supabase. English keys already correctly carried from CEF1; orphan grep empty, other locales untouched. No SQL/migrations/RPC/feed_config/cap changes. Local tap ownership remains in module header; no new architectural structure.

## CEF1 — Example tap suppression and English copy
- [x] Example index/chart/form handlers now receive undefined in example mode and tabIndex -1; connected handlers retain their original branches with undefined tabIndex. Inert, element types, styles, fixture, gates and existing assertions unchanged. Grep found the three connectPanel keys only in English definitions; removed those three lines and added ten counting keys with exact text, leading spaces and n/name placeholders; inline defaults and other locales untouched.
- [x] Historical STOP resolved by superseding CEF1a above — exact command `npx vitest run`: before 1,904 passed / 248 files; intermediate 1,906 passed + 1 failed = 1,907 tests / 248 files (247 passed, 1 failed). Delta +3 solely heroConnectExample.test.tsx: form tiles, chart, index no-analytics/no-navigation. Failure was new chart case at src/test/heroConnectExample.test.tsx:59:19: `AssertionError: expected null to be an instance of HTMLButtonElement`. No correction made until CEF1a provided exact handles and selector authorization. Final counts and verification above.

## CE1 — Shared handicap example
- [x] Shared real handicap rendering extracted; fixed example uses it with one 0.32 opacity wrapper, undimmed pill, ink Connect and existing decline-hook toast. No transient line or optimistic removal; gate, page, counters and divider frozen. Counting fallbacks carried unchanged. Decline-hook mocks added in both existing hero test files under explicit ruling; no real decline hook in unit tests.
- [x] Verified full connected DOM equality for owner, visitor and fallback index (generated SVG ids normalised); example, pill, five tiles, Connect, Hide once, query-driven removal and later mount checked at 394/1280px, zero page errors/overflow. Single opacity 0.32; screenshots reviewed. Counting keys deliberately remain absent with unchanged fallbacks; separately briefable, not changed here. Local shared-render ownership lives in HeroHandicapDisplay.tsx header under AGENTS size-budget rule; root remains unchanged.
- [x] Exact command `npx vitest run`: 1,895 passed / 247 files before -> 1,904 passed / 248 files after, zero failures. Delta +9 solely heroConnectExample.test.tsx: own profile; hidden setting; other profile; connected; unsettled; fixed/non-member index; pill parity; fixture values; decline once/query-driven removal/next visit. Targeted command `npx vitest run src/test/heroConnectExample.test.tsx src/test/heroConnectPanel.test.tsx src/test/profileBioFull.test.tsx`: 20 passed / 3 files. Mock-only setup sufficed; no provider fallback. Preview build OK. Hosted sign-in/write/readback remains unverified on external_unmanaged Supabase.
- Existing rewrite report: only case `renders for a member with no connection on their own profile` in heroConnectPanel.test.tsx changed three authorised assertions: `expect(panel()!.querySelectorAll('[data-ghost-tile]')).toHaveLength(5)` -> example form tiles count five; `expect(panel()!.querySelectorAll('[data-ghost-label]')).toHaveLength(2)` -> two nonempty retained labels; `expect(panel()!.querySelectorAll('button')).toHaveLength(1)` -> two buttons within example actions. Why: worked example replaces outline and gains Hide action; illustrative display buttons are inert, not actions. No case renamed/deleted; label-matching regression untouched. profileBioFull.test.tsx received only decline-hook mock, no assertion edits.
- Render report: unconnected own profile = worked example; setting off = absent; immediately after Hide = remains until loaded hide flag returns, existing hook toast only; next visit after successful hiding = absent without replacement text; connected = original display unchanged. No SQL/migrations/RPC/feed_config/cap changes.

## Review receipt average line
- [x] Row a uses the displayed community average for its comparison, handles equal and first-rating states, and keeps all existing layout and tone tokens. Module header documents average ownership; avg_before remains in the receipt data contract but is no longer read by this row. Frozen mock differences retained: hero top spacing, breakdown geometry and footer differ from the mock; no changes outside row a adopted.
- [x] Updated the five receipt strings in en/de/es/ja/ko/en-XA; added seven cases solely src/test/reviewReceiptAverageLine.test.tsx with a real English i18next provider. No existing test changed, renamed, removed or rewritten.
- [ ] STOP — `npx vitest run`: before 1,872 passed / 243 files, zero failed; after 1,878 passed + 1 failed = 1,879 tests / 244 files (243 passed, 1 failed). +7 solely the new receipt file: displayed-average/below, above, equal, rounded-equal, one-rating, null-average, missing-overall. Six new tests passed; missing-overall case failed at src/test/reviewReceiptAverageLine.test.tsx:70:12, helper :31:32: `TestingLibraryElementError: Found multiple elements with the text: (_text, element)=>element?.textContent === '3 members rate Quinta do Lago Laranjal 7.8 on average' && element?.tagName === 'DIV'`. With no second line both the row wrapper and first-line div match the selector. No test or app correction made after this failure; await permission to narrow that selector. Preview build OK. Browser/mock geometry and hosted authenticated receipt flow not verified after the stop. No SQL/migrations/RPC/feed_config/cap changes.

## Review tile COURSE without reopening
- [x] COURSE closes the existing overlays in order and navigates with highlight only; share URL, See all and profile actions unchanged, shared/notification review links retain sheet opening.
- [x] Highlight-only targets wait for loaded reviews, scroll and expire after three seconds without changing sheet phase; unknown ids clear. SingleReview/FewReviews pass through the existing pulse so all populated sample states honour highlighting without new styling. Local ownership documented in CourseReviewsTab's header.
- Exact command `npx vitest run`: before 1,862 passed / 242 files, zero failed; after 1,872 passed / 243 files, zero failed. +10 solely src/test/reviewCourseNoReopen.test.tsx: two COURSE exits (with/without id), four populated sample states (1/3/6/10), delayed loading, unknown target, and two sheet-opening aliases (review/reviewId) including dismissal timing. No existing tests changed, deleted, renamed or rewritten. Build OK. Chromium public entry reached /auth with zero page errors; hosted authenticated COURSE flow remains unverified because Supabase is external_unmanaged. No SQL/migrations/RPC/feed_config/cap changes.

## Launch notch colour
- [x] First native status-bar request uses STATUS_BAR_CANVAS and white-icon intent; central route chrome starts before React and retains immersive Home behaviour. Ownership documented at the boot call and bridge initialization.
- `npx vitest run`: before 1,859 passed / 241 files; after 1,862 passed / 242 files; zero failures. +3 solely src/test/launchStatusBar.test.ts (first request, delayed readiness, immersive handoff); no existing tests changed. Preview build OK. Real app Chromium at 430x786 with early/delayed simulated Median bridge sends the correct first payload, renders html/body/root rgb(10,10,12), and reaches /auth signed out without page errors. Physical iOS splash handoff and Median's pre-JavaScript wrapper settings remain unverified; hosted authenticated Clubhouse acceptance unavailable on external/unmanaged Supabase.

## FGT1 — Two FGD1 leftovers
- [x] FGT1.1: two case names in src/test/feedRoundNet.test.tsx renamed to match their unchanged assertions ("a gross birdie on a stroke hole grades in the birdie tone", "a gross bogey on a stroke hole grades in the bogey tone"). No assertion, fixture, import or other case touched.
- [x] FGT1.2: dead `received` parameter removed from feedHoleDots (src/components/feed/roundTilePlot.tsx:121) and dropped from all four call sites — roundTilePlot.tsx:222, feedRoundNet.test.tsx:95 and :100, feedGrossDots.test.tsx:45. RoundTilePlot's own `received` prop is untouched and still feeds the net trace and fill; roundTilePlot.test.tsx already called the function without the argument.
- [x] FGT1.2 leftover (FGT1.2_R ruling): deleted the two now-unused `const received = feedStrokesReceived(...)` lines at feedRoundNet.test.tsx:94 and :99. No import removed — `feedStrokesReceived` is still read by other cases in the file, as are `TOPAR_UNDER_DARK` and `SC_BOGEY_DARK`. No assertion, case name or fixture touched.
- Full `npx vitest run`: 1,859 passing / 241 files before and after, zero failures; build OK. No test added, removed, renamed or reasserted in this step. No SQL/migrations/RPC/feed_config/cap changes. Ben approved the roundTilePlot.tsx:119-120 comment rewrite retrospectively.


## FGD1 — Gross dots, net line
- [x] Gross-only Home dot grading restored; only two authorised FN1 assertions updated, original case names retained under assertion-only scope. Added three cases solely feedGrossDots.test.tsx. Full npx vitest run: 1,856 passing / 240 files before -> 1,859 passing / 241 files after, zero failures; build OK. Browser actual plots with synthetic rounds verified red stroke-hole birdie, sixteen bogey dots/net -4 and five red/no gold, zero page errors. Actual nickleconte204 Old Fold Manor hole data and hosted authenticated acceptance unavailable; five red is implied by five gross birdies, no handicap-created gold remains, genuine gross eagle-or-better would remain gold. Report: /mnt/documents/FGD1_report.md. Net trace/fill/figures, allocation, FED1 condition, tones/radii/thresholds, feats and Explore frozen; no SQL/migrations/RPC/feed_config/cap changes.

## FED1 — Finish marker
- [x] Home and Explore line-only terminal circles now yield to a dot at the final series index; only one terminal-circle condition changed in each permitted component. Unmarked endpoints retain the unchanged ink terminus. TrajectoryLine and existing tests untouched. Full `npx vitest run`: 1,850 passing / 239 files before -> 1,856 passing / 240 files after, zero failures; +6 solely src/test/feedEndDot.test.tsx (Home birdie/par/double/unscored, Explore supplied birdie/unmarked). Build OK. Browser actual plots verified all eight Home/Explore finish cases, zero page errors; synthetic fixture only, not hosted authenticated acceptance. Explore still supplies achievement dots only, so par/double finish with ink there. Real partial feed rounds end at the last retained played/scored hole, not a fabricated unplayed endpoint.

## BRIEF_SPORTRADAR_QUOTA_FIT
- [x] Centralized UTC cadence, explicit pre-event rounds 1/2 and in-play next round, gated routine requests, preserved minute local work/finalization, and logged all actual provider fetch sites. `npx vitest run`: 1,823/237 before -> 1,835/238 after, zero failures; +12 solely sportradarCadence.test.ts, existing tests untouched. Actual syncTournament isolated hour verified rounds 2/4 and 60 local writes. Preview build OK; hosted cron/execution/quota unverified without external access. Report /mnt/documents/SPORTRADAR_QUOTA_FIT_report.md includes full source-evidenced schedule inventory, absent live-round scores in live-sync's own writer, and 6,000/week versus rolling-plan arithmetic.

## FUP1 — Home under-par fill
- [x] Shared fill-only mechanism; Home uses dark-surface red, Explore retains photo red; ink stroke/scale/dots/baseline/other branches and existing tests unchanged. `npx vitest run`: 1,818/236 before -> 1,823/237 after, zero failures; +5 solely feedRoundUnderParFill.test.tsx. Preview build OK. Actual-chart fixture at 1280/524/390 widths verified states and IDs without overflow/errors. [0,-1,-3,0]: y1=29.5/y2=94; supplied minimum y=72.5 (21.5 gap), actual smooth minimum≈72.5912 (21.4088 gap). Hosted Home authentication unavailable. Shared ownership documented in new module header; root note rejected by size budget, root unchanged. Report /mnt/documents/FUP1_report.md.

## BRIEF_COURSE_REVIEWS_MATCH_1 (CRM1)
- [x] WhatPeopleSay moved onto the Reviews tab's source (useCourseReviewSample + reviewsCommunitySample, wired as CourseReviewsTab wires it); aggregates/user-rating hooks removed. Headline key unchanged, fed the viewer-excluding pair; Reviews-style figure row (ink 48px score, tier over numeral count, amber YOU pill); CategoryBands extracted byte-identical from FewReviews to course-detail/CategoryBands.tsx and shared by both tabs; only-rater state added (en keys youFirst/youFirstBody); CountSlot removed, basedOn key left with no readers. Three authorised assertions changed in place in courseRatingConsistency.test.ts; no tests added/deleted. Full npx vitest run: 1,811/235 before and after, zero failures. Build OK. Live course page verified signed-out: 4 band rows, community score, no pill. CRM1.11a: PAGE_SIZE 500, no page cap, no truncation — loop fetches until a short page; mid-pagination error throws rather than presenting a partial sample. Report: /mnt/documents/CRM1_report.md.

## BRIEF_TOUR_CHAMPION_AVATAR_CANDIDATES
- [x] Carried winner override/key through existing reads and full candidate list into ChampionStrip; added three cases in tourChampionAvatarCandidates.test.tsx. Full npx vitest run: 1,812/234 to 1,815 passing/235 files, zero failures; no existing tests changed. Build OK; actual strip browser mount verified fallback walk and EL initials. Hosted Tour flow unverified. Shared fallback helper ignores identity key, so distinct hue not claimed; frozen helper unchanged. Report: /mnt/documents/BRIEF_TOUR_CHAMPION_AVATAR_CANDIDATES_report.md.

## BRIEF_AVATAR_CACHED_PHOTO_STUCK
- [x] Changed only SquircleAvatar's decoded-image layout-effect guard/dependencies; added two regression cases in SquircleAvatar.cachedPhoto.test.tsx. Full npx vitest run: 1,810 passing / 233 files baseline to 1,812 passing / 234 files, zero failures; +2 from the named new file, no existing tests changed. Browser actual-avatar mount verified cached A remains visible after [A,B,C] to [A,C,B], and new D remains hidden until load. Build OK. Hosted Tour switching remains unverified; Tour code, candidate walk, fallback and styling unchanged.

## BRIEF_REVIEWS_HEADER_1 - REVIEWS_HEADER_1
- [x] FOUR AUTHORISATIONS applied: five-to-nine tier/count swap; shared pill, names line, fixed heading, category tones and paragraph removal; orphaned finding/highest derivations removed. Four authorised cases deleted and only RH9f/g assertions changed. Full npx vitest run before 1,815/235 and after 1,811/235, zero failures; accepted 1,812/234 plus three previously reported Tour-avatar cases minus four deletions. Build OK. Real FewReviews fixture checked at 320/390/628/1280 widths, positive/negative/zero delta, no overlap/overflow; hosted authenticated flow unavailable. Report and both screenshots in Files: REVIEWS_HEADER_1_authorisations_report.md.
- [x] RH1/RH11 complete: shared tier/count stack applies to two-to-four; only the third assertion removed from the existing three-case loop. Sole other tier-word absence guard is the zero-rating State 1 test, untouched. Full npx vitest run unchanged at 1,811 passing / 235 files, zero failures; build OK. Both real-component fixture phones inspected at 320/390/628/1280 widths with no overlap/overflow; hosted authenticated reads unavailable. REVERSED RULE recorded; report and screenshots: REVIEWS_HEADER_1_RH11_report.md. No remaining REVIEWS_HEADER_1 blocker.

## BRIEF_REVIEWS_FEW_COPY_1 - REVIEWS_FEW_COPY_1
- [ ] Blocked before implementation by FC8: reviewsState3.test.tsx:46,99 protects the old headlines; reviewsState4.test.tsx:96-100,106 protects the finding paragraph. Await explicit test authorization. Also resolve FC7's retained count/spread assertions after removal of their element, and FC5's shared one-rating-row effect versus the scope freeze. No application or test edits; no tests run. Last reported full suite: npx vitest run, 1,810 passing / 233 files.

## EDGE_KEY_1 — EK6 PARTIALLY LIFTED (one value)
- [x] Removed the `marginTop={6}` override on the Facts call in `EdgeSection` (`ManySections.tsx:256`), so the strip falls back to the component's owned default of 15; no literal typed. Reading confirmed first: `EdgeSection` returns null when `s.measured.length === 0` and the key's `drawn` set uses the identical `edge != null` predicate, so the tiles can never sit under a bare chart. Measured in a temporary fixture (deleted): 11px above the key, 15px below. `npx vitest run`: 1,810 passing / 233 files, zero failures, no test changes; build OK. Report: `EDGE_KEY_1_EK6_report.md`.

## BRIEF_YOU_TAB_COPY_1 — YC3 FOLLOW-UP
- [x] Collapsed the two `thinNines` branches in `GoodRoundsSection` to one: the `n < SMALL_SET` conditional is gone, so both cases print "The nines rest on the {X} of your {total} rounds that recorded both." `thinNines` gate unchanged.
- [x] SMALL_SET had no other consumer in `ManySections.tsx` (only the removed branch), so its import was dropped; the export stays in `youDerivations.ts` and no other file imports it. npx vitest run: 1,810 passing / 233 files, zero failures, no test changes; build OK.

## BRIEF_VERDICT_COPY_1 — VERDICT_COPY_1
- [x] Ben's ruling recorded: the build wins on all three disputed frozen values (Said 12.5/1.55/A.BODY, TILE_FILL 0.05, 12px title-to-figure gap); VC2 extension retained as built; everything else accepted as built. Mock-authority rule saved to memory: a mock is spec only for what a brief changes; on frozen elements the build wins and the difference is reported, never silently adopted. No code or test changes this turn; last full suite npx vitest run: 1,810 passing / 233 files, zero failures.

## BRIEF_TAB_CANON_1 - TAB_CANON_1
- [x] TC5 FINAL authorises populated-grid-first and every additional first-element path on all tabs; path names are a floor and counts are agent-enumerated. Existing source readings confirmed with TC10's explicit WhatTheyScored exception. No changed-value protecting tests found. Baseline 1,810 passing / 233 files.
- [x] Applied shared first-element rules to Course/Champions/Reviews/Media; You gap rules and later seams untouched. All genuine section pairs read AboutSection canon; protected labels retained; Elsewhere rule restored.
- [x] Nearby local canon opt-in preserves 16px gutter; 17 other SectionHeader usages unchanged. 61 acceptance samples measured 22px at 1280/628 widths (reconstructed before values and fixture limits reported). npx vitest run: 1,810 passing / 233 files, zero test changes; build OK. Report /mnt/documents/TAB_CANON_1_report.md. Hosted authenticated acceptance unavailable (external_unmanaged); populated grid root geometry verified, real account content unverified.

## BRIEF_TAB_LEAD_IN_1 - TAB_LEAD_IN_1
- [x] Ben resolved TLA3: Elsewhere remains unchanged; only four primary Champions states receive first-section treatment.
- [x] TLA2R resolves the You baseline stop: all six branches and conditional first-rendered alternatives are in scope, including both skeletons; later Sec/AboutSection seams stay unchanged.
- [x] Course override removed; wrap-scoped You first-rendered section rule covers six branches/conditional fallbacks and both skeleton wrappers without touching Panel interior. Four explicit Champions first markers; Elsewhere/later sections unchanged. Full npx vitest run before/after: 1,810 passing / 233 files, zero failures/delta; no tests modified/added/deleted. Preview build OK 11:39:45Z. Isolated actual-section Chromium measurements at 1280px and 628px: all 23 first-element alternatives 22px; before reconstructed with original inline spacing; later AboutSection 34px, later Champions 20px, signed-out Panel 16px interior retained. No page errors; screenshots reviewed. Hosted six-branch authenticated acceptance unavailable on external unmanaged Supabase; actual full CourseYouTab branch rendering not claimed. Report TAB_LEAD_IN_1_report.md in Files. Local ownership documented in youLeadIn.css; root AGENTS addition rejected by size budget, so root unchanged under local-header rule.
- [x] Ben corrected the report measurement to FIRST ELEMENT top edge, excluding signed-out Panel interior. Preserve shared Panel padding and border without any local special-case. Baseline npx vitest run: 1,810 passing / 233 files, /tmp/tab-lead-before.log.

## BRIEF_ROUND_PLOT_SCALE_1 - ROUND_PLOT_1
- [x] ROUND_PLOT_1_R authorises only third expected tone in the ramp test. Derived TOPAR_EVEN_DARK rgba(242,244,247,0.42) over actual Home CARD/FEED_CARD_SURFACE #16161A to #727377; withdrew earlier #6E6F71. Local documented dot token, shared tokens unchanged. Plot SVG 59 -> 102px, unchanged 10px seam gives 69 -> 112px footprint. Per-round range includes zero with symmetric six-stroke floor; panel/mark/series/shared callers unchanged.
- [x] npx vitest run: last reported 1,805 passing / 232 files -> 1,810 passing / 233 files, zero failures; five new range cases solely roundPlotScale.test.ts. Only existing assertion changed: ramp test third tone TOPAR_EVEN_DARK -> '#727377'. No deleted/renamed tests. Preview build OK 2026-10-19T11:00:10Z. Actual populated ExploreCard Home fixture at 430px: tile 223.921875 -> 266.921875px (+43), reconstructed before by restoring SVG height only; chart footprint 112px, opaque dots, no overflow, tap handoff and zero page errors. Screenshot reviewed. Live route /auth; hosted signed-in Home acceptance unavailable on external/unmanaged Supabase. Trace stroke actually 1.8px, not brief's 2.3px; left unchanged under nothing-else-moves rule.
- [x] Confirm clbhouz from project AGENTS.md and existing roadmap. No app/test changes or test commands in this brief; last reported full suite command npx vitest run: 1,805 passing / 232 files, zero failures. This is a historical result, not a fresh run.

## BRIEF_ROUND_TILE_1 - ROUND_TILE_1
- [x] BEA1 finding: RoundShape with null nines and no shape returns null — the tile drew NOTHING, never a degenerate curve. BEA2 premise stale: Clubhouse.tsx already batches useRoundHoleShapes at page level (line 251) into CardFeed.roundShapeMap; no new read added.
- [x] Home-only feedPlot path: new src/components/feed/roundTilePlot.tsx (feedHoleDots every-hole scorecard ramp, feedFeat ace/albatross/eagle via scorecardFeatFor, RoundTilePlot on-canvas trace); ExploreCard feedPlot prop suppresses the photo-foot overlay and draws the plot under the text block; threaded CardFeed.homeRoundPlot -> FeedCard -> ExploreCard; Clubhouse opts in. Explore/Profile never pass it — byte-identical. RoundShape/TrajectoryLine untouched, so no other caller affected (BEA9).
- [x] BEA8 reported: beadForScore does NOT distinguish ace from albatross (both gold at d <= -2); the marker uses scorecardFeatFor, which tests strokes === 1 first.
- [x] Tests: +9 in new src/test/roundTilePlot.test.tsx (ramp grades, skip-unscored, never-green, ace/albatross/eagle naming, no-mark ordinary round, no scoring key). Full suite 1,785/231 -> 1,794 passing / 232 files, 0 failing. No existing test changed. Preview build OK 2026-10-19T09:38:19Z. Hosted authenticated acceptance unavailable on external_unmanaged Supabase.

## BRIEF_PROFILE_SHEET_HCP_1 - SHEET_HCP_1
- [x] SHEET_HCP_1_R3 supplies self-contained design and connected-row HTML; supersedes both historic stops below. Connected ready card replaced by first Handicap row, same ninety-day history/sentence and /handicap handoff. Unconnected PreIndexCards/constants/layout/gating untouched. FormSection and its private geometry deleted; no other production importers. Form-only score read removed. No admin/SQL/migrations/RPC/feed_config/cap/artwork changes.
- [x] Full suite 1,796/232 -> 1,785 passing/231, zero failures: 15 authorised obsolete cases removed (formPlot 5, sheetRuleInset 3, profileSheetV3 2, hcpChartTone 3, profileSheetRebuild 2); four new sheetHandicapRow data-rule cases. Three profileSheetRebuild connected-card cases rewritten; sheetTopV5 unchanged. Exact assertions and reasons in Files SHEET_HCP_1_R3_report.md. Preview build OK 08:38:06Z; isolated actual-row /handicap handoff and 73.5px row height with no overflow at 393/524/1280 verified; screenshot reviewed. Hosted authenticated acceptance unavailable on external_unmanaged Supabase. No test failure occurred; temporary checker default-import faults corrected only under /tmp.

## BRIEF_REMOVE_STALE_ADMIN_GUARD_TEST
- [x] Deleted only the "no admin file changed in this brief" it block in src/test/holePhotoTagging.test.tsx and its now-unused execFileSync import. Nothing else changed. Full suite 1,796 passing / 232 files, 0 failing; preview build OK 2026-10-19T08:10:01Z.

## BRIEF_TOUR_RANKINGS_OPEN_PLAYER_FIX1
- [x] Every row button and chevron; linked precedence preserved; unique matchKey directory match opens PhotoSheet; ambiguous/missing names open the prefilled directory; leaving clears q.
- [x] Focused 17/17; full suite 1,780/230 -> 1,786/231 (+2 matchKey tests, +4 TourSection.nameFallback tests); one authorised unlinked-row test rewritten, no deletions. Latest preview build OK. Hosted authenticated acceptance unavailable on external_unmanaged Supabase.

## BRIEF_ADMIN_SIDE_MENU
- [x] Ben authorizes Settings remaining at /admin-v2/health?tab=settings; Settings page untouched. Baseline 1,734 passing / 221 files, /tmp/admin-menu/before.log.
- [x] Rebuilt 304px status-board drawer, open-only shared live and Health queries, threshold-mounted Stage 3 search, maintenance pill and identity/build footer. Existing RPCs and hooks untouched.
- [ ] STOP: src/features/admin/AdminDrawer.test.tsx:123:19, test "search prioritizes starting names and caps case-insensitive name, username and email matches at eight": TestingLibraryElementError: Unable to find an accessible element with the role "link" and name "Other". Targeted 10 pass / 1 fail; no assertion changed after failure. Eleven new tests in that file; no existing test rewritten, renamed or deleted. Expected inventory 1,745 / 222 files; full after suite not run because of stop. Preview build OK 2026-10-19T04:29:05Z. Browser measurements/device and authenticated acceptance not run. Await authorization to diagnose this failure; hosted authenticated acceptance unavailable on external/unmanaged Supabase.

## BRIEF_MEDIA_TRUST_1 — MEDIA_TRUST_1
- [x] MEDIA_TRUST_1_R resolves contract: Ben deployed approved-returning retag_hole_photo with same call, and not_your_photo refusal. Preserve RPC; hide that reason's action and show plain refusal. Baseline rerun 1,729 passing / 220 files (/tmp/media-trust-before.log).
- [x] MEDIA_TRUST_1_R2 authorises both named tests: proof-row absence with/without a round; picker submission via chip, preserving preselection assertion byte-identical.
- [x] MEDIA_TRUST_1_R3 supersedes per-test limits with five categories; no unrelated assertions changed. GPS write prohibition deliberate, capture dates retained, columns untouched.
- [x] Approved inserts across pile/known-hole/library/composer; no round matching, pending photograph writes, auto verification metadata or GPS persistence. Round chooser remains an association with unchanged background upload flow. Retag RPC call unchanged; ownership-rejection refusal on row, no action for not_your_photo. Pile/Retag chip and batch chip submit directly; close on successful single/final batch tag, no outcome/confirmation branch; assigned approved pill shows Hole N. State D rejected-only. Removed HolePhotoOutcome, composerVerdictSentence, matchedPhotoRounds/coursePhotoRounds, their consumers/query, verification rows/copy and dead Waiting/verdict styles. No source files/tests deleted; legacy pure payload helper exports have no gate. AGENTS ownership rule updated within budget; no admin/RPC/SQL/migrations/policies/column/feed_config/cap changes.
- [x] Suite 1,729 passing / 220 files -> 1,734 passing / 221 files. +5 solely mediaTrust.test.tsx: ownership-refusal guard; ownership-only hidden action/plain refusal; historical pending State D absence; unreadable original File metadata cannot block approved library insert; association/GPS-independent publication. Twenty existing tests rewritten, none renamed/deleted; exact before/after blocks and complete string/component removal audit in user report MEDIA_TRUST_1_report.md. Logs /tmp/media-trust-before.log and /tmp/media-trust/final.log. Preview build OK 2026-10-18T16:02:45Z. Existing three real JPEG File browser proof passes; isolated actual controls verify preselection, chip submission/closure, Hole 9 readback, final batch closure, known-hole selection closure and ownership-only refusal with zero page errors; screenshots /tmp/browser/media-trust reviewed. Temporary fixture timing fix touched only /tmp. Hosted authenticated submission/readback/privacy/Retag enforcement and composer device acceptance remain unverified: live Sundridge Media says Sign in to view media on external_unmanaged Supabase. This is a verification limit, not deferred application work.

## BRIEF_MEDIA_TAG_FIX_1 — MEDIA_TAGFIX_1
- [x] Confirm clbhouz and report actual fetched-body synthetic File passed at holePhotoData.ts:136 to holePhotoExif.ts:19 before edits. Baseline 1,722 passing / 219 files.
- [x] Skip every URL-only EXIF read; preserve original File/composer proof and Waiting rules. Correct pill/title and genuine-write failure copy. prepareHolePhoto returns empty metadata without fetching or parsing; pile/known-hole insertion uses Waiting without a round query; batch receives empty EXIF. Composer original File branch was not the failing pile call; its no-File URL fallback shared prepareHolePhoto and is now removed. Local library original File parser unchanged; chosen-round composer proof unchanged. No SQL/migrations/RPC/RLS/admin/feed_config/cap changes.
- [x] Full suite 1,722 passing / 219 files -> 1,729 passing / 220 files; +7 solely src/test/mediaTagFix.test.ts: URL-only preparation no-fetch/no-parser; pile/known-hole Waiting insertion/no-round-match; URL-only batch all-wait; URL-only composer no-parser; original composer File identity/metadata; URL-only composer Waiting insert; original library File identity/no-fetch. No existing tests deleted/renamed/rewritten or assertion changes. Logs /tmp/media-tagfix/before.log and after.log; preview build OK 2026-10-18T15:36:57Z. Existing real JPEG browser proof passes all three original File date/GPS fixtures. Actual dialog fixture selection -> Waiting readback verified with zero page errors; screenshot /tmp/browser/media-tagfix/waiting.png reviewed. Temporary fixture createRoot import corrected only in /tmp. Live Sundridge Media shows Sign in to view media; hosted signed-in submission/persistence/privacy and composer device acceptance remain unverified on external_unmanaged Supabase. No authenticated acceptance claim.

## BRIEF_MEDIA_4_R3 — MEDIA_RETAG_1_R
- [x] Deleted State D's separate rejectedPhotoReason map; State D directly imports shared memberReasonSentence. Exactly two tests in mediaEmptyStatesR.test.tsx rewritten under AND3; names retained, no tests added/deleted/renamed or other test changes.
- [x] “unmapped reviewer text maps to neutral fixed reason”: BEFORE `expect(rejectedPhotoReason('internal reviewer note')).toBe('It did not pass review.')` and `expect(rejectedPhotoReason(null)).toBe('It did not pass review.')`; AFTER `expect(memberReasonSentence('internal reviewer note')).toBe(memberReasonSentence('other'))`, `expect(memberReasonSentence(null)).toBe(memberReasonSentence('other'))`, and `.not.toContain('internal reviewer note')`. Why: neutral sentence is owned by shared helper; internal notes never reach members.
- [x] “only the mock supplied exact reason maps to its fixed sentence”: BEFORE `expect(rejectedPhotoReason('The picture is of people, not the hole.')).toBe('The picture is of people, not the hole.')`; AFTER `expect(memberReasonSentence('The picture is of people, not the hole.')).toBe(memberReasonSentence('other'))`, `.not.toBe('The picture is of people, not the hole.')`, and `expect(memberReasonSentence('not_a_golf_hole')).not.toBe(memberReasonSentence('other'))`. Why: withdrawn free-text mapping is not a code; use shared neutral default while recognised code remains distinct.
- [x] Full suite before and after: 1,704 passing tests / 218 files, delta zero, /tmp/media-retag-r/full-suite.log. Build OK 2026-10-18T13:29:23Z; browser actual State D confirms unknown/other/withdrawn free text use “The photo was not a fit for this hole.” without internal-note text, zero page errors; screenshot reviewed /tmp/browser/media-retag-r/shared-default.png. No admin/RPC/SQL/policy/other test changes. ANC7 confirmed by Ben; no further caller work. Hosted authenticated persistence/privacy remain unverified (external unmanaged), not an implementation hold.

## BRIEF_MEDIA_4_R2 — MEDIA_RETAG_1
- [x] Owner rejected-photo Retag uses Ben's deployed retag_hole_photo RPC only; success invalidates owner rows to show Waiting. Actual analysis holes, different-hole guard, refusal/retry verified. No direct member UPDATE/delete, Remove, SQL or deployment changes.
- [x] Contributor helper moved to src/lib/courseMedia/memberReasonSentence.ts with one-argument signature and neutral-only default; only authorised useHolePhotoQueue.ts changed under admin. Audit: rejection notification is note's only consumer; review sheet supplies note, admin/Inbox display codes. Existing optional rejectHolePhoto input and caller untouched.
- [x] State D reason-map hold resolved by MEDIA_RETAG_1_R AND3 above: exactly two existing tests authorised and rewritten; separate map deleted and shared helper imported directly.
- [x] Before 1,694 passing tests / 217 files; after 1,704 passing / 218 files (+10 solely mediaRetag.test.tsx: RPC args, other owner, other course, pending status, unchanged hole, unknown hole, refusal, internal-note non-exposure, picker choice, pending readback). No existing tests deleted/renamed/rewritten. New test selector type error at :58 (`exact` not in ByRoleOptions) corrected before completion; targeted final 19/2 pass, preview build OK 2026-10-18T13:25:44Z. Browser actual hook/picker with isolated RPC transport at 1280x1800 / 393x852: refusal/retry, Waiting readback, no page errors/overflow; screenshots reviewed /tmp/browser/media-retag. Live /auth opens; hosted authenticated persistence/privacy unverified (external_unmanaged).

## BRIEF_MEDIA_4_R — MEDIA_EMPTY_1_R
- [x] ANB2 app wrapper calls onAddFirst() with no click event. Existing mediaEmptyStates.test.tsx unchanged, including `expect(choose).toHaveBeenCalledWith()`; all eleven cases pass.
- [x] A four-item mosaic/See all/closing sentence supplied and implemented; no walk, filters/chips or Tag controls. Canonical FeedCard viewer taps/expanded pagination retained; hero/tabs and populated walk/fast paths untouched. B/C preserved. D read-only owner pending/rejected list counts exact member/course rows, fixed reason fallback, real review date, no internal identity/notes or upload-date fallback. Owner tag reads independent of available analysis; write controls still require holes.
- [x] Prior Retag permission hold superseded by MEDIA_RETAG_1: Ben supplied retag_hole_photo; members never get UPDATE grants. Action implemented above; Remove remains permanently cut. Hosted server privacy still unverified.
- [x] Before 1,685 collected / 216 files (1,684 passed, one known callback failure); after 1,694 passing / 217 files, zero failures. Delta +9 solely mediaEmptyStatesR.test.tsx: combined pending/rejected population; other-member exclusion; other-course exclusion; unmapped reason fallback; exact supplied reason mapping; missing/malformed date; exact owner rows; absent other-viewer display; A no tagging/file choices. No existing test deleted, renamed, rewritten or assertions changed. Full suite /tmp/media-empty-r/full-suite-final.log. Build OK 2026-10-18T13:13:38Z.
- [x] Browser actual-tab isolated checks at 1280x1800 / 393x852: four square tiles 618px/174px; canonical photo opener handoff; See all reveals six loaded fixtures; B all-open unchosen picker then chosen hole; known-hole path no picker; C review-only; D two rows/two images, no other-member image/internal text/Remove; zero page errors/overflow. Screenshots reviewed /tmp/browser/media-empty-r. Temporary harness provider URL/Close-selector faults corrected only in script. Live /auth opens. This is not authenticated acceptance: external_unmanaged blocks upload/persistence, complete fullscreen and backend privacy/retag permission checks. No SQL/migrations/RPC/edge/admin/feed_config/cap/artwork changes. Local state headers own architecture; root pointer added within budget.

## BRIEF_MEDIA_4 — MEDIA_EMPTY_1
- [x] B/C and callback stop resolved by MEDIA_EMPTY_1_R; original eleven tests preserved.
- [x] A missing mock supplied and implemented by MEDIA_EMPTY_1_R.
- [x] Remove blocker superseded: Remove permanently cut; D read-only display implemented. Retag permission remains open above.
- [x] Historical QA2 callback failure (`expected "spy" to be called with arguments: []`, SyntheticBaseEvent) resolved by ANB2 app fix, not a test rewrite. Original brief added eleven tests, 1,674/215 to 1,685/216; revised acceptance above.

## BRIEF_MEDIA_3_R — MEDIA_FAST_1_R
- [x] Confirm clbhouz. Restore EXIF-only months and original “missing EXIF never substitutes upload month” assertion `toEqual([])` under AMB4; no date fallback for captions or chips. Preserve shot row counts and omit only the seasons clause without chips.
- [x] AMB6 authorised rewrite of “closed always beats used, seventh remains green and selectable”: replace `four.style.borderStyle === 'dashed'`, colour inequality and improved-colour equality with `data-state` closed/used/open assertions; disabled/enabled assertions retained. No other existing tests rewritten, renamed or deleted.
- [x] Full suite: 1,674 passing tests / 215 passing files, zero failures (/tmp/media-fast-r/full-suite.log). Before inventory 1,673/215 (passing total previously unverified); after 1,674/215, solely +1 “eight undated shots still count without season groups” in holeWalk.test.tsx. No deletions or additional rewrites. Preview build OK 2026-10-18T12:56:27Z. Isolated actual-component Chromium checks: eight undated shots keep count/no chips; one EXIF month/no chips; two EXIF months/two chips; no October upload date; closed/used/open states; screenshots reviewed, zero page errors, live /auth zero page errors. This is not authenticated acceptance: external unmanaged blocks upload/persistence/private pending verification. No brief 4, SQL/migrations/RPC/edge/admin/feed_config/cap changes.

## BRIEF_MEDIA_3 — MEDIA_FAST_1
- [x] Build separate hole-known and oldest-first batch paths from the two uploaded mocks; use existing date verdict, never show hole chips on Path A; conditional real-round row; batch last-tag floor, closed precedence, floor-minus-one and split verdict; skips retain untagged photos. Full unit suite verified in MEDIA_FAST_1_R; hosted authenticated acceptance remains blocked as recorded above.
- [x] Apply AMA1 permanent copy cuts (no TODO); MEDIA_FAST_1_R withdraws AMA2 created_at fallback: EXIF-only display dates and derived shots/seasons. Verification recorded above; no brief 4 or prohibited data changes.
- [x] Prior QA2 jsdom stop superseded by MEDIA_FAST_1_R AMB5/6: targeted /tmp/media-fast-targeted.log originally reported src/test/holePhotoFastPaths.test.tsx:50:65, AssertionError: expected '' to be 'dashed' // Object.is equality. Authorized chip-state assertions now pass in the full suite above. Baseline full suite 1,659/214; MEDIA_FAST_1 added 14 cases in holePhotoFastPaths.test.tsx; MEDIA_FAST_1_R adds one case, final 1,674/215.
- Test rewrite explicitly authorised by AMA2: holeWalk.test.tsx “missing EXIF never substitutes upload month” renamed to “missing EXIF substitutes upload month for display only”; former assertion toEqual([]) now toEqual([{ month: '2026-05', count: 1 }, { month: '2026-10', count: 1 }]), because display-month fallback is newly required. No other existing tests deleted/renamed/rewritten. Root hole-walk pointer moved verbatim into holeWalk.ts header under budget rule; root 5,039 bytes. Authenticated upload/persistence unavailable (external unmanaged); public URL pending-photo privacy remains unverified; no admin or prohibited data changes.

## BRIEF_MEDIA_2 — MEDIA_WALK_1
- [x] Confirm clbhouz; read both identical uploaded briefs and the separate State A/State B HTML mocks.
- [x] MEDIA_WALK_1_R resolves copy: total only in walk headline at >=10; <=9 headline has no total. Withdraw AKA1/AKB4 coverage sentences; tag pile adds only member-action sentence. Observation keeps guarded open-hole count. Report hole_alias evidence without altering guard. Baseline 1,646 passing tests / 213 files.
- [x] MEDIA_WALK_1 + MEDIA_WALK_1_R: walk and selected panel implemented using the existing analysis/tag sources. Ordered sparse holes, approved-only tiles/counts/months, unavailable absence, unique >=2 winner and hardest-open guards, persistent grid and white inset ring, real per-hole facts, all photos (one active + remaining thumbnails), EXIF-only month chips, existing picker preselected with own-source choices. Withdrawn coverage prose removed; member-action sentence added; owner pending photos retain Waiting outside the walk. Existing grid/hero/navigation and write verdict preserved. Shared pure derivations own public population; root architecture pointer added (5,110 bytes).
- [x] Isolated actual-component browser flow verified at 1280x1800 and 393x852: grid position unchanged on selection; eight photos reconcile with seven thumbnail choices; open hole to preselected third-hole picker; no overflow or page errors; screenshots reviewed. Flat-colour JPEG is local fixture imagery only, not shipped artwork. Live /auth no page errors. This is NOT authenticated end-to-end proof (external_unmanaged).
- [x] MEDIA_FAST_1 AMA1 cuts tee-position, global-popularity and gorse copy permanently: no held work or TODO remains for those claims. Captions only name photographer and EXIF month. MEDIA_FAST_1_R withdraws AMA2 upload-date fallback; display and publication remain EXIF-only. Path A library selection authorised by brief 3.
- [x] ALB6 risk report: generated whs_score_holes has nullable hole_alias; src/lib/whs/types.ts:278 and api.ts:771/839 retain it. Shared CourseHoleAnalysis has no alias or repeated-nine resolver. No evidence establishes whether 1–18 means two loops; guard ships unchanged. Ben's query remains owner of that question and reach. No SQL, migrations, RPC/edge changes, SR reads, admin edits, feed_config or cap changes; briefs 3–4 not built.
- [x] Final unit inventory/build recheck: 1,646 passing/213 files -> 1,659 passing/214 files; added src/test/holeWalk.test.tsx only, 13 cases (ascending sparse holes, public pending exclusion, unknown-hole exclusion, unique >=2 winner, hardest-open guard, multi-month guard, EXIF-only dates, unavailable absence, grid persistence, selected Add-first handoff, eight-photo reconciliation, preselected submission, ten-hole threshold). No pre-existing tests deleted/renamed/rewritten/assertions changed. New file selector typings corrected without altering assertions; preview build OK 2026-10-18T12:37:40Z. Full suite log /tmp/media-walk-final.log. Hold remaining source gaps above; authenticated persistence unverified.

## BRIEF_MEDIA_1 — MEDIA_ENGINE_1
- [x] MEDIA_ENGINE_1_R2: mounted shared useCourseHoleAnalysis gating, required holes.length picker plus sparse actual hole numbers/order, own untagged Tag pills, complete paginated source/tag counts, exact known-hole denominator copy, metadata/date-match insert path and published/queued outcome displays. Original photo/review rows untouched. Reach unknown pending Ben's SQL; no SR reads or resolver. Backend publication/owner-only pending policy enforcement unverified; client inserts do not establish security guarantees.
- [x] Full suite 1,636/212 -> 1,646 passing/213; ten new holePhotoTagging.test.tsx cases: own-only pill, others absent, already-tagged absent, unknown silent, no business/video, sparse order, published-only coverage denominator, zero-photo coverage, pagination beyond 500, unchanged admin. No existing tests deleted/renamed/rewritten. Preview build OK 2026-10-18T12:10:06Z.
- [x] MEDIA_ENGINE_1_R3: confirmed clbhouz; removed faulty /tmp/browser/media-engine-r2/check_tagging.py under AKC2. Unchanged suite before/after: 1,646 passing tests / 213 files; no unit tests deleted, renamed, rewritten or assertions changed. Removed script's invented `get_by_label("Fixture outcome").select_option(state)` check because it depended on its own broken fixture, not the app. Replacement temporary browser check renders the actual CourseMediaTabNew with isolated inputs: “Two of the three holes we have data for here have never been photographed.”; available:false yields zero Tag buttons, not disabled. Screenshots reviewed; this is isolated rendering proof, not authenticated persistence. Live /auth renders without page errors; preview build OK 2026-10-18T12:15:49Z. No shipped code/controls/labels/attributes, admin, SQL, migrations, RPCs, edge functions, SR reads, feed_config or cap changes. HOLD: briefs 2–4 unauthorised; reach awaits Ben's SQL; authenticated persistence/private pending visibility remain unverified (external_unmanaged).
- [x] MEDIA_ENGINE_1_R: saved nullable-count and exact coverage-copy ruling. Built the independent reusable HolePhotoPicker: required holeCount, six-wide square grid, monotonic floor (only below-floor holes disabled), selected/used states from existing tokens, no internal fetch/default count. Three new src/test/holePhotoPicker.test.tsx cases (nine-hole render, floor boundary, invalid count has no default); suite 1,633/211 -> 1,636 passing/212. No existing tests deleted/renamed/rewritten. Not mounted pending identifier mapping.
- [x] MEDIA_ENGINE_1_R identifier stop superseded by R2: no SR source/mapping or resolver; shared analysis RPC only. Old reach request replaced with unknown available:true media-course reach pending Ben's SQL.
- [x] Ben approved exifr 7.1.3 lite; installed exact version, MIT, installed file bytes 1,291,466, lite minified 45,456 / gzip 14,786. Before building on it, Chromium read real JPEG File fixtures (generated known EXIF, not mock parser output): date+GPS, date/no GPS, GPS/no date. Kept repeatable tests/browser/test_hole_photo_exifr_lite.py; also proves actual metadata reader. No silent build switch; HEIC File parsing not exercised.
- [x] Isolated metadata reader and date-only verdict in src/lib/courseMedia, no UI callers or inserts. Real-round ownership/course/date match, proof ID, plain queue reasons, preserved GPS; absent coordinates never affect status. Seven new holePhotoVerdict cases; full suite 1,626/210 -> 1,633 passing/211, no existing tests deleted, renamed, rewritten or assertions changed. One new browser proof (three File cases) passes independently. Preview build OK 2026-10-18T11:59:12Z; AGENTS.md 5,039 bytes. No admin, SQL, migration, RPC, edge function, feed_config, cap or original-review changes.
- [x] Original AJC3/copy stops superseded by MEDIA_ENGINE_1_R: use sr_course_holes only, nullable count, silently omit tagging where unknown, and delete the unsupported photograph claim. Separate cross-table identifier source gap remains above.
- [ ] Stored review EXIF retention and CORS remain unverified; originals go through reviewUploadController.ts:87-111, not postUploadController. Never infer capture day. Current CourseMediaCanonGrid remains unchanged pending connected flow; unsupported photo claim never added.
- [ ] Existing client publish/owner-only pending policies unverified (no local policy source, SQL prohibited); R2 write path implemented but hosted authenticated persistence and private queued visibility are not verified. Reach awaits Ben's SQL; R3 requires holding after its checks, not further acceptance work.

## REVIEWS_STATE_4
- [x] Ben confirmed ADA2: distribution at five excluding. Correct ADE2 cases: six total with viewer shows; five total with viewer hides; five total without viewer shows. No other brief changes.
- [x] Reuse FewReviews for States 3/4 and existing RatingTierDistribution with opt-in sample appearance; excluding counts and generated quiet sentence, five zero-preserving rows and shares of excluding total. Min-to-max category bands and findings use the existing helpers; Condition-only exact months clause. State 3 rendering/test assertions preserved; no composer, social source, SQL/migration/RPC/feed_config/cap/artwork changes or raw hex/rgba additions.
- [x] Full suite 1,616 / 209 files -> 1,626 passing / 210 files. Only added src/test/reviewsState4.test.tsx (10): seven including viewer sums six; six total including viewer shows; five total including viewer hides; five total without viewer shows; all five rows/zero tracks; nine total min-to-max; Condition spreads and permitted explanation; Clubhouse forbids month explanation; State 4 boundaries; shared circle-first rows/own review. No tests deleted, renamed, rewritten or assertions changed. Existing States 1/2/3 pass (6/19/14); State 2 no-middle-band/no-splits source-tree assertion passes unchanged. Log /tmp/reviews-state-4-suite.log.
- [x] Preview build OK 2026-10-18T08:36:25Z. Isolated populated shared-screen browser fixture at 393x1500 and 1280x1800 renders five rows [2,3,1,0,0], six-person sentence, min-to-max bands with Condition 3.0/Design 0.9 explanation and no horizontal overflow; screenshots /tmp/browser/reviews-state-4/state4.png and desktop.png. Fixture's actual overall is 8.55 displayed 8.5, delta 0.4 for viewer 8.9; mock figures are illustrative, never forced. Architecture shared-screen/chart rule recorded in AGENTS.md.
- [ ] Authenticated hosted West Kent/photo/composer acceptance unavailable: external_unmanaged Supabase cannot supply an authenticated session. Local populated rendering is not hosted acceptance; no hosted figure/source-completeness claim.

## REVIEWS_STATE_3
- [x] Ben resolved ACA3/ACC2: count/spread/ending average all exclude viewer. Zero spread starts “Two people agreeing…”; positive spread starts “They sit inside…”; one other person has no sentence. Mock's old line is superseded, everything else stands.
- [x] Implement only two-to-four-total state, shared two-excluding average threshold, State 2 community-half fallback, excluded min-to-max categories, shared person/context rows and known-people-first order; preserve States 1/2 and composer; no State 4/middle-80%/splits. Course circle reuses useMembersWhoPlayedCourse (outgoing follows), scoped to visible blocked-filtered rows. Category meaningful contrast uses one displayed tenth; real values replace illustrative mock figures.
- [x] Full suite 1,602 passing / 208 files -> 1,616 passing / 209 files, +14 reviewsState3 cases; no existing tests deleted, renamed, rewritten or assertions changed. Includes Sundridge excluding 8.1/+0.3 and caution two/zero-spread; positive spread, two/three/four no distribution, other-person fallback, four excluded bands, five excluded, unrated viewer, circle order, unknown months, meaningful/equal category gaps. Six State 1 and nineteen State 2 tests still pass. Log /tmp/reviews-state-3-suite.log. Existing rater-context architecture note relocated verbatim into SingleReview header to respect AGENTS.md budget; new shared-row rule recorded there.
- [x] Preview build OK 2026-10-18T08:25:51Z. Isolated populated browser fixture at 393px confirms 8.1 headline/+0.3, revised caution, circle-first shared rows/context and no horizontal overflow; screenshot /tmp/browser/reviews-state-3/state3.png. Temporary harness import errors corrected without app/test changes. This is local fixture rendering, not hosted acceptance; no photo/composer interaction acceptance claimed.
- [ ] Hosted Sundridge/photo/composer acceptance blocked by external_unmanaged authentication; context counts remain RLS-visible as in State 2, unknown facts omitted. No SQL/migrations/RPC/feed_config/cap changes, raw hex/rgba additions, or artwork changes.

## REVIEWS_STATE_2
- [x] Clarified source gap: unknown review-owned played month means no pill and never an inferred round/review date. Calibration prose may repeat overall score; every-category clause requires four exact tens, mixed/missing categories omit it.
- [x] Build single-total-rating selection, person-led panel and complete visible non-mock rater-history context; unknown/inaccessible facts remain absent, handicap uses canonical resolver. State 1/composer/media entrypoints unchanged; existing six State 1 tests pass. Month supplied only as explicit review-owned input, absent on all current rows. Context counts are RLS-visible, not verified hosted global totals.
- [x] Authorised 2026-10-18: wrapped only reviewsState2's shared single() render and Add yours render in MemoryRouter; no router mocks or assertion changes. useSingleReviewContext has three direct async function tests and no rendered fixture to wrap; unchanged. Full suite: before 1,602 collected / 208 files, 1,592 pass / 10 fail; after 1,602 pass / 208 files, zero failures. No tests added, deleted, renamed or assertions rewritten; only fixture context changed. Existing passing tests, application code and global setup untouched. Full log /tmp/reviews-state-2-router-suite.log.
- [ ] Populated visual/photo/Add yours verification not run after QA2 stop; signed-in hosted verification additionally blocked by external/unmanaged authentication. Preview build OK at 2026-10-18T08:04:38Z; no SQL/migrations/RPC/feed_config/cap changes, no raw hex/rgba additions. Middle-80% and splits components not built. Architecture state contract in local headers; previous community-sample note relocated verbatim into its module header.

## REVIEWS_STATE_1
- [x] Match the signed-off zero-rating invitation only; shared state rule; catalogue figures derived from total/rated.
- [x] Add zero/one-rating and absence/derived-figure coverage; full suite and preview pass in REVIEWS_STATE_1_T; figures confirmed.
- [ ] Hosted visual/first-review acceptance: external/unmanaged authentication prevents signed-in verification; local handler test passes.

## REVIEWS_STATE_1_T
- [x] Wire Ben's confirmed 2026-10-18 snapshot (23,292 total, 115 rated; derive 23,177) and remove pending status.
- [x] Copy the complete canonical i18n mock into reviewsState1; audit Reviews/Champions additions: reviewsState1, reviewsSample1, useCourseReviewSample, championsState1/2/3, championsNetSource, championsElsewhere, championsOrder and coursePlay. No other partial mocks found; State 3 adds Trans while retaining canonical init/t behavior. No other tests changed.
- [x] Full suite: 1,574 passing / 205 files before State 1 collection fix -> 1,580 passing / 206 files, zero failures; existing six reviewsState1 cases now collect, no added/deleted/renamed cases. Only rewritten case: 'stores two catalogue figures and derives without-review from their difference': rated 0 -> 115, pending removed, numeric figures [23292, 0] -> [23292, 115], sentence 23,292 -> 23,177; add concrete derived assertion 23177, authorised by AAA1. All other assertions unchanged. Preview build OK at 2026-10-18T07:53:16Z. No components/setup/i18n/RPC/SQL/migrations/feed_config edits; cap 30. Crop architecture note moved verbatim to its existing browser-test header to fit the cross-area mock rule; no crop code changes.

## BRIEF_REVIEWS_1 — REVIEWS_SAMPLE_1
- [x] Correct overall/four category means and distribution via shared fieldExcludingViewer and complete paginated non-mock rating sample; preserve You-tab implementation/signature and review screen structure. Viewer-only sample has no invented community zero or delta.
- [x] Centralise fixed 2/5/10 rules and split eligibility; future state screens consume these helpers, not implemented here under the no-screen-change instruction. No ranges or split screens exist today; excluded communityRows is their future input.
- [x] Baseline 1,557 -> 1,574 passed (203 -> 205 files): reviewsSample1.test.tsx +15; useCourseReviewSample.test.ts +2. No tests deleted, renamed or rewritten; existing You-tab tests unchanged and passing. Preview build OK. External/unmanaged Supabase prevents authenticated live Sundridge verification; referenced HTML was not provided in this upload or available in the project, so no mock conformity claimed. No SQL/migrations/RPC/feed_config changes; cap 30; no raw hex/rgba additions.

## BRIEF_COURSES_HIGHEST_RATED_TEN
- [x] Set Highest rated to ten; require per-rail loading counts; preserve Regulars and card geometry.
- [x] Update the authorised limit assertion and add four focused cases.
- [x] Full suite 1,548 -> 1,552 passing (202 files); four new coursesHighestRatedTen cases, authorised limit test 3 -> 10 only. Preview build OK. Public phone check: ten 300 x 230 cards, 2px gap, scroll reaches the tenth, its tap opens the course, Regulars five, no runtime errors. Signed-in checks unavailable on external/unmanaged Supabase.

## BRIEF_CHAMPIONS_ELSEWHERE — CHAMPIONS_ELSEWHERE_1
- [x] VA3: useTitlesInReach staleTime 0 -> 60_000 (hook had no callers; no reason to be live).
- [x] CHAMPIONS_ELSEWHERE_R: built narrower (You {v} · {leader} to beat), link omitted, hook caller comment. Suite 1,542 -> 1,546.
- [ ] PARKED (Ben): widen get_player_titles_in_reach (field size, leader name); link destination.

## BRIEF_CHAMPIONS_STATE_4 — CHAMPIONS_STATE_4
- [x] CHAMPIONS_STATE_4_COPY_R: rulings applied; State 4 done, all four states in.
- [x] CHAMPIONS_STATE_4_V: comments corrected (nine is normal; eight is source-unavailable fallback). State 4 copy quoted for Ben's mock diff.
- [ ] LATER (do not act; Ben decides): get_viewer_standing has two definitions in the database — real fork or harmless overload?
- [x] CHAMPIONS_NET_SOURCE_1: unavailable sources are dropped from the cabinet and every count, decided by query outcome; console warning names the category. State 4 screen (PostedChampions) wired for members with tracked rounds here: posted values come from their own board rows, Yours tiles, pinned real row, Your defence / What it takes. Suite 1,532 → 1,538 (+6 in championsNetSource.test.tsx), none changed.
- [ ] CHAMPIONS_STATE_4_C: QA2 source-contract stop. The interrupted projectedTile type error is corrected and every legend aggregate now follows the evaluator's 18-hole eligibility; divider counts only supplied golfers whose ranks are strictly between the last leader and viewer. Preview build OK; full suite 198 files/1,532 passing → 198 files/1,532 passing, no assertion/test additions, deletions, renames or rewrites. State 4 remains unwired: no gam_round_net view definition/privacy policy or current get_course_net_board definition exists in repository; historical net SQL explicitly says superseded. Posted-net/privacy parity cannot be established without Ben supplying the current definitions/contract. Hook remains unused and its unsupported visibility-enforcing comment was corrected. No SQL/migrations/RPC/feed_config/cap changes; authenticated verification unavailable on external/unmanaged Supabase.
- [x] Confirm clbhouz, signed-off mock; baseline full suite 1,532 passing. Found posted gam_round_stats fields and existing gam_round_net view; leaderboard/window absence remains unknown, not zero.
- [ ] Extend shared cabinet, explicit reach basis, real pinned row and selected-board defence; preserve States 1–3.
- [ ] Add rule coverage, run full suite against 1,532 baseline; stop/report any new failure.
- [ ] Verify preview and report source/auth limits, test inventory and deviations.
- [x] Previous intermediate typecheck stop resolved by CHAMPIONS_STATE_4_C; surviving compiler errors: none. Source-contract stop above is the current blocker, not the old type error.

## BRIEF_CHAMPIONS_STATE_3 / R / T
- [x] CHAMPIONS_STATE_3_G4: deterministic props-keyed avatar mock/capture only; exact fallback-tree comparisons and ghost assertions preserved. Full suite 1,532 → 1,532, all passing (198 files); resolves the historical State 3 G/G2/G3 stops below. No tests added/deleted/renamed; holder assertion uses Map values with unchanged expected URL. No application or outside-State-3 test changes; preview build OK; authenticated checks unavailable on external/unmanaged Supabase.
- [x] CHAMPIONS_STATE_3_G3: user approved mocking actual CourseLegendsAvatar instead of unused SquircleAvatar; failing test now has exactly three input-contract assertions; second initials test and 1,532 count preserved. No application changes.
- [ ] CHAMPIONS_STATE_3_G3 STOP: full suite collected 1,532; 1,530 passed, two State 3 fallback-equality cases failed: 'GE3: seven finite differentials delegates to the exact State 2 subtree' and 'missing tee inputs delegates to State 2 even if a stale projection exists', both assert container.innerHTML === fallback. The scoped mock's incrementing data-avatar-call marker changes across rerenders. All ghost assertions and tests outside State 3 pass. No post-failure fix; build OK; awaiting authorisation to stabilise mock output without editing fallback assertions.
- [x] CHAMPIONS_STATE_3_G2: replaced only the authorised ghost no-image check with querySelector('img') === null; distinct-photo fixtures and viewer-initials case unchanged; no application changes.
- [ ] CHAMPIONS_STATE_3_G2 STOP: full suite 1,532 collected, 1,531 passed, one newly exposed failure in the same no-image test: the real-holder outerHTML.includes('holder.jpg') check expected true but received false. The authorised img assertion and viewer-initials case pass; all tests outside State 3 pass. No further assertion or rendering edits; awaiting authorisation.
- [x] CHAMPIONS_STATE_3_G: ghost variant now renders viewer initials on transparent ground regardless of photo; real-row defaults unchanged. Authorised never-passed photo test replaced by two cases (inventory 1,531 → 1,532).
- [ ] CHAMPIONS_STATE_3_G STOP: full suite collected 1,532; 1,531 passed, one new no-image case failed because its broad /url\(/ assertion also matches the existing inline SVG squircle mask. Viewer-initials case passed; all tests outside State 3 passed. No assertion adjusted after failure. Build OK; authenticated visual checks unavailable (external_unmanaged). Await follow-up authorisation.
- [x] Confirm clbhouz; read all three standing briefs and amended HTML.
- [x] Extend coursePlay net/differential ranges and shared sentence selector; preserve You wording.
- [x] Use A.FAINT and extend FlatBoardRow with the authorised ghost variant; remove duplicate ghost rendering.
- [x] Add 18 State 3 tests and three coursePlay tests; no existing assertions deleted, renamed or rewritten.
- [ ] STOP: focused run collected 32, passed 31, failed one: ghost profile-photo style did not contain 'viewer.jpg'. No test adjusted. Full suite not run under the stop rule; baseline remains 1,510 and candidate inventory is 1,531 (+18 State 3, +3 coursePlay).
- [x] Latest preview build OK (2026-10-17 12:04:38 UTC); authenticated/visual acceptance unavailable on external/unmanaged Supabase. State 3 remains unfinished pending authorisation to diagnose the new failure.

## BRIEF_CHAMPIONS_STATE_2 — CHAMPIONS_STATE_2
- [x] Confirm clbhouz and record Ben's snapshot verification dated 2026-10-17; values unchanged.
- [x] Extended the existing cabinet with held tiles and course-side counts; scoped to unconnected populated courses, state-1 never-claimed styling preserved.
- [x] Existing BoardSection rows retained with state-2 self treatment suppressed; selected tile, two windows, field comparison and invitation wired from existing GolfClubView stats; no Elsewhere or new read.
- [x] CHAMPIONS_STATE_2_T authorised per-file mock fix: all 1,503 existing plus seven State 2 cases pass, 1,510 total. No assertions or existing tests changed; global setup/components untouched. State 1 has no translation mock because its rendered components currently do not call useTranslation. No browser/authenticated acceptance claimed.
- [ ] Reported deviations: no record-history source, so no invented history; open-feat copy says no visible holder (privacy-safe) rather than claiming no feat occurred; MEDAL_GOLD used only for the expressly specified record scale despite blanket no-gold prose. Connected-member screens keep existing behavior; window controls now use shared Button without changing their appearance.

## BRIEF_CHAMPIONS_STATE_1 — CHAMPIONS_STATE_1
- [x] Confirm clbhouz; investigate CC2 without querying data. Exact catalogue count exists in admin Inbox; Health has admin-only played_courses/played_on_map fields, not a verified member-accessible catalogue-matched tracked-course total.
- [x] CHAMPIONS_STATE_1_R unblocks CA/CB/CD/CE and reverses CC2: use Ben's last verified catalogue snapshot, pending replacement.
- [x] Implement zero-row cabinet/count/connect screen and derived catalogue sentence; Elsewhere excluded, populated courses and You tab untouched. Catalogue snapshot pending Ben's fresh pair.
- [x] CE1–CE4 plus snapshot rule: 1,498 → 1,503 passing, five new tests in championsState1.test.tsx; no existing tests changed; preview build OK.
- [ ] STOP: local browser check timed out before the headline appeared; no visual or authenticated acceptance claimed. External/unmanaged authentication remains unavailable. Do not investigate further without a follow-up.
- [ ] Architecture entry deferred: AGENTS.md addition rejected at its size budget; local component/snapshot headers document ownership, but cross-area note needs approved relocation before adding.

## BRIEF_PROFILE_TABS_VOICE
- [x] Confirm clbhouz; change only specified Courses/Rounds ownership copy and props, with name-free third-person fallbacks and the archive possessive fix.
- [x] Add English keys only; preserve all queries, hooks, derivations, figures and Handicap sections. Excluded archive empty state still says "They hasn't" without a name; reported, not changed.
- [x] One third-person render test per tab checks named/fallback forms; 16 focused and all 1,399 tests pass (1,397 + two), zero failures, preview build OK. Public profile redirects to /auth with zero runtime errors; signed-in visual/live verification unavailable on external/unmanaged Supabase. No SQL/migrations; feed_config untouched, round_pool_cap 30; exact safety block intact.

## BRIEF_HANDICAP_TAB_REBUILD_8A
- [x] Confirm clbhouz; record row buttons open the canonical RoundDetailSheet by existing id and pass the profile owner; existing flex/gap/padding/hairlines retained with button reset and no-id fallback.
- [x] Capitalise five English Stood strings only; record calculations, stoodFor/join and other copy untouched; no lowercase assertions found.
- [x] Five new interaction tests pass; full suite 1,397 passing, zero failures (1,392 prior + five). Preview build OK; public profile redirects to /auth with zero runtime errors. Normal records all have WhsScore.id; malformed no-id rows remain noninteractive. Live authenticated taps and visual geometry remain unverified on external/unmanaged Supabase. No SQL/migrations; feed_config untouched, round_pool_cap 30.

## BRIEF_HANDICAP_TAB_REBUILD_6B
- [x] Confirm clbhouz; remove FloorSection, its derivations and 19 dedicated tests, and English handicap.floor keys; supersedes 6A.
- [x] Preserve pickCourse and PersonalBestsSection exactly, with the requested remaining section order.
- [x] Verify full suite: 1,411 baseline to 1,392 passing, exactly 19 Floor tests removed, preview build and untouched-file checks; authenticated live-profile checks unavailable on external/unmanaged Supabase. No SQL/migrations/data edits.

## BRIEF_HANDICAP_TAB_REBUILD_7A
- [x] Confirm project identity is clbhouz; remove Trophy Room entry and dashboard launch mount while preserving Records to break.
- [x] Delete Trophy Room and verified orphan files/assets/tests; remove unused aggregates hook. User approved keeping fetchTrophyAggregates/TrophyAggregates for Compare (useCompareStats calls it twice).
- [x] Verify full suite: 1,411 passing, no failures, exactly ten dedicated Trophy Room tests removed from 1,421 baseline; preview build OK. External/unmanaged profile browser check redirects to /auth with no runtime errors; authenticated live-profile check unavailable. No SQL/data changes or career-counter placeholder.
- [x] Retain LaunchSheetMount and its launch folder: it introduces streaks and rivalries/shared rounds as well as achievements, not Trophy Room-only; only dashboard mount removed.
- [x] Retain shared achievement/course hooks, course-legends drilldown and GAM tokens; move surviving standings/Top 100 functions to lib/gam and level lookup to achievements. Invite presentation extracted locally without restyling; remove dead Trophy Room CTAs and mounts from both pages, AchievementsPane and LevelUpSheet. Legacy trophy links consume their parameters without a replacement; streak links preserved.

### 7A removal inventory
- Entire `src/components/profile/handicap/whs/gam/trophy-room/` removed (30 original files; surviving functions relocated from standings.ts, shareModel.ts and levels.ts):
  - `_shared/`: showpieces.ts, normalizeTrophyItem.ts, levels.ts.
  - `parts/`: MatchRequestSheet.tsx, Top100CourseRow.tsx.
  - `career/`: CareerHeader.tsx, CareerRecordSheet.tsx, Primitives.tsx, TabBar.tsx, criteria.ts, types.ts, tokens.ts, standings.ts, shareModel.ts, medalTone.ts, format.ts, milestones.ts.
  - `career/details/`: Top100Detail.tsx, MilestoneDetail.tsx, CrownDetail.tsx, CountingStatDetail.tsx.
  - `career/panels/`: CabinetPanel.tsx, Top100Panel.tsx, StreaksPanel.tsx, StandingsPanel.tsx, SeasonCutPanel.tsx, CrownsPanel.tsx, MilestonesPanel.tsx, CountingStatsPanel.tsx, CourseRecordsPanel.tsx.
- `src/components/profile/handicap/whs/gam/GamMount.tsx`.
- `src/hooks/gam/`: useMarkBadgeSeen.ts, useUserTopLegends.ts, useUserStreaks.ts, useBadgePopulationShare.ts, useCareerRounds.ts, useCourseFieldSizes.ts, useCourseFieldPlayers.ts, useMemberRecordSplit.ts (including recordsWonFrom).
- `src/assets/`: continental-swinger-trophy.png, links-legend-trophy.png, stars-stripes-trophy.png (zero source consumers).
- `src/test/trophyRoomStandings.test.tsx` (ten tests); only the retired-door assertion removed from profileAchievementsPane.test.tsx; remaining assertions untouched.
- Inline TrophyRoomRow/useCrownsHeldCount, useTrophyAggregates and trophy event exports removed. Records to break body/calculations and its tests unchanged.

## BRIEF_HANDICAP_TAB_REBUILD_6A
- [x] Replace the Floor ladder with six category milestones and English names; preserve section calculations and appearance.
- [x] Verify 19 focused tests and full suite (1,421 passing, no failures); preview build OK. Live authenticated checks unavailable on external Supabase.

## BRIEF_HANDICAP_TAB_REBUILD_5C
- [x] Mute all par-row figures/fills with A.MUTE and use BAR_RADIUS; retain 4px tracks and proportions.
- [x] Remove observation and its unused calculations/read; preserve distribution, title, meta and thresholds.
- [x] Verify full suite; hosted live-profile checks unavailable on external Supabase.

## BRIEF_HANDICAP_TAB_REBUILD_4A
- [x] Remove mechanism boundary label/backing and next-in-line row; retain amber rule, counting chips, round detail interaction, and ageing-out calculations.
- [x] Update only English mechanism caption.
- [x] Verify suite; authenticated live-profile checks unavailable on external Supabase.

## Profile Courses exact mock — 15 October
- [x] Match the Still to rate, Archive controls, year header and flat course rows to the uploaded mock; preserve real photos/counts and existing row expansion.
- [x] Verify populated local rendering and controls at 320/472/628px; full suite passes. Hosted authenticated checks remain unavailable on external Supabase.

## Avatar crop cap F.3
- [x] Cap both future crop outputs at 1440px without upscaling or changing JPEG quality.
- [x] Measure both real modal outputs and prove under-cap JPEG bytes unchanged (both modals, 571×600).
- [x] Confirm the full suite remains at 1,138 passing and fifteen known failures; preview build OK, no lint errors. Hosted authenticated upload checks unavailable on external Supabase; no R2 writes made.

## BRIEF_TOUR_FOLLOW_AND_TEE_ALERT
- [x] Player follows withdrawn; hero-board rows open the scorecard instead.
- [ ] Add tee-alert toggle and notification-delivery warning.
- [ ] Dispatch confirmed leader-group alerts through tournament-live-sync.
- [ ] Reuse Overview token owners and verify tests without opening preview.

## Review tile height correction
- [x] Restore the original standard photo-overlay review layout; full-width frame 210 → 252px, rounds unchanged.
- [x] Match review loading placeholders; 27 focused tests passed and preview build OK. Authenticated visual checks unavailable on external Supabase.

## Profile handicap chart parity — done
- [x] Reuse the profile bottom sheet's handicap trend chart in the profile Handicap tab.
- [x] Preserve the tab's history windows, headline, scrub behavior, and no-history state.
- [x] Verify focused tests, TypeScript, and preview build.

## Explore clap weight and scroll-to-top
- [x] Match the shared clap icon's optical weight to the message icon.
- [x] Reuse the Courses scroll-to-top control across every Explore view.
- [x] Verify the scrolled phone view, interaction, focused checks, and clean preview build.

- [x] Refactor lead review copy into identity, two-line quote, and optional breakdown rail
- [x] Move review photo count into the top-right glass chip
- [x] Remove only the five verified orphan locale keys across six locales
- [x] Add focused review-tile accessibility, truncation, scope, chip, and regression tests
- [x] Verify six-locale label widths at 390px, Explore tests, typecheck, and screenshot

## Explore news alignment
- [x] Match photo-led news hierarchy to Tour Overview and remove member attribution.
- [x] Verify focused Explore tests and typecheck.

## Personal Bests restore
- [x] Accept Ben's authenticated proof: 24 rows, 13 members, six feat kinds.
- [x] Build and mount `PersonalBestsShelf` in Explore Magazine using the existing hook and `StandoutTile`.
- [x] Preserve server copy and server-side dedup/widening; add no cross-section member budget or empty state.
- [x] Verify 320/390/430, screenshot, focused tests, and typecheck.

## Record margins
- [x] Read gross-record ranks 1 and 2 together and carry the rank-2 margin to record cards.
- [x] Reuse the existing board-movement delta for the callout subline.
- [x] Verify margin/no-margin cards at 390, focused tests, typecheck, and unchanged net record.

## course_par completeness (BRIEF_COURSE_PAR_COMPLETENESS)
- [x] gam-evaluator: par summed only when every hole of whs_scores.total_holes is present, played and has a par; otherwise NULL (both the computeRoundStats path and the no-holes fallback)
- [ ] Ben runs the requeue after deploy

## Round par completeness (client) — 2026-09-22
- Done: `roundCoursePar` in `src/lib/whs/api.ts` (strict `played === true`, must equal `total_holes`, else NULL); RoundDetailSheet now uses it for `coursePar` and `toParVal`.
- Reported, not fixed (Ben to sequence): CardScorecardSheet `totals.toPar` + `totalPar`/`shownPar`, RoundPagePreview `shownPar`, scorecardParts `nineSummary.parPlayed`, ExploreMagazine seed par, roundGross `roundScore`, RoundCardHoleStrip nine deltas, CourseYouTab field par.

## BRIEF_SCORECARD_HEAD_PAR — done
- Round par in the scorecard head now comes only from `roundCoursePar`.
- `CardScorecardSheet` takes `totalHoles` + per-hole `played`; local sum deleted.
- `RoundPagePreview` uses the same rule; `RoundDetailSeed` gained optional `totalHoles`/`played`.
- NULL declared length -> no par. Seed/preview paths have no declared length today (see report).
- Out of scope, untouched: per-nine OUT/IN, totals.toPar, ExploreMagazine:1086, roundGross.ts, RoundCardHoleStrip.

## BRIEF_ROUND_SHAPE_CARRIES_PAR — done
- `useRoundHoleShapes` now reads `gam_round_stats(whs_score_id, course_par)` in the SAME batch as the hole rows (source (a)); `HoleShape.coursePar` carries it. Curve untouched: played filter, MIN_PLAYED_HOLES 9, actual_gross, beads, birdies, fallback all unchanged.
- `RoundDetailSeed.par` added and supplied by ExploreMagazine `seedFor`; the local "sum the seeded pars" derivation is gone, so a ten-hole card no longer prints a to-par against par 40.
- `RoundPagePreview`: `seed.par ?? roundCoursePar(holes, totalHoles)` — never inferred from row count.
- Out of scope, untouched: roundGross.ts (its `coursePar` comes from `usePostRounds` reading `gam_round_stats.course_par`), RoundCardHoleStrip, CardScorecardSheet totals.toPar, per-nine OUT/IN, edge functions, SQL.

## BRIEF_MEDIA_PAGE_THREE_WALLS
- [x] Remove duplicate section wrappers and header count; compact the title/chip/content stack.
- [x] Replace the clips rail with a paged, full-bleed three-column 9:16 wall using the shared tile additively.
- [x] Add the dedicated 16:9 long-form page card while leaving Amateur `VideoRow` untouched.
- [x] Keep the community mosaic, count sources, URL contract, analytics, and viewer origins unchanged.
- [x] Verify 320/390/430 geometry, Amateur rail parity, autoplay behavior, focused tests, and typecheck.

## BRIEF_PARTIAL_CARD_COPY
- [x] Add the shared head’s `· thru N` suffix only when round par is null and played holes exist.
- [x] Remove the empty to-par stat from gross-only rounds when its value is null.
- [x] Verify partial eighteen, complete eighteen, complete nine, gross-only, focused tests, and typecheck.
- [x] Report every other nullable-par round to-par renderer without changing it.

## BRIEF_HOLE_STRIP_NINE_COMPLETENESS
- [x] Require exactly nine strictly played holes with non-null par before rendering a nine's delta.
- [x] Keep hole marks, gross totals, and complete-nine rendering unchanged.
- [x] Verify partial eighteen, complete eighteen, complete nine, focused tests, full suite, and typecheck.
- [x] Report the par source for the seven named unchanged to-par sites.

## BRIEF_FEED_PARTIAL_ROUND_THRU
- [x] Carry `whs_scores.total_holes` through the existing batched feed-round read.
- [x] Preserve hole arithmetic while exposing `thru` only for provably partial scored cards.
- [x] Render lowercase `· thru N` beside partial feed scores; leave complete and WHS fallback output unchanged.
- [x] Prove partial eighteen, complete eighteen, complete nine, and picked-up fallback behavior.
- [x] Report every other `roundScore` consumer without changing it; run the full suite and typecheck.

## BRIEF_LEGEND_JOINT_RANKS — done
- `legendRanks.ts`: `assignCompetitionRanks` (1224, equality on `Number(value).toFixed(6)`, never `===`) + `crownSetDelta` (rank-1 set diff). Sort order untouched.
- `recomputeLegend`: one `ranked` array feeds the write-skip signature AND the insert; crown path is set-based — enter = legend_earned, leave = legend_lost, in both = nothing; `recomputeLegendTitles` runs for every entering or leaving user.
- Historic silence: `isTriggerFreshForCrownNotice` (LEGEND_NOTIFY_MAX_AGE_DAYS = 2 on play_date) + all-time-only gate. No new suppression added.
- [ ] Ben runs the backfill requeue after deploy (read-only survey: 174 boards, 325 rows change rank, 99 become joint first).

## BRIEF_CONTESTED_TITLES — done (server only)
- `legendTitles.ts`: `boardKey` / `contestedBoardKeys` (> 1 claimant, no larger floor) / `countContestedTitles`. Joint firsts count.
- `recomputeLegendTitles`: `computeContestedTitleCount` is the one number; the milestone upsert and `legendTitleTier(count)` read the same binding. count 0 still deletes the badge row.
- New action `recompute_legend_titles` (dry run unless apply), whole pass under REBUILD_SUPPRESS -> enqueueNotification no-ops; tier drops were already silent.
- [ ] Ben runs the counter_tiers [1,15,60] SQL and then the backfill (dry run first).

## BRIEF_TROPHY_ROOM_STANDINGS — done
- `useMemberStandings` (one rpc call, keyed on user id, mirrors useRoundAwards), `career/standings.ts` (rules: tiedWith, discState 4 states, formatValue, standingLine, groupStandings, courseSubline), `career/panels/StandingsPanel.tsx`, mounted in `CareerRecordSheet` after Course Records. `REC.FAINT` added for the placed disc border.
- The UI derives nothing but `tied_with` and |value − column|. Tenure boards render with no disc.
- Out of scope, untouched: the course You tab, `get_member_standings`/any SQL, legends/ranks/titles/badges/notifications, the room's other sections.

## BRIEF_MEMBERS_RADAR
- [x] Stage 1 tracking; follow-ups: Explore ?view=, Inbox ?type=, video_watch per-interval confirmed.
- [x] Stage 2 (2.1–2.5).
- [x] Stage 3 hooks + rules 4–6 + follow-ups.
- [x] Stage 4 Member screen implementation — identity/index trend, loop, golf, eight-week sessions, counters and actions; limited admins request no restricted data. TOP 100 is the brief-sanctioned em dash: no qualifying per-member board read, no query added. Old Member360 display sections removed; existing More actions/app roles/confirms retained.
- [x] Stage 5 Behaviour/Sessions implementation — time/hourly, returned areas/order, top-six event labels, Never opened, merged last-session and expanded session detail, 30-row pagination with Load more, London times/formatAgo, permission and specified empty states.
- Message uses normal personal-account 1:1 messaging with blocks respected, composer focus, no automatic send and Back to the same Member screen; no separate composer or database changes.
- [x] Full suite: 150 files, 144 passing/6 failing; 1,216 tests, 1,201 passing/15 failing. Same failure list: courseRatingConsistency ×3, exploreHeroCard ×3, exploreNetChips ×2, exploreReviewTileC5 ×4, roundNotificationOverlay ×1, trophyRoomStandings ×2. Six new rule tests pass; latest automated build reports build OK. No SQL, migrations or edge-function changes; feed_config untouched, round_pool_cap unchanged.
- [ ] Exact live visual/interaction acceptance — blocked by external/unmanaged authentication: preview shows Access denied. No authenticated Member, Behaviour, message/Back, block enforcement or live RPC measurements claimed. Populated panel geometry follows the HTML; brief-mandated tabs, server action labels and omitted sample action sublabels differ intentionally from sample markup. Skeletons preserve fixed chart/cell/row geometry but variable server row counts/text wrapping mean exact settled total panel heights cannot be guaranteed before data arrives; no invented data or fixed clipping used.

## BRIEF_ROUNDS_YEAR_META — done
- Rounds log year divider now shows the year only: the inline meta ("{{n}} rounds · avg {{avg}} over {{scoring}} full" and its count-only fallback) was removed from ProfileRoundsTab, along with the Item.meta field, DIVIDER_META and the space-between divider layout; padding/hairline untouched.
- The meta string was inline English in the component, not a common.json key — no key existed to remove; other locales untouched.
- The local `yearStats` read in ProfileRoundsTab had no remaining consumer after the meta went, so the local was removed; the derivation itself stays and SeasonSection still computes its own yearStats for the hero figure. `fmt1` import dropped from ProfileRoundsTab only.
- No test pinned the meta string; year-divider year assertion unaffected. Full suite 1,399 passed (181 files), tsgo clean.

## AGENTS_BUDGET_R2
- [x] Confirm clbhouz and corrected token/handicap destinations; copy exactly four named rules into owning headers, with two root pointers only, and replace Briefs verbatim. No medals/src-AGENTS/SQL/migrations/RPC/feed_config/cap changes.
- [x] Root 7,866 -> 4,909 bytes (211 under 5,120); exact four rule texts including handicap audit/caveat and unchanged source bodies verified; root changes limited to four moves, two pointers and exact Briefs replacement. Full suite 1,626 passing / 210 files before and after; no tests added, deleted, renamed, rewritten or assertions changed. Log /tmp/agents-budget-r2/suite.log. Preview build OK at 2026-10-18T09:09:04Z; no app behavior changed.

## MEDIA_COPY_1
- [x] Added one test in src/test/mediaEmptyStatesR.test.tsx pinning two literal sentences against memberReasonSentence: default branch "The photo was not a fit for this hole." and not_a_golf_hole "The photo did not show a golf hole.". No existing tests changed; suite 1,704/218 -> 1,705 passing/218 (+1, mediaEmptyStatesR only). No SQL, migrations, RPC, RLS, feed_config, cap or src/features/admin changes.

## COMPOSER_HOLES_1
- [x] COMPOSER_HOLES_1 / COMPOSER_HOLES_1_R / COMPOSER_HOLES_1_R2 / COMPOSER_HOLES_1_R3: optional step-two image-only vertical tagging list and reversible, tap-to-close no-floor picker implemented; unavailable analysis/video-only silently absent. MediaTray, ComposerStepHeader, round hook/filter and step/Continue gates unchanged. Detached assignments/proof travel to non-awaited background job; uploaded/existing image path starts only after successful submit, before and independently of attach. Per-item background writes survive review publication failure; failed hole insert is silent and affects no review media or registry. Abandoning pre-submit writes nothing.
- [x] APA13 audit: holePhotoData.ts:129–130 duplicate predicate is `existing.some(row => row.media_url === media.imageUrl && row.user_id === memberId)` — photograph URL plus owner, not course/hole/member; unchanged. Existing pickPreselectedRound selects only today/yesterday; useMyRoundsAtCourse retains holes_played = 18, default 20-row limit, whsScoreId proof identifier.
- [x] R2 preserves staged background path and supersedes APA11/12. R3 resolves nine-hole wording: all EXIF matches say “Taken on a day you played here, so it publishes straight away.” Chosen-round outcomes alone name the round. matchedPhotoRounds reads whs_scores by connection_id/course_id/play_date, with no holes-played filter. Baseline last verified 1,705 tests / 218 files.
- [x] Baseline full suite 1,705 passing / 218 files -> 1,722 passing / 219 files (+17 only src/test/composerHoleTags.test.tsx). No existing tests deleted/renamed/rewritten/assertions changed. Added: unavailable absence; video-only absence; nine actual chips; no-floor/close; same-hole reuse; client-only capture/removal; five-month no-preselection; today preselection/proof; chosen-proof no-EXIF; EXIF matching; missing-date queue; independent insert fields; untagged/video no-write; silent refusal; review failure still writes tag; tag failure preserves review; joining running upload retains assignments. Logs /tmp/composer-holes/baseline.log and final-suite.log. Preview build OK 2026-10-18T14:47:50Z.
- [x] Isolated actual-component Chromium at 1280x1800 and 393x852: chosen/Waiting/EXIF nine-chip/silent variants, used-hole enabled, chip closes, changed row reads back, zero page errors/overflow; screenshots reviewed /tmp/browser/composer-holes. Browser fixture import/preamble errors corrected only in temporary script. Named gap: eighteen-hole-only chooser cannot offer nine-hole rounds; existing EXIF matchedPhotoRounds has NO holes-played filter, so its fallback remains eligible. No SQL/migration/RPC/RLS/admin/feed_config/cap changes; original duplicate predicate unchanged. Hosted authenticated submission/persistence/privacy remain unverified (external_unmanaged); isolated transport tests are not hosted acceptance.

## PTR1 — done
- Par-type bars replaced by dots on one fixed −0.20…+1.20 scale (PAR_SCALE_MIN/MAX); clamped dots, true figures, level tick at zero on every row; hardest-first order; amber only when the lead clears HARDEST_MIN_GAP = 0.05 (separate from LEVEL_EDGE per correction); ties order by holes then par. End row padded 85px left / 69px right so both ends sit on the track (mock's missing right padding not adopted). Bar, track, maxPer normalisation and the shots meta figure deleted; shots stays computed with no consumer; parMeta keys left in place.
- New src/test/defendsParTypes.test.ts: 7 pure-function tests (scale mapping, both clamps, zero==tick, clear winner, near-tie none, tie order). No existing test touched. Suite 1,811/235 -> 1,818/236 (+7/+1), zero failures; build OK. Live check signed out with stubbed hole-analysis RPC (Sundridge Park returns available:false, section correctly absent). Report /mnt/documents/PTR1_report.md.

- [x] FN1 Home feed plot net + NET/GROSS/HANDICAP row (1,835/238 -> 1,850/239)
- [ ] FN1 nine-hole stroke allocation convention — awaiting Ben ruling

## BRIEF_TOP_TEN_TILE_WIDTH — done
- ProfileTopTenRail: tiles 2/3 grid now `repeat(2, minmax(0, 1fr))` with `minWidth: 0` on each tile; new exported `RegionRankLine` (region truncates, ranks never shrink, null when neither) replaces `regionLine` at all four call sites (hero, tiles 2/3, rows 4-10, suggestions); helper removed. No other visual change.
- New src/test/topTenTileWidth.test.tsx: 5 tests (grid template + tile minWidth, two-span structure, region-only, ranks-only, neither). No existing tests touched. Suite 1,878 passed + 1 failed / 244 files -> 1,883 passed + 1 failed / 245 files (+5/+1, topTenTileWidth only); the 1 failure is the pre-existing reviewReceiptAverageLine selector issue already reported and awaiting authorization. Build OK 2026-10-20T07:01:58Z. No SQL/migration/RPC/feed_config/cap changes.

## BRIEF_PROFILE_BIO_FULL — done
- ProfileHero: collapsed bio clamp 2 -> exported `BIO_COLLAPSED_LINES = 8`. display -webkit-box, WebkitBoxOrient vertical and overflow hidden stay, so ProfilePageV2's scrollHeight vs clientHeight measurement still drives More / Less. BIO_MAX 300, button styling, meta row and spacing untouched; expanded state unchanged.
- New src/test/profileBioFull.test.tsx: 6 tests (300-char fixture; clamp 8 + box props collapsed; expanded lifts clamp; no More/Less inside the clamp; More only when bioOverflows; Less only when bioExpanded). No existing tests changed. Suite 1,883 passed + 1 failed / 245 files -> 1,889 passed + 1 failed / 246 files (+6/+1, profileBioFull only); the 1 failure is the pre-existing reviewReceiptAverageLine selector issue already reported and awaiting authorization.
- jsdom note: the -webkit- clamp is read off the element by name — typed CSSStyleDeclaration has no vendor member, and getPropertyValue('-webkit-line-clamp') proved order-dependent across the full suite.

## CB11 — Remove Who leads what
- [x] Verified line references and caller audit; user extended scope to the section sheet, state and private formatters. Shared Rail owns unchanged 10/12/18 spacing; §7 and protected helpers untouched.
- [x] Full `npx vitest run`: 1,954/260 before -> 1,947/259 after, zero failures; -7 solely authorized whoLeads.test.ts deletion, no surviving test edits. Preview build OK. Remaining order: scope chips, Standout rounds, Competitions, Just played, §5 Feats, §4 Most improved, §7 Top 100 courses. get_year_leaderboard has no active caller; RPC/type/optional hook signature stay untouched. Unused tiedTop/clearOf keys and non-Top100 CareerMetric variants retained outside explicit deletion scope. Hosted authenticated rendering unverified on external_unmanaged Supabase.

## CB12 — Just played shared rows
- [x] Follow-up: The latest gross figures now match In form at 15px via recentGrossSize in rowMetrics; other boards unchanged. Fixture section and sheet verified 15px on all five rows; row height remains 56.6875px, screenshot reviewed. Full `npx vitest run`: 1,948/259 before and after, zero failures, no test edits or inventory delta. Preview build OK. Hosted authenticated acceptance remains unavailable on external Supabase.
- [x] Section now uses BoardHeaderRow/BoardRowView; ScoreWithToPar.tsx shared by CompetitionBoards, StandoutRounds and recent BoardRows; recent-only feat suppression, shared SeeAll and English sheetTitle. Same read, enabled gate and limit 5 preserved. User authorized chip-order test retarget from recent to eagle, assertion unchanged.
- [x] Full `npx vitest run`: 1,947/259 before -> 1,948/259 after, zero failures; +1 "CB12 recent suppresses feats while an eagle feat board retains a rarer feat" in boardCompetitionChip.test.tsx. No tests removed; only authorized chip-order case retargeted. exploreRoundFeats unchanged. Preview build OK. Fixture-only Chromium 390px captures section/sheet and RareAirRail-opened eagle sheet (0 recent feats, 5 retained rarer feats); /tmp/browser/cb12. Reconstructed original row 41px -> current fixture row 56.6875px. Frozen board scale differs from mock: avatar 34 vs 28, name 14.5 vs 13, net 18 vs 14, gross 10.5 vs 12, row 56.6875 vs 50.375; existing MEMBER header, gutters, date formatter and sheet chrome preserved. Removed dateOf, MemberAvatar, playDateAtLocalNoon, A/SANS and BOARD_LABELS imports. Hosted authenticated E2E unavailable (external_unmanaged); fixture checks are not live member data verification.

## CB13 — Handicap gate on the Rounds tab
- [x] New `src/features/explore-magazine/RoundsGate.tsx`: `roundsGateState` (signedOut / loading / gated / connected), frost wrapper, card, second-path sheet. Predicate: `useWhsConnection(userId).isSuccess && data != null` — fetchWhsConnection's undeleted (deleted_at IS NULL) england_golf row, the circleHandicap.ts rule. Errored read holds the loading treatment. ScoresLeaderboardsPage: one added hook, loading shell = today's first paint (control row + three section placeholders), gated wraps the live page inert + aria-hidden; signed-out and connected return the page untouched. Frost: opacity 0.5, mask `linear-gradient(to bottom, #000 0, #000 42%, transparent 86%)` (mock stops, hero pattern). Empty pool: ResizeObserver collapses the 300px reveal to 96px. Sheet: five rows on the where-you-play axis (Ben's ruling); England https://www.englandgolf.org/igolf, Scotland https://www.scottishgolf.org/world-handicap-system, Wales https://www.walesgolf.org/, Ireland https://www.golfireland.ie/whs-for-golfers; "Any country" has no link (no correct global destination). Strings under amateur.gate, English only. Watch tab untouched.
- [x] `npx vitest run`: 1,948/259 -> 1,952/260, zero failures; +4 solely src/test/roundsGate.test.ts (pure state predicate), no existing test edits. tsgo clean, preview build OK. Chromium fixture at 390px: frost inert, tap through frost reaches no row, card has no dismiss control, CTA navigates /manage/handicap, sheet opens with five rows. Screenshots reviewed. Hosted authenticated rendering unavailable (external_unmanaged). No SQL/migrations/RPC/feed_config changes; round_pool_cap 30.

## CB14 — The sheet's rows and truth line
- [x] Sheet reduced to two rows (England iGolf, Join a club); Scotland/Wales/Ireland/Any-country rows deleted as dishonoured links. Truth line derived from WHS_COUNTRIES via gateReach(); strings under amateur.gate, English only. `npx vitest run`: 1,952/260 -> 1,955/260, zero failures; +3 in roundsGate.test.ts, no existing test edits. tsgo clean, preview build OK.

## CB14.1 — The reach line drops its second clause when there is nothing to say
- [x] `amateur.gate.sheetReach` split into `sheetReachSupported` ("clbhouz connects {{supported}} today.") and `sheetReachUnsupported` ("{{unsupported}} aren't supported yet."). New pure `gateReachLine(supported, unsupported, t)` in RoundsGate.tsx renders each clause only when its own list is non-empty, joins two present clauses with exactly one space, and returns '' when both lists are empty; GateSheet then renders no element at all, so an empty line cannot take its margin. `andJoin` lifted to module scope. Today's rendered line is byte-identical to the old key's (verified against the real locale). Gate, four states, predicate, frost, card, CTA, sheet rows all untouched.
- [x] `npx vitest run`: 1,955/260 -> 1,960/260, zero failures; +5 solely src/test/roundsGate.test.ts (empty unsupported, empty supported, both empty, single-space join, both clause keys carry only their own placeholder). The three CB14 cases unchanged. tsgo clean, preview build OK.
- [ ] BLOCKED — CONFLICT: "Remove the old sheetReach key once nothing reads it" vs "Do not change the existing three CB14 tests." roundsGate.test.ts:51-52 reads `gate.sheetReach` (`expect(gate.sheetReach).toContain('{{supported}}')` / `toContain('{{unsupported}}')`), so deleting the key fails that protected case. Key left in place, unread by any component, pending Ben's ruling: authorise the two-assertion edit (or the case's deletion), or keep the key. No SQL/migrations/RPC/feed_config changes; round_pool_cap 30.

## REVIEW_POST_SCORE_BLOCK_B2
- [x] Open overall-and-category block under full-width course name implemented. CategoryScores, reviewer, body, CTA, media, footer and height constants unchanged. Divider uses A.TRACK. Existing verdict tracking retained at 0.14em rather than mock 0.12em, as brief explicitly preserves component tracking; Geist remains authoritative rather than mock system font.
- [x] Added eight cases in reviewPostScoreBlockB2.test.tsx. Existing tests changed only in reviewPostScoreCompact.test.tsx:26-35 (renamed size/centering cases, fontSize '16px' -> '30px', fontWeight '700' -> '800', tracking '-0.02em' -> '-0.045em', column alignItems 'center' -> textAlign 'center', subject alignItems assertion -> score-block alignItems assertion); reviewPostCard.test.tsx:56-64 (renamed missing-category case, grid repeat(4,...) -> repeat(2,...), empty club.textContent -> figure em dash). All changes encode explicitly superseded B2 layout, no tests deleted or count lost.
- [x] RESOLVED by Ben's exact normalization authorization: focused first run had 24 executed, 23 passing, one border-colour whitespace failure at reviewPostScoreBlockB2.test.tsx:43:71. Correction and final suite recorded below.
- [x] Before full `bunx vitest run`: 1,960 passing / 260 files, zero failures, same as last CB14.1 baseline. Candidate after inventory 1,968 / 261 (+8 exclusively new B2 file), not full-suite verified. Preview build OK at 2026-10-21T08:10:45Z. Hosted authenticated checks unavailable: external_unmanaged. No SQL, migrations, RPC, feed_config or cap changes. B2 module ownership recorded in ReviewPostCard header; AGENTS addition rejected by size budget and not applied.
- [x] Ben authorized the exact border-colour comparison correction: reviewPostScoreBlockB2.test.tsx:43 changed `borderRightColor` equality with `rgb(A.TRACK)` to equality after `.replace(/\s/g, '')` on both sides; ignores formatting whitespace only, preserves colour. Eight B2 cases pass in full suite.
- [x] RESOLVED by Ben's exact B2 gap authorization: scoreLabelSpacing.test.tsx:74 case “lifts the tier word to the same 4px gap as the categories” renamed “places the review post tier word at B2’s 6px gap”; :91 assertion `expect(tier!.style.marginTop).toBe('4px')` -> `expect(tier?.style.marginTop).toBe('6px')`, because B2 explicitly sets marginTop 6. Other cases untouched. This fixed the second stopped full run (1,967 passed / one failed, expected 4px received 6px).
- [x] Final full `bunx vitest run`: 1,968 passing / 261 files, zero failures. Before 1,960 passing / 260, +8 exclusively reviewPostScoreBlockB2.test.tsx. No test deleted or file renamed; all four existing renamed cases and changed assertions enumerated above. Logs /tmp/review-b2/final-suite-approved.log. Preview build OK 2026-10-21T08:23:12Z.
- [x] Browser-only populated fixture of actual ReviewPostCard verified at 320/394/1280px: score 30px, two columns, no category overflow; reviewed narrow screenshots. Verdict callback once; category-only 0 overall/1 grid; overall-only 1 overall/0 grid; both-empty 0 block. Apparatus imports corrected without app affordances or temporary project files. These are fixture checks, not authenticated production review navigation; latter remains unavailable on external_unmanaged. No SQL/migrations/RPC/feed_config/cap changes. Prior CB14.1 key conflict remains outside B2 scope.

## PROFILE_SHEET_VIEW_PROFILE_WHITE
- [x] IdentityHeader.tsx `data-view-profile-pill`: color A.AMBER -> A.INK, border `1px solid AMBER_PILL_BORDER` -> `1px solid DARK_HAIRLINE` (already imported for the avatar ring). fontSize 11.5, fontWeight 800, letterSpacing 0.04em, borderRadius 999, padding '5px 10px 5px 11px', whiteSpace nowrap and pointerEvents none untouched; text still "View profile ›". Unused local `AMBER_PILL_BORDER` const and its comment removed (it was a const, not an import); file header records that amber belongs to the notification tile, not this label. No other sheet surface changed.
- [x] New src/test/profileSheetViewProfileWhite.test.tsx, three cases: pill colour is A.INK (and not amber), border is `1px solid` DARK_HAIRLINE (and not the old amber), frozen typography/shape/pass-through values unchanged. No existing test asserted this pill's colour or border — none edited, renamed or deleted.
- [x] Full `bunx vitest run`: 1,989 passing / 264 files before -> 1,992 passing / 265 files after, zero failures; +3 tests / +1 file solely the new test file. tsgo --noEmit clean; preview build OK 2026-10-21T09:11:02Z. Hosted authenticated sheet readback unavailable (external_unmanaged); the test mounts the real IdentityHeader. No SQL/migrations/RPC/feed_config changes; round_pool_cap 30. CB14.1 sheetReach key conflict still open.

## CB36 — gate rebalanced
- [x] Fluid glimpse (0.74, 66%→0.18 mask), three bullets, live scoped count, short-screen rule. Suite 2,094/283 green.
- [ ] Authenticated on-device check (blocked: preview sign-in not available).

## CB38 — gate foot 20px clear of the nav
- [x] Gate card bottom padding 2px -> 20px (RoundsGate.tsx); glimpse (flex 1) gave back exactly 18px. Measured distance from the no-handicap button's border box to the nav's top edge: 2px before -> exactly 20px after at 390x844, 393x852 and 360x640 (controlled harness: real RoundsGate + Section, 54px BOARD_ROW_METRICS rows, 64px nav stand-in at bottom:20 on the real #0A0A0C canvas; authenticated preview unavailable, external_unmanaged).
- [x] Glimpse mask final stop 0.18@100% -> 0.10@92%, transparent@100% on both maskImage and WebkitMaskImage; opacity 0.74 unchanged. Computed mask verified; before/after screenshots show the cut now reaches zero (no ghosting above THE ROUNDS).
- [x] 360x640 shows no board rows (spacer state) — verified pre-existing CB36 short-screen rule, identical before the change; not a CB38 regression, no compensation added.
- [x] No test asserted the padding or mask; none edited. Full suite 2,094 passed / 283 files, zero failures (same total as CB36/CB37). Build OK 2026-10-21T18:53:45Z. Harness files deleted. No SQL/migrations/RPC/feed_config changes; round_pool_cap 30.

## CB39 — Five-round scope minimum, the foot-gap chain, and the scope switch
- [x] `GATE_SCOPE_MIN_ROUNDS` = 5 (`useAmateurBoardState.ts`) **applied to the shared landing ladder for every member**: a rung whose pool held fewer than five rounds was passed over whether or not the viewer was gated, and the same condition drove the skip event. **SUPERSEDED by CB40, which narrowed both to the gated state only — read this entry as superseded in that respect, not as current behaviour.** The four-row floor was untouched throughout.
- [x] Scope switch removed in the gated state (`ScoresLeaderboardsPage.tsx:588`, `gate !== 'gated'`), the sections below moving up into its space; still rendered for connected and signed-out viewers. Three cases in `src/features/explore-magazine/__tests__/gateScopeSwitch.test.tsx`: 'is absent in the gated state', 'still renders for a connected member', 'still renders for a signed-out viewer'.
- [x] `amateur_scope_skipped_below_min` added — fires once when the landing scope settles, once per scope the minimum passed over, carrying `scope`, `rounds`, `landed`, `gate_state`; plain-English name 'Gate scope skipped below five rounds' in `src/features/admin/lib/eventLabels.ts`.
- [x] Copy: the everyone sentence reads "posted in the last fortnight. None of them yours."
- [x] The foot gap (Part 1) was traced from code only and nothing changed — no signed-in preview, so the chain could not be made to add up to Ben's 80pt device read. That unexplained gap is what CB40's diagnostic then measured.
- [x] Full `vitest run`: 2,094 passed / zero failures before -> 2,101 passed / zero failures after; +7 tests, all new (four in `src/features/amateur/__tests__/gateScopeMin.test.ts`, three in `gateScopeSwitch.test.tsx`). No existing test edited, renamed or deleted. No SQL/migrations/RPC/feed_config changes; round_pool_cap 30.

## CB40 — Scope minimum narrowed to gated, and the temporary on-screen diagnostic
- [x] The five-round minimum and its skip event now apply **in the gated state only** (`rungCarries(data, gated)` / `skippedBelowMin(data, gated)`, `useAmateurBoardState.ts:90`, `:108`, `:228`); gate state comes from the same `useWhsConnection` read as the gate itself (`:163`), so there is no second source of truth. A connected member's four-round circle lands on circle again. Three cases added to `gateScopeMin.test.tsx` (4 -> 7): 'connected: a four-round circle still lands on circle', 'connected: the row floor alone decides', 'the skip event condition is gated-only and minimum-only'.
- [x] **Deliberate, time-boxed, not a leak:** `src/features/explore-magazine/GateFootDiag.tsx` was mounted into the live gated state to capture device measurements that could not be read any other way — the preview cannot be signed in (`external_unmanaged`), so no controlled harness could reproduce the real header, real rows and real nav together. It was always meant to come out, and CB41 removed it; see that entry.
- [x] **What the diagnostic found — the value of CB40:** on a 430x932 device the CB35 rule (`roundsGate.css:5-11`) was applying correctly, but `main`'s `height: calc(100dvh - var(--sat, 0px))` subtracted a 59px top inset the element never carries, so `main` ended 59px short of the viewport bottom and the gate's foot gap measured **79px instead of the intended 20px**. The foot-gap fix must be briefed against this, not against the CB38 harness figure.
- [x] Full `vitest run`: 2,101 passed / zero failures before -> 2,104 passed / zero failures after; +3 tests, all in `gateScopeMin.test.tsx`. No existing test edited, renamed or deleted. No SQL/migrations/RPC/feed_config changes; round_pool_cap 30.

## CB41 — Remove the CB40 diagnostic
- [x] Deleted src/features/explore-magazine/GateFootDiag.tsx. Removed its import (RoundsGate.tsx:46) and the `<GateFootDiag />` mount (RoundsGate.tsx:359), both "CB40 TEMPORARY" comments taken with them. Nothing else touched: card 20px bottom padding, CB35 CSS rule, CB38 mask, CB36 short-screen rule and gated-state scope switch all retained; no layout, padding or height adjusted.
- [x] `rg GateFootDiag src public index.html` returns no matches (file gone, no dangling reference). No test file referenced it — none edited, renamed or deleted. `tsc --noEmit -p tsconfig.json` clean; preview build OK 2026-10-21T19:35:39Z. Full `vitest run`: 2,104 passed / 285 files, zero failures — identical to the CB40 total, so no test was lost with the file. No SQL/migrations/RPC/feed_config changes; round_pool_cap 30.

## CB44 — One hold, one paint on the Rounds page
- [x] Hold while session unknown, connection undecided, or In form unsettled; hold draws only the three section placeholders (no scope switch, nothing for In form). Suite 2,104 → 2,110 (+6 hold tests); three CB39 switch tests now wait for the hold to release.
- [x] CB45: a settled failed connection read now releases the hold to the ungated page (CB13 amended). Placeholder-height ruling deferred to its own brief. Suite 2,110 → 2,111.
- [x] CB46: rounds_gate_unknown_fallback once per mount on a failed connection read; admin label added. Suite 2,111 → 2,114.

## CB47 — Media and audio audit (REPORT ONLY)
- [x] Confirm/correct 11 findings on audio focus, speaker icon, blocked lanes, gesture unlock, resume, silent switch, telemetry, buffering, Instagram parity, debug HUD access. No code changes; fixes briefed separately. Report: /mnt/documents/CB47_media_audio_audit.md

## Top 100 progress view played migration (record-only)
- [x] Hook comment replaced with the rated-OR-WHS-round definition (useTop100ProgressForUser.ts). Migration file NOT written: project rule forbids writing migration files and the platform only creates them by executing SQL, which Ben already ran by hand. Exact SQL recorded at docs/sql/2026-10-22-top100-progress-view-played.sql instead.

## Explore: remove Just played section
- [x] Removed JustPlayed from the Rounds page (Competitions now followed directly by Leaderboards), deleted JustPlayed.tsx, dropped the CB28 'just' cases (authorised), comment-only updates in useHeldFrame.ts and scoresLeadBoard.test.tsx. BoardSeeAllSheet, useBoardPage, the 'recent' board and amateur.justPlayed.* keys kept.

## Boards open on Most recent (BRIEF_BOARDS_DEFAULT_MOST_RECENT)
- [x] ExploreMagazine's useAmateurBoardState call drops its 'net' initialBoard argument, so the visible board falls back to entryBoardFor() ('recent'); one-line comment added above the call. useAmateurBoardState.ts untouched. Suite 2,112 / 287 files / 0 failures; tsc clean.

## Liked-by media avatars lose the outer ring (BRIEF_LIKED_BY_MEDIA_NO_RING)
- [x] LikedByRow 'media' path: no outer boxShadow on the slots (surface-only), loading placeholder inset-only; hairline edge and the container's on-media drop shadow kept. 'surface' unchanged. Suite 2,112 / 287 / 0; tsc clean.

## CB54 — Picks sheet: restore four steps, relabel difficulty, lock picks at first tee
- [x] Part 1: restore step1-4 Lead/Body keys in en/tourhub.json + en-XA bracketed forms (README: no de/es/ja/ko — removed on purpose).
- [x] Part 2: figDifficulty -> "COURSE DIFFICULTY" (label only).
- [x] Part 3: status guard ('scheduled'/'created' only) in generate-predictions (server, authoritative) + useAIPredictions (client); boot-log version marker; deploy and confirm live.
- [x] Part 4: tests — locale key guard, lock decision (inprogress/closed refuse, scheduled/created generate), client no-invoke for started tournament with stale row.
- [x] Report suite before/after, typecheck, build; name retargets; stop on new failure.

## BRIEF_COURSES_LATEST_FROM_COURSES
- [x] LatestCoursesSection rail (get_latest_course_media p_limit 15), card grid 198+100/114+114, credit grammar, +N overlay, glass discs; tap opens whole course media set via useGalleryCourseMedia + openWithOrigin ('course-media', readOnly) with mediaId/url/postId/0 fallback ladder; pending dims card and ignores taps.
- [x] LatestCoursesShell in sectionShells; CoursesBrowsePage renders it between ByRegion and MostPlayed; GATE_IDS gains 'latestCourses' after 'byRegion'.
- [x] Latest holes kicker "Hole by hole"; tap fetches get_hole_media (key ['hole-media', course, hole], stale 60s) and opens MediaPreviewViewer at tapped shot with edgeBounce; deep link unchanged.
- [x] Shared buildHoleViewerItems extracted to src/lib/courseMedia/holeViewerItems.ts; HoleWalk consumes it (output unchanged) and passes edgeBounce.
- [x] MediaPreviewViewer optional edgeBounce prop: dx*0.35 capped 80px, 250ms ease-out spring-back, index unchanged; default false.
- [x] Full `bunx vitest run`: 2,748 passed /339 files /0 failed, from 2,707/335 (+41 tests, +4 files: latestCoursesSection.test.tsx, holeViewerItems.test.ts, mediaPreviewEdgeBounce.test.tsx, latestHolesSection.test.tsx net +2). Authorized retargets in latestHolesSection.test.tsx: navigation-on-tap assertions and kicker. tsgo clean. Live RPC/auth verification unavailable (external_unmanaged). No SQL/migrations/RPC/feed_config changes; cap 30.
- [x] CB84 Insights section 3 "Your golfers": useBusinessAudience (key ['business-audience', id], period-independent) + InsightsAudienceSection replacing the locked "Who's viewing you" card; ready/not_enough/none states, server-merged bands/regions rendered as returned; audience locale keys removed (en/en-XA); cb82 AUDIENCE-count assertion retargeted 2→1 (authorized). Suite 2,903/350 clean; tsc clean. Live RPC read unverified. No SQL/RPC/config changes; cap 30.

## CB98.1 — page foot wording
- [x] Privacy foot line on Your courses now reads the signed-off mock sentence exactly (ClubAnalyticsPage.tsx); styling unchanged.
- [x] Retargeted the only assertion of the old sentence, cb91CoursesTop.test.tsx:43 regex. Full bunx vitest run 3,293 passed /381 files /0 failed (unchanged total, no new files); tsc clean; harness build OK.

## CB101 — Reviews reply sheet: one identity line
- [x] Removed the "Posted publicly as the business" span under the textarea in BusinessReviewsPage.tsx; the row is now justify-end and holds only the counter (12px, tabular-nums, INK_45, RED above 900 unchanged). Header line untouched.
- [x] No existing test asserted the phrase (grep: none), so none was retargeted. Added src/test/cb101ReplySheetLine.test.tsx (2 cases: line reads once inside the header; counter row holds only "0/1000" and keeps the header line's colour).
- [x] Full bunx vitest run 3,320 passed / 1 failed / 3,321 tests / 384 files; tsc clean; harness build OK. The one failure is pre-existing: cb99InsightsCourse.test.tsx:82 "course card follows Reviews; sections one to seven still settle" (expected null not to be null), carried from CB100.

## CB101.1 — Retarget the CB99 page test after CB100 (test only)
- [x] cb99InsightsCourse.test.tsx "course card follows Reviews; sections one to seven still settle": the rpc mock now returns a ready audience for get_business_audience (same shape as the cb84 audience() fixture), so the awaited [data-card="audience"] resolves under CB100's none-draws-no-card rule. No app code changed, no other test touched.
- [x] Restored from the earlier ruling that had renamed this test and dropped 'audience' from the awaited selector list; CB101.1 rules the strong form (name unchanged, audience awaited), and cb84 "none renders no card" already covers the empty-state absence.
- [x] cb99 file 25/25. Full bunx vitest run 3,332 passed / 387 files / 0 failed. Baseline 3,321/384 at CB101 plus profileFeedInViewGate (+6/+1), review-wizard overlay-chrome lifecycle test (+1/+1), mediaTrayAddTileFirst (+4/+1). tsgo not run (test-only change); harness build OK. No SQL/migrations/RPC/edge-function/feed_config changes; round_pool_cap stays 30.
