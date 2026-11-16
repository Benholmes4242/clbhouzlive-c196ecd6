# FIX_COURSE_CARD_OUTLINE_AND_TWO_TIMING_TESTS
Two full runs, both 2,255 / 2,209 / 2,223 / 2,301 = 8,988, no unhandled errors (was 8,982; +5 courseListCardOutlineGuard, +1 ob13 unmount case).
Edited tests: ob13 first case now under fake timers with a 200ms flush at the end (assertions unchanged); ob1Welcome cropper case: both waitFor calls get { timeout: 4000 } (assertions unchanged).
Open: keyboard focus ring on a card is NOT amber. `.app-shell button:focus-visible` (src/index.css:2092, specificity 0,2,1) beats `.course-list-card:focus-visible` (0,2,0) and paints hsl(var(--border)/0.10). Pre-dates 0f4c59d796 (rule from e7569db7d6). Not changed: the brief fixes that exact selector and the guard requires it.
