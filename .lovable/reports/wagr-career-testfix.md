# WAGR Career — authorised test mock fix

## Scope and exact diff
Only `src/test/wagrRankingTab.test.tsx:27` changed in test/application code. Its mock now resolves the new career table to an empty successful response before the unchanged history/events branch. No source changes, assertion changes, fixture changes, or test deletions, renames or rewrites. Report and roadmap updated separately. No SQL, migrations or feed_config changes.

```diff
--- a/src/test/wagrRankingTab.test.tsx
+++ b/src/test/wagrRankingTab.test.tsx
@@ -27 +27 @@
-    then: (resolve: any) => Promise.resolve({
+    then: (resolve: any) => Promise.resolve(table === 'amateur_career_moments' ? { data: [], error: null } : {
```

Previously failing cases now pass with their assertions unchanged:
- Tab renders Lewy headline, movement, tiles and foot
- Chart draws with two or more rows and labels the ends
- Five events show, then See all expands in place
- Event rows show ordinal finishes, Team and the points dash

## Commands and results
Focused command:
```text
bunx vitest run src/test/wagrCareer.test.tsx src/test/proCollectionRules.test.ts src/test/proCollectionSections.test.tsx src/test/wagrRankingTab.test.tsx --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-career-testfix/focused.json
```
80 executed / 80 passed / 0 failed: Career 16, pro rules 17, pro collection sections 20, Ranking 27.

Each shard ran in its own command, sequentially:
```text
bunx vitest run --shard=1/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-career-testfix/shard-1.json
bunx vitest run --shard=2/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-career-testfix/shard-2.json
bunx vitest run --shard=3/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-career-testfix/shard-3.json
bunx vitest run --shard=4/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-career-testfix/shard-4.json
```

| Shard | Executed | Passed | Failed |
|---|---:|---:|---:|
| 1/4 | 2,224 | 2,224 | 0 |
| 2/4 | 2,083 | 2,083 | 0 |
| 3/4 | 2,187 | 2,187 | 0 |
| 4/4 | 2,213 | 2,213 | 0 |
| **Total** | **8,707** | **8,707** | **0** |

Inventory before and after this fix: 8,707 → 8,707, delta zero. Last passing full-suite baseline was 8,691; the intervening Career build added the 16 named cases in `src/test/wagrCareer.test.tsx`, recorded in wagr-career-stop.md. No existing case was deleted, renamed or rewritten by this fix. The focused 80 are a subset, not additional tests.

Requested earlier 390/320 visual comparison and authenticated Career writes remain unverified; this test-only request does not perform or claim those checks.