# Roadmap

## Tour menu Live board
- [x] Signed-off menu presentation and slug-owned single selection; shared picker membership/behavior preserved.
- [ ] Add focused live-board/selection coverage, 320px geometry and four shards; pre-existing EXP_RING_1 failures remain untouched.

## EXP_RING_1
- [x] Audit Explore-only avatar callers; resolve brief discrepancy as Tour-matching 1px traced personal ring, business 0.5px inset as requested; amber/shared/Tour unchanged.
- [ ] STOP: focused 35 pass/19 fail; new expRing1.test.tsx:31:33 `expected '' to be 'none'`; untouched ws3WatchBottom mock lacks DARK_HAIRLINE (17 failures). No failing assertions repaired; four shards/browser blocked. Baseline 7,024 / 620, expected +3/+1; exact evidence and sweep in EXP_RING_1_REPORT.md.

## Island PRO badge only
- [x] Remove island caption/helper and scope signed-off 22px badge; keep profile tap/divider and pending/amateur behavior.
- [x] Focused 26/26; measured 22px/10.5px island badge and unchanged shared sizes. Fresh shards 1,827 / 1,673 / 1,774 / 1,750 = 7,024 / 620, zero failures; baseline 7,036 minus twelve named retired caption cases. Ledger and browser limits in ISLAND_PRO_BADGE_REPORT.md.

## HS2_FOOTER
- [x] Move intro actions/loading CTA to shared FooterBar; preserve content/data/later stages, update only CTA place to footer.
- [x] Focused 26/26; fresh shards 1,827 / 1,673 / 1,774 / 1,762 = 7,036 / 620, zero failures. Three added cases; two end→footer payload assertions/case names documented in HS2_FOOTER_REPORT.md. Interrupted shard3 log retained; separately rerun green. Preview build OK; browser/live checks unclaimed.

## HS2 — Handicap sync seat
- [x] Replaced intro only with settled full/empty seat; preserved shared exports and later stages, removed unused course reader while retaining done-stage suffix helper.
- [x] Focused 23/23; shards 1,824 / 1,673 / 1,774 / 1,762 = 7,033 / 620, zero failures. Net +6/+1 from 12 new cases minus six obsolete helper cases. Exact assertion ledger and logs in HS2_REPORT.md.
- [x] Actual intro fixture geometry/actions verified at 390×844 and 320×844 in both states, long names wrap/no overflow/first-screen CTA; frozen mock differences reported. Hosted authenticated read/next-stage checks unavailable with external unmanaged auth and not claimed.

## Pro polish
- [x] Applied pending no-handicap states, small island captions, Settings pending/inert Privacy and authorised Admin Verified/visible-row reads. Details and limits in PRO_POLISH_REPORT.md.
- [x] Focused 66/66; assertion ledger and +30/+2 inventory reconciliation saved (expected 7,027/619).
- [ ] STOP: fresh shard1 1,829 pass; shard2 1,658 pass/1 fail at untouched CH1 line78:66, `expected null not to be null`; full logs retained. Shards3–4/browser and remaining parent/Inbox coverage blocked by stop; CH1 fixture authorisation needed.

## FIX6 — Sign-up and pro fixes
- [x] Implemented reachable cropper containment/zoom, shared comments material, account media-query paint, member-only settled setup guard/error routing/step-one Skip, pro focus/copy. Legacy unmounted personal modal left unchanged.
- [x] Added 17 tests/3 files; focused 107/107 and surfaces 22/22. Exact old/new assertion/string ledger in FIX6_SIGNUP_PRO_REPORT.md; source inventory expected 6,997/617 including CH1, not full-suite passing total.
- [ ] STOP: fresh shard1 1,820 passes; shard2 1,663 pass/1 fail at untouched CH1 test line78, `expected null not to be null`. Full logs retained; shards3–4 not run. Await CH1 field-fixture authorisation; no failing test repaired.
- [ ] Browser natural-aspect harness timed out before ready; no geometry result. Physical Safari/native first-open/install/OAuth checks unavailable. Explicit focus/pro-copy absence coverage remains open at suite stop.

## CH1 — Champions tidy
- [x] Prerequisite audited: posted eligibility does not guarantee You reach; independent failed reads and empty reach rows suppress it. Source evidence in CH1_REPORT.md; no product/test edits.
- [x] Ben chose Successful reads only: proceed and accept absent reach after errors/empty rows; You stays frozen.
- [x] Scoped product edit implemented: posted What it takes removed, Defence retained, course-only Elsewhere suppressed, posted link calls existing handler/analytics and resets actual scroll owner; You/Field/Projected untouched.
- [x] Type-error-only follow-up added missing nullable CourseSelection fields to new test line 44; preview build OK 2026-11-05T17:50:18Z, assertions unchanged.
- [ ] STOP: new ch1ChampionsTidy.test.tsx:78:66 still fails `expected null not to be null` because direct fixture lacks field props. Focused historical 54 pass/1 fail; full output retained in docs/verification/ch1. Await exact field-fixture authorisation before rerun/four shards/browser; expected inventory 6,980/614 (+7/+1), not executed full.

## RC3_WORDING
- [x] Member-best defaults and English values updated; keys/variables/logic unchanged. Featured labels retain existing uppercase CSS; unused moment/career keys have no mounted label to style.
- [x] Audit complete with user-approved Tour/catalogue exceptions; every remaining match and old/new copy line listed in RC3_WORDING_REPORT.md.
- [x] Focused 102/102; fresh ordered shards 1,819 / 1,670 / 1,762 / 1,722 = 6,973 / 613, zero failures/flakes. Delta +25/+2 from supplied 6,948/611 reconciles as existing RC2 +4/+1 and new RC3 +21/+1. Build OK; browser not claimed.

## SAR1
- [x] SAR1_FIX_1: previous-row holding opts in only for StandoutRoundsShelf; heldFrameCB28 unchanged. One regression added; focused 100/100 and fresh ordered shards 1,808 / 1,656 / 1,751 / 1,722 = 6,937 / 610, zero failures or flakes. Close-out at top of SAR1_REPORT.md; full output retained.
- [x] Added Standout rail, parallel scopes/persistence, typed feats and one hole hook batch; retired Rounds navigation without deleting pages. Authorized four-case assertion ledger in SAR1_REPORT.md.
- [x] Focused 93/93; fresh shards 1,807 / 1,656 / 1,751 / 1,721 pass, one new failure in shard 4. Executed 6,936 / 610 = baseline +41 cases/one file; build OK.
- [x] Historical heldFrameCB28.test.tsx:56:71 regression resolved by SAR1_FIX_1; untouched test passes and original failure log retained. Browser/320px visual checks remain unavailable and unclaimed, not part of this follow-up's requested checks.

## FIX_GUEST_MINT
- [x] Shared guestMintAllowed across bootstrap, hold and signed-out outcome; safe tab opt-in and automation blocking implemented, native tests unchanged.
- [x] Focused 61/61; fresh ordered shards 1,769 / 1,667 / 1,747 / 1,712 = 6,895 / 609, baseline 6,879 / 608 +16 cases/one new file. No assertions rewritten; preview setup changes listed in FIX_GUEST_MINT_REPORT.md; build OK.
- [x] Browser attempt had zero anonymous requests/holds but displayed startup failure; end-to-end verification explicitly unclaimed in report.

## FIX_UNBLOCK_4
- [x] Read uploaded brief; four known files already have the exact settled non-pro fixture including verifiedKnown from the preceding authorised continuation. No new fixture or product edits required initially.
- [x] Known-four 36/36 and dependencies 67/67; all four fresh shards passed in order: 1,753 / 1,653 / 1,750 / 1,723 = 6,879 / 608, unchanged. Output in docs/verification/fix-unblock-4; no fixture edits or flakes.
- [x] Ben accepted suite/build evidence; headless startup errors are sandbox environment faults, not product faults. Combined summary recorded at top of FIX_UNBLOCK_4_REPORT.md: suite green; device checks with Ben. Earlier STOP entries below are historical and superseded for these briefs.
- [x] Deleted exactly the five authorised superseded STOP reports; test logs retained. No code, fixture, test, SQL, migration or edge-function changes.
- [ ] Ben to perform four device checks: live-dot geometry/condensation, News at 320/430, authenticated Activity/back, and non-pro/Mason cold islands; unavailable in sandbox and not claimed verified.

## Pro status controls — last four fixtures
- [x] Add exactly the authorised current rule B line after the last mock in linkedHandicapState, linkedHandicapProfile, islandsRound2 and hb5ProfileBackName; no assertions, names or values changed.
- [x] All four shards freshly passed in order: 1,753 / 1,653 / 1,750 / 1,723 = 6,879 tests / 608 files, delta 0. Full output retained in docs/verification/pro-last-four/shard1.log through shard4.log; no additional repairs needed.
- [x] Verified each of the four files differs only by the exact authorised line; complete historical fixture/rewrite ledger supplied in final reply. All-four-green condition met; PRO_STATUS_CONTROLS_REPORT.md deleted. Build OK 2026-11-05T13:25:22Z. Earlier suite STOP entries below are historical and superseded by this fresh run; browser checks remain unverified.

## FIX_UNBLOCK_3
- [x] Read brief and dependencies; added only authorised ST2 trend override at line 19, retaining original spread/connection override and all assertions. Settings already uses pro-only readiness from preceding product fix.
- [x] ST2 22/22 and remaining focused 45/45; fresh shards 1,753 / 1,653 / 1,750 / 1,702 pass, shard 4 has 21 same pre-existing failures. Executed 6,879 / 608 includes preceding Settings regression (+1 versus brief); no count change here.
- [ ] STOP: untouched linkedHandicapState fails 5/9 in first isolated run, disqualifying 3/3 flake exception; four historical failing files untouched. Exact logs and errors in FIX_UNBLOCK_3_REPORT.md. Browser checks and combined close-out await suite blocker resolution.

## Settings pro-only card readiness
- [x] Replace Settings shared chip read with full pro status; preserve all card props and existing assertions; add one proStatusControls regression with pending trend.
- [x] Focused 41/41 (ST2 22/22); shard 3 passes 1,750. Shard 4 stops with 1,702 pass / 21 failures in hb5ProfileBackName, islandsRound2, linkedHandicapProfile, linkedHandicapState. No further fixture additions or assertions changed; full output kept.
- [ ] STOP: linkedHandicapProfile/linkedHandicapState have “No QueryClient set, use QueryClientProvider to set one”, outside A/B. Await explicit resolution; report retained, not deleted.
- [x] Retained historical shard 1/2 evidence 1,753 / 1,653; full carried-forward scope 6,879 / 608 = requested 6,875 / 607 plus retained FIX_UNBLOCK_2 four cases/file. Build OK; PRO_STATUS_CONTROLS_REPORT.md contains exact errors.

## FIX_UNBLOCK_2
- [x] Resolved island-only readiness scope; fixture field additions authorised without assertion changes. Added profile-owned verifiedKnown, island opt-in and four regression cases; other consumers retain full request waiting.
- [x] Focused 102/102 passes; shards 1/2 pass 1,753 / 1,653; shard 3 has 1,739 pass / 11 pre-existing ST2 failures. Expected 6,878 / 608 (+4 new fixUnblock2 cases), build OK.
- [x] ST2 historical stop resolved by Settings pro-only product readiness; unchanged ST2 passes 22/22 and shard 3 passes. Shard 4 now blocked by the separate errors listed above.
- [ ] Browser checks blocked by ordered suite stop: 1x live-dot geometry/condensation, narrow News labels, signed-in Activity navigation and amateur/Mason cold island. FIX_UNBLOCK_2_REPORT.md records exact errors and limits.

## Pro status standing fixture rule
- [x] Added exactly one authorised settled-amateur line to each of the five shard-2 files; no assertions, expected values or case names changed.
- [x] Shard 2 passes 1,663. Shard 3 matching failures repaired with A+B in ep1/ep2 and B in st2; no assertions changed.
- [ ] STOP: repaired shard 3 has 1,726 pass / 11 fail, all st2SettingsHandicapCard after its authorised line; shard 4 not run. Await further authorisation; complete evidence and line inventory in retained PRO_STATUS_CONTROLS_REPORT.md.
- [x] Type-only repair: replaced !!null with identical false values in four new A fixture lines; assertions unchanged; focused 81/81 pass, harness build OK 2026-11-05T12:25:33Z. ST2 stop preserved.
- [ ] Delete PRO_STATUS_CONTROLS_REPORT.md only once all four shards pass; preserve historical failing logs and give final counts/fixture inventory in reply.

## FIX_UNBLOCK_1
- [x] Read authorisation; repair only missing-export failures, fix the two authorised new test fixtures, restore always-burger hub and handler comment without changing handler code.
- [x] Specified focused set passes 272/272; repaired headerB1/islandSquircle/hb6Group1 guest mocks and ep4LinksPrivacy/st3SettingsPrivacy trend exports, preserving overrides and assertions; FIX_UNBLOCK_1_REPORT.md lists every line.
- [ ] STOP: shard 1 passes 1,753; shard 2 passes 1,654 / 9 fails in untouched islandsNav; isolated run also fails 9/19, so no flake exception. Full logs retained; shards 3–4 need exact authorisation for this different failure. Expected unchanged inventory 6,874 / 607 reconciled in report.
- [ ] Browser checks stopped with tests; exact live-dot historical comparison also blocked by absent /tmp/browser/live-dot/baseline.json. Narrow News and authenticated Activity → Tour → back remain unverified.

## FIX_LIVE_DOT_1
- [x] Confirmed live halo clipping at 1× and recorded baseline geometry; implemented fold-column compensation; TourGlance has no local clipping and stays unchanged.
- [ ] STOP: 3 new halo tests passed; unchanged headerB1/islandSquircle have 12 missing-isGuestUser fixture failures. Full output kept; no failing tests edited. Four shards and after-edit geometry check await resolution. Report: FIX_LIVE_DOT_1_REPORT.md.

## FIX_TOUR_NOTIF_1
- [x] Activity trophy tile/meta, type-based Tour identity and client overview destination; shared restoration already owns fresh-arrival top scroll.
- [x] NewsChromeBridge label-only fix and report-only sweep recorded in FIX_TOUR_NOTIF_1_REPORT.md.
- [ ] STOP: new fixTourNotif1.test.tsx failures at 32:28 (row accessible name includes meta) and 53:8 (Cannot redefine property: ResizeObserver); full focused log kept, 144 pass / 2 fail. No failing tests changed. Four shards/browser await resolution; pre-existing pro-controls fixture stop preserved.

## Pro status controls
- [x] Shared settled own-handicap/pro hook; PRO island and Settings card implemented.
- [x] Listed own-handicap presentation hidden, connections preserved; verified removal sheet implemented.
- [x] Authorised only the settled amateur hook additions in ep5Completion and overflowRightIsland; assertions, names and expected values unchanged; historical failure log retained.
- [x] Fix new-test Stop selectors without assertion changes: 14/14 pass; build OK 2026-11-05T11:16:21Z.
- [x] Added 13 missing per-surface cases; focused authorised set passes 80/80. No existing assertions, names or expected values changed.
- [ ] STOP: shard 1 passes 1,753; shard 2 has 1,614 pass / 49 fail in untouched ep4LinksPrivacy, st3SettingsPrivacy, hb6Group1, headerB1, islandsNav. Full log retained in docs/verification/pro-status-fixtures/shard2.log; shards 3–4 and report deletion await exact authorisation. Source-based inventory expected 6,874 / 607; historical fixTourNotif1 report counted one excess case, explicitly recorded.

## Featured tilted pile
- [ ] Apply signed-off rear-card CSS only, keeping front card and behaviour unchanged.
- [ ] Add/update authorised tests, check 320px/390px corners and overflow, run four shards and report reconciled counts.

## HH3 and FIX_PROFILE_COMPARE_1 close-out
- [x] Record guestStage24 and ob1Welcome as Ben-ruled flaky pre-existing failures; preserve both failing logs and leave both tests untouched.
- [x] Rerun shard 3 once: 1,734 passed; sign off both briefs with final totals 1,754 / 1,649 / 1,734 / 1,696 = 6,833 / 602 (other shards retained from the latest full run).
- [ ] Investigate shard-3 flakes under --maxWorkers=2 (guestStage24, ob1Welcome). Deferred follow-up requested by Ben, outside this close-out.

## FW1 — Featured this week
- [x] Ben ruled 260ms advance during the 320ms exit, matching the mock.
- [x] Implement session-stable featured read, three-row mount threshold and existing lead fallback; build signed-off deck with canonical playback/viewer/likes/comments/share.
- [ ] STOP: 26 new FW1 cases pass; focused integration has 12 failures in untouched ws1WatchTop.test.tsx (new Featured loading slot bypasses its lead-only fixture). Await authorization for fixture-only featured fallback mock; full output retained. Four shards not run.
- [x] Fix new-test TS2339 with a guarded staleTime property read; focused 6/6, build OK 2026-11-05T06:47:11Z. Report updated; full inventory expected 6,786 / 597, not executed; existing-test stop remains.

## BRIEF 1 — Pro verification (request + review flow)
Signed-off mock: build1-pro-verification-flow-signed-off.html (six tabs). Ben ran the SQL; no migrations, no SQL.

- [x] 1. useMyProStatus hook (own profile pro fields + own gvr row, kinds tour_pro/teaching_pro; invalidate after request/withdraw/decide)
- [x] 2. ProDetailsSheet (shared by sign-up + Edit profile; two kinds, tour chips, Other tour field, no-profile checkbox swap, PGA chips, validity, prefill, withdraw, RPC error toasts)
- [x] 3. Welcome screen 1: "I'm a golf professional" row; opens sheet; pending state with Edit; off = withdraw; saves via RPCs only
- [x] 4. Welcome screen 4: pending/verified pro "No handicap needed." branch; 'pro' choice; "I have a handicap to connect" fallback
- [x] 5. Edit profile: Golf professional row with four status pills; opens sheet except when verified
- [x] 6. VerifiedAccountsNote copy (en + en-XA common.json:304)
- [x] 7. Rounds gate: shared predicate; verified pro = connected; pending = new 'proPending' state, no Connect action; guests/fail-open unchanged
- [x] 8. Admin Inbox Verifications: Pros tab + count; subject (not inviter) identity fix; throw initial read errors; pro card facts, tour player match/Change, checklist, Verify as pro / Decline with pro reasons; p_player_id passthrough; set_pro_player_link for verified rows
- [x] 9. Notifications: ledger renders golfer_verification_approved/rejected/removed with stored title/message + golfer_verified tile; links (approved→own profile, rejected/removed→Edit profile); fix removal push kind in verify-golfer-decision; pro email title/message in send-golfer-verification-result-email; report (not fix) missing caller check
- [x] Tests per brief §Tests; run four shards; report per-shard counts; name rewritten tests; stop on unexpected failure
- [x] Write PRO_VERIFICATION_1 report

Constraints: no SQL/migrations; no feed_config; round_pool_cap 30; no native/Median changes; Profile tab of mock (PRO label, Tour tab) is NOT in this brief's six-tab scope.

## BRIEF 2 — PRO label and profile Tour tab
- [x] Shared verified-only batched member cache and two-size PRO label; invalidate after own status changes.
- [x] Personal hero descriptor and owner-only pending note implemented; exact visual proof pending.
- [x] Tour tab with canonical player rows, previous-season fallback, eight-row cap and player links; uncovered owner note and Handicap rules.
- [x] Small labels wired on listed member surfaces; sibling ids coalesced into one call; exhaustive surface proof pending.
- [x] Preserve every original name element inside ProMemberName; ms1MessagesHeadToHead.test.tsx remains untouched.
- [x] Add one real ThreadV2Page regression with PRO present and name fontSize 17px; focused 54/54 and shard 1 green.
- [x] Restore pre-Brief-2 markup on unmounted CreatorsRow rail/sheet and FindGolfersSheet; exclude them from the surface list. Existing surface tests do not include either; no assertion changed.
- [x] Approved test-only likesSheetTiers RPC stub returns no pros and excludes get_pro_members from existing RPC counts; all assertions unchanged.
- [x] All four shards pass: 1,738 / 1,591 / 1,719 / 1,682 = 6,730 tests across 592 files; only likesSheetTiers.test.tsx needed the approved stub, no assertions changed.
- [x] Write PRO_VERIFICATION_2_REPORT.md with stop, test inventory and verification limits.

## BRIEF 2B — remaining mounted member names
- [x] Confirm production callers; skip FriendSheet header because no caller invokes its opener; list evidence in PRO_VERIFICATION_2B_REPORT.md.
- [x] Add small verified-only labels inside original name elements on the remaining mounted surfaces, preserving card geometry and business/player exclusions.
- [x] Add 12 mounted-surface/batched-read/layout tests; no existing test fixtures changed.
- [ ] STOP: proVerification2B.test.tsx:81 new picks-member test expects input id order, but the board renders ordinary/pending/pro; 11 passed, 1 failed. No assertion edited; four shards blocked pending direction. Expected inventory 6,742 / 593 (+12 / +1).
