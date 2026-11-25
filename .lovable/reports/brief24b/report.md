# Brief 24B — stop report (shard 3)

Commits: 7f48d685a4 (Part A finish page; also carried the B hero/status-card/page wiring and D1/D2 copy because those files were already staged), 7d27294e87 (B switcher/list status), 469a40c2ec (C team invite row), 48d6b9debd (D en/en-XA), c77f75cb13 (E tests + three authorised test updates), 101b24c531 (ruling 5 actor gating). Brief 23 ruling 1: 9caf97db27.
Types: src/integrations/supabase/types.ts at HEAD already carries listing_status and created_by (committed by platform commit fab17b7095).

Shards: 1/4 2,520/231 passed; 2/4 2,544/231 passed; 3/4 STOPPED 2,729/2,730 (231 files); 4/4 not run.
Failure (assertion, not timeout): src/test/brief18EyebrowInk.test.tsx:129 "every Part 1 eyebrow declaration computes to rgb(248, 250, 252)" —
`src/components/business/ClubFromTheClub.tsx:55 has a resolved colour: expected 'undefined' to be 'string'`.
Cause: the Brief 24B `lockedMessage` prop added three lines above the eyebrow, moving it from line 55 to 58; the fixture pins file:line.
Proposed source-only fix: fold the new prop into the existing signature lines so the eyebrow returns to line 55. No test change. Awaiting ruling.

Existing tests changed (authorised by the brief's documented-rule change):
- bc5BusinessFinish.test.tsx:19 `toHaveLength(4)` → `toHaveLength(5)` (pending finish now has status, Finish your profile and three locked rows).
- cb75TeamSectionOne.test.tsx:117 `toHaveLength(role === 'owner' || role === 'admin' ? 1 : 0)` → `toHaveLength(0)` (header invite removed for every role).
- cb792InviteHistory.test.tsx: TeamListSection mock `() => null` replaced by a useBusinessTeamActivity mock so the real invite row renders; `fireEvent.click(screen.getByRole('button', { name: '' }))` → `fireEvent.click(document.querySelector('[data-team-invite-row]'))`. History assertions unchanged.
No SQL run, no migration written.
