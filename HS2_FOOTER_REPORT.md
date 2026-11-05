# HS2_FOOTER — close-out

Connect and decline now render in the shared FooterBar after the scrolling Stage in both settled states. Loading uses a footer CTA-shaped bar and reserves the decline height, keeping footer geometry stable on settlement. Countries stay in Stage below pills with an 18px margin, centred DIM 12.5px text; Stage ends with the standard 28px spacer. Embedded FooterBar copies EnglandGolfForm's existing setup override exactly.

WhsConnectScreen uses the same flex-column wrapper for intro and declined; Stage already has flex:1/min-height:0/overflow:auto and FooterBar flex-shrink:0. No host change was needed. Shared primaryCtaStyle, DeclineButton behavior, copy, queries, placement and later stages remain unchanged. The explicitly requested analytics adjustment is only `place:'end'` → `place:'footer'`; event name, h and circle_shown stay unchanged.

## Verification and counts
Baseline **7,033 tests / 620 files** → **7,036 / 620**, zero failures, zero flakes or pre-existing failures encountered.

Commands: `bunx vitest run src/test/hs2ConnectSeat.test.tsx src/test/connectIntroTryIt.test.tsx --maxWorkers=2` (**26/26**), then `bunx vitest run --maxWorkers=2 --shard=n/4` for each shard.

| Shard | Passed | Files |
|---|---:|---:|
| 1 | 1,827 | 155 |
| 2 | 1,673 | 155 |
| 3 | 1,774 | 155 |
| 4 | 1,762 | 155 |
| Total | **7,036** | **620** |

Full output retained in `docs/verification/hs2-footer/`. The combined sequential command hit its 600-second execution limit during shard 3, without a test failure; incomplete output is retained as shard3-interrupted.log. Shard 3 was rerun separately to completion, then shard 4 ran separately. Latest preview diagnostic: `build OK`, 2026-11-05T21:08:11Z. No manual build/typecheck run. Browser geometry and authenticated live country-stage transition were not checked in this follow-up; focused tests verify callbacks, payloads, footer ancestry and embedded spacing, not hosted end-to-end behavior.

## Exact test ledger
Only `src/test/hs2ConnectSeat.test.tsx` changed: **12 → 15 cases**. No test deleted. Two parameterized case names changed from `advances and tracks end CTA for circle count %s` to `advances and tracks footer CTA for circle count %s` (counts 27 and 0).

For both cases, old assertion:
`expect(analyticsEvents.track).toHaveBeenCalledWith('connect_intro_cta', { place: 'end', circle_shown: connected > 0, h: 13 });`

New assertion:
`expect(analyticsEvents.track).toHaveBeenCalledWith('connect_intro_cta', { place: 'footer', circle_shown: connected > 0, h: 13 });`

Reason: the brief explicitly moves that action to FooterBar and changes its place field. Existing pick count and all other assertions stay unchanged. No existing assertion checked CTA ancestry, so no position assertion was rewritten.

Three added cases:
- `keeps CTA and decline in FooterBar outside Stage in both settled states` — loops full and empty states, asserts two footer buttons and no Stage buttons.
- `keeps the loading CTA bar in FooterBar outside the scrolling Stage` — asserts loading CTA footer containment and Stage exclusion.
- `reuses setup embedded FooterBar spacing` — asserts the existing setup override.

The test mount helper now accepts an optional layout; existing mounts still default to page. `connectIntroTryIt.test.tsx` is untouched, including its historically named “in-content CTA” case, whose assertions only enforce a single CTA and no fixed positioning.

## Changed files and boundaries
Product: EmptyStateScreen.tsx and connect-seat.css only. Local ownership is recorded in EmptyStateScreen's header; no shared primitive or host change. Documentation: this report, roadmap, HS2 memory/footer supersession. No copy/data/server/native changes; no SQL/migrations/deployed RPC/edge edits, guest browsing, review wizard, news or round plots. feed_config untouched; round_pool_cap remains 30.