# Pro sponsor sheet export fixes — closed out

## Final close-out (CSS test file read + PRO badge export fix)
The two stopped CSS tests failed only because `import sponsorCss from '...pro-profile.css?raw'` resolved to an empty string under this vitest setup (length 0 against 27,743 bytes on disk), so every regex lookup returned undefined. Per the follow-up brief:

1. Test-only: the raw import was replaced with `readFileSync('src/features/pro-profile/pro-profile.css', 'utf8')` (the pattern used by `alsoWeekSpacing.test.ts` and `fw1FeaturedRead.test.tsx`).
2. PRO badge in the export: html2canvas 1.4.1 draws an inline label below its pill, so the label was taken out of the name's text line. The sheet name row is now `<div class="pro-ss-nm"><span class="pro-ss-nm-text">{name}</span><ProLabel size="small" /></div>`; `.pro-ss-nm` is a centred flex row (gap 8px, wraps), `.pro-ss-nm-text` wraps anywhere, and `.pro-ss-nm .pro-label[data-size]` is `display:block; height:18px; line-height:18px; padding:0 7px; text-align:center; margin:0` with no vertical-align, inline-flex or top offset. Shared ProLabel and every other use are unchanged.

Changed assertion, old → new (the only existing assertion touched):
- Old: matched `/\.pro-ss-nm \.pro-label\s*\{([^}]+)\}/`, expected `display:inline-block` and `vertical-align:middle`, and forbade `top:|inline-flex`.
- New: matches `/\.pro-ss-nm \.pro-label\[data-size\]\s*\{([^}]+)\}/`, expects `display:block`, `height:18px`, `line-height:18px`, `padding:0 7px`, `text-align:center`, `margin:0`, and forbids `top:|inline-flex|vertical-align`. Test title updated from "inline-block centring" to "block centring".

## Implemented scope (original brief)
- Sponsor event names use canvas measurement in the inherited app font, 400 / 10.5px, with a JavaScript ellipsis. Result spans no longer use hidden overflow or CSS ellipsis; row line-height remains 1.3.
- Sheet-only PRO label now uses block centring inside a flex name row (see close-out above); shared ProLabel remains unchanged.
- Rank row uses an auto/1fr grid, 12px gap, bottom alignment and figure line-height 1.
- Sponsor Career filters the derived first world-ranking event before taking four, and removes the derived career-high after clause. Canonical profile Career is unchanged.
- No SQL, migrations, server deployment, feed_config, cap, native or Median changes.

## Files
Added: `src/features/pro-profile/proSponsorRules.ts`, this report.
Changed: `src/features/pro-profile/ProSponsorSheet.tsx`, `src/features/pro-profile/pro-profile.css`, `src/test/proClubhouseSponsor.test.tsx`, `roadmap.md`.
Sponsor-local architecture ownership is documented in module headers.

## Inventory and test ledger
Last reported baseline: 7,392 cases / 645 files (7,391 passed plus one known FM1 failure). Expected after the original six added cases: 7,398 cases / 645 files, delta +6, all in `proClubhouseSponsor.test.tsx` (39 → 45). The close-out changed one of those six assertions in place (old/new above) and added no cases, so the inventory stays 7,398 / 645.

Existing tests changed, renamed, rewritten or deleted: one — the sheet PRO label case above (old/new quoted). No other existing test touched.

## Commands and outcomes (final)
- Focused: `npx vitest run src/test/proClubhouseSponsor.test.tsx` — **45/45 passed**.
- Shard 1: **1,898 passed / 162 files**, 0 failures.
- Shard 2: **1,824 passed / 162 files**, 1 failure — the known FM1 case only (below).
- Shard 3: **1,882 passed / 162 files**, 0 failures.
- Shard 4: **1,798 passed / 159 files**, 0 failures.
- Total: **7,402 passed + 1 known failure = 7,403 cases / 645 files**. Reconciliation: the true incoming baseline was the H2H_BEST_1 run's 7,400 passed + 3 known failures = 7,403 / 645 (the 7,398 figure above was stale). This close-out added and removed no tests; the two sponsor CSS cases moved from failed to passed, leaving 7,402 passed + 1 known failure = 7,403. The count reconciles exactly with no unnamed delta.

## Known failure, separate and untouched
`src/test/fw1FeaturedDeck.test.tsx:151:18`, “reserves no right padding on the meta line” (FM1_MUTE_1 scope):
```text
AssertionError: expected undefined to be defined
expect(rule).toBeDefined();
```
Not touched per the brief.

## Not verified
Live Chromium preview/PNG identity and rank glyph bottoms are unverified. Auth status is `external_unmanaged`; authenticated profile/export end-to-end verification is unavailable in this project. No saved PNG is claimed verified.
