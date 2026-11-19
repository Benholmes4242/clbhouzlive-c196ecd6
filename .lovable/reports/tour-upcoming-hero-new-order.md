# TOUR OVERVIEW · UPCOMING HERO new order

Client only. No SQL, migrations, feed_config or round_pool_cap changes. No font-family declarations added.

## Changes
- HeroBoardBand: upcoming order is facts → YourUpcomingPlayers → Last year → course → PicksBlock. Live/completed keep picks after the board.
- UpcomingFacts (shared with tournament page): "THE EVENT" kicker removed; `.upcoming-event-facts` flex space-between, 17px/700 values, 9.5px labels, 16px sides at ≤340.
- UpcomingLastYear/LastYearRow (shared with tournament page): 30px top, kicker + TOT header, 26|1fr|44 rows at 36px, neutral 14px Trophy. Completed/recap gold trophies are unchanged.
- UpcomingCourse (overview only): kicker-style "COURSE GUIDE ›" button, lead line, OUT/IN scorecards (shown only when all 18 holes have par>0 and yards>0). CourseGlance and the tournament page's CourseV3Section are unchanged.
- PicksBlock upcoming: 30px section, 10px heading/tee label, 13.5px record door, 48px rows with 32px avatar, full name and tee time, sorted by tee time with untimed picks after. Live/completed layout unchanged.
- Locale: added `overview.upcomingPlus.out` / `in` (en).

## Tests changed (authorised: they encoded the old order, kicker, strip, trophy or upcoming three-column picks)
- heroBlocks: "shared THE EVENT band uses board TOT figures for both page callers" → "shared facts band has no THE EVENT kicker and four figure cells…"; `expect(…h2).not.toBeNull()` and the 15px style loop are replaced by `toBeNull()` plus a four-cell count.
- heroBlocks: "upcoming LAST YEAR uses the 13px outline recap trophy" → "…a neutral 14px outline Trophy"; `svg.recap-trophy` / width '13' → `svg[data-last-year-trophy]` / '14'.
- heroBlocks source test: `'<Trophy size={13} className="recap-trophy"'` → `'<Trophy data-last-year-trophy size={14} strokeWidth={2}'` (the recap/band assertions are unchanged).
- upcomingLastYearBoard (all 7 cases): `upcoming-block`/`upcoming-last-header`/`upcoming-kicker` → `upcoming-sec`/`upcoming-sec-head`/`upcoming-sec-kick`; inline `textTransform 'uppercase'` → kicker class; '24px minmax(0,1fr) 40px', gap 4px, minHeight 31px, name 13px → '26px minmax(0,1fr) 44px', height 36px, 15px; trophy 13 → 14 with stroke-width 2 (recap-trophy class and `background 'transparent'` assertions dropped); score `textAlign 'center'` → `'right'`. Winner case renamed "…neutral 14px outline trophy…".
- upcomingOverviewPlus: "historical board caps four…": `classList.contains('recap-trophy')` → `hasAttribute('data-last-year-trophy')`. "course reads glance facts…": `.tv-strip>div` length 18 → two `[data-scorecard-card]` and no `.tv-strip`.
- tourOverviewMergedAiry: `it.each(['upcoming','live','completed'])` "adds no picks hairline and keeps the tighter cards in %s" now runs live/completed only (−1 case). Added "upcoming picks are 48px rows under a 30px section top with no hairline" (+1). History grammar: class names updated as above; `children[1].style.padding '0px'` → first row height '36px'.
- tourOverviewPicksChipsFullBoard: "uses a 46px border-box chip for a pre-round tee…" now mounts phase 'live' (renamed "…a live pre-round tee…"); the assertions are unchanged.
- pickSheetV2: no test edit. The component's events span had a leading space, so the span text was changed to put the gap in margin instead.

## Added: src/test/upcomingHeroNewOrder.test.tsx (7)
order and no kicker; facts flex space-between with four cells; OUT/IN scorecards with totals, par-5 marks and no strip; lead line alone when a hole is incomplete; COURSE GUIDE kicker class and ?section=course; upcoming rows full names sorted by tee with 32px avatars; ≤340 rule 36px total column and 10.5px yards.

## Suite
Before 9,134. After 9,141 (2,233 / 2,265 / 2,293 / 2,350), sequential, no failures. +7 = 7 new file − 1 removed it.each param + 1 new MergedAiry case. Typecheck clean.

## Not checked
Browser/iPhone comparison of the RSM Classic upcoming overview at 390/320 (Ben).
