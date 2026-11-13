# Notch strip and top tie rows — stopped report

## Result
Production edits are saved but verification is blocked. The shared hook checks for a layout box and re-measures via ResizeObserver; shared rows no longer render the top cap/group. The photo caption and heroTopTieLength helper are untouched. Skeleton storage is v5 and event tie fields/rows are removed. Gates, registry, SQL, migrations and feed_config are untouched.

## Test totals
Last full-suite baseline: **8,458 passed**. Inventory delta: **+3** new cases in stickySafeAreaGate.test.tsx; expected inventory **8,461**. No cases deleted; two existing cases renamed for v5, one older-key case renamed, one malformed-object case renamed, and two tie cases renamed. No full-suite result is claimed.

Command: `bunx vitest run src/test/stickySafeAreaGate.test.tsx src/test/tourOverviewDesignA.test.ts src/test/tourOverviewShellV2.test.tsx src/test/tourOverviewGate.test.tsx --maxWorkers=2`
Focused: **100 executed, 97 passed, 3 failed**. Shards **1/4, 2/4, 3/4, 4/4: not run**, per stop rule.

## Exact stop
`src/test/stickySafeAreaGate.test.tsx:18:6`
```text
TypeError: Cannot redefine property: ResizeObserver
```
All three new cases fail at the observer setup. Existing setup declares this property non-configurable. No repair attempted after the failure.
Preview: `build OK` at 2026-11-13T16:13:09Z. Cold-load browser flow remains unverified.

## Every new case
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

## Git diff --stat
```text
roadmap.md                                         |  6 ++++
 src/components/chrome/StickySafeAreaScrim.tsx      | 14 ++++++++--
 .../components/overview-v3/overviewShells.tsx      | 12 ++++----
 .../tournament-v2/sections/HeroBoardRows.tsx       | 32 ++++++----------------
 src/test/tourOverviewDesignA.test.ts               | 21 +++++++-------
 src/test/tourOverviewGate.test.tsx                 | 12 ++++----
 src/test/tourOverviewShellV2.test.tsx              | 26 +++++++++---------
 7 files changed, 61 insertions(+), 62 deletions(-)
```
The stat above excludes untracked files until staged: three-case stickySafeAreaGate.test.tsx and this report.
