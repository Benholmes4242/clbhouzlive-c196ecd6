# Featured round corrections

- FeedCard's inline featured round now explicitly uses `courseDetail.featured.featuredPill` in the courses namespace, matching ExploreMagazine. HomeRail and ConnectedFeaturedRoundCard remain unchanged and retain “Round of the week”.
- FeaturedRoundCard's date text uses `A.MUTE`, not `A.SOFT`. Added the requested hairline-not-text comment.
- Repository audit: `rg -n 'color:\s*A\.SOFT'` found only the corrected FeaturedRoundCard date line before editing. No other hits; no other colour uses changed.

## Tests

No existing test was deleted, renamed, rewritten or repaired.
Added `src/test/featuredRoundCorrections.test.tsx` with three guards:

1. `course_record feed hero labels itself Featured, never Round of the week` — verifies the actual course-record decision and rendered label.
2. `HomeRail week pick still labels itself Round of the week` — renders HomeRail through the real ConnectedFeaturedRoundCard.
3. `date text uses A.MUTE, never the A.SOFT hairline colour` — checks the first date-line span against both tokens.

The new isolated harness uses a real MemoryRouter and i18next provider with the production English courses translations. Its i18next initialization option was corrected from unsupported `initImmediate` to `initAsync`; no assertions changed.

Focused command: `bunx vitest run src/test/featuredRoundCorrections.test.tsx src/test/featuredRoundChamp.test.tsx src/test/featuredRoundNet.test.tsx src/test/featuredRoundTrigger.test.ts src/test/homeRailEmpty.test.tsx src/test/roundCardFollowCB29.test.tsx --maxWorkers=2` — 34/34 passed.

Each full-suite shard ran as a separate command:

| Command | Passed | Failed |
| --- | ---: | ---: |
| `bunx vitest run --maxWorkers=2 --shard=1/4` | 2,113 | 0 |
| `bunx vitest run --maxWorkers=2 --shard=2/4` | 1,924 | 0 |
| `bunx vitest run --maxWorkers=2 --shard=3/4` | 2,078 | 0 |
| `bunx vitest run --maxWorkers=2 --shard=4/4` | 1,970 | 0 |

Full-suite total: **8,085 executed, 8,085 passed, zero failed**. Last reported baseline **8,082**; delta **+3**, entirely the new guard file above. Per-shard counts redistribute when a new file enters Vitest's shard allocation.

Full output retained at `/tmp/featured-corrections-focused.log` and `/tmp/featured-corrections-shard{1,2,3,4}.log`.
Live signed-in account checks were not performed; integration guards exercise both real card entrypoints with isolated data providers.