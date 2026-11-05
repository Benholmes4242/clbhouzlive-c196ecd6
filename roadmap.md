# Roadmap

## Pro status standing fixture rule
- [x] Added exactly one authorised settled-amateur line to each of the five shard-2 files; no assertions, expected values or case names changed.
- [ ] Rerun shard 2 then 3 and 4; apply A/B only to matching failures, stop on any other failure or a repaired file still failing; report against 6,874 / 607.
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
