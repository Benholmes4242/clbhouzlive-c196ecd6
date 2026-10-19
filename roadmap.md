# Roadmap

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
