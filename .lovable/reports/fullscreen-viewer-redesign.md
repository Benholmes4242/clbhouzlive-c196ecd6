# FULLSCREEN_VIEWER_REDESIGN

## Built
ImmersiveFullscreenChrome (real posts) rebuilt to the signed-off mock: glass 40px back circle in a 44px hit area; course name 17/700 two-line clamp, location 12.5/500 with World #n; record row unchanged; rating chip removed from posts (kept only in the member-shot viewer, and its aggregate read now runs only there); FullscreenTopProgress and its top padding shift removed; solid band replaced by a 62vh pointer-events-none shade (`data-fullscreen-shade`, same z-order); bottom stack at 16px gutters with dots (2+ items), 38px author row, round pill, review scores in a glass strip, two-line caption (tap expands non-review; reviews print "Full review ›" on its own line), likers row, video row (mute + scrubber with persistent time) and a glass pill row (like, comment, share, more) in the old comment bar slot. Right rail and comment bar removed. No text fields.
FullscreenVideoScrubber: opt-in `left`, `right`, `showTime` (defaults keep other callers identical; showTime also draws the 3px track and 11px knob).
Unchanged: fullscreenBand constants, resolveRestingRect, playback, transitions, member-shot viewer (its corner mute kept at its old position since the rail that held it is gone), VideoAboutSheet.

## Tests
- Changed (authorised, solid band): `memberShotCredit.test.tsx` "real-post opens retain their footer…": `expect(view.container.querySelector('[data-fullscreen-band]')).not.toBeNull();` → `[data-fullscreen-shade]`. Why: the band is replaced by the shade.
- `memberShotPosts.test.ts` likers-gate source contract failed mid-work; fixed in the component (kept the `!syntheticPosts` guard on the likers wrapper), test untouched.
- Added `fullscreenViewerRedesign.test.tsx`, 10 cases covering (a)–(i).
- Deleted: none.

## Totals
Brief baseline says 9,077; the last reported full run (feed course band) was 9,079. After: **9,089/9,089** (2,224 / 2,254 / 2,276 / 2,335), = 9,079 + 10 added. No failures in any shard. Typecheck clean.

## Not checked
Browser check at 390/320: the real-post viewer could not be opened signed out (feed is gated; Latest reviews showed no tiles in the preview), so overflow, two-line name, score strip fit and one-row pills are unverified in a browser. Ben's iPhone check needed.
