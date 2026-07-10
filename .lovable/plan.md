## Goal

Harden the primitives that failed in the previous carousel warm attempt, ship them behind no behaviour change (no new neighbour warm), and prove `active.health` stays green under synthetic lane churn. Only after that evidence do we consider re-enabling the horizontal warm.

## Scope (this PR only)

1. Tighten `VideoEngine.preload()` with an **active-lane identity guard**.
2. Normalize `InlineVideo.detectRoleForMatch()` so the two match-arms cannot both claim the same lane.
3. Ship a dev-only **synthetic lane-churn harness** and a capture script.
4. Update existing `CardFeed` cover warm callers to use the new guard (no new call sites added).

Explicitly **out of scope**: any `MediaCarousel` neighbour `preload()` write. `PrefetchController.request()` (HTTP cache only) stays as-is.

## Changes

### 1. `src/video/VideoEngine.ts` — `preload()` guard + discipline

New optional signature:

```text
preload(laneId, {
  hlsUrl, posterUrl, postId,
  expectedActiveOwnerKey?: string,   // caller asserts this owns feed-active
})
```

Behaviour additions (all before delegating to `load()`):

- **OwnerKey discipline**: if `postId` is non-null and does not contain `:`, normalize to `${postId}:0` and emit `trace('preload.normalized', ...)`. Bare keys are accepted for backwards-compat but flagged.
- **Active-lane identity guard**: resolve `activeLaneId = feedLaneRoles.laneForRole('active')`. Reject (return early, emit `trace('preload.rejected', { reason: 'would-evict-active' })`) if either:
  - `laneId === activeLaneId` (writing directly onto the active role's physical lane), OR
  - `expectedActiveOwnerKey` was provided AND the current `snapshot(activeLaneId).postId` (normalized) equals it AND the incoming `postId` (normalized) differs. This means: "protect the caller's known-active binding from accidental overwrite by a stale warm."
- The guard is skipped when `expectedActiveOwnerKey` is omitted — existing single-media cover warm is unaffected unless it opts in.

Non-goals: no changes to `load()`'s own `alreadyLoaded` compare, no changes to `normalizeOwnerKey` semantics (bare↔`:0` only).

### 2. `src/components/feed/InlineVideo.tsx` — `detectRoleForMatch()`

Drop the `s.postId === postId` arm. Replace with a single ownerKey-normalized compare so `abc` and `abc:0` collapse, but `abc:1` stays distinct:

```text
const norm = (k) => k == null ? null : (k.includes(':') ? k : `${k}:0`);
const matches = (s) => norm(s.postId) === norm(resolvedOwnerKey);
```

This closes the ambiguity where a slide-0 lookup could accidentally satisfy on a lane that a future carousel warm wrote for slide 1 (or vice versa).

### 3. `src/components/feed/CardFeed.tsx` — opt into the guard

At the two `warm('next', ...)` / `warm('prev', ...)` sites, pass `expectedActiveOwnerKey = "${posts[playingIdx].id}:0"`. Purely defensive — same behaviour as today unless something races.

### 4. Dev-only synthetic lane-churn harness

New file `src/video/devLaneChurn.ts`. Exposes `window.__lovable_laneChurn` in dev:

```text
window.__lovable_laneChurn.run({ cycles: 50, intervalMs: 20 })
```

For each cycle:
- Snapshots current `feed-active` ownerKey.
- Fires four synthetic `preload()` calls in the same tick against `feed-active`, `feed-next`, `feed-prev`, and a random one — each with a fake ownerKey `churn:${cycle}:${i}` and the real active key as `expectedActiveOwnerKey`.
- After `intervalMs`, samples `active.health` (same shape the `[CAROUSEL2]` logger emits): resolves the active ownerKey via `findLaneForOwner`, records `{ laneId, firstFrame, playing, readyState }`.

Pass criteria (harness prints PASS/FAIL summary):
- Zero cycles where `findLaneForOwner(activeOwner)` returned `null` (binding lost).
- Zero cycles where `firstFrame` regressed from `true` to `false`.
- Reject count from `preload.rejected` trace equals expected (one per cycle minimum).

Console output is a compact CSV block the user can paste into the capture.

### 5. Trace additions

`trace('preload.rejected', { laneId, reason, incomingOwnerKey, expectedActiveOwnerKey, currentActiveLanePostId })`
`trace('preload.normalized', { laneId, from, to })`

Both routed through the existing `trace()` sink — no new plumbing.

## What this deliberately does NOT do

- No `MediaCarousel.preload()` write for `abc:1`, `abc:2`, ...
- No change to `feedLaneRoles.rotate()`.
- No change to the `normalizeOwnerKey` rule (still bare↔`:0` only).
- No fixes to horizontal-swipe latency yet.

## Verification

1. `npx tsgo --noEmit` — clean.
2. Load feed, run `window.__lovable_laneChurn.run({ cycles: 100, intervalMs: 20 })` on an active video card. Expect the harness to print PASS with 0 binding losses and 0 firstFrame regressions, and a non-zero `preload.rejected` count.
3. Vertical scroll for ~10 cards — existing `[CAROUSEL2] active.health` samples must still show `firstFrame: true, playing: true` at both `activate` and `+500ms`, matching today's baseline.

If any of those fail, we abort before touching the horizontal path.

## Follow-up (separate PR, only after evidence)

- `MediaCarousel` neighbour warm using `preload(..., { expectedActiveOwnerKey })`.
- `CardFeed` vertical prime using per-slide ownerKey from `carouselPositions`.
