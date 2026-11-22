# Course Media viewer addendum

Change: CourseGalleryChrome place facts card removed; place shots use the shared stat row (PLACE · MEMBER SHOTS, plus LATEST on conditions only, short age Today/1d/Nd/Nw/Nm via `placeCells`/`shortPlaceAge` in lib/fullscreen/statRow.ts). Untagged shots now show PAR · YARDS · MEMBERS from the overlay's existing course stat reads (tee sets + floor-gated members' rating), now enabled for the gallery too and passed as `courseFigures`. No new queries or RPCs.

Suite: before 9,804 tests / 867 files (9,803 passed, 1 known failure). After 9,810 / 868 (9,809 passed): shards 2,398 / 2,418 / 2,443 / 2,551. Delta +6 tests, +1 file = new `src/test/courseMediaViewerAddendum.test.tsx` (6 cases). Sole failure unchanged: `overviewRoundParity.test.tsx:82` casing, previously reported.

Existing tests updated (the addendum reverses the "place card unchanged" and "nothing for untagged" rules):
- canonicalGalleryChrome.test.tsx (d): renamed from "...place variant unchanged; nothing for untagged" to "...replaces the hole facts card, the place facts card and the untagged gap". Was `expect(place.querySelector('h2')?.textContent).toBe('The clubhouse')`, `...('p')...toBe('1 shot from members')` and untagged `expect(...'[data-fullscreen-stats]').toBeNull()`; now place card null, stat values `['The clubhouse', '1']`, untagged stat row present.
- courseGallery.test.tsx "place information uses its literal title and member count": was h2 'The views' / p '1 shot from members'; now stat values `['The views','1']`.
- courseGallery.test.tsx "Conditions age comes from latest added shot": was h2 'Course conditions' / p '1 shot from members · Latest Today'; now `['Course conditions','1','Today']`.
- courseGallery.test.tsx "untagged shot has no hole or place info but retains credit": was `[data-fullscreen-stats]` toBeNull; now zero stat cells (no course figures in that fixture).

Captures (placeholder fixture, real CourseGalleryChrome): h/c/k at 390 and 320, swipe1-3 (hole → clubhouse → hole). No horizontal overflow; member line, stat row and pills stay at identical y across the swipe (320: 692 / 736 / 784). metrics.json holds measurements.

Notes: place cell uses the `media.gallery.titles` text ("The clubhouse", "Course conditions"), as the brief directs, though its examples read "Clubhouse"/"Conditions" — ruling welcome. Progress dots are absent on a single-shot place run (existing rule); this does not shift the stack. While course figures load, an untagged shot keeps an empty row of the same height. Fixture checks only; no live data or phone.
