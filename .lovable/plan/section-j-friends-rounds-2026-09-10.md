# Section J — Friends' Rounds

## Outcome
Replace the current panel-style friends feed with the owner-only flat Section J. Show the five newest qualifying rows on the page, with the complete fortnight list in a shared dark bottom sheet.

## Build

1. **Correct Section I’s linked sheet label only**
   - Change `FullLeaderboardSheet` column label from `30D` to `30D RANK`.
   - Leave its structure, columns, inactive rows, and expander byte-identical.
   - Record the accepted non-English ordinal fallback as deferred localisation work; add no ordinal machinery.

2. **Make the friends-round source honest**
   - Extend friend-round data additively with `is_nine_hole` and `total_holes` from existing score records.
   - Keep the existing hook default unchanged for other callers; let Section J request the complete bounded fortnight set.
   - Restrict the section’s count and rows to the stated fourteen-day window so older fallback summaries cannot appear under “Last fortnight.”
   - Keep current sorting: newest round first.

3. **Rebuild the page section**
   - Use flat `HcpSection` with kicker `Friends' rounds`, heading `Recently played`, and meta `Last fortnight`.
   - During loading, render nothing to avoid a layout-changing panel skeleton.
   - Show the five newest rows, separated by existing-token 1px hairlines with none above the first.
   - Add the specified withheld sentence when the settled list is empty and emit `handicap_section_withheld` with `section: 'friends_rounds'` once per settled empty state.
   - Add the terminal `SEE ALL {n} ›` row when there are more than five rounds.

4. **Rebuild each row without changing round-detail behaviour**
   - Keep fixed Gross, Stableford, and Differential columns on every row; empty values retain width and omit their kicker.
   - Use 16px tabular figures, 9px figure kickers, and named 3px name/date and figure/kicker gaps.
   - Put the course on a full-width 12px line with an 8px figures-to-course gap and allow wrapping.
   - Append `· 9 holes` to the date for nine-hole rounds only.
   - A clbhouz row with a real score ID is the sole row-level tap and opens the existing `RoundDetailSheet`, with one right-edge chevron.
   - A WHS-only row is inert except for its separate amber `Invite to clbhouz ›` action beneath the course; no row chevron.
   - Treat clbhouz fallback rows without a score ID as inert rather than routing elsewhere: the brief requires a round-detail destination and forbids dead taps.

5. **Add the complete-list sheet**
   - Use the existing dark `BottomSheet` primitive at 85dvh with a fixed head and independently scrolling body.
   - Reuse the exact Section J row component so page and sheet cannot drift.
   - Preserve the same action rules, nine-hole mark, order, and fixed figure geometry.

6. **Instrumentation and copy**
   - Emit a friends-round row-tap event only when the detail sheet actually opens, carrying `is_clbhouz_user: true` and the existing non-identifying round-state fields.
   - Extend the existing `invite_sent` series for successful invites with a Section J source, rather than creating a second invite series or adding identifying properties.
   - Add required English copy to all six supported locale files.

## Verification
- Run TypeScript checks and the development build.
- Statically verify fixed column widths, conditional kickers, nine-hole fields, no panel/radius/tint, no dead row handlers, one chevron maximum, and no Section J nested scrolling outside the sheet.
- Verify at 390px that Gross remains aligned across all variants, course names wrap, and the five-row section plus see-all sheet render without overlap.
- Confirm the dashboard has no separate invite block. Report the retained contradiction: Section I’s already-accepted three-way row resolver can still produce an invite, while Section J is the only explicit visible Invite action.

## Retained files and reported decisions
- Delete nothing; dead-list the replaced `RecentlyPlayedFeed`/row treatment by line range where applicable.
- Do not alter the existing round-detail sheet.
- Do not alter the Section I ordinal fallback.
