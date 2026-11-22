# Top 10 share-image fidelity — verified

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

### Continuation final state (accepted 1848785)

The guest race occurred because the navigation effect had not settled when its final assertion ran. Authorised change in `guestStage24.test.tsx:85`: old `expect(navs).toEqual(['/auth', '/']);`; new `await waitFor(() => expect(navs).toEqual(['/auth', '/']));`. Both `h.route` assertions remain unchanged. Three separate file-alone runs passed 5/5 each (continuation/guest-alone-1.log through -3.log).

The live wordmark uses the hosted pointer. Exports dynamically import the embedded wordmark, replace it in an inert template clone, and decode it before rendering: no save-time wordmark image fetch. Comparable minified module-graph gzip payload: **68,044 → 3,016 bytes** (365,720 → 9,989 minified bytes). These are the measured profile-path module payloads, not a separately measured full deployed route chunk. Embedded lazy module: 355,950 minified bytes.

| Engine | Cold first Story/Post | Warmed first Story/Post |
|---|---|---|
| Chromium | All photos, avatar (Story) and wordmark painted | All painted |
| WebKit | No. 2 and No. 3 photos missing | All painted |

One discarded `toBlob` render warms the foreignObject renderer, followed by the saved render. This is retained on both engines; the user confirmed WebKit needs it. First-save real-photo outputs and cold evidence remain in continuation/. Post deliberately has no avatar; its footer is stats-only. Actual sheet CORS fetch → Blob photo path was exercised through a local app proxy at the production origin, not an authenticated hosted member flow. No wordmark image fetch during saving; no page errors.

| Sequential command | Tests passed | Files passed |
|---|---:|---:|
| `./node_modules/.bin/vitest run --shard=1/4` | 2,447 | 220 |
| `./node_modules/.bin/vitest run --shard=2/4` | 2,474 | 220 |
| `./node_modules/.bin/vitest run --shard=3/4` | 2,457 | 220 |
| `./node_modules/.bin/vitest run --shard=4/4` | 2,586 | 219 |
| Total | **9,964** | **879** |

The prior guest stop is closed. Full output retained in share-fidelity/logs/, including the previously uncommitted shard-4.log. Inventory reconciliation: 9,958/878 + six named shareFidelityRules cases/one file = 9,964/879. No deletions or renames; the sole existing-test assertion rewrite is quoted above.

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


## Canon fixes with real photos

1. Top eyebrow and all No. kickers now use #F8FAFC; sizes, weights, tracking and case unchanged.
2. Only the hero scrim first-stop alpha changes where a real hero photo is present. Story: **0.55 → 0.82 at 0%**; all following stops stay 0 at 28%, 0 at 42%, 0.86 at 82%, #0A0A0C at 100%. Post: **0.50 → 0.80 at 0%**; remaining stops stay 0 at 34%, 0.84 at 80%, #0A0A0C at 100%. A 0.01 alpha search resolves the smallest passing stop to 0.82/0.80; 0.81/0.79 miss 4.5. The finer analytic estimates are 0.813/0.792 but screenshot quantisation requires checking rendered pixels, hence two-decimal stops. Final colours unchanged. Tile scrims unchanged: Story 0 at 20% → 0.88 at 100%; Post 0 at 15% → 0.88 at 100%. Whitening alone fixes the Post No. 3 kicker. Missing-photo panels retain their original scrims; only specified kicker colours change.
3. Photo and initials avatars both use 34% radius. Photo container is 34×34 with #1C1D22 fill, 1px rgba(255,255,255,0.14) ring and hidden overflow; image fills it with cover. Saved Story images visibly paint the fill and traced ring around the transparent portrait.

### Contrast: before → after

Background-only captures hide each text element without changing layout, preserving the underlying photo plus scrim. Relative sRGB luminance is sampled directly within each text Range bounding box (image box for wordmark); the 10th percentile is used as requested. Translucent text is composited over the representative background pixel before calculating (Ltext+0.05)/(Lbackground+0.05). Wordmark uses white. This is the requested percentile statistic, not the worst-pixel statistic. Real sources: Alwoodley, American Legion and Arrowhead. Tables include every required element; verdict is EXCEPTIONAL. The 320 Story ratios equal 390 because export layout remains 405 CSS px.

| Element | Chromium Story | Chromium Post | WebKit Story | WebKit Post |
|---|---:|---:|---:|---:|
| wordmark | 2.59 → 4.57 | 2.46 → 4.54 | 2.59 → 4.56 | 2.46 → 4.54 |
| top eyebrow | 1.33 → 4.96 | 1.23 → 4.77 | 1.30 → 4.84 | 1.23 → 4.79 |
| hero kicker | 8.88 → 16.41 | 9.51 → 18.22 | 8.89 → 16.41 | 9.51 → 18.23 |
| hero title | 19.01 → 19.01 | 19.03 → 19.03 | 19.12 → 19.12 | 19.02 → 19.02 |
| hero subline | 10.77 → 10.77 | 10.63 → 10.63 | 10.77 → 10.77 | 10.66 → 10.66 |
| hero score | 17.82 → 17.82 | 17.47 → 17.47 | 17.76 → 17.76 | 17.60 → 17.60 |
| hero verdict | 18.69 → 18.69 | 18.80 → 18.80 | 18.71 → 18.71 | 18.83 → 18.83 |
| tile 2 kicker | 8.25 → 14.76 | 9.03 → 16.78 | 8.25 → 14.75 | 9.03 → 16.78 |
| tile 2 name | 15.66 → 15.66 | 17.39 → 17.39 | 15.33 → 15.33 | 17.29 → 17.29 |
| tile 2 place | 9.76 → 9.76 | 9.59 → 9.59 | 9.74 → 9.74 | 9.53 → 9.53 |
| tile 2 score | 15.34 → 15.34 | 15.14 → 15.14 | 15.31 → 15.31 | 15.11 → 15.11 |
| tile 3 kicker | 8.85 → 16.34 | 3.35 → 4.77 | 8.82 → 16.22 | 3.37 → 4.80 |
| tile 3 name | 16.50 → 16.50 | 15.57 → 15.57 | 16.81 → 16.81 | 15.78 → 15.78 |
| tile 3 place | 9.93 → 9.93 | 9.83 → 9.83 | 9.93 → 9.93 | 9.88 → 9.88 |
| tile 3 score | 17.56 → 17.56 | 17.61 → 17.61 | 17.56 → 17.56 | 17.59 → 17.59 |

Minimum after: **4.54:1**. Every required element reaches 4.5:1 in both engines/formats. Full precision, all six width/engine checks, backgrounds and bounding boxes are in canon/*-contrast.json and *-metrics.json.

### Hero live versus saved gaps (CSS px)

Glyph bounds use text-minus-background pixels; actual 1080-wide downloads are downscaled to the fixed 405 CSS px layout. This avoids counting real-photo pixels as text. Scripts retained in canon/harness/.

| Engine/format/width | Gap | Live | Saved | Difference |
|---|---|---:|---:|---:|
| chromium-story-390 | hero title → hero subline | 6 | 6 | 0 |
| chromium-story-390 | hero score → hero verdict | 17 | 16 | 1 |
| chromium-post-390 | hero title → hero subline | 7 | 6 | 1 |
| chromium-post-390 | hero score → hero verdict | 12 | 11 | 1 |
| chromium-story-320 | hero title → hero subline | 6 | 6 | 0 |
| chromium-story-320 | hero score → hero verdict | 17 | 16 | 1 |
| webkit-story-390 | hero title → hero subline | 7 | 7 | 0 |
| webkit-story-390 | hero score → hero verdict | 16 | 15 | 1 |
| webkit-post-390 | hero title → hero subline | 6 | 6 | 0 |
| webkit-post-390 | hero score → hero verdict | 11 | 12 | 1 |
| webkit-story-320 | hero title → hero subline | 7 | 7 | 0 |
| webkit-story-320 | hero score → hero verdict | 16 | 15 | 1 |

All differences ≤1 CSS px. All six first saves show three course photos and wordmark; Story includes the filled/ringed avatar, Post retains its deliberately avatar-free footer. No page errors; zero wordmark image requests during each save. Chromium and Playwright WebKit verified, not physical iPhone font rendering.

### Attachments

- [Real first save chromium-story-390](share-fidelity/canon/after/real-chromium-story-390.png)
- [Real first save chromium-post-390](share-fidelity/canon/after/real-chromium-post-390.png)
- [Real first save chromium-story-320](share-fidelity/canon/after/real-chromium-story-320.png)
- [Real first save webkit-story-390](share-fidelity/canon/after/real-webkit-story-390.png)
- [Real first save webkit-post-390](share-fidelity/canon/after/real-webkit-post-390.png)
- [Real first save webkit-story-320](share-fidelity/canon/after/real-webkit-story-320.png)

### Final sequential shards

Baseline **9,964 tests / 879 files**, after **9,964/9,964 passed / 879 files**. Delta zero: no tests added, removed, renamed or rewritten in this canon brief. All four commands ran separately, sequentially; no retries or failures.

| Command | Tests | Files | Full output |
|---|---:|---:|---|
| `./node_modules/.bin/vitest run --shard=1/4` | 2,447 | 220 | canon/logs/shard-1.log |
| `./node_modules/.bin/vitest run --shard=2/4` | 2,474 | 220 | canon/logs/shard-2.log |
| `./node_modules/.bin/vitest run --shard=3/4` | 2,457 | 220 | canon/logs/shard-3.log |
| `./node_modules/.bin/vitest run --shard=4/4` | 2,586 | 219 | canon/logs/shard-4.log |

Preview build OK. Temporary capture page removed. No SQL, migrations, edge-function changes or feed_config edits; round_pool_cap unchanged.
