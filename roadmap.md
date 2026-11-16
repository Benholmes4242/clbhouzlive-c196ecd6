# Roadmap

## In progress: Three fixes Nov 16
- Capitalise shared long news ages; retain short forms and digit/date forms.
- Match handicap glance move/dot to drawn round window, preserving no-line fallback and island chip.
- White enabled comment send button, disabled/business identity unchanged; check 320/375 and four shards against 8,948.

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
