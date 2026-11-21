# Rail observer setup ruling — verification stopped

## Authorised changes
Only `src/test/railTileShapes.test.tsx` setup changed; no app files, test names or assertions changed.

- Former line 32 (`beforeEach`), now lines 32–33: add `let origIO: unknown;`, save the existing `window.IntersectionObserver`, then assign `IO` directly rather than `vi.stubGlobal`.
- Former line 33 (`afterEach`), now line 34: clean up and restore `origIO` directly rather than `vi.unstubAllGlobals`.

```ts
let origIO: unknown;
beforeEach(() => { f.result = []; origIO = (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver; (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO; });
afterEach(() => { cleanup(); (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = origIO; });
```

## Focused verification
Command: `./node_modules/.bin/vitest run src/test/railTileShapes.test.tsx src/test/playedMemberMediaAutoplay.test.tsx`

**28/28 passed across 2 files:** 22 rail cases and 6 autoplay cases. Full output: `focused.log`.

Preview harness at 2026-11-21T14:34:49Z: `build OK`. No manual build or typecheck was run.

## Sequential shards
Each executed shard was its own command; verification stopped at the first unexpected failure.

| Shard | Command | Expected | Observed |
|---|---|---:|---|
| 1 | `./node_modules/.bin/vitest run --shard=1/4` | 2,352 | 2,351 passed / 1 failed; 213 files (212 passed / 1 failed) |
| 2 | Not run after stop | 2,324 | Not verified |
| 3 | Not run after stop | 2,401 | Not verified |
| 4 | Not run after stop | 2,473 | Not verified |

Full shard-one stdout/stderr is retained in `shard-1.log`.

### Exact unexpected failure
```text
FAIL  src/test/activeRing.test.tsx > WhoToFollowRail > a card without media keeps its figures and its avatar opens the post, not the profile
TestingLibraryElementError: Unable to find role="button" and name "Open Danny Holmes's latest post"
 ❯ src/test/activeRing.test.tsx:202:30
    202|     const btn = await screen.findByRole('button', { name: "Open Danny Holmes's latest post" });
```

This existing test was not modified or rerun. No failure repair was attempted.

## Counts
Supplied before inventory: **9,550 tests / 850 files**. Expected after inventory: **9,550 / 850**, delta **0**; setup edits add, remove, rename or rewrite no test cases. No assertions changed, so there are no changed assertions to quote. The unchanged full inventory is supplied/expected, not independently measured in this turn; observed shard-one executed count exactly matches 2,352. A full passing 9,550 total is not claimed.

Previous verified baseline 9,491 / 848 reconciles to the expected inventory via +37 Members cases / one file, then +22 rail cases / one file, recorded in the preceding rail report. This run does not complete Members v3 full verification.

## Captures and first paint
390px/320px mixed region rail and course photo-row captures were **not produced** because the brief requires stopping on any other failure. Next-tile visibility, rail-only overflow and first-paint widening remain **visually unverified**. No authenticated readback or real data write was attempted.

Pending: shards 2–4 and all requested captures, blocked by the unexpected shard-one failure and the stop ruling.