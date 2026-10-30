# Review feed media height — Final verification

## Final result — Authorised test fixes
**4,621/4,621 tests pass across469 files**, with no failures. Targeted four-file run passes45/45. Automatic preview build/type validation reports `build OK` at2026-10-30T11:26:38Z; no manual build/typecheck was run because this environment requires the automatic harness.

At **390 ×844**, real `FeedCard` sample-data `mediaFirst` rendering measures:
- Review4:5 photo: **390 ×487.5px**.
- Normal4:5 photo: **390 ×487.5px**.
- Both computed ratio0.8/1, shared computed max-height539px and object-fit cover. Review wrapper height487.5px, style `display: block; margin-top: 10px;`, article max-height `none`.
- Both media taps called the existing open callback with their respective post IDs. No browser page errors. Element screenshots inspected and match dimensions. Temporary fixture and sample bitmap live only in `/tmp/browser/review-media/`; no application route or asset added.
- The fixture initially imported provider modules without Vite's cache-query identity and reported a Router-context error; correcting only the temporary fixture imports resolved it. No app code changed for the fixture. This is sample presentation verification, not authenticated feed data or fullscreen-viewer verification.

### Exact authorised assertions — Old → new
The parameterised photo case covers two executed cases (1080x1350 and1920x1005):
```tsx
// Old
expect(wrapper.style.aspectRatio).toBe('');
// New
expect(wrapper.style.aspectRatio ?? '').toBe('');
expect(wrapper.getAttribute('style') ?? '').not.toContain('aspect-ratio');
```
Carousel case:
```tsx
// Old
expect(element(c, '[data-review-media]').style.aspectRatio).toBe('');
// New
expect(element(c, '[data-review-media]').style.aspectRatio ?? '').toBe('');
expect(element(c, '[data-review-media]').getAttribute('style') ?? '').not.toContain('aspect-ratio');
```
These tolerate jsdom's unset-property representation but still reject a reintroduced ratio in both the style property and serialized style. Every other assertion and case name remains unchanged. No test removed or renamed in this review correction; inventory stays11 cases in the file.

InlineVideo mock final prop type: `({ objectFit }: { objectFit?: React.CSSProperties['objectFit'] })`; React was already imported. The preceding type-only fix had changed `string` to the same CSS type without the optional marker; this brief adds only the requested optional marker. No app or visual change in this correction.

### Commands and complete count reconciliation
```text
bunx vitest run src/test/reviewFeedMediaSizing.test.tsx src/test/cb109MediaFirstEverywhere.test.tsx src/test/cb108ClubFeed.test.tsx src/test/reviewPostCard.test.tsx --maxWorkers=2
bunx vitest run --maxWorkers=2 --shard=1/2
bunx vitest run --maxWorkers=2 --shard=2/2
```
- Targeted:45/45 across4 files.
- Shard1:2,257/2,257 across235 files,329.63s.
- Shard2:2,364/2,364 across234 files,395.60s.
- Full aggregate: **4,621/4,621 across469 files**; all included files executed, no filtering or exclusions beyond normal Vitest configuration.
- Last full green4,579 across466 +`st5SettingsYourData.test.tsx`18 +`st5RoundsCsv.test.ts`13 +`reviewFeedMediaSizing.test.tsx`11 =4,621 across469 (+42 cases/+3 files).
- ST5 initially added19 UI cases; ST5.1 separately authorised removing case19 `never uses Your rounds as a door label` and moving its dialog assertion into case7. That accounts for4,622 →4,621; its old assertions/removal rationale are quoted in `ST5_REPORT.md`, not silently removed here.
- The three pre-existing review-media failures recorded below now pass under the authorised assertion changes. The separate historical `sheetTopV5.test.tsx:12:18`, `retained account vocabulary rules > no component renders "Your rounds" as a door`, was cleared by ST5.1 before this task; unchanged vocabulary file passes2/2 here. No current pre-existing or new failures. Its source and ST5 tests were not edited in this review correction.

### Files changed by this finish brief
1. `src/test/reviewFeedMediaSizing.test.tsx` — only two assertion sites (three executed cases) and optional mock prop type.
2. `roadmap.md` — finish task/results and resolved blockers.
3. `REVIEW_FEED_MEDIA_HEIGHT_STOP_REPORT.md` — final report, preserving historical stop below.

The original implementation's complete file list is preserved below. This finish brief adds no source/module/asset changes, no negative letter-spacing, no SQL/migrations, no deployed RPC/edge changes, no feed_config/cap/native changes.

---
## Historical stop — Preserved audit record

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