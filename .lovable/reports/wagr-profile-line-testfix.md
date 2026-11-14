# WAGR profile line — authorised testfix

## Result
Focused **54/54 passed**. All four app shards passed: **8,727/8,727**, zero failures.
No source changes, SQL, migrations or feed_config changes.

## Files and exact diff
- `src/test/wagrProfileLine.test.tsx`: import QueryClient/QueryClientProvider; wrap only `does not add ranking to the example mode` in the provider inside its existing MemoryRouter.
- `roadmap.md`: mark the test stop resolved, retaining outstanding visual checks.
- This report.

```diff
 import { MemoryRouter, useSearchParams, useLocation } from 'react-router-dom';
+import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
-  it('does not add ranking to the example mode', () => { render(<MemoryRouter><HeroConnectExample t={t} /></MemoryRouter>); expect(line()).toBeNull(); expect(document.querySelectorAll('[data-example-form-tile]')).toHaveLength(5); });
+  it('does not add ranking to the example mode', () => { render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><HeroConnectExample t={t} /></QueryClientProvider></MemoryRouter>); expect(line()).toBeNull(); expect(document.querySelectorAll('[data-example-form-tile]')).toHaveLength(5); });
```

The authorised setup-only rewrite keeps both assertions unchanged: `expect(line()).toBeNull()` and `expect(document.querySelectorAll('[data-example-form-tile]')).toHaveLength(5)`. The fresh query client supplies the provider required by useDeclineHandicapChip; query retries are disabled. No other case or assertion changed; no test deleted or renamed.

## Commands and totals
Focused command reproduced from the stop report:
```text
bunx vitest run src/test/wagrProfileLine.test.tsx src/test/wagrProfileLinePage.test.tsx src/test/heroConnectPanel.test.tsx src/test/heroConnectExample.test.tsx src/test/proVerification2Hero.test.tsx src/test/linkedHandicapProfile.test.tsx src/test/profileBioFull.test.tsx src/test/removeBadges1.test.tsx --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-profile-line/focused.json
```
Each shard ran in its own command using `bunx vitest run --shard=N/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-profile-line/shard-N.json` for N=1,2,3,4.

| Check | Executed | Passed | Failed |
| --- | ---: | ---: | ---: |
| Focused | 54 | 54 | 0 |
| Shard 1 | 2,203 | 2,203 | 0 |
| Shard 2 | 2,110 | 2,110 | 0 |
| Shard 3 | 2,196 | 2,196 | 0 |
| Shard 4 | 2,218 | 2,218 | 0 |
| Full suite | 8,727 | 8,727 | 0 |

Before/after testfix inventory: **8,727 → 8,727 (delta 0)**. Last full passing baseline was 8,714; the +13 comprises the previously added 12 cases in wagrProfileLine.test.tsx and one in wagrProfileLinePage.test.tsx, not this fix. Previous focused result 53/54 is now 54/54.

390/320 visual comparison and real-member authenticated checks remain unverified; this test-only brief makes no visual parity claim.