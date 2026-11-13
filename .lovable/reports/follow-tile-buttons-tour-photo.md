# Follow tile buttons + Tour slot photo height — build report

Date: 2026-11-13. Baseline before this brief: 8,554. After: 8,556 (+2 new tests).

## Changes

1. **Follow/dismiss button specificity** (`src/features/find-people/WhoToFollowRail.tsx`, `follow-tiles.css`)
   - Both `<Button>`s now pass `variant={null} size={null}` (dismiss previously `variant="ghost"`), so no `h-11`/`h-10`/`rounded-[10px]`/`bg-transparent` classes are added.
   - Every in-tile rule in follow-tiles.css raised to two-class specificity (`.follow-tile .follow-tile-*`, including `:hover` rules). All values unchanged: Follow 34px/999px/#F8FAFC on #0A0A0C 13.5/800; dismiss 26px circle, rgba(10,10,12,.45), 8px blur, 14px X at stroke 2.6. Followed-state treatment unchanged.

2. **Tour slot photo height** (`src/features/clubhouse-tour/TourSlot.tsx`)
   - `const TOUR_SLOT_PHOTO_HEIGHT = HERO_PHOTO_HEIGHT - 10;` (340) with the comment "The slot photo sits 10px under the shared hero height so the card reads between the top islands and the floating nav." Overlay stays bottom-anchored; no other style changes.

## New tests (2)

- `src/test/followTilesB.test.tsx` — "Follow and dismiss carry no Button variant or size classes": asserts neither button carries `h-11`, `h-10`, `rounded-[10px]` or `bg-transparent`, and both carry their follow-tile class.
- `src/test/tourSlot.test.tsx` — "renders the photo ten pixels under the shared hero height": asserts `[data-tour-slot-photo]` style height is `340px`.

## Changed tests (1, authorised)

- `src/test/proVerification2B.test.tsx` — "Brief 2B mounted member names > rail: name element is unchanged".
  Old line (quoted): `expect(el.getAttribute('style')).toBe('overflow: hidden; text-overflow: ellipsis;');`
  For the `rail` surface only (branched on the surface name; other surfaces in the loop keep the original assertion) it now asserts:
  - `expect(el.parentElement?.classList.contains('follow-tile-name')).toBe(true);`
  - `expect(el.parentElement?.firstElementChild).toBe(el);`
  tagName, children-length and pro-label-sibling assertions unchanged.
  Why: the signed-off Option B tile moved the name's ellipsis to the stylesheet rule `.follow-tile .follow-tile-name > span:first-child`, so the span has no style attribute. The tile is correct; the assertion was stale.

## Prior authorised fixes in this build (already reported)

- `src/test/kindRails.test.tsx` — "follow goes through useToggleFollow": `card.querySelector('button:last-of-type')` → `within(card).getByRole('button', { name: /follow/i })` (the dismiss button matched `:last-of-type` first in the new tile).
- `src/test/proVerification2B.test.tsx` — mock of `@/features/find-people/useSuggestionCovers` gained `useSuggestionCoversQuery: () => ({ covers: new Map(), settled: true })` alongside the existing `useSuggestionCovers`.

## Shard runs (each its own command, `--maxWorkers=2`)

- Shard 1/4: 2,168 passed (188 files)
- Shard 2/4: 2,020 passed (188 files)
- Shard 3/4: 2,183 passed (188 files)
- Shard 4/4: 2,185 passed (186 files)
- Total: 8,556 passed, 0 failed. Baseline 8,534 → +20 (Option B followTilesB) + 2 (this brief) = 8,556. Reconciled.

## git diff --stat (this brief's commit 1b7c2f58d1)

```
 src/features/clubhouse-tour/TourSlot.tsx     |  4 +++-
 src/features/find-people/WhoToFollowRail.tsx |  4 ++--
 src/features/find-people/follow-tiles.css    | 34 ++++++++++++++--------------
 src/test/followTilesB.test.tsx               | 11 +++++++++
 src/test/tourSlot.test.tsx                   |  1 +
 5 files changed, 34 insertions(+), 20 deletions(-)
```

Plus the authorised test-side fix commit: `src/test/proVerification2B.test.tsx` (+6/-1).

No SQL, no migrations, no RPC or edge-function changes. Device render at 390/320 not verified here.
