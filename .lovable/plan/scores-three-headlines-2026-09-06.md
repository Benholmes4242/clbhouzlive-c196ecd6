# Scores three headlines

## Build
- Replace the Members and Courses eyebrow/headline stacks with one shared headline row: selected board name on the left and board-aware count on the right.
- Use `boardCountsRounds` for both the member headline count and terminal action so ranking boards say members while Recent and feat boards say rounds; keep all course boards counted in courses.
- Add the same 20/800 `COURSE ANALYTICS` section heading above the existing course search and card, with 26px separation between sections.
- Preserve the filter rail, board rails, rows, analytics card, gates, search states, RPC behavior, and all existing color semantics.

## Verification
- Check board changes update both the member headline and unit, and that headline and terminal action agree.
- Verify “Most improved” plus “19 MEMBERS” stays on one row at 320pt and all three headings align with row figures.
- Audit remaining hardcoded board-count units and report what the previous pool-round count represented.
