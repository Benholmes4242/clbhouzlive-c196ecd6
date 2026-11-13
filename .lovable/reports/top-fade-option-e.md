# Top fade Option E — implementation saved, suite stopped

## Delivered
Full-bleed island routes hide the existing soft fade at rest and show it when the existing island signal condenses. Resolved `bleed` owns the decision; no path list or new scroll listener exists in production. Padded island routes retain the always-visible fade.

The transition uses `var(--island-glass-transition)` with `transitionProperty: opacity`: the shared token names background, so overriding only the property preserves its duration and easing while actually animating opacity. Reduced motion uses `none`.

Gradient, height, z-index, registry, StickySafeAreaScrim and page heroes are unchanged. Module header records local ownership. No SQL, migrations, backend changes or unrelated test repairs.

## Checks and counts
Last fully passing baseline: **8,458**. Previous notch brief added three cases, giving pre-change inventory **8,461**, not full-suite verified. This brief adds **34** cases: 33 in islandSoftFade.test.tsx and one in gi1GuestIslandReducedMotion.test.tsx. Expected after inventory: **8,495**. No tests deleted, renamed or rewritten; the existing reduced-motion case is byte-unchanged.

| Check | Command | Result |
| --- | --- | --- |
| Focused | `bunx vitest run src/test/islandSoftFade.test.tsx src/test/gi1GuestIslandReducedMotion.test.tsx --maxWorkers=2` | 35 passed, 2 files |
| Shard 1 | `bunx vitest run --shard=1/4 --maxWorkers=2` | 2,155 passed, 187 files |
| Shard 2 | `bunx vitest run --shard=2/4 --maxWorkers=2` | 2,023 passed, 3 failed; 2,026 executed; 186 files passed, 1 failed |
| Shard 3 | Not run | Stopped after shard 2 |
| Shard 4 | Not run | Stopped after shard 2 |

The shards were separate sequential commands. Executed shard subtotal: **4,181**, comprising **4,178 passed / 3 failed**. Focused checks overlap suite cases and are not added to this subtotal. No full-suite passing total is claimed.

Preview signal: `=== build 2026-11-13T16:17:34Z === build OK`. No browser or authenticated page verification was performed after the stop; Ben's at-rest/scrolled comparison remains pending.

## Exact stop — previous test untouched
All three previous notch cases fail before their assertions:

```text
FAIL src/test/stickySafeAreaGate.test.tsx > Sticky notch state across a load gate > is not stuck for a sentinel inside an unrevealed PageLoadGate
FAIL src/test/stickySafeAreaGate.test.tsx > Sticky notch state across a load gate > re-measures after reveal and remains unstuck below the 47px notch
FAIL src/test/stickySafeAreaGate.test.tsx > Sticky notch state across a load gate > becomes stuck after scrolling the revealed sentinel past the notch
TypeError: Cannot redefine property: ResizeObserver
 ❯ src/test/stickySafeAreaGate.test.tsx:18:6
 18| vi.stubGlobal('ResizeObserver', class { constructor(cb: ResizeObserv…
```

Repairing that previous test's observer setup is outside this brief's authorisation. No repair or rerun was attempted.

## Every new case
`src/test/islandSoftFade.test.tsx` — describe `Option E soft fade`:

1. is hidden at rest on full-bleed /
2. is hidden at rest on full-bleed /clubhouse
3. is hidden at rest on full-bleed /amateur
4. is hidden at rest on full-bleed /courses
5. is hidden at rest on full-bleed /courses/course-id
6. is hidden at rest on full-bleed /tourhub
7. is hidden at rest on full-bleed /tourhub/tournament/event-id
8. is hidden at rest on full-bleed /tourhub/player/player-id
9. is hidden at rest on full-bleed /profile
10. is hidden at rest on full-bleed /profile/ben
11. is hidden at rest on full-bleed /profile/ben/courses
12. is hidden at rest on full-bleed /profile/ben/rounds
13. is hidden at rest on full-bleed /business/club-id
14. is hidden at rest on full-bleed /handicap
15. is hidden at rest on full-bleed /handicap/history
16. is hidden at rest on full-bleed /handicap/rivalry/member-id
17. is hidden at rest on full-bleed /handicap/member-id/rivalry/other-id
18. is hidden at rest on full-bleed /rounds
19. is hidden at rest on full-bleed /watch/courses
20. is hidden at rest on full-bleed /watch/top100
21. is hidden at rest on full-bleed /watch/region/region-id
22. is hidden at rest on full-bleed /find-people
23. is hidden at rest on full-bleed /notificationmessages
24. stays visible at rest on padded /round/round-id
25. stays visible at rest on padded /profile/ben/followers
26. stays visible at rest on padded /profile/ben/following
27. stays visible at rest on padded /business/club-id/followers
28. stays visible at rest on padded /business/club-id/following
29. stays visible at rest on padded /discover?main=videos&section=long-form
30. stays visible at rest on padded /unmatched-page
31. follows condensation and glass timing on /tourhub
32. follows condensation and glass timing on /courses/course-id
33. preserves the signed-off gradient and height

`src/test/gi1GuestIslandReducedMotion.test.tsx` — describe `GI1 reduced motion`:

34. full-bleed soft fade follows condensation without a transition

The route cases assert actual inline opacity plus real resolved route classification. Scroll cases drive the real registered nav scroller, assert 0 → 1 → 0 and shared timing. The reduced-motion case drives the real scroller and checks 0 → 1 with no transition. No canonical scroll hook or registry is mocked.

## Change statistics
Platform maintenance saved the implementation in checkpoint `30e88717d5`; it is preserved, not reverted or squashed. Whole-request command: `git diff 6e4668405c HEAD --stat` after the completion commit:

```text
 .lovable/reports/top-fade-option-e.md          | 93 +++++++++++++++++++++++++++
 roadmap.md                                    |  7 ++
 src/features/chrome-v2/ChromeIsland.tsx       |  7 ++
 src/test/gi1GuestIslandReducedMotion.test.tsx | 16 +++++
 src/test/islandSoftFade.test.tsx              | 93 +++++++++++++++++++++++++++
 5 files changed, 216 insertions(+)
```