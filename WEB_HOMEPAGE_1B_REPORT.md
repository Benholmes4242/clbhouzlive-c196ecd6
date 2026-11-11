# WEB_HOMEPAGE_1B

## Files changed

- `src/lib/storeLinks.test.ts`: authorised `business: null` additions in both expected objects of “parses string and { url } values and drops a non-https value”; one new case verifies HTTPS business URL acceptance and insecure URL rejection. Production storeLinks.ts unchanged.
- `src/pages/gate/home/WebCourseCard.tsx`: rating numbers use `Number(rating_avg).toFixed(1)`; the shared card/featured-phone figure is bold and uses the existing tabular/lining numeral class.
- `src/styles/web-home.css`: rating figure uses `var(--ink)` while the rest of the line remains dim.
- `src/test/webHome1.test.tsx`: one new case verifies rating_avg 9 renders `Rated 9.0 by golfers · 5 ratings` in both card and phone.
- `roadmap.md`: verification status.
- `WEB_HOMEPAGE_1B_REPORT.md`: this report.

No SQL, migrations, deployed functions, guest browsing, review wizard, news, round plots, native/Median config, feed_config or round_pool_cap changes.

## Authorised existing assertion change

File: `src/lib/storeLinks.test.ts`, case “parses string and { url } values and drops a non-https value”.

- `expect(await fetchStoreLinks()).toEqual(links)` → `expect(await fetchStoreLinks()).toEqual({ ...links, business: null })`.
- `expect(await fetchStoreLinks()).toEqual({ appStore: null, play: 'https://play.google.com/x' })` → same expected object plus `business: null`.

Reason: the explicit brief authorises the changed return-shape expectations. No other existing assertion was changed. No test was deleted or renamed. Store-links test count: 5 → 6; homepage test count: 23 → 24.

## Results

Focused command: `npx vitest run src/lib/storeLinks.test.ts src/test/webHome1.test.tsx --maxWorkers=2` — **30 passed**, two files.

Full-suite commands ran separately and sequentially:

| Command | Passed | Failed | Executed |
| --- | ---: | ---: | ---: |
| `npx vitest run --maxWorkers=2 --shard=1/4` | 2,133 | 0 | 2,133 |
| `npx vitest run --maxWorkers=2 --shard=2/4` | 1,958 | 0 | 1,958 |
| `npx vitest run --maxWorkers=2 --shard=3/4` | 2,110 | 1 | 2,111 |
| Shard 4/4 | Not run: stop rule | — | — |

Partial full-suite total: **6,202 executed, 6,201 passed, 1 failed**. Focused results are separate.

Inventory reconciliation: last completely verified baseline **8,173** + prior homepage **23** = **8,196**; intervening Golf Travel test file **8** = before-task **8,204**; this brief adds two cases = expected after **8,206**. Complete suite total remains unverified.

## Stop

```text
FAIL src/test/guestStage24.test.tsx > Stage 2.4 — guests on /auth > after a guest signs in as a member, Auth redirects once
AssertionError: expected [ '/auth' ] to deeply equal [ '/auth', '/' ]

- Expected
+ Received
  [
    "/auth",
-   "/",
  ]

❯ src/test/guestStage24.test.tsx:85:18
85| expect(navs).toEqual(['/auth', '/']);
```

This failure was not named as historical in the brief. The guest source and test were untouched; stopped without repair or rerun. Shard four was not started.

Pre-existing storeLinks failure at line 45 is resolved by the authorised test change and passes focused/full-shard checks. The brief's known historical `src/test/tourIsland.test.tsx:235` failure did not appear in these executed shards; no claim is made about unexecuted shard four.

Ben's production-style homepage visual checks are accepted as supplied: none/invite states at 1280/390/320, no overflow, Danny invite headline and mock parity. No visual rerun was performed or claimed. Latest observed compilation after edits: `build OK` at 2026-11-11T10:44:40Z.