# Profile index and form — stopped

## Exact failure
Command: `npx vitest run src/test/profileCoverFallback.test.tsx src/test/heroConnectExample.test.tsx src/test/heroConnectPanel.test.tsx src/test/linkedHandicapProfile.test.tsx src/test/fixProfileCompare1.test.tsx src/test/hh3HeadToHead.test.tsx src/test/topTenOwnerLabelRender.test.tsx src/test/topTenTileWidth.test.tsx --maxWorkers=2`

**src/test/heroConnectExample.test.tsx:188**, `CE1 fixed connected example > supplies both movements and five approved round figures`:
`expect(Array.from(tiles ?? []).map((tile) => tile.firstElementChild?.textContent)).toEqual(['86', '91', '84', '88', '90']);`

Runner: `AssertionError: expected [ '90+1.2', '88+0.8', '84−0.2', …(2) ] to deeply equal [ '86', '91', '84', '88', '90' ]`.
Received: `['90+1.2', '88+0.8', '84−0.2', '91+5.4', '86+3.5']`.

This assertion encodes the old oldest-first tile layout. The brief authorises form-tile assertion updates, but the unexpected failure was not edited or rerun: work stopped per the absolute rule.

## Status and counts
Last full-suite baseline **8,954**. Full suite after this work **not run**; no new total claimed. Focused **88 executed: 87 passed, 1 failed; 7 files passed, 1 failed**. Existing case count unchanged; no new tests yet. Browser width checks and signed-in checks not performed.
Latest preview **build OK 2026-11-16T09:26:24Z**; intermediate missing imports/types resolved before focused checks.

## Implemented, not closed out
- Flat semantic gradient FallbackCover replaces ContourCover in member/business consumers, with existing fades and overlays preserved.
- Dated profile index geometry and interpolated form dots; newest-first 104px round rail with existing tap contract. Shared example now carries spaced dates.
- Member CounterCell and rendered counters removed; counter props temporarily optional for existing callers. Page no longer passes them and ratedCountState removed.
- Page rounds/review reads retained because TopTenShare identity still consumes them; ProfileHero rounds read remains for form and other facts. Distinct coursesCount removed.
- Top Ten reaction hook, comment head count, blocked/hidden count cache reads and strip removed; original comment deep-link effect/sheet retained.
- Touched sections inherit app fonts following the user's choice.
- Local indexLine header records geometry ownership; no completed architecture closeout yet.

## Authorised test changes already made
- profileCoverFallback.test.tsx imports/selectors changed from ContourCover/data-contour-cover to FallbackCover/data-fallback-cover across existing cover-chain/band/business cases; conditional assertions preserved. Existing names mentioning contours remain pending cleanup.
- Same file `draws 14 closed polylines, 1px strokes, no fill, deterministic for everyone` replaced one-for-one by `draws no SVG or patterned artwork`. Prior assertions included `expect(ringsA).toHaveLength(14)`, SVG viewBox/slice, closed/finite points, fill `none`, stroke width `1`, alternating strokes, and equal ring points on repeat render. These enforce artwork explicitly removed by item 1; replacement asserts absent svg/polyline.
- Same file `sits on the fairway green gradient as an inset-0 layer`: prior `expect(CONTOUR_COVER_GRADIENT).toBe('linear-gradient(165deg, #33503b 0%, #1f2e25 50%, #0A0A0C 100%)')`; now asserts semantic constant plus exact new global gradient. Position/inset checks retained.
- linkedHandicapProfile.test.tsx `preserves the remaining counter actions below the notice` replaced one-for-one by `omits the retired counter actions below the notice`. Prior `expect(notice?.nextElementSibling?.querySelectorAll('button')).toHaveLength(2)` and `expect(f.stat.mock.calls.map(c => c[0])).toEqual(['rounds', 'rated'])`; now no sibling/no counter callback. Item 5 retires these controls.
- fixProfileCompare1.test.tsx `HeroHandicapDisplay form tile calls onOpenRound with the score id and never navigates`, and hh3HeadToHead.test.tsx `sits under the index chart and above Form · last five`: numeric series fixtures changed to dated points for the new required series type; all assertions unchanged.
- No tests deleted; two case names replaced one-for-one above. heroConnectExample failing case unchanged.

## Remaining
Resolve the reported old form assertion, then add required geometry/rail/deep-link tests, finish props/comment cleanup and architecture notes, verify all widths, run four full shards and reconcile totals.
No SQL, migration, feed_config or round_pool_cap changes.