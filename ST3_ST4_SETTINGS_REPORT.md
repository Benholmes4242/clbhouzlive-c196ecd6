# ST3 completion and ST4 — stopped verification

## ST4 diff
- `src/pages/manage/NotificationsPage.tsx`: imports CATEGORIES from the shared module; the array contents and page behaviour are unchanged.
- `src/lib/notifications/notificationCategories.ts`: new shared module with the eleven original categories and aliases, including the original coupling comment.
- `src/components/settings/useSettingsAlertSummary.ts`: member-scoped muted_types read and none-muted category counting; pending, fetching and error states suppress values. Returns from Notifications trigger a fresh mount read.
- `src/components/settings/SettingsNotificationsCard.tsx`: Push/Alerts rows, canonical push hook and identical enable/disable guards, unavailable/loading states and existing Notifications destination.
- `src/components/settings/settingsNotifications.css`: scoped switch and Friends-card material using existing Settings tokens; specified title tracking -0.01em.
- `src/components/settings/SettingsTabContent.tsx`: replaces only the old Notification Preferences and Invite friends content; Share your link calls openInviteSheet('settings'). Other groups and handlers retained.
- `src/test/st4SettingsNotificationsFriends.test.tsx`: twelve new cases; enabled/disabled push actions, unavailable, two loading cases, all-on/partial/all-off/error alerts, original NotificationsPage eleven categories, Friends invitation and removed legacy rows.
- `AGENTS.md`: Settings ownership pointer extended to the Notifications module header without expanding the file beyond its budget. Detailed ownership rules reside in the new module headers.
- `roadmap.md`: new ST4 entry and completed ST3 report entry.
- `ST3_ST4_SETTINGS_REPORT.md`: this report.
- Project memory: ST4 requirements recorded and indexed.

## ST4 test changes and counts
No existing test file was edited, renamed or deleted. Old → new: existing assertions unchanged; new ST4 file adds 12 cases. ST4's 12/12 pass within the partial full run. ST1 19/19, ST2 22/22, ST3 19/19 and EP1 14/14 also pass.

Exact command: `bunx vitest run --maxWorkers=2` (output `/tmp/st4-full-suite.log`). The foreground tool killed the command at its 600-second limit before Vitest printed a suite summary. Completed file-result lines account for **3,886 executed: 3,884 passed, 2 failed, across 350 completed files**. This is a partial run, not a full-suite total; no rerun after discovering the new failure.

Last full green: **4,547/4,547 across 464 files**, ST3. Intervening review confirmation added 20 cases/one file, giving expected inventory 4,567/465 (not previously executed fully). ST4 adds 12/one file, giving **expected full inventory 4,579/466**, not an executed or green suite result. No count decreases.

### New failure — STOP
`src/test/sheetTopV5.test.tsx:7:24`, **retained account vocabulary rules > no user-facing string in src says "Alerts"**:

`expected 'src/components/settings/SettingsNotif…' to be '' // Object.is equality`

The test asserts `expect(out.trim()).toBe('')` after scanning production source for the literal Alerts. ST4 explicitly requires `label "Alerts"`; the matching production line is `src/components/settings/SettingsNotificationsCard.tsx:27`. This is a newly exposed conflict with the retained vocabulary rule. The brief changes that documented rule, but no assertion was changed after the failure. No shrinking, workarounds or test edits were performed. Authorization for this specific retained-rule exception is needed before correction and rerun.

### Pre-existing failure (untouched)
`src/test/reviewConfirmationRedesign.test.tsx:28:361`, **receipt hero reuses the photo block but omits its reference line**:

`expected 'position: relative;' to contain '196px'`

This is the failure already recorded in REVIEW_CONFIRMATION_STOP_REPORT.md; its source/test were not changed by ST4. No additional failed file-result lines appeared before timeout; remaining unexecuted scope is unverified.

## ST3 report completed
ST3 replaced only Privacy with a live stranger summary; Profile/Leaderboards/Courses sheets use existing canonical setters. New rounds retains the parent auto-post/analytics handler. Blocked uses the member-scoped head count and suppresses pending/error/stale figures. Profile remains the handicap-visibility editor.

ST3 application files: `SettingsTabContent.tsx`, new `SettingsPrivacyCard.tsx`, `privacySummary.ts`, `settingsPrivacy.css`, `useSettingsBlockedCount.ts` (all under `src/components/settings/`). Documentation: `AGENTS.md`, `roadmap.md` and ST3 project memory. The prior `ST2_SETTINGS_HANDICAP_REPORT.md` was deleted in ST3, not in this turn.

ST3 tests: new `src/test/st3SettingsPrivacy.test.tsx` adds 19; no cases removed. `src/test/st1SettingsAccountHelp.test.tsx` and `src/test/st2SettingsHandicapCard.test.tsx` received blocked-count hook mocks, with existing assertions/counts unchanged. `src/test/ep4LinksPrivacy.test.tsx` retargeted two obsolete Settings-handicap tests, preserving its total 26 cases:
- **Profile handicap changes read back in Settings summary through profile refresh**: prior Settings handicap-control readback → `expect(screen.getByTestId('stranger-summary')).toHaveTextContent('Only friends see your handicap.')` and `'Only you see your handicap.'`; still asserts the exact two payloads `[{ handicap_visibility: 'friends' }]`, `[{ handicap_visibility: 'private' }]`.
- **legacy ManageProfile is independent and Settings reads the same hook without a handicap writer**: prior Settings writer-presence contract → `expect(settings).toContain('const privacy = usePrivacySettings(')` and `expect(settings).not.toContain('onChange={privacy.setHandicapVisibilityLevel}')`; the legacy editor independence assertion remains.
These two rewrites follow ST3's Profile-only ownership rule. Their exact historical old names/assertion strings cannot be recovered from available current files; no invented quotations are presented. No test deletions.

ST3 exact command: `bunx vitest run --maxWorkers=2`. Retained `/tmp/st3-full-final.log` confirms **464 files passed; 4,547 tests passed; duration 763.66s**. Previous awards follow-ups baseline 4,528/463 → ST3 4,547/464, **+19/+1 solely the new ST3 test file**. No pre-existing/new failures in that successful ST3 run.

Previous Chromium sample fixture checked Privacy cards/sheets at 390px and 375px with no horizontal overflow. This was sample-data presentation verification, not live persistence.

## Verification limits and protected scope
Latest automatic build log at 09:48:00 UTC: `build OK`. No manual builds/typechecks run. ST4 Chromium verification was not performed after the test stop. Authenticated Settings actions/readback remain unavailable for external_unmanaged authentication; native push registration is not verified by mocks.

No SQL, migrations, migration files, deployed RPC/edge-function edits, feed_config edits, cap changes or native/Median configuration changes. round_pool_cap remains 30.