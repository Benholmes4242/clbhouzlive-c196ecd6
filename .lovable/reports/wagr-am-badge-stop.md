# WAGR AM badge — stopped on existing test

## Implemented files
- `src/features/amateur-ranking/amateurMembersCache.ts` — public verified-amateur reader; microtask sibling batching, 500-id chunks, five-minute stale window, null misses, generation-safe invalidation.
- `src/features/amateur-ranking/useAmateurMembers.ts` — identity Set/loading state; failed reads settle without badges.
- `src/features/pro-verification/ProOrVerifiedMark.tsx`, `InlineProMemberName.tsx`, `ProLabel.tsx` — PRO wins, otherwise AM; AM replaces the verified tick.
- `src/components/profile/hero/ProfileCoverBand.tsx`, `ProfileHero.tsx` — same large badge slot before Creator, same group/wrapping; personal hero reads its member id. No profile-page changes needed because ProfileHero already receives the resolved profile id.
- `src/features/admin/components/MembersList.tsx` — same visible ids as PRO, small AM, unchanged index.
- `src/features/admin/hooks/useVerifications.ts` — invalidate after successful review RPC, including when subsequent sync fails (the identity decision has already succeeded).
- `src/features/amateur-ranking/SettingsWagrCard.tsx`, `WagrLinkSheet.tsx` — invalidate after successful removal/request.
- New tests: `src/test/amateurMembersCache.test.tsx` (7), `src/test/wagrAmBadge.test.tsx` (19).
- Tracking: `roadmap.md`, this report.

No SQL, migrations, policies, feed_config, badge design, ChromeIsland or font changes. User chose to keep existing local fonts untouched for this badge-only task. Existing PRO tests remain unchanged. AGENTS.md architecture-note save exceeded its enforced size budget and was not applied; local cache header records ownership.

## Stop
`src/test/proVerification2.test.tsx:43:39`, case **Brief 2 public pro identity invalidating own status refetches visible identities**:

```text
AssertionError: expected "spy" to be called 1 times, but got 2 times
    at /dev-server/src/test/proVerification2.test.tsx:43:39
```

Existing assertion: `await waitFor(() => expect(f.rpc).toHaveBeenCalledTimes(1));`

Its mock counts every RPC. ProMemberName now correctly calls both get_pro_members and get_verified_amateurs as required, so the aggregate count is two. The later aggregate expectation of two likewise no longer isolates PRO invalidation. No assertion was changed and no component was altered to accommodate the mock. A narrowly authorised test-side change to count get_pro_members calls is needed before proceeding.

## Counts and commands
Last passing full-suite baseline: **8,667**. Added **26** cases; resulting inventory **8,693**. No existing test deleted, renamed or rewritten.

Executed command:
```text
bunx vitest run src/test/amateurMembersCache.test.tsx src/test/wagrAmBadge.test.tsx src/test/proLabelMemberRows.test.tsx src/test/proBadgeMembers.test.ts src/test/proVerification2.test.tsx src/test/proVerification2Hero.test.tsx src/test/wagrAdmin.test.tsx src/test/wagrSettings.test.tsx --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-am-focused.json
```

Focused result: **104 executed, 103 passed, 1 failed**. Both new files: **26/26 passed**.

Four app shard totals: **not run**, obeying the unexpected-test-failure stop rule. No new passing full-suite total claimed.

Preview log: **build OK**, latest observed entry `2026-11-14T11:21:26Z`. Real-member end-to-end checks not performed; authenticated preview unavailable on this external Supabase project. No real sync invoked.

## New case inventory
### amateurMembersCache.test.tsx — 7
- two sibling rows coalesce into one verified-amateur RPC
- 501 ids split into chunks of 500 and one
- missing identities are cached as null without another read
- invalidation clears cached identities and refetches mounted rows
- a failed RPC settles without a badge or a UI exception
- the stale window is exactly five minutes
- a pre-invalidation in-flight response cannot restore an old badge

### wagrAmBadge.test.tsx — 19
- shared verified marks: pro verified=true selects one authoritative mark
- shared verified marks: am verified=true selects one authoritative mark
- shared verified marks: plain verified=true selects one authoritative mark
- shared verified marks: plain verified=false selects one authoritative mark
- shared verified marks: both verified=true selects one authoritative mark
- InlineProMemberName: pro selects only pro
- InlineProMemberName: am selects only am
- InlineProMemberName: plain selects only null
- InlineProMemberName: both selects only pro
- InlineProMemberName: no member id never reads amateur identity
- ProMemberName: pro selects only pro
- ProMemberName: am selects only am
- ProMemberName: plain selects only null
- ProMemberName: both selects only pro
- ProMemberName: no member id never reads amateur identity
- cover-band AM occupies the large badge slot before Creator
- plain cover-band members have no badge group
- cover-band PRO wins when both identities are supplied
- the admin list reads the visible ids and gives an amateur AM while preserving the index