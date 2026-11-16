# BRIEF_MEMBER_BADGES_WHITE
Rim/foil tokens white-silver per mock; plate unchanged. Sizes: large 16/7.5/5.4px pad 0 5px; small 12/6.5/4.1px pad 0 4px; island 18/8.5/6.1px pad 0 6px.
Test edits: proBadgeMembers.test.ts only — rim/foil token strings, large/small/island height, padding, radius, font-size; three test titles renamed to the new sizes ("keeps the normal badge at 16px with an inside-box white rim", "keeps the small badge at 12px with 6.5px letters", "keeps the island badge at 18px with 8.5px letters and no shadow").
Suite: 8,945 (2,240 / 2,194 / 2,237 / 2,274), delta 0.
Measurements (real CSS, sample names, 320/375/430, identical): byline PRO/AM 12px d=0; row 12px d=0; creator 16px d=0; island 18px d=+0.5; profile hero surname PRO 16px d=+1.3 with top:1px (d=+0.3 with top:0). No overflow.
OPEN: hero needs top:0 to centre within 1px, but proBadgeMembers.test.ts:89 asserts 'top:1px' and the brief keeps other assertions. Left at top:1px pending ruling.
