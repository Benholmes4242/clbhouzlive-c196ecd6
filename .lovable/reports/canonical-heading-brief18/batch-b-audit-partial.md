# Batch B — Courses audit (PARTIAL, not a sign-off)

Route graph traced from App.tsx:689–694, :862. Nothing changed yet.

Verified E1/E2 (planned → surface ink): CourseDirectorySheet.tsx:240 recentHeading, :285 ratedHeading (E2); RecordBook.tsx:50 board label (E2); ClaimCourseSheet.tsx:58 panelKicker (E2); CourseWebsiteSheet.tsx:62 officialWebsite (E1), beforeYouGo (E2, shares declaration with K3 earlyData — call-site split needed); YourHolesSheet via ABOUT_KICKER (AboutSection.tsx:49) distribution/holes/pars/thirds (E2, shared constant also used by K2/K3 — call-site opt-in); LikesSheet.tsx:196 group heading (E2, shared — Courses-only opt-in); scorecardParts TileSection feat/rounds/card on Courses (E2, shared — Courses-only opt-in).

Verified keeps: 2 K1, 16 K2, 12 K3, 2 K4 (full rows in sub-agent output summarised in report). D (provisional): ReviewRailSlot.tsx:51 RAIL_LABEL_STYLE, ReviewComposerV2.tsx:106 STEP1_HEADING.

? list: TheArgumentSection.tsx:34 group label; Top 100 CSS branches (top100Compare.css, race, progress sheet); Media CSS (media-v2.css, hole-walk.css, shot-tag-choices.css); Legends drilldown/flat-board sheets; Rate composer nested sheets; non-Courses callers of Likes/Comments/scorecard. No 390 crops yet.

Counts (verified rows only): E1 1, E2 12, K1 2, K2 16, K3 12, K4 2, K5 0, K6 0; E2? 1; D 2. StandoutRounds NET/GROSS K1 keep (ruled).
