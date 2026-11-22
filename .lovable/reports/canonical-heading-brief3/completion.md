# Brief 3 and share-card follow-up — completion

## Matcher and authorised test changes

`src/test/weightCanonSweep.test.ts` now exports `scan(fileName, text)`; file reads call it. Removed catch-all shorthand matching from every string. Font shorthand is checked only for embedded font declarations, a `font` object property, or an assignment to `.font`; identifier values resolve through the existing variable map, including template literals. A shorthand requires weight, unit-bearing size, optional line-height and family. The seven specified CSS functions cannot be families. Existing weight-property conditional/variable handling, CSS pass, Tailwind detection and the single auth selector exception remain.

The preliminary guard-alone run found **exactly five expected findings**, no others. Its 28 new matcher cases passed; the clean-scope assertion intentionally failed before the light-weight edits. Full output: `logs/final/guard-before-light-weights.log`. After edits, the guard passed **29/29**, saved as `guard-after-light-weights.log`.

The existing clean-scope test was not deleted, renamed or rewritten. Its assertion remains `expect(CLEAN_SCOPES.flatMap(walk).flatMap(violations)).toEqual([])`. Scanner implementation changed under express authorisation. No other existing test changed during continuation 2.

### Added cases: all in `Weight matcher font contexts`

Seven `accepts non-weight strings or canonical values: %s` instances assert `expect(scan('fixture.tsx', text)).toEqual([])`:

1. `const shadow = '0 0 24px rgba(251,188,46,.35)'`
2. `const style = { margin: '0 0 8px' }`
3. `const style = { padding: '0 0 0 8px' }`
4. `const style = { boxShadow: '0 2px rgba(0,0,0,.4)' }`
5. `const style = { transition: '200ms ease 0s' }`
6. `const style = { fontWeight: 700 }`
7. `ctx.font = '700 32px -apple-system, sans-serif'`

Fourteen `rejects out-of-canon font values: %s %s` instances assert `expect(scan(file, text)).toHaveLength(1)`:

1. Object `fontWeight: 800`.
2. Object `fontWeight: 200`.
3. Object `fontWeight: isHero ? 900 : 700`.
4. Object `fontWeight: '750'`.
5. `ctx.font = '800 32px -apple-system'`.
6. Object `font: '750 14px Inter'`.
7. Template `const F = \`900 ${s}px ${FAMILY}\`; ctx.font = F;`.
8. `className="font-black"`.
9. `className="font-light"`.
10. `className="font-[800]"`.
11. CSS `.x{font:800 12px/1 sans-serif}`.
12. CSS `.x{font-weight:300}`.
13. Identifier `const F = '750 14px sans-serif'; const style = { font: F }`.
14. Template identifier used in object `font: F`.

Seven `does not treat %s as a font family` instances — rgba, rgb, hsl, hsla, var, calc, color-mix — assert an empty scan for `ctx.font = '800 12px FUNCTION(0)'`.

These 28 added cases pin both detection and rejection of false positives. No new test file. Baseline **9,930 tests / 878 files** → **9,958 / 878**; delta **+28 / 0**, entirely this case list. The older Brief 3 replacement of the one-case Tour sweep by this one-case clean-scope sweep was count-neutral and is already committed; its two authorised profile assertions changed 800 to 700, without changing case counts.

## Five light-weight findings resolved

| Original location | Before | After |
| --- | --- | --- |
| overview/tokens.ts:116–117 | unused NUMERAL_THIN, 200 | export and comment deleted; repository search found no importer |
| OnTheCourse.tsx:527, forward chevron | 300 | 400 |
| OnTheCourse.tsx:700, back chevron | 300 | 400 |
| RankedPlayerRow.tsx:79 | 200 | 400 |
| RoundCardShell.tsx:116 | 200 | 400 |

Sizes, colours, tracking, line-height and column definitions unchanged. No SQL, migrations, edge-function work or feed_config changes; round_pool_cap untouched.

## Measured figures and wrapping

Real DOM Range measurements, saved in `figure-widths.json`, at **both 390 and 320**:

| Figure | Before text width | After text width | Column |
| --- | ---: | ---: | ---: |
| 1 | 8.34375px | 8.34375px | 28px unchanged |
| 9 | 8.34375px | 8.34375px | 28px unchanged |
| 10 | 16.6875px | 16.6875px | 28px unchanged |
| T12 | 25.859375px | 25.859375px | 28px unchanged |
| Round gross 77 | 56.703125px | 56.703125px | intrinsic width |

All four ranks fit the existing 28px column. Right-hand figure x positions shifted **0px** for every compared row. Round-card row width: **214.046875px at 390**, **144.046875px at 320**, unchanged. Gross/differential coordinates unchanged; no newly wrapped item at 320. Measurements are sandbox Chromium with system-font fallback, not an iPhone font metric guarantee.

## Share font and clipping cause/fix

Explicit export-root font now exactly matches Tailwind sans:

`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

Removed SF Pro Display. Root dimensions remain 405×720 story / 405×506 post; export scale and fixed containers unchanged. The clipping was html2canvas baseline painting inside short overflow-hidden line boxes, not image height: story row 10 was at y=600 with height=36 inside a 720px card, well clear of its footer, but names/place lines were vertically cut. The 2px descender padding was insufficient; place lines lacked protection altogether.

Expanded spacing-neutral line protection to 8px bottom padding with -8px bottom margin and applied it to story place lines too. Flow heights/row spacing stay unchanged; canvas baseline paint is no longer clipped. Both saved post tiles and all seven story rows now show full letter heights. Existing intentional horizontal ellipsis stays; no added hidden line or line count change.

Verified actual **Save image** downloads, not only screenshots, before and after, for both formats at both widths, using the fixture's longest name `Royal County Down Golf Club (Championship)` plus the same long-place fixtures. Export pixels are 1080×1920 story / 1080×1349 post. All eight images visually inspected; after images have complete row text and footer clearance. Missing-photo placeholder panels deliberately exercised; external wordmark image did not appear in these canvas captures, a pre-existing asset/export limitation not modified by this text-clipping scope. No physical-device check claimed.

**This sandbox cannot confirm which font iOS uses in the exported image; Ben must check on a physical iPhone.**

## Census

`census.json` replaced with a fresh fixed-matcher census, covering production src TS/TSX/CSS and all five forms; tests and disposable fixture excluded. Single sanctioned auth selector excluded in both responsive rules. **All eight CLEAN_SCOPES report zero**:

- src/features/tourhub
- src/components/profile
- src/features/edit-profile
- src/features/profile-sheet-v2
- src/components/settings
- src/pages/messaging-v2
- src/pages/FindPeoplePage.tsx
- src/pages/BusinessInvitePage.tsx

**Remaining app-wide above-700 occurrences: 299**, outside completed scopes. These are occurrence counts, not unique files. The stale census used a different matcher and cannot be compared as a same-method delta; no unrelated weight fixed.

| Area | Occurrences |
| --- | ---: |
| components/business | 32 |
| components/course-media-tab | 4 |
| components/courses | 51 |
| components/explore-tab-new | 14 |
| components/feed | 2 |
| components/invite | 2 |
| components/likes | 1 |
| components/shared | 1 |
| components/ui | 1 |
| features/admin | 51 |
| features/amateur-ranking | 9 |
| features/business | 13 |
| features/business-create | 7 |
| features/chrome-v2 | 5 |
| features/coach | 1 |
| features/courses | 2 |
| features/creator | 1 |
| features/explore-magazine | 21 |
| features/find-people | 1 |
| features/guest | 1 |
| features/member-badge | 1 |
| features/post-v2 | 10 |
| features/pro-verification | 11 |
| features/video-details | 7 |
| index.css | 25 |
| pages/auth, outside the allowlisted selector | 1 |
| styles | 24 |

## Final four sequential shards

Each command ran separately, sequentially; full output in `logs/final/shard-N.log`. No timeout or unexpected failure; no reruns needed.

| Command | Passed | Files |
| --- | ---: | ---: |
| `./node_modules/.bin/vitest run --shard=1/4` | 2,447 | 220 |
| `./node_modules/.bin/vitest run --shard=2/4` | 2,474 | 220 |
| `./node_modules/.bin/vitest run --shard=3/4` | 2,457 | 220 |
| `./node_modules/.bin/vitest run --shard=4/4` | 2,580 | 218 |
| **Total** | **9,958/9,958** | **878** |

Preview harness: build OK. Temporary fixture removed before final shards and commit. Captures used actual components with fixed local data and real providers, not live-data or physical-phone verification.

## Capture/export file list

Under `captures/continuation/{before,after}/`, for each width **390 and 320**:

- `players_story_WIDTH.png`
- `round_story_WIDTH.png`
- `groups_forward_WIDTH.png`, `groups_back_WIDTH.png`
- `chevron_forward_WIDTH.png`, `chevron_back_WIDTH.png`
- `share_story_WIDTH.png`, `share_post_WIDTH.png` — fresh captures after the two earlier 750→700 changes; before/after here is continuation 2 font/clipping work.
- `share-sheet_story_WIDTH.png`, `share-sheet_post_WIDTH.png`
- `saved-story-WIDTH.png`, `saved-post-WIDTH.png` — actual downloads, attached as Files copies.
- `metrics.json`, `errors.json` (no page errors).

Full exact recursive list: `capture-files.txt`. Retained disposable fixture, capture script and census script as non-executable `.txt` evidence under `harness/continuation/`. Eight attached exports copied to `brief3-share-exports/{before,after}-{post,story}-{390,320}.png` in Files.