# Post flow — completed-edit stop

## Approved test-isolation follow-up — 1 November, 18:31 UTC
The cached-count stop is cleared. Added `resetCourseCatalogueCountForTests()` in `useCourseCatalogueCount.ts` to reset `countRead` only when explicitly called by tests; `postFlowScreens.test.tsx` calls it in `beforeEach`. The application's session cache and both search fields remain unchanged. No other component change.

**Focused command:** `bunx vitest run src/test/postFlowScreens.test.tsx --maxWorkers=2 --reporter=json --outputFile=/tmp/post-flow-isolation/screens.json` — **21/21 passed**.

**Full-suite commands**, each with `--maxWorkers=2 --reporter=json`:
- `bunx vitest run --shard=1/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/post-flow-isolation/shard1.json` — **1,333/1,333**, 130 files.
- `bunx vitest run --shard=2/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/post-flow-isolation/shard2.json` — **1,299/1,299**, 130 files.
- `bunx vitest run --shard=3/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/post-flow-isolation/shard3.json` — **1,397/1,397**, 130 files.
- `bunx vitest run --shard=4/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/post-flow-isolation/shard4.json` — **1,401/1,401**, 129 files.

**Total: 5,430/5,430 across 519 files; zero failed or skipped tests.** Before this follow-up: expected 5,430/519, not previously verified; after: verified 5,430/519, **no inventory change**. Against last full green 5,380/516, **+50 tests/+3 files**, reconciled entirely by `src/test/postFlowRules.test.ts` (28), `src/test/postFlowScreens.test.tsx` (21), and `src/test/postFlowNoMember.test.tsx` (1); all now pass.

No test deleted, renamed or rewritten. Only the approved import and setup call changed in the screen test file. AST comparison against the saved pre-edit file verifies all **33 assertion statements** byte-identical, including the named case `both search fields share exactly one head-only rounded catalogue read` and its assertion `expect(h.reads.filter(r=>r.ops.some((o:any)=>o[0]==='select'&&o[2]?.head))).toHaveLength(1);`. Reason: isolate each test's recorded reads while retaining the one-read shared-cache requirement.

Automatic preview signal: **2026-11-01T18:31:41Z — build OK**. No manual build/typecheck or protected changes. This follow-up verifies test isolation and the full suite; it does not supply the outstanding real member-post/scheduled-post or Median-device evidence recorded below. Earlier stops below are historical and superseded by these passing results.

## Approved null-guard follow-up — 1 November, 18:29 UTC
Applied Ben's exact return guard in `usePostCourseGroups.ts:52`, guarding both state objects before reading `.rows`. Existing member-read effect already returns without a userId. No other component changed in this follow-up.

Both original tests and every assertion in `postFlowScreens.test.tsx` remain byte-identical, verified with `sha256sum -c /tmp/post-flow-guard/screens-before.sha256` → `src/test/postFlowScreens.test.tsx: OK`.

Command: `bunx vitest run src/test/postFlowScreens.test.tsx -t 'single selection commits and closes on tap|both search fields share exactly one head-only rounded catalogue read' --maxWorkers=2 --reporter=json --outputFile=/tmp/post-flow-guard/two-cases.json`

**Two cases executed: 1 passed, 1 failed; 19 other cases skipped by the filter.** The null crash no longer occurs; single-select commit/close passes. The second case now reaches its unchanged count assertion and fails:
```
AssertionError: expected [] to have a length of 1 but got +0
    at /dev-server/src/test/postFlowScreens.test.tsx:27:511
```
Case: `course sheet and photo flows both search fields share exactly one head-only rounded catalogue read`.

The catalogue read is session-cached while this test file resets `h.reads=[]` before every case. The preceding single-select case initiates the one cached count; the later assertion expects another recorded read after the recorder reset. No cache or test change was made after this unexpected failure. Per the stop rule, the focused follow-on command and full shards did not run. No all-pass claim.

Added `src/test/postFlowNoMember.test.tsx`, one rule case asserting empty groups and no reads for undefined/null member IDs; it has **not run** because the two-case command failed first. No existing test deleted, renamed or rewritten in this follow-up. Inventory before follow-up: expected **5,429/518** (unverified full inventory); after: expected **5,430/519**, +1/+1 solely this named rule test. Last full green stays **5,380/516**; cumulative +50/+3 = rules28, screens21, no-member1. Full-suite totals remain unverified.

Automatic preview signal: **2026-11-01T18:29:17Z — build OK**. No manual build/typecheck. Remaining blocker: authorisation to resolve the cached-read/test-recorder mismatch without violating the one-read requirement, then rerun focused/full shards. Existing real-device/member proof limitations below remain unchanged.

## Status
Implemented course tagging/photo fallback, shared live catalogue count, Schedule, posting progress, Posted/Scheduled actions and confirmed tag-result handoffs. Not complete or release-verified.

Ben authorised StageComposer handoffs and result reporting in postWith.ts, shotTagWrites.ts and postUploadController.ts. No SQL, migration, feed_config, round_pool_cap, edge, native or Median changes. Existing upload writes/finalisation and failed-upload presentation remain unchanged.

## Exact failing signal
Command: `bunx vitest run src/test/postFlowRules.test.ts src/test/postFlowScreens.test.tsx src/test/reviewCourseSearch.test.tsx src/test/postPageGolf.test.tsx src/test/postPageFollowup.test.tsx src/features/post-v2/__tests__ --maxWorkers=2 --reporter=json --outputFile=/tmp/post-flow/focused.json`

Executed **100 tests: 98 passed, 2 failed**, across 7 files. Existing 51 cases passed; new rules 28/28 and screens 19/21.

Both failures are in `src/test/postFlowScreens.test.tsx`:
- `course sheet and photo flows single selection commits and closes on tap`
- `course sheet and photo flows both search fields share exactly one head-only rounded catalogue read`

Tool's exact error:
```
TypeError: Cannot read properties of null (reading 'rows')
    at Module.usePostCourseGroups (/dev-server/src/features/post-v2/hooks/usePostCourseGroups.ts:52:47)
    at CourseTagSheet (/dev-server/src/features/post-v2/components/CourseTagSheet.tsx:24:69)
```

The completed source line is `return { member:member?.key===userId?member.rows:[], club:clubKey && club?.key===clubKey?club.rows:[] };`. When both optional key and userId are undefined the equality succeeds with member null. No fix, assertion edit or rerun was made after the failure; await Ben's authorisation.

## Inventory and assertion accounting
Last full green baseline: **5,380/5,380 across 516 files**. Added `postFlowRules.test.ts` **28** cases and `postFlowScreens.test.tsx` **21** cases: expected full inventory **5,429 across 518 files** (+49/+2), **not verified by full shards**. Full suite not run after the focused stop.

No test removed or renamed. One existing assertion rewritten under the brief's explicit search widening:
- `src/test/reviewCourseSearch.test.tsx`, `Post or review opens the new sheet; CourseTagSheet loses only the review branch`, line 267.
- Old: `expect(tag).toContain(".ilike('name', \`%${q.trim()}%\`)");`
- New: `expect(tag).toContain(".or(\`name.ilike.%${escaped}%,sub_country.ilike.%${escaped}%\`).limit(50)");`
- Why: brief widens name-only search to name/county and fetches 50; all other assertions retained. File remains 20 cases, all passed.

## Current preview signal
Automatic build log newest entry **2026-11-01T18:23:52Z: build OK**. Intermediate handoff/early-variable errors were finished and cleared before testing. No manual build/typecheck ran.

## Proof and remaining checks
Opened the uploaded HTML at 390×844; seven reference frames captured in `/tmp/browser/post-flow/mock-1.png` through `mock-7.png`. Public app `/` rendered without page errors. Member post entry is not available to this sandbox session (`external_unmanaged`); no sign-in workaround or credentials requested. No live post published, no scheduled post created, and no successful UI/readback or parity claim. Reference captures are not app comparisons.

Unfinished: fix the null guard under authorisation, complete remaining stage/fact/countdown/data-error assertions, validate pixel geometry, run all full shards, and capture reachable side-by-side app comparisons. Real Posted/Scheduled screenshots and Median iOS native time wheel require Ben's phone/session. Club-business link code reports missing/no-course links, but no authenticated club link was verified.

## Ownership
`postFlowRules.ts` owns display ranking/time rules, hooks own scoped catalogue/photo/course/hour reads, `PostFlowChrome` and `post-flow.css` opt into changed surfaces; tokens are defined in global CSS. Shared sheet and review defaults remain unchanged. All new typography uses the existing system stack; no Geist load or negative tracking was added.