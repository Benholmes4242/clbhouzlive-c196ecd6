# Review posts — scores below media: clause conflict

## STOP before application edits
The brief requires removing glassRef and the useLayoutEffect that sets --review-glass-h, while expressly freezing feedReviewGlass.test.tsx case (e) and stating it should pass untouched.

Exact clauses:
- Section 1: “Remove the feed's glass branch: showGlass, the [data-review-glass-fade] element, the [data-review-score-strip] element over the media, glassRef and the useLayoutEffect that sets --review-glass-h.”
- TESTS: “Case (e) reads InlineVideo/MediaCarousel source strings that do not change and should pass untouched.”

Case (e) also contains this independent assertion at **src/test/feedReviewGlass.test.tsx:111**:
```ts
expect(containerHeight()).toBe('0px');
```
Its helper at lines 119–122 renders the card and returns:
```ts
return container.querySelector<HTMLElement>('[data-review-media]')?.style.getPropertyValue('--review-glass-h');
```

The current effect writes `0px` because jsdom measures the glass strip as zero-height. Removing that effect leaves the property unset, and getPropertyValue returns `''`, not `'0px'`. Retaining a compensating property write solely for this test would violate the requested removal and the unset fallback rule.

Requested ruling: authorize only line 111, `expect(containerHeight()).toBe('0px')` → `expect(containerHeight()).toBe('')`. Keep case (e)'s InlineVideo and MediaCarousel source assertions, and both source files, unchanged. No unauthorized assertion edit was made.

## Scope and state
- No app code, CSS or tests changed for this request.
- Changed support files only: roadmap.md and this report.
- No SQL, migrations, feed_config or round_pool_cap changes.
- Tests and all four shards not run: stopped on the brief's contradictory clauses before implementation, not on an observed runner failure.
- No 320/390 screenshots produced; requested states remain unbuilt pending the ruling.

## Inventory reconciliation
The brief names **9,383**, which is the last fully passing suite (837 files). The immediately preceding poster request added six named tests in src/test/reviewVideoPoster.test.ts and stopped on seven unchanged existing failures. Current expected inventory is therefore **9,389 / 838 files**, not yet fully verified. This request adds/deletes/renames no tests: before and after remain **9,389 expected**.

The six prior additions are cases (a) HTTPS kept, (b) blob plus Stream fallback, (c) data plus Stream fallback, (d) blob without Stream becomes null, (e) sanitized publish payload, (f) sanitized holeMediaPoster. Their separate report is .lovable/reports/review-video-persisted-posters/report.md. This new brief does not authorize repairing that prior stop.

## Shards
| Command | Result |
|---|---|
| bunx vitest run --shard=1/4 | Not run — clause conflict |
| bunx vitest run --shard=2/4 | Not run — clause conflict |
| bunx vitest run --shard=3/4 | Not run — clause conflict |
| bunx vitest run --shard=4/4 | Not run — clause conflict |