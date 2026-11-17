# REPORT_SHEET_CANON

## Files
- src/components/moderation/ReportSheet.tsx — rebuilt on BottomSheet + SheetHeader (dark, no border); new optional `subject` prop ('golfer' default); exported `reportSheetTitle`; reasons with subs, white radio, details textarea, white Send button; new toasts.
- src/components/moderation/reportSheet.css (new) — all geometry/colour from the brief.
- src/pages/BusinessProfilePage.tsx:575 — `subject="business"` added (only consumer change).
- src/test/reportSheetCanon.test.tsx (new, +2 tests).

## RPC payload
handleSubmit is unchanged apart from the toast strings: same `submit_report` args, same [REVIEW:id]/[MSG:id] prefixes, same reason ids, same 'other'-needs-details rule, same reset. The new test asserts the exact message payload.

## Tests
Before 9,140. After, sequential shards: 2,257 / 2,270 / 2,267 / 2,348 = 9,142, all passing (+2 = new file). No tests edited, renamed or deleted. Shard 3 was rerun after shard 4 because the first run was cut off by the command timeout (not a failure). Typecheck (tsgo) clean.

## Notes
- Reason 'other' label is now "Something else" per brief.
- The sheet's old Loader2 spinner on submit is replaced by the "Sending..." label.
- Not checked on device (sign-in needed to reach any consumer).
