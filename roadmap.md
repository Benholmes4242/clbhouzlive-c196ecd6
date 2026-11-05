# Roadmap

## FW1 — Featured this week
- [x] Ben ruled 260ms advance during the 320ms exit, matching the mock.
- [x] Implement session-stable featured read, three-row mount threshold and existing lead fallback; build signed-off deck with canonical playback/viewer/likes/comments/share.
- [ ] STOP: 26 new FW1 cases pass; focused integration has 12 failures in untouched ws1WatchTop.test.tsx (new Featured loading slot bypasses its lead-only fixture). Await authorization for fixture-only featured fallback mock; full output retained. Four shards not run.
- [ ] STOP: src/test/fw1FeaturedRead.test.tsx(14,660) TS2339 staleTime on QueryOptions; latest build 2026-11-05T06:45:50Z is not clean. Report written in FW1_REPORT.md; full inventory expected 6,786 / 597, not executed.

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
