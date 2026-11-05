# FW1 — stopped verification

## Result
Implemented the Featured slot, session-stable eight-row read, stacked deck, deliberate likes, comments/share, delayed fullscreen taps, end card, canonical top-card playback, reduced-motion crossfade and analytics. Ben ruled that normal advance occurs at **260ms during the 320ms exit**, matching the mock.

**Not complete:** stopped on 12 existing-test failures and one surviving new-test type error. No four-shard run or browser verification was performed. No existing tests were edited. No pre-existing failures are established; these failures appeared during FW1 verification.

## Commands and counts
- Prior reported baseline: **6,760 tests / 595 files**, from FIX_RO_NOISE_1_REPORT.md; those historical shards preceded its test-only type fix.
- `bunx vitest run src/test/fw1FeaturedDeck.test.tsx --maxWorkers=2`: **20/20 passed**.
- `bunx vitest run src/test/fw1FeaturedDeck.test.tsx src/test/fw1FeaturedRead.test.tsx src/test/ws1WatchTop.test.tsx src/test/videoPosterAutoplay.test.tsx --maxWorkers=2`: **69 passed, 12 failed / 81 executed**, 3 files passed, 1 failed. No unhandled errors were reported in the summary.
- New cases: **26 in two new files**, so expected full inventory is **6,786 / 597** (+26 / +2), not an executed full-suite result.
- Shards 1–4: **not run**, stopped at the focused failure.
- Full failing output retained: `docs/verification/fw1/focused-integration.log`; first focused output: `docs/verification/fw1/focused.log`.

## Surviving build error
Latest entry: **2026-11-05T06:45:50Z**, not clean:
```text
--- typecheck ---
src/test/fw1FeaturedRead.test.tsx(14,660): error TS2339: Property 'staleTime' does not exist on type 'QueryOptions<unknown, Error, unknown, QueryKey, never>'.
```
The preceding 2026-11-05T06:45:07Z entry was `build OK`, before the read-test addition. The completed-edit stop rule prevents claiming that earlier result as current.

## Existing-test failures (untouched)
All are in `src/test/ws1WatchTop.test.tsx`. Its fixture mocks useWatchLead but not the new featured read; the initial Featured loading skeleton replaces the mocked lead until that read settles. Changing this fixture needs authorization; no assertion was altered.

| Case | Line | Tool's error |
|---|---:|---|
| is hidden when the read returns no row | 523 | `AssertionError: expected <div …(3)></div> to be null` |
| shows a 440px skeleton while loading and collapses when it resolves to nothing | 544 | `AssertionError: expected <div …(3)></div> to be null` |
| renders the upright shape with kicker, duration, caption and meta over the media | 558 | `AssertionError: expected null to be truthy` |
| renders the landscape shape with the words underneath and the duration on the media | 570 | `AssertionError: expected null to be truthy` |
| the kicker reads Most liked this month when the reason is most_liked | 578 | `TestingLibraryElementError: Unable to find an element with the text: Most liked this month.` |
| an empty caption falls back to the course name, then to no caption line | 584 | `AssertionError: expected undefined to be 'Royal St George\'s Golf Club' // Object.is equality` |
| the media tap opens the post in the existing fullscreen viewer | 594 | `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Simple shallowing drill, three reps a day"` |
| the who row opens the creator and the course chip opens the course | 606 | `TestingLibraryElementError: Unable to find an element with the text: Jay Kelly.` |
| the mute button toggles sound for this card only | 615 | `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Unmute"` |
| plays through the page’s shared one-stream coordinator | 624 | `AssertionError: expected "spy" to be called 1 times, but got 0 times` |
| watch_lead_viewed fires once per session with reason and shape | 631 | `AssertionError: expected "spy" to be called with arguments: [ 'watch_lead_viewed', …(1) ]` |
| neither block renders on the Shorts or Long form chips | 645 | `AssertionError: expected null to be truthy` |

The complete error messages, DOM dumps and diffs are in the retained log.

## New test inventory
`src/test/fw1FeaturedDeck.test.tsx` — 20:
- renders the deck for 3 / 8 rows (2)
- preserves the lead for 0 / 1 / 2 rows (3)
- preserves the lead on read error
- holds the existing skeleton during loading
- advances either direction (-120 / 120) at 260ms during 320ms exit without liking (2)
- keeps a drag at the 90px threshold on the same card
- completes, hides actions, goes back on right swipe, and restarts
- end-card Shorts action selects Shorts in place
- likes the current post through handleLike
- double-tap likes once and cancels fullscreen opening
- double-tap never removes an existing like
- single tap opens the full deck at the current index only after 320ms
- comments and share use the current post
- registers only the top playback card and replaces it on advance
- reduced motion crossfades for 150ms without rotation
- hides dots when the 340px media query matches

`src/test/fw1FeaturedRead.test.tsx` — 6:
- asks for eight and holds order across remounts in the same session
- does not grant guests a new read
- throws the read error instead of inventing an empty success
- patches likes and comments without changing session order
- starts a fresh featured read in a new app session
- keeps the signed-off deck geometry and material source values

Existing tests rewritten, renamed or deleted: **none**. The brief explicitly requires source assertions for values jsdom cannot read; those are isolated in the last new case.

## Files touched
- `src/features/explore-magazine/watch/useWatchFeatured.ts` (new)
- `src/features/explore-magazine/watch/featuredRules.ts` (new)
- `src/features/explore-magazine/watch/featured.css` (new)
- `src/features/explore-magazine/watch/WatchFeaturedDeck.tsx` (new)
- `src/features/explore-magazine/watch/WatchFeed.tsx` (only lead-slot import/mount)
- `src/index.css` (Featured semantic material tokens)
- `src/lib/feedQueryKeys.ts` (Featured engagement-cache registration)
- `src/test/fw1FeaturedDeck.test.tsx` (new)
- `src/test/fw1FeaturedRead.test.tsx` (new)
- `AGENTS.md` (cross-area ownership pointer)
- `roadmap.md`
- `FW1_REPORT.md` (new)
- `docs/verification/fw1/focused.log` (new)
- `docs/verification/fw1/focused-integration.log` (new)
- Project memory: Featured behavior/timing and index pointer.

## Scope and limits
No SQL, migration, migration file, deployed RPC/edge-function edit, feed_config, round_pool_cap, native/Median configuration, guest-browsing implementation, review wizard, News or round-plot change. The existing `get_watch_featured` contract was already in generated types. Featured's response lacks an actor-specific liked flag, so its current-card action resolves that through the existing `viewer_liked_post` RPC before permitting a toggle; failures do not assume an unliked state. Engagement uses the shared cache patch registry, preserving order.

Authenticated end-to-end checks are unavailable (`external_unmanaged`), and no browser check was attempted after the stop. The exiting top card is currently removed at handover; its remaining 60ms animation continuity has not been visually verified. No sign-off claimed.