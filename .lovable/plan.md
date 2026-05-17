## Brief 3 — Phased UI build plan

Brief 3 specifies 11 new surfaces, 4 modifications, and 130+ acceptance tests. This is multi-week work — must be phased. Brief 3 has been copied to `BRIEF_3_UX_FLOWS.md` at repo root as the working contract.

### Phase plan (recommended sequencing)

**Phase 1 — Today tab additions (this PR)**
The minimum coherent first slice. Touches `/handicap` only.
- §3 Recent Unlocks strip (inline + card skeleton + empty/loading/error)
- §4 Legend Status card (inline + tap → sheet)
- §5 Your Legend Status sheet (modal, grouped Legend / Top 3 / Top 10)
- §6 Leagues card (inline + promote/relegate bar visual signature)
- §7 Leagues sheet (full pod standings + How It Works)
- Wire all three into the Today tab in the order from AT-TODAY-01

**Phase 2 — Streaks expansion**
- §8.1 Extend grid from "Three Runs to Beat" to 7-streak grid with Freeze indicator
- §8.2 All Streaks sheet

**Phase 3 — Rivalry deep view**
- §9 New route `/handicap/rivalry/:rivalId` (full page)
- Make existing Friends-tab rivalry cards tappable

**Phase 4 — Course Legends tab**
- §10 Rename "Leaderboard" → "Legends" on Course Detail
- 5 category cards, top 5 → top 10 expand, "Where You Stand" footer

**Phase 5 — Achievements sheet rework**
- §11 Rarity pills, In Progress + Recent Unlocks sections, share button, View/Compare toggle for friend mode
- Friend-view layout rules from AT-TODAY-02/03

**Phase 6 — Notifications & Launch**
- §12 Bell icon + inbox sheet
- §13 Launch sheet (one-off post-launch modal)
- §14 Push deep-link routing (in-app toast + sheet auto-open from query param)

Out of this build: §15 launch-sequence ops scripts (admin), §16 replay (admin), §17/§18 are continuous QA criteria.

### What I need from you before writing code

**1. Phase 1 scope confirmation.** Phase 1 alone is 5 new components, 1 modal hook for Legend Sheet, 1 modal hook for Leagues sheet, plus Today-tab wiring. Realistic for a single build pass but already a large diff (~8 new files, ~600 LOC). OK to proceed with all of Phase 1, or trim further to just Recent Unlocks + Legend Status (defer Leagues to its own pass)?

**2. RPC availability check.** The brief assumes these RPCs exist from Brief 1: `get_user_legend_status`, `get_my_pod_standings`, `get_my_streaks`, `get_rivalry_breakdown`, `get_course_legends`, `get_user_achievements_for_viewer`, `gam_mark_badge_seen`. If any are missing, the components will be built against the contract but render empty/error states until the RPCs land. Should I:
   - (a) Build UI against the contract regardless (graceful empty states), or
   - (b) Verify each RPC exists first, flag missing ones, build only what's backed?

**3. Data shapes.** Brief 3 describes UX but not return shapes. For Phase 1 I will design hooks against the AT copy (e.g. `useLegendStatus()` returns `{ legendCount, top3Count, top10Count, topTitles: [{category, courseName, courseId}] }`) and adapt to actual RPC output once verified. OK?

### Technical notes
- All new surfaces use existing Dispatch tokens (white surfaces, 0.5px hairlines, 3px rule markers, amber #F7931E, slate #0F172A, Geist tabular-nums for numbers).
- Sheets use the existing comments-sheet pattern (36×4px handle, forced light mode where applicable).
- Avatars 34% squircle.
- New route `/handicap/rivalry/:rivalId` will be added in Phase 3.

Reply with answers to 1, 2, 3 and I'll start Phase 1.