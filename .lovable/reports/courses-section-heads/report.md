# Courses + Top 100 section heads (signed-off: white eyebrows, style B titles)

## Changes
- playedParts PlayedHead: eyebrow 10/800/.18em amber -> 11/700/0.16em uppercase ink, lh 11px; title 21/800/-.01em/25px -> 21/700/-0.035em/22.05px (21x1.05), font-synthesis none; gap 3 -> 5. PLAYED_KICKER {11,11}, PLAYED_TITLE {21,22.05,5}; header comment fixed.
- SectionHead: both tones render ink (tone kept, ignored, noted); HEAD_TITLE_SIZE 19->21, HEAD_TITLE_LINE_HEIGHT 1.1->1.05, tracking -0.02em -> -0.035em, font-synthesis none; header comment updated.
- top100Compare.css: .t100b-kicker 800/mute -> 700/ink, lh 1; .t100b-kicker.amber removed; .t100b-title 22/800/1.18/0, mt 6 -> 21/700/1.05/-.035em, font-synthesis none, mt 5. "amber" class removed in TheArgumentSection.tsx:111 and Top100CompareChart.tsx:57.
- Shells read the same constants/classes, so no shell edit was needed (title box 22.05px).

## Muted labels kept (new class .t100b-label = the old .t100b-kicker values)
- "FEWER THAN TWO RATINGS" (Top100CoursesHubPanel.tsx:398)
- "YOUR HUNDRED" row label (Top100YourHundred, with .t100b-ylabel)
Left untouched: ArgumentGroup labels (inline A.MUTE), ByRegionSection .14em labels. The Your hundred sheet head ("YOUR HUNDRED / The race") and the title-less Top100Leaderboard empty-board kicker are section heads and turn white.

## Sweep (weight > 700 in touched files, not heads, left unchanged)
TheArgumentSection.tsx:73 rank figure 800; top100Compare.css: .t100b-axis, .t100b-badge, .t100b-label (preserved old label), .t100b-lb-labels, .t100b-lb-rv, .t100b-see-all at 800. No section eyebrow renders amber or muted.

## Tests
No existing test pinned the old values (the four candidates all passed unchanged; none edited). New src/test/coursesSectionHeads.test.tsx, 5 tests.
Before: 9,880 / 873 (9,879 passed, 1 held failure). After: 2,443 / 2,440 / 2,451 / 2,551 = 9,885 / 874; 9,884 passed. +5 = coursesSectionHeads.test.tsx.
Sole failure: the held, already-reported overviewNewsReads.test.tsx:22 (awaiting ruling from the effective-round brief), unchanged.

## Verification
Disposable page (deleted) with the real heads and their real shells overlaid, at 390 and 320: eyebrow 11/700/1.76px/#F8FAFC, title 21/700/-0.735px/22.05px; shell kicker and title boxes at identical top and height (one- and two-line Golfers-versus title 44.09px both); no horizontal overflow. Captures heads_overlay_390.png / _320.png.
Not done: whole-tab captures with live data beside the mock (needs a signed-in session with real course data).
