# ST2 — Settings Your handicap card

## Diff
- `src/components/settings/SettingsTabContent.tsx`: replaced the interim chevron row with SettingsHandicapCard; removed only the Privacy “Handicap button” row. Existing handleToggleHandicapChip, inverse checked state, update disabling, invalidation and navigation are unchanged. Profile/connection read errors are handed to the card for index gating.
- `src/components/settings/SettingsHandicapCard.tsx` (new): provider/Connected status/Manage top-line action, resolved index, plain member round total, earliest first-round year, explanatory copy, disconnected connect pill and state-specific switch labels. Existing Button component and canonical formatting/provider helpers are reused. Loading/error/unknown figures use dim en dashes; a successful zero total prints 0 and suppresses first year.
- `src/hooks/profile/useMemberFirstRoundYear.ts` (new): reads only `play_date` from `whs_scores`, scoped to `connection_id`, ascending with limit 1. Mirrors useMemberRoundTotal’s `ok/loading/error` contract and `isFetched` gate; no fallback or invented year and errors discard stale values.
- `src/features/edit-profile/edit-profile.css`: ST2-scoped styling using existing card/ink/inset/mute/dim tokens. Matches the 18px card, 14px figure strip, typography, seams and local 44×26 ink-track bizc-switch geometry; no shared switch styling changes.
- `src/test/st2SettingsHandicapCard.test.tsx` (new): 22 cases covering provider/sync/navigation, resolved index, unknown/error/zero figures, inverse hide flag in both states, save disabling, removed Privacy row and scoped first-year query/state behavior.
- Ownership is documented in the new card/reader headers; `AGENTS.md` is unchanged because its size budget rejects adding another rule.
- `roadmap.md`: ST2 verification status.
- `ST2_SETTINGS_HANDICAP_REPORT.md`: this report.

## Test changes (old → new)
Existing tests: **unchanged → unchanged**. No existing assertion, case, name or file rewritten, removed or renamed. ST1 Account/Help and EP4 privacy-sync tests passed unchanged.

Baseline: **4,505/4,505 across 462 files**.

- Targeted command: `bunx vitest run src/test/st2SettingsHandicapCard.test.tsx src/test/st1SettingsAccountHelp.test.tsx src/test/ep4LinksPrivacy.test.tsx --maxWorkers=2`: **67/67 across 3 files**.
- Full command: `bunx vitest run --maxWorkers=2`: **4,527 passed / 4,527 total across 463 files**, exit 0, 686.81 seconds. Delta **+22 tests/+1 file**, entirely from `st2SettingsHandicapCard.test.tsx`.
- No failed tests, pre-existing or new.
- Automatic build: **build OK**, latest observed entry `2026-10-30T08:43:17Z`.

## Browser verification and limits
At 390×932, an isolated Chromium fixture imports the real card, real Button and app styles, with sample member readers. Inspected connected and disconnected screenshots after loading the complete app stylesheet; no horizontal overflow (356px client/scroll widths), no page errors. Verified Manage and Connect callbacks target `/manage/handicap`; switch changed checked state to false; loading total and failed first-year reads display dashes. Screenshots are under `/tmp/browser/st2/`.

This is sample-data presentation verification, **not live authenticated persistence/readback**. That remains unavailable because the project session is `external_unmanaged`.

No SQL, migrations, deployed RPC/edge edits, feed_config, round_pool_cap, native or Median changes.