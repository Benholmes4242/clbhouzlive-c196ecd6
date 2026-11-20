# Upcoming picks CSS ruling — combined verification stopped

## Authorized changes
- Only the upcoming `PicksBlock` wrapper moves its padding into `overview-picks-up`; `data-overview-picks` and `data-picks-layout` are retained. The cards branch retains its inline padding unchanged.
- `hybrid-hero.css` adds exactly `.overview-picks-up{padding:var(--hero-section-gap) 20px 10px}`.
- No ≤340px override was present for the old inline wrapper, so none was added. Existing media queries remain unchanged.
- No other application or test edits. Roadmap, this report and full logs are verification records only. No SQL, migrations, feed_config or round_pool_cap changes.

## Sole rewritten test and quoted assertions
`src/test/tourOverviewMergedAiry.test.tsx` > `Merged Airy lower sections > upcoming picks are 48px rows under the shared section gap with no hairline` remains the same named case; file count **17 → 17**.

Removed assertion:
```ts
expect(picks.getAttribute('style')).toContain('padding: var(--hero-section-gap) 20px 10px');
```
Authorized replacements:
```ts
expect(picks.classList.contains('overview-picks-up')).toBe(true);
expect(readFileSync('src/styles/hybrid-hero.css', 'utf8')).toContain('.overview-picks-up{padding:var(--hero-section-gap) 20px 10px}');
```
Why: jsdom drops unresolved var() padding shorthand in inline style; assert both the class attachment and the exact CSS rule using the existing source-read approach. Rows, hairline and all other assertions are unchanged. No cases deleted, added or renamed in this ruling.

## Sequential commands and totals
Each shard ran as its own command, sequentially, with stderr and stdout saved by `tee`; pipeline failure status was preserved.

| Exact test command | Executed | Passed | Failed | Files | Duration | Full output |
| --- | ---: | ---: | ---: | --- | --- | --- |
| `bunx vitest run --shard=1/4` | 2,279 | 2,279 | 0 | 208 passed | 211.19s | `shard-1.log` |
| `bunx vitest run --shard=2/4` | 2,281 | 2,281 | 0 | 208 passed | 202.45s | `shard-2.log` |
| `bunx vitest run --shard=3/4` | 2,337 | 2,333 | 4 | 206 passed, 2 failed | 207.67s | `shard-3.log` |
| `bunx vitest run --shard=4/4` | — | — | — | Not run: mandatory stop | — | No log |

**Partial run: 6,897 executed, 6,893 passed, 4 failed across 624 files. No full-suite executed or passing total is established.** No failed-test rerun or repair occurred.

The corrected `tourOverviewMergedAiry.test.tsx` passes **17/17** in shard 2; `playedWithTags.test.tsx` passes **13/13** there. `overviewTypeScale.test.tsx` passes **6/6** in shard 3.

## Exact surviving failures

### Overview-related cases — not authorized by this ruling
`src/test/upcomingLastYearBoard.test.tsx` > `upcoming LAST YEAR condensed board`:
1. `uses the live row tracks without avatars or flags` — `src/test/upcomingLastYearBoard.test.tsx:58:30`.
2. `keeps the winner the same size with a neutral 14px outline trophy and canonical score without wash` — `src/test/upcomingLastYearBoard.test.tsx:73:30`.

Both tool errors:
```text
AssertionError: expected '' to be '36px' // Object.is equality
```
Both failing assertions:
```ts
expect(row.style.height).toBe('36px');
```
These tests remain untouched; no permission to replace their height assertions is inferred.

### Subsequent save-error build's two edit fixtures
`src/test/postWithErrorSurface.test.ts` > `Played with save errors`:
1. `edit save sync error shows the same toast, tracks edit and reaches success`.
2. `successful edit emits no failure toast or event`.

Both tool errors and source location:
```text
TypeError: supabase.from(...).select(...).eq is not a function
 ❯ src/features/post-v2/StageComposer.tsx:222:8
    220|       .from('posts')
    221|       .select('status, scheduled_at, visibility')
    222|       .eq('id', editPostId)
       |        ^
    223|       .maybeSingle()
```
These are the same fixture failures previously reported by the later save-error build. Neither fixtures nor application code were repaired. All four failures need a further ruling before verification can complete.

## Before/after full-suite inventory reconciliation
- Last complete passing baseline from supplied history: **9,301** at `e1e90943b7`.
- Overview type-scale build `72d6f26`: **+6** `overviewTypeScale.test.tsx` cases → **9,307 expected**.
- Played with presentation build `548c920`: **+13** `playedWithTags.test.tsx` cases → **9,320 expected for those two builds combined**.
- Subsequent save-error build `c84243683e`: **+9** `postWithErrorSurface.test.ts` cases → **9,329 expected in the current checkout**.
- This ruling: **9,329 before → 9,329 after (zero inventory delta)**. Expected inventory is not a completed runner total; shard 4 has not run. The two requested builds cannot be claimed fully passing, because shard 3 exposes the two Overview-related failures as well as the later build's two edit-fixture failures.

### Six Overview additions
1. `(a) live board has 31px rows, 13px names and 22px avatars`
2. `(b) live facts use 15px/700 figures and 800 labels`
3. `(c) LastYearRow has a 13px name`
4. `(d) upcoming picks have 13px names and 26px avatars`
5. `(e) upcoming sections use the existing section-gap token`
6. `(f) completed picks retain their name and avatar sizes`

### Thirteen Played with presentation additions
1. `1, 2, 3 and 5 people`
2. `chip shows three faces max; tap opens names and handles; row navigates`
3. `no post_with rows and business posts render nothing new; PostWithLine is gone`
4. `closes on ×`
5. `closes on Escape`
6. `outside tap on the media closes and opens nothing`
7. `taps inside the panel do not like or open full screen`
8. `place chip lifts to bottom 50 above the played-with chip`
9. `text post shows name-row faces and the with… byline; tap opens the sheet`
10. `round card shows the faces and byline; faces tap opens the sheet without a round tap`
11. `chip sits after the author row and before the caption; panel opens`
12. `usePostGolfTags is called once in each host and never in a card or slide`
13. `seeded post_with rows render the chip`

### Nine subsequent save-error additions
1. `insert error returns saved [] and exact Supabase diagnostic fields`
2. `submit failure still resolves the post, reports diagnostics and omits success names`
3. `media submit failure still starts uploading and omits unsaved names`
4. `edit save sync error shows the same toast, tracks edit and reaches success`
5. `successful submit preserves saved names without a toast or failure event`
6. `successful edit emits no failure toast or event`
7. `sync returns the delete error first without attempting an insert`
8. `sync returns the insert error after a successful delete`
9. `null code is omitted from toast and all nullable diagnostics stay null`

Historical authorized assertion changes remain recorded in `../overview-upcoming-live-type-scale.md`, `../played-with-option-c.md` and `../played-with-save-errors.md`; none were changed again except the exact null-style assertion authorized here.

## Other checks and limitations
- Latest harness entry: **build OK**, `2026-11-20T17:49:37Z`.
- No manual build/typecheck or browser/device verification claimed. Work stopped on shard 3 as instructed.
- No new structural module or architecture change; AGENTS.md left untouched.