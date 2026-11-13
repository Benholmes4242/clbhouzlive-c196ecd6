# Four combined builds — final authorised test fixes

## Results
All four shards ran as separate sequential commands:

| Shard | Command | Tests | Files |
|---|---|---|---|
| 1/4 | `bunx vitest run --shard=1/4 --maxWorkers=2` | 2,155 passed | 187 passed |
| 2/4 | `bunx vitest run --shard=2/4 --maxWorkers=2` | 2,026 passed | 187 passed |
| 3/4 | `bunx vitest run --shard=3/4 --maxWorkers=2` | 2,159 passed | 187 passed |
| 4/4 | `bunx vitest run --shard=4/4 --maxWorkers=2` | 2,187 passed | 187 passed |

**Full suite: 8,527 passed, zero failed; 748 files passed.** No unexpected failure and no rerun.

## Counts
Before this repair: 8,527 executed (8,525 passed, 2 failed). After: 8,527 passed. Added/deleted cases in this repair: zero. One case renamed; one existing case's input changed; one assertion added inside the renamed case, not a new test.

Last fully passing baseline 8,458 + notch/tie 3 + top fade 34 + Tour slot 32 = **8,527**. Observer repair and these final repairs change the count by zero. All 69 new cases and historical changed cases are named below.

## Exactly authorised changes
### src/test/tourSlot.test.tsx
**binds actions and liked-by to the returned persistent post id** — changed only the single click to pointer down/up for Pressable. No assertion changed; same case name.
Old input: `fireEvent.click(buttons[0]);`
New input: `fireEvent.pointerDown(buttons[0], { pointerId: 1 }); fireEvent.pointerUp(buttons[0], { pointerId: 1 });`
Unchanged binding assertion: `expect(h.onLike.mock.calls[0]?.[0]?.id).toBe('post-123');`
Why: exercise the actual Pressable tap contract, not a click it does not handle.

### src/test/tourOverviewBand.test.tsx
**soft fade token holds the signed-off safe-area stops without a transition** → **soft fade token keeps the signed-off stops; transition only on full-bleed routes**.
Old line (after `mount('/tourhub');`):
```tsx
expect(layer('island-scrim-soft')?.style.transition).toBe('');
```
New full-bleed assertion:
```tsx
expect(layer('island-scrim-soft')?.style.transition).toBe('var(--island-glass-transition)');
```
Added non-bleed check after cleaning up the first mount:
```tsx
mount('/no-such-page');
expect(layer('island-scrim-soft')?.style.transition).toBe('');
```
Why: encode signed-off Option E while preserving the default non-bleed behavior. Both CSS height and gradient assertions remain byte-unchanged.

No tests deleted. No other test renamed or assertion rewritten by this repair. No application code, setup, SQL, migrations or feed_config changes.

## Every new/changed case across notch/tie, observer fix, Option E and Tour slot
Observer repair changed only setup/teardown shared by the three stickySafeAreaGate cases below; their assertions and names stayed unchanged. The final Tour slot input repair applies to the named binding case already listed among its 32 new cases. The additional renamed fade case is documented above.

Historical assertion quotes and reasons below are reproduced from the saved implementation reports; those cases were not edited by this repair.

### Notch strip and tie rows: three new cases and all changed existing cases
- is not stuck for a sentinel inside an unrevealed PageLoadGate
- re-measures after reveal and remains unstuck below the 47px notch
- becomes stuck after scrolling the revealed sentinel past the notch

## Every changed existing case (old names and assertions quoted)
Fixture-only updates preserve assertions except where the brief removes the tie field/cap.

### src/test/tourOverviewGate.test.tsx

- **fresh shape draws exactly its flagged shells in page order**
  Why: use the v5 key/event schema; retain the existing non-tie rules.
  Old assertions:
```tsx
expect(shellNames(container)).toEqual(['hero', 'board', 'comingUp', 'news']);
```

- **shape over twelve hours old falls back to hero only**
  Why: use the v5 key/event schema; retain the existing non-tie rules.
  Old assertions:
```tsx
expect(readOverviewShape()).toEqual(EMPTY_OVERVIEW_SHAPE);
```

- **throwing and unreadable storage fall back to hero only**
  Why: use the v5 key/event schema; retain the existing non-tie rules.
  Old assertions:
```tsx
expect(readOverviewShape()).toEqual(EMPTY_OVERVIEW_SHAPE);
expect(readOverviewShape()).toEqual(EMPTY_OVERVIEW_SHAPE);
```

- **writes actual rendered shape once after reveal**
  Why: use the v5 key/event schema; retain the existing non-tie rules.
  Old assertions:
```tsx
expect(spy).not.toHaveBeenCalled();
expect(spy).toHaveBeenCalledTimes(1);
expect(readOverviewShape('pga')).toMatchObject({ boardRows: 1, alsoEvents: [{ tie: false, rows: 0, sitLines: 1 }], comingNext: { lastLines: 1, nameLines: 1 }, rankingsRows: 1, newsLead: true });
expect(spy).toHaveBeenCalledTimes(1);
```

- **stores all five band counts, including rankings, when every band is present**
  Why: use the v5 key/event schema; retain the existing non-tie rules.
  Old assertions:
```tsx
expect(readOverviewShape('all')).toEqual({ ...EMPTY_OVERVIEW_SHAPE, boardRows: 1, alsoEvents: [{ tie: false, rows: 0, sitLines: 1 }], comingNext: { lastLines: 1, nameLines: 1 }, rankingsRows: 1, newsLead: true, at: expect.any(Number) });
```

- **route skeleton and gate fallback use identical stored shells**
  Why: use the v5 key/event schema; retain the existing non-tie rules.
  Old assertions:
```tsx
expect(shellNames(container.querySelector('[data-testid="route"]') as HTMLElement)).toEqual(shellNames(container.querySelector('[data-testid="gate"]') as HTMLElement));
```

### src/test/tourOverviewShellV2.test.tsx

- **round-trips every v4 shape field** → **round-trips every v5 shape field**
  Why: use the v5 key/event schema; retain the existing non-tie rules.
  Old assertions:
```tsx
expect(readOverviewShape('pga')).toEqual({ ...full, at: expect.any(Number) });
```

- **rejects malformed storage**
  Why: use the v5 key/event schema; retain the existing non-tie rules.
  Old assertions:
```tsx
expect(readOverviewShape()).toEqual(EMPTY_OVERVIEW_SHAPE);
```

- **ignores v1, v2 and v3 and preserves their keys** → **ignores v1, v2, v3 and v4 and preserves their keys**
  Why: use the v5 key/event schema; retain the existing non-tie rules.
  Old assertions:
```tsx
expect(readOverviewShape()).toEqual(EMPTY_OVERVIEW_SHAPE);
expect(readOverviewShape()).toEqual(EMPTY_OVERVIEW_SHAPE);
expect(readOverviewShape()).toEqual(EMPTY_OVERVIEW_SHAPE);
expect(localStorage.getItem('tour-overview-shape:v3:all')).toBe(old);
expect(localStorage.getItem('tour-overview-shape:all')).toBe(old);
expect(localStorage.getItem('tour-overview-shape:v2:all')).toBe(old);
```

- **records mounted marker counts and measured per-item arrays**
  Why: use the v5 key/event schema; retain the existing non-tie rules.
  Old assertions:
```tsx
expect(readOverviewShape()).toEqual({ ...full, at: expect.any(Number) });
```

- **rejects every malformed per-item array**
  Why: use the v5 key/event schema; retain the existing non-tie rules.
  Old assertions:
```tsx
expect(readOverviewShape('all', 1000), `${key}: ${JSON.stringify(value)}`).toEqual(EMPTY_OVERVIEW_SHAPE);
```

- **renders the supplied tie, player and situation parts** → **renders supplied player and situation parts without a tie cap**
  Why: remove the authorised cap/tie assertion and verify the new shared form.
  Old assertions:
```tsx
expect(events.map(node => node.querySelectorAll('[data-shell-tie-row]').length)).toEqual([1, 1, 0]);
expect(events.map(node => node.querySelectorAll('[data-shell-board-row]').length)).toEqual([4, 3, 3]);
expect(events.map(node => node.querySelectorAll('.also-sit [data-shell-bar]').length)).toEqual([2, 1, 1]);
```

- **rejects malformed v4 picks and Coming next objects** → **rejects malformed v5 picks and Coming next objects**
  Why: use the v5 key/event schema; retain the existing non-tie rules.
  Old assertions:
```tsx
expect(readOverviewShape('all', 1000)).toEqual(EMPTY_OVERVIEW_SHAPE);
expect(readOverviewShape('all', 1000)).toEqual(EMPTY_OVERVIEW_SHAPE);
```

### src/test/tourOverviewDesignA.test.ts

- **(c) the tie cap renders once over a tied top group whose rows carry no position; absent when the top is not tied** → **(c) top ties show T1 on the first player and screen-reader positions on later players without a cap**
  Why: remove the authorised cap/tie assertion and verify the new shared form.
  Old assertions:
```tsx
expect(caps.length).toBe(1);
expect(caps[0].textContent).toBe('T1Three tied');
expect(group.querySelectorAll('[data-hero-tie="capped"]').length).toBe(3);
expect(cell.querySelector(':not(.sr-only):not([data-hero-tie-bracket])')).toBeNull();
expect(solo.container.querySelector('[data-hero-tie-cap]')).toBeNull();
expect(solo.container.querySelector('[data-hero-tie-group]')).toBeNull();
```


### Top fade Option E: 34 new cases
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


### Tour slot: 32 new cases
1. is Preview before the pick lock
2. stays Preview after lock with fewer than three positioned rows
3. counts positioned rows only when deciding the three-row threshold
4. is Live with three positioned leaderboard rows
5. requires published predictions for Preview
6. holds a closed result through Tuesday 23:59 London
7. removes a result at Wednesday midnight London
8. uses London midnight during British summer time
9. accepts both closed and complete results
10. excludes LIV from every state
11. orders the selected tour first then fixed tours and Live Result Preview
12. ignores all and major as tour priorities
13. rotates the cursor once per call and wraps modulo eligible length
14. falls back to zero when cursor reads throw
15. falls back to zero when cursor writes throw
16. formats ties and ordinals including teen exceptions
17. keeps the cut score for MC and removes the score for WD
18. names a sole chaser and a shot
19. names two chasers and two shots
20. counts three or more chasers and spells gap words
21. omits the chaser sentence for a shared lead
22. reads the same best-pick record figures as the Tour picks block
23. formats the best-of-three result line
24. formats the picked-winner result line
25. strips sponsorship clauses but preserves Championship
26. places the slot only before index twelve with more than twelve posts
27. renders nothing without an eligible tournament
28. binds actions and liked-by to the returned persistent post id
29. hides actions and comment doors when no post id is returned
30. selects the tournament tour and navigates when the body is tapped
31. does not navigate when the action or comment row is tapped
32. shows the first top tie marker only and keeps pick positions in ink



## Verification limits
This request verified the full test suite. No browser screenshots, authenticated member flow or real like/comment writes were performed; Ben's 390/320 visual comparisons remain pending. Production code unchanged by these test repairs.

## git diff --stat
Staged repair before appending this statistics section:
```text
 .lovable/reports/combined-tour-final-tests.md | 263 ++++++++++++++++++++++++++
 roadmap.md                                    |  27 +--
 src/test/tourOverviewBand.test.tsx            |   5 +-
 src/test/tourSlot.test.tsx                    |   2 +-
 4 files changed, 273 insertions(+), 24 deletions(-)
```
Combined builds: `git diff 6e4668405c^ --stat`, before appending this section:
```text
 .lovable/reports/clubhouse-tour-slot-stop.md       |  94 +++++++
 .lovable/reports/combined-tour-final-tests.md      | 263 +++++++++++++++++++
 .lovable/reports/combined-tour-observer-repair.md  | 284 +++++++++++++++++++++
 .lovable/reports/notch-strip-top-tie-stop.md       | 160 ++++++++++++
 .lovable/reports/top-fade-option-e.md              |  92 +++++++
 roadmap.md                                         |   6 +
 src/components/chrome/StickySafeAreaScrim.tsx      |  14 +-
 src/components/feed/FeedCard.tsx                   | 103 +-------
 src/components/feed/FeedPostControls.tsx           |  54 ++++
 src/features/chrome-v2/ChromeIsland.tsx            |   7 +
 src/features/clubhouse-tour/TourSlot.tsx           | 179 +++++++++++++
 src/features/clubhouse-tour/tourSlotRules.ts       | 102 ++++++++
 src/features/clubhouse-tour/useTourSlotData.ts     | 102 ++++++++
 src/features/tourhub/_shared/eventName.ts          |   4 +
 .../components/overview-v3/overviewShells.tsx      |  12 +-
 .../tourhub/leaderboard/LeaderboardTab.tsx         |   3 +-
 .../tournament-v2/sections/HeroBoardRows.tsx       |  32 +--
 src/pages/Clubhouse.tsx                            |   7 +
 src/test/gi1GuestIslandReducedMotion.test.tsx      |  16 ++
 src/test/islandSoftFade.test.tsx                   |  93 +++++++
 src/test/stickySafeAreaGate.test.tsx               |  53 ++++
 src/test/tourOverviewBand.test.tsx                 |   5 +-
 src/test/tourOverviewDesignA.test.ts               |  21 +-
 src/test/tourOverviewGate.test.tsx                 |  12 +-
 src/test/tourOverviewShellV2.test.tsx              |  26 +-
 src/test/tourSlot.test.tsx                         |  92 +++++++
 26 files changed, 1682 insertions(+), 154 deletions(-)
```
Statistics include reports and roadmap; appending this section grows only this report. Latest preview signal: build OK at 2026-11-13T17:32:27Z.
