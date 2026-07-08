# PR-B — Feed Lane ROLE Rotation (sliding-window promotion)

Date: 2026-07-08

## What shipped

Role-based indirection over the three feed physical lanes. Promotion is now
pure bookkeeping — a rotation of role pointers. The same `<video>` element
that was playing during early-motion IS the active element after promotion.
No `load()`, no `seek()`, no `attachMedia()` fires at the swap.

### Files touched

| File | Change |
| --- | --- |
| `src/video/feedLaneRoles.ts` | **NEW** — role map (active/next/prev → physical lane), `rotate(direction)`, `freeze/unfreeze` for borrow, React subscribe/emit. Documents the borrow ↔ rotation contract in the module header. |
| `src/video/useVideoLane.ts` | Accepts `LaneId \| null`. Play/pause effect gains a cleanup that pauses the CURRENT-effect laneId — role rotation that resolves to the SAME physical lane is a true deps-equal no-op. |
| `src/components/feed/InlineVideo.tsx` | Single lane binding via role selection (`active` > `earlyMotion` early-role). Early role detected from role-lookup of `next`/`prev` snapshots. Deleted the separate early-motion `mountLane/play/unmount` effect and the `handoverResume` stash/consume path. |
| `src/components/feed/CardFeed.tsx` | Settle timer calls `feedLaneRoles.rotate(direction)` BEFORE `setPlayingIdx`. Neighbour warm effect + earlyIdx warm-check both use `feedLaneRoles.laneForRole(role)`. Emits `[DECIDE] rotation.promote` when perf is enabled. |
| `src/components/posts-tab/LightCardFeed.tsx` | Same rotate + role-lookup migration as CardFeed. |
| `src/lib/openWithOrigin.ts` | Feed borrow branch resolves `laneForRole('active')` at tap time and calls `feedLaneRoles.freeze(activeLaneId)` alongside `markBorrowed`. Resume ladder feedSnap rung also uses the role-resolved lane. |
| `src/components/fullscreen-feed/FullscreenFeedOverlay.tsx` | `returnBorrow` calls `feedLaneRoles.unfreeze(laneId, 'prev')` for feed physical lanes on close/route/demote. Runs before the mount/unmount tail. |
| `src/video/handoverResume.ts` | **DELETED** — the same element keeps its own playhead by construction; the stash is obsolete. `rg handoverResume` returns zero. |

## Census — feed-lane literal audit

Every `'feed-active'` / `'feed-next'` / `'feed-prev'` in the codebase after
PR-B. Anything not marked "role lookup" is physical-intentional.

| Site | Kind | Resolution |
| --- | --- | --- |
| `feedLaneRoles.ts` initial map | physical-intentional | Bootstraps the 1:1 default role→physical map |
| `lanePolicy.ts` `LaneId` type + `DEFAULT_LANE_IDS` | physical-intentional | Element pool identity |
| `VideoEngine.ts` `markReadyToShow` allowlist | physical-intentional | Frame-reveal policy is per physical lane |
| `CardFeed.tsx` warm effect (next/prev roles) | **role lookup** | `feedLaneRoles.laneForRole('next' \| 'prev')` |
| `CardFeed.tsx` earlyIdx warm-check | **role lookup** | `feedLaneRoles.laneForRole(dir > 0 ? 'next' : 'prev')` |
| `LightCardFeed.tsx` warm effect | **role lookup** | same |
| `LightCardFeed.tsx` earlyIdx warm-check | **role lookup** | same |
| `InlineVideo.tsx` `detectEarlyRole` | **role lookup** | inspects `laneForRole('next' \| 'prev')` snapshots |
| `InlineVideo.tsx` main binding | **role lookup** | via `useLaneForRole(role)` |
| `openWithOrigin.ts` feed borrow decision | **role lookup** | `feedLaneRoles.laneForRole('active')` |
| `openWithOrigin.ts` resume ladder feedSnap rung | **role lookup** | same |
| `openWithOrigin.ts` `feedLaneRoles.freeze(...)` on borrow | role API | freezes the resolved physical lane |
| `FullscreenFeedOverlay.tsx` `returnBorrow` unfreeze | role API | rejoin at 'prev' |
| `SnapFeed.tsx` vperfArmLane('feed-active') | physical-intentional | Fullscreen surface reuses `feed-active` for its own vperf armament path; not affected by feed role rotation |
| `FeedSlide.tsx` comment | comment-only | Reference in prose |
| `MuteToggle.tsx` header comment | comment-only | |
| `useRailLane.ts` comment | comment-only | |
| `railLanePool.ts` comment | comment-only | |
| `fullscreenFeedStore.ts` `wasMuted` doc comment | comment-only | |
| `perf/vperf.ts` seeding lane check (`laneId === 'feed-active'`) | physical-intentional | ABR seeding policy is tied to specific physical lanes |
| `perf/vperf.ts` prose comments | comment-only | |

**pauseAll / visibility / creation-overlay coverage** — unchanged.
`VideoEngine.pauseAll()` iterates `this.lanes` (all physical lanes, including
rails + fullscreen). `onVisibility` calls `pauseAll()`. Boot-time visibility
listener registration also unchanged. Post-Studio (creationOverlayStore)
opens still pause every physical lane via `pauseAll`.

## Instrumentation

- **`[DECIDE] rotation.promote`** — one line per rotation, DBG-gated. Fields:
  `direction`, `fromIdx`, `toIdx`, `recycledLane`, `borrowedFrozen`, and the
  full post-rotation `map`.
- **`[DECIDE] borrow.feed`** — now also logs `activeLaneId` and `activeRole`
  so the borrow site's chosen physical lane is greppable.
- **`[FLOW] handover`** — probe is UNCHANGED. `vperfHandoverStart` now fires
  at the promoted `active` transition with the current playhead. With the
  same element playing across the swap, `gapMs` and `posJumpMs` should read
  ≈ 0 (there is nothing to jump).
- `vperfLaneEvent` / `vperfSessionStart` etc. continue to be keyed on the
  physical laneId (correct — sessions belong to physical lanes).

## Acceptance checklist

- [x] Role module single-sourced; rotation emits via `subscribe/emit`;
      `useVideoLane` is role-aware through consumer resolving `laneForRole`.
- [x] Promotion path contains NO `load` / `seek` for the promoted media —
      `useVideoLane`'s load effect deps are `[laneId, active, hlsUrl, ...
      postId]`; in the seamless promotion case all are unchanged and the
      effect does not re-run. `handoverResume` deleted; `rg` returns zero.
- [x] Borrow freeze + rejoin rule implemented (`freeze` on borrow,
      `unfreeze(_, 'prev')` on close/route/demote). Documented in
      `feedLaneRoles.ts` header.
- [x] Census table above accounts for every literal.
- [x] `pauseAll` / visibility / creation-overlay pauses iterate PHYSICAL
      lanes — verified in `VideoEngine.pauseAll` (unchanged) and
      `onVisibility` (unchanged).
- [x] `tsgo --noEmit` passes.

## Device verification (Ben)

See brief for the test script:
1. Slow scroll ~15 videos + reversals — expect `flow.handover` ≈ 100%
   SEAMLESS, p95 `gapMs` ≈ 0, `posJumpMs` ≈ 0, `rotation.promote` lines
   present, no cold attaches at promotion.
2. Up-scroll seamlessness.
3. Borrow-during-rotation: tap → fullscreen → close → resume scroll (and
   with a demote via horizontal swipe first).
4. Post-Studio mid-scroll pauses everything.
5. Fast flick: budgets hold.
