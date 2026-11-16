# FIX_COURSES_LIST_STICKY_ROW
- Only the RailChips row (boards + list/card switch) is sticky; dropdowns/search scroll away.
- Top: CHIP_ROW_TOP = calc(var(--sat) + var(--chrome-island-h, 46px) + CHROME_TOP_GAP+8). Measured 64px at 375/320.
- Above-row cover: solid canvas band extended to the screen top while stuck; StickySafeAreaScrim removed from StatBrowse.
- 12px canvas→transparent fade below. IslandDock gains `suppressed`; CoursesContent suppresses it via CoursesListStuckContext.
- Top 100: no sticky controls; unchanged.
- Tests: +3 (coursesListStickyRow.test.tsx). Suite 9,024 (2,238/2,235/2,233/2,318), was 9,021. No existing test changed.
- jsdom drops var() in inline top, so the variable is asserted on CHIP_ROW_TOP; browser confirmed computed top.
