# Top 10 share-image fidelity — verification stopped

## Completed code and causes

- html2canvas painted short-line glyph baselines differently from the browser and omitted CSS ellipsis. Export now uses html-to-image's browser SVG foreignObject renderer; live layout is not changed by the export engine. A detached export-only clone moves the hero score up 1 CSS px to account for rasterisation rounding. Tile names/scores, row scores and footer use browser rendering rather than individual canvas glyph placement.
- One canvas-measured helper fits actual font/size/weight/letter-spacing per run and emits a literal … in live and saved text. Mixed-font post rows retain their styling. Original intrinsic text widths are held while replacing strings, preventing repeated flex shrinkage. Overflow remains a safety net.
- Original hosted wordmark asset endpoints returned 200 image/svg+xml and image/png, but the hosted app redirected the automated browser to Lovable login. Its authenticated Save image flow could not be verified (external unmanaged auth; no credentials requested). Local baseline image naturalWidth was 0; the original export also depended on an asset fetch at save time. Under the brief's conditional authorisation, the existing white SVG is embedded verbatim as a data URI. All four actual saved after images paint the brand, vector rendered at 1080 wide; no brand fetch at save time.
- Export font remains the explicit canonical system stack.

## Live pixel differences

All four like-for-like hero/facts crops are pixel-identical before/after, recorded in live-diff.json. Full-card pixel identity is NOT claimed: the formerly broken wordmark is now painted and explicitly measured ellipsis changes the truncated glyphs. These are the other expressly requested fixes; the export-only baseline fix introduces no live hero movement. Full-diff rectangles are preserved. Some post tile text changes from browser auto-ellipsis to the literal measured suffix; the original widths are retained within 0.016px rounding.

## Painted gap table

Actual downloads, downscaled to 405×720 or 405×506 CSS pixels. Bounds measured from bright glyph pixels inside their individual text rectangles; story place padding excluded to avoid sampling the following row. Post places are inline mixed-font runs, measured with the combined text line. Divider is the following row's top (last row's lower edge). Antialiasing threshold and full measurement script retained in harness/measure.py.txt. Every final gap differs by at most 1 CSS px.

| Format/width | Gap | Live CSS px | Saved CSS px | Difference |
|---|---|---:|---:|---:|
| story-390 | Hero title → subline | 7 | 7 | 0 |
| story-390 | Hero score → Exceptional | 17 | 16 | 1 |
| story-390 | Tile 2 score → bottom edge | 12 | 12 | 0 |
| story-390 | Tile 3 score → bottom edge | 12 | 12 | 0 |
| story-390 | Row 04 place → divider | 4 | 4 | 0 |
| story-390 | Row 05 place → divider | 3 | 3 | 0 |
| story-390 | Row 06 place → divider | 3 | 3 | 0 |
| story-390 | Row 07 place → divider | 3 | 3 | 0 |
| story-390 | Row 08 place → divider | 3 | 3 | 0 |
| story-390 | Row 09 place → divider | 3 | 3 | 0 |
| story-390 | Row 10 place → divider | 3 | 3 | 0 |
| post-390 | Hero title → subline | 7 | 6 | 1 |
| post-390 | Hero score → Exceptional | 11 | 10 | 1 |
| post-390 | Tile 2 score → bottom edge | 10 | 10 | 0 |
| post-390 | Tile 3 score → bottom edge | 10 | 10 | 0 |
| post-390 | Row 04 line → divider | 7 | 7 | 0 |
| post-390 | Row 05 line → divider | 7 | 7 | 0 |
| post-390 | Row 06 line → divider | 9 | 9 | 0 |
| post-390 | Row 07 line → divider | 9 | 9 | 0 |
| post-390 | Row 08 line → divider | 7 | 7 | 0 |
| post-390 | Row 09 line → divider | 9 | 9 | 0 |
| post-390 | Row 10 line → divider | 7 | 7 | 0 |
| story-320 | Hero title → subline | 7 | 7 | 0 |
| story-320 | Hero score → Exceptional | 17 | 16 | 1 |
| story-320 | Tile 2 score → bottom edge | 12 | 12 | 0 |
| story-320 | Tile 3 score → bottom edge | 12 | 12 | 0 |
| story-320 | Row 04 place → divider | 4 | 4 | 0 |
| story-320 | Row 05 place → divider | 3 | 3 | 0 |
| story-320 | Row 06 place → divider | 3 | 3 | 0 |
| story-320 | Row 07 place → divider | 3 | 3 | 0 |
| story-320 | Row 08 place → divider | 3 | 3 | 0 |
| story-320 | Row 09 place → divider | 3 | 3 | 0 |
| story-320 | Row 10 place → divider | 3 | 3 | 0 |
| post-320 | Hero title → subline | 7 | 6 | 1 |
| post-320 | Hero score → Exceptional | 11 | 10 | 1 |
| post-320 | Tile 2 score → bottom edge | 10 | 10 | 0 |
| post-320 | Tile 3 score → bottom edge | 10 | 10 | 0 |
| post-320 | Row 04 line → divider | 7 | 7 | 0 |
| post-320 | Row 05 line → divider | 7 | 7 | 0 |
| post-320 | Row 06 line → divider | 9 | 9 | 0 |
| post-320 | Row 07 line → divider | 9 | 9 | 0 |
| post-320 | Row 08 line → divider | 7 | 7 | 0 |
| post-320 | Row 09 line → divider | 9 | 9 | 0 |
| post-320 | Row 10 line → divider | 7 | 7 | 0 |

## Explicit ellipsis list

- story-390: `Dunluce · Co. London…`
- post-390: `Royal Portru…`
- post-390: `Royal County Do…`
- story-320: `Dunluce · Co. London…`
- post-320: `Royal Portru…`
- post-320: `Royal County Do…`

These are the final actual textContent strings shared by the live component and cloned export, character for character. Other fixture lines fit and are not truncated. The fixture retains Royal County Down Golf Club (Championship), its two-line story tile, and missing-photo placeholders. The helper covers row/places and footer names even when these fixture values fit.

## Tests and stop

Baseline: 9,958 tests / 878 files. Added six tests in src/test/shareFidelityRules.test.ts; no existing tests deleted, renamed or rewritten. Expected inventory: 9,964 / 879 (+6 / +1).

New case names:
- preserves an exactly fitting line without a suffix
- replaces overflowing characters with a measured ellipsis
- retains mixed-font runs and truncates the overflowing run
- does not split a Unicode code point
- uses each run’s own width measurement
- never overflows when even the ellipsis cannot fit

Focused command: `./node_modules/.bin/vitest run src/test/shareFidelityRules.test.ts src/test/topTenShareCard.test.tsx` — 11/11 across two files. jsdom emitted canvas-not-implemented diagnostics during this first run but tests passed; later guards skip zero-size DOM measurement. No test changes for mocks.

Four shards required separately and sequentially:
- `./node_modules/.bin/vitest run --shard=1/4`: 2,447 passed / 220 files.
- `./node_modules/.bin/vitest run --shard=2/4`: 2,474 passed / 220 files.
- `./node_modules/.bin/vitest run --shard=3/4`: 2,456 passed / 1 failed / 220 files.
- Shard 4 NOT RUN after unexpected failure. Six new cases belong to the unrun shard; do not claim full-suite execution.

Executed: 7,377 passed / 1 failed = 7,378 tests across 660 files. Full logs in share-fidelity/logs/shard-N.log; no rerun or repair.

Exact stop: `src/test/guestStage24.test.tsx:85:18` — `Stage 2.4 — guests on /auth > after a guest signs in as a member, Auth redirects once`.
Runner: `AssertionError: expected [ '/auth' ] to deeply equal [ '/auth', '/' ]`.
Assertion: `expect(navs).toEqual(['/auth', '/']);`.
The unchanged test was not edited. This is not the authorised pf3a timeout exception. Stop remains open; final suite not verified. Preview harness build OK; temporary fixture removed.

## Images

- after/live-post-320.png
- after/live-post-390.png
- after/live-story-320.png
- after/live-story-390.png
- after/saved-css-post-320.png
- after/saved-css-post-390.png
- after/saved-css-story-320.png
- after/saved-css-story-390.png
- after/saved-post-320.png
- after/saved-post-390.png
- after/saved-story-320.png
- after/saved-story-390.png
- before/live-post-320.png
- before/live-post-390.png
- before/live-story-320.png
- before/live-story-390.png
- before/saved-post-320.png
- before/saved-post-390.png
- before/saved-story-320.png
- before/saved-story-390.png
- story-390-live-vs-saved.png

Eight actual before/after post/story 390/320 exports and one live-vs-saved comparison copied to Files under share-fidelity/. All eight exports visually inspected. Before contains the known faults; after shows clear gaps, real ellipsis and wordmark. Fixtures are isolated, not authenticated live-data verification.

## iOS

The sandbox cannot confirm the iOS font in the saved image; Ben will check on his iPhone.

No SQL, migrations, edge functions or feed_config changes; round_pool_cap untouched.
