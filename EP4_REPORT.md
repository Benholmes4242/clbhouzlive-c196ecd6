# EP4 — Links and Who sees what: stop report

## Implemented
Added the two final groups below Your golf on hidden `/edit-profile-v2`. Website summary strips scheme/trailing slash and adds muted +n; socials list filled personal networks in existing order. Shared sheets supply website inline inputs/removal/up-to-three slot and all four social fields/icons. URL validation is the exact legacy regex/message; no new scheme auto-prefixing or URL normalization is invented. Social input removes the first @ and existing save normalization trims the result.

Home club, Other clubs and Top 10 use four existing visibility values and partial saves of just their own column. Handicap calls only usePrivacySettings and its existing setter, not the partial writer. The existing profile query refresh is the shared read source with unchanged SettingsTabContent. Failed partial saves retain the sheet and existing saved/retry line. Shared EP2 radio and BC sheet retained. New fields use semantic existing EP tokens and no new negative tracking.

## Full-suite result
Command: `bunx vitest run`.
Before: **4,314 passed / 0 failed / 4,314 total across 448 files**.
After: **4,339 passed / 1 failed / 4,340 total across 449 files**, plus **1 unhandled error**.
Delta: **+26 tests / +1 file**, solely `src/test/ep4LinksPrivacy.test.tsx`.
No existing test file, assertion or case name changed; none deleted, renamed or rewritten. EP1 14/14, EP2 22/22, EP3 27/27 all pass unchanged. No pre-existing failing tests at this task's baseline. EP4 25/26 passed; the new bidirectional Settings test did not reach its assertions.

## STOP — exact errors
New test:
`src/test/ep4LinksPrivacy.test.tsx:137:49`
“EP4 handicap shares unchanged Settings source > a change in each surface reads back in the other through profile refresh”

```text
TestingLibraryElementError: Unable to find an element by: [data-testid="settings-handicap"]
Ignored nodes: comments, script, style
<body>
  <div />
</body>
```

Underlying unhandled exception:
`src/components/settings/SettingsTabContent.tsx:417:80`

```text
TypeError: Cannot read properties of undefined (reading 'length')
```
The new test mocks useDeleteAccount as an empty object; the real unchanged SettingsTabContent reads deleteAccount.ownedBusinessNames.length in its confirmation content. Its mock must provide the complete return shape. No source/test correction or rerun after this completed-work failure. Do not change Settings to accommodate the mock. This is a new EP4 test harness failure, not an inherited EP3/Settings failure.

## Automatic build
Latest automatic typecheck/build entry: **2026-10-29T05:42:32Z — build OK**.
No manual project build/typecheck run. Earlier Review helper TS2345 is already resolved by its approved type-only correction; EP1's earlier provider failures were already resolved by EP3.1 and stay green.

## Changed files and diff summary
- `src/features/edit-profile/EditProfileLinksPrivacy.tsx` (new): groups, website/social sheets and visibility choices; uses existing privacy hook only for handicap.
- `src/features/edit-profile/linkPrivacyRules.ts` (new): explicit existing-value presentation mappings and summaries.
- `src/lib/profile/websiteValidation.ts` (new): shared exact legacy validation regex/message and limit 3.
- `src/hooks/useProfileForm.ts`: delegates the same validation to the shared helper; legacy behavior unchanged.
- `src/hooks/useProfileSave.ts`: opt-in profileFields branches for websites, four social handles, and each three visibility columns; existing branches unchanged. Partial payloads include the existing updated_at timestamp and no unrelated visibility/membership fields.
- `src/components/profile/edit-v2/SocialLinksSection.tsx`: exports existing XIcon/TikTokIcon for reuse, rendering unchanged.
- `src/pages/EditProfile.tsx`: adds final group with isolated saved patch state and existing saved/retry path; legacy /edit-profile and Settings component unchanged.
- `src/features/edit-profile/edit-profile.css`: EP4-only inline rows, 30px icon wells, helpers, radio card and seams.
- `src/test/ep4LinksPrivacy.test.tsx` (new): 26 tests below.
- `AGENTS.md`: one short header-ownership reference; existing absolute rules preserved. Local EP4 ownership is in its feature header to respect the budget.
- `roadmap.md`: EP4 tasks/results and previously resolved stop notes.
- `EP4_REPORT.md` (report).
Project memory: EP4 requirements and index entry.

## New test inventory (26)
1. first website trims scheme and trailing slash with additional count
2. social summary keeps the four-network order and omits empty fields
3. both empty link values are prompt states
4. adds up to three and removes the add slot at the limit
5. remove restores the empty add slot and retains the other website
6. invalid URL keeps the sheet open and never saves
7. Done saves only websites and closes after success
8. all four fields save together with existing at-sign normalization
9–12. maps public / followers / friends / private to Everyone / Followers & Friends / Friends only / Only me
13–15. homeClubVisibility / additionalClubsVisibility / topTenVisibility saves only its own value and closes
16. website payload contains no other user fields
17. social payload contains exactly the four handles and timestamp
18–20. each visibility partial payload writes only its own column
21–23. handicap public / friends / private maps to Everyone / Friends / Only me
24. uses three choices and the existing privacy writer, never partial save
25. a change in each surface reads back in the other through profile refresh — failed due to incomplete useDeleteAccount mock
26. legacy ManageProfile is independent and Settings keeps the same hook

## Preserved restrictions and limits
No SQL executed or written, no migrations/migration files, no deployed RPC or edge edits, feed_config untouched, round_pool_cap remains 30, no native/Median config changes. No access control or privacy ranking logic altered; only existing setting controls/writers reused.

## Unverified / next step
The bidirectional Settings readback test needs the authorised mock correction; real authenticated end-to-end and phone visual comparisons were not performed after stop. Managed authentication is external_unmanaged, so live authenticated verification is unavailable. The mock's card/header and system-font differences are frozen; current editor frame/shared sheet remain as built.
