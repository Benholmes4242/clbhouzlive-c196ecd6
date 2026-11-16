# BRIEF_WON_CHART_FULL_WIDTH
Chart: end labels, textLength and labelY collision spacing removed; key line added (champion then next two, board order); x=10+i*(w-20)/(n-1), y=18+..*88, guides 12-110, round labels y=124, SVG 126; .cw-chart margin-top 6px; caption, its CSS and recapPronoun import removed.
Finished "N more players": .cw-block .cw-more gap:0 4px. Static-CSS Playwright: column-gap 4px; name x equals row name x (52 at 375, 48 at 320); key no overflow, doc width = viewport.
Live: outlined button replaced by a borderless grid row on overviewGrid/heroGap; N = entries - rows - extraRows; none when N=0; .hero-full-leaderboard CSS removed.
States passing onFullBoard to HeroBoardRows (via MiniBoard): OverviewHero (live/in-play and any state where a stroke board shows, gated by fullBoardAvailable) and HeroBoardBand (live / between rounds, when no week facts). CompletedWeekBlock (TournamentPage, HeroBoardBand finished) uses its own cw-more row.
Tests: completedWeekFacts x assertion changed from [14, 86.33…, 158.66…, 231] to [10, 115, 220, 325]. Deleted "labels with equal finish scores are at least 13px apart" (asserted labelY gaps >= 13; labels no longer exist). Added 5 there (edge-to-edge, 320 text bounds, key order/tone, no end labels or caption, finished gap) and 2 in heroBoardExpand (live row, no row at N=0). The other named files needed no change.
Suite: 8,994 (2,250/2,201/2,238/2,305); delta +6 = -1 +5 +2.
Unchecked: live LPGA Duncan / PGA Austin pages in a signed-in browser.
