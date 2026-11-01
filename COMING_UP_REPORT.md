# Tour Overview — Coming up rebuild: stopped

## Scope and rulings
Implemented the next-event preview and month list, next-course photo resolver, data-driven tags, own-course figures, defending results, calendar ICS generation, and six locale catalogues. Event selection helper remains unchanged; the rendered selection is capped at five after exclusion, per Ben's answer. Weekday/month use separate lines, per Ben's answer, overriding the mock's single line. System font is preserved; the mock's Geist is not loaded. No new negative tracking.

No SQL, migrations, feed_config, deployed functions, native configuration or cap changes. round_pool_cap remains 30.

## STOP: targeted test run
Command:
`bunx vitest run src/test/comingUpRules.test.ts src/test/comingUpReads.test.ts src/test/comingUpSection.test.tsx src/features/tourhub/overview/sections/__tests__/ComingUp.test.tsx src/test/tourOverviewDesignA.test.ts --maxWorkers=2`

114 passed / 3 failed / 117 executed across 5 files. Full suite shards have NOT started. Last full-suite baseline remains **5,068 passed across 505 files**; no new full-suite total is claimed. Candidate inventory is **5,123 tests / 508 files**, adding 55 cases across three new files:
- `src/test/comingUpRules.test.ts`: 26.
- `src/test/comingUpReads.test.ts`: 7.
- `src/test/comingUpSection.test.tsx`: 22.

Failures (no correction after the stop):
1. `src/test/comingUpRules.test.ts:19:84`, “currency symbols and short amounts”: `AssertionError: expected '$11.0m' to be '$11m' // Object.is equality`. The production formatter needs minimumFractionDigits:0; keep the expected $11m/€2.5m values unchanged.
2. `src/test/comingUpRules.test.ts:29:361`, “calendar contains inclusive start and exclusive end title venue and URL”: `AssertionError: expected 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRO…' to contain 'SUMMARY:Event · LPGA Tour'`. Actual is `SUMMARY:Event · LPGA TOUR`, because the frozen fullTourLabel helper is uppercase. Proposed test-only expected title: `SUMMARY:Event · LPGA TOUR`, consistent with the requested existing tour-label helper.
3. `src/features/tourhub/overview/sections/__tests__/ComingUp.test.tsx`, renamed panel/list case; stack at `ComingUpEvent.tsx:31:319`: `Error: [vitest] No "Trans" export is defined on the "react-i18next" mock. Did you forget to return it from "vi.mock"?` Existing hand-written mock lacks Trans. Proposed test-only repair: real I18nextProvider/initAsync:false with the English resource, keeping structural assertions, instead of changing components for the mock.

No pre-existing failure was known at the green baseline. These are failures in the new/updated targeted scope. Automatic preview build was **OK at 07:54:18Z**. No manual build/typecheck run.

## Existing test changed by the explicit no-rail/five-event brief
File: `src/features/tourhub/overview/sections/__tests__/ComingUp.test.tsx` (one case before and after).
Old name: `renders correctly as a rail with 6 items`.
New name: `renders the next panel and at most four later events`.
Old assertions: `expect(rail.style.overflowX).toBe('auto')`; `expect(screen.getAllByRole('listitem')).toHaveLength(6)`; every one of the six fixture names present.
New assertions: one `[data-coming-next]`, four `[data-coming-up-item]`, no `[data-coming-up-rail]`, first five fixture names present, sixth absent.
Reason: rail removal and Ben's explicit five-event ruling supersede the six-item presentation, not the frozen selector. Three dependency mocks were added to isolate photos, last-year results and own-rounds data; existing i18n mock unchanged (now the reported failure).
No tests deleted. No other existing assertions rewritten. Frozen `selectComingUpRail` tests pass unchanged.

## Read ownership and verification limits
- `useComingUp` adds requested fields to its single catalogue read. The photo resolver accepts an optional already-read golf_course_id and avoids its redundant link read when supplied; omitted input preserves all existing callers. Last-year history reads remain owned by the required existing useTournamentLastYearTop4 hook.
- `useComingUpOwnRounds` issues one identity-scoped own-round read across section course IDs; anonymous/no-identity/empty-course guards never read rounds. Prior `REVIEW_SUGGESTIONS_PLAYED_REPORT.md:24–25` confirms gam_round_stats.course_id was verified to join golf_courses.id directly; existing played-suggestions code uses that mapping. No SQL was run to re-verify it here.
- Calendar reads first round-1 tee timestamp on action and generates a UTF-8 folded, all-day ICS with exclusive end date and member-zone tee description. The anchor download is implemented, but **Median Calendar handoff has not been tested on a real device**. No fallback was built. Ben must tap Add to calendar in Median iOS and report what opens.
- Own-play display is unit-tested only (member persistence/readback unavailable here). LPGA/other-tour 390×844 live guest screenshots and mock comparisons remain outstanding at this stop; none are claimed.
- New locale keys were added to all six catalogues in English, preserving existing locale content. Native-language translations for disabled de/es/ja/ko and pseudo-localisation are not claimed.
- Remaining coverage should be finished after the stop is cleared (including calendar action handoff/read, exact result-line state proof, no-amber dates and responsive geometry); then full shards must all pass.

## Next corrections requiring approval
Apply minimumFractionDigits:0 to the formatter; amend only the calendar title expectation to the actual frozen fullTourLabel output; replace only the obsolete ComingUp test's incomplete i18n mock with a real provider. Then rerun targeted checks and full suite shards, and capture guest proof. Real-device Median result requires Ben's device.