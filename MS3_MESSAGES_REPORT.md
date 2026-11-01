# MS3 — Messages: share a round, share a course

Brief: `MS3 — Messages share a round share a pasted.md`; mock `ms3-share.html` (signed off). No SQL, no migrations, no RPC/edge edits, `feed_config` untouched, `round_pool_cap` stays 30, no native/Median changes. Sends go through the existing `msg_send` only.

## Diff

### §1 + sheet — `src/pages/messaging-v2/Composer.tsx`, `src/pages/messaging-v2/ShareSheets.tsx` (new)
- The + button now opens `ShareActionSheet` (BizcSheet, no header): three rows, each a 40px `#1E1E23` tile (radius 12, lucide icon 18 ink — Image / Flag / MapPin), title 15px/600, line 13px mute: "Photo or video" / "From your library or camera" (runs the existing picker), "Share a round" / "Any of your rounds, as a scorecard", "Share a course" / "Its page, with how it plays".
- "Share a round" hides when `useWhsConnection` returns no connection or `useAllScores` returns no rounds.
- `ShareSheets.tsx` imports `business-create.css` itself (the BizcSheet styles were not global).

### §2 Round picker — `ShareRoundSheet`
- BizcSheet "Share a round", sub "Your rounds, newest first." Rounds from the existing `useAllScores` for the member's connection, newest first, 30 at a time with a Load more row.
- Row: 48px `#1E1E23` tile (radius 12) with gross 17px/700 and to-par 10.5px mute (`toParParts(…, 0)` — E for 0), then `shortCourseName` 15px/600 and "{d MMM}" 12.5px mute (year added when not this year).
- Tap sends `msg_send` via the existing `useSendMessage.send`: `p_type 'round_share'`, `p_metadata { whs_score_id }`, `p_body "{gross} at {shortCourseName}"`, then closes.

### §3 Course picker — `ShareCourseSheet`
- BizcSheet "Share a course" with the existing `useCourseSearch`, a 44px field and a white caret. Tap sends `p_type 'course_share'`, `p_metadata { course_id }`, `p_body` the course name.

### §4 Round card — `src/hooks/messaging/useRoundShareCards.ts` (new), `ThreadV2Page.tsx`, `MessageBubble.tsx`, `src/pages/messaging-v2/ShareCards.tsx` (new)
- `useRoundShareCards(messages)`: one `get_round_share_cards` call per loaded page, keyed on the sorted message ids; optimistic client ids are never sent.
- Card 250 wide, `#17171B`, 1px `rgba(255,255,255,0.12)`, radius 18 with the tail corner 6 on the sender's side, padding 12 14: label "Round" 9.5px/800 0.12em uppercase dim; `shortCourseName` 15px/600 4px below; gross 26px/700 -0.03em with "{to_par} · {d MMM}" 13px mute beside it, 6px below; hole strip 8px below in AC1's colours (`activityHoleColor`).
- Geometry note: the strip segments follow the signed-off mock (11×4px, gap 2); AC1's own strip CSS is 9px wide and stays untouched — the colours are what is shared.
- Tap opens `RoundDetailSheet` for that `whs_score_id` with the sender as profile owner.
- No card data (read failed, round deleted, not the sender's): the body renders in a normal bubble.

### §5 Course card — `src/hooks/messaging/useCourseShareCard.ts` (new), `CourseShareCardView`
- Course data from a by-id read of `golf_courses` (`id, name, region, thumbnail_image`) plus the shared `useCourseListRanks` authority for the published rank (first active placement, global first).
- Card 250 wide, same border/radius, photo 96px high (existing thumbnail, else `#1E1E23`), then padding 10 14 12: `shortCourseName` 15px/600, line 12.5px mute "{region}" plus " · Top 100 #{rank}" when ranked. Tap → `/courses/{course_id}`. Missing course: plain bubble with the body.

### §6 Inbox preview
- No client change needed: `msg_send` writes the body as `last_message_preview`, and `resolvePreview` passes non-label bodies through verbatim with no prefix for received messages. "80 at Sundridge Park · East" / "Rye · Old" appear as sent.

### Types
- `src/types/messaging.ts`: `MessageType` gains `'round_share'` (`'course_share'` was already declared).

## Tests
- New: `src/test/ms3MessagesShare.test.tsx` — 14 tests: + sheet rows; Share a round hidden with no connection / no rounds; round picker order, row content (E for 0, shortCourseName, date) and the exact send shape; course picker send shape; one `get_round_share_cards` call per page keyed on sorted ids; round card content/strip/tap-opens-scorecard; round fallback bubble; course card with and without Top 100 rank, tap navigation, fallback bubble.
- Changed existing tests: ONE, as approved — `src/test/ms1MessagesHeadToHead.test.tsx:400`: `container.querySelector('button')!.firstElementChild!.style` → `(container.querySelector('button')!.firstElementChild as HTMLElement).style`. No assertion changes.
- MS1 (28), MS2 (14) and all other messaging tests stay green.

## Suite
- Baseline: 5,555 passed / 524 files (MS2).
- After: **5,569 passed / 525 files, 0 failed, 0 skipped** (sharded 4 ways: 638 + 1,980 + 1,552 + 1,399).
- Delta: +14 tests / +1 file, reconciled entirely to `ms3MessagesShare.test.tsx`.
- Pre-existing failures: none. The pre-existing MS1 typecheck error (line 400) is fixed under the brief's approval — `npx tsc --noEmit -p tsconfig.app.json` is now fully clean.

## Unverified
- Signed-in device run of the full flow (pick → send → card → scorecard/course) against the live `get_round_share_cards` RPC; no authenticated session available from the sandbox.
