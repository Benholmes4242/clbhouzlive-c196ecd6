# FIX — sheets lost their colours and styles (EP5.2) — REPORT

## Code
- BizcSheet (`BusinessCreateStep3.tsx`): portal content wrapped in `<div className="bizc-sheet-root">` (scrim + sheet).
- `business-create.css`: `.bizc-sheet-root{display:contents; …}` with every custom property from `.ep-shell` (both rules), `.ep-settings` (`--ep-settings-danger`, `--st2-cell-hair`, `--st2-switch-off`) and `.bizc-shell` (all three rules), values copied exactly.

## Selectors changed (`.ep-shell X` → `:is(.ep-shell, .bizc-sheet-root) X`)
edit-profile.css: `.ep-row-label`, `.ep-row`, `.ep-row svg`, `.ep-golf-connect-button`, `.ep-golf-search`, `.ep-golf-remove`, `.ep-golf-add`, `.ep-link-remove`, `.ep-links-options .ep-opt`, `.st2-switch`, `.st2-switch[aria-checked=true]`, `.st2-switch i`, `.st2-switch[aria-checked=true] i`.
settingsPrivacy.css: `.st3-switch`, `.st3-switch[aria-checked=true]`, `.st3-switch i`, `.st3-switch[aria-checked=true] i`.
No `.bizc-shell X` selectors exist. Left unchanged (page-only): `.st3-privacy .ep-row`, `.st3-seen+.ep-row`, `.ep-visibility-row .ep-row`, `.ep-completion-chip`, `.ep-settings-end .ep-row`, `.st2-top/.st2-manage/.st2-connect`, all `.st4-*` (Notifications uses no BizcSheet).

## Per-sheet
All sheets below go through BizcSheet, so the missing variables (radio ring, mute lines, hairlines) are fixed for each one:
Edit profile Name, Username, Bio, Location, Gender, Handicap, Other clubs (also `.ep-golf-*`, `.ep-row` scope fixed), Websites/Socials (`.ep-link-remove`, `.ep-links-options .ep-opt` scope fixed), Who sees what (radio), photo actions; Settings Profile/Leaderboards/Courses (radio, mute, hairlines; `.st3-switch` scope), Your rounds; Create a business Social links, Opening hours, Facilities, photo actions (bizc vars only — were broken only when opened outside `.bizc-shell`, i.e. never via scoped selectors).
Visual check on device/Chromium against the mocks: NOT done (signed-in screens unavailable here).

## Tests
Added `src/test/bizcSheetRoot.test.tsx` (3: root in body holds scrim + sheet; root variables equal shell values read from CSS; no shell-scoped selector for known classes). Added one case to `st3SettingsPrivacy.test.tsx` (checked option has aria-checked=true and `.ep-radio`, inside the root on body). No test edited.

## Full suite — STOP (superseded by EP5.2.1 below)
`bunx vitest run --maxWorkers=2 --shard=N/3`: 1,534/1,535 · 1,419/1,419 · 1,716/1,717 → **4,671 tests across 473 files, 4,669 passed, 2 failed**. Against 4,667/472: +3 (bizcSheetRoot) +1 (st3) and +1 file. Reconciles.

1. NEW — `src/test/ep52SheetsCropperCoach.test.tsx` "EP5.2 sheets > BizcSheet renders into document.body, not inside .ep-body": `AssertionError: expected <div class="bizc-sheet-root">…</div> to be <body>…</body>`. The test asserts the sheet's direct parent is `body`; the brief's wrapper now sits between them (the root itself is a direct child of body). Proposed authorised change: assert `sheet.closest('.bizc-sheet-root')?.parentElement === document.body`. Not edited.
2. PRE-EXISTING (guest Stage 1 stop) — `gateScopeSwitch.test.tsx:57` "CB39 scope switch > is absent in the gated state", plus the unhandled `onAuthStateChange` error. Awaiting the useIsGuest fix approval.
