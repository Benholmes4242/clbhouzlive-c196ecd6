# Tour slot: placement and shared photo height

## Changes
- Tour slot renders before index 8 only when there are more than 8 posts.
- Pros rail renders before index 10 only when there are more than 10 posts.
- Who to follow at 3/15, creators at 21 and Round of the week after 6 are untouched.
- Photo height imports `HERO_PHOTO_HEIGHT` (350); bottom overlay and all other styles are unchanged.

## Verification
Each shard ran as its own command:

| Command | Passed |
| --- | ---: |
| `bunx vitest run --shard=1/4 --maxWorkers=2` | 2,168 |
| `bunx vitest run --shard=2/4 --maxWorkers=2` | 2,020 |
| `bunx vitest run --shard=3/4 --maxWorkers=2` | 2,173 |
| `bunx vitest run --shard=4/4 --maxWorkers=2` | 2,173 |

Full suite before: 8,534. After: 8,534 passed, zero failures, 749 files. No added or deleted tests; two renamed/updated placement tests. Preview log: `build OK` at 2026-11-13T19:03:32Z. Diff whitespace check passed. Real-member/device rendering was not checked in this request.

## Every changed test

1. `src/test/tourSlot.test.tsx`: renamed `places the slot only before index twelve with more than twelve posts` to `places the slot only before index eight with more than eight posts`.
   - Old assertion: `expect([tourSlotPlacement(12,13),tourSlotPlacement(12,12),tourSlotPlacement(11,20),tourSlotPlacement(13,20)]).toEqual([true,false,false,false]);`
   - New assertion checks `(8,9)` true and `(8,8)`, `(8,7)`, `(7,20)`, `(9,20)`, `(12,20)` false.
   - Why: explicitly authorised move after post 8 and strict more-than-8 threshold.
2. `src/test/kindRails.test.tsx`: renamed `pros sit above post 9 and creators above post 21; slots 1 and 2 unchanged` to `pros sit above post 10 and creators above post 21; slots 1 and 2 unchanged`.
   - Old changed assertion: `expect(kindRailForPostIndex(9, 30)).toBe('pro');`
   - New assertions: `(10,11)` is pro; `(10,10)`, `(10,9)`, `(9,30)` and `(11,30)` are null. All existing sibling assertions remain unchanged.
   - Why: explicitly authorised move after post 10 and strict more-than-10 threshold.

## Git diff --stat

The platform saved the implementation in maintenance checkpoint `4f77da97cf`; it was preserved. Request-scoped implementation statistics (`git diff 4f77da97cf^ 4f77da97cf --stat`):

```text
 roadmap.md                                   | 5 +++++
 src/features/clubhouse-tour/TourSlot.tsx       | 3 ++-
 src/features/clubhouse-tour/tourSlotRules.ts   | 2 +-
 src/features/find-people/railRules.ts          | 4 ++--
 src/test/kindRails.test.tsx                    | 8 ++++++--
 src/test/tourSlot.test.tsx                     | 2 +-
 6 files changed, 17 insertions(+), 7 deletions(-)
```

Final reporting additionally updates the roadmap completion and adds this report. The separate platform checkpoint `47df3adb97` changed generated Supabase types; that unrelated change was not made for this request and is excluded from these statistics. No SQL, migrations, feed configuration or shared hero token changes were made.