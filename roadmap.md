# Roadmap

## Stopped: Fullscreen viewer follow-up
- Authorised stops cleared; grouped review moments and tapped-media opens implemented on all three surfaces; unmatched post guard/warning and RPC missing-score coverage added. Focused 106/106; harness build OK.
- Shard 1: 2,238 passed / 1 failed; coursesRailsUnlimited.test.tsx:134:20 still expects removed readOnly:true. Isolated reproduces 14/15, 336ms. Test untouched; shards 2–4 blocked on ruling. Inventory 9,118 → expected 9,132 (+14 across previous build and follow-up); full report .lovable/reports/fullscreen-viewer-action-pills.md.
- Ben's physical iPhone/live-data verification remains external: You moments engagement and JohnL's five Media/Watch review scores.

## Previous stop: Fullscreen viewer action pills everywhere
- Implemented source-post batch/actions, interactive opens, card score strip and missing-score fallback; scoped font ruling applied, matching app stack.
- Focused 97/99; isolated 18/20 reproduces canonicalFullscreenViewer:99 scan matching an obsolete comment and memberShotsVerticalPaging:49 exact object omitting new sourcePostId. No shards run; inventory 9,118 → expected 9,125 (+7).
- Await failure rulings; ShotTagCard source/course identity and precise JohnL dropping-source audit remain incomplete. Full error/assertion report: .lovable/reports/fullscreen-viewer-action-pills.md.

## Complete: Review video tile posters
- JSON-safe stream identity and canonical posters implemented for sheet/Latest reviews; unknown video URLs suppressed, photos unchanged.
- Corrected only this brief's new avatar fixture to preserve real exports; no assertion changed. Focused 24/24; typecheck clean.
- Four sequential shards 2,238 / 2,246 / 2,276 / 2,316 = 9,076/9,076, exactly 9,071 + five new cases. Report .lovable/reports/review-video-tile-posters.md; Ben's Dundonald iPhone playback check remains required.

## Complete: Text-flow AM/PRO badge height
- Changed only the two supplied text-flow CSS rules; extended the existing review text-flow case, preserving every original assertion. No test count delta.
- Focused 16/16; four sequential shards 2,225 / 2,245 / 2,273 / 2,328 = 9,071/9,071 (808 files), before/after unchanged. Chromium geometry: both badges 16px, labels centred, two-line clamp preserved. Ben's iPhone check remains required; report .lovable/reports/text-flow-badge-height.md.

## Complete: Authorised player next-start test replacement and remaining shards
- Replaced only tourPlayerHeroBand's retired pick-button case with the supplied no-pick-action case; removed its onPick fixture. File count 4 → 4; focused player checks 17/17.
- Retained successful shard one (2,225), restarted two then ran three/four sequentially: 2,245 / 2,273 / 2,328. Full suite 9,071/9,071 across 808 files; zero inventory delta (one deleted, one added). Historical stops below are superseded by this passing closeout.
- Exact replaced case/assertions and full reconciliation in .lovable/reports/tee-time-group-duplicate.md; physical iPhone excerpt validation remains unverified.

## Stopped: Tee-time group duplicate fix — unrelated retired pick-action test
- Requested one-expression fix and single regression complete; four focused Tour files pass 81/81, including unchanged duplicate-tag assertion.
- Sequential shards: 1 passes 2,225; 2 has 2,244 passed / one failed of 2,245 at untouched tourPlayerHeroBand.test.tsx:18:310, "Error: Missing pick". Shards 3–4 not run per stop rule.
- Expected inventory 9,071 = 9,164 − 100 Your pick cases + 4 removal regressions + 2 excerpt regressions + 1 duplicate regression; full passing total unavailable. All historical names/assertions and exact stop in .lovable/reports/tee-time-group-duplicate.md. Needs ruling on the untouched retired pick-action test.

## Stopped: iPhone review excerpt text flow — existing Tour test blocker
- Opt in clamped member names/badges to inline text flow; preserve default names, two-line review clamp and badge artwork.
- Inline flow applied to review/comment/overlay names and two verified business-name wrappers. New structure regressions plus existing coverage pass 16/16; preview build OK.
- Shard 1 stopped: 2,224 passed / 1 failed of 2,225 at unchanged yourPickRemoval.test.tsx:31:18 (duplicated tee tags). Shards 2–4 not run; expected inventory 9,070 (+2 from 9,068). Ben's iPhone validation remains unverified.
- Report: .lovable/reports/review-excerpt-iphone.md.

## Stopped: Your pick removal
- Remove member pick entrypoints, reads, unused modules and unreachable copy; preserve Our picks and Clubhouse tour.
- Focused checks: 251 executed / 246 passed / 5 failed, plus 2 unhandled errors. Shards not run. Expected inventory 9,068 (9,164 − 100 retired cases + 4 regressions).
- Preview follow-up: required empty expect array restored; affected Our picks tests pass 55/55 and harness build OK. Still blocked by new tee-tag regression expecting one occurrence of a group rendered twice; assertions unchanged, shards not run.
- Report: .lovable/reports/your-pick-removal.md.

## Complete: Latest reviews taps and gaps — suite and public spacing
- Record-shaped hero loading, remove media rail label, isolated media viewer taps with full review media and dimensions, and section-owned equal end gap.
- Approved fresh mount passes; sequential shards 2,296 / 2,267 / 2,267 / 2,334 = 9,164/9,164 (809 files, +4 from 9,160). Public preview gaps 34/34px, title gap 12px, 320 containment verified. Signed-in What’s been played seam and viewer swipes unavailable/unverified. Report: .lovable/reports/latest-reviews-taps-and-gaps.md.

## Complete: Review card contract repairs and sequential suite
- Apply only the approved courseSubScoreTone calls and explicit mosaic columns/rows in ReviewRailSlot; no test edits.
- Focused 74/74; sequential shards 2,293 / 2,253 / 2,269 / 2,345 = 9,160/9,160 across 807 files, zero count delta; no tests edited. Both prior stops resolved. Report: .lovable/reports/persisted-sets-fix.md.

## Stopped: Approved review selector and sequential suite rerun
- Change only cb69CourseNameLink.test.tsx:81 to [data-review-course]; preserve all assertions and test inventory (expected 9,160).
- Shards 1/2 passed 2,293 and 2,253; corrected file passed 19/19. Shard 3: 2,267 passed / 2 failed, at courseRatingConsistency.test.ts:119:20 and fixOverflowSource.test.ts:66:24. Shard 4 stopped; 6,815 executed / 6,813 passed. Further repairs need a ruling; exact failures in persisted-sets report.

## Stopped: Persisted sets fix — unrelated existing tap test
- Convert Featured signals and browse review stamps to JSON-safe arrays with memoized Set consumers and legacy-object guards.
- Audit all allowlisted query payloads; add restoration regressions; run focused tests and four sequential shards, stopping on any unexpected failure.
- Restoration focused tests 3/3; shard 1 2,293 passed, shard 2 2,252 passed / 1 failed at cb69CourseNameLink.test.tsx:81:19 (missing old data-review-rail-course target). Shards 3–4 stopped; needs explicit test-repair ruling. Expected inventory 9,160; report .lovable/reports/persisted-sets-fix.md. Authenticated reload unavailable on external Supabase.

## Stopped: Latest reviews magazine — brief/mock ruling
- New request: replace the Courses Latest reviews card with separate media-magazine and written rails, review-owned media, active Top 100 stamps, matching shells and sequential suite verification.
- Width conflict: brief §3 specifies min(300px, 100vw - 64px) for both rails; signed-off mock .wr specifies min(290px, width - 64px). Awaiting Ben's ruling before implementation. Report: .lovable/reports/latest-reviews-magazine.md.

## Complete: Two authorised rulings and full-suite closeout
- Apply only the two remaining paging observer waits and the featured-connected async thunk; preserve every expected value and proVerification2B tests.
- Focused 56/56 passed. Four sequential shards: 2,290 / 2,253 / 2,269 / 2,344 = 9,156 passed, 806 files, zero failures; expected inventory unchanged. Prior feed/business test stops resolved; authenticated checks remain unavailable. Report: .lovable/reports/two-rulings-suite-closeout.md.

## Stopped: Business posts always Everyone — verification
- Force public audience across create/edit/draft/schedule/shot writes and remove business audience doors; preserve personal choices.
- Six new rule tests pass; typecheck/build clean. Shard 1: 2,290 passed plus unhandled `supabase.from is not a function` at circle.ts:44 from untouched proVerification2B.test.tsx; shards 2–4 stopped. Expected inventory 9,156; report business-posts-always-everyone.md. Feed paging remains separately stopped without further test authorisation.

## Stopped: Feed pages by seen posts — authorised correction
- Replace date cursor/ref with actor-scoped cached exclusions and numeric pages; remove reset caller.
- Earlier-page exclusions, two approved waits and [a,b]/[c,d] regression complete. Focused 7/9 passed; stopped on new failures at useSuggestedFeed.paging.test.tsx:53 and :91. Shards/typecheck unrun; expected inventory 9,150 against 9,142.
- Real-account paging unavailable on external Supabase; document the 500-id exclusion limitation.

## Stopped: Courses dock anchor — awaiting ruling
- IslandDock re-observes replaced anchors with same-frame recompute; Courses tab row rendered once; 9/9 dock tests pass.
- 12 failures in four jsdom consumer test files (zero rects read as "above the islands"). Awaiting ruling: A (product zero-rect guard) or B (rect stubs in four test files). Report: .lovable/reports/courses-dock-anchor-stop.md. Commit 8dbdb60d48.

## In progress: Auth squircles
- 34%-of-height radii on sign-in/code controls via named custom properties, compact-block pairs, square look-around band.
- Centre Verify/social spinners via flex on .auth-hero-pill (and .auth-hero-circle if needed).
- Update old radius assertions; add CSS-radius test and OtpSheetContent spinner test; width/height checks with spinner centre measurement; four shards.

## Complete: Profile rail follow-up — authorised test closeout
- Replace stretched SVG dots with fixed 8px HTML markers below the end dot.
- Add missing date/interpolation, round markers, rail/taps, comment-link, counters and cover regressions.
- Localise the heading; remove obsolete hero counter props/callers without deleting share figures.
- Authorised four assertion repairs only; no product changes. Full suite 8,991 passed (2,284 / 2,196 / 2,237 / 2,274), 778 files, +13 from 8,978. Own/visitor actual-chart fixtures measured 8×8 dots at 320/375/430; authenticated profiles unavailable. Report: .lovable/reports/profile-rail-followup-authorised.md. Earlier stop report retained.

## In progress: Tour finished week
- Shared cumulative champion/next-two chart and collision-free labels; keep hole-type row.
- Inline full-board row and four week figures.
- Shared DP World/Korn Ferry picks gate across tournament entry points/readers and records; completed viewer card absent.
- Spread recap columns; inherit touched Tour fonts.
- Four shards passed 8,978 (2,284 / 2,196 / 2,237 / 2,261), +24 from 8,954; 777 files. Actual-component chart/recap widths checked. More-row misalignment specificity fix awaits visual verification after the profile stop. Production authenticated checks unavailable.

## Complete: Authorised profile rail test correction
- Replace contour fallback in member/business covers; preserve photo layers.
- Time-scale index points and interpolate last-five dots; replace tiles with newest-first rail.
- Remove member counters and number-one reaction/count reads; preserve notification comments deep links.
- Full suite 8,954 passed (2,276 / 2,176 / 2,240 / 2,262), unchanged count; only the authorised rendered gross-score selector/order expectation changed.
- Original profile width checks and new geometry/deep-link tests remain unverified/not added under this limited follow-up. Report: .lovable/reports/profile-rail-test-correction.md.

## Complete: Three fixes Nov 16
- Capitalise shared long news ages; retain short forms and digit/date forms.
- Match handicap glance move/dot to drawn round window, preserving no-line fallback and island chip.
- White enabled comment send button, disabled/business identity unchanged; verified 320/375. Full suite 8,954 (2,276 / 2,176 / 2,240 / 2,262), +6 from 8,948. Report: .lovable/reports/three-fixes-nov16.md. Signed-in checks unavailable; glance/composer checked with isolated actual-component fixtures.

## Complete: Course list view toggle
- Add one storage-safe preference and signed-off switch across Courses and Top 100; cards remain unchanged.
- Add compact rows, shared lead formatting, list skeletons and opt-in chip overflow fade; preserve taps/search/paging.
- Verified live sorts/orders, shared preference and long-name/area matrices at 320/375/430; record stays visible. Focused 69 passed; full suite 8,948 (2,276 / 2,170 / 2,240 / 2,262), +21 from 8,927. Report: .lovable/reports/course-list-view-toggle.md.

## Complete: Course list card V2
- Share the signed-off 150px card across Courses and Top 100, with sort-led figures, short names, record row and existing ratings.
- Batch member faces with holder profiles, preserve full-list positions under search, and inherit the app font.
- Verified 320/375/430 real-card matrices and live search/Top 100/course navigation. Full suite 8,927 (2,258 / 2,181 / 2,230 / 2,258), +28 from 8,899. Report: .lovable/reports/course-list-card-v2.md. Authenticated member-face appearance remains unavailable.

## Complete: Latest holes H1
- Restore the top-right number/par label, mock scrims and shared short course names; viewer and behaviour frozen.
- Replace five authorised Option A cases, add H1 examples and verify focused/four-shard tests.
- Pale-sky 320/375/430 verified without overflow; focused 57/57, full suite 8,899 (2,268 / 2,158 / 2,229 / 2,244). Report: .lovable/reports/latest-holes-h1.md. 

## Complete: Latest holes Option A closeout
- Append the committed Option A changes, exact −16/+4 test reconciliation and unchanged course-name audit.
- Correct shared ordinal suffixes while retaining holes 1–18; run focused tests and four separate full-suite shards.
- Verified longest live rail name at 430px: all page widths 430, no overflow. chipForLens unchanged. Focused 62/62; shards 2,268 / 2,158 / 2,229 / 2,239 = 8,894. Report appended.

## Complete: Admin side menu v3
- Match the signed-off drawer, share Do now totals, preserve open-only full-admin reads and search behaviour.
- Authorised enclosing-name-span assertion correction complete; AdminDrawer.tsx unchanged. Focused 56/56; four separate shards passed 2,255 / 2,146 / 2,217 / 2,228 = 8,846 (8,834 + 12), zero failures/skips. Build OK; report .lovable/reports/admin-side-menu-v3-testfix.md.
- Device appearance check is Ben’s; no admin screenshots requested.

## Complete: Admin Command centre v3 + v3B
- Rebuilt the dashboard to the signed-off dense layout; preserved AdminShell, the v2 reader and the October health status; added the engine reader.
- v3B cleared the three stopped checks: panel helper scoped to panel headings, under-par colour asserted through `data-tone` plus source/token checks, and the CSS/status/bar repairs.
- Added 3 cases (30 → 33). Four separate shards passed 2,243 / 2,135 / 2,212 / 2,224 = **8,814** (8,797 − 16 authorised v2 deletions + 30 v3 + 3 v3B). Build OK; report .lovable/reports/admin-command-centre-v3b.md. Admin on-device check remains outstanding.

## Complete: Tour slot final-round kicker
- Use the overview FINAL ROUND translation only on the scheduled last live round; preserve the LIVE header and all other rounds.
- Added one state case (13 → 14); four separate shards passed 2,243 / 2,118 / 2,212 / 2,224 = 8,797 (baseline 8,796 + 1). Build OK; report .lovable/reports/tour-slot-final-round-kicker.md. Live on-screen follow-up remains unverified.

## Complete: Clubhouse Tour slot all states
- Share round spine and movement computation without changing Tour overview output.
- Add single-leader portrait, result sentence, live five-row board and collapsed top-three result/prior-year boards.
- Added 13 state cases; four separate shards passed 2,243 / 2,118 / 2,211 / 2,224 = 8,796 (baseline 8,783 + 13). Build OK; report .lovable/reports/tour-slot-all-states.md. Real-member and 390/320 visual comparison remain unverified.

## Complete: OWGR approval — authorised finish
- Retained the authorised no-player confirmation click in proVerification1; added the explicit chosen-player first-click regression case.
- Four separate shards passed: 2,236 / 2,106 / 2,203 / 2,215 = 8,760 (8,748 + 11 + 1), zero failures or skips.
- Harness build OK at 2026-11-15T10:55:31Z; report .lovable/reports/pro-owgr-at-approval.md. Production authenticated flow unverified; no SQL or real sync.

## Signed-off sign-in redesign — tests complete; visual checks outstanding
- Authorised caret fix complete: removed only the email caret override; amber dot token retained. Focused 64/64, shard 3 2,196/2,196 and shard 4 2,229/2,229; with previously passed shards 1 (2,203) and 2 (2,116), all 8,744 passed. No test changes; report .lovable/reports/sign-in-caret-fix.md.
- Replace choose/email presentation only; preserve social/code/session behavior and exported logos.
- Apply clarified bottom padding max(34px, calc(14px + env(safe-area-inset-bottom, 0px))); small-phone band uses max(18px, calc(14px + env(safe-area-inset-bottom, 0px))).
- Test step focus/back/email/guest navigation; run four separate shards and report against 8,731, stopping on unexpected failures.
- Focused 64/64; shards 2,203/2,203, 2,116/2,116, 2,196/2,195 (one failure at ep51SearchAndCarets.test.tsx:32:23); shard 4 unrun. Expected inventory 8,744 (+13 from 8,731), not fully executed.
- Correct preview type error only: replace unsupported initImmediate with initAsync in the new test provider; assertions/source unchanged. Prior caret sweep stop resolved by source-only fix; original stop report .lovable/reports/sign-in-redesign-stop.md retained as history. 390/320 visual and real sign-in checks unverified.

## Complete: Simpler Clubhouse Tour post
- Remove picks/record display and record read only from TourSlot; preserve prediction resolver and shared rules.
- Apply signed-off 162px photo, compact header/actions/sentence/board/comment; update only authorised Tour slot tests.
- Focused 44/44; shards 2,203 / 2,110 / 2,196 / 2,222 = 8,731 passed (+4 from 8,727); report .lovable/reports/tour-slot-simpler.md. Real-member 430/320 visual comparison remains unverified.

## WAGR profile ranking line — tests complete; visual checks outstanding
- Add the shared server-gated ranking line below the index, or independently when the index is absent; preserve the rest of the profile and examples.
- Focused 54 executed / 53 passed / 1 failed: new example-mode case lacks QueryClientProvider (useDeclineHandicapChip.ts:15:23). Stop rule prevents shards; report .lovable/reports/wagr-profile-line-stop.md. Expected inventory 8,727 (+13 from 8,714). Visual checks remain unverified.
- Authorised testfix complete: only the example render gains a fresh QueryClientProvider inside MemoryRouter; assertions/source unchanged. Focused 54/54; four separate shards 2,203 / 2,110 / 2,196 / 2,218 = 8,727 passed, zero failures. Inventory unchanged by this fix; report .lovable/reports/wagr-profile-line-testfix.md. Prior stop resolved; visual checks remain unverified.

## WAGR Career — tests complete; visual checks outstanding
- Authorised test-fix returns empty amateur career moments in the Ranking mock only; all assertions and source unchanged. Focused 80/80 and four separate shards 2,224 / 2,083 / 2,187 / 2,213 = 8,707 passed; diff and totals in .lovable/reports/wagr-career-testfix.md.
- Add career reads/timeline and reuse parameterised pro career sheets; preserve pro behaviour and existing five-row fixture.
- Save uploaded 124-row Lewy history in src/test/fixtures/lewy-amateur-rank-history.json; verify 5 wins / 21 top 10s / 46 events and exact ten-entry order.
- Prior focused stop (76/80) is resolved by the authorised mock-only fix; inventory remains 8,707 (+16 Career cases from last passing 8,691). Requested 390/320 comparison and authenticated flows remain unverified; no SQL or migrations.

## Complete: WAGR server-owned decision notifications
- Remove client notification insertion; preserve review RPC → amateur invalidation → approve-only sync.
- Authorised cases replaced; four separate shards passed 2,224 / 2,083 / 2,187 / 2,197 = 8,691. Delta −2 from 8,693 names the two obsolete notification cases in .lovable/reports/wagr-notify-server.md; no unexpected failures.

## Complete: WAGR AM name badges — authorised test narrowing verified
- Authorised WAGR AM badge test fix: narrow only the two PRO read counts (and identical aggregate-count failures if encountered), then run all four app shards; no source changes.
- Add batched verified-amateur cache, shared name marks, profile cover and visible admin-row badges with PRO priority.
- Invalidate after WAGR review/request/removal; preserve fonts, badge design, island handicap and existing PRO tests.
- Run focused coverage and all four app shards; report files and reconcile against 8,667.
- Focused 104 executed / 103 passed / 1 failed; all 26 new tests passed. Existing proVerification2.test.tsx:43:39 counts all RPCs and now sees both PRO and amateur reads. Four shards stopped; test-side authorisation needed. Inventory 8,693 (+26); preview build OK.
- Finish brief: no source or test changes; four separate commands passed 2,224 / 2,083 / 2,189 / 2,197 = 8,693, zero failures. Eight narrowed assertion sites in six files documented with exact diff in .lovable/reports/wagr-am-badge.md; inventory unchanged from the test-fix request.

## WAGR Settings: tests complete; screenshots outstanding
- Add amateur link/pending/verified cards and link/unlink sheets; tour-pro-only results card with shared optimistic privacy switch.
- Add nonfatal review notifications before approval sync; test all states and four independent shards.
- Type errors corrected without changing assertions; preview build OK. Four separate shards 2,211 / 2,046 / 2,186 / 2,197 = 8,640 passed (+35 from 8,605); report .lovable/reports/wagr-settings-typefix.md. Requested screenshots still outstanding; real authenticated checks unavailable on external Supabase.

## Complete: WAGR server and admin review
- Remove and undeploy the disposable probe; add shared WAGR reads, member linking and sequential verified-member sync without SQL or schedules.
- Reuse admin verification rows/details and add verified amateurs; preserve existing golfer/pro decisions.
- Add mocked Deno and admin tests, run four independent app shards, deploy only the two new functions; never invoke the real sync.
- Both functions deployed; probe undeployed. App shards 2,206 / 2,023 / 2,186 / 2,190 = 8,605 (+5); Deno 28 passed. Report .lovable/reports/wagr-server.md. Cron name/schedule unverified without prohibited SQL; emails unsupported; authenticated checks unavailable. No real sync invoked.

## Complete: Personal identity badge wrapping — authorised test fix
- Group personal-profile badges and wrap them below the unchanged heading when needed; preserve every badge style and pro-profile surface.
- Apply the two authorised structure updates, add one source case and run tests; stop on any other failure without changing its assertion.
- Focused 44 executed / 43 passed / 1 failed: proBadgeMembers.test.ts:50:76 expects a direct-sibling H1, now undefined. Four shards unrun; inventory 8,600 (+1), last passing baseline 8,599. Authorisation required to inspect the badge group's previous sibling instead; report .lovable/reports/identity-badges-wrap-stop.md.
- Authorised follow-up replaces only that assertion with the identity-badges parent and its preceding H1 checks; run all four shards separately with no source changes.
- All four separate shards passed 2,206 / 2,023 / 2,185 / 2,186 = 8,600, zero failures; follow-up inventory unchanged, +1 from last passing baseline 8,599 due to the wrap source case. Before/after and full names: .lovable/reports/identity-badges-wrap-testfix.md. Visual checks remain unverified.

## Complete: Creator amber members badge
- Share the existing amber badge rule and foil lettering with Creator; preserve name/PRO/Creator order and the existing heading clamp.
- Remove the unused Creator ground token and independent pill rule; add four badge cases, preserve existing assertions and run four separate shards.
- Four separate shards passed 2,206 / 2,022 / 2,185 / 2,186 = 8,599 (+4 from 8,595); preview build OK. Changed lines, grep and all test names: .lovable/reports/creator-badge-amber.md. Authenticated 320px visual checks remain unverified.

## Complete: Signed-off amber members badge
- Replace only shared badge tokens, ProLabel markup and badge/island styles; keep PRO eligibility and callers unchanged, with AM supported but unused.
- Replace the five authorised pearl tests with seven member-badge cases; run each of the four shards separately and report exact source, assertions and totals.
- Four separate shards passed 2,206 / 2,018 / 2,185 / 2,186 = 8,595 (+2 from 8,593); preview build OK. Full source, deleted assertions and test names: .lovable/reports/member-badge-amber.md. Authenticated visual checks remain unavailable.

## Retired by WAGR server brief: Read-only WAGR feasibility probe
- Add and deploy only probe-wagr-profile with existing service-role/admin authentication, sequential public reads and complete response evidence.
- Invoke once for lewy-hayward-41967; save the full response and invocation auth in .lovable/reports/wagr-probe.md, or report unavailable access and stop.
- No SQL, migrations, persistence, scheduling or client changes.
- House CORS correction validated: three Deno tests passed; deployed only probe-wagr-profile.
- Exactly one invocation attempted; HTTP 401 {"error":"Unauthorized"}. No usable auth was injected, no WAGR requests ran, and no retry was made. Ben must invoke with service-role or signed-in-admin authorization; full response in the report.

## Complete: Member-shot vertical paging follow-up
- Latest holes opens one synthetic page per ready shot; course rail opens one page per loaded course with sideways media.
- Preserve the tap snapshot and append neighbour media without moving existing slides; add scoped tests and run four separate shards.
- Focused 92/92 passed; shard 1 executed 2,183 (2,181 passed, 2 failed). Shards 2–4 unrun under the stop rule.
- Applied the authorised coursesPhotoTopScrims mock exports only; existing memberShot fields refresh in place with repeat-call identity stability.
- Separate shards 2,183 / 2,039 / 2,185 / 2,186 = 8,593 passed, zero failures; +11 from the 8,582 baseline, no delta in this follow-up.
- Reports: .lovable/reports/member-shots-vertical-paging.md and member-shots-vertical-paging-followup.md; authenticated browser checks remain unavailable for the externally managed service.

## Complete: Member-shot gallery layout
- Share one gallery-layout predicate for rect, backdrop, gradient and notch protection; leave chrome and open calls unchanged.
- Nine new synthetic/non-synthetic regression cases; separate shards 2,170 / 2,036 / 2,179 / 2,197 = 8,582 passed (+9 from 8,573).
- Changed lines, CSS loading and assertion accounting: .lovable/reports/member-shot-gallery-layout.md. Real-member browser checks remain unverified.

## Complete: Follow tile posted-age lines
- New pure tilePostedLine (days/weeks/months/over-a-year) replaces activityLine on the tile only; active ring unchanged.
- findPeople.tile.* keys added to all six locale files; +16 tests.
- Shards 2,170 / 2,032 / 2,181 / 2,190 = 8,573 passed. Report: .lovable/reports/follow-tile-posted-age.md.

## Complete: Counting eight A2 tile grid + NET
- NET via one useRoundNetScores call; detail block lines swapped (counts right of course, date after DIFF).
- Two-column tile grid replaces the chip box; dimming only when the selected round counts.
- Authorised test edits (a)–(d) only; shards 2,168 / 2,020 / 2,183 / 2,186 = 8,557 passed. Report: .lovable/reports/counting-eight-a2.md.

## Complete: Follow tile buttons + Tour slot photo height
- Follow/dismiss Buttons drop variant/size classes; in-tile CSS raised to two-class specificity, values unchanged.
- Tour slot photo is TOUR_SLOT_PHOTO_HEIGHT = HERO_PHOTO_HEIGHT - 10 (340); overlay bottom-anchored.
- Authorised rail-only assertion fix in proVerification2B (old inline-style line quoted in report).
- Four separate shards: 2,168 / 2,020 / 2,183 / 2,185 = 8,556 passed, zero failures. Report: .lovable/reports/follow-tile-buttons-tour-photo.md.

## Complete: Signed-off Option B follow tiles
- Shared rail tiles use settled media → cover → no-image selection with poster-only video glyphs; follow/dismiss/session/order/header/analytics preserved.
- Authorised test-side fixes: kindRails Follow selector, proVerification2B settled covers/media mocks.
- Verified within the 8,556 full-suite run above; earlier stop reports: .lovable/reports/follow-tiles-option-b-stop.md, follow-tiles-option-b-authorised-fix.md, follow-tiles-option-b-mock-fix.md.

## Complete: Tour slot placement and shared photo height
- Move the slot after post 8 and Pros after post 10; all sibling placements stay unchanged.
- Import the shared hero photo height without moving the overlay or changing other styles.
- Two placement cases updated; separate shards passed 2,168 / 2,020 / 2,173 / 2,173 (8,534, unchanged). Report: .lovable/reports/tour-slot-placement-height.md.

## Complete: Four-build test verification and authorised repairs
- Both final test-only repairs applied exactly; CSS assertions and Tour slot binding assertions preserved.
- Four separate shards: 2,155 / 2,026 / 2,159 / 2,187 passed; full suite 8,527 passed, 748 files, zero failures.
- Notch/tie, observer repair, Option E and saved Tour slot are suite-verified; all new/changed cases, old assertions and count reconciliation: .lovable/reports/combined-tour-final-tests.md.
- Ben's 390/320 comparison and real-member like/comment verification remain pending; no application code changed in these final repairs.
