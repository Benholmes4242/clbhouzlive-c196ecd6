# Islands round 2 — partial completion

## Result and blocker
- Bottom navigation restored byte-for-byte from commit `8b89832f0d`. `git diff 8b89832f0d -- src/components/GlobalBottomNavigation.tsx src/components/bottom-navigation/navigationTabs.ts` produced no output. Filled glyphs, exports, uppercase labels, lozenge, theme tokens, style block and reduced-motion behavior restored; bottom fade and outline file removed. Fallback restored to 64.
- AvatarCell now delegates source, identity and fallback to SquircleAvatar with `ringColor='#F7931E'`, size 36 and a local square-aspect override. Standard border is inside the width; the local override prevents its 1.05 height overhang. Loading shape is 34%-radius; unread badge unchanged.
- Settled disconnected cell opens a no-data ConnectGlance, rather than navigating immediately. Both glances use extracted GlanceShell positioning, backdrop, accessibility, hideOthers, Escape/route closure and focus restoration. Connected data and presentation remain intact.
- Connect closes then opens `/manage/handicap`. Decline uses the Settings update of `user_profiles.hide_handicap_chip=true`, scoped to the session member, with both `user-profile` and `profile` invalidations. Success closes and toasts; errors leave open and toast. Existing connect primary style and DeclineButton are reused, with opt-in wrap styling on the decline.
- **Wordmark section blocked:** `clbhouz-wordmark-white@3x.png` is not among the attachments or project files. The HTML contains different SVG artwork, and the existing white-wordmark asset is not the supplied exact PNG. No substitute was made. Logo text, registry `scrolledTitle` and wordmark-only test remain unchanged/not added pending the exact asset.

## Tests and inventory
Baseline: 3,999 tests across 427 files.

Commands:
- `bunx vitest run src/test/islandsNav.test.tsx src/test/islandsRound2.test.tsx src/test/tourOverviewDesignA.test.ts`: **87/87**, 3 files.
- `bunx vitest run`: **4,004/4,004**, 428 files.
- `TZ=Europe/London bunx vitest run`: **4,004/4,004**, 428 files.

No new or pre-existing failing tests in either full run. Warnings from existing React act/Browserslist instrumentation are not test failures.

Count reconciliation: 3,999 − 2 authorized nav removals + 7 new round-two tests = 4,004. File count 427 + 1 = 428.

Authorized deletions from `src/test/islandsNav.test.tsx` (21 → 19; every island/glance case retained):
1. `expanded: sentence-case labels with no uppercase transform` — removed assertions included `expect(home.textContent).toContain('Home')`, label existence, `expect(label!.style.textTransform).not.toBe('uppercase')`, `expect(label!.style.letterSpacing).toBe('')`, and `expect(share.textContent).toBe('')`. Reason: brief explicitly restores the old uppercase, labelled nav and removes these nav tests.
2. `condensed: labels are hidden and the capsule is icon-only` — removed label existence, `expect(label!.style.opacity).toBe('0')`, and `expect(['0', '0px']).toContain(label!.style.maxHeight)`. Reason: brief explicitly restores old condensed behavior and removes the two nav tests.

Authorized rewrite in `tourOverviewDesignA.test.ts`, name unchanged: `shows weekday alone beyond 24 hours and adds time inside 24 hours`; old `expect(...).toContain('15:42')` now expects the string from the same local hour/minute formatter. Saturday assertion unchanged. Reason: component correctly uses local time; UTC-only assertion was wrong in London summer time. `statusFor` unchanged.

Seven added cases in `islandsRound2.test.tsx`:
1. opens a dialog rather than navigating from the no-handicap cell
2. does not render invented figures in the no-handicap variant
3. Connect closes the glance and navigates to /manage/handicap
4. decline saves true, invalidates both Settings keys and disappears once profile reads back
5. failed decline leaves the dialog open and does not invalidate
6. Escape closes and returns focus to the original cell
7. hands the shared avatar its amber ring and member identity

No existing tests renamed; no other assertions rewritten. No test-only component copy was added to satisfy translation mocks.

## Changed file inventory
- `src/components/GlobalBottomNavigation.tsx` — exact restoration.
- `src/components/bottom-navigation/navigationTabs.ts` — exact restoration.
- `src/components/bottom-navigation/navIcons.tsx` — deleted, as requested.
- `src/lib/navClearance.ts` — 64px fallback.
- `src/features/chrome-v2/ChromeIsland.tsx` — squircle/no-handicap cell and glance.
- `src/features/chrome-v2/IndexGlance.tsx` — shared shell extraction, connected content retained.
- `src/features/chrome-v2/GlanceShell.tsx` — shared shell/lifecycle.
- `src/features/chrome-v2/ConnectGlance.tsx` — disconnected no-read variant.
- `src/features/chrome-v2/index-glance.css` — shared shell and new semantic styles.
- `src/components/profile/handicap/whs/connect/EmptyStateScreen.tsx` — exported primary style and opt-in decline props; defaults unchanged.
- `src/test/islandsNav.test.tsx` — only two authorized nav cases removed.
- `src/test/islandsRound2.test.tsx` — seven added cases.
- `src/test/tourOverviewDesignA.test.ts` — one authorized local-time expectation.
- `AGENTS.md` — shared-glance ownership rule.
- `roadmap.md` — task status and asset blocker.
- `ISLANDS_ROUND2_REPORT.md` — this report.
- Project memory index/new islands round-two design memory — user design requirements saved.

## Preview and protected scope
Automatic preview build log: latest entry `2026-10-28T14:48:55Z`, `build OK`.
Public Playwright check: final path `/auth`, zero bottom-fade elements and no page errors; screenshot reviewed. This project is external-unmanaged auth, so a real signed-in member decline/readback or island visual comparison could not be verified. Unit tests verify mocked preference writes/readback, not production persistence. No claim of signed-in visual verification.

No SQL, migrations/migration files, deployed RPC/edge edits, feed_config edits, cap changes or native/Median changes.