# Scores canonical board entry

## Build
- Make the member rail consume the canonical `RANKING_BOARD_KEYS` and `FEAT_BOARD_KEYS` sequence, removing the duplicate Scores-only ordering.
- Let `useDiscoverEntryBoard` choose the opening member board, window, and scope; keep member/facet reads parked until that choice resolves.
- Preserve direct board selection after entry and all existing headings, counts, rows, filters, and course behavior.

## Verification
- Confirm a fresh first-session entry opens on Most recent with a rounds count and the canonical chip order.
- Confirm later/session-restored entries select and visibly highlight whichever handicap-default or rotated board the entry system returns.
- Run type checks and verify the Scores page at 320pt without overflow.
