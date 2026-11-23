# Canonical heading brief 9a — Tour hub sheet titles

## Before-edit inventory (23 November 2026)

This inventory was completed before production heading edits. Values marked inherited are declaration-level findings; the before captures establish computed values below. Page kickers, hero mastheads, row/group/figure labels, chips and colours are frozen. Baseline: 10,154 tests /884 files.

| Sheet | File:line / style owner | Before title (size /weight /tracking /leading) | Before eyebrow | Gap | Decision |
|---|---|---|---|---|---|
| Picks | PicksSheet.tsx:66; overview-v3/HybridHeroBands/pickPanels.css:2–3 | 21 /700 /inherited /inherited | 10 /700 /.16em /inherited; ink | 3px | Change shared sheet CSS only |
| Our record | OurRecordSheet.tsx:28; same CSS | 21 /700 /inherited /inherited | 10 /700 /.16em /inherited; ink | 3px | Change shared sheet CSS only |
| Full field | tournament-v2/sections/TournamentV3Sections.tsx:36; .tv-field-list h2 | inherited 16 /400 /0 /1.5 in captured context | None | None | Add title-only canonical treatment; do not change .tv-head |
| Full board | tournament-v2/sections/FullBoardSheet.tsx:151–158 | 21 /700 /0 /inherited; nowrap/ellipsis | analytical KICKER: 11 /700 /.16em /inherited, existing colour | 3px | SECTION_TITLE; title wraps; SECTION_EYEBROW with existing colour |
| All tee times | tournament-v2/sections/AllTeeTimesSheet.tsx:174–181 | TITLE: 17 /700 /-.032em /1.2 | analytical KICKER: 11 /700 /.16em /inherited | 3px | Repoint header title/eyebrow only |
| Hole analysis | tournament-v2/sections/CourseSection.tsx:233–239 | TITLE: 17 /700 /-.032em /1.2 | analytical KICKER: 11 /700 /.16em /inherited | 3px; bottom margin 6 | Repoint sheet header only; preserve bottom margin and page labels |
| Player full season | player-v2/sections/TournamentsSection.tsx:25; playerPage.css:4 | inherited 16 /400 /0 /1.5 | None | None | Canonical title scoped to #player-season-title |
| Moments | tournament-v2/sections/MomentsSection.tsx:60–66 | 17 /700 /-.01em /inherited | analytical KICKER: 11 /700 /.16em /inherited | 3px | Repoint sheet header only; page SectionEyebrow unchanged |
| Tour picker | components/TourPickerSheet.tsx:116–117 → components/ui/SheetHeader.tsx:71–89 | SECTION_TITLE: 21 /700 /-.035em /1.05; synthesis none | SECTION_EYEBROW: 11 /700 /.16em /1 | Shared header 6px | Confirmed; expressly exempt by brief because already SheetHeader; shared gap not changed |
| Scorecard (shared external owner) | leaderboard/ScorecardSheet.tsx:165–181 → features/courses/_shared/scorecard/scorecardParts.tsx:525–545 | SECTION_TITLE: 21 /700 /-.035em /1.05; synthesis none | SECTION_EYEBROW: 11 /700 /.16em /1 | SECTION_TITLE_GAP 5px | Confirmed; no change. Existing shared two-line course-name clamp retained under explicit already-canonical exemption |
| Tour News comments (shared external owner) | news/WireFeedSlide.tsx:173 → features/comments-v2/CommentsSheetV2.tsx:427–429 | 19 /700 /-.4px /inherited | None; count is not an eyebrow | None | Canonical title opt-in for Tour News only; preserve every other comments entrypoint |

Paths without `src/` above are under `src/features/tourhub/` unless explicitly external. SheetHeader and scorecard already use canonical roles; no global/shared geometry changed. ScheduleTab has no schedule-owned sheet: it routes to tournament sheets and island TourPickerSheet. Its “This week” portal is a floating scroll button, not a sheet. No routed player/news/tournament page is classified as a full-screen sheet.

### Scope exclusions confirmed
- .cw-kick, .upcoming-kicker, .tv-head h2, .tour-board-kicker, .tour-board-section-title and SectionEyebrow remain unchanged.
- MASTHEAD_NAME, .tv-title and .tour-board-title remain 26px hero titles.
- Picks .pick-panel-label / figures / chips, board column labels, Moments body headings, CourseSection's distribution/rows labels and comments count/context retain existing presentation.
- Reads, writes, navigation, row taps, round selection, sheet lifecycle, visibility, scoring and pool settings unchanged.

## Verification
Pending implementation; raw logs will stay local under /tmp/brief9a. Before captures under /tmp/browser/brief9a/before show all existing seven first-captured sheets; remaining Moments and imported comments captures precede their edits.

## Completed changes

| File:line / selector | Before | After |
|---|---|---|
| src/index.css:71–80 | Missing CSS counterparts for eyebrow leading/transform, title synthesis and title gap | Added --section-eyebrow-leading:1, --section-eyebrow-transform:uppercase, --section-title-synthesis:none and --section-title-gap:5px; existing metrics untouched |
| pickPanels.css:2 .pick-panel-kicker | 10/700/.16em; inherited leading | SECTION_EYEBROW metrics through --section-* variables; existing var(--pick-ink) retained |
| pickPanels.css:3 .pick-panel-header h2 | 21/700; inherited tracking/leading/synthesis; 3px top margin | SECTION_TITLE metrics through --section-* variables; gap 5; natural whole-word wrapping |
| tournamentPage.css:7 .tv-field-list h2 | No local style, 16/400/24px computed | SECTION_TITLE through --section-*; sheet-scoped; .tv-head unchanged |
| FullBoardSheet.tsx:151,155 | Legacy eyebrow; title zero tracking/inherited leading, 3px gap, nowrap/ellipsis | Preserve KICKER colour, override metrics with SECTION_EYEBROW; SECTION_TITLE + SECTION_TITLE_GAP; natural whole-word wrapping, no ellipsis |
| AllTeeTimesSheet.tsx:174,178 | Legacy KICKER/TITLE, 3px gap | SECTION_EYEBROW/SECTION_TITLE, 5px gap; existing colours kept |
| CourseSection.tsx:233,236 | Legacy KICKER/TITLE, 3px gap | Sheet header only: SECTION_EYEBROW/SECTION_TITLE, 5px gap; bottom margin 6 retained |
| MomentsSection.tsx:61,64 | Legacy eyebrow and 17px title/-.01em/3px gap | Sheet header only: SECTION_EYEBROW/SECTION_TITLE, gap 5; page SectionEyebrow unchanged |
| playerPage.css:147 #player-season-title | 16/400 inherited; zero tracking blanket | Scoped canonical title via --section-*; all page/row tracking unchanged |
| CommentsSheetV2.tsx:102,108,429 | Shared 19/700/-.4px title | canonicalTitle optional, default false; SECTION_TITLE only when opted in; identical default and colour |
| WireFeedSlide.tsx:173 | No title opt-in | canonicalTitle={beat === 'tour'}; amateur and every other comments caller keep their existing typography |

No new shared module or lifecycle introduced. The comments prop’s local header comment records Tour-only ownership; root AGENTS.md is at its budget and module-specific notes belong in headers. No SQL, migration, edge-function, feed_config, pool cap, reads, writes, or navigation changes.

## Test audit and updates

Searched src/**/*.test.* for pick-panel 10px/header 3px and old sheet tracking/leading assertions. **No old-value expectation required editing.** Existing tests deleted, renamed or rewritten: **none**.

Added src/test/tourSheetHeadingCanon.test.tsx, **four new cases**:

1. `PicksSheet title computes to 21/700/-.035em/1.05 with the five-pixel eyebrow gap`: exact assertions fontSize '21px', fontWeight '700', letterSpacing '-0.035em', lineHeight '1.05', fontSynthesis 'none', marginTop '5px'.
2. `pick-panel eyebrow computes to 11/700/.16em/1 and uppercase`: fontSize '11px', fontWeight '700', letterSpacing '0.16em', lineHeight '1', textTransform 'uppercase'.
3. `Full field title computes to 21/700/-.035em/1.05 while the page kicker stays separate`: exact title metrics above and page-kicker size '11px'.
4. `OurRecordSheet shares the canonical title and five-pixel eyebrow gap`: exact title metrics above plus marginTop '5px'.

Real MemoryRouter, QueryClientProvider and I18nextProvider used; no react-i18next mock. Data hooks only mocked. Assertions are metrics/structure, not translated wording. jsdom cannot resolve CSS custom properties: the test reads actual :root declarations and substitutes them before injecting production stylesheets. Browser captures separately prove native CSS-variable resolution: 21px/700/-0.735px/22.05px, equivalent to 21/700/-.035em/1.05; eyebrows 11px/700/1.76px/11px, equivalent to 11/700/.16em/1.

Focused exact command:
`./node_modules/.bin/vitest run src/test/tourSheetHeadingCanon.test.tsx src/test/tournamentPickInsights.test.tsx src/test/tourSheetsAndTeeTimes.test.ts src/test/playerRebuildPage.test.tsx src/test/fix6CommentsSurface.test.tsx`
Result: **77/77 passed across five files**. Raw output local: /tmp/brief9a/focused.log.

## Before/after captures

All nine changed sheet surfaces captured using actual components at 390×844 and 320×844 with isolated deterministic read fixtures and the real sheet primitives. Field and full-season sheets opened through their existing buttons; all others mounted open. Each has full viewport and title-element captures. All after titles fit one/two lines, no heading or horizontal page overflow, no page errors, and title colours match before. All changed eyebrows compute to canonical metrics.

| Sheet | Width | Rendered title | Lines before → after | Notes |
|---|---:|---|---|---|
| moments | 390 | All Moments | 1 → 1 | No new wrap/overflow |
| comments | 390 | Comments | 1 → 1 | No new wrap/overflow |
| picks | 390 | Mexico Open at VidantaWorld | 1 → 1 | No new wrap/overflow |
| record | 390 | Every pick, win or miss | 1 → 1 | No new wrap/overflow |
| field | 390 | THE FIELD | 1 → 1 | No new wrap/overflow |
| board | 390 | Mexico Open at VidantaWorld | 1 → 1 | No new wrap/overflow |
| tees | 390 | Mexico Open at VidantaWorld | 1 → 1 | No new wrap/overflow |
| holes | 390 | How the field scores | 1 → 1 | No new wrap/overflow |
| season | 390 | Ángel Miguel Rodríguez Fernández | 1 → 1 | No new wrap/overflow |
| moments | 320 | All Moments | 1 → 1 | No new wrap/overflow |
| comments | 320 | Comments | 1 → 1 | No new wrap/overflow |
| picks | 320 | Mexico Open at VidantaWorld | 2 → 1 | No new wrap/overflow |
| record | 320 | Every pick, win or miss | 1 → 1 | No new wrap/overflow |
| field | 320 | THE FIELD | 1 → 1 | No new wrap/overflow |
| board | 320 | Mexico Open at VidantaWorld | 1 → 1 | Prior ellipsis removed; full title fits |
| tees | 320 | Mexico Open at VidantaWorld | 1 → 1 | No new wrap/overflow |
| holes | 320 | How the field scores | 1 → 1 | No new wrap/overflow |
| season | 320 | Ángel Miguel Rodríguez Fernández | 1 → 2 | New two-line wrap |

The long player name gains a second line at 320 only; the event-name Picks title goes from two lines to one at 320 as tracking tightens. Full board’s previous clipped event title becomes fully visible. Titles, eyebrow words, subtitles, row/group labels and counts remain the existing copy (not the informal brief labels): Our record’s title is “Every pick, win or miss”; Picks eyebrow is “WHY WE PICKED THEM”; Full field remains “THE FIELD”. No copy changes.

Browser script and raw measurements remain local under /tmp/browser/brief9a; measurements are also committed beside captures. Isolated Chromium fixtures only, not a hosted signed-in write-flow or physical-iPhone assertion; no data writes were needed for this presentation brief.

## Sequential full-suite verification

| Exact command (separate sequential calls) | Passed tests | Passed files |
|---|---:|---:|
| `./node_modules/.bin/vitest run --shard=1/4` | 2,454 | 222 |
| `./node_modules/.bin/vitest run --shard=2/4` | 2,481 | 222 |
| `./node_modules/.bin/vitest run --shard=3/4` | 2,489 | 222 |
| `./node_modules/.bin/vitest run --shard=4/4` | 2,734 | 219 |
| **Total** | **10,158/10,158** | **885/885** |

Before **10,154/884**, after **10,158/885**: exactly +4 cases/+1 file, all named above in tourSheetHeadingCanon.test.tsx. No existing test count changes; shard membership redistributed because file count changed. No failures, skips, timeout exceptions or reruns. Full raw logs retained locally at /tmp/brief9a/shard-{1,2,3,4}.log, not committed. Preview build OK.
