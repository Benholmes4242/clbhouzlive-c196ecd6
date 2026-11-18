# REVIEW CARD REDESIGN (ReviewBottomSheet)

## Built
- Panel fontFamily and local FONT_SF removed (file declares no fontFamily).
- Header: uppercase location kicker + TOP 100 stamp (query ['courses','review-sheet-top100',courseId], course_top100_memberships via activeTop100CourseIds, boolean; loading/error = no stamp); 22px course name clamped to two lines on the CourseNameLink text element; reviewer row is one button (aria-label "View {name}'s profile") with 36px avatar, wrapping "{playedAgo} · {n} courses rated" and chevron. Doors, old 28px row, calibration cells and first-rating note removed. ReviewScoreRow unchanged.
- Comparison sentence: one `<p data-review-calibration>`, "{d} above/below" / "Level with", bold 600 ink, nothing coloured.
- Scroll: 18/20/8 padding, 15/1.55 text, new no-prose copy, square 3-col grid (gap 4, radius 14 on grid), cap 6 with "+N", 28px play disc, heading removed, plain See all link after media, 28px sticky fade. Poster derivation unchanged.
- Footer: one row like, comment, share; likers on the right via new opt-in `LikedByRow variant="stack"` (nothing at zero; "+N" under a ≤300px card container query). No border, reserve or comment preview. `commentPreview` prop still accepted (ignored) so the portal is untouched.
- Opt-in `footerBox` prop added to ReactionAction and CommentAction for the 44px footer boxes; other callers unchanged. RoundEngagementActions unchanged.

## Flag (brief and mock agree, but conflicts with a standing rule)
- Liked state is #F8FAFC filled thumb per brief and mock; elsewhere reacted thumbs are amber ("the one legitimate amber: you"). Built white as signed off — confirm.
- `handleGoToReview` (course door → `?tab=reviews&highlight=`) became unused and was removed; the course name now opens `/courses/:id`.

## Tests changed (authorised: doors, calibration cells, first-rating note, media heading, footer reserve)
- Deleted `src/test/reviewSheetMediaHeading.test.ts` (6 cases): `expect(reviewMediaHeading(m(p, v))).toBe(want)` — heading and helper removed.
- `cb61SheetDoors.test.tsx`, deleted 3: "review doors render in the player row with no foot actions" (`toEqual(['course','profile'])`), "review omits Course entirely without a course id", "review omits Profile entirely without a user id" (`[data-sheet-door=…]` null/not null) — doors removed.
- `likedByCollapse.test.tsx`: removed the ReviewBottomSheet entry of "%s still passes reserve to LikedByRow" (`toMatch(/<LikedByRow[\s\S]{0,900}?\breserve\b/)`) — reserve removed from this sheet (-1).
- `reviewCourseNoReopen.test.tsx` "closes both overlays in order…": now taps the course name instead of `[data-sheet-door="course"]`; location expectation `/courses/course?tab=reviews…&highlight=r0` → `/courses/course` — door removed. Order assertions kept.
- `reviewSheetCalibration.test.tsx`: calibration cell cases (`figs toEqual(['+0.7','−0.4'])`, `'mikem84 rates 7.6'`, `'3 ratings, 8.7 average'`, `'First rating here'`, `'Too few reviews to average'`, figure colours) rewritten to the sentence grammar (same count); score-row order now row→sentence; first-rating note case now asserts the note is absent; reviewer line expects `'Reviewed 9 months ago · 5 courses rated'` (was `'Reviewed 9 months ago'` — reviewer row change); player row "exactly two doors" (`querySelectorAll('button').length).toBe(2)`) now asserts one button with none inside.
- Added `src/test/reviewCardRedesign.test.tsx` (9): a–g plus a separate TOP 100 positive case and no-fontFamily.

## Totals
- Before 9,076. After 9,075 = 9,076 − 6 − 3 − 1 + 9. Shards: 2,235 / 2,254 / 2,272 / 2,314, all passing.
- First shard-1 run had one failure in untouched `src/test/coursesRailsUnlimited.test.tsx` ("admin hole-tag predicate invalidation refetches the active infinite holes rail", 9,452ms, under load). It passed 3/3 alone and the shard-1 rerun passed 2,235/2,235; test not edited.
- Typecheck `npx tsgo -b --noEmit` clean.

## Browser (Chromium, signed out)
- 390 and 320: no element overflows the card; at 320 the course name wraps to two lines and the reviewer line wraps; footer is one 44px row. Signed-in footer (like + likers) unchecked in-browser.
