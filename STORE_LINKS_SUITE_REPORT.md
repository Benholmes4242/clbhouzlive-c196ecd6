# Store-links full-suite closeout

The requested store-link assertions and one HTTPS/insecure business URL case were already applied in WEB_HOMEPAGE_1B. Confirmed their exact contents; no duplicate test was added and `storeLinks.ts` was not changed.

## Four separate commands, run sequentially

| Command | Tests passed | Files passed | Failures |
| --- | ---: | ---: | ---: |
| `npx vitest run --maxWorkers=2 --shard=1/4` | 2,133 | 183 | 0 |
| `npx vitest run --maxWorkers=2 --shard=2/4` | 1,958 | 183 | 0 |
| `npx vitest run --maxWorkers=2 --shard=3/4` | 2,111 | 183 | 0 |
| `npx vitest run --maxWorkers=2 --shard=4/4` | 2,004 | 181 | 0 |
| **Full suite** | **8,206** | **730** | **0** |

Total matches the last expected inventory exactly. Before and after this turn: 8,206 cases; no test was added, deleted, renamed or rewritten this turn. Against the last fully verified baseline: 8,173 + 23 original `webHome1.test.tsx` cases + 8 `golfTravelCategory.test.ts` cases + 1 business URL case in `storeLinks.test.ts` + 1 integer-rating case in `webHome1.test.tsx` = 8,206.

Store-links tests: 6/6 passed in shard two. The previously reported `guestStage24.test.tsx:85` failure did not recur. The historical `tourIsland.test.tsx:235` failure did not appear. No repairs were made to either test or their production paths.

The authorised assertion changes were made in the previous turn, not repeated here:
- In “parses string and { url } values and drops a non-https value”, `toEqual(links)` became `toEqual({ ...links, business: null })`.
- The second expected object became `{ appStore: null, play: 'https://play.google.com/x', business: null }`.
- One new case verifies `https://clbhouz.co.uk/business` is returned as business and `http://insecure.example` is returned as null.

Picker screenshot skipped as requested; no sign-in, guest/native configuration, SQL, migrations, deployed functions, feed_config or round_pool_cap changes.

Files changed this turn: `roadmap.md`, `STORE_LINKS_SUITE_REPORT.md` only.

Execution logs: `/tmp/store-links-rerun-shard-1.log` through `/tmp/store-links-rerun-shard-4.log`.