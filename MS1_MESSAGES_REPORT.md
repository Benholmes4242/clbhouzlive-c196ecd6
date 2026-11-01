# MS1 — Messages: head to head, inbox lines, and two fixes — Report

Mock: `ms1-head-to-head.html` (signed off). Front end only. No SQL, no migrations, `feed_config` untouched, `round_pool_cap` unchanged, no native/Median changes.

## The diff

1. **Record helper** — `src/hooks/messaging/useSharedGround.ts`: `headToHead(rounds)` dedupes first, then tallies points (stableford) and gross W/L/H (T → H) plus `lastFive` newest-first from stableford. Exposed on `SharedGround` as `record` (null when no rounds). The server `count` stays the displayed figure; the record is computed from the deduped rounds, so they may not add up until MS2 — as the brief accepts.
2. **Thread header** — `ThreadV2Page.tsx`: name now 17px/600; subline 12.5px mute reads "{count} rounds together · last {d MMM}" (count-only when no date; existing secondary line when no shared rounds).
3. **Head-to-head card** — new `src/pages/messaging-v2/HeadToHeadCard.tsx`, rendered above the shared round cards only when shared rounds exist. Mock-exact: #17171B, 1px rgba(255,255,255,0.08), radius 18, padding 14 16; "Head to head · points" 9.5/800 caps dim, record 26/700 -0.03em tabular with dim dash; Gross 20/700 right-aligned; sentence 13.5 mute with ", {h} halved" in 600 ink when h > 0; "Your last five together:" / "last {k}" under five; 22×22 form tiles (W ink fill / L,H outlined), "newest first" 11.5 dim. **Tappable**: the thread already has a route to the compare sheet (`ConversationSettingsSheet` → `compareRouteFor`), so the card navigates there.
4. **Shared round cards** — `SharedGroundStrip.tsx` restyled to the mock: 150px wide, #17171B, radius 14, padding 10 12; course via `shortCourseName` (13/600, one line); scores 18/700 tabular with "You" / first name 10.5/600 dim beneath; lower gross ink, higher rgba(248,250,252,0.42), tie leaves both ink; "{d MMM} · you won / {name} won / halved" from gross_outcome. **The amber on the member's score is removed.** The redundant "Played with {name} · {count}" eyebrow is gone — the header subline now carries it (mock shows none).
5. **Inbox row** — `ConversationRow.tsx`: name + ONE time on the first line (unchanged), preview, then the new third line via `inboxRecordLine()`: "{count} rounds together · you lead {w}–{l}" / "{name} leads {l}–{w}" / "all square {w}–{l}" with the record in ink/600; count alone while the record is outside the batch detail limit; today's context line kept when there are no shared rounds. The old "Course · 3d" second date is gone from shared-round threads.
6. **Rail** — `MemberRailTile.tsx` gains `subLabel`; `InboxV2Page.tsx` drops the time pill above the avatar and shows "{d MMM}" (formatDayMonthShortGB) under the first name, 11px dim. `PlayingOffRail`'s handicap bubble is untouched (it is not a time pill).
7. **Incoming avatar fix** — `MessageBubble.tsx`: incoming rows now have 16px left padding and a 28×28 avatar slot (avatar on the last bubble of a run, slot reserved otherwise, so one sender's bubbles stay aligned — group threads included). NOTE: the current code rendered NO avatar beside incoming bubbles, so the "clipped sliver" could not reproduce in this build; the fix implements the mock's end state directly. The report-flag button moved from `left: -28` (clipped off-screen) into the 16px zone. Incoming timestamps align under the bubble at 36px.
8. **"Image unavailable" investigation** — see below.
9. **No amber** — verified: no amber token remains in HeadToHeadCard or SharedGroundStrip; sent bubbles stay white (untouched).

## §8 image finding

Code-level evidence (no SQL run — Ben runs every statement by hand):

- Upload (`uploadMessageMedia.ts`) and signing (`useSignedUrl.ts`) use the SAME bucket (`message-media`) and the SAME path (`{conversationId}/{uuid}.{ext}`), so a wrong-bucket/path mismatch is not possible in current code.
- The signed-URL cache refreshes on expiry (1h TTL, 60s buffer), so expiry is self-healing on remount.
- The two remaining causes that render "Image unavailable" (`MessageImage` sets `isError` on sign error OR `<img>` `onError`):
  1. **HEIC upload**: `compressImage` failure falls back to the ORIGINAL file; an iPhone HEIC then uploads as `image/heic` with a `.bin` extension (`extFromMime` has no HEIC case). No browser `<img>` decodes HEIC → `onError` → "Image unavailable" even though the file exists in storage. This is the most likely cause for a photo sent from an iPhone.
  2. **Object missing from storage** (failed upload that still sent): signing a missing object yields a URL that 404s → `onError` → same message.
- Neither is fixed here: (1) needs a decision (transcode HEIC client-side or accept-and-convert server-side — a server change is out of scope), and (2) is a data fault. To pin down which, Ben can run: `select id, attachments from msg_messages where conversation_id = '<thread>' and type = 'image' order by created_at desc limit 5;` and check the path's extension — `.bin` = the HEIC case.

## Tests

New file `src/test/ms1MessagesHeadToHead.test.tsx` — 28 tests: headToHead (dedupe-first, tallies, T→H, lastFive order/cap, null), card sentences (lead/trail/all square, ±halved, last-{k}), form tiles, tappable card, round cards (short name, winner ink/loser dim, tie both ink, outcome lines, no amber, empty), inboxRecordLine (lead/trail/square/count-only), ConversationRow (record line, count-only fallback, no-rounds line, single time), MemberRailTile (date under name, no pill), thread header (17px name, "· last 29 Oct"), MessageBubble (16px padding, 28px slot, mid-run reservation, outgoing none).

**Changed existing tests: none.** Existing messaging-adjacent suites pass untouched: `inboxRailAvatarRing`, `canvasSurfaceToken`, `memberRadarMessaging`, `inboxWorkTheQueue` (29/29).

## Suite

- Focused: 28/28 new; 29/29 existing messaging-adjacent.
- Full suite (sharded): **5,541/5,541 across 523 files** — +28/+1 vs the 5,513/522 baseline, solely the new test file. No pre-existing failures.
- `npx tsgo --noEmit`: clean.

Signed-in live verification unavailable (external auth); the two fixes are unit-tested. Worth a look on your phone: the thread header, the head-to-head card, and an incoming bubble's avatar.
