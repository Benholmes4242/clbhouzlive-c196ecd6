# Review feed media height — STOP

## Implemented diff
- Added `src/components/feed/feedMediaSizing.ts`: unchanged ratio bounds 0.8/1.91, fallback4/5, clamp calculation, reserve305 and viewport cap shared by both post types.
- `FeedCard.tsx` imports sizing and passes `renderMedia(false)` for media-first reviews with media; normal-post DOM/style output is unchanged by the extraction.
- `ReviewPostCard.tsx` drops the article cap only when `mediaLeads` is true and renders media in a plain block with the existing10px margin, without square/flex/floor/absolute-inner sizing. Review block, footer and interactions are unchanged.
- `reviewPostCard.ts` documents the retained cap scope. Standard/no-media reviews retain their previous rules; no-media reviews do not invent a media frame.
- No new negative letter-spacing, SQL, migrations, deployed function changes, feed_config, cap or native configuration changes.

## Verification stopped
Command:
```text
bunx vitest run src/test/reviewFeedMediaSizing.test.tsx src/test/cb109MediaFirstEverywhere.test.tsx src/test/cb108ClubFeed.test.tsx src/test/reviewPostCard.test.tsx --maxWorkers=2
```
Result: **42 passed /3 failed /45 executed across4 files**. Existing three files pass34/34; new file8 passed/3 failed/11 total.

New failures, all under `shared feed media sizing`:
1. `src/test/reviewFeedMediaSizing.test.tsx:67:39`, `review photo 1080x1350 uses intrinsic ratio 0.8 and shared cap`:
   `AssertionError: expected undefined to be '' // Object.is equality`
2. `src/test/reviewFeedMediaSizing.test.tsx:67:39`, `review photo 1920x1005 uses intrinsic ratio 1.91 and shared cap`:
   `AssertionError: expected undefined to be '' // Object.is equality`
3. `src/test/reviewFeedMediaSizing.test.tsx:80:65`, `review carousel receives the shared viewport cap without an outer square frame`:
   `AssertionError: expected undefined to be '' // Object.is equality`

The failing assertion reads an unset `style.aspectRatio`; jsdom returns undefined rather than the expected empty string. The preceding photo ratio/shared-cap assertions pass. No assertions were changed or rerun after failure.

Automatic typecheck also reports:
```text
src/test/reviewFeedMediaSizing.test.tsx(19,140): error TS2322: Type 'string' is not assignable to type 'ObjectFit'.
```
This is in the new InlineVideo test mock. No correction after the completed-edit stop.

## Full-suite accounting
- Last full green:4,579/4,579 across466 files.
- Intervening ST5 inventory: +19 in `src/test/st5SettingsYourData.test.tsx`, +13 in `src/test/st5RoundsCsv.test.ts` = candidate4,611 across468 files; not full-suite verified.
- This task: +11 in `src/test/reviewFeedMediaSizing.test.tsx` = candidate **4,622 across469 files**, not executed as a full suite.
- No existing tests deleted, renamed, rewritten or retargeted. No existing assertion requires changing: the retained square/cap tests cover the standard layout, not media-first-with-media.
- Pre-existing failure from ST5 remains untouched and was not rerun: `src/test/sheetTopV5.test.tsx:12:18`, `retained account vocabulary rules > no component renders "Your rounds" as a door`, `AssertionError: expected 'src/test/st5SettingsYourData.test.tsx:3…' to be ''`. Its earlier targeted run was105 passed/1 failed/106 total.
- No other pre-existing failing tests were observed in this task's targeted run. Full-suite health cannot be inferred from the targeted checks.

## Browser
390x844 Clubhouse media measurements were not run after the new failure stop. Neither review nor normal-post rendered height is claimed. Authenticated checks were previously unavailable for this externally managed Supabase project.

## Every file changed in this task
1. `src/components/feed/feedMediaSizing.ts` — new shared sizing owner.
2. `src/components/feed/FeedCard.tsx` — shared clamp/cap imports and media-first review path.
3. `src/components/feed/ReviewPostCard.tsx` — conditional natural-height flow and plain media wrapper.
4. `src/components/feed/reviewPostCard.ts` — cap-scope comment.
5. `src/test/reviewFeedMediaSizing.test.tsx` —11 new cases;3 fail as recorded above.
6. `roadmap.md` — task and blockers.
7. `REVIEW_FEED_MEDIA_HEIGHT_STOP_REPORT.md` — this report.
8. `mem://features/clubhouse/review-normal-media-height` — Ben's lasting sizing ruling.
9. `mem://index.md` — memory reference.

Architecture ownership is documented in the shared sizing module and ReviewPostCard headers, following the root AGENTS rule that local facts belong in headers.