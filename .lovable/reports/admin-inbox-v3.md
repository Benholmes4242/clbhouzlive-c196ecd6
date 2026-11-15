# ADMIN_INBOX_V3 — admin Inbox restyle

## Files changed
- src/features/admin/pages/InboxPage.tsx — list page only: control row (Open/Done + "updated HH:MM"), bad-dot error row, v3 list/Tools panels, empty states, line-height normal, placeholder colour. Sheets/drawers in this file untouched.
- src/features/admin/components/InboxPanels.tsx — v3 tokens (CC3), figures panel, wrapping chips, skeleton, mirrored Flow chart + key + date ends, Tools rows.
- src/features/admin/components/InboxQueueRow.tsx — 13.5px wrapping titles, queue tag chip at start of fact line, 30px controls, ink-fill primaries, inset fields, Echo wrap, Done "✓" in good.
- src/features/admin/components/CourseSearchField.tsx — **outside the brief's file list**: opt-in `compact` prop (30px, inset, no border, 12px). Default unchanged, so CourseMatchingPage keeps its look.

## Added
- src/test/adminInboxV3.test.tsx — 10 tests.

## Notes
- Success outcomes ticked: Linked/Resolved/Approved plus **Matched** (the unmatched queue's "linked" outcome is worded "Matched" in useInboxFeed).
- jsdom drops var() colours from inline styles, so tone assertions read data-tone attributes and the exported btnBrand/btnOutline styles.
- Pre-existing, not fixed: SupportActions fact line renders a literal "\u00b7" in JSX text (support rows).
- No tests deleted, renamed or rewritten. inboxWorkTheQueue and AdminShell pass unchanged.

## Suite (npx vitest run --maxWorkers=2 --shard=N/4)
2,255 / 2,146 / 2,220 / 2,235 = **8,856** = 8,846 + 10 (adminInboxV3, shard 3). No failures; none of the known intermittent/existing failures appeared.
No screenshots (admin sign-in unavailable).
