---
name: College Compare Authority
description: Head-to-head college compare page - two-section stat grammar, tie logic, margin captions, coverage sub-labels
type: feature
---

# College compare ("The Duel")

- Two stat sections: **THE SEASON** (counts: earnings, alumni on tour, wins, top 10s) with 4px tug bars, and **THE NUMBERS** (averages: scoring avg, driving distance, SG total) with NO bars.
- Winner logic lives in one place: `resolveOutcome(left, right, format, lowerWins)` in `compare/TugStat.tsx`. Ties are decided on the FORMATTED strings, so two values that print identically read "TIED". Negative values (SG) are real data, never "no data"; only `null` is missing.
- `lowerWins` is true for Scoring Average only.
- Winner value + winning bar half use amber (`AMBER` / `#F7931E`); the losing half uses `BAR_NEUTRAL` (#AEB4BC). Gold is reserved elsewhere and must not appear here.
- Every row carries a margin caption ("TEXAS BY 0.05" / "TIED"). Plain numeric formats derive the margin from the DISPLAYED values so caption and numbers can never disagree; scaled/unit formats ($24.6M, 309.6 yds) use the raw diff.
- Average rows show coverage sub-labels ("FROM 7 OF 17") from `useCollegeAggregateStats().coverage`; the section footer states the year and that averages only cover alumni with the stat recorded.
- `DuelMasthead`: unboxed crests, rank text stays neutral white-alpha, live count uses `STATUS_LIVE_ON_DARK`, CHANGE is a transparent 30px pill with `rgba(255,255,255,0.28)` border.
- Analytics: `tour_college_compare_viewed` (once per mount, after both sides resolve), `_changed` (picker opened), `_swapped` (side changed).
