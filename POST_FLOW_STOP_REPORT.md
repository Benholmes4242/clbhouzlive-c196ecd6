# Post flow — completed-edit stop

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