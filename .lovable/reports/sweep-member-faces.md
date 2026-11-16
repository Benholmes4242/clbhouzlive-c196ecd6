# SWEEP_MEMBER_FACES
Helper: src/lib/members/readMemberFaces.ts — readMemberFaces(ids) (user_profiles deleted_at IS NULL, then public_profiles for missing; visible row wins; 100/batch; dedupe; empty = no request) and fillMissingFaces(rows, ids) for callers with extra columns (keeps their visible rows untouched, appends public face rows for missing ids, extra columns absent).
Record hooks use readMemberFaces. Sweep sites use fillMissingFaces.
Suite 9,021 (2,238/2,235/2,237/2,311), was 9,013; +8 new in memberFaces.test.tsx.
Changed tests: recordAvatarsKeyboardBar (2 assertions `not.toContain('user_profiles')` → order user_profiles then public_profiles, rule changed by this brief); courseListFacesV2 mock routed by table (code path changed).
