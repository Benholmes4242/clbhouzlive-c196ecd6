# EXPLORE_TOP_2 — canonical chips and Golfers to watch

Mock: explore-top-3.html (signed off). No SQL, migrations, RPC/edge-function, feed_config, round_pool_cap, native/Median, guest browsing, review wizard, news or round-plot changes.

## Files touched
- `src/components/ui/RailChips.tsx` — `'lg'` (solid white) removed; opt-in `'tile'` size: 34 tall, 0 13px, radius 13, 10px/800 uppercase 0.11em, line-height 1, APPLIED_FILL + SELECTED_EDGE selected, A.BORDER/transparent otherwise, counts suppressed. sm/md branches byte-equivalent in output.
- `src/features/explore-magazine/watch/ExploreTopControls.tsx` — `size="tile"`, 15px magnifier.
- `src/features/explore-magazine/watch/explore-top.css` — controls `padding:0 16px; margin-top:-8px` (page clearance is island bottom + CHROME_BREATHING 16, so the row sits 8 below; measured in preview: islands bottom 56, chips top 64). 34×34/13 search button and field (SELECTED_EDGE edge, transparent), 34 Cancel. Face-row styles replaced by card/rail/skeleton styles.
- `src/features/explore-magazine/watch/CreatorsRow.tsx` — Golfers to watch: ShelfHeading (no sub-line), See all only at 21+ others, 132px cards (rail 0 16px, gap 10, scroll-padding 16, snap start), up to 20; no You tile/plus/composer path, no See all end tile; sheet also omits 'you'. Taps and explore_row_viewed / explore_row_tapped / explore_row_see_all unchanged; tap `position` is now the card's own 1-based place (no You ahead of it).
- `src/features/explore-magazine/watch/watchTopRules.ts` — `PEOPLE_CARDS_MAX`, `showsPeopleSeeAll`, `personLines` (tolerates a missing `new_post_ids` as n = 0).
- `src/features/explore-magazine/watch/useExplorePeopleRow.ts` — `videos: number` on the row type.
- `src/features/admin/lib/retiredEvents.ts` — `explore_row_you_tapped` retired.
- `src/index.css` — `--explore-top-quiet` (ink 0.42), `--explore-top-skeleton` (#141417).
- `public/locales/en/courses.json` — `amateur.watch.people.*`.
- `src/test/ws1WatchTop.test.tsx` — rewritten as below.

## Tests — `ws1WatchTop.test.tsx` 39 → 44
Removed/rewritten (authorised: You tile, See all tile, face-row geometry, white lg chips):
- "You is first with a plus and opens the existing composer" (`expect(buttons[0].getAttribute('aria-label')).toBe('You')`, `toHaveBeenCalledWith('explore_row_you_tapped')`) → "no you card is rendered and no plus or composer path exists".
- "only has_new wears a ring and quiet names are muted while You stays ink" (`data-name-ink` 'ink'/'mute') → removed; replaced by tier lines case.
- "all names occupy the same sibling slot without a second line" (`button.children).toHaveLength(2)`) → "names reserve two lines so lines 2 and 3 share a top offset…".
- "has_new opens the permitted posts…" — `position: 2` → `position: 1` (the 2 was only because You sat first).
- "a quiet tile goes to the existing profile…" → renamed "a quiet card…", assertions unchanged.
- "See all appears only at 21 others and the row caps others at 20" (`getAllByRole('button')).toHaveLength(22)`) → "…and has no See all tile" (20 cards, heading See all).
- "hides when only You returns" → "the whole section, heading included, is hidden when only you comes back".
- "the loading skeleton has five avatar and name pairs and no heading" (`.explore-person-ring` ×5) → heading place + three cards.
- "See all opens the same sheet…" → also asserts no You row.
- "RailChips lg leaves default and sm caller selection behaviour unchanged" (`classList.contains('explore-lg-chips')`) → "other RailChips callers are unchanged".
Unchanged: anonymous hide, explore_row_viewed, search/Cancel, restored query.
New: retired-event registry; heading; tier lines incl. "1 video"; personLines pure rules; chips APPLIED_FILL/SELECTED_EDGE/uppercase/no counts; control row 8 below islands.
Net: 14 cases → 19 cases in the two describes = +5.

## Suite
`npx vitest run --maxWorkers=2 --shard=N/4`: 1,501 + 1,475 + 1,530 + 1,458 = **5,964 tests / 545 files**, 0 failures, 0 unhandled errors. Baseline 5,959 (RR1) → +5, all in ws1WatchTop as named above. No pre-existing failures. Build OK; tsgo clean.

## Notes
- Brief §1 uses A.BORDER (0.10) for the hairline; the mock draws 0.08. The brief's token was used.
- Signed-in visual check of Golfers to watch not possible (external auth); chips and the 8pt gap were checked in the guest preview.
