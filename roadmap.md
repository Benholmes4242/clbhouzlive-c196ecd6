# Roadmap

## BRIEF 1 — Pro verification (request + review flow)
Signed-off mock: build1-pro-verification-flow-signed-off.html (six tabs). Ben ran the SQL; no migrations, no SQL.

- [ ] 1. useMyProStatus hook (own profile pro fields + own gvr row, kinds tour_pro/teaching_pro; invalidate after request/withdraw/decide)
- [ ] 2. ProDetailsSheet (shared by sign-up + Edit profile; two kinds, tour chips, Other tour field, no-profile checkbox swap, PGA chips, validity, prefill, withdraw, RPC error toasts)
- [ ] 3. Welcome screen 1: "I'm a golf professional" row; opens sheet; pending state with Edit; off = withdraw; saves via RPCs only
- [ ] 4. Welcome screen 4: pending/verified pro "No handicap needed." branch; 'pro' choice; "I have a handicap to connect" fallback
- [ ] 5. Edit profile: Golf professional row with four status pills; opens sheet except when verified
- [ ] 6. VerifiedAccountsNote copy (en + en-XA common.json:304)
- [ ] 7. Rounds gate: shared predicate; verified pro = connected; pending = new 'proPending' state, no Connect action; guests/fail-open unchanged
- [ ] 8. Admin Inbox Verifications: Pros tab + count; subject (not inviter) identity fix; throw initial read errors; pro card facts, tour player match/Change, checklist, Verify as pro / Decline with pro reasons; p_player_id passthrough; set_pro_player_link for verified rows
- [ ] 9. Notifications: ledger renders golfer_verification_approved/rejected/removed with stored title/message + golfer_verified tile; links (approved→own profile, rejected/removed→Edit profile); fix removal push kind in verify-golfer-decision; pro email title/message in send-golfer-verification-result-email; report (not fix) missing caller check
- [ ] Tests per brief §Tests; run four shards; report per-shard counts; name rewritten tests; stop on unexpected failure
- [ ] Write PRO_VERIFICATION_1 report

Constraints: no SQL/migrations; no feed_config; round_pool_cap 30; no native/Median changes; Profile tab of mock (PRO label, Tour tab) is NOT in this brief's six-tab scope.
