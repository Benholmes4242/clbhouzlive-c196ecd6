# Guest Follow + follow-up verification

## Guest Follow
ImmersiveFullscreenChrome: " · Follow" calls `useGuestActionGate()('follow', { firstName })` before the follow handler; a guest tap opens the action join card (trigger 'action', existing copy/analytics) and never calls onFollow. Signed-in path unchanged. Hook sits with the other hooks above the early returns.
New test: fullscreenViewerFollow.test.tsx "a guest tap opens the join card with the action trigger and does not follow".

## Suite
Before 9,834 / 870. After 9,835 / 870 (2,401 / 2,437 / 2,446 / 2,551), all passing. +1 = the guest case above. No existing test changed.

## Captures (disposable harness on a second Vite server with stubbed backend; files kept as .txt in follow-up-rulings/harness/; placeholder images, generated test-pattern video)
follow-up-rulings/captures/, metrics.json:
- Feed hole card: duration visible closed, hidden open, visible again after collapse (390 and 320). Video genuinely plays (HLS).
- Place chip: left 12, top 12, height 28 on a three-photo post; no overflow.
- Teaser: "Danny Holmes" weight 700; tap does not open the About sheet.
- Initials 22/32/46: "before" reproduced by CSS override of the removed declarations (not the old build). Range-box centre offsets before 0/-0.5/0, after -0.4/-0.2/-0.4 px — text boxes, not glyph ink, so not conclusive; judge by image.
- Media run photo→video→photo→video→photo (pager scrolled): stack rows 596/612/662/706 (390) and 600/616/666/710 (320) on every slide; stack bottom 744, buttons 784.
- At 390 the video played on the second visit; scrubber node 748–780 (12px bar centred) → 14px stack→bar, 14px bar→buttons. The screenshot does not visibly show the moving frame or bar; at 320 the fullscreen engine never started playback (harness can't drive the open lifecycle). Filled-scrubber capture therefore not conclusive.
- Media clubhouse: ["Clubhouse","1"]; conditions: ["Conditions","1","Today"].
