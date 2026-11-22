# Viewer follow + follow-up rulings — resumed

## Authorised test changes
- pf1bFeedCard.test.tsx.snap (case "renders a post with no context exactly as before"), initials span:
  - before: `style="font-size: 13px; font-weight: 600; letter-spacing: 0.01em; line-height: 1; user-select: none; ..."`
  - after: `style="font-size: 13px; font-weight: 600; letter-spacing: 0.01em; line-height: 1; display: block; user-select: none; ..."`
- canonicalGalleryChrome.test.tsx:96 `toEqual(['The clubhouse', '1'])` → `toEqual(['Clubhouse', '1'])`
- courseGallery.test.tsx:77 renamed "place information uses its literal title and member count" → "place information uses its short label and member count"; `toEqual(['The views','1'])` → `toEqual(['Views','1'])`
- courseGallery.test.tsx:78 "Conditions age comes from latest added shot": `toEqual(['Course conditions','1','Today'])` → `toEqual(['Conditions','1','Today'])`
- New case in fullscreenViewerFollow.test.tsx: "a business author follows through the same onFollow → handleFollow path as the removed button".

## Counts
Baseline 9,804 (bf18cd4). Final 9,834 / 870 files, all passing (2,401 / 2,436 / 2,446 / 2,551), logs in final/.
+30 by file: courseMediaViewerAddendum.test.tsx +6, playedGolferNames.test.ts +10 (new file), followUpRulings.test.tsx +7 (new file; the earlier report's "8" was wrong), fullscreenViewerFollow.test.tsx +7 (new file). Renamed, not added: canonicalGalleryChrome "(d)…", playedWithTags place chip, whatsBeenPlayedV6 faces line, courseGallery place info. No case removed.
Correction: the previous report's "9,834 after" was an arithmetic slip; that run totalled 9,833 (+29); the business case is the 30th.

## Guests
Before bf18cd4 the Follow pill rendered when `!readOnly && !isOwnPost` (guests included) and called `handleFollow`, which in useClubhouseFollows returns early when there is no userId: no sign-in prompt. " · Follow" uses the same condition and handler, so guests see it and a tap does nothing, exactly as before.

## Captures (disposable fixture page, deleted; placeholder images)
captures/: review/longname {before, -following}, own, round + round-slide1/2, mixed-slide0–2, at 390 and 320; metrics.json.
- No horizontal overflow anywhere. Long names ellipsise; time, Follow/FOLLOWING and REVIEW stay whole at 320.
- Own post: nothing after the time.
- Round pill present on all three slides; stack tops identical (618/634/684/726).
- Mixed photo→video→photo: dots/pill/member tops 646/662/712 and stack bottom 744 on every slide at both widths; stack bottom to pills = 40px = 14 + 12 reserved scrubber + 14. The scrubber bar itself did not render (fixture video does not load).

## Not done
Feed-card captures (hole card/duration, place chip, teaser mention), 22/32/46px initials before/after, Media tab mixed run and short-name shots, Tour overview parity captures and AUDIT table.
