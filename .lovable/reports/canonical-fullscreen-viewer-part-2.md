# CANONICAL_FULLSCREEN_VIEWER part 2 — course Media gallery

## Built
- `CourseGalleryChrome.tsx` / `course-gallery.css` rebuilt to the signed-off mock: glass back circle (44px hit), two-line course name, top shade, edge-bleeding glass chips (white selected), glass jump strip, canonical bottom shade and stack (dots, facts strip, author row 38px), video row, Tag / Share / Grid pill row. Grid mode keeps top bar/chips/jump, measured top, #0A0A0C, rounded square blocks and pinned Share + white grid pill. No amber, no rating chip.
- Behaviour unchanged: changeFilter, replaceGallery, jump, run/position, grid measurement, tagger, galleryAction, analytics events, useFullscreenMuteControl.
- New `fullscreenCanon.tsx`: FS_GLASS, shade, gutters, BackCircle and `FullscreenVideoRow` (mute + inset scrubber with time) moved out of `ImmersiveFullscreenChrome.tsx` so both chromes use the SAME video row component (the brief requires this; part 1 had it inline). Immersive output is unchanged.

## Notes / flags
- Location: neither `CourseGalleryOptions` nor `GalleryData` carries a location, so the viewer line reads "{total} shots from members" with no location or separator.
- Grid Share link: `/courses/:id?tab=media&filter=<filter>`. The Media tab does not currently read a `filter` param, so it lands on the tab's default filter.
- Mock grid count reads "28 hole shots"; brief says keep the existing gridCount copy ("N shots · Holes"). Treated the mock text as illustrative (its notes say figures are illustrative); kept the brief's copy.
- Retag label becomes "Fix tag" (brief §4, mock).

## Tests
Before 9,101 → after 9,107 (2,226 / 2,258 / 2,282 / 2,341), four shards sequential, no failures. Typecheck clean.

Rewritten (authorised, replaced layout):
- galleryControls: "the top row renders close, heading, Share and grid in that order" (asserted `children[0]` is Close, `[2]` Share, `[3]` Grid view) → "the top row renders the back circle then the heading, with no Share or grid circle". Share/grid circles left the top bar.
- galleryControls: "grid view hides Share and keeps close and grid" (`expect(screen.queryByRole('button',{name:'Share'})).toBeNull()`) → "grid view keeps back, Share and the grid pill". Share now shows in grid.
- galleryControls: "a video shot renders Tag then mute in the bottom row" (`actions[1]` is Unmute in `.course-gallery-actions`) → mute lives in the canonical `[data-fullscreen-video-row]`; Tag first in `[data-gallery-pills]`.
- galleryControls: "a photo shot renders Tag with no mute and no blank slot" (`actions.children).toHaveLength(1)`) → pill row has 3 children (Tag, Share, Grid); still no mute.
- galleryControls: "the credit avatar is the 32px squircle…" (`toBe('32px')`) → 38px, canonical author row.
- courseGallery: "removing a filtered tag keeps the shot by changing to All" — button name `'Retag'` → `'Fix tag'`; assertions unchanged.
- courseGallery: "the panel holds close, title, grid and chips…" (`['Close','Grid view','All 5','Holes 2']`) → "the panel holds back, title and chips…" with `['Back','All 5','Holes 2']`; X became back and grid moved to the pills.
- courseGallery: "renders JUMP TO A HOLE and THE 4TH · SHOT 1 OF 2" (`toBe('THE 4TH · SHOT 1 OF 2')`) → "…4TH · 1 OF 2" (brief §3 position format).

Added `canonicalGalleryChrome.test.tsx` (6): (a) back circle/no top circles, (b) Tag pill states, (c) grid pill + grid Share link without shot id, (d) facts strip hole/place/untagged with white values and no hr, (e) canonical video row and single mute, no-amber source check. (f) covered by existing tests passing untouched.

Deleted: none.

## Not checked
Browser at 390/320: could not open a course gallery in the signed-out preview (courses list exposes no direct links to drive), so overflow, par-line wrap and the three-pill fit are unverified in a real browser. CSS: pills are flex 1/1/44px with nowrap labels at 14px; par line wraps (`overflow-wrap:anywhere`, no ellipsis).
