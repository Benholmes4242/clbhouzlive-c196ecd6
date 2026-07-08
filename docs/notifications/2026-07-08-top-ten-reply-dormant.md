# Notification catalogue — `top_ten_reply` DORMANT

**Status (2026-07-08):** trigger live, no producing UI — reply UI intentionally
not built. Top-10 comments have no reply affordance in the product today, so
the `top_ten_reply` notification type cannot fire from user action.

The trigger SQL (`create_top_ten_reply_notification`) is correct and unit-tested
at the DB level; the client renders correctly via the
`getNotificationActionText` / `InboxRow.getVerb` branches added in the
2026-07-08 notification-fixes ship note. If/when reply UI ships, no further
notification-layer work is needed for the row to render — deep-link plumbing
also supports `data.parent_comment_id → &top_ten_parent=…` today.

Do not remove the trigger or the client branches.
