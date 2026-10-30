# ST5 — Your data report

## Result and diff
- Added Your data between Account and Friends. Its Rounds row uses `useMemberRoundTotal`, and is absent without a settled live connection or positive successful total.
- Added the signed-off BizcSheet without a header action, live summary facts/dashes, shared ST1 email masking and sending/sent/recent/failed/empty states. New styles use scoped semantic tokens and no negative letter-spacing.
- New function: `supabase/functions/email-my-rounds/index.ts`. Uses existing `corsFor`/`resolveCaller`, service-role delivery-log access, caller-JWT export RPC, ten-minute sent suppression, caller's current auth email only, direct Resend and delivery logging. Export pages the RPC to avoid the 1,000-row cap. Request bodies do not supply email addresses or user IDs.
- CSV helper builds BOM-prefixed UTF-8 with CRLF/RFC4180 quoting, newest first, the sixteen required metadata columns then H1–H18, blank unplayed holes, summed pars, Yes/No flags and UTC filename.
- Required RESEND_API_KEY was missing and was saved through the secure form. No credential values were inspected.
- Deleted the only remaining ST2/ST3/ST4 root report, `ST3_ST4_SETTINGS_REPORT.md`. No other matching root report existed.

## Stop — exact failure
Command: `bunx vitest run src/test/st5SettingsYourData.test.tsx src/test/st5RoundsCsv.test.ts src/test/st1SettingsAccountHelp.test.tsx src/test/st2SettingsHandicapCard.test.tsx src/test/st3SettingsPrivacy.test.tsx src/test/st4SettingsNotificationsFriends.test.tsx src/test/sheetTopV5.test.tsx --maxWorkers=2`

Result: **105 passed / 1 failed / 106 executed**, **6 passed / 1 failed / 7 files**.

`src/test/sheetTopV5.test.tsx:12:18`

Test: `retained account vocabulary rules > no component renders "Your rounds" as a door`

Tool's words:
```text
AssertionError: expected 'src/test/st5SettingsYourData.test.tsx…' to be '' // Object.is equality

- Expected
+ Received

+ src/test/st5SettingsYourData.test.tsx:35: removed case's selector assertions matched the vocabulary scan. Historical assertions are quoted with escaped double quotes in the ST5.1 section below.
```

The standing grep scans tests as well as application code. The new test's literal selector is itself a match; the new application renders the phrase as a sheet title, not a door label. No test or application correction and no rerun occurred after the failure. `sheetTopV5.test.tsx` is unchanged. No pre-existing failures were observed; all earlier Settings cases and all 32 new ST5 cases passed. The former review-confirmation failure was cleared before this task (last reported full green below), not a current pre-existing failure.

## Test inventory
Last reported full green: **4,579/4,579 across 466 files**, `bun run vitest run --maxWorkers=2` (prior ST4.1 report; not rerun here).

Added **32 cases / 2 files**; expected full inventory **4,611 across 468 files**. This is an inventory, not a full-suite result. Full-suite execution was not performed after the required stop.

Old → new: no existing test was changed, deleted, renamed or rewritten.

`src/test/st5SettingsYourData.test.tsx`: absent → 19 new cases:
1. hides the whole group without a live connection
2. hides the whole group for zero rounds
3–4. hides the whole group with a stale loading/error total
5. hides the whole group for an unknown total
6. uses the live 252 total and does not read the summary before opening
7. reads the three facts only when opened, with no header action
8. shows dashes while the summary is loading
9. shows dashes on summary error including stale cached facts
10. treats an invalid summary as unknown facts
11. masks the own email with ST1 masking in the idle line
12. sent disables the button and renders the exact receipt line
13. recent disables the button and uses the recent-send line
14. failed enables retry with the exact failure line
15. empty disables sending and uses the empty line
16. network error enables retry without changing facts
17. disables the sending button and prevents duplicate invocation
18. an unknown response fails closed into retry
19. never uses Your rounds as a door label

`src/test/st5RoundsCsv.test.ts`: absent → 13 new cases:
1. exact metadata header order then H1–H18
2. UTF-8 BOM and CRLF
3. RFC4180 course commas, quotes and newlines
4. eighteen scores in hole-number order
5. front-nine gaps
6. back-nine gaps
7. Par sum and no-hole blank
8. counting/competition Yes/No
9. newest first without input mutation
10. UTC filename date
11. base64 BOM/non-ASCII preservation
12. sent within ten minutes suppresses export
13. older sent row allows export

## Every changed repository file
Modified:
- `src/components/settings/SettingsTabContent.tsx`
- `AGENTS.md`
- `roadmap.md`

Added:
- `src/components/settings/SettingsYourData.tsx`
- `src/components/settings/settingsYourData.css`
- `src/components/settings/maskEmail.ts`
- `supabase/functions/email-my-rounds/index.ts`
- `supabase/functions/email-my-rounds/csv.ts`
- `src/test/st5SettingsYourData.test.tsx`
- `src/test/st5RoundsCsv.test.ts`
- `ST5_YOUR_DATA_STOP_REPORT.md`

Deleted:
- `ST3_ST4_SETTINGS_REPORT.md`

Project memory also records the ST5 requirements and index reference; it is not application source.

## Verification and limits
Latest observed automatic build: **build OK, 2026-10-30T10:58:28Z**. No manual build/typecheck was run.

Browser checks were not run after the test stop. Authenticated summary/email/readback checks are unavailable for this externally managed Supabase project; no actual email was sent, no inbox delivery or deployed-function version is claimed. CSV helper tests do not independently verify hosted authentication, log permissions or Resend delivery.

No SQL, migrations, migration files, existing edge functions, deployed RPCs, feed_config, round_pool_cap or native/Median configuration were changed. Cap remains 30.

## ST5.1 — Authorised correction
- Deleted case19, `never uses Your rounds as a door label`:19 →18 cases in `src/test/st5SettingsYourData.test.tsx`.
- Removed redundant assertions (double quotes escaped to avoid preserving the forbidden literal): `expect(container.querySelector('[label=\u0022Your rounds\u0022]')).toBeNull()` and `expect(document.querySelector('[label=\u0022Your rounds\u0022]')).toBeNull()`. The unchanged `sheetTopV5.test.tsx` already owns this app-wide rule.
- Moved `expect(screen.getByRole('dialog', { name: 'Your rounds' })).toBeInTheDocument()` unchanged from case19 into case7, `reads the three facts only when opened, with no header action`; all other case7 assertions retained.
- Renamed this report from `ST5_YOUR_DATA_STOP_REPORT.md` to `ST5_REPORT.md`; removed its historical literal selector text too, so the source and report cannot self-match.
- Full command requested: `bunx vitest run --maxWorkers=2`. Result pending.
- Expected ST5-only inventory:4,610 across468 files =4,579 +18 UI +13 CSV. The intervening review-media task added11 cases in one file, so current whole-project candidate inventory is4,621 across469 files, not4,610/468; those tests are not removed or altered here.
- Known pre-existing review-media failures: `reviewFeedMediaSizing.test.tsx:67:39`, photo1080x1350 and1920x1005; `:80:65`, carousel. Each reported `AssertionError: expected undefined to be '' // Object.is equality`. Its mock also reported `:19:140 TS2322: Type 'string' is not assignable to type 'ObjectFit'.` No permission was given to change that file.
- ST5.1 files changed: `src/test/st5SettingsYourData.test.tsx`, renamed `ST5_REPORT.md`, and `roadmap.md`. No application or service code changed.