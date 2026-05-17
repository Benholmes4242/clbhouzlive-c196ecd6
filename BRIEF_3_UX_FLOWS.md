# Brief 3 — UX Flows & Acceptance Criteria

**Project:** Clbhouz Gamified Handicap System
**Scope:** every screen, every state, every notification, every flow. Acceptance tests for QA + dev.
**Audience:** Lovable (build), Claude (review), QA (test execution).
**Format:** Given / When / Then. One acceptance test per behaviour.
**Status:** DB foundation complete (Brief 1). Edge functions specified (Brief 2). UI build comes in Brief 4 — this brief is the contract for Brief 4 to satisfy.

---

## 0. How to read this document

Every flow is structured as:

- **Surface** — page, screen, sheet, or modal name
- **Route** — URL or modal trigger
- **Context** — when this surface appears in a user's journey
- **Acceptance tests** — numbered AT-N entries, each Given/When/Then
- **States** — empty, loading, error, partial-data, etc., each with their own Given/When/Then

Acceptance test IDs are stable. `AT-COURSE-LEGEND-04` will always mean the same thing. Reference these IDs in PRs, bug reports, and Slack.

**Conventions used:**

- Times in UTC unless noted. "Local time" = user's `user_profiles.preferred_timezone` (fallback Europe/London).
- "EG-synced" = `user_profiles.eg_app_connected = true`.
- "Counter round" = `whs_scores.is_counter = true`.
- "Live" = applied to production with at least one real user round in the relevant `gam_*` table.
- "Settled" = evaluator has run on the relevant rounds (`evaluator_version_last >= 1`).

---

## 1. Inventory of surfaces

### New surfaces (built in Brief 4)

| # | Surface | Route / Trigger | Section |
|---|---|---|---|
| 1 | Recent Unlocks strip | Inline on Today tab | §3 |
| 2 | Legend Status card | Inline on Today tab | §4 |
| 3 | Your Legend Status sheet | Modal | §5 |
| 4 | Leagues card | Inline on Today tab | §6 |
| 5 | Leagues sheet | Modal | §7 |
| 6 | All Streaks sheet | Modal | §8 |
| 7 | Rivalry Deep-View page | `/handicap/rivalry/:rivalId` | §9 |
| 8 | Course Legends tab | New tab on Course Detail page | §10 |
| 9 | Friend Achievements toggle | Achievements sheet in friend mode | §11 |
| 10 | Notifications inbox | Sheet from bell icon | §12 |
| 11 | Launch sheet | One-off modal on first post-launch open | §13 |

### Modified surfaces (extended in Brief 4)

| # | Surface | Section |
|---|---|---|
| 12 | Today tab (overall composition) | §2 |
| 13 | Three Runs to Beat → Streaks grid | §8 |
| 14 | Achievements bottom sheet | §11 |
| 15 | Rivalry cards on Friends tab | §9 |

### Cross-cutting flows

| # | Flow | Section |
|---|---|---|
| 16 | Receiving a push notification | §14 |
| 17 | Big-bang launch sequence | §15 |
| 18 | Backdate replay for ops support | §16 |

---

## 2. Today tab — overall composition

**Surface:** `/handicap` and `/handicap/:userId`
**Context:** Primary landing for handicap. Currently has ~10 stacked cards; this work adds 3 and modifies 1.

### Composition rules

**AT-TODAY-01 — own-handicap layout**

- **Given** the viewer is the owner (`/handicap` without param, or `/handicap/:userId` where `:userId === auth.uid()`)
- **When** the page renders after data loads
- **Then** sections appear in this order, top to bottom:
  1. Header (greeting + weather + search + avatar + trophy + bell)
  2. Hero ring (Index + delta + form pill + scratch zone caption)
  3. Stats row (Scoring / Form / Best)
  4. **Recent Unlocks strip** (NEW — §3)
  5. **Legend Status card** (NEW — §4)
  6. Next Round Watch
  7. Last 14 Rounds heatmap
  8. Last Round card
  9. Index History chart
  10. Rounds That Count chart
  11. **Leagues card** (NEW — §6)
  12. Streaks grid (MODIFIED — §8 — was "Three Runs to Beat")
  13. Where You Stand percentile
  14. Suited to Your Game / Test Yourself course recommendations
  15. Echo on Your Trend AI card

**AT-TODAY-02 — friend-view layout**

- **Given** the viewer is reading a friend's handicap (`/handicap/:userId` where `:userId !== auth.uid()`)
- **And** the friend has `eg_app_connected = true`
- **When** the page renders
- **Then** sections 1–14 above appear, except:
  - Greeting reads as "Andrew's handicap" not "Evening, Andrew"
  - Bell icon is hidden (notifications are owner-only)
  - Recent Unlocks shows the friend's recent unlocks (read-only — no share button)
  - Legend Status card opens the friend's Legend Status sheet
  - Leagues card shows the friend's pod (read-only, no promote/relegate emphasis)
  - Streaks grid shows the friend's streaks (read-only)
  - "Find Courses" / "Suited to Your Game" sections hidden (those are personal recommendations)
- **And** Achievements bottom sheet (entered via the trophy icon) shows the View/Compare toggle (§11)

**AT-TODAY-03 — friend-view layout for non-EG-synced friend**

- **Given** the viewer is reading a friend's handicap
- **And** the friend has `eg_app_connected = false`
- **When** the page renders
- **Then** show only:
  - Header
  - A single card reading "This user hasn't connected England Golf yet" with a small CTA to invite them
- **And** all gam_* surfaces (Recent Unlocks, Legend Status, Leagues, Streaks deep view, Rivalry) are hidden

### Loading state

**AT-TODAY-LOADING-01**
- **Given** the page is rendering before data has loaded
- **When** the user first lands on `/handicap`
- **Then** show the existing `ProfileSkeleton` Suspense fallback
- **And** no flashing of empty `gam_*` cards before data lands

**AT-TODAY-LOADING-02**
- **Given** the page has rendered with the hero ring loaded but gam_* data still in flight
- **When** the rest of the page is hydrating
- **Then** Recent Unlocks, Legend Status, Leagues, and Streaks each show their own card-shaped skeleton
- **And** skeleton width matches final card width (no layout shift on hydrate)

### Error state

**AT-TODAY-ERROR-01**
- **Given** the page loads, hero data is fine, but one or more gam_* fetches fail
- **When** the failing card would render
- **Then** show a small inline error stub: "Couldn't load this section — pull to refresh"
- **And** the rest of the page continues to render normally
- **And** the failure is logged to Sentry / app telemetry with section name

---

## 3. Recent Unlocks strip

**Surface:** horizontal scrolling strip on Today tab between Stats Row and Legend Status card
**Context:** A "what just happened" surface. First impression of momentum every time the user opens the app.

### Behaviour

**AT-UNLOCKS-01**
- **Given** the user has earned at least 1 badge / streak tier / course legend in the last 30 days
- **When** the strip renders
- **Then** show up to 6 cards in horizontal scroll, newest first
- **And** each card has: icon (32px), title, 1-line description, "X days ago" eyebrow, rarity tag pill
- **And** cards with rarity ≥ `epic` have a 2px gradient stripe at the top (amber → gold)

**AT-UNLOCKS-02 — entry types**
- **Given** the user just unlocked a badge
- **When** the strip refreshes after evaluator runs
- **Then** a badge card appears at position 0 with `seen_by_user = false` styling (small amber dot on icon)
- **When** the user taps the card
- **Then** the Achievements sheet opens, scrolled to that badge
- **And** `gam_mark_badge_seen` RPC fires, the dot disappears

**AT-UNLOCKS-03 — streak tier-up**
- **Given** the user's `round_played` streak just crossed a tier threshold (e.g. 4 weeks)
- **When** the strip refreshes
- **Then** a streak card appears with flame icon (amber) and copy "4-week streak hit Bronze tier"
- **When** the user taps the card
- **Then** All Streaks sheet opens, scrolled to round_played

**AT-UNLOCKS-04 — course legend taken**
- **Given** the user just became #1 in any category at any course (`gam_course_legends.rank = 1` row inserted)
- **When** the strip refreshes
- **Then** a legend card appears with crown icon (gold) and copy "Birdie Legend at [course name]"
- **When** the user taps the card
- **Then** Course Detail page opens, Legends tab selected, scrolled to that course's category card

### Empty state

**AT-UNLOCKS-EMPTY-01**
- **Given** the user has no unlocks in the last 30 days
- **When** the strip would render
- **Then** the strip is hidden entirely (not shown as empty)
- **And** the layout above/below collapses without a gap

**AT-UNLOCKS-EMPTY-02 — first-time user**
- **Given** the user is EG-synced but has zero badges, zero streak tier-ups, zero legends (post-backdate)
- **When** the strip would render
- **Then** show a single "starter" card: "Earn your first unlock — post a round to begin"
- **And** the card has a faded look (50% opacity) and tapping it opens Last Round card focus

### Loading state

**AT-UNLOCKS-LOADING-01**
- **Given** the page has loaded but `gam_user_badges` query hasn't returned
- **When** the strip would render
- **Then** show 3 horizontal skeleton cards (160px width each)
- **And** skeleton cards have the same rounded corners and gradient stripe placement

### Error state

**AT-UNLOCKS-ERROR-01**
- **Given** the `gam_user_badges` query fails
- **When** the strip would render
- **Then** show a single inline message card: "Couldn't load recent unlocks"
- **And** a small refresh icon button is tappable to retry

---

## 4. Legend Status card

**Surface:** inline on Today tab, between Recent Unlocks and Next Round Watch
**Context:** Quick-glance "you hold N legend titles" summary, gateway to the deep status sheet.

### Behaviour

**AT-LEGENDSTATUS-01 — populated state**
- **Given** the user holds at least 1 legend title (`gam_course_legends.rank = 1` row exists)
- **When** the card renders
- **Then** show: "You're Legend at N course[s]" headline + "Top 3 at X more · Top 10 at Y" caption
- **And** below: up to 3 pills representing top titles in order: 🏆 [category] · [course name]
- **And** the card has a right-chevron indicating tappable

**AT-LEGENDSTATUS-02 — tap behaviour**
- **Given** the user taps the card
- **When** the tap completes
- **Then** the Your Legend Status sheet (§5) opens with a slide-up animation
- **And** the underlying Today tab dims to ~30% opacity

**AT-LEGENDSTATUS-03 — friend view**
- **Given** the user is viewing a friend's handicap
- **When** the card renders
- **Then** copy reads "[Friend name] is Legend at N course[s]" not "You're Legend..."
- **And** chevron still works, opens sheet showing the friend's status

### Empty state

**AT-LEGENDSTATUS-EMPTY-01**
- **Given** the user holds zero legend titles but has at least 1 course in their history
- **When** the card renders
- **Then** show: "You haven't claimed a Legend title yet" headline + "Closest to a title: top 3 at [course]"
- **And** the closest course is computed from `gam_user_course_record_view.podium_positions`
- **And** the card is still tappable, opens the sheet showing aspiration view

**AT-LEGENDSTATUS-EMPTY-02 — no course history**
- **Given** the user has zero rounds with a course mapped to `golf_courses`
- **When** the card would render
- **Then** the card is hidden (don't show empty)

### Loading state

**AT-LEGENDSTATUS-LOADING-01**
- **Given** the page is loading and `get_user_legend_status` hasn't returned
- **When** the card would render
- **Then** show a card-shaped skeleton with same dimensions (full-width, ~110px tall)

### Error state

**AT-LEGENDSTATUS-ERROR-01**
- **Given** `get_user_legend_status` fails
- **When** the card renders
- **Then** show "Couldn't load Legend status" with a retry button

---

## 5. Your Legend Status sheet

**Surface:** modal bottom sheet, opened from Legend Status card
**Context:** Detailed list of every category × course where user has standing.

### Behaviour

**AT-LEGENDSHEET-01 — open state**
- **Given** the user has tapped the Legend Status card on Today tab
- **When** the sheet opens
- **Then** sheet has a sticky header reading "Your Legend Status" with a close X
- **And** body shows scrollable list grouped by status (Legends, Top 3, Top 10)

**AT-LEGENDSHEET-02 — Legend group**
- **Given** the user has 1+ entries with `rank = 1`
- **When** the section renders
- **Then** show section header "🏆 LEGEND (N)"
- **And** below, one row per entry: course thumbnail (40px squircle) + course name + category badge + value
- **And** rows are tappable, opening the Course Detail Legends tab for that course

**AT-LEGENDSHEET-03 — Top 3 group**
- **Given** the user has 1+ entries with `rank ∈ {2, 3}`
- **When** the section renders
- **Then** show section header "🥈 TOP 3 (N)"
- **And** rows show rank as "#2" or "#3" silver/bronze color tokens

**AT-LEGENDSHEET-04 — Top 10 group**
- **Given** the user has 1+ entries with `rank ∈ {4..10}`
- **When** the section renders
- **Then** show section header "TOP 10 (N)"
- **And** rows show rank as small grey number (e.g. "#7")

**AT-LEGENDSHEET-05 — multiple categories same course**
- **Given** the user has rank entries in 2+ categories at the same course (e.g. #1 Birdie Legend AND #3 Score at Sundridge)
- **When** the sheet renders
- **Then** the course appears once per category in the appropriate section (e.g. once in Legend, once in Top 3)
- **And** the category badge differentiates them

### Empty state

**AT-LEGENDSHEET-EMPTY-01**
- **Given** the user has no rank ≤ 10 anywhere
- **When** the sheet opens
- **Then** show body: large amber crown icon + headline "No titles yet" + caption "Play more rounds at the same course to climb the legend tables."
- **And** below: "Recommended next course" CTA linking to the user's most-played course

### Loading state

**AT-LEGENDSHEET-LOADING-01**
- **Given** the sheet has opened but data is still loading
- **When** the sheet renders
- **Then** show 5 skeleton rows in body

### Error state

**AT-LEGENDSHEET-ERROR-01**
- **Given** the underlying query errors
- **When** the sheet renders
- **Then** show "Couldn't load Legend Status" with retry button
- **And** retry re-fetches without closing the sheet

---

## 6. Leagues card

**Surface:** inline on Today tab, between Rounds That Count and Streaks grid
**Context:** The big new mechanic. Must read as "this is meaningful, this is competitive."

### Behaviour

**AT-LEAGUE-CARD-01 — active membership**
- **Given** the user is a member of an active league (`gam_league_members` row exists with `is_active = true`)
- **When** the card renders
- **Then** show eyebrow "LEAGUES · [Season label] · [Days left]"
- **And** show subhead with bracket name (e.g. "Silver League")
- **And** show big "#N of 30" rank display
- **And** show "X points · Y rounds counted" caption
- **And** show the **promote/relegate bar** (the visual signature of this card):
  - Horizontal bar, height 6px
  - Left 23.3% (top 7 of 30) is green
  - Right 16.7% (bottom 5 of 30) is red
  - Middle 60% (positions 8–25) is dim grey
  - User position marked with an amber dot, 12px, 50% above the bar
- **And** below the bar: "↑ promote (7)" left, "middle" center, "↓ relegate (5)" right (small grey caption)
- **And** at the bottom: a context cell showing "X pts to promote" or "X pts buffer down" (depending on rank), with appropriate green/amber tint

**AT-LEAGUE-CARD-02 — tap behaviour**
- **Given** the user taps the card
- **When** the tap completes
- **Then** the Leagues sheet (§7) opens

**AT-LEAGUE-CARD-03 — promote-zone visual**
- **Given** user is in `zone = 'promotion'` (live_rank 1–7)
- **When** the card renders
- **Then** bottom context cell reads "+X pts buffer to keep promotion" in green
- **And** the dot is on the green portion of the bar

**AT-LEAGUE-CARD-04 — relegate-zone visual**
- **Given** user is in `zone = 'relegation'` (live_rank 26–30)
- **When** the card renders
- **Then** bottom context cell reads "Drop X pts and you relegate" in red
- **And** the dot is on the red portion of the bar
- **And** the card has a subtle red 1px border (signal of risk)

**AT-LEAGUE-CARD-05 — safe-zone visual**
- **Given** user is in `zone = 'safe'` (live_rank 8–25)
- **When** the card renders
- **Then** bottom context cell shows "X pts to promote · Y pts buffer down" (two stat boxes side by side)

### Empty state

**AT-LEAGUE-CARD-EMPTY-01 — not in league yet**
- **Given** the user is EG-synced but has no `gam_league_members` row (e.g. mid-season join not yet processed)
- **When** the card renders
- **Then** show: "Your league starts soon" + caption "Pods refresh at season start. You'll be placed in [bracket name based on current hcp]."
- **And** card is non-tappable (no chevron, dimmed)

**AT-LEAGUE-CARD-EMPTY-02 — between seasons**
- **Given** the previous season has ended and the next hasn't started (gap window, usually 1 day)
- **When** the card renders
- **Then** show: "Spring 2026 wrapped — you finished #N in [bracket]" + caption "Summer pods open in [X days]"
- **And** tap opens history (or a placeholder if next sheet pattern not built)

### Loading state

**AT-LEAGUE-CARD-LOADING-01**
- **Given** the page has loaded but `get_my_pod_standings` query in flight
- **When** the card would render
- **Then** show full-width skeleton, same dimensions as final card (~220px tall)

### Error state

**AT-LEAGUE-CARD-ERROR-01**
- **Given** `get_my_pod_standings` fails
- **When** the card renders
- **Then** show inline error: "Couldn't load your league standings" + retry button

---

## 7. Leagues sheet (full standings)

**Surface:** bottom sheet, opened from Leagues card
**Context:** Full 30-person pod standings + "how it works" explainer.

### Behaviour

**AT-LEAGUE-SHEET-01 — opening**
- **Given** the user has tapped the Leagues card
- **When** the sheet opens
- **Then** sheet has sticky header reading "[Bracket] Pod [N]" with close X
- **And** body has three sections: Hero (large summary), Pod Standings (list), How It Works (explainer)

**AT-LEAGUE-SHEET-02 — hero section**
- **Given** the sheet has opened
- **When** the hero renders
- **Then** show: large bracket emoji (🥈 for silver, 🥉 bronze, 🥇 gold, 💎 platinum), big "#N" rank, "of 30" small caption
- **And** below: the promote/relegate bar at 10px height (larger than the card version) with same color encoding
- **And** below the bar: two stat boxes — "X pts to promote" (green) and "+Y pts buffer down" (neutral)

**AT-LEAGUE-SHEET-03 — pod standings list**
- **Given** the sheet has opened and pod has 30 members
- **When** the list renders
- **Then** all 30 members shown in `live_rank` order
- **And** each row: rank number, avatar (32px squircle), name, "X rounds counted" caption, optional delta arrow (▲/▼N or — if no change since last update), points value right-aligned
- **And** rank 1–7 rows have a 3px green accent rail on the left edge
- **And** rank 26–30 rows have a 3px red accent rail on the left edge
- **And** the user's own row has an amber-tint background and bold name

**AT-LEAGUE-SHEET-04 — user not visible in pod (impossible state but defend)**
- **Given** the user's row is somehow missing from the standings
- **When** the list renders
- **Then** show all 30 visible members; at the bottom of the list, append a 31st row "Couldn't find your position" with a refresh button

**AT-LEAGUE-SHEET-05 — How It Works**
- **Given** the sheet body has scrolled past the standings
- **When** the explainer renders
- **Then** show 4 paragraphs:
  - "Pods of 30 bucketed by handicap ([Bracket] = X.X – Y.Y)."
  - "Points come from your best 8 stableford scores this season — same as your WHS counters."
  - "Top 7 promote to [next bracket up] · Bottom 5 relegate to [next bracket down] · Middle 18 stay."
  - "New pods every quarter."

### Empty state

**AT-LEAGUE-SHEET-EMPTY-01**
- **Given** the user is in a pod but has zero counter rounds yet
- **When** the sheet opens
- **Then** standings show all 30 members (including those with 0 points) sorted by `last_updated_at`
- **And** the user's row says "0 pts · 0 rounds counted" with their position determined by tie-break

### Loading state

**AT-LEAGUE-SHEET-LOADING-01**
- **Given** sheet just opened, RPC in flight
- **When** the sheet renders
- **Then** show hero skeleton + 8 row skeletons in standings list

### Error state

**AT-LEAGUE-SHEET-ERROR-01**
- **Given** RPC errors
- **When** the sheet renders
- **Then** show "Couldn't load pod standings" centered with retry

---

## 8. Streaks (grid + sheet)

**Surface:**
- **Streaks grid** — inline on Today tab (was "Three Runs to Beat")
- **All Streaks sheet** — modal opened from "See all 7 →" button

**Context:** Existing No-Up + Cutting + Counter streaks are extended to 7 total. Visual grid stays similar; data underneath is broader.

### 8.1 Streaks grid (Today tab)

**AT-STREAKS-GRID-01 — at least 1 active**
- **Given** the user has 1+ streaks with `is_active = true`
- **When** the grid renders on Today tab
- **Then** show up to 3 active streaks in a 3-column grid
- **And** each cell: streak icon (flame for hot streaks ≥4, activity for normal), count number (large, 22px), unit (rounds/weeks), streak name, PB caption
- **And** active streaks have green accent; round_played hot streak has amber accent

**AT-STREAKS-GRID-02 — "See all 7"**
- **Given** the grid is rendered
- **When** the user taps "See all 7 →"
- **Then** the All Streaks sheet opens

**AT-STREAKS-GRID-03 — Streak Freeze indicator**
- **Given** any active streak has `freeze_credits > 0`
- **When** the grid renders
- **Then** show a small blue snowflake badge on the streak icon (top-right corner)
- **And** tapping the snowflake (without tapping the cell) shows a tooltip: "Freeze available — keeps streak alive if you miss a week"

### 8.2 All Streaks sheet

**AT-STREAKS-SHEET-01 — opening**
- **Given** the user has tapped "See all 7 →"
- **When** the sheet opens
- **Then** sticky header reads "All Streaks"
- **And** body shows summary: "X active · Y dormant · Z freezes available"
- **And** if freezes available: blue card at top "X Streak Freeze[s] available · Auto-applied if you miss a week · Refills [date]"

**AT-STREAKS-SHEET-02 — streak rows**
- **Given** the sheet has opened
- **When** the streak list renders
- **Then** all 7 streak types shown in order: round_played, no_up, cutting, counter, sub_80, sub_par, birdie_round
- **And** each row: 44px icon container (amber/green tinted if active, grey if dormant), streak name, "X rounds/weeks active" or "Dormant" caption, current count (large right-side), "X to next tier" hint if approaching a badge tier
- **And** dormant streaks have 65% opacity
- **And** if any has a milestone in progress: thin progress bar at bottom of row

**AT-STREAKS-SHEET-03 — streak details panel (future v2)**
- **Given** the user taps a streak row
- **When** v2 of this sheet ships (not v1)
- **Then** a detail panel opens showing per-round contribution to the streak
- **For v1:** tap is a no-op or shows a simple tooltip

### Empty state

**AT-STREAKS-GRID-EMPTY-01**
- **Given** the user has zero active streaks AND all 7 dormant streaks have `best_count = 0`
- **When** the grid renders
- **Then** show: single card "Build your first streak — your weekly round streak starts when you post a counter round"
- **And** the "See all 7 →" button is hidden

**AT-STREAKS-GRID-EMPTY-02 — no active but has history**
- **Given** the user has zero active streaks but at least one with `best_count > 0`
- **When** the grid renders
- **Then** show up to 3 dormant streaks with PB callout
- **And** copy on each card: "Best: N — restart today"

### Loading state

**AT-STREAKS-GRID-LOADING-01**
- **Given** `get_my_streaks` in flight
- **When** the grid renders
- **Then** show 3 skeleton cells

### Error state

**AT-STREAKS-GRID-ERROR-01**
- **Given** `get_my_streaks` fails
- **When** the grid renders
- **Then** show single-cell error: "Couldn't load streaks · Tap to retry"

---

## 9. Rivalry Deep-View page

**Surface:** `/handicap/rivalry/:rivalId`
**Context:** New route. Existing rivalry cards on Friends tab now navigate here when tapped. Currently a tap on a rivalry card has no significant action.

### Behaviour

**AT-RIVALRY-DEEP-01 — page load**
- **Given** the user has tapped a rivalry card on Friends tab
- **When** the route loads
- **Then** show:
  - Back button (chevron-left top-left)
  - Eyebrow "RIVALRY"
  - Avatar duel: user avatar (left) + ⚔ icon + rival avatar (right), both 64px with colored rings
  - Names + handicaps below each avatar
  - Hero card with big W-L numbers ("4 — 2"), "YOU WIN" / "MARIO WINS" labels, tie count, "X shared rounds" caption
  - Recent form pills (last 7 W/L/T outcomes as small colored squares)
  - "COURSE BREAKDOWN" section (§AT-RIVALRY-DEEP-02)
  - "LAST MEETING" section (§AT-RIVALRY-DEEP-03)
  - "MILESTONES" section (§AT-RIVALRY-DEEP-04)

**AT-RIVALRY-DEEP-02 — course breakdown**
- **Given** the page has loaded
- **When** the course breakdown section renders
- **Then** call `get_rivalry_breakdown(:rivalId)` and render each returned course as a row
- **And** each row: pin icon, course name (truncate if needed), W-L record (e.g. "3 — 0"), "YOU LEAD" / "THEY LEAD" / "TIED" label colored green/red/grey
- **And** rows sorted by `rounds_played DESC, last_played DESC`

**AT-RIVALRY-DEEP-03 — last meeting**
- **Given** there is at least 1 shared round
- **When** the section renders
- **Then** show: course name, date (e.g. "13 May · 4 days ago"), W/L outcome pill with delta (e.g. "YOU WON +5")
- **And** below: two stableford columns (you / them) with large numbers

**AT-RIVALRY-DEEP-04 — milestones (e.g. 5-0 sweep)**
- **Given** the user is 4 wins into a potential 5-0 streak
- **When** the section renders
- **Then** show a card with amber tint, "🎖 5-0 Sweep over [Rival]" headline, "1 more win for the Sweep badge · in progress" caption, 80% progress bar
- **And** if no milestone in progress, the section is hidden

### Empty state

**AT-RIVALRY-DEEP-EMPTY-01 — no shared rounds yet**
- **Given** the rivalry exists but they've never played the same course on the same day
- **When** the page loads
- **Then** show the avatar duel header
- **And** below: a single card "No shared rounds yet — play the same course on the same day to start the H2H"
- **And** course breakdown + last meeting + milestones sections are hidden

**AT-RIVALRY-DEEP-EMPTY-02 — invalid rivalId**
- **Given** the URL contains a rivalId that doesn't exist or isn't a rivalry of the current user
- **When** the page loads
- **Then** show a "Rivalry not found" centered message + back button
- **And** no API calls are made for stats

### Loading state

**AT-RIVALRY-DEEP-LOADING-01**
- **Given** the page is loading
- **When** the user has just navigated to this route
- **Then** show a page-level skeleton with avatar placeholder, big number placeholder, and 3 row skeletons in course breakdown

### Error state

**AT-RIVALRY-DEEP-ERROR-01**
- **Given** `get_rivalry_breakdown` fails
- **When** the page renders
- **Then** show error card in the course breakdown section only
- **And** hero/avatar/last-meeting sections still render if they have data

### Cross-cutting

**AT-RIVALRY-CARD-01 — make existing cards tappable**
- **Given** the user is on Friends tab and a rivalry card is rendered
- **When** the user taps the rivalry card
- **Then** navigate to `/handicap/rivalry/:rivalId`

---

## 10. Course Legends tab (Course Detail page)

**Surface:** new tab on `/courses/:courseId`, sharing space with About / Reviews / Media / Leaderboard
**Context:** "Leaderboard" tab is being renamed to "Legends" and its content fully replaced. The existing leaderboard data is unrelated to gam_*.

### Behaviour

**AT-COURSELEGEND-01 — tab rename**
- **Given** the user is on a Course Detail page
- **When** the tab strip renders
- **Then** "Leaderboard" is replaced with "Legends"
- **And** tab strip order stays: About / Reviews / Media / **Legends**

**AT-COURSELEGEND-02 — populated state**
- **Given** the tab is selected and the course has at least 1 entry in `gam_course_legends`
- **When** the tab body renders
- **Then** show 5 stacked cards, one per category, in this order:
  - 🟠 Birdie Legend
  - 🏆 Score Legend
  - 📍 Visitor Legend
  - 🥏 Gross Record
  - ⛳ Stableford Champ
- **And** each card shows top 5 in the body (with a "See top 10 →" button at the bottom to expand to full 10)
- **And** each row: rank (🥇/🥈/🥉 emoji for 1/2/3, number for 4–10), avatar 32px, name, "X days ago" caption, value (right-aligned, bold)

**AT-COURSELEGEND-03 — user highlighted**
- **Given** the user is in any of the top-10 lists
- **When** the row renders
- **Then** user's row has an amber-tint background and bold name

**AT-COURSELEGEND-04 — "Where You Stand" footer**
- **Given** the user has at least one legend / podium / top-10 position at this course
- **When** the tab body is fully scrolled
- **Then** show a footer card "WHERE YOU STAND" with amber tint, listing: "You hold N titles · top 3 in M more"
- **And** below: a per-category one-liner ("Birdie Legend (#1, taken from Mario 2d ago) · Score Legend (#3) · ...")

**AT-COURSELEGEND-05 — expand to top 10**
- **Given** any category card is showing top 5
- **When** the user taps "See top 10 →"
- **Then** the card expands inline (within the same scroll position) to show ranks 6–10
- **And** the button text changes to "Show less ←"

### Empty state

**AT-COURSELEGEND-EMPTY-01 — no entries at all**
- **Given** the course has zero entries in `gam_course_legends` (nobody has played it yet, or evaluator hasn't run)
- **When** the tab body renders
- **Then** show a single full-width empty state: "Be the first to set a Legend record here — post a counter round at this course to claim a title"
- **And** all 5 category cards are hidden

**AT-COURSELEGEND-EMPTY-02 — sparse data**
- **Given** the course has entries in some categories but not others
- **When** the tab body renders
- **Then** for categories with no entries, show the card with a smaller empty state inside: "No qualifying rounds in the last 90 days"
- **And** for categories with entries, render normally

### Loading state

**AT-COURSELEGEND-LOADING-01**
- **Given** the tab has been selected
- **When** `get_course_legends` is in flight
- **Then** show 3 skeleton cards stacked

### Error state

**AT-COURSELEGEND-ERROR-01**
- **Given** `get_course_legends` fails
- **When** the tab renders
- **Then** show retry card centered with "Couldn't load Legends"

---

## 11. Achievements bottom sheet (modified)

**Surface:** existing bottom sheet, opened from trophy icon in Today tab header
**Context:** Sheet structure is preserved. New: rarity pills, share buttons, in-progress section, View/Compare toggle for friend mode, server-side data source.

### Behaviour — own view

**AT-ACHIEVE-01 — sheet opens**
- **Given** the user taps the trophy icon
- **When** the sheet opens
- **Then** existing top bar with title "Achievements" + close X
- **And** existing earned counter ("12 of 22 earned · 55%") with thin amber gradient progress bar
- **And** existing tabs strip "All / Earned / In progress / Locked"

**AT-ACHIEVE-02 — In Progress section (NEW)**
- **Given** there are 1+ badges where the user has counter_value > 0 but counter_tier < max
- **When** the sheet renders in All or In Progress tab
- **Then** show "IN PROGRESS · X CLOSE TO UNLOCK" eyebrow at the top
- **And** below: top 3 in-progress badges by proximity to next tier (lowest "X more to next tier")
- **And** each row: 48px icon container (amber soft background), title + rarity pill, description, progress bar (current/target), "X/Y" right-side

**AT-ACHIEVE-03 — Recent Unlocks section (NEW)**
- **Given** there are 1+ badges earned in the last 30 days
- **When** the sheet renders in All or Earned tab
- **Then** show "RECENT UNLOCKS" eyebrow below In Progress
- **And** below: rows for each recently-earned badge (chronological, newest first, max 10)
- **And** each row: 48px icon container, title + rarity pill, description, "X tier · Y to next tier" line for tiered counters, "Unlocked Z days ago" eyebrow, share button (top-right of row)

**AT-ACHIEVE-04 — rarity pills**
- **Given** any badge is rendered
- **When** the badge row renders
- **Then** show the rarity as a small pill next to the title:
  - `common` — grey
  - `uncommon` — blue
  - `rare` — amber
  - `epic` — purple
  - `legendary` — gold (gradient pill)

**AT-ACHIEVE-05 — share button**
- **Given** the user taps the share button on an earned badge
- **When** the tap completes
- **Then** trigger the existing native share sheet
- **And** share payload includes: badge title, description, "[username] just earned this on Clbhouz" footer, deep link to that badge

**AT-ACHIEVE-06 — counter badge display**
- **Given** the user views a tiered/counter badge (e.g. Birdie Hunter)
- **When** the row renders
- **Then** show the user's current count: "122 birdies · 128 to next tier (Birdie Master)"
- **And** if at max tier: "1,200 birdies · max tier reached"

**AT-ACHIEVE-07 — mark seen on view**
- **Given** the sheet has opened
- **When** any badge with `seen_by_user = false` becomes visible
- **Then** `gam_mark_badge_seen` RPC fires for that badge after 800ms of visibility
- **And** badge's "new!" dot disappears on next render

### Behaviour — friend view

**AT-ACHIEVE-FRIEND-01 — toggle appears**
- **Given** the user is viewing a friend's handicap (`/handicap/:userId` where userId !== auth.uid())
- **And** the friend is EG-synced
- **When** the user taps the trophy icon
- **Then** the sheet opens with the same top bar
- **And** a new "View · Compare" segmented toggle is shown directly below the counter line
- **And** "View" is the default selected option

**AT-ACHIEVE-FRIEND-02 — View mode**
- **Given** the toggle is on "View"
- **When** the sheet body renders
- **Then** the friend's badges + milestones are shown read-only (no share button, no "mark seen" behavior)
- **And** headline text adapts: "[Friend name]'s achievements" instead of "Achievements"
- **And** progress section reads "[Friend name] is X away from..."

**AT-ACHIEVE-FRIEND-03 — Compare mode**
- **Given** the toggle is on "Compare"
- **When** the sheet body renders
- **Then** each badge row is replaced with a 2-column comparison:
  - Left column: user's count + earned/locked status
  - Right column: friend's count + earned/locked status
  - Center: visual indicator (▲ green if user leads, ▼ red if friend leads, = if tied)
- **And** at the top: a "head-to-head" summary card "You lead on X categories · They lead on Y · Tied on Z"
- **And** "Recent Unlocks" + "In Progress" sections are hidden in Compare mode

**AT-ACHIEVE-FRIEND-04 — non-EG-synced friend**
- **Given** the friend has `eg_app_connected = false`
- **When** the user taps the trophy icon on their `/handicap/:userId` page
- **Then** the sheet opens with a single centered card "This user hasn't connected England Golf — achievements aren't available"
- **And** no toggle is shown

### Empty state

**AT-ACHIEVE-EMPTY-01 — owner with zero earned**
- **Given** the user has 0 earned badges (post-backdate or new user)
- **When** the sheet opens
- **Then** show: "0 of 22 earned · 0%"
- **And** progress bar at 0
- **And** body shows "Locked" tab content by default (all greyed out)

**AT-ACHIEVE-EMPTY-02 — In Progress with nothing close**
- **Given** the user has no badges with counter_value within striking distance of next tier
- **When** "In Progress" tab is selected
- **Then** show "No badges close to unlocking yet" + "Most achievable: [badge title], [X away]"

### Loading state

**AT-ACHIEVE-LOADING-01**
- **Given** the sheet is opening
- **When** `get_user_achievements_for_viewer` is in flight
- **Then** show 5 skeleton rows in body

### Error state

**AT-ACHIEVE-ERROR-01**
- **Given** the RPC fails
- **When** the sheet renders
- **Then** show retry card
- **And** the counter / progress bar at the top is hidden (would show 0/0 confusingly)

---

## 12. Notifications inbox

**Surface:** bottom sheet, opened from bell icon in Today tab header
**Context:** The in-app inbox view of `gam_notification_outbox` rows for the current user. Push notifications are separate (§14).

### Behaviour

**AT-NOTIF-01 — bell badge**
- **Given** the user has 1+ rows in `gam_notification_outbox` with `status IN ('pending', 'sent')` AND not yet marked read
- **When** the bell icon renders
- **Then** show a small amber dot with the count (capped at "9+")
- **And** if zero unread, no dot is shown

**AT-NOTIF-02 — sheet opens**
- **Given** the user taps the bell
- **When** the sheet opens
- **Then** sticky header reads "What's new" + close X
- **And** body shows notifications grouped by recency: Today, Yesterday, This Week, Earlier
- **And** within each group, items sorted by `created_at DESC`

**AT-NOTIF-03 — item row**
- **Given** any notification item renders
- **When** the row is shown
- **Then** show:
  - 24px emoji at left (matches notification template emoji)
  - Urgency pill (HIGH = red, NEW = amber, INFO = blue) top-right
  - Bold title (single line, truncate at edge)
  - Description (1–2 lines)
  - "[Action label] →" CTA button (amber, no border, bottom-left)
  - "X hours ago" timestamp top-right next to urgency pill
- **And** the row has a colored 3px left border in the urgency color

**AT-NOTIF-04 — tap behavior**
- **Given** the user taps an item's CTA
- **When** the tap completes
- **Then** the sheet closes
- **And** navigation happens to the route in `data.route` from the template
- **And** the notification is marked read (locally state update; future v2: server-side via RPC)

**AT-NOTIF-05 — Settings link**
- **Given** the sheet is open and scrolled past all items
- **When** the footer renders
- **Then** show a small footer card with "NOTIFICATION CATEGORIES" eyebrow
- **And** caption: "Course Legends · Leagues · Streaks · Rivalries · Badges · Quiet hours 21:00–07:00 · Manage in Settings"
- **And** the "Manage in Settings" link is tappable, navigating to settings/notifications

### Empty state

**AT-NOTIF-EMPTY-01**
- **Given** the user has zero notifications in the outbox
- **When** the sheet opens
- **Then** show centered: "🌙 All caught up" + "We'll let you know when something interesting happens"

### Loading state

**AT-NOTIF-LOADING-01**
- **Given** the sheet just opened, outbox query in flight
- **When** rendering
- **Then** show 5 skeleton rows

### Error state

**AT-NOTIF-ERROR-01**
- **Given** outbox query fails
- **When** rendering
- **Then** show "Couldn't load notifications" + retry

---

## 13. Launch sheet (one-off)

**Surface:** full-screen modal on first post-launch open
**Context:** The big-bang welcome. Shown once, dismissed forever (state in `localStorage` and a `user_profiles.gam_launch_seen_at` column added in a pre-launch micro-migration).

### Behaviour

**AT-LAUNCH-01 — when shown**
- **Given** the user is EG-synced, the launch has happened, and they have not yet seen the launch sheet
- **And** the user has at least 1 badge OR 1 milestone OR 1 legend after backdate
- **When** they open `/handicap` for the first time post-launch
- **Then** the launch sheet appears as a full-screen modal with backdrop blur
- **And** the underlying Today tab is dimmed and non-interactive

**AT-LAUNCH-02 — content**
- **Given** the sheet has appeared
- **When** it renders
- **Then** show centered:
  - ✨ emoji (80px)
  - Eyebrow "WELCOME TO THE NEW HANDICAP" in amber
  - Headline "You're already..." (32px, bold)
- **And** below: a card with 5 stacked rows:
  - 🏆 "Birdie Legend at N course[s]" + "[course names]"
  - 🥈 "In [bracket] · Pod [N]" + "#X of 30 · Y pts to promote"
  - 🔥 "[X]-week round streak active" + "PB · Y weeks"
  - 🏅 "Holder of X badges" + "[Y] birdies · [Z] eagles · [W] sub-80s"
  - ⚔️ "Rival of [name] · X–Y lead" + "[N] shared rounds · last met [Z]"
- **And** rows where the user has zero data are hidden (graceful degrade)
- **And** at the bottom: amber CTA button "Tap to explore →"

**AT-LAUNCH-03 — dismissal**
- **Given** the user taps the CTA
- **When** dismissed
- **Then** the sheet closes with a slide-down animation
- **And** `user_profiles.gam_launch_seen_at` is set to `now()`
- **And** `localStorage.gam_launch_seen` is set as a backup

**AT-LAUNCH-04 — already seen**
- **Given** `gam_launch_seen_at` is set OR localStorage flag exists
- **When** `/handicap` opens
- **Then** the sheet does NOT appear
- **And** the Today tab renders normally

### Empty state

**AT-LAUNCH-EMPTY-01 — user has no backdated data**
- **Given** the user is EG-synced but has zero rounds (genuinely new account)
- **When** they open `/handicap` post-launch
- **Then** the launch sheet does NOT appear
- **And** they see a normal Today tab with most-empty states active

### Loading state

**AT-LAUNCH-LOADING-01**
- **Given** the sheet decision is in flight (checking gam_user_badges count, etc.)
- **When** `/handicap` first loads
- **Then** the sheet decision is made within 500ms of page mount
- **And** if it would show, it appears with a 300ms fade-in
- **And** if not, no flash of empty sheet

### Error state

**AT-LAUNCH-ERROR-01**
- **Given** the launch-eligibility query fails
- **When** `/handicap` opens
- **Then** the sheet does NOT appear (fail closed)
- **And** the error is logged but not surfaced to the user

---

## 14. Receiving a push notification

**Surface:** OS-level push notification + in-app routing
**Context:** Push messages sent via OneSignal from `push_notification_queue` (which `gam-notifications-dispatcher` writes to).

### Behaviour

**AT-PUSH-01 — receipt & display**
- **Given** the user has OneSignal push enabled and a notification is sent
- **When** the device receives it
- **Then** the OS shows the notification with the template's title and body
- **And** tapping it opens the Clbhouz app (or wakes it if backgrounded)

**AT-PUSH-02 — deep link**
- **Given** the user taps the push and the app opens
- **When** the app processes the deep link
- **Then** navigate to the route in `data.route` (e.g. `/handicap?sheet=achievements`)
- **And** if the route has a query param triggering a sheet, open that sheet automatically after page load

**AT-PUSH-03 — push received while app is open**
- **Given** the user is using the app actively
- **When** a push arrives
- **Then** OS-level notification is suppressed (per existing app convention)
- **And** the in-app toast appears at the top of the screen for 4 seconds (using existing toast container infrastructure)
- **And** tap on toast also triggers deep link

**AT-PUSH-04 — quiet hours respected**
- **Given** the user's local time is 22:30 and an event would trigger a low/medium-urgency push
- **When** the notification is added to `gam_notification_outbox`
- **Then** the dispatcher defers `scheduled_for` to 07:00 next-day local
- **And** no push is sent before 07:00

**AT-PUSH-05 — quiet hours bypassed (high urgency)**
- **Given** the user's local time is 22:30 and an event triggers a high-urgency push (e.g. legend lost)
- **When** the notification is processed by the dispatcher
- **Then** the push is sent immediately regardless of quiet hours
- **And** the notification appears as normal on the device

**AT-PUSH-06 — bundling**
- **Given** 5 league-rank changes happen within 1 dispatcher cycle (1 minute)
- **When** the dispatcher runs
- **Then** only 1 push is sent (showing the most recent / final state)
- **And** the other 4 source rows are marked `status = 'bundled'` in the outbox

### Error / failure

**AT-PUSH-ERROR-01 — OneSignal failure**
- **Given** OneSignal returns an error sending a push
- **When** `process-push-queue` records the failure
- **Then** the source `gam_notification_outbox` row is NOT marked as failed (dispatcher already moved it to `sent`)
- **And** the failure remains in `push_notification_queue.error` for monitoring
- **And** the in-app inbox still shows the notification — user can see it next time they open the app

---

## 15. Big-bang launch sequence

**Surface:** entire app
**Context:** The one-time orchestration when public launch happens. Series of edge function calls plus the Launch sheet.

### Sequence

**AT-LAUNCH-SEQ-01 — pre-launch readiness check**

- **Given** an admin runs the launch-day checklist script
- **When** the script runs
- **Then** verify:
  - All Brief 2 edge functions deployed and healthy
  - All Brief 1 SQL chunks applied
  - Spring 2026 leagues exist in `gam_leagues` with `is_active = true`
  - `pg_notify('gam_eval', ...)` works (test message → cron picks up within 30s)
  - OneSignal credentials valid (`ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY` set)
  - `push_notification_queue` table accessible

**AT-LAUNCH-SEQ-02 — pod assembly**

- **Given** all readiness checks pass
- **When** the admin invokes `gam-assemble-pods('2026-Q2')`
- **Then** every EG-synced user is bucketed into a pod
- **And** Bronze/Silver/Gold/Platinum pods of up to 30 are created
- **And** `gam_league_members` is populated
- **And** `gam_league_standings_mv` is refreshed
- **Verification:** `SELECT bracket, COUNT(*) FROM gam_league_pods JOIN gam_leagues USING(id) GROUP BY bracket` returns 4 brackets with at least 1 pod each

**AT-LAUNCH-SEQ-03 — backdate replay**

- **Given** pod assembly is complete
- **When** the admin invokes `gam-backdate-replay`
- **Then** every EG-synced user has their `gam_reset_user(user_id)` RPC called
- **And** all existing `whs_scores` rows are enqueued in `gam_evaluation_queue`
- **And** the evaluator drains the queue over ~30 minutes
- **And** during the drain, the app is **not** in maintenance mode — users can still use it; their gam_* surfaces just populate progressively

**AT-LAUNCH-SEQ-04 — drain complete check**

- **Given** the admin polls `gam_evaluation_queue` for `status='queued'` count
- **When** the count reaches 0
- **Then** the backdate is complete
- **And** every EG-synced user has populated badges, milestones, streaks, course legends, and league points

**AT-LAUNCH-SEQ-05 — Launch sheet enable**

- **Given** drain is complete
- **When** the admin flips a feature flag `gam_launch_active = true`
- **Then** the Launch sheet (§13) becomes eligible for display
- **And** the next time each user opens `/handicap`, the sheet appears once

**AT-LAUNCH-SEQ-06 — pre-launch cleanup tasks**

- **Given** Brief 4 UI is live and verified
- **When** the post-UI cleanup runs (separate ticket)
- **Then** the following happens:
  - `LevelUpToastContainer` is unmounted from `App.tsx` (vestigial Phase 4D — no useful behaviour)
  - `AchievementToastContainer` is repointed at `gam_user_badges` for its postgres_changes subscription (currently listens to `user_achievements` which never inserts)
  - `PostAchievementCard.tsx` updated to read from `gam_badge_catalogue` instead of `achievements` table
  - Chunk 8 (legacy table renames) is executed

---

## 16. Backdate replay for ops support

**Surface:** admin tooling (CLI or simple admin panel button)
**Context:** Ops scenario — a user reports "my badges look wrong" or "I'm missing the X badge I should have." Resolution: replay.

### Procedure

**AT-OPS-REPLAY-01 — single user replay**
- **Given** an admin determines a specific user needs a replay
- **When** the admin invokes `SELECT * FROM gam_reset_user('USER-UUID')` via Supabase SQL editor
- **Then** the RPC:
  - Deletes the user's `gam_user_badges`, `gam_user_milestones`, `gam_streaks`, `gam_course_legends`, `gam_league_history`, `gam_round_stats` rows
  - Resets all the user's `whs_scores.evaluator_version_last` to 0
  - Enqueues every round for re-evaluation
  - Returns counts of what was deleted + queued
- **And** the evaluator drains over the next several minutes
- **And** the user's gam_* state is fully rebuilt from raw `whs_scores` data

**AT-OPS-REPLAY-02 — version-bump replay (all users)**
- **Given** Lovable has changed a badge rule (e.g. tier thresholds in `gam_badge_catalogue.counter_tiers`)
- **And** the change needs to apply to all users
- **When** the admin manually bumps the evaluator version env var (`GAM_EVALUATOR_VERSION` to `"2"`) and triggers `gam-backdate-replay`
- **Then** every user is re-evaluated with the new rules
- **And** badges may be added, removed, or change tier as appropriate

### Acceptance

- [ ] `gam_reset_user` SQL is idempotent (running 2× on same user has same result as 1×)
- [ ] No data loss in `whs_scores` (only `evaluator_version_last` mutates)
- [ ] No user-visible downtime during replay
- [ ] All previously-earned-but-now-revoked badges silently disappear from UI within 30s of replay completing
- [ ] Replay does not re-issue notifications for already-seen events (use `seen_by_user = false` flag for that; replay sets new badges as `seen_by_user = false`, which is **correct** — user gets re-notified on first view of the UI, but no push because the dispatcher's dedup key catches it)

---

## 17. Cross-cutting performance criteria

Apply to every screen / interaction:

| Metric | Budget |
|---|---|
| Page navigation to `/handicap` | < 800ms FCP on a warm cache |
| Bell icon → Notification sheet open | < 200ms |
| Today tab → Leagues card data loaded | < 400ms with `gam_league_standings_mv` populated |
| Course Detail → Legends tab switch | < 300ms |
| Trophy icon → Achievements sheet open | < 250ms |
| Achievements sheet → friend Compare mode toggle | < 100ms (data already loaded) |
| Streak grid → All Streaks sheet open | < 200ms |
| Rivalry card → Deep-View page nav | < 600ms |

If any of these exceed budget in real testing, raise as a P1 — most are within reach given the index work in Brief 1.

---

## 18. Accessibility

- [ ] All interactive elements have a tap target of ≥ 44pt × 44pt
- [ ] Color is never the sole indicator of meaning (green/amber/red zones in league bar also have ↑/↓ text)
- [ ] Streak Freeze snowflake has alt text "Freeze available"
- [ ] Friend Compare mode green/red indicators have ▲/▼ text
- [ ] All sheets are dismissible via swipe-down gesture in addition to close X
- [ ] Bell badge count is announced as "N new notifications" by screen readers

---

## 19. Out of scope for v1 (track for v2)

These are intentional omissions:

- League chat / pod chat (no in-pod messaging)
- Rivalry direct challenges ("challenge them to a match")
- Custom achievement creation by users
- Achievement gifting / sending kudos
- Pod customization (name, emoji)
- Stake-based leagues (bets, currency)
- Cross-platform handicap import (non-EG sources)
- Public leaderboard rankings outside of pods (global "top 100 birdies this month")
- Course Legend categories beyond the initial 5
- Streak Freeze purchase (currently 1/month free, no monetization)
- "Hide my achievements from this specific user" (only on/off toggle in v1)

---

## 20. End-state checklist

Brief 4 (UI build) is complete when every acceptance test in this document passes in production:

- [ ] §2 — Today tab composition (3 ATs)
- [ ] §3 — Recent Unlocks strip (8 ATs)
- [ ] §4 — Legend Status card (6 ATs)
- [ ] §5 — Your Legend Status sheet (8 ATs)
- [ ] §6 — Leagues card (8 ATs)
- [ ] §7 — Leagues sheet (9 ATs)
- [ ] §8 — Streaks (10 ATs)
- [ ] §9 — Rivalry Deep-View (8 ATs)
- [ ] §10 — Course Legends tab (8 ATs)
- [ ] §11 — Achievements sheet (15 ATs)
- [ ] §12 — Notifications inbox (8 ATs)
- [ ] §13 — Launch sheet (7 ATs)
- [ ] §14 — Push notifications (6 ATs)
- [ ] §15 — Launch sequence (6 ATs)
- [ ] §16 — Ops replay (2 ATs)
- [ ] §17 — Performance (8 budgets met)
- [ ] §18 — Accessibility (6 checks)

**Total: 130+ acceptance tests**

Brief 4 follows.
